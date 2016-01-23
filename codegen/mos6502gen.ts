declare type generator = (ctx:Ctx) => Ctx;

enum AddressingMode {
    Accumulator,
    Immediate,
    ZeroPage,
    ZeroPageX,
    ZeroPageY,
    Absolute,
    AbsoluteX,
    AbsoluteY,
    IndirectX,
    IndirectY
}

enum StatementKind{
    ADC,
    AND,
    ASL
}

enum MemoryAccessKind {
    Read,
    ReadModifyWrite,
    Write
}

class Ctx {
    t: number = 0;
    rerunCalled = 0;
    st = '';
    caseStarted = false;
    indentLevel = 0;
    ipIncremented = 0;
    statement:Statement;

    public indented(body: () => void) {
        this.indentLevel++;
        body();
        this.indentLevel--;
    }

    public indent() {
        this.indentLevel++;
    }

    public unindent() {
        this.indentLevel--;
    }

    writeLine(st: string) {
        for (let i = 0; i < this.indentLevel; i++)
            this.st += '    ';
        this.st += st + '\n';
    }

    public add(st: string): Ctx {
        if (!this.caseStarted)
            this.beginStep();
        this.writeLine(st);
        return this;
    }

    public nextIp(): Ctx {
        if (!this.caseStarted)
            this.beginStep();
        this.writeLine("this.ip++;");
        this.ipIncremented++;
        return this;
    }

    public beginStep(): Ctx {
        if (this.caseStarted)
            throw 'already in case';
        this.writeLine(`case ${this.t}: {`);
        this.caseStarted = true;
        this.indent();
    }

    public rerun() {
        this.rerunCalled++;
        return "break;";
    }

    public endStep(): Ctx {
        if (!this.caseStarted)
            throw 'not in case';
        this.writeLine("this.t++;");
        this.writeLine('break;');
        this.caseStarted = false;
        this.unindent();
        this.writeLine(`}`);
        this.t++;
        return this;
    }

    public getOutput() {
        return this.st;
    }
}

class CycleCount {
    pageCross = 0;
    constructor(public c: number) { }

    withPageCross() {
        this.pageCross = 1;
        return this;
    }
    maxCycle() {
        return this.c + this.pageCross;
    }

    toString() {
        return this.c + (this.pageCross ? '*' : '');
    }
}

class Statement {
    constructor(
        public opcode: number,
        public statementKind: StatementKind,
        public addressingMode: AddressingMode,
        public size: number,
        public cycleCount: CycleCount) {}

    steps(gen: Mos6502Gen): generator[] {
        return [
            gen['getByte'+AddressingMode[this.addressingMode]],
            gen[StatementKind[this.statementKind]]
        ];
    }

    get mnemonic() {
        return StatementKind[this.statementKind] + ' ' + AddressingMode[this.addressingMode];
    }

    get memoryAccessKind() {
        switch (this.statementKind) {
            case StatementKind.ADC:
            case StatementKind.AND:
                return MemoryAccessKind.Read;
            case StatementKind.ASL:
                return MemoryAccessKind.ReadModifyWrite;
            default:
                throw 'unknown statement kind';
        }
    }
}

export class Mos6502Gen {


    private ADC(ctx: Ctx): Ctx {
        return ctx
            .add(`const sum = this.rA + this.b + this.flgCarry;`)
            .add(`const bothPositive = this.b < 128 && this.rA < 128;`)
            .add(`const bothNegative = this.b >= 128 && this.rA >= 128;`)
            .add(`this.flgCarry = sum > 255 ? 1 : 0;`)
            .add(`this.rA = sum % 256;`)
            .add(`this.flgNegative = this.rA >= 128 ? 1 : 0;`)
            .add(`this.flgZero = this.rA === 0 ? 1 : 0;`)
            .add(`this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;`)
            .endStep();
    }

    private AND(ctx: Ctx): Ctx {

        return ctx
            .add(`this.rA &= this.b;`)
            .add(`this.flgZero = !this.rA ? 1 : 0;`)
            .add(`this.flgNegative = this.rA >= 128 ? 1 : 0;`)
            .endStep();
    }



    private ASL(ctx: Ctx): Ctx {
        if (ctx.statement.addressingMode === AddressingMode.Accumulator) {
            return ctx
                .add(`this.rA = this.b << 1;`)
                .add(`this.flgCarry = this.rA > 255 ? 1 : 0;`)
                .add(`this.rA &= 0xff;`)
                .add(`this.flgZero = this.rA === 0 ? 1 : 0;`)
                .add(`this.flgNegative = this.rA & 128 ? 1 : 0;`)
                .endStep()
                ;
        } else {
            return ctx
                .add(`this.setByte(this.addr, b);`) //first write back the value, then do the operation on it
                .add(`this.b = this.b << 1;`)
                .add(`this.flgCarry = this.b > 0xff ? 1 : 0;`)
                .add(`this.b &= 0xff;`)
                .add(`this.flgZero = !this.b ? 1 : 0;`)
                .add(`this.flgNegative = this.b & 0x80 ? 1 : 0;`)
                .endStep()
                .add(`this.setByte(this.addr, b);`) //write the final value in separate step
                .endStep()
                ;
        }
    }

    //http://nesdev.com/6502_cpu.txt

    private getByteImmediate(ctx: Ctx): Ctx {
        return ctx
            .add(`this.b = this.memory.getByte(this.ip);`)
            .nextIp()
            ;
    }

    private getByteAccumulator(ctx: Ctx): Ctx {
        return ctx
            .add(`this.memory.getByte(this.ip); //throw it away`)
            .add(`this.b = this.rA;`)
            ;
    }

    private getByteZeroPage(ctx: Ctx): Ctx {
        switch(ctx.statement.memoryAccessKind) {
            case MemoryAccessKind.Read:
                return ctx
                    .add(`this.addr = this.memory.getByte(this.ip);`)
                    .nextIp()
                    .endStep()
                    .add(`this.b = this.memory.getByte(this.addr);`)
                    ;
            case MemoryAccessKind.ReadModifyWrite:
                return ctx
                    .add(`this.addr = this.memory.getByte(this.ip);`)
                    .nextIp()
                    .endStep()
                    .add(`this.b = this.memory.getByte(this.addr);`)
                    .endStep()
                    ;
        }
    }

    private getByteZeroPageX(ctx: Ctx): Ctx {
        switch (ctx.statement.memoryAccessKind) {
            case MemoryAccessKind.Read:
                return ctx
                    .add(`this.addr = this.memory.getByte(this.ip);`)
                    .nextIp()
                    .endStep()
                    .add(`this.memory.getByte(this.addr); //dummy read`)
                    .add(`this.addr = (this.rX + this.addr) & 0xff;`)
                    .endStep()
                    .add(`this.b = this.memory.getByte(this.addr);`)
                    ;
            case MemoryAccessKind.ReadModifyWrite:
                return ctx
                    .add(`this.addr = this.memory.getByte(this.ip);`)
                    .nextIp()
                    .endStep()
                    .add(`this.memory.getByte(this.addr); //dummy read`)
                    .add(`this.addr = (this.rX + this.addr) & 0xff;`)
                    .endStep()
                    .add(`this.b = this.memory.getByte(this.addr);`)
                    .endStep()
                    ;
        }
    }

    private getByteAbsolute(ctx: Ctx): Ctx {
        switch (ctx.statement.memoryAccessKind) {
            case MemoryAccessKind.Read:
                return ctx
                    .add(`this.addrLo = this.memory.getByte(this.ip);`)
                    .nextIp()
                    .endStep()
                    .add(`this.addrHi = this.memory.getByte(this.ip);`)
                    .add(`this.addr = this.addrLo + (this.addrHi << 8);`)
                    .nextIp()
                    .endStep()
                    .add(`this.b = this.memory.getByte(this.addr);`);
            case MemoryAccessKind.ReadModifyWrite:
                return ctx
                    .add(`this.addrLo = this.memory.getByte(this.ip);`)
                    .nextIp()
                    .endStep()
                    .add(`this.addrHi = this.memory.getByte(this.ip);`)
                    .add(`this.addr = this.addrLo + (this.addrHi << 8);`)
                    .nextIp()
                    .endStep()
                    .add(`this.b = this.memory.getByte(this.addr);`)
                    .endStep()
                    ;
        }
    }


    private getByteIndirectX(ctx: Ctx): Ctx {

        return ctx
            .add(`this.addrPtr = this.memory.getByte(this.ip);`)
            .nextIp()
            .endStep()
            .add(`this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;`)
            .endStep()
            .add(`this.addrLo = this.memory.getByte(this.addrPtr)`)
            .endStep()
            .add(`this.addrHi = this.memory.getByte((this.addrPtr + 1) 0xff)`)
            .add(`this.addr = this.addrLo + (this.addrHi << 8);`)
            .endStep()
            .add(`this.b = this.memory.getByte(this.addr);`)
            ;
    }

    private getByteIndirectY(ctx: Ctx): Ctx {
       
        return ctx
            .add(`this.addrPtr = this.memory.getByte(this.ip);`)
            .nextIp()
            .endStep()
            .add(`this.addrLo = this.memory.getByte(this.addrPtr)`)
            .endStep()
            .add(`this.addrC = (this.addrLo + this.rY) >> 8;`)
            .add(`this.addrLo = (this.addrLo + this.rY) & 0xff;`)
            .add(`this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)`)
            .add(`this.addr = this.addrLo + (this.addrHi << 8);`)
            .endStep()
            .add(`this.b = this.memory.getByte(this.addr);`)
            .add(`if (this.addrC > 0) { this.addr = this.addr + (this.addrO << 8); this.addrC = 0; ${ctx.rerun()} }`)
            ;
    }

    private getByteAbsoluteIndexed(rXY:string, ctx: Ctx): Ctx {
        switch (ctx.statement.memoryAccessKind) {
        case MemoryAccessKind.Read:
            return ctx
                .add(`this.addrLo = this.memory.getByte(this.ip);`)
                .nextIp()
                .endStep()
                .add(`this.addrHi = this.memory.getByte(this.ip);`)
                .add(`this.addrC = (this.addrLo + this.${rXY}) >> 8;`)
                .add(`this.addrLo = (this.addrLo + this.${rXY}) & 0xff;`)
                .add(`this.addr = this.addrLo + (this.addrHi << 8);`)
                .nextIp()
                .endStep()
                .add(`this.b = this.memory.getByte(this.addr);`)
                .add(`if (this.addrC > 0) { this.addr = this.addr + (this.addrO << 8); this.addrC = 0; ${ctx.rerun()} }`);
        case MemoryAccessKind.ReadModifyWrite:
            return ctx
                .add(`this.addrLo = this.memory.getByte(this.ip);`)
                .nextIp()
                .endStep()
                .add(`this.addrHi = this.memory.getByte(this.ip);`)
                .add(`this.addrC = (this.addrLo + this.${rXY}) >> 8;`)
                .add(`this.addrLo = (this.addrLo + this.${rXY}) & 0xff;`)
                .add(`this.addr = this.addrLo + (this.addrHi << 8);`)
                .nextIp()
                .endStep()
                .add(`this.b = this.memory.getByte(this.addr);`)
                .add(`if (this.addrC > 0) { this.addr = this.addr + (this.addrO << 8); this.addrC = 0; }`)
                .endStep()
                .add(`this.b = this.memory.getByte(this.addr);`)
                .endStep()
                ;
        }
    }

    private getByteAbsoluteX(ctx: Ctx): Ctx {
        return this.getByteAbsoluteIndexed('rX', ctx);
    }

    private getByteAbsoluteY(ctx: Ctx): Ctx {
        return this.getByteAbsoluteIndexed('rX', ctx);
    }

    private genStatement(statement:Statement) {
        var ctx = new Ctx();
        ctx.statement = statement;

        ctx.writeLine(`case 0x${statement.opcode.toString(16)}: /* ${statement.mnemonic} ${statement.cycleCount.toString()} */ {`);
        ctx.indented(() => {
            ctx.writeLine('switch (this.t) {');
            ctx.indented(() => {
                ctx.nextIp();
                ctx.endStep();
                var steps = statement.steps(this);
                for (let i = 0; i < steps.length; i++)
                    steps[i].bind(this)(ctx);
            });
            ctx.writeLine('}');
        });
        ctx.writeLine('break;');

        var res = ctx.getOutput();
        if (ctx.t + ctx.rerunCalled !== statement.cycleCount.maxCycle()) {
            console.error(`${statement.mnemonic}: cycle count doesn't match. Expected ${statement.cycleCount.maxCycle()}, found ${ctx.t}`);
            console.error(res);
        }

        if (ctx.ipIncremented !== statement.size) {
            console.error(`${statement.mnemonic}: size mismatch. Expected to be ${statement.size} long, found ${ctx.ipIncremented}`);
            console.error(res);
        }
        return res;
    }
    
    run() {

        var statements = [
            new Statement(0x69, StatementKind.ADC, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0x65, StatementKind.ADC, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x75, StatementKind.ADC, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x6d, StatementKind.ADC, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0x7d, StatementKind.ADC, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0x79, StatementKind.ADC, AddressingMode.AbsoluteY, 3, new CycleCount(4).withPageCross()),
            new Statement(0x61, StatementKind.ADC, AddressingMode.IndirectX, 2, new CycleCount(6)),
            new Statement(0x71, StatementKind.ADC, AddressingMode.IndirectY, 2, new CycleCount(5).withPageCross()),
     
            new Statement(0x29, StatementKind.AND, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0x25, StatementKind.AND, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x35, StatementKind.AND, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x2d, StatementKind.AND, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0x3d, StatementKind.AND, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0x39, StatementKind.AND, AddressingMode.AbsoluteY, 3, new CycleCount(4).withPageCross()),
            new Statement(0x21, StatementKind.AND, AddressingMode.IndirectX, 2, new CycleCount(6)),
            new Statement(0x31, StatementKind.AND, AddressingMode.IndirectY, 2, new CycleCount(5).withPageCross()),

            new Statement(0x0a, StatementKind.ASL, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0x06, StatementKind.ASL, AddressingMode.ZeroPage, 2, new CycleCount(5)),
            new Statement(0x16, StatementKind.ASL, AddressingMode.ZeroPageX, 2, new CycleCount(6)),
            new Statement(0x0e, StatementKind.ASL, AddressingMode.Absolute, 3, new CycleCount(6)),
            new Statement(0x1e, StatementKind.ASL, AddressingMode.AbsoluteX, 3, new CycleCount(7)),

        ];

        var res = '';
        for (let i=0;i<statements.length;i++) {
            res += this.genStatement(statements[i]);
        }

        return 'done';
        return res;
    }
}

