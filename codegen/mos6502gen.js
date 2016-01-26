var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AddressingMode;
(function (AddressingMode) {
    AddressingMode[AddressingMode["Accumulator"] = 0] = "Accumulator";
    AddressingMode[AddressingMode["Implied"] = 1] = "Implied";
    AddressingMode[AddressingMode["Immediate"] = 2] = "Immediate";
    AddressingMode[AddressingMode["ZeroPage"] = 3] = "ZeroPage";
    AddressingMode[AddressingMode["ZeroPageX"] = 4] = "ZeroPageX";
    AddressingMode[AddressingMode["ZeroPageY"] = 5] = "ZeroPageY";
    AddressingMode[AddressingMode["Absolute"] = 6] = "Absolute";
    AddressingMode[AddressingMode["AbsoluteIndirect"] = 7] = "AbsoluteIndirect";
    AddressingMode[AddressingMode["AbsoluteX"] = 8] = "AbsoluteX";
    AddressingMode[AddressingMode["AbsoluteY"] = 9] = "AbsoluteY";
    AddressingMode[AddressingMode["IndirectX"] = 10] = "IndirectX";
    AddressingMode[AddressingMode["IndirectY"] = 11] = "IndirectY";
    AddressingMode[AddressingMode["Relative"] = 12] = "Relative";
    AddressingMode[AddressingMode["BRK"] = 13] = "BRK";
    AddressingMode[AddressingMode["RTI"] = 14] = "RTI";
    AddressingMode[AddressingMode["RTS"] = 15] = "RTS";
    AddressingMode[AddressingMode["JSR"] = 16] = "JSR";
})(AddressingMode || (AddressingMode = {}));
var StatementKind;
(function (StatementKind) {
    StatementKind[StatementKind["ADC"] = 0] = "ADC";
    StatementKind[StatementKind["SBC"] = 1] = "SBC";
    StatementKind[StatementKind["AND"] = 2] = "AND";
    StatementKind[StatementKind["EOR"] = 3] = "EOR";
    StatementKind[StatementKind["ORA"] = 4] = "ORA";
    StatementKind[StatementKind["ASL"] = 5] = "ASL";
    StatementKind[StatementKind["LSR"] = 6] = "LSR";
    StatementKind[StatementKind["ROL"] = 7] = "ROL";
    StatementKind[StatementKind["ROR"] = 8] = "ROR";
    StatementKind[StatementKind["BCC"] = 9] = "BCC";
    StatementKind[StatementKind["BCS"] = 10] = "BCS";
    StatementKind[StatementKind["BEQ"] = 11] = "BEQ";
    StatementKind[StatementKind["BMI"] = 12] = "BMI";
    StatementKind[StatementKind["BNE"] = 13] = "BNE";
    StatementKind[StatementKind["BPL"] = 14] = "BPL";
    StatementKind[StatementKind["BVC"] = 15] = "BVC";
    StatementKind[StatementKind["BVS"] = 16] = "BVS";
    StatementKind[StatementKind["BIT"] = 17] = "BIT";
    StatementKind[StatementKind["CLC"] = 18] = "CLC";
    StatementKind[StatementKind["CLI"] = 19] = "CLI";
    StatementKind[StatementKind["CLD"] = 20] = "CLD";
    StatementKind[StatementKind["CLV"] = 21] = "CLV";
    StatementKind[StatementKind["SEI"] = 22] = "SEI";
    StatementKind[StatementKind["SEC"] = 23] = "SEC";
    StatementKind[StatementKind["SED"] = 24] = "SED";
    StatementKind[StatementKind["CMP"] = 25] = "CMP";
    StatementKind[StatementKind["CPX"] = 26] = "CPX";
    StatementKind[StatementKind["CPY"] = 27] = "CPY";
    StatementKind[StatementKind["DEC"] = 28] = "DEC";
    StatementKind[StatementKind["DEX"] = 29] = "DEX";
    StatementKind[StatementKind["DEY"] = 30] = "DEY";
    StatementKind[StatementKind["INC"] = 31] = "INC";
    StatementKind[StatementKind["INX"] = 32] = "INX";
    StatementKind[StatementKind["INY"] = 33] = "INY";
    StatementKind[StatementKind["JMP"] = 34] = "JMP";
    StatementKind[StatementKind["NOP"] = 35] = "NOP";
    StatementKind[StatementKind["LDA"] = 36] = "LDA";
    StatementKind[StatementKind["LDX"] = 37] = "LDX";
    StatementKind[StatementKind["LDY"] = 38] = "LDY";
    StatementKind[StatementKind["PHA"] = 39] = "PHA";
    StatementKind[StatementKind["PHP"] = 40] = "PHP";
    StatementKind[StatementKind["PLA"] = 41] = "PLA";
    StatementKind[StatementKind["PLP"] = 42] = "PLP";
    StatementKind[StatementKind["BRK"] = 43] = "BRK";
    StatementKind[StatementKind["RTI"] = 44] = "RTI";
    StatementKind[StatementKind["STA"] = 45] = "STA";
    StatementKind[StatementKind["STX"] = 46] = "STX";
    StatementKind[StatementKind["STY"] = 47] = "STY";
    StatementKind[StatementKind["SAX"] = 48] = "SAX";
    StatementKind[StatementKind["TAX"] = 49] = "TAX";
    StatementKind[StatementKind["TAY"] = 50] = "TAY";
    StatementKind[StatementKind["TSX"] = 51] = "TSX";
    StatementKind[StatementKind["TXA"] = 52] = "TXA";
    StatementKind[StatementKind["TXS"] = 53] = "TXS";
    StatementKind[StatementKind["TYA"] = 54] = "TYA";
    StatementKind[StatementKind["JSR"] = 55] = "JSR";
    StatementKind[StatementKind["RTS"] = 56] = "RTS";
    StatementKind[StatementKind["DCP"] = 57] = "DCP";
    StatementKind[StatementKind["ISC"] = 58] = "ISC";
})(StatementKind || (StatementKind = {}));
var Register;
(function (Register) {
    Register[Register["A"] = 1] = "A";
    Register[Register["X"] = 2] = "X";
    Register[Register["Y"] = 4] = "Y";
    Register[Register["SP"] = 8] = "SP";
})(Register || (Register = {}));
var MemoryAccessPattern;
(function (MemoryAccessPattern) {
    MemoryAccessPattern[MemoryAccessPattern["Push"] = 0] = "Push";
    MemoryAccessPattern[MemoryAccessPattern["Pop"] = 1] = "Pop";
    MemoryAccessPattern[MemoryAccessPattern["Read"] = 2] = "Read";
    MemoryAccessPattern[MemoryAccessPattern["ReadModifyWrite"] = 3] = "ReadModifyWrite";
    MemoryAccessPattern[MemoryAccessPattern["Write"] = 4] = "Write";
    MemoryAccessPattern[MemoryAccessPattern["Jmp"] = 5] = "Jmp";
})(MemoryAccessPattern || (MemoryAccessPattern = {}));
var Ctx = (function () {
    function Ctx() {
        this.st = '';
        this.indentLevel = 0;
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
    Ctx.prototype.write = function (st) {
        this.st += st;
    };
    Ctx.prototype.writeLine = function (st) {
        for (var i = 0; i < this.indentLevel; i++)
            this.st += '    ';
        this.st += st + '\n';
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
        this.branchTaken = 0;
        this.jumpToNewPage = 0;
    }
    CycleCount.prototype.withPageCross = function () {
        this.pageCross = 1;
        return this;
    };
    CycleCount.prototype.withBranchTaken = function () {
        this.branchTaken = 1;
        return this;
    };
    CycleCount.prototype.maxCycle = function () {
        return this.c + this.pageCross + this.branchTaken;
    };
    CycleCount.prototype.toString = function () {
        return this.c + (this.pageCross ? 'pc ' : '') + (this.branchTaken ? 'bc ' : '');
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
    Statement.prototype.getCycles = function (gen) {
        var mcPayload = gen[StatementKind[this.statementKind]]();
        return gen['get' + AddressingMode[this.addressingMode] + 'Cycles'](this, mcPayload);
    };
    Object.defineProperty(Statement.prototype, "mnemonic", {
        get: function () {
            return StatementKind[this.statementKind] + ' ' + AddressingMode[this.addressingMode];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Statement.prototype, "regIn", {
        get: function () {
            if (this.addressingMode === AddressingMode.Accumulator)
                switch (this.statementKind) {
                    case StatementKind.DEX:
                    case StatementKind.INX:
                    case StatementKind.TXA:
                    case StatementKind.TXS:
                        return Register.X;
                    case StatementKind.DEY:
                    case StatementKind.INY:
                    case StatementKind.TYA:
                        return Register.Y;
                    case StatementKind.ASL:
                    case StatementKind.LSR:
                    case StatementKind.ROL:
                    case StatementKind.ROR:
                    case StatementKind.TAX:
                    case StatementKind.TAY:
                        return Register.A;
                    case StatementKind.TSX:
                        return Register.SP;
                }
            throw 'regIn is not implemented for ' + this.mnemonic;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Statement.prototype, "regOut", {
        get: function () {
            if (this.memoryAccessPattern === MemoryAccessPattern.Read ||
                this.addressingMode === AddressingMode.Accumulator)
                switch (this.statementKind) {
                    case StatementKind.INX:
                    case StatementKind.LDX:
                    case StatementKind.DEX:
                    case StatementKind.TAX:
                    case StatementKind.TSX:
                        return Register.X;
                    case StatementKind.LDY:
                    case StatementKind.DEY:
                    case StatementKind.INY:
                    case StatementKind.TAY:
                        return Register.Y;
                    case StatementKind.ADC:
                    case StatementKind.SBC:
                    case StatementKind.AND:
                    case StatementKind.BIT:
                    case StatementKind.EOR:
                    case StatementKind.ORA:
                    case StatementKind.LDA:
                    case StatementKind.ASL:
                    case StatementKind.LSR:
                    case StatementKind.ROL:
                    case StatementKind.ROR:
                    case StatementKind.TXA:
                    case StatementKind.TYA:
                        return Register.A;
                    case StatementKind.TXS:
                        return Register.SP;
                    case StatementKind.CMP:
                    case StatementKind.CPX:
                    case StatementKind.CPY:
                    case StatementKind.NOP:
                        return null;
                }
            throw ('missing output register for ' + this.mnemonic);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Statement.prototype, "memoryAccessPattern", {
        get: function () {
            switch (this.statementKind) {
                case StatementKind.PHA:
                case StatementKind.PHP:
                    return MemoryAccessPattern.Push;
                case StatementKind.PLA:
                case StatementKind.PLP:
                    return MemoryAccessPattern.Pop;
                case StatementKind.ADC:
                case StatementKind.AND:
                case StatementKind.EOR:
                case StatementKind.ORA:
                case StatementKind.SBC:
                case StatementKind.BCC:
                case StatementKind.BCS:
                case StatementKind.BEQ:
                case StatementKind.BMI:
                case StatementKind.BNE:
                case StatementKind.BPL:
                case StatementKind.BVC:
                case StatementKind.BVS:
                case StatementKind.BIT:
                case StatementKind.CMP:
                case StatementKind.CPX:
                case StatementKind.CPY:
                case StatementKind.DEX:
                case StatementKind.DEY:
                case StatementKind.INX:
                case StatementKind.INY:
                case StatementKind.LDA:
                case StatementKind.LDX:
                case StatementKind.LDY:
                case StatementKind.NOP:
                case StatementKind.CLC:
                case StatementKind.CLI:
                case StatementKind.CLD:
                case StatementKind.SEI:
                case StatementKind.SEC:
                case StatementKind.SED:
                case StatementKind.CLV:
                case StatementKind.TAX:
                case StatementKind.TAY:
                case StatementKind.TSX:
                case StatementKind.TXA:
                case StatementKind.TXS:
                case StatementKind.TYA:
                    return MemoryAccessPattern.Read;
                case StatementKind.ASL:
                case StatementKind.LSR:
                case StatementKind.DEC:
                case StatementKind.INC:
                case StatementKind.ROL:
                case StatementKind.ROR:
                case StatementKind.DCP:
                case StatementKind.ISC:
                    return MemoryAccessPattern.ReadModifyWrite;
                case StatementKind.JMP:
                    return MemoryAccessPattern.Jmp;
                case StatementKind.STX:
                case StatementKind.STA:
                case StatementKind.STY:
                case StatementKind.SAX:
                    return MemoryAccessPattern.Write;
                default:
                    throw 'unknown statement kind';
            }
        },
        enumerable: true,
        configurable: true
    });
    return Statement;
})();
var Mc = (function () {
    function Mc(st) {
        this.st = st;
        if (st[st.length - 1] === ';')
            throw "Unexpected ';' in '" + st + "'";
        if (st.indexOf('\n') !== -1)
            throw "Unexpected linebreak in '" + st + "'";
    }
    Mc.lift = function (mc) {
        if (mc instanceof Mc)
            return mc;
        return new Mc(mc);
    };
    Mc.prototype.write = function (ctx) {
        ctx.writeLine(this.st + ';');
    };
    Mc.prototype.then = function (mc) {
        return new McCons(this, Mc.lift(mc));
    };
    Mc.prototype.thenNextStatement = function () {
        return new McCons(this, new McNextStatement());
    };
    Mc.prototype.thenMoveRegToB = function (register) {
        switch (register) {
            case Register.A: return this.then("this.b = this.rA");
            case Register.X: return this.then("this.b = this.rX");
            case Register.Y: return this.then("this.b = this.rY");
            case Register.SP: return this.then("this.b = this.sp");
            default:
                throw 'unknown register to load from';
        }
    };
    Mc.prototype.thenMoveBToReg = function (register) {
        if (!register)
            return this;
        var res = this;
        if (register & Register.A)
            res = res.then("this.rA = this.b");
        if (register & Register.X)
            res = res.then("this.rX = this.b");
        if (register & Register.Y)
            res = res.then("this.rY = this.b");
        if (register & Register.SP)
            res = res.then("this.sp = this.b");
        return res;
    };
    return Mc;
})();
var McCons = (function (_super) {
    __extends(McCons, _super);
    function McCons(mcA, mcB) {
        _super.call(this, '');
        this.mcA = mcA;
        this.mcB = mcB;
    }
    McCons.prototype.write = function (ctx) {
        this.mcA.write(ctx);
        this.mcB.write(ctx);
    };
    return McCons;
})(Mc);
var McNextStatement = (function (_super) {
    __extends(McNextStatement, _super);
    function McNextStatement() {
        _super.call(this, 'this.t = 0');
    }
    return McNextStatement;
})(Mc);
var McNextCycle = (function (_super) {
    __extends(McNextCycle, _super);
    function McNextCycle() {
        _super.call(this, 'this.t++');
    }
    return McNextCycle;
})(Mc);
var McNop = (function (_super) {
    __extends(McNop, _super);
    function McNop() {
        _super.call(this, '');
    }
    McNop.prototype.write = function (ctx) {
    };
    return McNop;
})(Mc);
var McExpr = (function (_super) {
    __extends(McExpr, _super);
    function McExpr(expr) {
        _super.call(this, expr);
        this.expr = expr;
    }
    McExpr.prototype.write = function (ctx) {
        ctx.write(this.expr);
    };
    return McExpr;
})(Mc);
var McIf = (function (_super) {
    __extends(McIf, _super);
    function McIf(cond, mcTrue, mcFalse) {
        _super.call(this, '');
        this.cond = cond;
        this.mcTrue = Mc.lift(mcTrue);
        this.mcFalse = Mc.lift(mcFalse);
    }
    McIf.prototype.write = function (ctx) {
        var _this = this;
        ctx.writeLine("if (" + this.cond + ") {");
        ctx.indented(function () { return _this.mcTrue.write(ctx); });
        if (!(this.mcFalse instanceof McNop)) {
            ctx.writeLine("} else {");
            ctx.indented(function () { return _this.mcFalse.write(ctx); });
        }
        ctx.writeLine("}");
    };
    return McIf;
})(Mc);
var Cycle = (function () {
    function Cycle(icycle, desc) {
        this.icycle = icycle;
        this.desc = desc;
        this.pcIncremented = 0;
        this.mc = new McNop();
    }
    Cycle.prototype.fetchOpcode = function () {
        return this;
    };
    Cycle.prototype.withDummyPcIncrement = function () {
        if (this.pcIncremented)
            throw 'PC is already incremented';
        this.pcIncremented++;
        return this;
    };
    Cycle.prototype.thenIncrementPC = function () {
        this.withDummyPcIncrement();
        this.mc = this.mc.then('this.ip++');
        return this;
    };
    Cycle.prototype.then = function (mc) {
        this.mc = this.mc.then(mc);
        return this;
    };
    Cycle.prototype.thenMoveBToReg = function (register) {
        this.mc = this.mc.thenMoveBToReg(register);
        return this;
    };
    Cycle.prototype.thenIf = function (o) {
        var cond = o.cond;
        var mcTrue = o.if;
        var mcFalse = o.else;
        if (!(mcTrue instanceof Mc))
            mcTrue = new Mc(mcTrue);
        if (!(mcFalse instanceof Mc))
            mcFalse = mcFalse ? new Mc(mcFalse) : new McNop();
        this.mc = this.mc.then(new McIf(cond, mcTrue, mcFalse));
        return this;
    };
    Cycle.prototype.thenNextCycle = function () {
        this.mc = this.mc.then(new McNextCycle());
        return this;
    };
    Cycle.prototype.thenNextStatement = function () {
        this.mc = this.mc.then(new McNextStatement());
        return this;
    };
    Cycle.prototype.thenMoveRegToB = function (regIn) {
        this.mc = this.mc.thenMoveRegToB(regIn);
        return this;
    };
    return Cycle;
})();
var Mos6502Gen = (function () {
    function Mos6502Gen() {
    }
    Mos6502Gen.prototype.getRegAccess = function (reg) {
        return "this.r" + Register[reg].toString();
    };
    Mos6502Gen.prototype.NOP = function () { return new McNop(); };
    Mos6502Gen.prototype.ADC = function () {
        return new McNop()
            .then("const sum = this.rA + this.b + this.flgCarry")
            .then("const bothPositive = this.b < 128 && this.rA < 128")
            .then("const bothNegative = this.b >= 128 && this.rA >= 128")
            .then("this.flgCarry = sum > 255 ? 1 : 0")
            .then("this.b = sum % 256")
            .then("this.flgNegative = this.b >= 128 ? 1 : 0")
            .then("this.flgZero = this.b === 0 ? 1 : 0")
            .then("this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0");
    };
    Mos6502Gen.prototype.SBC = function () {
        return new McNop()
            .then("this.b = 255 - this.b")
            .then(this.ADC());
    };
    Mos6502Gen.prototype.BinOp = function (op) {
        return new McNop()
            .then("this.b " + op + "= this.rA")
            .then("this.flgZero = !this.b ? 1 : 0")
            .then("this.flgNegative = this.b >= 128 ? 1 : 0");
    };
    Mos6502Gen.prototype.AND = function () { return this.BinOp('&'); };
    Mos6502Gen.prototype.EOR = function () { return this.BinOp('^'); };
    Mos6502Gen.prototype.ORA = function () { return this.BinOp('|'); };
    Mos6502Gen.prototype.CMPReg = function (register) {
        return new McNop()
            .then("this.flgCarry = " + this.getRegAccess(register) + " >= this.b ? 1 : 0")
            .then("this.flgZero =  " + this.getRegAccess(register) + " === this.b ? 1 : 0")
            .then("this.flgNegative = (" + this.getRegAccess(register) + " - this.b) & 128 ? 1 : 0");
    };
    Mos6502Gen.prototype.CMP = function () { return this.CMPReg(Register.A); };
    Mos6502Gen.prototype.CPX = function () { return this.CMPReg(Register.X); };
    Mos6502Gen.prototype.CPY = function () { return this.CMPReg(Register.Y); };
    Mos6502Gen.prototype.LD = function () {
        return new McNop()
            .then("this.flgZero = !this.b ? 1 : 0")
            .then("this.flgNegative = this.b & 128 ? 1 : 0");
    };
    Mos6502Gen.prototype.LDA = function () { return this.LD(); };
    Mos6502Gen.prototype.LDX = function () { return this.LD(); };
    Mos6502Gen.prototype.LDY = function () { return this.LD(); };
    Mos6502Gen.prototype.BIT = function () {
        return new McNop()
            .then("this.b = this.rA & this.b")
            .then("this.flgZero = !this.b ? 1 : 0")
            .then("this.flgNegative = this.b & 128 ? 1 : 0")
            .then("this.flgOverflow = this.b & 64 ? 1 : 0");
    };
    Mos6502Gen.prototype.ASL = function () {
        return new McNop()
            .then("this.flgCarry = this.b & 0x80 ? 1 : 0")
            .then("this.b = (this.b << 1) & 0xff")
            .then("this.flgZero = !this.b ? 1 : 0")
            .then("this.flgNegative = this.b & 0x80 ? 1 : 0");
    };
    Mos6502Gen.prototype.LSR = function () {
        return new McNop()
            .then("this.flgCarry = this.b & 1")
            .then("this.b = (this.b >> 1) & 0xff")
            .then("this.flgZero = !this.b ? 1 : 0")
            .then("this.flgNegative = this.b & 0x80 ? 1 : 0");
    };
    Mos6502Gen.prototype.ROL = function () {
        return new McNop()
            .then("this.b = (this.b << 1) | this.flgCarry")
            .then("this.flgCarry = this.b & 0x100 ? 1 : 0")
            .then("this.b &= 0xff")
            .then("this.flgZero = !this.b ? 1 : 0")
            .then("this.flgNegative = this.b & 0x80 ? 1 : 0");
    };
    Mos6502Gen.prototype.ROR = function () {
        return new McNop()
            .then("this.b |= this.flgCarry << 8")
            .then("this.flgCarry = this.b & 1 ? 1 : 0")
            .then("this.b >>= 1")
            .then("this.flgZero = !this.b ? 1 : 0")
            .then("this.flgNegative = this.b & 0x80 ? 1 : 0");
    };
    Mos6502Gen.prototype.DEC = function () {
        return new McNop()
            .then("this.b = (this.b - 1) & 0xff")
            .then("this.flgZero = !this.b ? 1 : 0")
            .then("this.flgNegative = this.b & 0x80 ? 1 : 0");
    };
    Mos6502Gen.prototype.DEX = function () { return this.DEC(); };
    Mos6502Gen.prototype.DEY = function () { return this.DEC(); };
    Mos6502Gen.prototype.INC = function () {
        return new McNop()
            .then("this.b = (this.b + 1) & 0xff")
            .then("this.flgZero = !this.b ? 1 : 0")
            .then("this.flgNegative = this.b & 0x80 ? 1 : 0");
    };
    Mos6502Gen.prototype.INX = function () { return this.INC(); };
    Mos6502Gen.prototype.INY = function () { return this.INC(); };
    Mos6502Gen.prototype.BCC = function () { return new McExpr('!this.flgCarry'); };
    Mos6502Gen.prototype.BCS = function () { return new McExpr('this.flgCarry'); };
    Mos6502Gen.prototype.BEQ = function () { return new McExpr('this.flgZero'); };
    Mos6502Gen.prototype.BMI = function () { return new McExpr('this.flgNegative'); };
    Mos6502Gen.prototype.BNE = function () { return new McExpr('!this.flgZero'); };
    Mos6502Gen.prototype.BPL = function () { return new McExpr('!this.flgNegative'); };
    Mos6502Gen.prototype.BVC = function () { return new McExpr('!this.flgOverflow'); };
    Mos6502Gen.prototype.BVS = function () { return new McExpr('this.flgOverflow'); };
    Mos6502Gen.prototype.CLC = function () { return new Mc("this.flgCarry = 0"); };
    Mos6502Gen.prototype.CLD = function () { return new Mc("this.flgDecimalMode = 0"); };
    Mos6502Gen.prototype.CLI = function () { return new Mc("this.flgInterruptDisable = 0"); };
    Mos6502Gen.prototype.SEI = function () { return new Mc("this.flgInterruptDisable = 1"); };
    Mos6502Gen.prototype.SEC = function () { return new Mc("this.flgCarry = 1"); };
    Mos6502Gen.prototype.SED = function () { return new Mc("this.flgDecimalMode = 1"); };
    Mos6502Gen.prototype.CLV = function () { return new Mc("this.flgOverflow = 1"); };
    Mos6502Gen.prototype.JMP = function () { return new McNop(); };
    Mos6502Gen.prototype.PHA = function () {
        return new Mc("this.pushByte(this.rA)");
    };
    Mos6502Gen.prototype.PLA = function () {
        return new Mc("this.rA = this.popByte()")
            .then("this.flgZero = this.rA === 0 ? 1 : 0")
            .then("this.flgNegative = this.rA >= 128 ? 1 : 0");
    };
    Mos6502Gen.prototype.PHP = function () {
        return new Mc("this.flgBreakCommand = 1")
            .then("this.pushByte(this.rP)")
            .then("this.flgBreakCommand = 0");
    };
    Mos6502Gen.prototype.PLP = function () {
        return new Mc("this.rP = this.popByte()");
    };
    Mos6502Gen.prototype.STA = function () {
        return new Mc("this.b = this.rA");
    };
    Mos6502Gen.prototype.STX = function () {
        return new Mc("this.b = this.rX");
    };
    Mos6502Gen.prototype.STY = function () {
        return new Mc("this.b = this.rY");
    };
    Mos6502Gen.prototype.SAX = function () {
        return new Mc("this.b = this.rA & this.rX");
    };
    Mos6502Gen.prototype.TAX = function () {
        return new McNop()
            .then("this.flgZero = this.b === 0 ? 1 : 0")
            .then("this.flgNegative = this.b >= 128 ? 1 : 0");
    };
    Mos6502Gen.prototype.TAY = function () {
        return new McNop()
            .then("this.flgZero = this.b === 0 ? 1 : 0")
            .then("this.flgNegative = this.b >= 128 ? 1 : 0");
    };
    Mos6502Gen.prototype.TSX = function () {
        return new McNop()
            .then("this.flgZero = this.b === 0 ? 1 : 0")
            .then("this.flgNegative = this.b >= 128 ? 1 : 0");
    };
    Mos6502Gen.prototype.TXA = function () {
        return new McNop()
            .then("this.flgZero = this.b === 0 ? 1 : 0")
            .then("this.flgNegative = this.b >= 128 ? 1 : 0");
    };
    Mos6502Gen.prototype.TXS = function () { return new McNop(); };
    Mos6502Gen.prototype.TYA = function () {
        return new McNop()
            .then("this.flgZero = this.b === 0 ? 1 : 0")
            .then("this.flgNegative = this.b >= 128 ? 1 : 0");
    };
    Mos6502Gen.prototype.DCP = function () {
        return new McNop()
            .then("this.b = (this.b - 1) & 0xff")
            .then("this.flgCarry = this.rA >= this.b ? 1 : 0")
            .then("this.flgZero = this.rA === this.b? 1 : 0")
            .then("this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0");
    };
    //http://nesdev.com/6502_cpu.txt
    Mos6502Gen.prototype.getZeroPageCycles = function (statement, mc) {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch address, increment PC')
                        .then("this.addr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
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
                        .then("this.addr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenNextCycle(),
                    new Cycle(4, 'write the value back to effective address, and do the operation on it')
                        .then("this.setByte(this.addr, this.b)")
                        .then(mc)
                        .thenNextCycle(),
                    new Cycle(5, 'write the new value to effective address')
                        .then("this.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.Write:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch address, increment PC')
                        .then("this.addr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'write register to effective address')
                        .then(mc)
                        .then("this.setByte(this.addr, this.b)")
                        .thenNextStatement(),
                ];
            default:
                throw 'not implemented';
        }
    };
    Mos6502Gen.prototype.getZeroPageXYCycles = function (reg, statement, mc) {
        var regAccess = this.getRegAccess(reg);
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch address, increment PC')
                        .then("this.addr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'read from address, add index register to it')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .then("this.addr = (" + regAccess + " + this.addr) & 0xff")
                        .thenNextCycle(),
                    new Cycle(4, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
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
                        .then("this.addr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'read from address, add index register X/Y to it')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .then("this.addr = (" + regAccess + " + this.addr) & 0xff")
                        .thenNextCycle(),
                    new Cycle(4, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenNextCycle(),
                    new Cycle(5, 'write the value back to effective address, and do the operation on it')
                        .then("this.setByte(this.addr, this.b)")
                        .then(mc)
                        .thenNextCycle(),
                    new Cycle(6, 'write the new value to effective address')
                        .then("this.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.Write:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch address, increment PC')
                        .then("this.addr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'read from address, add index register X/Y to it')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .then("this.addr = (" + regAccess + " + this.addr) & 0xff")
                        .thenNextCycle(),
                    new Cycle(3, 'write register to effective address')
                        .then(mc)
                        .then("this.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    };
    Mos6502Gen.prototype.getZeroPageXCycles = function (statement, mc) {
        return this.getZeroPageXYCycles(Register.X, statement, mc);
    };
    Mos6502Gen.prototype.getZeroPageYCycles = function (statement, mc) {
        return this.getZeroPageXYCycles(Register.Y, statement, mc);
    };
    Mos6502Gen.prototype.getAbsoluteCycles = function (statement, mc) {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Jmp:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then("this.addrLo = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'copy low address byte to PCL, fetch high address byte to PCH')
                        .then("this.addrHi = this.memory.getByte(this.ip)")
                        .then("this.ip = (this.addrHi << 8) + this.addrLo").withDummyPcIncrement()
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then("this.addrLo = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'fetch high byte of address, increment PC')
                        .then("this.addrHi = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(4, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
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
                        .then("this.addrLo = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'fetch high byte of address, increment PC')
                        .then("this.addrHi = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(4, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenNextCycle(),
                    new Cycle(5, 'write the value back to effective address, and do the operation on it')
                        .then("this.setByte(this.addr, this.b)")
                        .then(mc)
                        .thenNextCycle(),
                    new Cycle(6, 'write the new value to effective address')
                        .then("this.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.Write:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then("this.addrLo = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'fetch high byte of address, increment PC')
                        .then("this.addrHi = this.memory.getByte(this.ip)")
                        .then("this.addr = this.addrLo + (this.addrHi << 8))")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(4, 'write register to effective address')
                        .then(mc)
                        .then("this.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    };
    Mos6502Gen.prototype.getAbsoluteIndirectCycles = function (statement, mc) {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Jmp:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then("this.ptrLo = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'copy low address byte to PCL, fetch high address byte to PCH')
                        .then("this.ptrHi = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(4, 'fetch low address to latch')
                        .then("this.addrLo = this.memory.getByte( (this.ptrHi << 8) + this.ptrLo )")
                        .thenNextCycle(),
                    new Cycle(4, 'fetch PCH copy latch to PCL')
                        .then("this.addrHi = this.memory.getByte( (this.ptrHi << 8) + ((this.ptrLo + 1) & 0xff) )")
                        .then("this.ip = (this.addrHi << 8) + this.addrLo")
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    };
    Mos6502Gen.prototype.getAbsoluteXYCycles = function (rXY, statement, mc) {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then("this.addrLo = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'fetch high byte of address, add index register to low address byte, increment PC')
                        .then("this.addrHi = this.memory.getByte(this.ip)")
                        .then("this.addrC = (this.addrLo + this." + rXY + ") >> 8")
                        .then("this.addrLo = (this.addrLo + this." + rXY + ") & 0xff")
                        .then("this.addr = this.addrLo + (this.addrHi << 8)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(4, 'read from effective address, fix the high byte of effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenIf({
                        cond: "this.addrC",
                        if: "this.addr = this.addr + (this.addrO << 8)",
                        else: mc.thenMoveBToReg(statement.regOut).thenNextStatement()
                    })
                        .thenNextCycle(),
                    new Cycle(5, 're-read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
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
                        .then("this.addrLo = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'fetch high byte of address, add index register to low address byte, increment PC')
                        .then("this.addrHi = this.memory.getByte(this.ip)")
                        .then("this.addrC = (this.addrLo + this." + rXY + ") >> 8")
                        .then("this.addrLo = (this.addrLo + this." + rXY + ") & 0xff")
                        .then("this.addr = this.addrLo + (this.addrHi << 8)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(4, 'read from effective address, fix the high byte of effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenIf({
                        cond: "this.addrC",
                        if: "this.addr = this.addr + (this.addrC << 8)"
                    })
                        .thenNextCycle(),
                    new Cycle(5, 're-read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenNextCycle(),
                    new Cycle(6, 'write the value back to effective address, and do the operation on it')
                        .then("this.setByte(this.addr, this.b)")
                        .then(mc)
                        .thenNextCycle(),
                    new Cycle(7, 'write the new value to effective address')
                        .then("this.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.Write:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch low byte of address, increment PC')
                        .then("this.addrLo = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'fetch high byte of address, add index register to low address byte, increment PC')
                        .then("this.addrHi = this.memory.getByte(this.ip)")
                        .then("this.addrC = (this.addrLo + this." + rXY + ") >> 8")
                        .then("this.addrLo = (this.addrLo + this." + rXY + ") & 0xff")
                        .then("this.addr = this.addrLo + (this.addrHi << 8)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(4, 'read from effective address, fix the high byte of effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenIf({
                        cond: "this.addrC",
                        if: "this.addr = this.addr + (this.addrC << 8)",
                    })
                        .thenNextCycle(),
                    new Cycle(5, 'write to effective address')
                        .then(mc)
                        .then("this.memory.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    };
    Mos6502Gen.prototype.getAbsoluteXCycles = function (statement, mc) {
        return this.getAbsoluteXYCycles('rX', statement, mc);
    };
    Mos6502Gen.prototype.getAbsoluteYCycles = function (statement, mc) {
        return this.getAbsoluteXYCycles('rY', statement, mc);
    };
    Mos6502Gen.prototype.getImmediateCycles = function (statement, mc) {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(2, 'fetch value, increment PC')
                .then("this.b = this.memory.getByte(this.ip)")
                .thenIncrementPC()
                .then(mc)
                .thenMoveBToReg(statement.regOut)
                .thenNextStatement()
        ];
    };
    Mos6502Gen.prototype.getAccumulatorCycles = function (statement, mc) {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(2, ' read next instruction byte (and throw it away)')
                .then("this.memory.getByte(this.ip)")
                .thenMoveRegToB(statement.regIn)
                .then(mc)
                .thenMoveBToReg(statement.regOut)
                .thenNextStatement()
        ];
    };
    Mos6502Gen.prototype.JSR = function () { return null; };
    Mos6502Gen.prototype.getJSRCycles = function (statement, mc) {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(2, 'fetch low address byte, increment PC')
                .then("this.addrLo = this.memory.getByte(this.ip)")
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(3, 'internal operation (predecrement S?)')
                .thenNextCycle(),
            new Cycle(4, 'push PCH on stack, decrement S')
                .then("this.pushByte(this.ip >> 8)")
                .thenNextCycle(),
            new Cycle(5, 'push PCL on stack, decrement S')
                .then("this.pushByte(this.ip & 0xff)")
                .thenNextCycle(),
            new Cycle(6, 'copy low address byte to PCL, fetch high address byte to PCH')
                .then("this.ip = this.addrLo")
                .then("this.ip |= this.memory.getByte(this.ip) << 8").withDummyPcIncrement()
                .thenNextStatement()
        ];
    };
    Mos6502Gen.prototype.RTS = function () { return null; };
    Mos6502Gen.prototype.getRTSCycles = function (statement, mc) {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(2, 'read next instruction byte (and throw it away)')
                .then("this.memory.getByte(this.ip)")
                .thenNextCycle(),
            new Cycle(3, 'increment S')
                .thenNextCycle(),
            new Cycle(4, 'pull PCL from stack, increment SS')
                .then("this.ip = this.popByte()")
                .thenNextCycle(),
            new Cycle(5, 'pull PCH from stack')
                .then("this.ip |= this.popByte() << 8")
                .thenNextCycle(),
            new Cycle(6, 'increment PCH')
                .thenIncrementPC()
                .thenNextStatement()
        ];
    };
    Mos6502Gen.prototype.BRK = function () { return null; };
    Mos6502Gen.prototype.getBRKCycles = function (statement, mc) {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(2, 'read next instruction byte (and throw it away), inrement PC')
                .then("this.memory.getByte(this.ip)")
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(3, 'push PCH on stack (with B flag set), decrement S')
                .then("this.pushByte(this.ip >> 8)")
                .thenNextCycle(),
            new Cycle(4, 'push PCL on stack, decrement S')
                .then("this.pushByte(this.ip & 0xff)")
                .thenNextCycle(),
            new Cycle(5, 'push P on stack, decrement S')
                .then("this.flgBreakCommand = 1")
                .then("this.pushByte(this.rP)")
                .then("this.flgBreakCommand = 0")
                .thenNextCycle(),
            new Cycle(6, 'fetch PCL')
                .then("this.ip = this.memory.getByte(this.addrIRQ)")
                .thenNextCycle(),
            new Cycle(7, 'fetch PCH')
                .then("this.ip |= this.memory.getByte(this.addrIRQ + 1) << 8")
                .thenNextStatement()
        ];
    };
    Mos6502Gen.prototype.RTI = function () { return null; };
    Mos6502Gen.prototype.getRTICycles = function (statement, mc) {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(2, 'read next instruction byte (and throw it away)')
                .then("this.memory.getByte(this.ip)")
                .thenNextCycle(),
            new Cycle(3, 'increment S')
                .thenNextCycle(),
            new Cycle(4, 'pull P from stack, increment S')
                .then("this.rP = this.popByte()")
                .thenNextCycle(),
            new Cycle(5, ' pull PCL from stack, increment SL')
                .then("this.ip = this.popByte()")
                .thenNextCycle(),
            new Cycle(6, ' pull PCH from stack')
                .then("this.ip |= this.popByte() << 8")
                .thenNextStatement()
        ];
    };
    Mos6502Gen.prototype.getImpliedCycles = function (statement, mc) {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Push:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'read next instruction byte (and throw it away)')
                        .then("this.memory.getByte(this.ip)")
                        .thenNextCycle(),
                    new Cycle(3, 'push register on stack, decrement S)')
                        .then(mc)
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.Pop:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'read next instruction byte (and throw it away)')
                        .then("this.memory.getByte(this.ip)")
                        .thenNextCycle(),
                    new Cycle(3, 'increment S')
                        .thenNextCycle(),
                    new Cycle(4, 'pull register from stack')
                        .then(mc)
                        .thenNextStatement()
                ];
            default:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'read next instruction byte (and throw it away)')
                        .then("this.memory.getByte(this.ip)")
                        .then(mc)
                        .thenNextStatement()
                ];
        }
    };
    Mos6502Gen.prototype.getIndirectXCycles = function (statement, mc) {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch pointer address, increment PC')
                        .then("this.addrPtr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'read from the address, add X to it')
                        .then("this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff")
                        .thenNextCycle(),
                    new Cycle(4, 'fetch effective address low')
                        .then("this.addrLo = this.memory.getByte(this.addrPtr))")
                        .thenNextCycle(),
                    new Cycle(5, 'fetch effective address high')
                        .then("this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)")
                        .then("this.addr = this.addrLo + (this.addrHi << 8))")
                        .thenNextCycle(),
                    new Cycle(6, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
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
                    new Cycle(2, 'fetch pointer address, increment PC')
                        .then("this.addrPtr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'read from the address, add X to it')
                        .then("this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff")
                        .thenNextCycle(),
                    new Cycle(4, 'fetch effective address low')
                        .then("this.addrLo = this.memory.getByte(this.addrPtr))")
                        .thenNextCycle(),
                    new Cycle(5, 'fetch effective address high')
                        .then("this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)")
                        .then("this.addr = this.addrLo + (this.addrHi << 8))")
                        .thenNextCycle(),
                    new Cycle(6, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenNextCycle(),
                    new Cycle(7, 'write the value back to effective address, and do the operation on it')
                        .then("this.memory.setByte(this.addr, this.b)")
                        .then(mc)
                        .thenNextCycle(),
                    new Cycle(8, 'write the new value to effective address')
                        .then("this.memory.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.Write:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch pointer address, increment PC')
                        .then("this.addrPtr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'read from the address, add X to it')
                        .then("this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff")
                        .thenNextCycle(),
                    new Cycle(4, 'fetch effective address low')
                        .then("this.addrLo = this.memory.getByte(this.addrPtr))")
                        .thenNextCycle(),
                    new Cycle(5, 'fetch effective address high')
                        .then("this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)")
                        .then("this.addr = this.addrLo + (this.addrHi << 8))")
                        .thenNextCycle(),
                    new Cycle(6, 'write to effective address')
                        .then(mc)
                        .then("this.memory.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    };
    Mos6502Gen.prototype.getIndirectYCycles = function (statement, mc) {
        switch (statement.memoryAccessPattern) {
            case MemoryAccessPattern.Read:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch pointer address, increment PC')
                        .then("this.addrPtr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'fetch effective address low')
                        .then("this.addrLo = this.memory.getByte(this.addrPtr")
                        .thenNextCycle(),
                    new Cycle(4, 'fetch effective address high, add Y to low byte of effective address')
                        .then("this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)")
                        .then("this.addrC = (this.addrLo + this.rY) >> 8")
                        .then("this.addrLo = (this.addrLo + this.rY) & 0xff")
                        .then("this.addr = this.addrLo + (this.addrHi << 8)")
                        .thenNextCycle(),
                    new Cycle(5, 'read from effective address, fix high byte of effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenIf({
                        cond: "this.addrC",
                        if: "this.addr = this.addr + (this.addrC << 8)",
                        else: mc.thenMoveBToReg(statement.regOut).thenNextStatement()
                    })
                        .thenNextCycle(),
                    new Cycle(6, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
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
                    new Cycle(2, 'fetch pointer address, increment PC')
                        .then("this.addrPtr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'fetch effective address low')
                        .then("this.addrLo = this.memory.getByte(this.addrPtr")
                        .thenNextCycle(),
                    new Cycle(4, 'fetch effective address high, add Y to low byte of effective address')
                        .then("this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)")
                        .then("this.addrC = (this.addrLo + this.rY) >> 8")
                        .then("this.addrLo = (this.addrLo + this.rY) & 0xff")
                        .then("this.addr = this.addrLo + (this.addrHi << 8)")
                        .thenNextCycle(),
                    new Cycle(5, 'read from effective address, fix high byte of effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenIf({
                        cond: "this.addrC",
                        if: "this.addr = this.addr + (this.addrC << 8)",
                    })
                        .thenNextCycle(),
                    new Cycle(6, 'read from effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenNextCycle(),
                    new Cycle(7, 'write the value back to effective address, and do the operation on it')
                        .then("this.memory.setByte(this.addr, this.b)")
                        .then(mc)
                        .thenNextCycle(),
                    new Cycle(8, 'write the new value to effective address')
                        .then("this.memory.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            case MemoryAccessPattern.Write:
                return [
                    new Cycle(1, 'fetch opcode, increment PC')
                        .fetchOpcode()
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(2, 'fetch pointer address, increment PC')
                        .then("this.addrPtr = this.memory.getByte(this.ip)")
                        .thenIncrementPC()
                        .thenNextCycle(),
                    new Cycle(3, 'fetch effective address low')
                        .then("this.addrLo = this.memory.getByte(this.addrPtr")
                        .thenNextCycle(),
                    new Cycle(4, 'fetch effective address high, add Y to low byte of effective address')
                        .then("this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff)")
                        .then("this.addrC = (this.addrLo + this.rY) >> 8")
                        .then("this.addrLo = (this.addrLo + this.rY) & 0xff")
                        .then("this.addr = this.addrLo + (this.addrHi << 8)")
                        .thenNextCycle(),
                    new Cycle(5, 'read from effective address, fix high byte of effective address')
                        .then("this.b = this.memory.getByte(this.addr)")
                        .thenIf({
                        cond: "this.addrC",
                        if: "this.addr = this.addr + (this.addrC << 8)",
                    })
                        .thenNextCycle(),
                    new Cycle(6, 'write to effective address')
                        .then(mc)
                        .then("this.memory.setByte(this.addr, this.b)")
                        .thenNextStatement()
                ];
            default:
                throw 'not implemented';
        }
    };
    Mos6502Gen.prototype.getRelativeCycles = function (statement, mc) {
        return [
            new Cycle(1, 'fetch opcode, increment PC')
                .fetchOpcode()
                .thenIncrementPC()
                .thenNextCycle(),
            new Cycle(2, 'fetch operand, increment PC')
                .then("this.b = this.memory.getByte(this.ip)")
                .thenIncrementPC()
                .thenIf({
                cond: mc.expr,
                if: new McNextCycle(),
                else: new McNextStatement()
            }),
            new Cycle(3, 'fetch opcode of next instruction, if branch is taken add operand to pc')
                .then("this.memory.getByte(this.ip)")
                .then("this.b = this.b >= 128 ? this.b - 256 : this.b")
                .then("this.ipC = (this.ip & 0xff) + this.b >> 8")
                .then("this.ip += this.b")
                .thenIf({
                cond: 'this.ipC',
                if: new McNextCycle(),
                else: new McNextStatement()
            }),
            new Cycle(4, 'Fix PCH.')
                .then("this.ip += this.ipC << 8")
                .thenNextStatement()
        ];
    };
    Mos6502Gen.prototype.genStatement = function (statement) {
        var ctx = new Ctx();
        ctx.writeLine("case 0x" + statement.opcode.toString(16) + ": /* " + statement.mnemonic + " " + statement.cycleCount.toString() + " */ {");
        var rgcycle = statement.getCycles(this);
        ctx.indented(function () {
            ctx.writeLine('switch (this.t) {');
            ctx.indented(function () {
                for (var icycle = 0; icycle < rgcycle.length; icycle++) {
                    var cycle = rgcycle[icycle];
                    ctx.writeLine("case " + icycle + ": {");
                    ctx.indented(function () {
                        cycle.mc.write(ctx);
                        ctx.writeLine('break;');
                    });
                    ctx.writeLine("}");
                }
            });
            ctx.writeLine('}');
        });
        ctx.writeLine('break;');
        var res = ctx.getOutput();
        if (rgcycle.length !== statement.cycleCount.maxCycle()) {
            console.error(statement.mnemonic + ": cycle count doesn't match. Expected " + statement.cycleCount.maxCycle() + ", found " + rgcycle.length);
            console.error(res);
            throw '';
        }
        if (rgcycle.map(function (cycle) { return cycle.pcIncremented; }).reduce(function (s, pcIncremented) { return s + pcIncremented; }) !== statement.size) {
            console.error(statement.mnemonic + ": size mismatch. Expected to be " + statement.size + " long");
            console.error(res);
            throw '';
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
            new Statement(0xea, StatementKind.NOP, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0x09, StatementKind.ORA, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0x05, StatementKind.ORA, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x15, StatementKind.ORA, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x0d, StatementKind.ORA, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0x1d, StatementKind.ORA, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0x19, StatementKind.ORA, AddressingMode.AbsoluteY, 3, new CycleCount(4).withPageCross()),
            new Statement(0x01, StatementKind.ORA, AddressingMode.IndirectX, 2, new CycleCount(6)),
            new Statement(0x11, StatementKind.ORA, AddressingMode.IndirectY, 2, new CycleCount(5).withPageCross()),
            new Statement(0x48, StatementKind.PHA, AddressingMode.Implied, 1, new CycleCount(3)),
            new Statement(0x08, StatementKind.PHP, AddressingMode.Implied, 1, new CycleCount(3)),
            new Statement(0x68, StatementKind.PLA, AddressingMode.Implied, 1, new CycleCount(4)),
            new Statement(0x28, StatementKind.PLP, AddressingMode.Implied, 1, new CycleCount(4)),
            new Statement(0x2a, StatementKind.ROL, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0x26, StatementKind.ROL, AddressingMode.ZeroPage, 2, new CycleCount(5)),
            new Statement(0x36, StatementKind.ROL, AddressingMode.ZeroPageX, 2, new CycleCount(6)),
            new Statement(0x2e, StatementKind.ROL, AddressingMode.Absolute, 3, new CycleCount(6)),
            new Statement(0x3e, StatementKind.ROL, AddressingMode.AbsoluteX, 3, new CycleCount(7)),
            new Statement(0x6a, StatementKind.ROR, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0x66, StatementKind.ROR, AddressingMode.ZeroPage, 2, new CycleCount(5)),
            new Statement(0x76, StatementKind.ROR, AddressingMode.ZeroPageX, 2, new CycleCount(6)),
            new Statement(0x6e, StatementKind.ROR, AddressingMode.Absolute, 3, new CycleCount(6)),
            new Statement(0x7e, StatementKind.ROR, AddressingMode.AbsoluteX, 3, new CycleCount(7)),
            new Statement(0x00, StatementKind.BRK, AddressingMode.BRK, 2, new CycleCount(7)),
            new Statement(0x40, StatementKind.RTI, AddressingMode.RTI, 1, new CycleCount(6)),
            new Statement(0xe9, StatementKind.SBC, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0xe5, StatementKind.SBC, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0xf5, StatementKind.SBC, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0xed, StatementKind.SBC, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0xfd, StatementKind.SBC, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0xf9, StatementKind.SBC, AddressingMode.AbsoluteY, 3, new CycleCount(4).withPageCross()),
            new Statement(0xe1, StatementKind.SBC, AddressingMode.IndirectX, 2, new CycleCount(6)),
            new Statement(0xf1, StatementKind.SBC, AddressingMode.IndirectY, 2, new CycleCount(5).withPageCross()),
            new Statement(0x18, StatementKind.SEC, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0xd8, StatementKind.SED, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0x58, StatementKind.SEI, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0x85, StatementKind.STA, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x95, StatementKind.STA, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x8d, StatementKind.STA, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0x9d, StatementKind.STA, AddressingMode.AbsoluteX, 3, new CycleCount(5)),
            new Statement(0x99, StatementKind.STA, AddressingMode.AbsoluteY, 3, new CycleCount(5)),
            new Statement(0x81, StatementKind.STA, AddressingMode.IndirectX, 2, new CycleCount(6)),
            new Statement(0x91, StatementKind.STA, AddressingMode.IndirectY, 2, new CycleCount(6)),
            new Statement(0x86, StatementKind.STX, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x96, StatementKind.STX, AddressingMode.ZeroPageY, 2, new CycleCount(4)),
            new Statement(0x8e, StatementKind.STX, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0x84, StatementKind.STY, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x94, StatementKind.STY, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x8c, StatementKind.STY, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0xaa, StatementKind.TAX, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0xa8, StatementKind.TAY, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0xba, StatementKind.TSX, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0x8a, StatementKind.TXA, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0x9a, StatementKind.TXS, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0x98, StatementKind.TYA, AddressingMode.Accumulator, 1, new CycleCount(2)),
            new Statement(0x20, StatementKind.JSR, AddressingMode.JSR, 3, new CycleCount(6)),
            new Statement(0x60, StatementKind.RTS, AddressingMode.RTS, 2, new CycleCount(6)),
            //unofficial opcodes
            new Statement(0x1a, StatementKind.NOP, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0x3a, StatementKind.NOP, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0x5a, StatementKind.NOP, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0x7a, StatementKind.NOP, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0xda, StatementKind.NOP, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0xfa, StatementKind.NOP, AddressingMode.Implied, 1, new CycleCount(2)),
            new Statement(0x04, StatementKind.NOP, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x14, StatementKind.NOP, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x34, StatementKind.NOP, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x44, StatementKind.NOP, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x54, StatementKind.NOP, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x74, StatementKind.NOP, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0xd4, StatementKind.NOP, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0xf4, StatementKind.NOP, AddressingMode.ZeroPageX, 2, new CycleCount(4)),
            new Statement(0x64, StatementKind.NOP, AddressingMode.ZeroPage, 2, new CycleCount(3)),
            new Statement(0x80, StatementKind.NOP, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0x82, StatementKind.NOP, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0xc2, StatementKind.NOP, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0xe2, StatementKind.NOP, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0x89, StatementKind.NOP, AddressingMode.Immediate, 2, new CycleCount(2)),
            new Statement(0x0c, StatementKind.NOP, AddressingMode.Absolute, 3, new CycleCount(4)),
            new Statement(0x1c, StatementKind.NOP, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0x3c, StatementKind.NOP, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0x5c, StatementKind.NOP, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0x7c, StatementKind.NOP, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0xdc, StatementKind.NOP, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0xfc, StatementKind.NOP, AddressingMode.AbsoluteX, 3, new CycleCount(4).withPageCross()),
            new Statement(0xc3, StatementKind.DCP, AddressingMode.IndirectX, 2, new CycleCount(8)),
            new Statement(0xc7, StatementKind.DCP, AddressingMode.ZeroPage, 2, new CycleCount(5)),
            new Statement(0xcf, StatementKind.DCP, AddressingMode.Absolute, 3, new CycleCount(6)),
            new Statement(0xd3, StatementKind.DCP, AddressingMode.IndirectY, 2, new CycleCount(8)),
            new Statement(0xd7, StatementKind.DCP, AddressingMode.ZeroPageX, 2, new CycleCount(6)),
            new Statement(0xdb, StatementKind.DCP, AddressingMode.AbsoluteY, 3, new CycleCount(7)),
            new Statement(0xdf, StatementKind.DCP, AddressingMode.AbsoluteX, 3, new CycleCount(7)),
        ];
        var res = '';
        for (var i = 0; i < statements.length; i++) {
            res += this.genStatement(statements[i]);
        }
        //   return 'done';
        return res;
    };
    return Mos6502Gen;
})();
exports.Mos6502Gen = Mos6502Gen;
//# sourceMappingURL=mos6502gen.js.map