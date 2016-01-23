var AddressingMode;
(function (AddressingMode) {
    AddressingMode[AddressingMode["Accumulator"] = 0] = "Accumulator";
    AddressingMode[AddressingMode["Immediate"] = 1] = "Immediate";
    AddressingMode[AddressingMode["ZeroPage"] = 2] = "ZeroPage";
    AddressingMode[AddressingMode["ZeroPageX"] = 3] = "ZeroPageX";
    AddressingMode[AddressingMode["ZeroPageY"] = 4] = "ZeroPageY";
    AddressingMode[AddressingMode["Absolute"] = 5] = "Absolute";
    AddressingMode[AddressingMode["AbsoluteX"] = 6] = "AbsoluteX";
    AddressingMode[AddressingMode["AbsoluteY"] = 7] = "AbsoluteY";
    AddressingMode[AddressingMode["IndirectX"] = 8] = "IndirectX";
    AddressingMode[AddressingMode["IndirectY"] = 9] = "IndirectY";
})(AddressingMode || (AddressingMode = {}));
var StatementKind;
(function (StatementKind) {
    StatementKind[StatementKind["ADC"] = 0] = "ADC";
    StatementKind[StatementKind["AND"] = 1] = "AND";
    StatementKind[StatementKind["ASL"] = 2] = "ASL";
})(StatementKind || (StatementKind = {}));
var MemoryAccessKind;
(function (MemoryAccessKind) {
    MemoryAccessKind[MemoryAccessKind["Read"] = 0] = "Read";
    MemoryAccessKind[MemoryAccessKind["ReadModifyWrite"] = 1] = "ReadModifyWrite";
    MemoryAccessKind[MemoryAccessKind["Write"] = 2] = "Write";
})(MemoryAccessKind || (MemoryAccessKind = {}));
var Ctx = (function () {
    function Ctx() {
        this.t = 0;
        this.rerunCalled = 0;
        this.st = '';
        this.caseStarted = false;
        this.indentLevel = 0;
        this.ipIncremented = 0;
    }
    Ctx.prototype.indented = function (body) {
        this.indentLevel++;
        body();
        this.indentLevel--;
    };
    Ctx.prototype.indent = function () {
        this.indentLevel++;
    };
    Ctx.prototype.unindent = function () {
        this.indentLevel--;
    };
    Ctx.prototype.writeLine = function (st) {
        for (var i = 0; i < this.indentLevel; i++)
            this.st += '    ';
        this.st += st + '\n';
    };
    Ctx.prototype.add = function (st) {
        if (!this.caseStarted)
            this.beginStep();
        this.writeLine(st);
        return this;
    };
    Ctx.prototype.nextIp = function () {
        if (!this.caseStarted)
            this.beginStep();
        this.writeLine("this.ip++;");
        this.ipIncremented++;
        return this;
    };
    Ctx.prototype.beginStep = function () {
        if (this.caseStarted)
            throw 'already in case';
        this.writeLine("case " + this.t + ": {");
        this.caseStarted = true;
        this.indent();
    };
    Ctx.prototype.rerun = function () {
        this.rerunCalled++;
        return "break;";
    };
    Ctx.prototype.endStep = function () {
        if (!this.caseStarted)
            throw 'not in case';
        this.writeLine("this.t++;");
        this.writeLine('break;');
        this.caseStarted = false;
        this.unindent();
        this.writeLine("}");
        this.t++;
        return this;
    };
    Ctx.prototype.getOutput = function () {
        return this.st;
    };
    return Ctx;
})();
var CycleCount = (function () {
    function CycleCount(c) {
        this.c = c;
        this.pageCross = 0;
    }
    CycleCount.prototype.withPageCross = function () {
        this.pageCross = 1;
        return this;
    };
    CycleCount.prototype.maxCycle = function () {
        return this.c + this.pageCross;
    };
    CycleCount.prototype.toString = function () {
        return this.c + (this.pageCross ? '*' : '');
    };
    return CycleCount;
})();
var Statement = (function () {
    function Statement(opcode, statementKind, addressingMode, size, cycleCount) {
        this.opcode = opcode;
        this.statementKind = statementKind;
        this.addressingMode = addressingMode;
        this.size = size;
        this.cycleCount = cycleCount;
    }
    Statement.prototype.steps = function (gen) {
        return [
            gen['getByte' + AddressingMode[this.addressingMode]],
            gen[StatementKind[this.statementKind]]
        ];
    };
    Object.defineProperty(Statement.prototype, "mnemonic", {
        get: function () {
            return StatementKind[this.statementKind] + ' ' + AddressingMode[this.addressingMode];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Statement.prototype, "memoryAccessKind", {
        get: function () {
            switch (this.statementKind) {
                case StatementKind.ADC:
                case StatementKind.AND:
                    return MemoryAccessKind.Read;
                case StatementKind.ASL:
                    return MemoryAccessKind.ReadModifyWrite;
                default:
                    throw 'unknown statement kind';
            }
        },
        enumerable: true,
        configurable: true
    });
    return Statement;
})();
var Mos6502Gen = (function () {
    function Mos6502Gen() {
    }
    Mos6502Gen.prototype.ADC = function (ctx) {
        return ctx
            .add("const sum = this.rA + this.b + this.flgCarry;")
            .add("const bothPositive = this.b < 128 && this.rA < 128;")
            .add("const bothNegative = this.b >= 128 && this.rA >= 128;")
            .add("this.flgCarry = sum > 255 ? 1 : 0;")
            .add("this.rA = sum % 256;")
            .add("this.flgNegative = this.rA >= 128 ? 1 : 0;")
            .add("this.flgZero = this.rA === 0 ? 1 : 0;")
            .add("this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;")
            .endStep();
    };
    Mos6502Gen.prototype.AND = function (ctx) {
        return ctx
            .add("this.rA &= this.b;")
            .add("this.flgZero = !this.rA ? 1 : 0;")
            .add("this.flgNegative = this.rA >= 128 ? 1 : 0;")
            .endStep();
    };
    Mos6502Gen.prototype.ASL = function (ctx) {
        if (ctx.statement.addressingMode === AddressingMode.Accumulator) {
            return ctx
                .add("this.rA = this.b << 1;")
                .add("this.flgCarry = this.rA > 255 ? 1 : 0;")
                .add("this.rA &= 0xff;")
                .add("this.flgZero = this.rA === 0 ? 1 : 0;")
                .add("this.flgNegative = this.rA & 128 ? 1 : 0;")
                .endStep();
        }
        else {
            return ctx
                .add("this.setByte(this.addr, b);") //first write back the value, then do the operation on it
                .add("this.b = this.b << 1;")
                .add("this.flgCarry = this.b > 0xff ? 1 : 0;")
                .add("this.b &= 0xff;")
                .add("this.flgZero = !this.b ? 1 : 0;")
                .add("this.flgNegative = this.b & 0x80 ? 1 : 0;")
                .endStep()
                .add("this.setByte(this.addr, b);") //write the final value in separate step
                .endStep();
        }
    };
    //http://nesdev.com/6502_cpu.txt
    Mos6502Gen.prototype.getByteImmediate = function (ctx) {
        return ctx
            .add("this.b = this.memory.getByte(this.ip);")
            .nextIp();
    };
    Mos6502Gen.prototype.getByteAccumulator = function (ctx) {
        return ctx
            .add("this.memory.getByte(this.ip); //throw it away")
            .add("this.b = this.rA;");
    };
    Mos6502Gen.prototype.getByteZeroPage = function (ctx) {
        switch (ctx.statement.memoryAccessKind) {
            case MemoryAccessKind.Read:
                return ctx
                    .add("this.addr = this.memory.getByte(this.ip);")
                    .nextIp()
                    .endStep()
                    .add("this.b = this.memory.getByte(this.addr);");
            case MemoryAccessKind.ReadModifyWrite:
                return ctx
                    .add("this.addr = this.memory.getByte(this.ip);")
                    .nextIp()
                    .endStep()
                    .add("this.b = this.memory.getByte(this.addr);")
                    .endStep();
        }
    };
    Mos6502Gen.prototype.getByteZeroPageX = function (ctx) {
        switch (ctx.statement.memoryAccessKind) {
            case MemoryAccessKind.Read:
                return ctx
                    .add("this.addr = this.memory.getByte(this.ip);")
                    .nextIp()
                    .endStep()
                    .add("this.memory.getByte(this.addr); //dummy read")
                    .add("this.addr = (this.rX + this.addr) & 0xff;")
                    .endStep()
                    .add("this.b = this.memory.getByte(this.addr);");
            case MemoryAccessKind.ReadModifyWrite:
                return ctx
                    .add("this.addr = this.memory.getByte(this.ip);")
                    .nextIp()
                    .endStep()
                    .add("this.memory.getByte(this.addr); //dummy read")
                    .add("this.addr = (this.rX + this.addr) & 0xff;")
                    .endStep()
                    .add("this.b = this.memory.getByte(this.addr);")
                    .endStep();
        }
    };
    Mos6502Gen.prototype.getByteAbsolute = function (ctx) {
        switch (ctx.statement.memoryAccessKind) {
            case MemoryAccessKind.Read:
                return ctx
                    .add("this.addrLo = this.memory.getByte(this.ip);")
                    .nextIp()
                    .endStep()
                    .add("this.addrHi = this.memory.getByte(this.ip);")
                    .add("this.addr = this.addrLo + (this.addrHi << 8);")
                    .nextIp()
                    .endStep()
                    .add("this.b = this.memory.getByte(this.addr);");
            case MemoryAccessKind.ReadModifyWrite:
                return ctx
                    .add("this.addrLo = this.memory.getByte(this.ip);")
                    .nextIp()
                    .endStep()
                    .add("this.addrHi = this.memory.getByte(this.ip);")
                    .add("this.addr = this.addrLo + (this.addrHi << 8);")
                    .nextIp()
                    .endStep()
                    .add("this.b = this.memory.getByte(this.addr);")
                    .endStep();
        }
    };
    Mos6502Gen.prototype.getByteIndirectX = function (ctx) {
        return ctx
            .add("this.addrPtr = this.memory.getByte(this.ip);")
            .nextIp()
            .endStep()
            .add("this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;")
            .endStep()
            .add("this.addrLo = this.memory.getByte(this.addrPtr)")
            .endStep()
            .add("this.addrHi = this.memory.getByte((this.addrPtr + 1) 0xff)")
            .add("this.addr = this.addrLo + (this.addrHi << 8);")
            .endStep()
            .add("this.b = this.memory.getByte(this.addr);");
    };
    Mos6502Gen.prototype.getByteIndirectY = function (ctx) {
        return ctx
            .add("this.addrPtr = this.memory.getByte(this.ip);")
            .nextIp()
            .endStep()
            .add("this.addrLo = this.memory.getByte(this.addrPtr)")
            .endStep()
            .add("this.addrC = (this.addrLo + this.rY) >> 8;")
            .add("this.addrLo = (this.addrLo + this.rY) & 0xff;")
            .add("this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)")
            .add("this.addr = this.addrLo + (this.addrHi << 8);")
            .endStep()
            .add("this.b = this.memory.getByte(this.addr);")
            .add("if (this.addrC > 0) { this.addr = this.addr + (this.addrO << 8); this.addrC = 0; " + ctx.rerun() + " }");
    };
    Mos6502Gen.prototype.getByteAbsoluteIndexed = function (rXY, ctx) {
        switch (ctx.statement.memoryAccessKind) {
            case MemoryAccessKind.Read:
                return ctx
                    .add("this.addrLo = this.memory.getByte(this.ip);")
                    .nextIp()
                    .endStep()
                    .add("this.addrHi = this.memory.getByte(this.ip);")
                    .add("this.addrC = (this.addrLo + this." + rXY + ") >> 8;")
                    .add("this.addrLo = (this.addrLo + this." + rXY + ") & 0xff;")
                    .add("this.addr = this.addrLo + (this.addrHi << 8);")
                    .nextIp()
                    .endStep()
                    .add("this.b = this.memory.getByte(this.addr);")
                    .add("if (this.addrC > 0) { this.addr = this.addr + (this.addrO << 8); this.addrC = 0; " + ctx.rerun() + " }");
            case MemoryAccessKind.ReadModifyWrite:
                return ctx
                    .add("this.addrLo = this.memory.getByte(this.ip);")
                    .nextIp()
                    .endStep()
                    .add("this.addrHi = this.memory.getByte(this.ip);")
                    .add("this.addrC = (this.addrLo + this." + rXY + ") >> 8;")
                    .add("this.addrLo = (this.addrLo + this." + rXY + ") & 0xff;")
                    .add("this.addr = this.addrLo + (this.addrHi << 8);")
                    .nextIp()
                    .endStep()
                    .add("this.b = this.memory.getByte(this.addr);")
                    .add("if (this.addrC > 0) { this.addr = this.addr + (this.addrO << 8); this.addrC = 0; }")
                    .endStep()
                    .add("this.b = this.memory.getByte(this.addr);")
                    .endStep();
        }
    };
    Mos6502Gen.prototype.getByteAbsoluteX = function (ctx) {
        return this.getByteAbsoluteIndexed('rX', ctx);
    };
    Mos6502Gen.prototype.getByteAbsoluteY = function (ctx) {
        return this.getByteAbsoluteIndexed('rX', ctx);
    };
    Mos6502Gen.prototype.genStatement = function (statement) {
        var _this = this;
        var ctx = new Ctx();
        ctx.statement = statement;
        ctx.writeLine("case 0x" + statement.opcode.toString(16) + ": /* " + statement.mnemonic + " " + statement.cycleCount.toString() + " */ {");
        ctx.indented(function () {
            ctx.writeLine('switch (this.t) {');
            ctx.indented(function () {
                ctx.nextIp();
                ctx.endStep();
                var steps = statement.steps(_this);
                for (var i = 0; i < steps.length; i++)
                    steps[i].bind(_this)(ctx);
            });
            ctx.writeLine('}');
        });
        ctx.writeLine('break;');
        var res = ctx.getOutput();
        if (ctx.t + ctx.rerunCalled !== statement.cycleCount.maxCycle()) {
            console.error(statement.mnemonic + ": cycle count doesn't match. Expected " + statement.cycleCount.maxCycle() + ", found " + ctx.t);
            console.error(res);
        }
        if (ctx.ipIncremented !== statement.size) {
            console.error(statement.mnemonic + ": size mismatch. Expected to be " + statement.size + " long, found " + ctx.ipIncremented);
            console.error(res);
        }
        return res;
    };
    Mos6502Gen.prototype.run = function () {
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
        for (var i = 0; i < statements.length; i++) {
            res += this.genStatement(statements[i]);
        }
        return 'done';
        return res;
    };
    return Mos6502Gen;
})();
exports.Mos6502Gen = Mos6502Gen;
//# sourceMappingURL=mos6502gen.js.map