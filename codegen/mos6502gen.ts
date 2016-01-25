declare type generator = (ctx:Ctx) => Ctx;



enum AddressingMode {
    Accumulator,
    Implied,
    Immediate,
    ZeroPage,
    ZeroPageX,
    ZeroPageY,
    Absolute,
    AbsoluteIndirect,
    AbsoluteX,
    AbsoluteY,
    IndirectX,
    IndirectY,
    Relative
}

enum StatementKind{
    ADC,
    AND, EOR,
    ASL, LSR,
    BCC, BCS, BEQ, BMI, BNE, BPL, BVC, BVS,
    BIT,
    CLC, CLI, CLD, CLV,
    SEI,
    CMP, CPX, CPY,
    DEC, DEX, DEY,
    INC, INX, INY,
    JMP,
    LDA, LDX, LDY
}

enum Register {
    A =1,X =2,Y =4
}

enum MemoryAccessPattern {
    Read,
    ReadModifyWrite,
    Write,
    FlgOnly,
    Jmp
}

class Ctx {
    st = '';
    indentLevel = 0;

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

    write(st: string) {
        this.st += st;
    }

    writeLine(st: string) {
        for (let i = 0; i < this.indentLevel; i++)
            this.st += '    ';
        this.st += st + '\n';
    }

    public getOutput() {
        return this.st;
    }
}

class CycleCount {
    pageCross = 0;
    branchTaken = 0;
    jumpToNewPage = 0;

    constructor(public c: number) { }

    withPageCross() {
        this.pageCross = 1;
        return this;
    }

    withBranchTaken() {
        this.branchTaken = 1;
        return this;
    }
    
    maxCycle() {
        return this.c + this.pageCross + this.branchTaken;
    }

    toString() {
        return this.c + (this.pageCross ? 'pc ' : '') + (this.branchTaken ? 'bc ' :'');
    }

   
}

class Statement {
    constructor(
        public opcode: number,
        public statementKind: StatementKind,
        public addressingMode: AddressingMode,
        public size: number,
        public cycleCount: CycleCount) {}

    getCycles(gen: Mos6502Gen): Cycle[] {
        var mcPayload = gen[StatementKind[this.statementKind]]();
        return gen['get' + AddressingMode[this.addressingMode] + 'Cycles'](this, mcPayload);
    }

    get mnemonic() {
        return StatementKind[this.statementKind] + ' ' + AddressingMode[this.addressingMode];
    }

    get regIn() {
        if(this.addressingMode === AddressingMode.Accumulator)
            switch (this.statementKind){
                case StatementKind.DEX:
                case StatementKind.INX:
                case StatementKind.CPX:
                    return Register.X;
                case StatementKind.DEY:
                case StatementKind.INY:
                case StatementKind.CPY:
                    return Register.Y;
                case StatementKind.ASL:
                case StatementKind.LSR:
                    return Register.A;
            }

        throw 'regIn is not implemented for ' + this.mnemonic;
    }

    get regOut() {
        if (this.memoryAccessPattern === MemoryAccessPattern.Read ||
            this.addressingMode === AddressingMode.Accumulator)

            switch (this.statementKind) {
                case StatementKind.INX:
                case StatementKind.LDX:
                case StatementKind.DEX:
                    return Register.X;

                case StatementKind.LDY:
                case StatementKind.DEY:
                case StatementKind.INY:
                    return Register.Y;

                case StatementKind.ADC:
                case StatementKind.AND:
                case StatementKind.BIT:
                case StatementKind.EOR:
                case StatementKind.LDA:
                case StatementKind.ASL:
                case StatementKind.LSR:
                    return Register.A;

                case StatementKind.CMP:
                case StatementKind.CPX:
                case StatementKind.CPY:
                    return null;
            }

        throw('missing output register for ' + this.mnemonic);
    }


    get memoryAccessPattern() {
        switch (this.statementKind) {
            case StatementKind.ADC:
            case StatementKind.AND: case StatementKind.EOR:
            case StatementKind.BCC:
            case StatementKind.BCS:
            case StatementKind.BEQ:
            case StatementKind.BMI:
            case StatementKind.BNE:
            case StatementKind.BPL:
            case StatementKind.BVC:
            case StatementKind.BVS:
            case StatementKind.BIT:
            case StatementKind.CMP: case StatementKind.CPX: case StatementKind.CPY:
            case StatementKind.DEX: case StatementKind.DEY:
            case StatementKind.INX: case StatementKind.INY:
            case StatementKind.LDA: case StatementKind.LDX: case StatementKind.LDY:
                return MemoryAccessPattern.Read;
            case StatementKind.ASL: case StatementKind.LSR:
            case StatementKind.DEC:
            case StatementKind.INC:
                return MemoryAccessPattern.ReadModifyWrite;
            case StatementKind.CLC:
            case StatementKind.CLI:
            case StatementKind.CLD:
            case StatementKind.SEI:
            case StatementKind.CLV:
                return MemoryAccessPattern.FlgOnly;
            case StatementKind.JMP:
                return MemoryAccessPattern.Jmp;
            default:
                throw 'unknown statement kind';
        }
    }
}

class Mc {
    constructor(public st: string) {
        if (st[st.length-1] === ';')
            throw `Unexpected ';' in '${st}'`;
        if (st.indexOf('\n') !== -1)
            throw `Unexpected linebreak in '${st}'`;
    }

    public static lift(mc: string|Mc):Mc {
        if (mc instanceof Mc)
            return mc;
        return new Mc(<string>mc);
    }
    write(ctx: Ctx) {
        ctx.writeLine(this.st + ';');
    }

    then(mc: string | Mc): Mc {
        return new McCons(this, Mc.lift(mc));
    }

    thenNextStatement(): Mc {
        return new McCons(this, new McNextStatement());
    }

    thenMoveRegToB(register: Register) {
        switch (register) {
            case Register.A: return this.then(`this.b = this.rA`);
            case Register.X: return this.then(`this.b = this.rX`);
            case Register.Y: return this.then(`this.b = this.rY`);
            default:
                throw 'unknown register to load from';
        }
    }

    thenMoveBToReg(register:Register): Mc {
        if (!register)
            return this;

        let res:Mc = this; 
        if (register & Register.A) res = res.then(`this.rA = this.b`);
        if (register & Register.X) res = res.then(`this.rX = this.b`);
        if (register & Register.Y) res = res.then(`this.rY = this.b`);

        return res;
    }
}

class McCons extends Mc {
    constructor(private mcA: Mc, private mcB: Mc) {
        super('');
    }

    write(ctx: Ctx) {
        this.mcA.write(ctx);
        this.mcB.write(ctx);
    }
}
class McNextStatement extends Mc{
    constructor() {
        super('this.t = 0');
    }
}

class McNextCycle extends Mc {
    constructor() {
        super('this.t++');
    }
}
class McNop extends Mc {
    constructor() {
        super('');
    }

    write(ctx: Ctx) {
     
    }
}

class McExpr extends Mc {

    constructor(public expr: string) {
        super(expr);
    }

    write(ctx: Ctx) {
        ctx.write(this.expr);
    }

}

//class McBlock extends Mc {
//    rgmc:Mc[];
//    constructor(rgmc: (string|Mc)[]) {
//        super('')
//        this.rgmc = rgmc.map(mc => Mc.lift(mc));
//    }

//    write(ctx: Ctx) {
//        ctx.writeLine('{');
//        ctx.indent();
//        this.rgmc.forEach(mc => mc.write(ctx));
//        ctx.unindent();
//        ctx.writeLine('}');
//    }
//}

class McIf extends Mc {
    public mcTrue:Mc;
    public mcFalse:Mc;
    constructor(public cond: string, mcTrue:string|Mc, mcFalse:string|Mc) {
        super('');
        this.mcTrue = Mc.lift(mcTrue);
        this.mcFalse = Mc.lift(mcFalse);
    }

    write(ctx:Ctx) {
        ctx.writeLine(`if (${this.cond}) {`);
        ctx.indented(() => this.mcTrue.write(ctx));

        if (!(this.mcFalse instanceof McNop)) {
            ctx.writeLine(`} else {`);
            ctx.indented(() => this.mcFalse.write(ctx));
        }
        ctx.writeLine(`}`);
    }
}

class Cycle {

    mc: Mc;
    pcIncremented = 0;
    constructor(public icycle:number, public desc:string) {
        this.mc = new McNop();
    }

    fetchOpcode() {
        return this;
    }

    withDummyPcIncrement() {
        if (this.pcIncremented)
            throw 'PC is already incremented';
        this.pcIncremented++;
        return this;
    }

    thenIncrementPC() {
        this.withDummyPcIncrement();
        this.mc = this.mc.then('this.ip++');
        return this;
    }

    then(mc: string | Mc) {
        this.mc = this.mc.then(mc);
        return this;
    }

    thenMoveBToReg(register?: Register) {
        this.mc = this.mc.thenMoveBToReg(register);
        return this;
    }

    thenIf(o: { cond: string, if: string | Mc, else?: string | Mc }) {
        let cond = o.cond;
        let mcTrue = o.if;
        let mcFalse = o.else;

        if (!(mcTrue instanceof Mc))
            mcTrue = new Mc(<string>mcTrue);
        if (!(mcFalse instanceof Mc))
            mcFalse = mcFalse ? new Mc(<string>mcFalse) : new McNop();

        this.mc = this.mc.then(new McIf(cond, mcTrue, mcFalse));
        return this;
    }

    thenNextCycle() {
        this.mc = this.mc.then(new McNextCycle());
        return this;
    }


    thenNextStatement() {
        this.mc = this.mc.then(new McNextStatement());
        return this;
    }

    thenMoveRegToB(regIn: Register) {
        this.mc = this.mc.thenMoveRegToB(regIn);
        return this;
    }
}


export class Mos6502Gen {

    private getRegAccess(reg) {
        return `this.r${Register[reg].toString()}`;
    }



    private ADC(): Mc {
        return new McNop()
            .then(`const sum = this.rA + this.b + this.flgCarry`)
            .then(`const bothPositive = this.b < 128 && this.rA < 128`)
            .then(`const bothNegative = this.b >= 128 && this.rA >= 128`)
            .then(`this.flgCarry = sum > 255 ? 1 : 0`)
            .then(`this.b = sum % 256`)
            .then(`this.flgNegative = this.b >= 128 ? 1 : 0`)
            .then(`this.flgZero = this.b === 0 ? 1 : 0`)
            .then(`this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0`);
    }

    private BinOp(op: string) {
        return new McNop()
            .then(`this.b ${op}= this.rA`)
            .then(`this.flgZero = !this.b ? 1 : 0`)
            .then(`this.flgNegative = this.b >= 128 ? 1 : 0`);
    }

    private AND(): Mc { return this.BinOp('&'); }
    private EOR(): Mc { return this.BinOp('^'); }

    private CMP(): Mc {
        return new McNop()
            .then(`this.flgCarry = this.rA >= this.b ? 1 : 0`)
            .then(`this.flgZero = this.rA === this.b ? 1 : 0`)
            .then(`this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0`);
    }
    private CPX(): Mc { return this.CMP(); }
    private CPY(): Mc { return this.CMP(); }

    private LD(): Mc {
        return new McNop()
            .then(`this.flgZero = !this.b ? 1 : 0`)
            .then(`this.flgNegative = this.b & 128 ? 1 : 0`);
    }

    private LDA(): Mc { return this.LD(); }
    private LDX(): Mc { return this.LD(); }
    private LDY(): Mc { return this.LD(); }

    private BIT(): Mc {

        return new McNop()
            .then(`this.b = this.rA & this.b`)
            .then(`this.flgZero = !this.b ? 1 : 0`)
            .then(`this.flgNegative = this.b & 128 ? 1 : 0`)
            .then(`this.flgOverflow = this.b & 64 ? 1 : 0`);
    }

    private ASL(): Mc {
        return new McNop()
            .then(`this.flgCarry = this.b & 0x80 ? 1 : 0`)
            .then(`this.b = (this.b << 1) & 0xff`)
            .then(`this.flgZero = !this.b ? 1 : 0`)
            .then(`this.flgNegative = this.b & 0x80 ? 1 : 0`);
    }

    private LSR(): Mc {
        return new McNop()
            .then(`this.flgCarry = this.b & 1`)
            .then(`this.b = (this.b >> 1) & 0xff`)
            .then(`this.flgZero = !this.b ? 1 : 0`)
            .then(`this.flgNegative = this.b & 0x80 ? 1 : 0`);
    }


    private DEC(): Mc {
        return new McNop()
            .then(`this.b = (this.b - 1) & 0xff`)
            .then(`this.flgZero = !this.b ? 1 : 0`)
            .then(`this.flgNegative = this.b & 0x80 ? 1 : 0`);
    }

    private DEX(): Mc { return this.DEC(); }
    private DEY(): Mc{ return this.DEC(); }

    private INC(): Mc {
        return new McNop()
            .then(`this.b = (this.b + 1) & 0xff`)
            .then(`this.flgZero = !this.b ? 1 : 0`)
            .then(`this.flgNegative = this.b & 0x80 ? 1 : 0`);
    }

    private INX(): Mc { return this.INC(); }
    private INY(): Mc { return this.INC(); }

    private BCC() { return new McExpr('!this.flgCarry'); }
    private BCS() { return new McExpr('this.flgCarry'); }
    private BEQ() { return new McExpr('this.flgZero'); }
    private BMI() { return new McExpr('this.flgNegative'); }
    private BNE() { return new McExpr('!this.flgZero'); }
    private BPL() { return new McExpr('!this.flgNegative'); }
    private BVC() { return new McExpr('!this.flgOverflow'); }
    private BVS() { return new McExpr('this.flgOverflow'); }


    private CLC(): Mc { return new Mc(`this.flgCarry = 0`) } 
    private CLD(): Mc { return new Mc(`this.flgDecimalMode = 0`) } 
    private CLI(): Mc { return new Mc(`this.flgInterruptDisable = 0`) } 
    private SEI(): Mc { return new Mc(`this.flgInterruptDisable = 1`) } 
    private CLV(): Mc { return new Mc(`this.flgOverflow = 1`) } 

    private JMP(): Mc { return new McNop(); }

    //http://nesdev.com/6502_cpu.txt

    private getZeroPageCycles(statement:Statement, mc: Mc): Cycle[] {
        switch(statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch address, increment PC')
                        .then(`this.addr = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .then(mc)
                        .thenMoveBToReg(statement.regOut)
                        .thenNextStatement(),
                ];
             
            case MemoryAccessPattern.ReadModifyWrite:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch address, increment PC')
                        .then(`this.addr = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .thenNextCycle(),

                    new Cycle(4, 'write the value back to effective address, and do the operation on it')
                        .then(`this.setByte(this.addr, this.b)`)
                        .then(mc)
                        .thenNextCycle(),

                    new Cycle(5, 'write the new value to effective address')
                        .then(`this.setByte(this.addr, this.b)`)
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    }


    private getZeroPageXYCycles(reg:Register, statement: Statement, mc:Mc): Cycle[] {

        var regAccess = this.getRegAccess(reg);

        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch address, increment PC')
                        .then(`this.addr = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'read from address, add index register to it')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .then(`this.addr = (${regAccess} + this.addr) & 0xff`)
                        .thenNextCycle(),

                    new Cycle(4, 'read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .then(mc)
                        .thenMoveBToReg(statement.regOut)
                        .thenNextStatement()
                ];

            case MemoryAccessPattern.ReadModifyWrite:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch address, increment PC')
                        .then(`this.addr = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'read from address, add index register X/Y to it')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .then(`this.addr = (${regAccess} + this.addr) & 0xff`)
                        .thenNextCycle(),

                    new Cycle(4, 'read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .thenNextCycle(),

                    new Cycle(5, 'write the value back to effective address, and do the operation on it')
                        .then(`this.setByte(this.addr, this.b)`)
                        .then(mc)
                        .thenNextCycle(),

                    new Cycle(6, 'write the new value to effective address')
                        .then(`this.setByte(this.addr, this.b)`)
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    }

    private getZeroPageXCycles(statement: Statement, mc: Mc): Cycle[] {
        return this.getZeroPageXYCycles(Register.X, statement, mc);
    }
    private getZeroPageYCycles(statement: Statement, mc: Mc): Cycle[] {
        return this.getZeroPageXYCycles(Register.Y, statement, mc);
    }


    private getAbsoluteCycles(statement: Statement, mc: Mc): Cycle[] {

        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Jmp:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then(`this.addrLo = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'copy low address byte to PCL, fetch high address byte to PCH')
                        .then(`this.addrHi = this.memory.getByte(this.ip)`)
                        .then(`this.ip = (this.addrHi << 8) + this.addrLo`).withDummyPcIncrement()
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then(`this.addrLo = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'fetch high byte of address, increment PC')
                        .then(`this.addrHi = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(4, 'read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .then(mc)
                        .thenMoveBToReg(statement.regOut)
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.ReadModifyWrite:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then(`this.addrLo = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'fetch high byte of address, increment PC')
                        .then(`this.addrHi = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(4, 'read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .thenNextCycle(),

                    new Cycle(5, 'write the value back to effective address, and do the operation on it')
                        .then(`this.setByte(this.addr, this.b)`)
                        .then(mc)
                        .thenNextCycle(),

                    new Cycle(6, 'write the new value to effective address')
                        .then(`this.setByte(this.addr, this.b)`)
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    }

    private getAbsoluteIndirectCycles(statement: Statement, mc: Mc): Cycle[] {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Jmp:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then(`this.ptrLo = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'copy low address byte to PCL, fetch high address byte to PCH')
                        .then(`this.ptrHi = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),
                    
                    new Cycle(4, 'fetch low address to latch')
                        .then(`this.addrLo = this.memory.getByte( (this.ptrHi << 8) + this.ptrLo )`)
                        .thenNextCycle(),

                    new Cycle(4, 'fetch PCH copy latch to PCL')
                        .then(`this.addrHi = this.memory.getByte( (this.ptrHi << 8) + ((this.ptrLo + 1) & 0xff) )`)
                        .then(`this.ip = (this.addrHi << 8) + this.addrLo`)
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    }

    private getAbsoluteXYCycles(rXY: string, statement: Statement, mc: Mc): Cycle[] {

        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then(`this.addrLo = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'fetch high byte of address, add index register to low address byte, increment PC')
                        .then(`this.addrHi = this.memory.getByte(this.ip)`)
                        .then(`this.addrC = (this.addrLo + this.${rXY}) >> 8`)
                        .then(`this.addrLo = (this.addrLo + this.${rXY}) & 0xff`)
                        .then(`this.addr = this.addrLo + (this.addrHi << 8)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(4, 'read from effective address, fix the high byte of effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .thenIf({
                            cond: `this.addrC`,
                            if: `this.addr = this.addr + (this.addrO << 8)`,
                            else: mc.thenMoveBToReg(statement.regOut).thenNextStatement()
                        })
                        .thenNextCycle(),

                    new Cycle(5, 're-read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .then(mc)
                        .thenMoveBToReg(statement.regOut)
                        .thenNextStatement()
                 
                ];
            case MemoryAccessPattern.ReadModifyWrite:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then(`this.addrLo = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'fetch high byte of address, add index register to low address byte, increment PC')
                        .then(`this.addrHi = this.memory.getByte(this.ip)`)
                        .then(`this.addrC = (this.addrLo + this.${rXY}) >> 8`)
                        .then(`this.addrLo = (this.addrLo + this.${rXY}) & 0xff`)
                        .then(`this.addr = this.addrLo + (this.addrHi << 8)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(4, 'read from effective address, fix the high byte of effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .thenIf({
                            cond: `this.addrC`,
                            if: `this.addr = this.addr + (this.addrO << 8)`
                        })
                        .thenNextCycle(),

                    new Cycle(5, 're-read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .thenNextCycle(),
                    
                    new Cycle(6, 'write the value back to effective address, and do the operation on it')
                        .then(`this.setByte(this.addr, this.b)`)
                        .then(mc)
                        .thenNextCycle(),

                    new Cycle(7, 'write the new value to effective address')
                        .then(`this.setByte(this.addr, this.b)`)
                        .thenNextStatement()

                ];
            default:
                throw 'not implemented';
        }


    }

    private getAbsoluteXCycles(statement: Statement, mc: Mc): Cycle[] {
        return this.getAbsoluteXYCycles('rX', statement, mc);
    }

    private getAbsoluteYCycles(statement: Statement, mc: Mc): Cycle[] {
        return this.getAbsoluteXYCycles('rY', statement, mc);
    }


    private getImmediateCycles(statement: Statement, mc: Mc): Cycle[] {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),

            new Cycle(2, 'fetch value, increment PC')
                .then(`this.b = this.memory.getByte(this.ip)`)
                .thenIncrementPC()
                .then(mc)
                .thenMoveBToReg(statement.regOut)
                .thenNextStatement()
        ];
    }

    private getAccumulatorCycles(statement: Statement, mc: Mc): Cycle[] {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(2, ' read next instruction byte (and throw it away)')
                .then(`this.memory.getByte(this.ip)`)
                .thenMoveRegToB(statement.regIn)
                .then(mc)
                .thenMoveBToReg(statement.regOut)
                .thenNextStatement()
        ];
    }

    private getImpliedCycles(statement: Statement, mc: Mc): Cycle[] {

        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(2, ' read next instruction byte (and throw it away)')
                .then(`this.memory.getByte(this.ip)`)
                .then(mc)
                .thenNextStatement()
        ];
    }

    private getIndirectXCycles(statement: Statement, mc: Mc): Cycle[] {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch pointer address, increment PC')
                        .then(`this.addrPtr = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'read from the address, add X to it')
                        .then(`this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff`)
                        .thenNextCycle(),

                    new Cycle(4, 'fetch effective address low')
                        .then(`this.addrLo = this.memory.getByte(this.addrPtr))`)
                        .then(`this.addr = this.addrLo + (this.addrHi << 8))`)
                        .thenNextCycle(),

                    new Cycle(5, 'fetch effective address high')
                        .then(`this.addrHi = this.memory.getByte((this.addrPtr + 1) 0xff)`)
                        .thenNextCycle(),
                    
                    new Cycle(6, 'read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .then(mc)
                        .thenMoveBToReg(statement.regOut)
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    }

    private getIndirectYCycles(statement: Statement, mc: Mc): Cycle[] {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(2, 'fetch pointer address, increment PC')
                        .then(`this.addrPtr = this.memory.getByte(this.ip)`)
                        .thenIncrementPC()
                        .thenNextCycle(),

                    new Cycle(3, 'fetch effective address low')
                        .then(`this.addrLo = this.memory.getByte(this.addrPtr`)
                        .thenNextCycle(),

                    new Cycle(4, 'fetch effective address high, add Y to low byte of effective address')
                        .then(`this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)`)
                        .then(`this.addrC = (this.addrLo + this.rY) >> 8`)
                        .then(`this.addrLo = (this.addrLo + this.rY) & 0xff`)
                        .then(`this.addr = this.addrLo + (this.addrHi << 8)`)
                        .thenNextCycle(),

                    new Cycle(5, 'read from effective address, fix high byte of effective address')
                        .then(`this.b = this.memory.getByte(this.addr)`)
                        .thenIf({
                            cond: `this.addrC`,
                            if: `this.addr = this.addr + (this.addrO << 8)`,
                            else: mc.thenMoveBToReg(statement.regOut).thenNextStatement()
                        })
                        .thenNextCycle(),

                    new Cycle(6, 'read from effective address')
                        .then(`this.b = this.memory.getByte(this.addr`)
                        .then(mc)
                        .thenMoveBToReg(statement.regOut)
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    }

    private getRelativeCycles(statement: Statement, mc: McExpr): Cycle[] {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),

            new Cycle(2, 'fetch operand, increment PC')
                .then(`this.b = this.memory.getByte(this.ip)`)
                .thenIncrementPC()
                .thenIf({
                    cond: mc.expr,
                    if: new McNextCycle(),
                    else: new McNextStatement()
                }),

            new Cycle(3, 'fetch opcode of next instruction, if branch is taken add operand to pc')
                .then(`this.memory.getByte(this.ip)`)
                .then(`this.b = this.b >= 128 ? this.b - 256 : this.b`)
                .then(`this.ipC = (this.ip & 0xff) + this.b >> 8`)
                .then(`this.ip += this.b`)
                .thenIf({
                    cond: 'this.ipC',
                    if: new McNextCycle(),
                    else: new McNextStatement()
                }),

            new Cycle(4, 'Fix PCH.')
                .then(`this.ip += this.ipC << 8`)
                .thenNextStatement()
        ];
    }


    //    this.BCC();
    //    return ctx
    //        .add(`this.addrPtr = this.memory.getByte(this.ip);`)
    //        .nextIp()
    //        .endStep()
    //        .add(`this.addrLo = this.memory.getByte(this.addrPtr)`)
    //        .endStep()
    //        .add(`this.addrC = (this.addrLo + this.rY) >> 8;`)
    //        .add(`this.addrLo = (this.addrLo + this.rY) & 0xff;`)
    //        .add(`this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)`)
    //        .add(`this.addr = this.addrLo + (this.addrHi << 8);`)
    //        .endStep()
    //        .add(`this.b = this.memory.getByte(this.addr);`)
    //        .add(`if (this.addrC > 0) { this.addr = this.addr + (this.addrO << 8); this.addrC = 0; ${ctx.rerun()} }`)
    //        ;
    //}



    private genStatement(statement:Statement) {
        var ctx = new Ctx();

        ctx.writeLine(`case 0x${statement.opcode.toString(16)}: /* ${statement.mnemonic} ${statement.cycleCount.toString()} */ {`);

        var rgcycle = statement.getCycles(this);
        ctx.indented(() => {
            ctx.writeLine('switch (this.t) {');
            ctx.indented(() => {
                for (let icycle = 0; icycle < rgcycle.length; icycle++) {
                    var cycle = rgcycle[icycle];

                    ctx.writeLine(`case ${icycle}: {`);
                    ctx.indented(() => {
                        cycle.mc.write(ctx);
                        ctx.writeLine('break;');
                    });
                    ctx.writeLine(`}`);
                }
            });
            ctx.writeLine('}');
        });
        ctx.writeLine('break;');

        var res = ctx.getOutput();
        if (rgcycle.length !== statement.cycleCount.maxCycle()) {
            console.error(`${statement.mnemonic}: cycle count doesn't match. Expected ${statement.cycleCount.maxCycle()}, found ${rgcycle.length}`);
            console.error(res);
        }

        if (rgcycle.map(cycle=> cycle.pcIncremented).reduce((s, pcIncremented) => s + pcIncremented) !== statement.size) {
            console.error(`${statement.mnemonic}: size mismatch. Expected to be ${statement.size} long`);
            console.error(res);
            throw '';
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

            new Statement(0x90, StatementKind.BCC, AddressingMode.Relative, 2, new CycleCount(2).withBranchTaken().withPageCross()),
            new Statement(0xb0, StatementKind.BCS, AddressingMode.Relative, 2, new CycleCount(2).withBranchTaken().withPageCross()),
            new Statement(0xf0, StatementKind.BEQ, AddressingMode.Relative, 2, new CycleCount(2).withBranchTaken().withPageCross()),
            new Statement(0x30, StatementKind.BMI, AddressingMode.Relative, 2, new CycleCount(2).withBranchTaken().withPageCross()),
            new Statement(0xd0, StatementKind.BNE, AddressingMode.Relative, 2, new CycleCount(2).withBranchTaken().withPageCross()),
            new Statement(0x10, StatementKind.BPL, AddressingMode.Relative, 2, new CycleCount(2).withBranchTaken().withPageCross()),
            new Statement(0x50, StatementKind.BVC, AddressingMode.Relative, 2, new CycleCount(2).withBranchTaken().withPageCross()),
            new Statement(0x70, StatementKind.BVS, AddressingMode.Relative, 2, new CycleCount(2).withBranchTaken().withPageCross()),


            new Statement(0x24, StatementKind.BIT, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x2c, StatementKind.BIT, AddressingMode.Absolute, 3, new CycleCount(4)),

            new Statement(0x18, StatementKind.CLC, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0xd8, StatementKind.CLD, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0x58, StatementKind.CLI, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0xb8, StatementKind.CLV, AddressingMode.Implied, 1, new CycleCount(2)),

            new Statement(0xc9, StatementKind.CMP, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0xc5, StatementKind.CMP, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0xd5, StatementKind.CMP, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0xcd, StatementKind.CMP, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0xdd, StatementKind.CMP, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0xd9, StatementKind.CMP, AddressingMode.AbsoluteY, 3, new CycleCount(4).withPageCross()),
            new Statement(0xc1, StatementKind.CMP, AddressingMode.IndirectX, 2, new CycleCount(6)),
            new Statement(0xd1, StatementKind.CMP, AddressingMode.IndirectY, 2, new CycleCount(5).withPageCross()),
            new Statement(0xe0, StatementKind.CPX, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0xe4, StatementKind.CPX, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0xec, StatementKind.CPX, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0xc0, StatementKind.CPY, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0xc4, StatementKind.CPY, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0xcc, StatementKind.CPY, AddressingMode.Absolute, 3, new CycleCount(4)),

            new Statement(0xc6, StatementKind.DEC, AddressingMode.ZeroPage, 2, new CycleCount(5)),
            new Statement(0xd6, StatementKind.DEC, AddressingMode.ZeroPageX, 2, new CycleCount(6)),
            new Statement(0xce, StatementKind.DEC, AddressingMode.Absolute, 3, new CycleCount(6)),
            new Statement(0xde, StatementKind.DEC, AddressingMode.AbsoluteX, 3, new CycleCount(7)),
            new Statement(0xca, StatementKind.DEX, AddressingMode.Accumulator, 1, new CycleCount(2)), 
            new Statement(0x88, StatementKind.DEY, AddressingMode.Accumulator, 1, new CycleCount(2)),

            new Statement(0xe6, StatementKind.INC, AddressingMode.ZeroPage, 2, new CycleCount(5)),
            new Statement(0xf6, StatementKind.INC, AddressingMode.ZeroPageX, 2, new CycleCount(6)),
            new Statement(0xee, StatementKind.INC, AddressingMode.Absolute, 3, new CycleCount(6)),
            new Statement(0xfe, StatementKind.INC, AddressingMode.AbsoluteX, 3, new CycleCount(7)),
            new Statement(0xe8, StatementKind.INX, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0xc8, StatementKind.INY, AddressingMode.Accumulator, 1, new CycleCount(2)),
            
            new Statement(0x49, StatementKind.EOR, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0x45, StatementKind.EOR, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x55, StatementKind.EOR, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x4D, StatementKind.EOR, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0x5D, StatementKind.EOR, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0x59, StatementKind.EOR, AddressingMode.AbsoluteY, 3, new CycleCount(4).withPageCross()),
            new Statement(0x41, StatementKind.EOR, AddressingMode.IndirectX, 2, new CycleCount(6)),
            new Statement(0x51, StatementKind.EOR, AddressingMode.IndirectY, 2, new CycleCount(5).withPageCross()),

            new Statement(0x4c, StatementKind.JMP, AddressingMode.Absolute, 3, new CycleCount(3)),
            new Statement(0x6c, StatementKind.JMP, AddressingMode.AbsoluteIndirect, 3, new CycleCount(5)),

            new Statement(0xa9, StatementKind.LDA, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0xa5, StatementKind.LDA, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0xb5, StatementKind.LDA, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0xad, StatementKind.LDA, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0xbd, StatementKind.LDA, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0xb9, StatementKind.LDA, AddressingMode.AbsoluteY, 3, new CycleCount(4).withPageCross()),
            new Statement(0xa1, StatementKind.LDA, AddressingMode.IndirectX, 2, new CycleCount(6)),
            new Statement(0xb1, StatementKind.LDA, AddressingMode.IndirectY, 2, new CycleCount(5).withPageCross()),

            new Statement(0xa2, StatementKind.LDX, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0xa6, StatementKind.LDX, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0xb6, StatementKind.LDX, AddressingMode.ZeroPageY, 2, new CycleCount(4)),
            new Statement(0xae, StatementKind.LDX, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0xbe, StatementKind.LDX, AddressingMode.AbsoluteY, 3, new CycleCount(4).withPageCross()),

            new Statement(0xa2, StatementKind.LDY, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0xa6, StatementKind.LDY, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0xb6, StatementKind.LDY, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0xae, StatementKind.LDY, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0xbe, StatementKind.LDY, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),

            new Statement(0x4a, StatementKind.LSR, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0x46, StatementKind.LSR, AddressingMode.ZeroPage, 2, new CycleCount(5)),
            new Statement(0x56, StatementKind.LSR, AddressingMode.ZeroPageX, 2, new CycleCount(6)),
            new Statement(0x4e, StatementKind.LSR, AddressingMode.Absolute, 3, new CycleCount(6)),
            new Statement(0x5e, StatementKind.LSR, AddressingMode.AbsoluteX, 3, new CycleCount(7)),

        ];

        var res = '';
        for (let i=0;i<statements.length;i++) {
            res += this.genStatement(statements[i]);
        }

     //   return 'done';
        return res;
    }
}

