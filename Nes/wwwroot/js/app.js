var APU = (function () {
    /**
     *
     * --------------
     * Length Counter
     * --------------
     *
     * A length counter allows automatic duration control. Counting can be halted and
     * the counter can be disabled by clearing the appropriate bit in the status
     * register, which immediately sets the counter to 0 and keeps it there.
     *
     * The halt flag is in the channel's first register. For the square and noise
     * channels, it is bit 5, and for the triangle, bit 7:
     *
     *     --h- ----       halt (noise and square channels)
     *     h--- ----       halt (triangle channel)
     *
     * Note that the bit position for the halt flag is also mapped to another flag in
     * the Length Counter (noise and square) or Linear Counter (triangle).
     *
     * Unless disabled, a write the channel's fourth register immediately reloads the
     * counter with the value from a lookup table, based on the index formed by the
     * upper 5 bits:
     *
     *     iiii i---       length index
     *
     *     bits  bit 3
     *     7-4   0   1
     *         -------
     *     0   $0A $FE
     *     1   $14 $02
     *     2   $28 $04
     *     3   $50 $06
     *     4   $A0 $08
     *     5   $3C $0A
     *     6   $0E $0C
     *     7   $1A $0E
     *     8   $0C $10
     *     9   $18 $12
     *     A   $30 $14
     *     B   $60 $16
     *     C   $C0 $18
     *     D   $48 $1A
     *     E   $10 $1C
     *     F   $20 $1E
     *
     * See the clarifications section for a possible explanation for the values left
     * column of the table.
     *
     * When clocked by the frame sequencer, if the halt flag is clear and the counter
     * is non-zero, it is decremented.
     *
     */
    function APU(memory, cpu) {
        this.cpu = cpu;
        this.mode = 0;
        this.frameIRQDisabled = 0;
        this.idividerStep = 0;
        this.isequencerStep = 0;
        this.lc0 = 0;
        this.lc0Halt = 0;
        this.haltNoiseAndSquare = 0;
        this.haltTriangle = 0;
        this.lcTable = [
            [0x0A, 0x14, 0x28, 0x50, 0xA0, 0x3C, 0x0E, 0x1A, 0x0C, 0x18, 0x30, 0x60, 0xC0, 0x48, 0x10, 0x20],
            [0xFE, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0E, 0x10, 0x12, 0x14, 0x16, 0x18, 0x1A, 0x1C, 0x1E]
        ];
        memory.shadowSetter(0x4000, 0x4017, this.setter.bind(this));
        memory.shadowGetter(0x4000, 0x4017, this.getter.bind(this));
    }
    APU.prototype.tsto = function (label) {
        //console.log('APU', label, this.cpu.status());
    };
    APU.prototype.getter = function (addr) {
        switch (addr) {
            case 0x4015:
                var res = ((!this.cpu.irqLine ? 1 : 0) << 6) +
                    (this.lc0 > 0 ? 1 : 0);
                if (this.cpu.irqLine === 0) {
                    this.cpu.irqLine = 1;
                    this.tsto('get $4015');
                }
                return res;
        }
        // When $4015 is read, the status of the channels' length counters and bytes
        // remaining in the current DMC sample, and interrupt flags are returned.
        // Afterwards the Frame Sequencer's frame interrupt flag is cleared.
        // if-d nt21
        // IRQ from DMC
        // frame interrupt
        // DMC sample bytes remaining > 0
        // triangle length counter > 0
        // square 2 length counter > 0
        // square 1 length counter > 0
        return 0;
    };
    APU.prototype.setter = function (addr, value) {
        switch (addr) {
            case 0x4000:
                //$4000 / 4 ddle nnnn   duty, loop env/ disable length, env disable, vol / env period
                // The halt flag is in the channel's first register. For the square and noise
                // channels, it is bit 5, and for the triangle, bit 7:
                // --h - ----       halt(noise and square channels)
                // h-- - ----       halt(triangle channel)
                this.lc0Halt = (value >> 5) & 1;
                break;
            // $4001 eppp nsss   enable sweep, period, negative, shift
            // $4002 pppp pppp   period low
            case 0x4003:
                // llll lppp   length index, period high
                //Unless disabled, a write the channel's fourth register immediately reloads the
                //counter with the value from a lookup table, based on the index formed by the
                //upper 5 bits:
                //iiii i-- - length index
                if (!this.lc0Halt) {
                    this.lc0 = this.lcTable[value >> 4][(value >> 3) & 1];
                }
                break;
            case 0x4015:
                // ---------------
                //     Status Register
                // ---------------
                //     The status register at $4015 allows control and query of the channels' length
                // counters, and query of the DMC and frame interrupts.It is the only register
                // which can also be read.
                // When $4015 is written to, the channels' length counter enable flags are set, 
                // the DMC is possibly started or stopped, and the DMC's IRQ occurred flag is
                // cleared.
                // ---d nt21   DMC, noise, triangle, square 2, square 1
                // If d is set and the DMC's DMA reader has no more sample bytes to fetch, the DMC
                // sample is restarted.If d is clear then the DMA reader's sample bytes remaining
                // is set to 0.
                this.lc0Halt = 1 - (value & 1);
                break;
            case 0x4017:
                // On a write to $4017, the divider and sequencer are reset, then the sequencer is
                // configured. Two sequences are available, and frame IRQ generation can be
                // disabled.
                //  mi-- ----       mode, IRQ disable
                // If the mode flag is clear, the 4-step sequence is selected, otherwise the
                // 5-step sequence is selected and the sequencer is immediately clocked once.
                //     f = set interrupt flag
                //     l = clock length counters and sweep units
                //     e = clock envelopes and triangle's linear counter
                // mode 0: 4-step  effective rate (approx)
                // ---------------------------------------
                //     - - - f      60 Hz
                //     - l - l     120 Hz
                //     e e e e     240 Hz
                // mode 1: 5-step  effective rate (approx)
                // ---------------------------------------
                //     - - - - -   (interrupt flag never set)
                //     l - l - -    96 Hz
                //     e e e e -   192 Hz
                // At any time if the interrupt flag is set and the IRQ disable is clear, the
                // CPU's IRQ line is asserted.
                this.idividerStep = this.isequencerStep = -1;
                this.mode = (value >> 7) & 1;
                if (this.mode === 1)
                    this.step();
                this.frameIRQDisabled = (value >> 6) & 1;
                // Interrupt inhibit flag. If set, the frame interrupt flag is cleared, otherwise it is unaffected.
                if (this.frameIRQDisabled)
                    this.cpu.irqLine = 1;
                break;
        }
        this.tsto('set $' + addr.toString(16));
    };
    APU.prototype.step = function () {
        //The divider generates an output clock rate of just under 240 Hz, and appears to
        //be derived by dividing the 21.47727 MHz system clock by 89490. The sequencer is
        //clocked by the divider's output.
        this.idividerStep++;
        if (this.idividerStep === 89490)
            this.idividerStep = 0;
        if (this.idividerStep === 0) {
            this.clockSequencer();
        }
    };
    APU.prototype.clockSequencer = function () {
        if (this.isequencerStep === 1 || this.isequencerStep === 3) {
            if (!this.lc0Halt && this.lc0 > 0) {
                this.lc0--;
            }
        }
        if (!this.mode && !this.frameIRQDisabled) {
            if (this.cpu.irqLine && this.isequencerStep === 3)
                this.cpu.irqLine = 0;
            this.tsto('clockSequencer ' + this.isequencerStep);
        }
        this.isequencerStep = (this.isequencerStep + 1) % (4 + this.mode);
    };
    return APU;
})();
///<reference path="Memory.ts"/>
var CompoundMemory = (function () {
    function CompoundMemory() {
        var _this = this;
        var rgmemory = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rgmemory[_i - 0] = arguments[_i];
        }
        this.rgmemory = [];
        this.setters = [];
        this.getters = [];
        this.sizeI = 0;
        this.rgmemory = rgmemory;
        rgmemory.forEach(function (memory) { return _this.sizeI += memory.size(); });
    }
    CompoundMemory.prototype.size = function () {
        return this.sizeI;
    };
    CompoundMemory.prototype.shadowSetter = function (addrFirst, addrLast, setter) {
        this.setters.push({ addrFirst: addrFirst, addrLast: addrLast, setter: setter });
    };
    CompoundMemory.prototype.shadowGetter = function (addrFirst, addrLast, getter) {
        this.getters.push({ addrFirst: addrFirst, addrLast: addrLast, getter: getter });
    };
    CompoundMemory.prototype.getByte = function (addr) {
        for (var i = 0; i < this.getters.length; i++) {
            var getter = this.getters[i];
            if (getter.addrFirst <= addr && addr <= getter.addrLast) {
                return getter.getter(addr);
            }
        }
        for (var i = 0; i < this.rgmemory.length; i++) {
            var memory = this.rgmemory[i];
            if (addr < memory.size())
                return memory.getByte(addr);
            else
                addr -= memory.size();
        }
        throw 'address out of bounds';
    };
    CompoundMemory.prototype.setByte = function (addr, value) {
        //if (addr == 0x3c2) {
        //    console.log('xxx set', value.toString(16));
        //}
        for (var i = 0; i < this.setters.length; i++) {
            var setter = this.setters[i];
            if (setter.addrFirst <= addr && addr <= setter.addrLast) {
                setter.setter(addr, value);
                return;
            }
        }
        for (var i = 0; i < this.rgmemory.length; i++) {
            var memory = this.rgmemory[i];
            if (addr < memory.size()) {
                memory.setByte(addr, value);
                return;
            }
            else
                addr -= memory.size();
        }
    };
    return CompoundMemory;
})();
var ControllerKeys;
(function (ControllerKeys) {
    ControllerKeys[ControllerKeys["A_Key"] = 0] = "A_Key";
    ControllerKeys[ControllerKeys["B_Key"] = 1] = "B_Key";
    ControllerKeys[ControllerKeys["Select_Key"] = 2] = "Select_Key";
    ControllerKeys[ControllerKeys["Start_Key"] = 3] = "Start_Key";
    ControllerKeys[ControllerKeys["Up"] = 4] = "Up";
    ControllerKeys[ControllerKeys["Down"] = 5] = "Down";
    ControllerKeys[ControllerKeys["Left"] = 6] = "Left";
    ControllerKeys[ControllerKeys["Right"] = 7] = "Right";
})(ControllerKeys || (ControllerKeys = {}));
;
var Controller = (function () {
    function Controller(canvas) {
        this.s = 0;
        this.i = 0;
        this.keyStateA = [0, 0, 0, 0, 0, 0, 0, 0];
        this.keyStateB = [0, 0, 0, 0, 0, 0, 0, 0];
        canvas.tabIndex = 1;
        canvas.focus();
        canvas.addEventListener('keydown', this.onKeyDown.bind(this), false);
        canvas.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }
    Controller.prototype.onKeyDown = function (event) {
        switch (event.keyCode) {
            case 40:
                this.keyStateA[ControllerKeys.Down] = 1;
                break;
            case 38:
                this.keyStateA[ControllerKeys.Up] = 1;
                break;
            case 37:
                this.keyStateA[ControllerKeys.Left] = 1;
                break;
            case 39:
                this.keyStateA[ControllerKeys.Right] = 1;
                break;
            case 13:
                this.keyStateA[ControllerKeys.Start_Key] = 1;
                break;
            case 32:
                this.keyStateA[ControllerKeys.Select_Key] = 1;
                break;
            case 65:
                this.keyStateA[ControllerKeys.A_Key] = 1;
                break;
            case 66:
                this.keyStateA[ControllerKeys.B_Key] = 1;
                break;
        }
    };
    Controller.prototype.onKeyUp = function (event) {
        switch (event.keyCode) {
            case 40:
                this.keyStateA[ControllerKeys.Down] = 0;
                break;
            case 38:
                this.keyStateA[ControllerKeys.Up] = 0;
                break;
            case 37:
                this.keyStateA[ControllerKeys.Left] = 0;
                break;
            case 39:
                this.keyStateA[ControllerKeys.Right] = 0;
                break;
            case 13:
                this.keyStateA[ControllerKeys.Start_Key] = 0;
                break;
            case 32:
                this.keyStateA[ControllerKeys.Select_Key] = 0;
                break;
            case 65:
                this.keyStateA[ControllerKeys.A_Key] = 0;
                break;
            case 66:
                this.keyStateA[ControllerKeys.B_Key] = 0;
                break;
        }
    };
    Object.defineProperty(Controller.prototype, "reg4016", {
        /**
         * Front-loading NES $4016 and $4017, and Top-loading NES $4017
            7  bit  0
            ---- ----
            OOOx xxxD
            |||| ||||
            |||| |||+- Serial controller data
            |||+-+++-- Always 0
            +++------- Open bus
        */
        get: function () {
            if (this.s)
                return this.keyStateA[0];
            else {
                var r = this.keyStateA[this.i % 8];
                this.i++;
                return r;
            }
        },
        set: function (value) {
            this.s = value & 1;
            if (!this.s)
                this.i = 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Controller.prototype, "reg4017", {
        get: function () {
            if (this.s)
                return 0x40 | this.keyStateB[0];
            else if (this.i < 8)
                return 0x40 | this.keyStateB[this.i++];
            else
                return 0x40 | 1;
        },
        enumerable: true,
        configurable: true
    });
    return Controller;
})();
///<reference path="Memory.ts"/>
var RAM = (function () {
    function RAM(size) {
        this.memory = new Uint8Array(size);
    }
    RAM.fromBytes = function (memory) {
        var res = new RAM(0);
        res.memory = memory;
        return res;
    };
    RAM.prototype.size = function () {
        return this.memory.length;
    };
    RAM.prototype.getByte = function (addr) {
        return this.memory[addr];
    };
    RAM.prototype.setByte = function (addr, value) {
        this.memory[addr] = value & 0xff;
    };
    return RAM;
})();
var NesImage = (function () {
    function NesImage(rawBytes) {
        this.trainer = null;
        for (var i = 0; i < 4; i++)
            if (rawBytes[i] !== NesImage.magic[i])
                throw 'invalid NES header';
        this.ROMBanks = new Array(rawBytes[4]);
        this.VRAMBanks = new Array(rawBytes[5]);
        this.fVerticalMirroring = !!(rawBytes[6] & 1);
        this.fBatteryPackedRAM = !!(rawBytes[6] & 2);
        var fTrainer = !!(rawBytes[6] & 4);
        this.fFourScreenVRAM = !!(rawBytes[6] & 8);
        this.mapperType = (rawBytes[7] & 0xf0) + (rawBytes[6] >> 4);
        this.fVSSystem = !!(rawBytes[7] & 1);
        if ((rawBytes[7] & 0x0e) !== 0)
            throw 'invalid NES header';
        this.RAMBanks = new Array(Math.min(1, rawBytes[8]));
        this.fPAL = (rawBytes[9] & 1) === 1;
        if ((rawBytes[9] & 0xfe) !== 0)
            throw 'invalid NES header';
        for (var i = 0xa; i < 0x10; i++)
            if (rawBytes[i] !== 0)
                throw 'invalid NES header';
        if (rawBytes.length !== 0x10 + (fTrainer ? 0x100 : 0) + this.ROMBanks.length * 0x4000 + this.VRAMBanks.length * 0x2000)
            throw 'invalid NES format';
        var idx = 0x10;
        if (fTrainer) {
            this.trainer = rawBytes.slice(idx, idx + 0x100);
            idx += 0x100;
        }
        for (var ibank = 0; ibank < this.RAMBanks.length; ibank++) {
            this.RAMBanks[ibank] = new RAM(0x2000);
        }
        for (var ibank = 0; ibank < this.ROMBanks.length; ibank++) {
            this.ROMBanks[ibank] = ROM.fromBytes(rawBytes.slice(idx, idx + 0x4000));
            idx += 0x4000;
        }
        for (var ibank = 0; ibank < this.VRAMBanks.length; ibank++) {
            this.VRAMBanks[ibank] = ROM.fromBytes(rawBytes.slice(idx, idx + 0x2000));
            idx += 0x2000;
        }
    }
    /*
     * 0-3      String "NES^Z" used to recognize .NES files.
        4        Number of 16kB ROM banks.
        5        Number of 8kB VROM banks.
        6        bit 0     1 for vertical mirroring, 0 for horizontal mirroring.
                 bit 1     1 for battery-backed RAM at $6000-$7FFF.
                 bit 2     1 for a 512-byte trainer at $7000-$71FF.
                 bit 3     1 for a four-screen VRAM layout.
                 bit 4-7   Four lower bits of ROM Mapper Type.
        7        bit 0     1 for VS-System cartridges.
                 bit 1-3   Reserved, must be zeroes!
                 bit 4-7   Four higher bits of ROM Mapper Type.
        8        Number of 8kB RAM banks. For compatibility with the previous
                 versions of the .NES format, assume 1x8kB RAM page when this
                 byte is zero.
        9        bit 0     1 for PAL cartridges, otherwise assume NTSC.
                 bit 1-7   Reserved, must be zeroes!
        10-15    Reserved, must be zeroes!
        16-...   ROM banks, in ascending order. If a trainer is present, its
                 512 bytes precede the ROM bank contents.
        ...-EOF  VROM banks, in ascending order.
     */
    NesImage.magic = new Uint8Array([0x4e, 0x45, 0x53, 0x1a]);
    return NesImage;
})();
///<reference path="Memory.ts"/>
var Most6502Base = (function () {
    function Most6502Base(memory) {
        this.memory = memory;
        this.addrReset = 0xfffc;
        this.addrIRQ = 0xfffe;
        this.addrNMI = 0xfffa;
        this.ip = 0;
        this.ipCur = 0;
        this.sp = 0;
        this.t = 0;
        this.b = 0;
        this.rA = 0;
        this.rX = 0;
        this.rY = 0;
        this.nmiLine = 1;
        this.nmiLinePrev = 1;
        this.nmiRequested = false;
        this.irqLine = 1;
        this.irqRequested = false;
        this.flgCarry = 0;
        this.flgZero = 0;
        this.flgNegative = 0;
        this.flgOverflow = 0;
        this.flgInterruptDisable = 1;
        this.flgDecimalMode = 0;
        this.flgBreakCommand = 0;
        this.enablePCIncrement = true;
        this.enableInterruptPoll = true;
        this.canSetFlgBreak = true;
        this.icycle = 0;
        this.opcodes = [];
        this.opcodes[105] = this.op0x69;
        this.opcodes[101] = this.op0x65;
        this.opcodes[117] = this.op0x75;
        this.opcodes[109] = this.op0x6d;
        this.opcodes[125] = this.op0x7d;
        this.opcodes[121] = this.op0x79;
        this.opcodes[97] = this.op0x61;
        this.opcodes[113] = this.op0x71;
        this.opcodes[41] = this.op0x29;
        this.opcodes[37] = this.op0x25;
        this.opcodes[53] = this.op0x35;
        this.opcodes[45] = this.op0x2d;
        this.opcodes[61] = this.op0x3d;
        this.opcodes[57] = this.op0x39;
        this.opcodes[33] = this.op0x21;
        this.opcodes[49] = this.op0x31;
        this.opcodes[10] = this.op0xa;
        this.opcodes[6] = this.op0x6;
        this.opcodes[22] = this.op0x16;
        this.opcodes[14] = this.op0xe;
        this.opcodes[30] = this.op0x1e;
        this.opcodes[144] = this.op0x90;
        this.opcodes[176] = this.op0xb0;
        this.opcodes[240] = this.op0xf0;
        this.opcodes[48] = this.op0x30;
        this.opcodes[208] = this.op0xd0;
        this.opcodes[16] = this.op0x10;
        this.opcodes[80] = this.op0x50;
        this.opcodes[112] = this.op0x70;
        this.opcodes[36] = this.op0x24;
        this.opcodes[44] = this.op0x2c;
        this.opcodes[24] = this.op0x18;
        this.opcodes[216] = this.op0xd8;
        this.opcodes[88] = this.op0x58;
        this.opcodes[184] = this.op0xb8;
        this.opcodes[201] = this.op0xc9;
        this.opcodes[197] = this.op0xc5;
        this.opcodes[213] = this.op0xd5;
        this.opcodes[205] = this.op0xcd;
        this.opcodes[221] = this.op0xdd;
        this.opcodes[217] = this.op0xd9;
        this.opcodes[193] = this.op0xc1;
        this.opcodes[209] = this.op0xd1;
        this.opcodes[224] = this.op0xe0;
        this.opcodes[228] = this.op0xe4;
        this.opcodes[236] = this.op0xec;
        this.opcodes[192] = this.op0xc0;
        this.opcodes[196] = this.op0xc4;
        this.opcodes[204] = this.op0xcc;
        this.opcodes[198] = this.op0xc6;
        this.opcodes[214] = this.op0xd6;
        this.opcodes[206] = this.op0xce;
        this.opcodes[222] = this.op0xde;
        this.opcodes[202] = this.op0xca;
        this.opcodes[136] = this.op0x88;
        this.opcodes[230] = this.op0xe6;
        this.opcodes[246] = this.op0xf6;
        this.opcodes[238] = this.op0xee;
        this.opcodes[254] = this.op0xfe;
        this.opcodes[232] = this.op0xe8;
        this.opcodes[200] = this.op0xc8;
        this.opcodes[73] = this.op0x49;
        this.opcodes[69] = this.op0x45;
        this.opcodes[85] = this.op0x55;
        this.opcodes[77] = this.op0x4d;
        this.opcodes[93] = this.op0x5d;
        this.opcodes[89] = this.op0x59;
        this.opcodes[65] = this.op0x41;
        this.opcodes[81] = this.op0x51;
        this.opcodes[76] = this.op0x4c;
        this.opcodes[108] = this.op0x6c;
        this.opcodes[169] = this.op0xa9;
        this.opcodes[165] = this.op0xa5;
        this.opcodes[181] = this.op0xb5;
        this.opcodes[173] = this.op0xad;
        this.opcodes[189] = this.op0xbd;
        this.opcodes[185] = this.op0xb9;
        this.opcodes[161] = this.op0xa1;
        this.opcodes[177] = this.op0xb1;
        this.opcodes[162] = this.op0xa2;
        this.opcodes[166] = this.op0xa6;
        this.opcodes[182] = this.op0xb6;
        this.opcodes[174] = this.op0xae;
        this.opcodes[190] = this.op0xbe;
        this.opcodes[160] = this.op0xa0;
        this.opcodes[164] = this.op0xa4;
        this.opcodes[180] = this.op0xb4;
        this.opcodes[172] = this.op0xac;
        this.opcodes[188] = this.op0xbc;
        this.opcodes[74] = this.op0x4a;
        this.opcodes[70] = this.op0x46;
        this.opcodes[86] = this.op0x56;
        this.opcodes[78] = this.op0x4e;
        this.opcodes[94] = this.op0x5e;
        this.opcodes[234] = this.op0xea;
        this.opcodes[9] = this.op0x9;
        this.opcodes[5] = this.op0x5;
        this.opcodes[21] = this.op0x15;
        this.opcodes[13] = this.op0xd;
        this.opcodes[29] = this.op0x1d;
        this.opcodes[25] = this.op0x19;
        this.opcodes[1] = this.op0x1;
        this.opcodes[17] = this.op0x11;
        this.opcodes[72] = this.op0x48;
        this.opcodes[8] = this.op0x8;
        this.opcodes[104] = this.op0x68;
        this.opcodes[40] = this.op0x28;
        this.opcodes[42] = this.op0x2a;
        this.opcodes[38] = this.op0x26;
        this.opcodes[54] = this.op0x36;
        this.opcodes[46] = this.op0x2e;
        this.opcodes[62] = this.op0x3e;
        this.opcodes[106] = this.op0x6a;
        this.opcodes[102] = this.op0x66;
        this.opcodes[118] = this.op0x76;
        this.opcodes[110] = this.op0x6e;
        this.opcodes[126] = this.op0x7e;
        this.opcodes[0] = this.op0x0;
        this.opcodes[64] = this.op0x40;
        this.opcodes[233] = this.op0xe9;
        this.opcodes[229] = this.op0xe5;
        this.opcodes[245] = this.op0xf5;
        this.opcodes[237] = this.op0xed;
        this.opcodes[253] = this.op0xfd;
        this.opcodes[249] = this.op0xf9;
        this.opcodes[225] = this.op0xe1;
        this.opcodes[241] = this.op0xf1;
        this.opcodes[56] = this.op0x38;
        this.opcodes[248] = this.op0xf8;
        this.opcodes[120] = this.op0x78;
        this.opcodes[133] = this.op0x85;
        this.opcodes[149] = this.op0x95;
        this.opcodes[141] = this.op0x8d;
        this.opcodes[157] = this.op0x9d;
        this.opcodes[153] = this.op0x99;
        this.opcodes[129] = this.op0x81;
        this.opcodes[145] = this.op0x91;
        this.opcodes[134] = this.op0x86;
        this.opcodes[150] = this.op0x96;
        this.opcodes[142] = this.op0x8e;
        this.opcodes[132] = this.op0x84;
        this.opcodes[148] = this.op0x94;
        this.opcodes[140] = this.op0x8c;
        this.opcodes[170] = this.op0xaa;
        this.opcodes[168] = this.op0xa8;
        this.opcodes[186] = this.op0xba;
        this.opcodes[138] = this.op0x8a;
        this.opcodes[154] = this.op0x9a;
        this.opcodes[152] = this.op0x98;
        this.opcodes[32] = this.op0x20;
        this.opcodes[96] = this.op0x60;
        this.opcodes[26] = this.op0x1a;
        this.opcodes[58] = this.op0x3a;
        this.opcodes[90] = this.op0x5a;
        this.opcodes[122] = this.op0x7a;
        this.opcodes[218] = this.op0xda;
        this.opcodes[250] = this.op0xfa;
        this.opcodes[4] = this.op0x4;
        this.opcodes[20] = this.op0x14;
        this.opcodes[52] = this.op0x34;
        this.opcodes[68] = this.op0x44;
        this.opcodes[84] = this.op0x54;
        this.opcodes[116] = this.op0x74;
        this.opcodes[212] = this.op0xd4;
        this.opcodes[244] = this.op0xf4;
        this.opcodes[100] = this.op0x64;
        this.opcodes[128] = this.op0x80;
        this.opcodes[130] = this.op0x82;
        this.opcodes[194] = this.op0xc2;
        this.opcodes[226] = this.op0xe2;
        this.opcodes[137] = this.op0x89;
        this.opcodes[12] = this.op0xc;
        this.opcodes[28] = this.op0x1c;
        this.opcodes[60] = this.op0x3c;
        this.opcodes[92] = this.op0x5c;
        this.opcodes[124] = this.op0x7c;
        this.opcodes[220] = this.op0xdc;
        this.opcodes[252] = this.op0xfc;
        this.opcodes[235] = this.op0xeb;
        this.opcodes[195] = this.op0xc3;
        this.opcodes[199] = this.op0xc7;
        this.opcodes[207] = this.op0xcf;
        this.opcodes[211] = this.op0xd3;
        this.opcodes[215] = this.op0xd7;
        this.opcodes[219] = this.op0xdb;
        this.opcodes[223] = this.op0xdf;
        this.opcodes[227] = this.op0xe3;
        this.opcodes[231] = this.op0xe7;
        this.opcodes[239] = this.op0xef;
        this.opcodes[243] = this.op0xf3;
        this.opcodes[247] = this.op0xf7;
        this.opcodes[251] = this.op0xfb;
        this.opcodes[255] = this.op0xff;
        this.opcodes[171] = this.op0xab;
        this.opcodes[167] = this.op0xa7;
        this.opcodes[183] = this.op0xb7;
        this.opcodes[175] = this.op0xaf;
        this.opcodes[191] = this.op0xbf;
        this.opcodes[163] = this.op0xa3;
        this.opcodes[179] = this.op0xb3;
        this.opcodes[131] = this.op0x83;
        this.opcodes[135] = this.op0x87;
        this.opcodes[143] = this.op0x8f;
        this.opcodes[151] = this.op0x97;
        this.opcodes[3] = this.op0x3;
        this.opcodes[7] = this.op0x7;
        this.opcodes[15] = this.op0xf;
        this.opcodes[19] = this.op0x13;
        this.opcodes[23] = this.op0x17;
        this.opcodes[27] = this.op0x1b;
        this.opcodes[31] = this.op0x1f;
        this.opcodes[35] = this.op0x23;
        this.opcodes[39] = this.op0x27;
        this.opcodes[47] = this.op0x2f;
        this.opcodes[51] = this.op0x33;
        this.opcodes[55] = this.op0x37;
        this.opcodes[59] = this.op0x3b;
        this.opcodes[63] = this.op0x3f;
        this.opcodes[99] = this.op0x63;
        this.opcodes[103] = this.op0x67;
        this.opcodes[111] = this.op0x6f;
        this.opcodes[115] = this.op0x73;
        this.opcodes[119] = this.op0x77;
        this.opcodes[123] = this.op0x7b;
        this.opcodes[127] = this.op0x7f;
        this.opcodes[67] = this.op0x43;
        this.opcodes[71] = this.op0x47;
        this.opcodes[79] = this.op0x4f;
        this.opcodes[83] = this.op0x53;
        this.opcodes[87] = this.op0x57;
        this.opcodes[91] = this.op0x5b;
        this.opcodes[95] = this.op0x5f;
        this.opcodes[11] = this.op0xb;
        this.opcodes[43] = this.op0x2b;
        this.opcodes[75] = this.op0x4b;
        this.opcodes[107] = this.op0x6b;
        this.opcodes[203] = this.op0xcb;
        this.opcodes[156] = this.op0x9c;
        this.opcodes[158] = this.op0x9e;
        this.opcodes[139] = this.op0x8b;
        this.opcodes[147] = this.op0x93;
        this.opcodes[155] = this.op0x9b;
        this.opcodes[159] = this.op0x9f;
        this.opcodes[187] = this.op0xbb;
    }
    Most6502Base.prototype.pollInterrupts = function () {
        if (this.nmiDetected) {
            this.nmiRequested = true;
            this.nmiDetected = false;
        }
        if (this.irqDetected) {
            //console.log('irq requested');
            this.irqRequested = true;
        }
    };
    Most6502Base.prototype.detectInterrupts = function () {
        if (this.nmiLinePrev === 1 && this.nmiLine === 0) {
            this.nmiDetected = true;
        }
        this.nmiLinePrev = this.nmiLine;
        this.irqDetected = !this.irqLine && !this.flgInterruptDisable;
    };
    Most6502Base.prototype.pushByte = function (byte) {
        this.memory.setByte(0x100 + this.sp, byte & 0xff);
        this.sp = this.sp === 0 ? 0xff : this.sp - 1;
    };
    Most6502Base.prototype.popByte = function () {
        this.sp = this.sp === 0xff ? 0 : this.sp + 1;
        return this.memory.getByte(0x100 + this.sp);
    };
    Object.defineProperty(Most6502Base.prototype, "rP", {
        get: function () {
            return (this.flgNegative << 7) +
                (this.flgOverflow << 6) +
                (1 << 5) +
                (this.flgBreakCommand << 4) +
                (this.flgDecimalMode << 3) +
                (this.flgInterruptDisable << 2) +
                (this.flgZero << 1) +
                (this.flgCarry << 0);
        },
        set: function (byte) {
            this.flgNegative = (byte >> 7) & 1;
            this.flgOverflow = (byte >> 6) & 1;
            //skip (byte >> 5) & 1;
            //skip this.flgBreakCommand = (byte >> 4) & 1;
            this.flgBreakCommand = 0;
            this.flgDecimalMode = (byte >> 3) & 1;
            this.flgInterruptDisable = (byte >> 2) & 1;
            this.flgZero = (byte >> 1) & 1;
            this.flgCarry = (byte >> 0) & 1;
        },
        enumerable: true,
        configurable: true
    });
    Most6502Base.prototype.trace = function (opcode) {
    };
    Most6502Base.prototype.clk = function () {
        this.icycle++;
        if (this.t === 0) {
            if (this.nmiRequested || this.irqRequested) {
                this.canSetFlgBreak = false;
                //console.log('processing irq/nmi');
                this.enablePCIncrement = false;
                this.opcode = 0;
            }
            else {
                this.opcode = this.memory.getByte(this.ip);
            }
            this.ipCur = this.ip;
            this.trace(this.opcode);
            this.addr = this.addrHi = this.addrLo = this.addrPtr = this.ptrLo = this.ptrHi = this.ipC = this.addrC = 0;
        }
        this.opcodes[this.opcode].call(this);
        if (this.t === 0 && this.opcode !== 0x0) {
            if (this.enableInterruptPoll)
                this.pollInterrupts();
            this.enableInterruptPoll = true;
        }
        this.detectInterrupts();
    };
    /* ADC Immediate 2 */
    Most6502Base.prototype.op0x69 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ADC ZeroPage 3 */
    Most6502Base.prototype.op0x65 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ADC ZeroPageX 4 */
    Most6502Base.prototype.op0x75 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ADC Absolute 4 */
    Most6502Base.prototype.op0x6d = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ADC AbsoluteX 4pc  */
    Most6502Base.prototype.op0x7d = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    var sum = this.rA + this.b + this.flgCarry;
                    var bothPositive = this.b < 128 && this.rA < 128;
                    var bothNegative = this.b >= 128 && this.rA >= 128;
                    this.flgCarry = sum > 255 ? 1 : 0;
                    this.b = sum & 255;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.flgZero = this.b === 0 ? 1 : 0;
                    this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ADC AbsoluteY 4pc  */
    Most6502Base.prototype.op0x79 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    var sum = this.rA + this.b + this.flgCarry;
                    var bothPositive = this.b < 128 && this.rA < 128;
                    var bothNegative = this.b >= 128 && this.rA >= 128;
                    this.flgCarry = sum > 255 ? 1 : 0;
                    this.b = sum & 255;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.flgZero = this.b === 0 ? 1 : 0;
                    this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ADC IndirectX 6 */
    Most6502Base.prototype.op0x61 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ADC IndirectY 5pc  */
    Most6502Base.prototype.op0x71 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    var sum = this.rA + this.b + this.flgCarry;
                    var bothPositive = this.b < 128 && this.rA < 128;
                    var bothNegative = this.b >= 128 && this.rA >= 128;
                    this.flgCarry = sum > 255 ? 1 : 0;
                    this.b = sum & 255;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.flgZero = this.b === 0 ? 1 : 0;
                    this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* AND Immediate 2 */
    Most6502Base.prototype.op0x29 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* AND ZeroPage 3 */
    Most6502Base.prototype.op0x25 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* AND ZeroPageX 4 */
    Most6502Base.prototype.op0x35 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* AND Absolute 4 */
    Most6502Base.prototype.op0x2d = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* AND AbsoluteX 4pc  */
    Most6502Base.prototype.op0x3d = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b &= this.rA;
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* AND AbsoluteY 4pc  */
    Most6502Base.prototype.op0x39 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b &= this.rA;
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* AND IndirectX 6 */
    Most6502Base.prototype.op0x21 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* AND IndirectY 5pc  */
    Most6502Base.prototype.op0x31 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b &= this.rA;
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ASL Accumulator 2 */
    Most6502Base.prototype.op0xa = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rA;
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ASL ZeroPage 5 */
    Most6502Base.prototype.op0x6 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ASL ZeroPageX 6 */
    Most6502Base.prototype.op0x16 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ASL Absolute 6 */
    Most6502Base.prototype.op0xe = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ASL AbsoluteX 7 */
    Most6502Base.prototype.op0x1e = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* BCC Relative 2pc bc  */
    Most6502Base.prototype.op0x90 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.pollInterrupts();
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                if (!this.flgCarry) {
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 2: {
                this.memory.getByte(this.ip);
                this.b = this.b >= 128 ? this.b - 256 : this.b;
                this.ipC = ((this.ip & 0xff) + this.b) >> 8;
                if (((this.ip & 0xff) + this.b) >> 8) {
                    this.t++;
                }
                else {
                    this.enableInterruptPoll = false;
                    this.ip = (this.ip + this.b) & 0xffff;
                    this.t = 0;
                }
                break;
            }
            case 3: {
                this.ip = (this.ip + this.b) & 0xffff;
                this.t = 0;
                break;
            }
        }
    };
    /* BCS Relative 2pc bc  */
    Most6502Base.prototype.op0xb0 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.pollInterrupts();
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                if (this.flgCarry) {
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 2: {
                this.memory.getByte(this.ip);
                this.b = this.b >= 128 ? this.b - 256 : this.b;
                this.ipC = ((this.ip & 0xff) + this.b) >> 8;
                if (((this.ip & 0xff) + this.b) >> 8) {
                    this.t++;
                }
                else {
                    this.enableInterruptPoll = false;
                    this.ip = (this.ip + this.b) & 0xffff;
                    this.t = 0;
                }
                break;
            }
            case 3: {
                this.ip = (this.ip + this.b) & 0xffff;
                this.t = 0;
                break;
            }
        }
    };
    /* BEQ Relative 2pc bc  */
    Most6502Base.prototype.op0xf0 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.pollInterrupts();
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                if (this.flgZero) {
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 2: {
                this.memory.getByte(this.ip);
                this.b = this.b >= 128 ? this.b - 256 : this.b;
                this.ipC = ((this.ip & 0xff) + this.b) >> 8;
                if (((this.ip & 0xff) + this.b) >> 8) {
                    this.t++;
                }
                else {
                    this.enableInterruptPoll = false;
                    this.ip = (this.ip + this.b) & 0xffff;
                    this.t = 0;
                }
                break;
            }
            case 3: {
                this.ip = (this.ip + this.b) & 0xffff;
                this.t = 0;
                break;
            }
        }
    };
    /* BMI Relative 2pc bc  */
    Most6502Base.prototype.op0x30 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.pollInterrupts();
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                if (this.flgNegative) {
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 2: {
                this.memory.getByte(this.ip);
                this.b = this.b >= 128 ? this.b - 256 : this.b;
                this.ipC = ((this.ip & 0xff) + this.b) >> 8;
                if (((this.ip & 0xff) + this.b) >> 8) {
                    this.t++;
                }
                else {
                    this.enableInterruptPoll = false;
                    this.ip = (this.ip + this.b) & 0xffff;
                    this.t = 0;
                }
                break;
            }
            case 3: {
                this.ip = (this.ip + this.b) & 0xffff;
                this.t = 0;
                break;
            }
        }
    };
    /* BNE Relative 2pc bc  */
    Most6502Base.prototype.op0xd0 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.pollInterrupts();
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                if (!this.flgZero) {
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 2: {
                this.memory.getByte(this.ip);
                this.b = this.b >= 128 ? this.b - 256 : this.b;
                this.ipC = ((this.ip & 0xff) + this.b) >> 8;
                if (((this.ip & 0xff) + this.b) >> 8) {
                    this.t++;
                }
                else {
                    this.enableInterruptPoll = false;
                    this.ip = (this.ip + this.b) & 0xffff;
                    this.t = 0;
                }
                break;
            }
            case 3: {
                this.ip = (this.ip + this.b) & 0xffff;
                this.t = 0;
                break;
            }
        }
    };
    /* BPL Relative 2pc bc  */
    Most6502Base.prototype.op0x10 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.pollInterrupts();
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                if (!this.flgNegative) {
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 2: {
                this.memory.getByte(this.ip);
                this.b = this.b >= 128 ? this.b - 256 : this.b;
                this.ipC = ((this.ip & 0xff) + this.b) >> 8;
                if (((this.ip & 0xff) + this.b) >> 8) {
                    this.t++;
                }
                else {
                    this.enableInterruptPoll = false;
                    this.ip = (this.ip + this.b) & 0xffff;
                    this.t = 0;
                }
                break;
            }
            case 3: {
                this.ip = (this.ip + this.b) & 0xffff;
                this.t = 0;
                break;
            }
        }
    };
    /* BVC Relative 2pc bc  */
    Most6502Base.prototype.op0x50 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.pollInterrupts();
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                if (!this.flgOverflow) {
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 2: {
                this.memory.getByte(this.ip);
                this.b = this.b >= 128 ? this.b - 256 : this.b;
                this.ipC = ((this.ip & 0xff) + this.b) >> 8;
                if (((this.ip & 0xff) + this.b) >> 8) {
                    this.t++;
                }
                else {
                    this.enableInterruptPoll = false;
                    this.ip = (this.ip + this.b) & 0xffff;
                    this.t = 0;
                }
                break;
            }
            case 3: {
                this.ip = (this.ip + this.b) & 0xffff;
                this.t = 0;
                break;
            }
        }
    };
    /* BVS Relative 2pc bc  */
    Most6502Base.prototype.op0x70 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.pollInterrupts();
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                if (this.flgOverflow) {
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 2: {
                this.memory.getByte(this.ip);
                this.b = this.b >= 128 ? this.b - 256 : this.b;
                this.ipC = ((this.ip & 0xff) + this.b) >> 8;
                if (((this.ip & 0xff) + this.b) >> 8) {
                    this.t++;
                }
                else {
                    this.enableInterruptPoll = false;
                    this.ip = (this.ip + this.b) & 0xffff;
                    this.t = 0;
                }
                break;
            }
            case 3: {
                this.ip = (this.ip + this.b) & 0xffff;
                this.t = 0;
                break;
            }
        }
    };
    /* BIT ZeroPage 3 */
    Most6502Base.prototype.op0x24 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.flgOverflow = this.b & 64 ? 1 : 0;
                this.flgZero = !(this.rA & this.b) ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* BIT Absolute 4 */
    Most6502Base.prototype.op0x2c = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.flgOverflow = this.b & 64 ? 1 : 0;
                this.flgZero = !(this.rA & this.b) ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CLC Implied 2 */
    Most6502Base.prototype.op0x18 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.flgCarry = 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CLD Implied 2 */
    Most6502Base.prototype.op0xd8 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.flgDecimalMode = 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CLI Implied 2 */
    Most6502Base.prototype.op0x58 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.flgInterruptDisable = 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CLV Implied 2 */
    Most6502Base.prototype.op0xb8 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.flgOverflow = 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CMP Immediate 2 */
    Most6502Base.prototype.op0xc9 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CMP ZeroPage 3 */
    Most6502Base.prototype.op0xc5 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CMP ZeroPageX 4 */
    Most6502Base.prototype.op0xd5 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CMP Absolute 4 */
    Most6502Base.prototype.op0xcd = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CMP AbsoluteX 4pc  */
    Most6502Base.prototype.op0xdd = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgCarry = this.rA >= this.b ? 1 : 0;
                    this.flgZero = this.rA === this.b ? 1 : 0;
                    this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CMP AbsoluteY 4pc  */
    Most6502Base.prototype.op0xd9 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgCarry = this.rA >= this.b ? 1 : 0;
                    this.flgZero = this.rA === this.b ? 1 : 0;
                    this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CMP IndirectX 6 */
    Most6502Base.prototype.op0xc1 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CMP IndirectY 5pc  */
    Most6502Base.prototype.op0xd1 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgCarry = this.rA >= this.b ? 1 : 0;
                    this.flgZero = this.rA === this.b ? 1 : 0;
                    this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                    this.t = 0;
                }
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CPX Immediate 2 */
    Most6502Base.prototype.op0xe0 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.flgCarry = this.rX >= this.b ? 1 : 0;
                this.flgZero = this.rX === this.b ? 1 : 0;
                this.flgNegative = (this.rX - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CPX ZeroPage 3 */
    Most6502Base.prototype.op0xe4 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rX >= this.b ? 1 : 0;
                this.flgZero = this.rX === this.b ? 1 : 0;
                this.flgNegative = (this.rX - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CPX Absolute 4 */
    Most6502Base.prototype.op0xec = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rX >= this.b ? 1 : 0;
                this.flgZero = this.rX === this.b ? 1 : 0;
                this.flgNegative = (this.rX - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CPY Immediate 2 */
    Most6502Base.prototype.op0xc0 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.flgCarry = this.rY >= this.b ? 1 : 0;
                this.flgZero = this.rY === this.b ? 1 : 0;
                this.flgNegative = (this.rY - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CPY ZeroPage 3 */
    Most6502Base.prototype.op0xc4 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rY >= this.b ? 1 : 0;
                this.flgZero = this.rY === this.b ? 1 : 0;
                this.flgNegative = (this.rY - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* CPY Absolute 4 */
    Most6502Base.prototype.op0xcc = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgCarry = this.rY >= this.b ? 1 : 0;
                this.flgZero = this.rY === this.b ? 1 : 0;
                this.flgNegative = (this.rY - this.b) & 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* DEC ZeroPage 5 */
    Most6502Base.prototype.op0xc6 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.b = (this.b - 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DEC ZeroPageX 6 */
    Most6502Base.prototype.op0xd6 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b - 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DEC Absolute 6 */
    Most6502Base.prototype.op0xce = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b - 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DEC AbsoluteX 7 */
    Most6502Base.prototype.op0xde = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b = (this.b - 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DEX Accumulator 2 */
    Most6502Base.prototype.op0xca = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rX;
                this.b = (this.b - 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* DEY Accumulator 2 */
    Most6502Base.prototype.op0x88 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rY;
                this.b = (this.b - 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.rY = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* INC ZeroPage 5 */
    Most6502Base.prototype.op0xe6 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* INC ZeroPageX 6 */
    Most6502Base.prototype.op0xf6 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* INC Absolute 6 */
    Most6502Base.prototype.op0xee = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* INC AbsoluteX 7 */
    Most6502Base.prototype.op0xfe = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* INX Accumulator 2 */
    Most6502Base.prototype.op0xe8 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rX;
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* INY Accumulator 2 */
    Most6502Base.prototype.op0xc8 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rY;
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.rY = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* EOR Immediate 2 */
    Most6502Base.prototype.op0x49 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* EOR ZeroPage 3 */
    Most6502Base.prototype.op0x45 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* EOR ZeroPageX 4 */
    Most6502Base.prototype.op0x55 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* EOR Absolute 4 */
    Most6502Base.prototype.op0x4d = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* EOR AbsoluteX 4pc  */
    Most6502Base.prototype.op0x5d = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b ^= this.rA;
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* EOR AbsoluteY 4pc  */
    Most6502Base.prototype.op0x59 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b ^= this.rA;
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* EOR IndirectX 6 */
    Most6502Base.prototype.op0x41 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* EOR IndirectY 5pc  */
    Most6502Base.prototype.op0x51 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b ^= this.rA;
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* JMP Absolute 3 */
    Most6502Base.prototype.op0x4c = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.ip = (this.addrHi << 8) + this.addrLo;
                this.t = 0;
                break;
            }
        }
    };
    /* JMP AbsoluteIndirect 5 */
    Most6502Base.prototype.op0x6c = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.ptrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.ptrHi = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte((this.ptrHi << 8) + this.ptrLo);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.ptrHi << 8) + ((this.ptrLo + 1) & 0xff));
                this.ip = (this.addrHi << 8) + this.addrLo;
                this.t = 0;
                break;
            }
        }
    };
    /* LDA Immediate 2 */
    Most6502Base.prototype.op0xa9 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDA ZeroPage 3 */
    Most6502Base.prototype.op0xa5 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDA ZeroPageX 4 */
    Most6502Base.prototype.op0xb5 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDA Absolute 4 */
    Most6502Base.prototype.op0xad = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDA AbsoluteX 4pc  */
    Most6502Base.prototype.op0xbd = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b & 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDA AbsoluteY 4pc  */
    Most6502Base.prototype.op0xb9 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b & 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDA IndirectX 6 */
    Most6502Base.prototype.op0xa1 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDA IndirectY 5pc  */
    Most6502Base.prototype.op0xb1 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b & 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDX Immediate 2 */
    Most6502Base.prototype.op0xa2 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDX ZeroPage 3 */
    Most6502Base.prototype.op0xa6 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDX ZeroPageY 4 */
    Most6502Base.prototype.op0xb6 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rY + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDX Absolute 4 */
    Most6502Base.prototype.op0xae = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDX AbsoluteY 4pc  */
    Most6502Base.prototype.op0xbe = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b & 128 ? 1 : 0;
                    this.rX = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDY Immediate 2 */
    Most6502Base.prototype.op0xa0 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rY = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDY ZeroPage 3 */
    Most6502Base.prototype.op0xa4 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rY = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDY ZeroPageX 4 */
    Most6502Base.prototype.op0xb4 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rY = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDY Absolute 4 */
    Most6502Base.prototype.op0xac = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rY = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LDY AbsoluteX 4pc  */
    Most6502Base.prototype.op0xbc = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b & 128 ? 1 : 0;
                    this.rY = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rY = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LSR Accumulator 2 */
    Most6502Base.prototype.op0x4a = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rA;
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LSR ZeroPage 5 */
    Most6502Base.prototype.op0x46 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* LSR ZeroPageX 6 */
    Most6502Base.prototype.op0x56 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* LSR Absolute 6 */
    Most6502Base.prototype.op0x4e = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* LSR AbsoluteX 7 */
    Most6502Base.prototype.op0x5e = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Implied 2 */
    Most6502Base.prototype.op0xea = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t = 0;
                break;
            }
        }
    };
    /* ORA Immediate 2 */
    Most6502Base.prototype.op0x9 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ORA ZeroPage 3 */
    Most6502Base.prototype.op0x5 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ORA ZeroPageX 4 */
    Most6502Base.prototype.op0x15 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ORA Absolute 4 */
    Most6502Base.prototype.op0xd = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ORA AbsoluteX 4pc  */
    Most6502Base.prototype.op0x1d = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b |= this.rA;
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ORA AbsoluteY 4pc  */
    Most6502Base.prototype.op0x19 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b |= this.rA;
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ORA IndirectX 6 */
    Most6502Base.prototype.op0x1 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ORA IndirectY 5pc  */
    Most6502Base.prototype.op0x11 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b |= this.rA;
                    this.flgZero = !this.b ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* PHA Implied 3 */
    Most6502Base.prototype.op0x48 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t++;
                break;
            }
            case 2: {
                this.pushByte(this.rA);
                this.t = 0;
                break;
            }
        }
    };
    /* PHP Implied 3 */
    Most6502Base.prototype.op0x8 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t++;
                break;
            }
            case 2: {
                this.flgBreakCommand = 1;
                this.pushByte(this.rP);
                this.flgBreakCommand = 0;
                this.t = 0;
                break;
            }
        }
    };
    /* PLA Implied 4 */
    Most6502Base.prototype.op0x68 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t++;
                break;
            }
            case 2: {
                this.t++;
                break;
            }
            case 3: {
                this.rA = this.popByte();
                this.flgZero = this.rA === 0 ? 1 : 0;
                this.flgNegative = this.rA >= 128 ? 1 : 0;
                this.t = 0;
                break;
            }
        }
    };
    /* PLP Implied 4 */
    Most6502Base.prototype.op0x28 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t++;
                break;
            }
            case 2: {
                this.t++;
                break;
            }
            case 3: {
                this.rP = this.popByte();
                this.t = 0;
                break;
            }
        }
    };
    /* ROL Accumulator 2 */
    Most6502Base.prototype.op0x2a = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rA;
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ROL ZeroPage 5 */
    Most6502Base.prototype.op0x26 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ROL ZeroPageX 6 */
    Most6502Base.prototype.op0x36 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ROL Absolute 6 */
    Most6502Base.prototype.op0x2e = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ROL AbsoluteX 7 */
    Most6502Base.prototype.op0x3e = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ROR Accumulator 2 */
    Most6502Base.prototype.op0x6a = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rA;
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ROR ZeroPage 5 */
    Most6502Base.prototype.op0x66 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ROR ZeroPageX 6 */
    Most6502Base.prototype.op0x76 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ROR Absolute 6 */
    Most6502Base.prototype.op0x6e = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ROR AbsoluteX 7 */
    Most6502Base.prototype.op0x7e = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* BRK BRK 7 */
    Most6502Base.prototype.op0x0 = function () {
        switch (this.t) {
            case 0: {
                if (this.enablePCIncrement)
                    this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                if (this.enablePCIncrement)
                    this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.pushByte(this.ip >> 8);
                this.t++;
                break;
            }
            case 3: {
                this.pushByte(this.ip & 0xff);
                this.t++;
                break;
            }
            case 4: {
                this.pollInterrupts();
                var nmi = this.nmiRequested;
                this.addrBrk = nmi ? this.addrNMI : this.addrIRQ;
                this.irqRequested = false;
                this.nmiRequested = false;
                if (this.canSetFlgBreak)
                    this.flgBreakCommand = 1;
                this.pushByte(this.rP);
                this.flgBreakCommand = 0;
                this.t++;
                break;
            }
            case 5: {
                this.ip = this.memory.getByte(this.addrBrk);
                this.flgInterruptDisable = 1;
                this.t++;
                break;
            }
            case 6: {
                this.ip += this.memory.getByte(this.addrBrk + 1) << 8;
                this.enablePCIncrement = true;
                this.canSetFlgBreak = true;
                this.t = 0;
                break;
            }
        }
    };
    /* RTI RTI 6 */
    Most6502Base.prototype.op0x40 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t++;
                break;
            }
            case 2: {
                this.t++;
                break;
            }
            case 3: {
                this.rP = this.popByte();
                this.t++;
                break;
            }
            case 4: {
                this.ip = this.popByte();
                this.t++;
                break;
            }
            case 5: {
                this.ip |= this.popByte() << 8;
                this.t = 0;
                break;
            }
        }
    };
    /* SBC Immediate 2 */
    Most6502Base.prototype.op0xe9 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SBC ZeroPage 3 */
    Most6502Base.prototype.op0xe5 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SBC ZeroPageX 4 */
    Most6502Base.prototype.op0xf5 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SBC Absolute 4 */
    Most6502Base.prototype.op0xed = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SBC AbsoluteX 4pc  */
    Most6502Base.prototype.op0xfd = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b = 255 - this.b;
                    var sum = this.rA + this.b + this.flgCarry;
                    var bothPositive = this.b < 128 && this.rA < 128;
                    var bothNegative = this.b >= 128 && this.rA >= 128;
                    this.flgCarry = sum > 255 ? 1 : 0;
                    this.b = sum & 255;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.flgZero = this.b === 0 ? 1 : 0;
                    this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SBC AbsoluteY 4pc  */
    Most6502Base.prototype.op0xf9 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b = 255 - this.b;
                    var sum = this.rA + this.b + this.flgCarry;
                    var bothPositive = this.b < 128 && this.rA < 128;
                    var bothNegative = this.b >= 128 && this.rA >= 128;
                    this.flgCarry = sum > 255 ? 1 : 0;
                    this.b = sum & 255;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.flgZero = this.b === 0 ? 1 : 0;
                    this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SBC IndirectX 6 */
    Most6502Base.prototype.op0xe1 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SBC IndirectY 5pc  */
    Most6502Base.prototype.op0xf1 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.b = 255 - this.b;
                    var sum = this.rA + this.b + this.flgCarry;
                    var bothPositive = this.b < 128 && this.rA < 128;
                    var bothNegative = this.b >= 128 && this.rA >= 128;
                    this.flgCarry = sum > 255 ? 1 : 0;
                    this.b = sum & 255;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.flgZero = this.b === 0 ? 1 : 0;
                    this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                    this.rA = this.b;
                    this.t = 0;
                }
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SEC Implied 2 */
    Most6502Base.prototype.op0x38 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.flgCarry = 1;
                this.t = 0;
                break;
            }
        }
    };
    /* SED Implied 2 */
    Most6502Base.prototype.op0xf8 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.flgDecimalMode = 1;
                this.t = 0;
                break;
            }
        }
    };
    /* SEI Implied 2 */
    Most6502Base.prototype.op0x78 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.flgInterruptDisable = 1;
                this.t = 0;
                break;
            }
        }
    };
    /* STA ZeroPage 3 */
    Most6502Base.prototype.op0x85 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.rA;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STA ZeroPageX 4 */
    Most6502Base.prototype.op0x95 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.rA;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STA Absolute 4 */
    Most6502Base.prototype.op0x8d = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.rA;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STA AbsoluteX 5 */
    Most6502Base.prototype.op0x9d = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.rA;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STA AbsoluteY 5 */
    Most6502Base.prototype.op0x99 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.rA;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STA IndirectX 6 */
    Most6502Base.prototype.op0x81 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.rA;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STA IndirectY 6 */
    Most6502Base.prototype.op0x91 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 5: {
                this.b = this.rA;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STX ZeroPage 3 */
    Most6502Base.prototype.op0x86 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.rX;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STX ZeroPageY 4 */
    Most6502Base.prototype.op0x96 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rY + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.rX;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STX Absolute 4 */
    Most6502Base.prototype.op0x8e = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.rX;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STY ZeroPage 3 */
    Most6502Base.prototype.op0x84 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.rY;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STY ZeroPageX 4 */
    Most6502Base.prototype.op0x94 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.rY;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* STY Absolute 4 */
    Most6502Base.prototype.op0x8c = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.rY;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* TAX Accumulator 2 */
    Most6502Base.prototype.op0xaa = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rA;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* TAY Accumulator 2 */
    Most6502Base.prototype.op0xa8 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rA;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rY = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* TSX Accumulator 2 */
    Most6502Base.prototype.op0xba = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.sp;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* TXA Accumulator 2 */
    Most6502Base.prototype.op0x8a = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rX;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* TXS Accumulator 2 */
    Most6502Base.prototype.op0x9a = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rX;
                this.sp = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* TYA Accumulator 2 */
    Most6502Base.prototype.op0x98 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.b = this.rY;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* JSR JSR 6 */
    Most6502Base.prototype.op0x20 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.t++;
                break;
            }
            case 3: {
                this.pushByte(this.ip >> 8);
                this.t++;
                break;
            }
            case 4: {
                this.pushByte(this.ip & 0xff);
                this.t++;
                break;
            }
            case 5: {
                this.ip = (this.memory.getByte(this.ip) << 8) + this.addrLo;
                this.t = 0;
                break;
            }
        }
    };
    /* RTS RTS 6 */
    Most6502Base.prototype.op0x60 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t++;
                break;
            }
            case 2: {
                this.t++;
                break;
            }
            case 3: {
                this.ip = this.popByte();
                this.t++;
                break;
            }
            case 4: {
                this.ip |= this.popByte() << 8;
                this.t++;
                break;
            }
            case 5: {
                this.ip++;
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Implied 2 */
    Most6502Base.prototype.op0x1a = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Implied 2 */
    Most6502Base.prototype.op0x3a = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Implied 2 */
    Most6502Base.prototype.op0x5a = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Implied 2 */
    Most6502Base.prototype.op0x7a = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Implied 2 */
    Most6502Base.prototype.op0xda = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Implied 2 */
    Most6502Base.prototype.op0xfa = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.memory.getByte(this.ip);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP ZeroPage 3 */
    Most6502Base.prototype.op0x4 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP ZeroPageX 4 */
    Most6502Base.prototype.op0x14 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP ZeroPageX 4 */
    Most6502Base.prototype.op0x34 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP ZeroPage 3 */
    Most6502Base.prototype.op0x44 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP ZeroPageX 4 */
    Most6502Base.prototype.op0x54 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP ZeroPageX 4 */
    Most6502Base.prototype.op0x74 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP ZeroPageX 4 */
    Most6502Base.prototype.op0xd4 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP ZeroPageX 4 */
    Most6502Base.prototype.op0xf4 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP ZeroPage 3 */
    Most6502Base.prototype.op0x64 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Immediate 2 */
    Most6502Base.prototype.op0x80 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Immediate 2 */
    Most6502Base.prototype.op0x82 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Immediate 2 */
    Most6502Base.prototype.op0xc2 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Immediate 2 */
    Most6502Base.prototype.op0xe2 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Immediate 2 */
    Most6502Base.prototype.op0x89 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.t = 0;
                break;
            }
        }
    };
    /* NOP Absolute 4 */
    Most6502Base.prototype.op0xc = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP AbsoluteX 4pc  */
    Most6502Base.prototype.op0x1c = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP AbsoluteX 4pc  */
    Most6502Base.prototype.op0x3c = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP AbsoluteX 4pc  */
    Most6502Base.prototype.op0x5c = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP AbsoluteX 4pc  */
    Most6502Base.prototype.op0x7c = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP AbsoluteX 4pc  */
    Most6502Base.prototype.op0xdc = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* NOP AbsoluteX 4pc  */
    Most6502Base.prototype.op0xfc = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    /* SBC Immediate 2 */
    Most6502Base.prototype.op0xeb = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* DCP IndirectX 8 */
    Most6502Base.prototype.op0xc3 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.b = (this.b - 1) & 0xff;
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DCP ZeroPage 5 */
    Most6502Base.prototype.op0xc7 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.b = (this.b - 1) & 0xff;
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DCP Absolute 6 */
    Most6502Base.prototype.op0xcf = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b - 1) & 0xff;
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DCP IndirectY 8 */
    Most6502Base.prototype.op0xd3 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.b = (this.b - 1) & 0xff;
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DCP ZeroPageX 6 */
    Most6502Base.prototype.op0xd7 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b - 1) & 0xff;
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DCP AbsoluteY 7 */
    Most6502Base.prototype.op0xdb = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b = (this.b - 1) & 0xff;
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* DCP AbsoluteX 7 */
    Most6502Base.prototype.op0xdf = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b = (this.b - 1) & 0xff;
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero = this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* ISC IndirectX 8 */
    Most6502Base.prototype.op0xe3 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ISC ZeroPage 5 */
    Most6502Base.prototype.op0xe7 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ISC Absolute 6 */
    Most6502Base.prototype.op0xef = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ISC IndirectY 8 */
    Most6502Base.prototype.op0xf3 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ISC ZeroPageX 6 */
    Most6502Base.prototype.op0xf7 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ISC AbsoluteY 7 */
    Most6502Base.prototype.op0xfb = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ISC AbsoluteX 7 */
    Most6502Base.prototype.op0xff = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b = (this.b + 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.b = 255 - this.b;
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LAX Immediate 2 */
    Most6502Base.prototype.op0xab = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LAX ZeroPage 3 */
    Most6502Base.prototype.op0xa7 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LAX ZeroPageY 4 */
    Most6502Base.prototype.op0xb7 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rY + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LAX Absolute 4 */
    Most6502Base.prototype.op0xaf = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LAX AbsoluteY 4pc  */
    Most6502Base.prototype.op0xbf = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgZero = this.b === 0 ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.rX = this.b;
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LAX IndirectX 6 */
    Most6502Base.prototype.op0xa3 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* LAX IndirectY 5pc  */
    Most6502Base.prototype.op0xb3 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.flgZero = this.b === 0 ? 1 : 0;
                    this.flgNegative = this.b >= 128 ? 1 : 0;
                    this.rA = this.b;
                    this.rX = this.b;
                    this.t = 0;
                }
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SAX IndirectX 6 */
    Most6502Base.prototype.op0x83 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.rA & this.rX;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* SAX ZeroPage 3 */
    Most6502Base.prototype.op0x87 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.rA & this.rX;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* SAX Absolute 4 */
    Most6502Base.prototype.op0x8f = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.rA & this.rX;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* SAX ZeroPageY 4 */
    Most6502Base.prototype.op0x97 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rY + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.rA & this.rX;
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* SLO IndirectX 8 */
    Most6502Base.prototype.op0x3 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SLO ZeroPage 5 */
    Most6502Base.prototype.op0x7 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SLO Absolute 6 */
    Most6502Base.prototype.op0xf = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SLO IndirectY 8 */
    Most6502Base.prototype.op0x13 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SLO ZeroPageX 6 */
    Most6502Base.prototype.op0x17 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SLO AbsoluteY 7 */
    Most6502Base.prototype.op0x1b = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SLO AbsoluteX 7 */
    Most6502Base.prototype.op0x1f = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.flgCarry = this.b & 0x80 ? 1 : 0;
                this.b = (this.b << 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RLA IndirectX 8 */
    Most6502Base.prototype.op0x23 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RLA ZeroPage 5 */
    Most6502Base.prototype.op0x27 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RLA Absolute 6 */
    Most6502Base.prototype.op0x2f = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RLA IndirectY 8 */
    Most6502Base.prototype.op0x33 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RLA ZeroPageX 6 */
    Most6502Base.prototype.op0x37 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RLA AbsoluteY 7 */
    Most6502Base.prototype.op0x3b = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RLA AbsoluteX 7 */
    Most6502Base.prototype.op0x3f = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b = (this.b << 1) | this.flgCarry;
                this.flgCarry = this.b & 0x100 ? 1 : 0;
                this.b &= 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RRA IndirectX 8 */
    Most6502Base.prototype.op0x63 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RRA ZeroPage 5 */
    Most6502Base.prototype.op0x67 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RRA Absolute 6 */
    Most6502Base.prototype.op0x6f = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RRA IndirectY 8 */
    Most6502Base.prototype.op0x73 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RRA ZeroPageX 6 */
    Most6502Base.prototype.op0x77 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RRA AbsoluteY 7 */
    Most6502Base.prototype.op0x7b = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* RRA AbsoluteX 7 */
    Most6502Base.prototype.op0x7f = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                var sum = this.rA + this.b + this.flgCarry;
                var bothPositive = this.b < 128 && this.rA < 128;
                var bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum & 255;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SRE IndirectX 8 */
    Most6502Base.prototype.op0x43 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.memory.getByte(this.addrPtr);
                this.addrPtr = (this.addrPtr + this.rX) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 4: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SRE ZeroPage 5 */
    Most6502Base.prototype.op0x47 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 3: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SRE Absolute 6 */
    Most6502Base.prototype.op0x4f = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SRE IndirectY 8 */
    Most6502Base.prototype.op0x53 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 5: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 6: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 7: {
                this.memory.setByte(this.addr, this.b);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SRE ZeroPageX 6 */
    Most6502Base.prototype.op0x57 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.b = this.memory.getByte(this.addr);
                this.addr = (this.rX + this.addr) & 0xff;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 4: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SRE AbsoluteY 7 */
    Most6502Base.prototype.op0x5b = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SRE AbsoluteX 7 */
    Most6502Base.prototype.op0x5f = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t++;
                break;
            }
            case 5: {
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.t++;
                break;
            }
            case 6: {
                this.memory.setByte(this.addr, this.b);
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ANC Immediate 2 */
    Most6502Base.prototype.op0xb = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgCarry = this.flgNegative;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ANC Immediate 2 */
    Most6502Base.prototype.op0x2b = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgCarry = this.flgNegative;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ALR Immediate 2 */
    Most6502Base.prototype.op0x4b = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgCarry = this.b & 1;
                this.b = (this.b >> 1) & 0xff;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* ARR Immediate 2 */
    Most6502Base.prototype.op0x6b = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.b |= this.flgCarry << 8;
                this.flgCarry = this.b & 1 ? 1 : 0;
                this.b >>= 1;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 0x80 ? 1 : 0;
                this.flgCarry = (this.b & (1 << 6)) !== 0 ? 1 : 0;
                this.flgOverflow = ((this.b & (1 << 6)) >> 6) ^ ((this.b & (1 << 5)) >> 5);
                this.rA = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* AXS Immediate 2 */
    Most6502Base.prototype.op0xcb = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                var res = (this.rA & this.rX) + 256 - this.b;
                this.b = res & 0xff;
                this.flgNegative = (this.b & 128) !== 0 ? 1 : 0;
                this.flgCarry = res > 255 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
                break;
            }
        }
    };
    /* SYA AbsoluteX 5 */
    Most6502Base.prototype.op0x9c = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rX) >> 8;
                this.addrLo = (this.addrLo + this.rX) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                if (this.addrC) {
                    this.addrHi = this.rY & (this.addrHi + 1);
                    this.addr = (this.addrHi << 8) | this.addrLo;
                }
                this.b = this.rY & ((this.addrHi) + 1);
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* SXA AbsoluteY 5 */
    Most6502Base.prototype.op0x9e = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                if (this.addrC) {
                    this.addrHi = this.rX & (this.addrHi + 1);
                    this.addr = (this.addrHi << 8) | this.addrLo;
                }
                this.b = this.rX & ((this.addrHi) + 1);
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* XAA Immediate 2 */
    Most6502Base.prototype.op0x8b = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.b = this.memory.getByte(this.ip);
                this.ip++;
                this.t = 0;
                break;
            }
        }
    };
    /* AXA IndirectY 6 */
    Most6502Base.prototype.op0x93 = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrPtr = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrLo = this.memory.getByte(this.addrPtr);
                this.t++;
                break;
            }
            case 3: {
                this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.t++;
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 5: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* XAS AbsoluteY 5 */
    Most6502Base.prototype.op0x9b = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* AXA AbsoluteY 5 */
    Most6502Base.prototype.op0x9f = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                }
                this.t++;
                break;
            }
            case 4: {
                this.memory.setByte(this.addr, this.b);
                this.t = 0;
                break;
            }
        }
    };
    /* LAR AbsoluteY 4pc  */
    Most6502Base.prototype.op0xbb = function () {
        switch (this.t) {
            case 0: {
                this.ip++;
                this.t++;
                break;
            }
            case 1: {
                this.addrLo = this.memory.getByte(this.ip);
                this.ip++;
                this.t++;
                break;
            }
            case 2: {
                this.addrHi = this.memory.getByte(this.ip);
                this.addrC = (this.addrLo + this.rY) >> 8;
                this.addrLo = (this.addrLo + this.rY) & 0xff;
                this.addr = this.addrLo + (this.addrHi << 8);
                this.ip++;
                this.t++;
                break;
            }
            case 3: {
                this.b = this.memory.getByte(this.addr);
                if (this.addrC) {
                    this.addr = (this.addr + (this.addrC << 8)) & 0xffff;
                    this.t++;
                }
                else {
                    this.t = 0;
                }
                break;
            }
            case 4: {
                this.b = this.memory.getByte(this.addr);
                this.t = 0;
                break;
            }
        }
    };
    Most6502Base.prototype.opcodeToMnemonic = function (opcode) {
        if (opcode === 105)
            return 'ADC Immediate';
        if (opcode === 101)
            return 'ADC ZeroPage';
        if (opcode === 117)
            return 'ADC ZeroPageX';
        if (opcode === 109)
            return 'ADC Absolute';
        if (opcode === 125)
            return 'ADC AbsoluteX';
        if (opcode === 121)
            return 'ADC AbsoluteY';
        if (opcode === 97)
            return 'ADC IndirectX';
        if (opcode === 113)
            return 'ADC IndirectY';
        if (opcode === 41)
            return 'AND Immediate';
        if (opcode === 37)
            return 'AND ZeroPage';
        if (opcode === 53)
            return 'AND ZeroPageX';
        if (opcode === 45)
            return 'AND Absolute';
        if (opcode === 61)
            return 'AND AbsoluteX';
        if (opcode === 57)
            return 'AND AbsoluteY';
        if (opcode === 33)
            return 'AND IndirectX';
        if (opcode === 49)
            return 'AND IndirectY';
        if (opcode === 10)
            return 'ASL Accumulator';
        if (opcode === 6)
            return 'ASL ZeroPage';
        if (opcode === 22)
            return 'ASL ZeroPageX';
        if (opcode === 14)
            return 'ASL Absolute';
        if (opcode === 30)
            return 'ASL AbsoluteX';
        if (opcode === 144)
            return 'BCC Relative';
        if (opcode === 176)
            return 'BCS Relative';
        if (opcode === 240)
            return 'BEQ Relative';
        if (opcode === 48)
            return 'BMI Relative';
        if (opcode === 208)
            return 'BNE Relative';
        if (opcode === 16)
            return 'BPL Relative';
        if (opcode === 80)
            return 'BVC Relative';
        if (opcode === 112)
            return 'BVS Relative';
        if (opcode === 36)
            return 'BIT ZeroPage';
        if (opcode === 44)
            return 'BIT Absolute';
        if (opcode === 24)
            return 'CLC Implied';
        if (opcode === 216)
            return 'CLD Implied';
        if (opcode === 88)
            return 'CLI Implied';
        if (opcode === 184)
            return 'CLV Implied';
        if (opcode === 201)
            return 'CMP Immediate';
        if (opcode === 197)
            return 'CMP ZeroPage';
        if (opcode === 213)
            return 'CMP ZeroPageX';
        if (opcode === 205)
            return 'CMP Absolute';
        if (opcode === 221)
            return 'CMP AbsoluteX';
        if (opcode === 217)
            return 'CMP AbsoluteY';
        if (opcode === 193)
            return 'CMP IndirectX';
        if (opcode === 209)
            return 'CMP IndirectY';
        if (opcode === 224)
            return 'CPX Immediate';
        if (opcode === 228)
            return 'CPX ZeroPage';
        if (opcode === 236)
            return 'CPX Absolute';
        if (opcode === 192)
            return 'CPY Immediate';
        if (opcode === 196)
            return 'CPY ZeroPage';
        if (opcode === 204)
            return 'CPY Absolute';
        if (opcode === 198)
            return 'DEC ZeroPage';
        if (opcode === 214)
            return 'DEC ZeroPageX';
        if (opcode === 206)
            return 'DEC Absolute';
        if (opcode === 222)
            return 'DEC AbsoluteX';
        if (opcode === 202)
            return 'DEX Accumulator';
        if (opcode === 136)
            return 'DEY Accumulator';
        if (opcode === 230)
            return 'INC ZeroPage';
        if (opcode === 246)
            return 'INC ZeroPageX';
        if (opcode === 238)
            return 'INC Absolute';
        if (opcode === 254)
            return 'INC AbsoluteX';
        if (opcode === 232)
            return 'INX Accumulator';
        if (opcode === 200)
            return 'INY Accumulator';
        if (opcode === 73)
            return 'EOR Immediate';
        if (opcode === 69)
            return 'EOR ZeroPage';
        if (opcode === 85)
            return 'EOR ZeroPageX';
        if (opcode === 77)
            return 'EOR Absolute';
        if (opcode === 93)
            return 'EOR AbsoluteX';
        if (opcode === 89)
            return 'EOR AbsoluteY';
        if (opcode === 65)
            return 'EOR IndirectX';
        if (opcode === 81)
            return 'EOR IndirectY';
        if (opcode === 76)
            return 'JMP Absolute';
        if (opcode === 108)
            return 'JMP AbsoluteIndirect';
        if (opcode === 169)
            return 'LDA Immediate';
        if (opcode === 165)
            return 'LDA ZeroPage';
        if (opcode === 181)
            return 'LDA ZeroPageX';
        if (opcode === 173)
            return 'LDA Absolute';
        if (opcode === 189)
            return 'LDA AbsoluteX';
        if (opcode === 185)
            return 'LDA AbsoluteY';
        if (opcode === 161)
            return 'LDA IndirectX';
        if (opcode === 177)
            return 'LDA IndirectY';
        if (opcode === 162)
            return 'LDX Immediate';
        if (opcode === 166)
            return 'LDX ZeroPage';
        if (opcode === 182)
            return 'LDX ZeroPageY';
        if (opcode === 174)
            return 'LDX Absolute';
        if (opcode === 190)
            return 'LDX AbsoluteY';
        if (opcode === 160)
            return 'LDY Immediate';
        if (opcode === 164)
            return 'LDY ZeroPage';
        if (opcode === 180)
            return 'LDY ZeroPageX';
        if (opcode === 172)
            return 'LDY Absolute';
        if (opcode === 188)
            return 'LDY AbsoluteX';
        if (opcode === 74)
            return 'LSR Accumulator';
        if (opcode === 70)
            return 'LSR ZeroPage';
        if (opcode === 86)
            return 'LSR ZeroPageX';
        if (opcode === 78)
            return 'LSR Absolute';
        if (opcode === 94)
            return 'LSR AbsoluteX';
        if (opcode === 234)
            return 'NOP Implied';
        if (opcode === 9)
            return 'ORA Immediate';
        if (opcode === 5)
            return 'ORA ZeroPage';
        if (opcode === 21)
            return 'ORA ZeroPageX';
        if (opcode === 13)
            return 'ORA Absolute';
        if (opcode === 29)
            return 'ORA AbsoluteX';
        if (opcode === 25)
            return 'ORA AbsoluteY';
        if (opcode === 1)
            return 'ORA IndirectX';
        if (opcode === 17)
            return 'ORA IndirectY';
        if (opcode === 72)
            return 'PHA Implied';
        if (opcode === 8)
            return 'PHP Implied';
        if (opcode === 104)
            return 'PLA Implied';
        if (opcode === 40)
            return 'PLP Implied';
        if (opcode === 42)
            return 'ROL Accumulator';
        if (opcode === 38)
            return 'ROL ZeroPage';
        if (opcode === 54)
            return 'ROL ZeroPageX';
        if (opcode === 46)
            return 'ROL Absolute';
        if (opcode === 62)
            return 'ROL AbsoluteX';
        if (opcode === 106)
            return 'ROR Accumulator';
        if (opcode === 102)
            return 'ROR ZeroPage';
        if (opcode === 118)
            return 'ROR ZeroPageX';
        if (opcode === 110)
            return 'ROR Absolute';
        if (opcode === 126)
            return 'ROR AbsoluteX';
        if (opcode === 0)
            return 'BRK BRK';
        if (opcode === 64)
            return 'RTI RTI';
        if (opcode === 233)
            return 'SBC Immediate';
        if (opcode === 229)
            return 'SBC ZeroPage';
        if (opcode === 245)
            return 'SBC ZeroPageX';
        if (opcode === 237)
            return 'SBC Absolute';
        if (opcode === 253)
            return 'SBC AbsoluteX';
        if (opcode === 249)
            return 'SBC AbsoluteY';
        if (opcode === 225)
            return 'SBC IndirectX';
        if (opcode === 241)
            return 'SBC IndirectY';
        if (opcode === 56)
            return 'SEC Implied';
        if (opcode === 248)
            return 'SED Implied';
        if (opcode === 120)
            return 'SEI Implied';
        if (opcode === 133)
            return 'STA ZeroPage';
        if (opcode === 149)
            return 'STA ZeroPageX';
        if (opcode === 141)
            return 'STA Absolute';
        if (opcode === 157)
            return 'STA AbsoluteX';
        if (opcode === 153)
            return 'STA AbsoluteY';
        if (opcode === 129)
            return 'STA IndirectX';
        if (opcode === 145)
            return 'STA IndirectY';
        if (opcode === 134)
            return 'STX ZeroPage';
        if (opcode === 150)
            return 'STX ZeroPageY';
        if (opcode === 142)
            return 'STX Absolute';
        if (opcode === 132)
            return 'STY ZeroPage';
        if (opcode === 148)
            return 'STY ZeroPageX';
        if (opcode === 140)
            return 'STY Absolute';
        if (opcode === 170)
            return 'TAX Accumulator';
        if (opcode === 168)
            return 'TAY Accumulator';
        if (opcode === 186)
            return 'TSX Accumulator';
        if (opcode === 138)
            return 'TXA Accumulator';
        if (opcode === 154)
            return 'TXS Accumulator';
        if (opcode === 152)
            return 'TYA Accumulator';
        if (opcode === 32)
            return 'JSR JSR';
        if (opcode === 96)
            return 'RTS RTS';
        if (opcode === 26)
            return 'NOP Implied';
        if (opcode === 58)
            return 'NOP Implied';
        if (opcode === 90)
            return 'NOP Implied';
        if (opcode === 122)
            return 'NOP Implied';
        if (opcode === 218)
            return 'NOP Implied';
        if (opcode === 250)
            return 'NOP Implied';
        if (opcode === 4)
            return 'NOP ZeroPage';
        if (opcode === 20)
            return 'NOP ZeroPageX';
        if (opcode === 52)
            return 'NOP ZeroPageX';
        if (opcode === 68)
            return 'NOP ZeroPage';
        if (opcode === 84)
            return 'NOP ZeroPageX';
        if (opcode === 116)
            return 'NOP ZeroPageX';
        if (opcode === 212)
            return 'NOP ZeroPageX';
        if (opcode === 244)
            return 'NOP ZeroPageX';
        if (opcode === 100)
            return 'NOP ZeroPage';
        if (opcode === 128)
            return 'NOP Immediate';
        if (opcode === 130)
            return 'NOP Immediate';
        if (opcode === 194)
            return 'NOP Immediate';
        if (opcode === 226)
            return 'NOP Immediate';
        if (opcode === 137)
            return 'NOP Immediate';
        if (opcode === 12)
            return 'NOP Absolute';
        if (opcode === 28)
            return 'NOP AbsoluteX';
        if (opcode === 60)
            return 'NOP AbsoluteX';
        if (opcode === 92)
            return 'NOP AbsoluteX';
        if (opcode === 124)
            return 'NOP AbsoluteX';
        if (opcode === 220)
            return 'NOP AbsoluteX';
        if (opcode === 252)
            return 'NOP AbsoluteX';
        if (opcode === 235)
            return 'SBC Immediate';
        if (opcode === 195)
            return 'DCP IndirectX';
        if (opcode === 199)
            return 'DCP ZeroPage';
        if (opcode === 207)
            return 'DCP Absolute';
        if (opcode === 211)
            return 'DCP IndirectY';
        if (opcode === 215)
            return 'DCP ZeroPageX';
        if (opcode === 219)
            return 'DCP AbsoluteY';
        if (opcode === 223)
            return 'DCP AbsoluteX';
        if (opcode === 227)
            return 'ISC IndirectX';
        if (opcode === 231)
            return 'ISC ZeroPage';
        if (opcode === 239)
            return 'ISC Absolute';
        if (opcode === 243)
            return 'ISC IndirectY';
        if (opcode === 247)
            return 'ISC ZeroPageX';
        if (opcode === 251)
            return 'ISC AbsoluteY';
        if (opcode === 255)
            return 'ISC AbsoluteX';
        if (opcode === 171)
            return 'LAX Immediate';
        if (opcode === 167)
            return 'LAX ZeroPage';
        if (opcode === 183)
            return 'LAX ZeroPageY';
        if (opcode === 175)
            return 'LAX Absolute';
        if (opcode === 191)
            return 'LAX AbsoluteY';
        if (opcode === 163)
            return 'LAX IndirectX';
        if (opcode === 179)
            return 'LAX IndirectY';
        if (opcode === 131)
            return 'SAX IndirectX';
        if (opcode === 135)
            return 'SAX ZeroPage';
        if (opcode === 143)
            return 'SAX Absolute';
        if (opcode === 151)
            return 'SAX ZeroPageY';
        if (opcode === 3)
            return 'SLO IndirectX';
        if (opcode === 7)
            return 'SLO ZeroPage';
        if (opcode === 15)
            return 'SLO Absolute';
        if (opcode === 19)
            return 'SLO IndirectY';
        if (opcode === 23)
            return 'SLO ZeroPageX';
        if (opcode === 27)
            return 'SLO AbsoluteY';
        if (opcode === 31)
            return 'SLO AbsoluteX';
        if (opcode === 35)
            return 'RLA IndirectX';
        if (opcode === 39)
            return 'RLA ZeroPage';
        if (opcode === 47)
            return 'RLA Absolute';
        if (opcode === 51)
            return 'RLA IndirectY';
        if (opcode === 55)
            return 'RLA ZeroPageX';
        if (opcode === 59)
            return 'RLA AbsoluteY';
        if (opcode === 63)
            return 'RLA AbsoluteX';
        if (opcode === 99)
            return 'RRA IndirectX';
        if (opcode === 103)
            return 'RRA ZeroPage';
        if (opcode === 111)
            return 'RRA Absolute';
        if (opcode === 115)
            return 'RRA IndirectY';
        if (opcode === 119)
            return 'RRA ZeroPageX';
        if (opcode === 123)
            return 'RRA AbsoluteY';
        if (opcode === 127)
            return 'RRA AbsoluteX';
        if (opcode === 67)
            return 'SRE IndirectX';
        if (opcode === 71)
            return 'SRE ZeroPage';
        if (opcode === 79)
            return 'SRE Absolute';
        if (opcode === 83)
            return 'SRE IndirectY';
        if (opcode === 87)
            return 'SRE ZeroPageX';
        if (opcode === 91)
            return 'SRE AbsoluteY';
        if (opcode === 95)
            return 'SRE AbsoluteX';
        if (opcode === 11)
            return 'ANC Immediate';
        if (opcode === 43)
            return 'ANC Immediate';
        if (opcode === 75)
            return 'ALR Immediate';
        if (opcode === 107)
            return 'ARR Immediate';
        if (opcode === 203)
            return 'AXS Immediate';
        if (opcode === 156)
            return 'SYA AbsoluteX';
        if (opcode === 158)
            return 'SXA AbsoluteY';
        if (opcode === 139)
            return 'XAA Immediate';
        if (opcode === 147)
            return 'AXA IndirectY';
        if (opcode === 155)
            return 'XAS AbsoluteY';
        if (opcode === 159)
            return 'AXA AbsoluteY';
        if (opcode === 187)
            return 'LAR AbsoluteY';
        return '???';
    };
    Most6502Base.prototype.sizeFromOpcode = function (opcode) {
        if (opcode === 105)
            return 2;
        if (opcode === 101)
            return 2;
        if (opcode === 117)
            return 2;
        if (opcode === 109)
            return 3;
        if (opcode === 125)
            return 3;
        if (opcode === 121)
            return 3;
        if (opcode === 97)
            return 2;
        if (opcode === 113)
            return 2;
        if (opcode === 41)
            return 2;
        if (opcode === 37)
            return 2;
        if (opcode === 53)
            return 2;
        if (opcode === 45)
            return 3;
        if (opcode === 61)
            return 3;
        if (opcode === 57)
            return 3;
        if (opcode === 33)
            return 2;
        if (opcode === 49)
            return 2;
        if (opcode === 10)
            return 1;
        if (opcode === 6)
            return 2;
        if (opcode === 22)
            return 2;
        if (opcode === 14)
            return 3;
        if (opcode === 30)
            return 3;
        if (opcode === 144)
            return 2;
        if (opcode === 176)
            return 2;
        if (opcode === 240)
            return 2;
        if (opcode === 48)
            return 2;
        if (opcode === 208)
            return 2;
        if (opcode === 16)
            return 2;
        if (opcode === 80)
            return 2;
        if (opcode === 112)
            return 2;
        if (opcode === 36)
            return 2;
        if (opcode === 44)
            return 3;
        if (opcode === 24)
            return 1;
        if (opcode === 216)
            return 1;
        if (opcode === 88)
            return 1;
        if (opcode === 184)
            return 1;
        if (opcode === 201)
            return 2;
        if (opcode === 197)
            return 2;
        if (opcode === 213)
            return 2;
        if (opcode === 205)
            return 3;
        if (opcode === 221)
            return 3;
        if (opcode === 217)
            return 3;
        if (opcode === 193)
            return 2;
        if (opcode === 209)
            return 2;
        if (opcode === 224)
            return 2;
        if (opcode === 228)
            return 2;
        if (opcode === 236)
            return 3;
        if (opcode === 192)
            return 2;
        if (opcode === 196)
            return 2;
        if (opcode === 204)
            return 3;
        if (opcode === 198)
            return 2;
        if (opcode === 214)
            return 2;
        if (opcode === 206)
            return 3;
        if (opcode === 222)
            return 3;
        if (opcode === 202)
            return 1;
        if (opcode === 136)
            return 1;
        if (opcode === 230)
            return 2;
        if (opcode === 246)
            return 2;
        if (opcode === 238)
            return 3;
        if (opcode === 254)
            return 3;
        if (opcode === 232)
            return 1;
        if (opcode === 200)
            return 1;
        if (opcode === 73)
            return 2;
        if (opcode === 69)
            return 2;
        if (opcode === 85)
            return 2;
        if (opcode === 77)
            return 3;
        if (opcode === 93)
            return 3;
        if (opcode === 89)
            return 3;
        if (opcode === 65)
            return 2;
        if (opcode === 81)
            return 2;
        if (opcode === 76)
            return 3;
        if (opcode === 108)
            return 3;
        if (opcode === 169)
            return 2;
        if (opcode === 165)
            return 2;
        if (opcode === 181)
            return 2;
        if (opcode === 173)
            return 3;
        if (opcode === 189)
            return 3;
        if (opcode === 185)
            return 3;
        if (opcode === 161)
            return 2;
        if (opcode === 177)
            return 2;
        if (opcode === 162)
            return 2;
        if (opcode === 166)
            return 2;
        if (opcode === 182)
            return 2;
        if (opcode === 174)
            return 3;
        if (opcode === 190)
            return 3;
        if (opcode === 160)
            return 2;
        if (opcode === 164)
            return 2;
        if (opcode === 180)
            return 2;
        if (opcode === 172)
            return 3;
        if (opcode === 188)
            return 3;
        if (opcode === 74)
            return 1;
        if (opcode === 70)
            return 2;
        if (opcode === 86)
            return 2;
        if (opcode === 78)
            return 3;
        if (opcode === 94)
            return 3;
        if (opcode === 234)
            return 1;
        if (opcode === 9)
            return 2;
        if (opcode === 5)
            return 2;
        if (opcode === 21)
            return 2;
        if (opcode === 13)
            return 3;
        if (opcode === 29)
            return 3;
        if (opcode === 25)
            return 3;
        if (opcode === 1)
            return 2;
        if (opcode === 17)
            return 2;
        if (opcode === 72)
            return 1;
        if (opcode === 8)
            return 1;
        if (opcode === 104)
            return 1;
        if (opcode === 40)
            return 1;
        if (opcode === 42)
            return 1;
        if (opcode === 38)
            return 2;
        if (opcode === 54)
            return 2;
        if (opcode === 46)
            return 3;
        if (opcode === 62)
            return 3;
        if (opcode === 106)
            return 1;
        if (opcode === 102)
            return 2;
        if (opcode === 118)
            return 2;
        if (opcode === 110)
            return 3;
        if (opcode === 126)
            return 3;
        if (opcode === 0)
            return 2;
        if (opcode === 64)
            return 1;
        if (opcode === 233)
            return 2;
        if (opcode === 229)
            return 2;
        if (opcode === 245)
            return 2;
        if (opcode === 237)
            return 3;
        if (opcode === 253)
            return 3;
        if (opcode === 249)
            return 3;
        if (opcode === 225)
            return 2;
        if (opcode === 241)
            return 2;
        if (opcode === 56)
            return 1;
        if (opcode === 248)
            return 1;
        if (opcode === 120)
            return 1;
        if (opcode === 133)
            return 2;
        if (opcode === 149)
            return 2;
        if (opcode === 141)
            return 3;
        if (opcode === 157)
            return 3;
        if (opcode === 153)
            return 3;
        if (opcode === 129)
            return 2;
        if (opcode === 145)
            return 2;
        if (opcode === 134)
            return 2;
        if (opcode === 150)
            return 2;
        if (opcode === 142)
            return 3;
        if (opcode === 132)
            return 2;
        if (opcode === 148)
            return 2;
        if (opcode === 140)
            return 3;
        if (opcode === 170)
            return 1;
        if (opcode === 168)
            return 1;
        if (opcode === 186)
            return 1;
        if (opcode === 138)
            return 1;
        if (opcode === 154)
            return 1;
        if (opcode === 152)
            return 1;
        if (opcode === 32)
            return 3;
        if (opcode === 96)
            return 2;
        if (opcode === 26)
            return 1;
        if (opcode === 58)
            return 1;
        if (opcode === 90)
            return 1;
        if (opcode === 122)
            return 1;
        if (opcode === 218)
            return 1;
        if (opcode === 250)
            return 1;
        if (opcode === 4)
            return 2;
        if (opcode === 20)
            return 2;
        if (opcode === 52)
            return 2;
        if (opcode === 68)
            return 2;
        if (opcode === 84)
            return 2;
        if (opcode === 116)
            return 2;
        if (opcode === 212)
            return 2;
        if (opcode === 244)
            return 2;
        if (opcode === 100)
            return 2;
        if (opcode === 128)
            return 2;
        if (opcode === 130)
            return 2;
        if (opcode === 194)
            return 2;
        if (opcode === 226)
            return 2;
        if (opcode === 137)
            return 2;
        if (opcode === 12)
            return 3;
        if (opcode === 28)
            return 3;
        if (opcode === 60)
            return 3;
        if (opcode === 92)
            return 3;
        if (opcode === 124)
            return 3;
        if (opcode === 220)
            return 3;
        if (opcode === 252)
            return 3;
        if (opcode === 235)
            return 2;
        if (opcode === 195)
            return 2;
        if (opcode === 199)
            return 2;
        if (opcode === 207)
            return 3;
        if (opcode === 211)
            return 2;
        if (opcode === 215)
            return 2;
        if (opcode === 219)
            return 3;
        if (opcode === 223)
            return 3;
        if (opcode === 227)
            return 2;
        if (opcode === 231)
            return 2;
        if (opcode === 239)
            return 3;
        if (opcode === 243)
            return 2;
        if (opcode === 247)
            return 2;
        if (opcode === 251)
            return 3;
        if (opcode === 255)
            return 3;
        if (opcode === 171)
            return 2;
        if (opcode === 167)
            return 2;
        if (opcode === 183)
            return 2;
        if (opcode === 175)
            return 3;
        if (opcode === 191)
            return 3;
        if (opcode === 163)
            return 2;
        if (opcode === 179)
            return 2;
        if (opcode === 131)
            return 2;
        if (opcode === 135)
            return 2;
        if (opcode === 143)
            return 3;
        if (opcode === 151)
            return 2;
        if (opcode === 3)
            return 2;
        if (opcode === 7)
            return 2;
        if (opcode === 15)
            return 3;
        if (opcode === 19)
            return 2;
        if (opcode === 23)
            return 2;
        if (opcode === 27)
            return 3;
        if (opcode === 31)
            return 3;
        if (opcode === 35)
            return 2;
        if (opcode === 39)
            return 2;
        if (opcode === 47)
            return 3;
        if (opcode === 51)
            return 2;
        if (opcode === 55)
            return 2;
        if (opcode === 59)
            return 3;
        if (opcode === 63)
            return 3;
        if (opcode === 99)
            return 2;
        if (opcode === 103)
            return 2;
        if (opcode === 111)
            return 3;
        if (opcode === 115)
            return 2;
        if (opcode === 119)
            return 2;
        if (opcode === 123)
            return 3;
        if (opcode === 127)
            return 3;
        if (opcode === 67)
            return 2;
        if (opcode === 71)
            return 2;
        if (opcode === 79)
            return 3;
        if (opcode === 83)
            return 2;
        if (opcode === 87)
            return 2;
        if (opcode === 91)
            return 3;
        if (opcode === 95)
            return 3;
        if (opcode === 11)
            return 2;
        if (opcode === 43)
            return 2;
        if (opcode === 75)
            return 2;
        if (opcode === 107)
            return 2;
        if (opcode === 203)
            return 2;
        if (opcode === 156)
            return 3;
        if (opcode === 158)
            return 3;
        if (opcode === 139)
            return 2;
        if (opcode === 147)
            return 2;
        if (opcode === 155)
            return 3;
        if (opcode === 159)
            return 3;
        if (opcode === 187)
            return 3;
        return 1;
    };
    return Most6502Base;
})();
///<reference path="Memory.ts"/>
///<reference path="Mos6502Base.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Mos6502 = (function (_super) {
    __extends(Mos6502, _super);
    function Mos6502(memory) {
        _super.call(this, memory);
        this.memory = memory;
    }
    Mos6502.prototype.trace = function (opcode) {
        //  console.log(this.ip.toString(16), this.opcodeToMnemonic(opcode), 'ra:', this.rA.toString(16));
    };
    Mos6502.prototype.status = function () {
        return { irq: this.irqLine, disass: this.disass(10) };
    };
    Mos6502.prototype.step = function () {
        this.clk();
    };
    Mos6502.prototype.stepInstr = function () {
        this.clk();
        while (this.t !== 0)
            this.clk();
    };
    Mos6502.prototype.getByte = function (addr) {
        return this.memory.getByte(addr);
    };
    Mos6502.prototype.getWord = function (addr) {
        return this.memory.getByte(addr) + 256 * this.memory.getByte(addr + 1);
    };
    Mos6502.prototype.reset = function () {
        this.ip = this.getWord(this.addrReset);
        this.sp = 0xfd;
    };
    Mos6502.prototype.disass = function (i, ip) {
        if (ip === void 0) { ip = null; }
        var rgst = [];
        if (!ip)
            ip = this.ipCur;
        while (i > 0) {
            var opcode = this.memory.getByte(ip);
            rgst.push('$' + ip.toString(16) + ' ' + this.opcodeToMnemonic(opcode));
            ip += this.sizeFromOpcode(opcode);
            i--;
        }
        return rgst;
    };
    return Mos6502;
})(Most6502Base);
///<reference path="CompoundMemory.ts"/>
///<reference path="RAM.ts"/>
///<reference path="NesImage.ts"/>
///<reference path="Mos6502.ts"/>
var NesEmulator = (function () {
    function NesEmulator(nesImage, canvas) {
        var _this = this;
        this.dmaRequested = false;
        this.idma = 0;
        this.icycle = 0;
        if (nesImage.fPAL)
            throw 'only NTSC images are supported';
        switch (nesImage.mapperType) {
            case 0:
                if (nesImage.ROMBanks.length === 1) {
                    this.memory = new CompoundMemory(new RAM(0xc000), nesImage.ROMBanks[0]);
                }
                else if (nesImage.ROMBanks.length === 2) {
                    this.memory = new CompoundMemory(new RAM(0x8000), nesImage.ROMBanks[0], nesImage.ROMBanks[1]);
                }
                if (nesImage.VRAMBanks.length > 1)
                    throw 'unknown VRAMBanks';
                if (nesImage.VRAMBanks.length === 1 && nesImage.VRAMBanks[0].size() !== 0x2000)
                    throw 'unknown VRAMBanks';
                var patternTable = nesImage.VRAMBanks.length > 0 ? nesImage.VRAMBanks[0] : new RAM(0x2000);
                var nameTableA = new RAM(0x400);
                var nameTableB = nesImage.fFourScreenVRAM || nesImage.fVerticalMirroring ? new RAM(0x400) : nameTableA;
                var nameTableC = nesImage.fFourScreenVRAM || !nesImage.fVerticalMirroring ? new RAM(0x400) : nameTableA;
                var nameTableD = nesImage.fFourScreenVRAM ? new RAM(0x400) : nesImage.fVerticalMirroring ? nameTableB : nameTableC;
                var rest = new RAM(0x1000);
                this.vmemory = new CompoundMemory(patternTable, nameTableA, nameTableB, nameTableC, nameTableD, rest);
                break;
            case 1:
                var mmc1 = new MMC1(nesImage.ROMBanks, nesImage.VRAMBanks);
                this.memory = mmc1.memory;
                this.vmemory = mmc1.vmemory;
        }
        if (!this.memory)
            throw 'unkown mapper ' + nesImage.mapperType;
        this.memory.shadowSetter(0x4014, 0x4014, function (_, v) {
            _this.dmaRequested = true;
            _this.addrDma = v << 8;
        });
        this.memory.shadowGetter(0x4016, 0x4016, function () { return _this.controller.reg4016; });
        this.memory.shadowSetter(0x4016, 0x4016, function (_, v) { _this.controller.reg4016 = v; });
        this.memory.shadowGetter(0x4017, 0x4017, function () { return _this.controller.reg4016; });
        this.cpu = new Mos6502(this.memory);
        this.apu = new APU(this.memory, this.cpu);
        // this.ppu = <any> new PPUOld(this.memory, this.vmemory, this.cpu);
        this.ppu = new PPU(this.memory, this.vmemory, this.cpu);
        this.ppu.setRenderer(new WebGlRenderer(canvas));
        this.cpu.reset();
        this.controller = new Controller(canvas);
        window['nesemulator'] = this;
    }
    NesEmulator.prototype.step = function () {
        for (this.icycle = 0; this.icycle < 12; this.icycle++) {
            if ((this.icycle & 3) === 0) {
                var nmiBefore = this.cpu.nmiLine;
                this.ppu.step();
                var nmiAfter = this.cpu.nmiLine;
                if (nmiBefore > nmiAfter && this.icycle === 4)
                    this.cpu.detectInterrupts();
            }
            if (this.icycle === 0) {
                if (this.dmaRequested) {
                    if (!(this.cpu.icycle & 1)) {
                        this.dmaRequested = false;
                        this.idma = 512;
                    }
                    this.cpu.icycle++;
                }
                else if (this.idma > 512) {
                    this.idma--;
                    this.cpu.icycle++;
                }
                else if (this.idma > 0) {
                    this.cpu.icycle++;
                    if (!(this.idma & 1)) {
                        this.bDma = this.memory.getByte(this.addrDma++);
                        this.addrDma &= 0xffff;
                    }
                    else {
                        this.memory.setByte(0x2004, this.bDma);
                    }
                    this.idma--;
                }
                else {
                    this.cpu.step();
                }
            }
            this.apu.step();
        }
    };
    return NesEmulator;
})();
///<reference path="NesEmulator.ts"/>
var NesRunnerBase = (function () {
    function NesRunnerBase(container, url) {
        this.container = container;
        this.url = url;
        var containerT = document.createElement('div');
        this.container.appendChild(containerT);
        this.container = containerT;
        this.onEndCallback = function () { };
    }
    NesRunnerBase.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var st = "";
        for (var i = 0; i < args.length; i++)
            st += " " + args[i];
        var div = document.createElement("div");
        div.innerHTML = st.replace(/\n/g, "<br/>");
        this.logElement.appendChild(div);
    };
    NesRunnerBase.prototype.logError = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var st = "";
        for (var i = 0; i < args.length; i++)
            st += " " + args[i];
        var div = document.createElement("div");
        div.classList.add("error");
        div.innerHTML = st.replace(/\n/g, "<br/>");
        this.logElement.appendChild(div);
    };
    NesRunnerBase.prototype.loadEmulator = function (onLoad) {
        var _this = this;
        this.headerElement = document.createElement("h2");
        this.headerElement.innerText = this.url;
        this.container.appendChild(this.headerElement);
        var canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 240;
        canvas.style.zoom = "2";
        this.container.appendChild(canvas);
        this.logElement = document.createElement("div");
        this.logElement.classList.add('log');
        this.container.appendChild(this.logElement);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function (e) {
            if (xhr.status > 99 && xhr.status < 299) {
                var blob = new Uint8Array(xhr.response);
                onLoad(new NesEmulator(new NesImage(blob), canvas));
            }
            else {
                _this.logError("http error " + xhr.status);
                onLoad(null);
            }
        };
        xhr.send();
    };
    NesRunnerBase.prototype.onEnd = function (callback) {
        this.onEndCallback = callback;
    };
    NesRunnerBase.prototype.run = function () {
        var _this = this;
        this.loadEmulator(function (nesEmulator) {
            _this.nesEmulator = nesEmulator;
            if (!nesEmulator)
                _this.onEndCallback();
            else
                _this.runI();
        });
    };
    NesRunnerBase.prototype.runI = function () {
        this.onEndCallback();
    };
    return NesRunnerBase;
})();
///<reference path="NesEmulator.ts"/>
///<reference path="NesRunnerBase.ts"/>
var CpuTestRunner = (function (_super) {
    __extends(CpuTestRunner, _super);
    function CpuTestRunner(container, url, checkForString) {
        var _this = this;
        _super.call(this, container, url);
        this.checkForString = checkForString;
        this.callback = this.renderFrame.bind(this);
        this.container.classList.add('test-case');
        var collapseButton = document.createElement('div');
        collapseButton.className = 'collapse-button';
        collapseButton.onclick = function (e) {
            $(_this.container).toggleClass('collapsed');
        };
        this.container.appendChild(collapseButton);
    }
    CpuTestRunner.prototype.testFinished = function (nesEmulator) {
        if (nesEmulator.cpu.getByte(0x6000) !== 0x80 &&
            nesEmulator.cpu.getByte(0x6001) === 0xde &&
            nesEmulator.cpu.getByte(0x6002) === 0xb0 &&
            nesEmulator.cpu.getByte(0x6003) === 0x61) {
            var resultCode = nesEmulator.cpu.getByte(0x6000);
            if (resultCode !== 0) {
                this.log('res: ' + resultCode.toString(16));
                this.container.classList.add('failed');
            }
            else {
                this.container.classList.add('passed');
            }
            var res = "";
            var i = 0x6004;
            while (nesEmulator.cpu.getByte(i) !== 0) {
                res += String.fromCharCode(nesEmulator.cpu.getByte(i));
                i++;
            }
            this.log(res);
            return true;
        }
        if (nesEmulator.cpu.getByte(nesEmulator.cpu.ipCur) === 0x4c &&
            nesEmulator.cpu.getWord(nesEmulator.cpu.ipCur + 1) === nesEmulator.cpu.ipCur &&
            nesEmulator.cpu.flgInterruptDisable &&
            !nesEmulator.ppu.nmi_output) {
            var out = nesEmulator.ppu.getNameTable(0);
            this.log(out);
            if (out.indexOf(this.checkForString) >= 0) {
                this.container.classList.add('passed');
            }
            else {
                this.container.classList.add('failed');
            }
            return true;
        }
        return false;
    };
    CpuTestRunner.prototype.runI = function () {
        requestAnimationFrame(this.callback);
    };
    CpuTestRunner.prototype.renderFrame = function () {
        var nesEmulator = this.nesEmulator;
        var ppu = nesEmulator.ppu;
        if (this.testFinished(nesEmulator)) {
            this.container.classList.add('collapsed');
            this.onEndCallback();
            return;
        }
        try {
            var frameCurrent = ppu.iFrame;
            while (frameCurrent === ppu.iFrame)
                nesEmulator.step();
        }
        catch (e) {
            this.container.classList.add('collapsed');
            this.logError(e);
            this.onEndCallback();
            return;
        }
        requestAnimationFrame(this.callback);
    };
    return CpuTestRunner;
})(NesRunnerBase);
///<reference path="Memory.ts"/>
///<reference path="RAM.ts"/>
///<reference path="CompoundMemory.ts"/>
var MMC1 = (function () {
    function MMC1(PRGBanks, VROMBanks) {
        this.PRGBanks = PRGBanks;
        this.VROMBanks = VROMBanks;
        this.iWrite = 0;
        this.rTemp = 0;
        /**
         * $8000-9FFF:  [...C PSMM]
         */
        this.r0 = 0;
        /**
         *  $A000-BFFF:  [...C CCCC]
            CHR Reg 0
         */
        this.r1 = 0;
        /**
         *  $C000-DFFF:  [...C CCCC]
         *  CHR Reg 1
         */
        this.r2 = 0;
        /**
         * $E000-FFFF:  [...W PPPP]
         */
        this.r3 = 0;
        while (PRGBanks.length < 2)
            PRGBanks.push(new RAM(0x4000));
        while (VROMBanks.length < 2)
            VROMBanks.push(new RAM(0x1000));
        this.memory = new CompoundMemory(new RepeatedMemory(4, new RAM(0x800)), new RAM(0x2000), new RAM(0x8000), PRGBanks[0], PRGBanks[1]);
        this.nametableA = new RAM(0x400);
        this.nametableB = new RAM(0x400);
        this.nametable = new CompoundMemory(this.nametableA, this.nametableB, this.nametableA, this.nametableB);
        this.vmemory = new CompoundMemory(VROMBanks[0], VROMBanks[1], this.nametable, new RAM(0x1000));
        this.memory.shadowSetter(0x8000, 0xffff, this.setByte.bind(this));
    }
    Object.defineProperty(MMC1.prototype, "C", {
        /** CHR Mode (0=8k mode, 1=4k mode) */
        get: function () { return (this.r0 >> 4) & 1; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MMC1.prototype, "P", {
        /** PRG Size (0=32k mode, 1=16k mode) */
        get: function () { return (this.r0 >> 3) & 1; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MMC1.prototype, "S", {
        /**
         * Slot select:
         *  0 = $C000 swappable, $8000 fixed to page $00 (mode A)
         *  1 = $8000 swappable, $C000 fixed to page $0F (mode B)
         *  This bit is ignored when 'P' is clear (32k mode)
         */
        get: function () { return (this.r0 >> 2) & 1; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MMC1.prototype, "M", {
        /**
         *  Mirroring control:
         *  %00 = 1ScA
         *  %01 = 1ScB
         *  %10 = Vert
         *  %11 = Horz
         */
        get: function () { return this.r0 & 3; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MMC1.prototype, "CHR0", {
        get: function () { return this.r1 & 31; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MMC1.prototype, "CHR1", {
        get: function () { return this.r1 & 31; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MMC1.prototype, "PRG0", {
        get: function () { return this.r3 & 15; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MMC1.prototype, "W", {
        /**
         * W = WRAM Disable (0=enabled, 1=disabled)
         * Disabled WRAM cannot be read or written.  Earlier MMC1 versions apparently do not have this bit implemented.
         * Later ones do.
         */
        get: function () { return (this.r3 >> 4) & 1; },
        enumerable: true,
        configurable: true
    });
    MMC1.prototype.setByte = function (addr, value) {
        /*Temporary reg port ($8000-FFFF):
            [r... ...d]
                r = reset flag
                d = data bit

        When 'r' is set:
            - 'd' is ignored
            - hidden temporary reg is reset (so that the next write is the "first" write)
            - bits 2,3 of reg $8000 are set (16k PRG mode, $8000 swappable)
            - other bits of $8000 (and other regs) are unchanged

        When 'r' is clear:
            - 'd' proceeds as the next bit written in the 5-bit sequence
            - If this completes the 5-bit sequence:
                - temporary reg is copied to actual internal reg (which reg depends on the last address written to)
                - temporary reg is reset (so that next write is the "first" write)
        */
        value &= 0xff;
        var flgReset = value >> 7;
        var flgData = value & 0x1;
        if (flgReset === 1) {
            this.rTemp = 0;
            this.P = 1;
            this.S = 1;
            this.iWrite = 0;
        }
        else {
            this.rTemp = (this.rTemp << 1) + flgData;
            this.iWrite++;
            if (this.iWrite === 5) {
                if (addr <= 0x9fff)
                    this.r0 = this.rTemp;
                else if (addr <= 0xbfff)
                    this.r1 = this.rTemp;
                else if (addr <= 0xdfff)
                    this.r2 = this.rTemp;
                else if (addr <= 0xffff)
                    this.r3 = this.rTemp;
                this.update();
            }
        }
    };
    MMC1.prototype.update = function () {
        console.log('mmc1', this.r0, this.r1, this.r2, this.r3);
        /*
            PRG Setup:
            --------------------------
            There is 1 PRG reg and 3 PRG modes.

                           $8000   $A000   $C000   $E000
                         +-------------------------------+
            P=0:         |            <$E000>            |
                         +-------------------------------+
            P=1, S=0:    |     { 0 }     |     $E000     |
                         +---------------+---------------+
            P=1, S=1:    |     $E000     |     {$0F}     |
                         +---------------+---------------+
        */
        if (this.P === 1) {
            this.memory.rgmemory[3] = this.PRGBanks[this.PRG0 >> 1];
            this.memory.rgmemory[4] = this.PRGBanks[(this.PRG0 >> 1) + 1];
        }
        else if (this.S === 0) {
            this.memory.rgmemory[3] = this.PRGBanks[0];
            this.memory.rgmemory[4] = this.PRGBanks[this.PRG0];
        }
        else {
            this.memory.rgmemory[3] = this.PRGBanks[this.PRG0];
            this.memory.rgmemory[4] = this.PRGBanks[0x0f];
        }
        /*
            CHR Setup:
            --------------------------
            There are 2 CHR regs and 2 CHR modes.

                        $0000   $0400   $0800   $0C00   $1000   $1400   $1800   $1C00
                      +---------------------------------------------------------------+
            C=0:      |                            <$A000>                            |
                      +---------------------------------------------------------------+
            C=1:      |             $A000             |             $C000             |
                      +-------------------------------+-------------------------------+
        */
        if (this.C === 0) {
            console.log('chr:', this.CHR0);
            this.vmemory.rgmemory[0] = this.VROMBanks[this.CHR0 >> 1];
            this.vmemory.rgmemory[1] = this.VROMBanks[(this.CHR0 >> 1) + 1];
        }
        else {
            console.log('chr mode 2:', this.CHR0);
            this.vmemory.rgmemory[0] = this.VROMBanks[this.CHR0];
            this.vmemory.rgmemory[1] = this.VROMBanks[this.CHR1];
        }
        if (this.M === 0) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[1] = this.nametable.rgmemory[2] = this.nametable.rgmemory[3] = this.nametableA;
        }
        else if (this.M === 1) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[1] = this.nametable.rgmemory[2] = this.nametable.rgmemory[3] = this.nametableB;
        }
        else if (this.M === 2) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[2] = this.nametableA;
            this.nametable.rgmemory[1] = this.nametable.rgmemory[3] = this.nametableB;
        }
        else if (this.M === 3) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[2] = this.nametableB;
            this.nametable.rgmemory[1] = this.nametable.rgmemory[3] = this.nametableA;
        }
    };
    return MMC1;
})();
///<reference path="Memory.ts"/>
var Mos6502Old = (function () {
    function Mos6502Old(memory) {
        this.memory = memory;
        this.t = 0;
        this.tLim = 0;
        this.addrRA = -1;
        this.rA = 0;
        this.rX = 0;
        this.rY = 0;
        this.addrReset = 0xfffc;
        this.addrIRQ = 0xfffe;
        this.addrNMI = 0xfffa;
        this.flgCarry = 0;
        this.flgZero = 0;
        this.flgInterruptDisable = 0;
        //private get flgInterruptDisable() {
        //    return this._flgInterruptDisable;
        //}
        //private set flgInterruptDisable(v) {
        //    //console.log('flgInterruptDisable', v);
        //    this._flgInterruptDisable = v;
        //}
        this.number = 0;
        this.flgDecimalMode = 0;
        this.flgBreakCommand = 0;
        this.flgOverflow = 0;
        this.flgNegative = 0;
        this.nmiLine = 1;
        this.nmiLinePrev = 1;
        this.irqRequested = false;
        this.irqLine = 1;
        /**
        BRK - Force Interrupt
    
            The BRK instruction forces the generation of an interrupt request.
            The program counter and processor status are pushed on the stack then the IRQ interrupt vector
             at $FFFE/F is loaded into the PC and the break flag in the status set to one.
    
            C	Carry Flag	Not affected
            Z	Zero Flag	Not affected
            I	Interrupt Disable	Not affected
            D	Decimal Mode Flag	Not affected
            B	Break Command	Set to 1
            V	Overflow Flag	Not affected
            N	Negative Flag	Not affected
    
            http://nesdev.com/the%20'B'%20flag%20&%20BRK%20instruction.txt
    
            No actual "B" flag exists inside the 6502's processor status register. The B
            flag only exists in the status flag byte pushed to the stack. Naturally,
            when the flags are restored (via PLP or RTI), the B bit is discarded.
    
            Depending on the means, the B status flag will be pushed to the stack as
            either 0 or 1.
    
            software instructions BRK & PHP will push the B flag as being 1.
            hardware interrupts IRQ & NMI will push the B flag as being 0.
    
            Regardless of what ANY 6502 documentation says, BRK is a 2 byte opcode. The
            first is #$00, and the second is a padding byte. This explains why interrupt
            routines called by BRK always return 2 bytes after the actual BRK opcode,
            and not just 1.
    
       */
        this.addrBrk = 0;
        this.pageCross = 0;
        this.jumpSucceed = 0;
        this.jumpToNewPage = 0;
    }
    Mos6502Old.prototype.pollInterrupts = function () {
        if (this.nmiDetected) {
            this.nmiRequested = true;
            this.nmiDetected = false;
        }
        if (this.irqDetected && !this.flgInterruptDisable) {
            console.log('irq requested');
            this.irqRequested = true;
        }
    };
    Mos6502Old.prototype.DetectInterrupts = function () {
        if (this.nmiLinePrev === 1 && this.nmiLine === 0) {
            this.nmiDetected = true;
        }
        this.nmiLinePrev = this.nmiLine;
        this.irqDetected = this.irqLine === 0;
    };
    Mos6502Old.prototype.Reset = function () {
        this.ip = this.getWord(this.addrReset);
        this.sp = 0xfd;
    };
    Object.defineProperty(Mos6502Old.prototype, "rP", {
        get: function () {
            return (this.flgNegative << 7) +
                (this.flgOverflow << 6) +
                (1 << 5) +
                (this.flgBreakCommand << 4) +
                (this.flgDecimalMode << 3) +
                (this.flgInterruptDisable << 2) +
                (this.flgZero << 1) +
                (this.flgCarry << 0);
        },
        set: function (byte) {
            this.flgNegative = (byte >> 7) & 1;
            this.flgOverflow = (byte >> 6) & 1;
            //skip (byte >> 5) & 1;
            //skip this.flgBreakCommand = (byte >> 4) & 1;
            this.flgBreakCommand = 0;
            this.flgDecimalMode = (byte >> 3) & 1;
            this.flgInterruptDisable = (byte >> 2) & 1;
            this.flgZero = (byte >> 1) & 1;
            this.flgCarry = (byte >> 0) & 1;
        },
        enumerable: true,
        configurable: true
    });
    /*
        ADC - Add with Carry

        A,Z,C,N = A+M+C
        This instruction adds the contents of a memory location to the accumulator together with the carry bit.
        If overflow occurs the carry bit is set, this enables multiple byte addition to be performed.

        Processor Status after use:

        C	Carry Flag	        Set if overflow in bit 7
        Z	Zero Flag	        Set if A = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	    Not affected
        V	Overflow Flag	    Set if sign bit is incorrect
        N	Negative Flag	    Set if bit 7 set
    */
    Mos6502Old.prototype.ADC = function (b) {
        var sum = this.rA + b + this.flgCarry;
        var bothPositive = b < 128 && this.rA < 128;
        var bothNegative = b >= 128 && this.rA >= 128;
        this.flgCarry = sum > 255 ? 1 : 0;
        this.rA = sum % 256;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
    };
    /**
     * SBC - Subtract with Carry

        A,Z,C,N = A-M-(1-C)

        This instruction subtracts the contents of a memory location to the accumulator together with the not of the carry bit. If overflow occurs the carry bit is clear, this enables multiple byte subtraction to be performed.

        Processor Status after use:

        C	Carry Flag	        Clear if overflow in bit 7
        Z	Zero Flag	        Set if A = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	    Not affected
        V	Overflow Flag	    Set if sign bit is incorrect
        N	Negative Flag	    Set if bit 7 set
     */
    Mos6502Old.prototype.SBC = function (b) {
        this.ADC(255 - b);
    };
    Mos6502Old.prototype.ISC = function (addr) {
        this.SBC(this.INC(addr));
    };
    Mos6502Old.prototype.SLO = function (addr) {
        this.ORA(this.ASL(addr));
    };
    Mos6502Old.prototype.RLA = function (addr) {
        this.AND(this.ROL(addr));
    };
    Mos6502Old.prototype.SRE = function (addr) {
        this.EOR(this.LSR(addr));
    };
    Mos6502Old.prototype.RRA = function (addr) {
        this.ADC(this.ROR(addr));
    };
    /**
     * AND - Logical AND
       A,Z,N = A&M
    
       A logical AND is performed, bit by bit, on the accumulator contents using the contents of a byte of memory.
       Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if A = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 set
     */
    Mos6502Old.prototype.AND = function (byte) {
        this.rA &= byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    /**
    *EOR - Exclusive OR

        A,Z,N = A^M

        An exclusive OR is performed, bit by bit, on the accumulator contents using the contents of a byte of memory.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if A = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 set

    */
    Mos6502Old.prototype.EOR = function (byte) {
        this.rA ^= byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    /**
    *BIT - Bit Test

        A & M, N = M7, V = M6

        This instructions is used to test if one or more bits are set in a target memory location.
        The mask pattern in A is ANDed with the value in memory to set or clear the zero flag, but the result is not kept.
        Bits 7 and 6 of the value from memory are copied into the N and V flags.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if the result if the AND is zero
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Set to bit 6 of the memory value
        N	Negative Flag	Set to bit 7 of the memory value

    */
    Mos6502Old.prototype.BIT = function (byte) {
        var res = this.rA & byte;
        this.flgZero = res === 0 ? 1 : 0;
        this.flgNegative = byte & 128 ? 1 : 0;
        this.flgOverflow = byte & 64 ? 1 : 0;
    };
    /**
        ASL - Arithmetic Shift Left
        A,Z,C,N = M*2 or M,Z,C,N = M*2

        This operation shifts all the bits of the accumulator or memory contents one bit left.
        Bit 0 is set to 0 and bit 7 is placed in the carry flag. The effect of this operation is
        to multiply the memory contents by 2 (ignoring 2's complement considerations),
        setting the carry if the result will not fit in 8 bits.

        Processor Status after use:

        C	Carry Flag	Set to contents of old bit 7
        Z	Zero Flag	Set if A = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of the result is set
    */
    Mos6502Old.prototype.ASL = function (addr) {
        var byte = this.getByte(addr);
        var res = byte << 1;
        this.flgCarry = res > 255 ? 1 : 0;
        res &= 0xff;
        this.flgZero = res === 0 ? 1 : 0;
        this.flgNegative = res & 128 ? 1 : 0;
        this.setByte(addr, res);
        return res;
    };
    /* BCC - Branch if Carry Clear

        If the carry flag is clear then add the relative displacement to the program counter to cause a branch to a new location.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Not affected
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Not affected
    */
    Mos6502Old.prototype.BCC = function (sbyte) {
        if (!this.flgCarry) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    };
    /* BCS - Branch if Carry Set
        If the carry flag is set then add the relative displacement to the program counter to cause a branch to a new location.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Not affected
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Not affected
    */
    Mos6502Old.prototype.BCS = function (sbyte) {
        if (this.flgCarry) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    };
    /* BEQ - Branch if Equal

        If the zero flag is set then add the relative displacement to the program counter to cause a branch to a new location.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Not affected
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Not affected

    */
    Mos6502Old.prototype.BEQ = function (sbyte) {
        if (this.flgZero) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    };
    /* BMI -  Branch if Minus

      If the negative flag is set then add the relative displacement to the program counter to cause a branch to a new location.
      Processor Status after use:

      C	Carry Flag	Not affected
      Z	Zero Flag	Not affected
      I	Interrupt Disable	Not affected
      D	Decimal Mode Flag	Not affected
      B	Break Command	Not affected
      V	Overflow Flag	Not affected
      N	Negative Flag	Not affected

  */
    Mos6502Old.prototype.BMI = function (sbyte) {
        if (this.flgNegative) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    };
    /* BNE - Branch if Not Equal

       If the zero flag is clear then add the relative displacement to the program counter to cause a branch to a new location.

     C	Carry Flag	Not affected
     Z	Zero Flag	Not affected
     I	Interrupt Disable	Not affected
     D	Decimal Mode Flag	Not affected
     B	Break Command	Not affected
     V	Overflow Flag	Not affected
     N	Negative Flag	Not affected

 */
    Mos6502Old.prototype.BNE = function (sbyte) {
        if (!this.flgZero) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    };
    /* BPL - Branch if Positive

       If the negative flag is clear then add the relative displacement to the program counter to cause a branch to a new location.

     C	Carry Flag	Not affected
     Z	Zero Flag	Not affected
     I	Interrupt Disable	Not affected
     D	Decimal Mode Flag	Not affected
     B	Break Command	Not affected
     V	Overflow Flag	Not affected
     N	Negative Flag	Not affected

 */
    Mos6502Old.prototype.BPL = function (sbyte) {
        if (!this.flgNegative) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    };
    /* BVC - Branch if Overflow Clear

       If the overflow flag is clear then add the relative displacement to the program counter to cause a branch to a new location.

     C	Carry Flag	Not affected
     Z	Zero Flag	Not affected
     I	Interrupt Disable	Not affected
     D	Decimal Mode Flag	Not affected
     B	Break Command	Not affected
     V	Overflow Flag	Not affected
     N	Negative Flag	Not affected

 */
    Mos6502Old.prototype.BVC = function (sbyte) {
        if (!this.flgOverflow) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    };
    /* BVS - Branch if Overflow Set
    
        If the overflow flag is clear then add the relative displacement to the program counter to cause a branch to a new location.

           C	Carry Flag	Not affected
           Z	Zero Flag	Not affected
           I	Interrupt Disable	Not affected
           D	Decimal Mode Flag	Not affected
           B	Break Command	Not affected
           V	Overflow Flag	Not affected
           N	Negative Flag	Not affected

*/
    Mos6502Old.prototype.BVS = function (sbyte) {
        if (this.flgOverflow) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    };
    Mos6502Old.prototype.CLC = function () {
        this.flgCarry = 0;
    };
    Mos6502Old.prototype.CLD = function () {
        this.flgDecimalMode = 0;
    };
    Mos6502Old.prototype.CLI = function () {
        console.log('$' + this.ip.toString(16), 'CLI');
        this.flgInterruptDisable = 0;
    };
    Mos6502Old.prototype.SEI = function () {
        console.log('$' + this.ip.toString(16), 'SEI');
        this.flgInterruptDisable = 1;
    };
    Mos6502Old.prototype.CLV = function () {
        this.flgOverflow = 0;
    };
    /* CMP - Compare

        Z,C,N = A-M

        This instruction compares the contents of the accumulator with another memory held value and sets the zero and carry flags as appropriate.

        Processor Status after use:

        C	Carry Flag	Set if A >= M
        Z	Zero Flag	Set if A = M
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affectedc
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of the result is set

*/
    Mos6502Old.prototype.CMP = function (byte) {
        this.flgCarry = this.rA >= byte ? 1 : 0;
        this.flgZero = this.rA === byte ? 1 : 0;
        this.flgNegative = (this.rA - byte) & 128 ? 1 : 0;
    };
    Mos6502Old.prototype.DCP = function (addr) {
        var byte = this.getByte(addr);
        byte = byte === 0 ? 255 : byte - 1;
        this.setByte(addr, byte);
        this.flgCarry = this.rA >= byte ? 1 : 0;
        this.flgZero = this.rA === byte ? 1 : 0;
        this.flgNegative = (this.rA - byte) & 128 ? 1 : 0;
    };
    /* CMP - Compare X Register

        Z,C,N = X-M

        This instruction compares the contents of the X register with another memory held value and sets the zero and carry flags as appropriate.
        Processor Status after use:

        C	Carry Flag	Set if X >= M
        Z	Zero Flag	Set if X = M
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of the result is set

*/
    Mos6502Old.prototype.CPX = function (byte) {
        this.flgCarry = this.rX >= byte ? 1 : 0;
        this.flgZero = this.rX === byte ? 1 : 0;
        this.flgNegative = (this.rX - byte) & 128 ? 1 : 0;
    };
    /* CMP - Compare Y Register

        Z,C,N = Y-M

        This instruction compares the contents of the Y register with another memory held value and sets the zero and carry flags as appropriate.
        Processor Status after use:

        C	Carry Flag	Set if Y >= M
        Z	Zero Flag	Set if Y = M
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of the result is set
    */
    Mos6502Old.prototype.CPY = function (byte) {
        this.flgCarry = this.rY >= byte ? 1 : 0;
        this.flgZero = this.rY === byte ? 1 : 0;
        this.flgNegative = (this.rY - byte) & 128 ? 1 : 0;
    };
    /**
        DEC - Decrement Memory

            M,Z,N = M-1

            Subtracts one from the value held at a specified memory location setting the zero and negative flags as appropriate.

            Processor Status after use:

            C	Carry Flag	Not affected
            Z	Zero Flag	Set if result is zero
            I	Interrupt Disable	Not affected
            D	Decimal Mode Flag	Not affected
            B	Break Command	Not affected
            V	Overflow Flag	Not affected
            N	Negative Flag	Set if bit 7 of the result is set
     */
    Mos6502Old.prototype.DEC = function (addr) {
        var byte = this.getByte(addr);
        byte = byte === 0 ? 255 : byte - 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
    };
    /**
      DEX - Decrement X Register

        X,Z,N = X-1

        Subtracts one from the X register setting the zero and negative flags as appropriate.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if X is zero
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of X is set

    */
    Mos6502Old.prototype.DEX = function () {
        this.rX = this.rX === 0 ? 255 : this.rX - 1;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    };
    /**
      DEY - Decrement Y Register

        Y,Z,N = Y-1

        Subtracts one from the Y register setting the zero and negative flags as appropriate.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if Y is zero
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of Y is set

    */
    Mos6502Old.prototype.DEY = function () {
        this.rY = this.rY === 0 ? 255 : this.rY - 1;
        this.flgZero = this.rY === 0 ? 1 : 0;
        this.flgNegative = this.rY >= 128 ? 1 : 0;
    };
    /**
      INC - Increment Memory

        M,Z,N = M+1

        Adds one to the value held at a specified memory location setting the zero and negative flags as appropriate.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if result is zero
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of the result is set

    */
    Mos6502Old.prototype.INC = function (addr) {
        var byte = this.getByte(addr);
        byte = byte === 255 ? 0 : byte + 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
        return byte;
    };
    /**
        INX - Increment X Register

        X,Z,N = X+1

        Adds one to the X register setting the zero and negative flags as appropriate.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if X is zero
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of X is set

    */
    Mos6502Old.prototype.INX = function () {
        this.rX = this.rX === 255 ? 0 : this.rX + 1;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    };
    /**
        INY - Increment Y Register

        Y,Z,N = Y+1

        Adds one to the Y register setting the zero and negative flags as appropriate.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if Y is zero
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of Y is set

    */
    Mos6502Old.prototype.INY = function () {
        this.rY = this.rY === 255 ? 0 : this.rY + 1;
        this.flgZero = this.rY === 0 ? 1 : 0;
        this.flgNegative = this.rY >= 128 ? 1 : 0;
    };
    /*
     LDA - Load Accumulator

        A,Z,N = M

        Loads a byte of memory into the accumulator setting the zero and negative flags as appropriate.

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if A = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of A is set

     */
    Mos6502Old.prototype.LDA = function (byte) {
        this.rA = byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    Mos6502Old.prototype.LAX = function (byte) {
        this.rA = byte;
        this.rX = byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    /*
        LDX - Load X Register

            X,Z,N = M

            Loads a byte of memory into the X register setting the zero and negative flags as appropriate.

            C	Carry Flag	Not affected
            Z	Zero Flag	Set if X = 0
            I	Interrupt Disable	Not affected
            D	Decimal Mode Flag	Not affected
            B	Break Command	Not affected
            V	Overflow Flag	Not affected
            N	Negative Flag	Set if bit 7 of X is set
   */
    Mos6502Old.prototype.LDX = function (byte) {
        this.rX = byte;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    };
    /*
          LDY - Load Y Register
   
           Y,Z,N = M
   
           Loads a byte of memory into the Y register setting the zero and negative flags as appropriate.
   
           C	Carry Flag	Not affected
           Z	Zero Flag	Set if Y = 0
           I	Interrupt Disable	Not affected
           D	Decimal Mode Flag	Not affected
           B	Break Command	Not affected
           V	Overflow Flag	Not affected
           N	Negative Flag	Set if bit 7 of Y is set
   
       */
    Mos6502Old.prototype.LDY = function (byte) {
        this.rY = byte;
        this.flgZero = this.rY === 0 ? 1 : 0;
        this.flgNegative = this.rY >= 128 ? 1 : 0;
    };
    /*
     LSR - Logical Shift Right

        A,C,Z,N = A/2 or M,C,Z,N = M/2

        Each of the bits in A or M is shift one place to the right. The bit that was in bit 0 is shifted into the carry flag. Bit 7 is set to zero.

        Processor Status after use:

        C	Carry Flag	Set to contents of old bit 0
        Z	Zero Flag	Set if result = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of the result is set

    */
    Mos6502Old.prototype.LSR = function (addr) {
        var byte = this.getByte(addr);
        this.flgCarry = byte % 2;
        byte >>= 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
        return byte;
    };
    /*
       ORA - Logical Inclusive OR
   
           A,Z,N = A|M
   
           An inclusive OR is performed, bit by bit, on the accumulator contents using the contents of a byte of memory.
   
           Processor Status after use:
   
           C	Carry Flag	Not affected
           Z	Zero Flag	Set if A = 0
           I	Interrupt Disable	Not affected
           D	Decimal Mode Flag	Not affected
           B	Break Command	Not affected
           V	Overflow Flag	Not affected
           N	Negative Flag	Set if bit 7 set
   
   
       */
    Mos6502Old.prototype.ORA = function (byte) {
        this.rA |= byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    /*
    ROL - Rotate Left

        Move each of the bits in either A or M one place to the left. Bit 0 is filled with the current value of the carry flag whilst the old bit 7 becomes the new carry flag value.

        Processor Status after use:

        C	Carry Flag	Set to contents of old bit 7
        Z	Zero Flag	Set if A = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of the result is set


   */
    Mos6502Old.prototype.ROL = function (addr) {
        var byte = this.getByte(addr);
        byte <<= 1;
        byte |= this.flgCarry;
        this.flgCarry = (byte & 256) === 256 ? 1 : 0;
        byte &= 255;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
        return byte;
    };
    /*
          ROR - Rotate Right

        Move each of the bits in either A or M one place to the right. Bit 7 is filled with the current value of the carry flag whilst the old bit 0 becomes the new carry flag value.

        Processor Status after use:

        C	Carry Flag	Set to contents of old bit 0
        Z	Zero Flag	Set if A = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of the result is set

  */
    Mos6502Old.prototype.ROR = function (addr) {
        var byte = this.getByte(addr);
        byte |= (this.flgCarry << 8);
        this.flgCarry = byte & 1;
        byte >>= 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
        return byte;
    };
    /*
      STA - Store Accumulator

            M = A

            Stores the contents of the accumulator into memory.

            Processor Status after use:

            C	Carry Flag	Not affected
            Z	Zero Flag	Not affected
            I	Interrupt Disable	Not affected
            D	Decimal Mode Flag	Not affected
            B	Break Command	Not affected
            V	Overflow Flag	Not affected
            N	Negative Flag	Not affected

     */
    Mos6502Old.prototype.STA = function (addr) {
        this.setByte(addr, this.rA);
    };
    Mos6502Old.prototype.STX = function (addr) {
        this.setByte(addr, this.rX);
    };
    Mos6502Old.prototype.STY = function (addr) {
        this.setByte(addr, this.rY);
    };
    Mos6502Old.prototype.SAX = function (addr) {
        this.setByte(addr, this.rX & this.rA);
    };
    Mos6502Old.prototype.TAX = function () {
        this.rX = this.rA;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    };
    Mos6502Old.prototype.TAY = function () {
        this.rY = this.rA;
        this.flgZero = this.rY === 0 ? 1 : 0;
        this.flgNegative = this.rY >= 128 ? 1 : 0;
    };
    Mos6502Old.prototype.TSX = function () {
        this.rX = this.sp;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    };
    Mos6502Old.prototype.TXA = function () {
        this.rA = this.rX;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    Mos6502Old.prototype.TXS = function () {
        this.sp = this.rX;
    };
    Mos6502Old.prototype.TYA = function () {
        this.rA = this.rY;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    /*JSR - Jump to Subroutine
        The JSR instruction pushes the address (minus one) of the return point on to the stack and then sets the program counter to the target memory address.
     */
    Mos6502Old.prototype.JSR = function (addr) {
        // console.log('$' + this.ip.toString(16), 'JSR');
        this.pushWord(this.ip + 3 - 1);
        this.ip = addr;
    };
    /**
     * RTS - Return from Subroutine
        The RTS instruction is used at the end of a subroutine to return to the calling routine. It pulls the program counter (minus one) from the stack.
     */
    Mos6502Old.prototype.RTS = function () {
        // console.log('$'+this.ip.toString(16), 'RTS');
        this.ip = this.popWord() + 1;
    };
    /**
         PHA - Push Accumulator

        Pushes a copy of the accumulator on to the stack.
     */
    Mos6502Old.prototype.PHA = function () {
        this.pushByte(this.rA);
    };
    /**
     PLA  - Pull Accumulator
     Pulls an 8 bit value from the stack and into the accumulator. The zero and negative flags are set as appropriate.

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if A = 0
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of A is set

 */
    Mos6502Old.prototype.PLA = function () {
        this.rA = this.popByte();
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    /**
       PHP - Push Processor Status

        Pushes a copy of the status flags on to the stack.
   */
    Mos6502Old.prototype.PHP = function () {
        this.flgBreakCommand = 1;
        this.pushByte(this.rP);
        this.flgBreakCommand = 0;
    };
    /**
      PLP - Pull Processor Status

        Pulls an 8 bit value from the stack and into the processor flags.
        The flags will take on new states as determined by the value pulled.

   */
    Mos6502Old.prototype.PLP = function () {
        var v = this.popByte();
        this.rP = v;
        console.log('plp', 'irq dsiabled:', this.flgInterruptDisable, 'v:', v.toString(2));
    };
    Mos6502Old.prototype.BRK = function () {
        switch (this.t) {
            case 0:
                //console.log('process BRK');
                this.tLim = 7;
                break;
            case 1:
                this.getByte(this.ip + 1);
                break;
            case 2:
                this.pushHi(this.ip + 2);
                break;
            case 3:
                this.pushLo(this.ip + 2);
                break;
            case 4:
                this.pollInterrupts();
                var nmi = this.nmiRequested;
                var irq = this.irqRequested;
                this.addrBrk = nmi ? this.addrNMI : this.addrIRQ;
                this.flgBreakCommand = 1;
                this.PHP();
                break;
            case 5:
                this.ip = this.getByte(this.addrBrk);
                this.flgInterruptDisable = 1;
                break;
            case 6:
                //  this.pollInterrupts();
                //   this.nmiRequested = this.irqRequested = false;
                this.ip += this.getByte(this.addrBrk + 1) << 8;
                break;
        }
    };
    Mos6502Old.prototype.NMI = function () {
        // console.log('process NMI');
        this.pushWord(this.ip);
        this.pushByte(this.rP);
        this.flgInterruptDisable = 1;
        this.ip = this.getWord(this.addrNMI);
    };
    Mos6502Old.prototype.IRQ = function () {
        if (!this.irqRequested)
            console.log('wtf');
        console.log('process irq');
        this.pushWord(this.ip);
        this.pushByte(this.rP);
        this.flgInterruptDisable = 1;
        this.ip = this.getWord(this.addrIRQ);
    };
    /**
     * RTI - Return from Interrupt

        The RTI instruction is used at the end of an interrupt processing routine. It pulls the processor flags from the stack followed
        by the program counter.

        Processor Status after use:

        C	Carry Flag	Set from stack
        Z	Zero Flag	Set from stack
        I	Interrupt Disable	Set from stack
        D	Decimal Mode Flag	Set from stack
        B	Break Command	Set from stack
        V	Overflow Flag	Set from stack
        N	Negative Flag	Set from stack

     */
    Mos6502Old.prototype.RTI = function () {
        console.log('rti');
        this.PLP();
        this.ip = this.popWord();
    };
    Mos6502Old.prototype.ALR = function (byte) {
        //ALR #i($4B ii; 2 cycles)
        //Equivalent to AND #i then LSR A.
        this.AND(byte);
        this.LSR(this.addrRA);
    };
    Mos6502Old.prototype.ANC = function (byte) {
        //Does AND #i, setting N and Z flags based on the result. 
        //Then it copies N (bit 7) to C.ANC #$FF could be useful for sign- extending, much like CMP #$80.ANC #$00 acts like LDA #$00 followed by CLC.
        this.AND(byte);
        this.flgCarry = this.flgNegative;
    };
    Mos6502Old.prototype.ARR = function (byte) {
        //Similar to AND #i then ROR A, except sets the flags differently. N and Z are normal, but C is bit 6 and V is bit 6 xor bit 5.
        this.AND(byte);
        this.ROR(this.addrRA);
        this.flgCarry = (this.rA & (1 << 6)) !== 0 ? 1 : 0;
        this.flgOverflow = ((this.rA & (1 << 6)) >> 6) ^ ((this.rA & (1 << 5)) >> 5);
    };
    Mos6502Old.prototype.AXS = function (byte) {
        // Sets X to {(A AND X) - #value without borrow}, and updates NZC. 
        var res = (this.rA & this.rX) + 256 - byte;
        this.rX = res & 0xff;
        this.flgNegative = (this.rX & 128) !== 0 ? 1 : 0;
        this.flgCarry = res > 255 ? 1 : 0;
        this.flgZero = this.rX === 0 ? 1 : 0;
    };
    Mos6502Old.prototype.SYA = function (addr) {
        //not implemented
    };
    Mos6502Old.prototype.SXA = function (addr) {
        //not implemented
    };
    Mos6502Old.prototype.XAA = function (byte) {
        //not implemented
    };
    Mos6502Old.prototype.AXA = function (byte) {
        //not implemented
    };
    Mos6502Old.prototype.XAS = function (byte) {
        //not implemented
    };
    Mos6502Old.prototype.LAR = function (byte) {
        //not implemented
    };
    Mos6502Old.prototype.getByte = function (addr) {
        if (addr === this.addrRA)
            return this.rA;
        else
            return this.memory.getByte(addr);
    };
    Mos6502Old.prototype.setByte = function (addr, byte) {
        if (addr === this.addrRA)
            this.rA = byte;
        else
            this.memory.setByte(addr, byte);
    };
    Mos6502Old.prototype.getWord = function (addr) {
        return this.memory.getByte(addr) + 256 * this.memory.getByte(addr + 1);
    };
    Mos6502Old.prototype.getSByteRelative = function () { var b = this.memory.getByte(this.ip + 1); return b >= 128 ? b - 256 : b; };
    Mos6502Old.prototype.getByteImmediate = function () { return this.memory.getByte(this.ip + 1); };
    Mos6502Old.prototype.getWordImmediate = function () {
        //if ((this.ip & 0xff) === 0xff)
        //    this.pageCross = 1;
        return this.getWord(this.ip + 1);
    };
    Mos6502Old.prototype.getAddrZeroPage = function () { return this.getByteImmediate(); };
    Mos6502Old.prototype.getByteZeroPage = function () { return this.memory.getByte(this.getAddrZeroPage()); };
    Mos6502Old.prototype.getWordZeroPage = function () { return this.getWord(this.getAddrZeroPage()); };
    Mos6502Old.prototype.getAddrZeroPageX = function () { return (this.rX + this.getByteImmediate()) & 0xff; };
    Mos6502Old.prototype.getByteZeroPageX = function () { return this.memory.getByte(this.getAddrZeroPageX()); };
    Mos6502Old.prototype.getWordZeroPageX = function () { return this.getWord(this.getAddrZeroPageX()); };
    Mos6502Old.prototype.getAddrZeroPageY = function () { return (this.rY + this.getByteImmediate()) & 0xff; };
    Mos6502Old.prototype.getByteZeroPageY = function () { return this.memory.getByte(this.getAddrZeroPageY()); };
    Mos6502Old.prototype.getWordZeroPageY = function () { return this.getWord(this.getAddrZeroPageY()); };
    Mos6502Old.prototype.getAddrAbsolute = function () { return this.getWordImmediate(); };
    Mos6502Old.prototype.getByteAbsolute = function () { return this.memory.getByte(this.getAddrAbsolute()); };
    Mos6502Old.prototype.getWordAbsolute = function () { return this.getWord(this.getAddrAbsolute()); };
    Mos6502Old.prototype.getAddrAbsoluteX = function () {
        // For example, in the instruction LDA 1234, X, where the value in the X register is added 
        // to address 1234 to get the effective address to load the accumulator from, the operand's low' +
        // ' byte is fetched before the high byte, so the processor can start adding the X register's 
        // value before it has the high byte.If there is no carry operation, the entire indexed operation 
        // takes only four clocks, which is one microsecond at 4MHz. (I don't think there are any 65c02's 
        //  being made today that won't do at least 4MHz.) If there is a carry requiring the high byte to be ' +
        // 'incremented, it takes one additional clock.
        var w = this.getWordImmediate();
        var addr = (this.rX + w) & 0xffff;
        if (this.rX + (w & 0xff) > 0xff)
            this.pageCross = 1;
        return addr;
    };
    Mos6502Old.prototype.getByteAbsoluteX = function () { return this.memory.getByte(this.getAddrAbsoluteX()); };
    Mos6502Old.prototype.getWordAbsoluteX = function () { return this.getWord(this.getAddrAbsoluteX()); };
    Mos6502Old.prototype.getAddrAbsoluteY = function () {
        var w = this.getWordImmediate();
        var addr = (this.rY + w) & 0xffff;
        if (this.rY + (w & 0xff) > 0xff)
            this.pageCross = 1;
        return addr;
    };
    Mos6502Old.prototype.getByteAbsoluteY = function () { return this.memory.getByte(this.getAddrAbsoluteY()); };
    Mos6502Old.prototype.getWordAbsoluteY = function () { return this.getWord(this.getAddrAbsoluteY()); };
    Mos6502Old.prototype.getWordIndirect = function () {
        /*
         The 6502's memory indirect jump instruction, JMP (<address>), is partially broken.
         If <address> is hex xxFF (i.e., any word ending in FF), the processor will not jump to the address
         stored in xxFF and xxFF+1 as expected, but rather the one defined by xxFF and xx00 (for example,
         JMP ($10FF) would jump to the address stored in 10FF and 1000, instead of the one stored in 10FF and 1100).
         This defect continued through the entire NMOS line, but was corrected in the CMOS derivatives.
        */
        var addrLo = this.getWordImmediate();
        var addrHi = (addrLo & 0xff00) + ((addrLo + 1) & 0x00ff);
        return this.memory.getByte(addrLo) + 256 * this.memory.getByte(addrHi);
    };
    Mos6502Old.prototype.getAddrIndirectX = function () {
        //The 6502's Indirect-Indexed-X ((Ind,X)) addressing mode is also partially broken 
        //if the zero- page address was hex FF (i.e.last address of zero- page FF), again a case of address wrap.
        var addrLo = (this.getByteImmediate() + this.rX) & 0xff;
        var addrHi = (addrLo + 1) & 0xff;
        return this.memory.getByte(addrLo) + 256 * this.memory.getByte(addrHi);
    };
    Mos6502Old.prototype.getByteIndirectX = function () { return this.memory.getByte(this.getAddrIndirectX()); };
    Mos6502Old.prototype.getWordIndirectX = function () { return this.getWord(this.getAddrIndirectX()); };
    Mos6502Old.prototype.getAddrIndirectY = function () {
        //The 6502's Indirect-Indexed-Y ((Ind),Y) addressing mode is also partially broken.
        //If the zero- page address was hex FF (i.e.last address of zero- page FF), the processor 
        //would not fetch data from the address pointed to by 00FF and 0100 + Y, but rather the one in 00FF and 0000 + Y.
        //This defect continued through the entire NMOS line, but was fixed in some of the CMOS derivatives.
        var addrLo = this.getByteImmediate() & 0xff;
        var addrHi = (addrLo + 1) & 0xff;
        if (addrLo + this.rY > 0xff)
            this.pageCross = 1;
        return (this.memory.getByte(addrLo) + 256 * this.memory.getByte(addrHi) + this.rY) & 0xffff;
    };
    Mos6502Old.prototype.getByteIndirectY = function () { return this.memory.getByte(this.getAddrIndirectY()); };
    Mos6502Old.prototype.getWordIndirectY = function () { return this.getWord(this.getAddrIndirectY()); };
    Mos6502Old.prototype.pushByte = function (byte) {
        this.memory.setByte(0x100 + this.sp, byte & 0xff);
        this.sp = this.sp === 0 ? 0xff : this.sp - 1;
    };
    Mos6502Old.prototype.pushHi = function (word) {
        this.pushByte(word >> 8);
    };
    Mos6502Old.prototype.pushLo = function (word) {
        this.pushByte(word & 0xff);
    };
    Mos6502Old.prototype.popByte = function () {
        this.sp = this.sp === 0xff ? 0 : this.sp + 1;
        return this.memory.getByte(0x100 + this.sp);
    };
    Mos6502Old.prototype.pushWord = function (word) {
        this.pushByte((word >> 8) & 0xff);
        this.pushByte(word & 0xff);
    };
    Mos6502Old.prototype.popWord = function () {
        return this.popByte() + (this.popByte() << 8);
    };
    Mos6502Old.prototype.setJmpFlags = function (sbyte) {
        this.jumpSucceed = 1;
        var addrDstLow = (this.ip & 0xff) + sbyte + 2; // +2 because we increment the IP with 2 anyway
        this.jumpToNewPage = addrDstLow < 0 || addrDstLow > 0xff ? 1 : 0;
    };
    Mos6502Old.prototype.step = function () {
        if (this.t === this.tLim - 1)
            this.pollInterrupts();
        if (this.t === this.tLim)
            this.t = 0;
        if (this.t === 0) {
            var nmiWasRequested = this.nmiRequested;
            var irqWasRequested = this.irqRequested;
            this.irqRequested = false;
            this.nmiRequested = false;
            if (nmiWasRequested) {
                this.NMI();
                this.t = this.tLim = 0;
                return;
            }
            if (irqWasRequested) {
                this.IRQ();
                this.t = this.tLim = 0;
                return;
            }
        }
        this.processInstruction();
        this.DetectInterrupts();
        this.t++;
    };
    Mos6502Old.prototype.processInstruction = function () {
        this.pageCross = this.jumpSucceed = this.jumpToNewPage = 0;
        var ipPrev = this.ip;
        if (this.t === 0)
            this.currentOpcode = this.memory.getByte(this.ip);
        switch (this.currentOpcode) {
            case 0x69:
                if (this.t === 0) {
                    this.ADC(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x65:
                if (this.t === 0) {
                    this.ADC(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x75:
                if (this.t === 0) {
                    this.ADC(this.getByteZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x6d:
                if (this.t === 0) {
                    this.ADC(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0x7d:
                if (this.t === 0) {
                    this.ADC(this.getByteAbsoluteX());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x79:
                if (this.t === 0) {
                    this.ADC(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x61:
                if (this.t === 0) {
                    this.ADC(this.getByteIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x71:
                if (this.t === 0) {
                    this.ADC(this.getByteIndirectY());
                    this.ip += 2;
                    this.tLim = 5 + this.pageCross;
                }
                break;
            case 0x29:
                if (this.t === 0) {
                    this.AND(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x25:
                if (this.t === 0) {
                    this.AND(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x35:
                if (this.t === 0) {
                    this.AND(this.getByteZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x2D:
                if (this.t === 0) {
                    this.AND(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0x3D:
                if (this.t === 0) {
                    this.AND(this.getByteAbsoluteX());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x39:
                if (this.t === 0) {
                    this.AND(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x21:
                if (this.t === 0) {
                    this.AND(this.getByteIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x31:
                if (this.t === 0) {
                    this.AND(this.getByteIndirectY());
                    this.ip += 2;
                    this.tLim = 5 + this.pageCross;
                }
                break;
            case 0x0a:
                if (this.t === 0) {
                    this.ASL(this.addrRA);
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x06:
                if (this.t === 0) {
                    this.ASL(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0x16:
                if (this.t === 0) {
                    this.ASL(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x0e:
                if (this.t === 0) {
                    this.ASL(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0x1e:
                if (this.t === 0) {
                    this.ASL(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x90:
                if (this.t === 0) {
                    this.BCC(this.getSByteRelative());
                    this.ip += 2;
                    this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;
                }
                break;
            case 0xb0:
                if (this.t === 0) {
                    this.BCS(this.getSByteRelative());
                    this.ip += 2;
                    this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;
                }
                break;
            case 0xf0:
                if (this.t === 0) {
                    this.BEQ(this.getSByteRelative());
                    this.ip += 2;
                    this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;
                }
                break;
            case 0x30:
                if (this.t === 0) {
                    this.BMI(this.getSByteRelative());
                    this.ip += 2;
                    this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;
                }
                break;
            case 0xd0:
                if (this.t === 0) {
                    this.BNE(this.getSByteRelative());
                    this.ip += 2;
                    this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;
                }
                break;
            case 0x10:
                if (this.t === 0) {
                    this.BPL(this.getSByteRelative());
                    this.ip += 2;
                    this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;
                }
                break;
            case 0x50:
                if (this.t === 0) {
                    this.BVC(this.getSByteRelative());
                    this.ip += 2;
                    this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;
                }
                break;
            case 0x70:
                if (this.t === 0) {
                    this.BVS(this.getSByteRelative());
                    this.ip += 2;
                    this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;
                }
                break;
            case 0x24:
                if (this.t === 0) {
                    this.BIT(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x2c:
                //if (this.t === 0) { this.BIT(this.getByteAbsolute()); this.ip += 3; this.tLim = 4; } break;
                switch (this.t) {
                    case 0:
                        this.tLim = 4;
                        break;
                    case 3:
                        this.BIT(this.getByteAbsolute());
                        this.ip += 3;
                        break;
                }
                break;
            case 0x18:
                if (this.t === 0) {
                    this.CLC();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0xd8:
                if (this.t === 0) {
                    this.CLD();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x58:
                //if (this.t === 0) { this.CLI(); this.ip += 1; this.tLim = 2; } break;
                switch (this.t) {
                    case 0:
                        this.ip += 1;
                        this.tLim = 2;
                        break;
                    case 1:
                        this.CLI();
                        break;
                }
                break;
            case 0xb8:
                if (this.t === 0) {
                    this.CLV();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0xc9:
                if (this.t === 0) {
                    this.CMP(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xc5:
                if (this.t === 0) {
                    this.CMP(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0xd5:
                if (this.t === 0) {
                    this.CMP(this.getByteZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0xcd:
                if (this.t === 0) {
                    this.CMP(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0xdd:
                if (this.t === 0) {
                    this.CMP(this.getByteAbsoluteX());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xd9:
                if (this.t === 0) {
                    this.CMP(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xc1:
                if (this.t === 0) {
                    this.CMP(this.getByteIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0xd1:
                if (this.t === 0) {
                    this.CMP(this.getByteIndirectY());
                    this.ip += 2;
                    this.tLim = 5 + this.pageCross;
                }
                break;
            case 0xe0:
                if (this.t === 0) {
                    this.CPX(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xe4:
                if (this.t === 0) {
                    this.CPX(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0xec:
                if (this.t === 0) {
                    this.CPX(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0xc0:
                if (this.t === 0) {
                    this.CPY(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xc4:
                if (this.t === 0) {
                    this.CPY(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0xcc:
                if (this.t === 0) {
                    this.CPY(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0xc6:
                if (this.t === 0) {
                    this.DEC(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0xd6:
                if (this.t === 0) {
                    this.DEC(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0xce:
                if (this.t === 0) {
                    this.DEC(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0xde:
                if (this.t === 0) {
                    this.DEC(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0xca:
                if (this.t === 0) {
                    this.DEX();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x88:
                if (this.t === 0) {
                    this.DEY();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0xe6:
                if (this.t === 0) {
                    this.INC(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0xf6:
                if (this.t === 0) {
                    this.INC(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0xee:
                if (this.t === 0) {
                    this.INC(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0xfe:
                if (this.t === 0) {
                    this.INC(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0xe8:
                if (this.t === 0) {
                    this.INX();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0xc8:
                if (this.t === 0) {
                    this.INY();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x49:
                if (this.t === 0) {
                    this.EOR(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x45:
                if (this.t === 0) {
                    this.EOR(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x55:
                if (this.t === 0) {
                    this.EOR(this.getByteZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x4D:
                if (this.t === 0) {
                    this.EOR(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0x5D:
                if (this.t === 0) {
                    this.EOR(this.getByteAbsoluteX());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x59:
                if (this.t === 0) {
                    this.EOR(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x41:
                if (this.t === 0) {
                    this.EOR(this.getByteIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x51:
                if (this.t === 0) {
                    this.EOR(this.getByteIndirectY());
                    this.ip += 2;
                    this.tLim = 5 + this.pageCross;
                }
                break;
            case 0x4c:
                if (this.t === 0) {
                    this.ip = this.getAddrAbsolute();
                    this.tLim = 3;
                }
                break;
            case 0x6c:
                if (this.t === 0) {
                    this.ip = this.getWordIndirect();
                    this.tLim = 5;
                }
                break;
            case 0xa9:
                if (this.t === 0) {
                    this.LDA(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xa5:
                if (this.t === 0) {
                    this.LDA(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0xb5:
                if (this.t === 0) {
                    this.LDA(this.getByteZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0xad:
                if (this.t === 0) {
                    this.LDA(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0xbd:
                if (this.t === 0) {
                    this.LDA(this.getByteAbsoluteX());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xb9:
                if (this.t === 0) {
                    this.LDA(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xa1:
                if (this.t === 0) {
                    this.LDA(this.getByteIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0xb1:
                if (this.t === 0) {
                    this.LDA(this.getByteIndirectY());
                    this.ip += 2;
                    this.tLim = 5 + this.pageCross;
                }
                break;
            case 0xa2:
                if (this.t === 0) {
                    this.LDX(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xa6:
                if (this.t === 0) {
                    this.LDX(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0xb6:
                if (this.t === 0) {
                    this.LDX(this.getByteZeroPageY());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0xae:
                if (this.t === 0) {
                    this.LDX(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0xbe:
                if (this.t === 0) {
                    this.LDX(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xa0:
                if (this.t === 0) {
                    this.LDY(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xa4:
                if (this.t === 0) {
                    this.LDY(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0xb4:
                if (this.t === 0) {
                    this.LDY(this.getByteZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0xac:
                if (this.t === 0) {
                    this.LDY(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0xbc:
                if (this.t === 0) {
                    this.LDY(this.getByteAbsoluteX());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x4a:
                if (this.t === 0) {
                    this.LSR(this.addrRA);
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x46:
                if (this.t === 0) {
                    this.LSR(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0x56:
                if (this.t === 0) {
                    this.LSR(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x4e:
                if (this.t === 0) {
                    this.LSR(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0x5e:
                if (this.t === 0) {
                    this.LSR(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0xea:
                if (this.t === 0) {
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x09:
                if (this.t === 0) {
                    this.ORA(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x05:
                if (this.t === 0) {
                    this.ORA(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x15:
                if (this.t === 0) {
                    this.ORA(this.getByteZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x0d:
                if (this.t === 0) {
                    this.ORA(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0x1d:
                if (this.t === 0) {
                    this.ORA(this.getByteAbsoluteX());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x19:
                if (this.t === 0) {
                    this.ORA(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x01:
                if (this.t === 0) {
                    this.ORA(this.getByteIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x11:
                if (this.t === 0) {
                    this.ORA(this.getByteIndirectY());
                    this.ip += 2;
                    this.tLim = 5 + this.pageCross;
                }
                break;
            case 0x48:
                if (this.t === 0) {
                    this.PHA();
                    this.ip += 1;
                    this.tLim = 3;
                }
                break;
            case 0x08:
                if (this.t === 0) {
                    this.PHP();
                    this.ip += 1;
                    this.tLim = 3;
                }
                break;
            case 0x68:
                if (this.t === 0) {
                    this.PLA();
                    this.ip += 1;
                    this.tLim = 4;
                }
                break;
            case 0x28:
                //if (this.t === 0) { this.PLP(); this.ip += 1; this.tLim = 4; } break;
                switch (this.t) {
                    case 0:
                        this.ip += 1;
                        this.tLim = 4;
                        break;
                    case 3:
                        this.PLP();
                        break;
                }
                break;
            case 0x2a:
                if (this.t === 0) {
                    this.ROL(this.addrRA);
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x26:
                if (this.t === 0) {
                    this.ROL(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0x36:
                if (this.t === 0) {
                    this.ROL(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x2e:
                if (this.t === 0) {
                    this.ROL(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0x3e:
                if (this.t === 0) {
                    this.ROL(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x6a:
                if (this.t === 0) {
                    this.ROR(this.addrRA);
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x66:
                if (this.t === 0) {
                    this.ROR(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0x76:
                if (this.t === 0) {
                    this.ROR(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x6e:
                if (this.t === 0) {
                    this.ROR(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0x7e:
                if (this.t === 0) {
                    this.ROR(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x00:
                this.BRK();
                break;
            case 0x40:
                if (this.t === 0) {
                    this.RTI();
                    this.tLim = 6;
                }
                break;
            case 0xe9:
                if (this.t === 0) {
                    this.SBC(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xe5:
                if (this.t === 0) {
                    this.SBC(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0xf5:
                if (this.t === 0) {
                    this.SBC(this.getByteZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0xed:
                if (this.t === 0) {
                    this.SBC(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0xfd:
                if (this.t === 0) {
                    this.SBC(this.getByteAbsoluteX());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xf9:
                if (this.t === 0) {
                    this.SBC(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xe1:
                if (this.t === 0) {
                    this.SBC(this.getByteIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0xf1:
                if (this.t === 0) {
                    this.SBC(this.getByteIndirectY());
                    this.ip += 2;
                    this.tLim = 5 + this.pageCross;
                }
                break;
            case 0x38:
                if (this.t === 0) {
                    this.flgCarry = 1;
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0xf8:
                if (this.t === 0) {
                    this.flgDecimalMode = 1;
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x78:
                //if (this.t === 0) {/*SED*/ this.SEI(); this.ip += 1; this.tLim = 2; } break;
                switch (this.t) {
                    case 0:
                        this.ip += 1;
                        this.tLim = 2;
                        break;
                    case 1:
                        this.SEI();
                        break;
                }
                break;
            case 0x85:
                if (this.t === 0) {
                    this.STA(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x95:
                if (this.t === 0) {
                    this.STA(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x8d:
                if (this.t === 0) {
                    this.STA(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0x9d:
                if (this.t === 0) {
                    this.STA(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 5;
                }
                break;
            case 0x99:
                if (this.t === 0) {
                    this.STA(this.getAddrAbsoluteY());
                    this.ip += 3;
                    this.tLim = 5;
                }
                break;
            case 0x81:
                if (this.t === 0) {
                    this.STA(this.getAddrIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x91:
                if (this.t === 0) {
                    this.STA(this.getAddrIndirectY());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x86:
                if (this.t === 0) {
                    this.STX(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x96:
                if (this.t === 0) {
                    this.STX(this.getAddrZeroPageY());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x8e:
                if (this.t === 0) {
                    this.STX(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0x84:
                if (this.t === 0) {
                    this.STY(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x94:
                if (this.t === 0) {
                    this.STY(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x8c:
                if (this.t === 0) {
                    this.STY(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0xaa:
                if (this.t === 0) {
                    this.TAX();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0xa8:
                if (this.t === 0) {
                    this.TAY();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0xba:
                if (this.t === 0) {
                    this.TSX();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x8a:
                if (this.t === 0) {
                    this.TXA();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x9a:
                if (this.t === 0) {
                    this.TXS();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x98:
                if (this.t === 0) {
                    this.TYA();
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x20:
                if (this.t === 0) {
                    this.JSR(this.getAddrAbsolute());
                    this.tLim = 6;
                }
                break;
            case 0x60:
                if (this.t === 0) {
                    this.RTS();
                    this.tLim = 6;
                }
                break;
            //unofficial opcodes below
            case 0x1a:
                if (this.t === 0) {
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x3a:
                if (this.t === 0) {
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x5a:
                if (this.t === 0) {
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x7a:
                if (this.t === 0) {
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0xda:
                if (this.t === 0) {
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0xfa:
                if (this.t === 0) {
                    this.ip += 1;
                    this.tLim = 2;
                }
                break;
            case 0x04:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x14:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x34:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x44:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x54:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x64:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x74:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0xd4:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0xf4:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x80:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x82:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xc2:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xe2:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x89:
                if (this.t === 0) {
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x0c:
                if (this.t === 0) {
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0x1c:
                if (this.t === 0) {
                    this.getAddrAbsoluteX();
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x3c:
                if (this.t === 0) {
                    this.getAddrAbsoluteX();
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x5c:
                if (this.t === 0) {
                    this.getAddrAbsoluteX();
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0x7c:
                if (this.t === 0) {
                    this.getAddrAbsoluteX();
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xdc:
                if (this.t === 0) {
                    this.getAddrAbsoluteX();
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xfc:
                if (this.t === 0) {
                    this.getAddrAbsoluteX();
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xeb:
                if (this.t === 0) {
                    this.SBC(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xc3:
                if (this.t === 0) {
                    this.DCP(this.getAddrIndirectX());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0xc7:
                if (this.t === 0) {
                    this.DCP(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0xcf:
                if (this.t === 0) {
                    this.DCP(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0xd3:
                if (this.t === 0) {
                    this.DCP(this.getAddrIndirectY());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0xd7:
                if (this.t === 0) {
                    this.DCP(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0xdb:
                if (this.t === 0) {
                    this.DCP(this.getAddrAbsoluteY());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0xdf:
                if (this.t === 0) {
                    this.DCP(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0xe3:
                if (this.t === 0) {
                    this.ISC(this.getAddrIndirectX());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0xe7:
                if (this.t === 0) {
                    this.ISC(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0xef:
                if (this.t === 0) {
                    this.ISC(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0xf3:
                if (this.t === 0) {
                    this.ISC(this.getAddrIndirectY());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0xf7:
                if (this.t === 0) {
                    this.ISC(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0xfb:
                if (this.t === 0) {
                    this.ISC(this.getAddrAbsoluteY());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0xff:
                if (this.t === 0) {
                    this.ISC(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0xab:
                if (this.t === 0) {
                    this.LAX(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xa7:
                if (this.t === 0) {
                    this.LAX(this.getByteZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0xb7:
                if (this.t === 0) {
                    this.LAX(this.getByteZeroPageY());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0xaf:
                if (this.t === 0) {
                    this.LAX(this.getByteAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0xbf:
                if (this.t === 0) {
                    this.LAX(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            case 0xa3:
                if (this.t === 0) {
                    this.LAX(this.getByteIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0xb3:
                if (this.t === 0) {
                    this.LAX(this.getByteIndirectY());
                    this.ip += 2;
                    this.tLim = 5 + this.pageCross;
                }
                break;
            case 0x83:
                if (this.t === 0) {
                    this.SAX(this.getAddrIndirectX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x87:
                if (this.t === 0) {
                    this.SAX(this.getAddrZeroPage());
                    this.ip += 2;
                    this.tLim = 3;
                }
                break;
            case 0x8f:
                if (this.t === 0) {
                    this.SAX(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 4;
                }
                break;
            case 0x97:
                if (this.t === 0) {
                    this.SAX(this.getAddrZeroPageY());
                    this.ip += 2;
                    this.tLim = 4;
                }
                break;
            case 0x03:
                if (this.t === 0) {
                    this.SLO(this.getAddrIndirectX());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0x07:
                if (this.t === 0) {
                    this.SLO(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0x0f:
                if (this.t === 0) {
                    this.SLO(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0x13:
                if (this.t === 0) {
                    this.SLO(this.getAddrIndirectY());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0x17:
                if (this.t === 0) {
                    this.SLO(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x1b:
                if (this.t === 0) {
                    this.SLO(this.getAddrAbsoluteY());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x1f:
                if (this.t === 0) {
                    this.SLO(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x23:
                if (this.t === 0) {
                    this.RLA(this.getAddrIndirectX());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0x27:
                if (this.t === 0) {
                    this.RLA(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0x2f:
                if (this.t === 0) {
                    this.RLA(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0x33:
                if (this.t === 0) {
                    this.RLA(this.getAddrIndirectY());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0x37:
                if (this.t === 0) {
                    this.RLA(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x3b:
                if (this.t === 0) {
                    this.RLA(this.getAddrAbsoluteY());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x3f:
                if (this.t === 0) {
                    this.RLA(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x63:
                if (this.t === 0) {
                    this.RRA(this.getAddrIndirectX());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0x67:
                if (this.t === 0) {
                    this.RRA(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0x6f:
                if (this.t === 0) {
                    this.RRA(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0x73:
                if (this.t === 0) {
                    this.RRA(this.getAddrIndirectY());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0x77:
                if (this.t === 0) {
                    this.RRA(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x7b:
                if (this.t === 0) {
                    this.RRA(this.getAddrAbsoluteY());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x7f:
                if (this.t === 0) {
                    this.RRA(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x43:
                if (this.t === 0) {
                    this.SRE(this.getAddrIndirectX());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0x47:
                if (this.t === 0) {
                    this.SRE(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 5;
                }
                break;
            case 0x4f:
                if (this.t === 0) {
                    this.SRE(this.getAddrAbsolute());
                    this.ip += 3;
                    this.tLim = 6;
                }
                break;
            case 0x53:
                if (this.t === 0) {
                    this.SRE(this.getAddrIndirectY());
                    this.ip += 2;
                    this.tLim = 8;
                }
                break;
            case 0x57:
                if (this.t === 0) {
                    this.SRE(this.getAddrZeroPageX());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x5b:
                if (this.t === 0) {
                    this.SRE(this.getAddrAbsoluteY());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x5f:
                if (this.t === 0) {
                    this.SRE(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 7;
                }
                break;
            case 0x0b:
                if (this.t === 0) {
                    this.ANC(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x2b:
                if (this.t === 0) {
                    this.ANC(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x4b:
                if (this.t === 0) {
                    this.ALR(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x6b:
                if (this.t === 0) {
                    this.ARR(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0xcb:
                if (this.t === 0) {
                    this.AXS(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x9c:
                if (this.t === 0) {
                    this.SYA(this.getAddrAbsoluteX());
                    this.ip += 3;
                    this.tLim = 5;
                }
                break;
            case 0x9e:
                if (this.t === 0) {
                    this.SXA(this.getAddrAbsoluteY());
                    this.ip += 3;
                    this.tLim = 5;
                }
                break;
            case 0x8b:
                if (this.t === 0) {
                    this.XAA(this.getByteImmediate());
                    this.ip += 2;
                    this.tLim = 2;
                }
                break;
            case 0x93:
                if (this.t === 0) {
                    this.AXA(this.getByteIndirectY());
                    this.ip += 2;
                    this.tLim = 6;
                }
                break;
            case 0x9b:
                if (this.t === 0) {
                    this.XAS(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 5;
                }
                break;
            case 0x9f:
                if (this.t === 0) {
                    this.AXA(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 5;
                }
                break;
            case 0xbb:
                if (this.t === 0) {
                    this.LAR(this.getByteAbsoluteY());
                    this.ip += 3;
                    this.tLim = 4 + this.pageCross;
                }
                break;
            default:
                throw 'unkown opcode $' + (this.memory.getByte(this.ip)).toString(16);
        }
        if (this.tLim === 0) {
            throw 'sleep not set';
        }
        this.ip &= 0xffff;
    };
    return Mos6502Old;
})();
///<reference path="NesEmulator.ts"/>
///<reference path="NesRunnerBase.ts"/>
var NesRunner = (function (_super) {
    __extends(NesRunner, _super);
    function NesRunner(container, url) {
        _super.call(this, container, url);
        this.callback = this.renderFrame.bind(this);
        this.iFrameStart = 0;
        this.hpcStart = 0;
    }
    NesRunner.prototype.runI = function () {
        this.hpcStart = window.performance.now();
        this.iFrameStart = this.nesEmulator.ppu.iFrame;
        this.fpsElement = document.createElement("span");
        this.headerElement.innerText += " ";
        this.headerElement.appendChild(this.fpsElement);
        requestAnimationFrame(this.callback);
    };
    NesRunner.prototype.renderFrame = function (hpcNow) {
        var nesEmulator = this.nesEmulator;
        var ppu = nesEmulator.ppu;
        var dt = hpcNow - this.hpcStart;
        if (dt > 1000) {
            var fps = (ppu.iFrame - this.iFrameStart) / dt * 1000;
            this.fpsElement.innerText = Math.round(fps * 100) / 100 + " fps";
            this.iFrameStart = ppu.iFrame;
            this.hpcStart = hpcNow;
        }
        var frameCurrent = ppu.iFrame;
        while (frameCurrent === ppu.iFrame)
            nesEmulator.step();
        requestAnimationFrame(this.callback);
    };
    return NesRunner;
})(NesRunnerBase);
var SpriteRenderingInfo = (function () {
    function SpriteRenderingInfo() {
        this.flgZeroSprite = false;
        this.xCounter = -1000;
        this.tileLo = 0;
        this.tileHi = 0;
        this.ipaletteBase = 0;
        this.flipHoriz = false;
        this.flipVert = false;
        this.behindBg = false;
    }
    return SpriteRenderingInfo;
})();
var OamState;
(function (OamState) {
    OamState[OamState["FillSecondaryOam"] = 0] = "FillSecondaryOam";
    OamState[OamState["CheckOverflow"] = 1] = "CheckOverflow";
    OamState[OamState["Done"] = 2] = "Done";
})(OamState || (OamState = {}));
var PPU = (function () {
    function PPU(memory, vmemory, cpu) {
        this.vmemory = vmemory;
        this.cpu = cpu;
        /**
         *
            Address range	Size	Description
            $0000-$0FFF	$1000	Pattern table 0
            $1000-$1FFF	$1000	Pattern Table 1
            $2000-$23FF	$0400	Nametable 0
            $2400-$27FF	$0400	Nametable 1
            $2800-$2BFF	$0400	Nametable 2
            $2C00-$2FFF	$0400	Nametable 3
            $3000-$3EFF	$0F00	Mirrors of $2000-$2EFF
            $3F00-$3F1F	$0020	Palette RAM indexes
            $3F20-$3FFF	$00E0	Mirrors of $3F00-$3F1F
    
         */
        /**
        *The PPU uses the current VRAM address for both reading and writing PPU memory thru $2007, and for
        * fetching nametable data to draw the background. As it's drawing the background, it updates the
        * address to point to the nametable data currently being drawn. Bits 10-11 hold the base address of
        * the nametable minus $2000. Bits 12-14 are the Y offset of a scanline within a tile.
           The 15 bit registers t and v are composed this way during rendering:
           yyy NN YYYYY XXXXX
           ||| || ||||| +++++-- coarse X scroll
           ||| || +++++-------- coarse Y scroll
           ||| ++-------------- nametable select
           +++----------------- fine Y scroll
        */
        this.addrOam = 0; // Current oam address
        this.v = 0; // Current VRAM address (15 bits)
        this.t = 0; // Temporary VRAM address (15 bits); can also be thought of as the address of the top left onscreen tile.
        this.x = 0; // Fine X scroll (3 bits)
        this.w = 0; // First or second write toggle (1 bit)
        this.daddrWrite = 0;
        this.addrSpriteBase = 0;
        this.addrTileBase = 0;
        this.flgVblank = false;
        this.flgVblankSuppress = false;
        this.flgSpriteZeroHit = false;
        this.flgSpriteOverflow = false;
        this.nmi_output = false;
        this.spriteHeight = 8;
        this.imageGrayscale = false;
        this.showBgInLeftmost8Pixels = false;
        this.showSpritesInLeftmost8Pixels = false;
        this.showBg = false;
        this.showSprites = false;
        this.emphasizeRed = false;
        this.emphasizeGreen = false;
        this.emphasizeBlue = false;
        this.sy = PPU.syFirstVisible;
        this.sx = PPU.sxMin;
        this.dataAddr = 0;
        this.iFrame = 0;
        this.ispriteNext = 0;
        this.lastWrittenStuff = 0;
        this.vramReadBuffer = 0;
        this.icycle = 0;
        this.shortFrame = false;
        this.colors = new Uint32Array([
            0xff545454, 0xff741e00, 0xff901008, 0xff880030,
            0xff640044, 0xff30005c, 0xff000454, 0xff00183c,
            0xff002a20, 0xff003a08, 0xff004000, 0xff003c00,
            0xff3c3200, 0xff000000, 0xff000000, 0xff000000,
            0xff989698, 0xffc44c08, 0xffec3230, 0xffe41e5c,
            0xffb01488, 0xff6414a0, 0xff202298, 0xff003c78,
            0xff005a54, 0xff007228, 0xff007c08, 0xff287600,
            0xff786600, 0xff000000, 0xff000000, 0xff000000,
            0xffeceeec, 0xffec9a4c, 0xffec7c78, 0xffec62b0,
            0xffec54e4, 0xffb458ec, 0xff646aec, 0xff2088d4,
            0xff00aaa0, 0xff00c474, 0xff20d04c, 0xff6ccc38,
            0xffccb438, 0xff3c3c3c, 0xff000000, 0xff000000,
            0xffeceeec, 0xffeccca8, 0xffecbcbc, 0xffecb2d4,
            0xffecaeec, 0xffd4aeec, 0xffb0b4ec, 0xff90c4e4,
            0xff78d2cc, 0xff78deb4, 0xff90e2a8, 0xffb4e298,
            0xffe4d6a0, 0xffa0a2a0, 0xff000000, 0xff000000
        ]);
        this.initialPaletteValues = [
            0x09, 0x01, 0x00, 0x01, 0x00, 0x02, 0x02, 0x0D, 0x08, 0x10, 0x08, 0x24, 0x00, 0x00, 0x04, 0x2C,
            0x09, 0x01, 0x34, 0x03, 0x00, 0x04, 0x00, 0x14, 0x08, 0x3A, 0x00, 0x02, 0x00, 0x20, 0x2C, 0x08
        ];
        if (vmemory.size() !== 0x4000)
            throw 'insufficient Vmemory size';
        memory.shadowSetter(0x2000, 0x3fff, this.ppuRegistersSetter.bind(this));
        memory.shadowGetter(0x2000, 0x3fff, this.ppuRegistersGetter.bind(this));
        vmemory.shadowSetter(0x3000, 0x3eff, this.nameTableSetter.bind(this));
        vmemory.shadowGetter(0x3000, 0x3eff, this.nameTableGetter.bind(this));
        vmemory.shadowSetter(0x3f10, 0x3f10, this.paletteSetter.bind(this));
        vmemory.shadowGetter(0x3f10, 0x3f10, this.paletteGetter.bind(this));
        vmemory.shadowSetter(0x3f20, 0x3fff, this.paletteSetter.bind(this));
        vmemory.shadowGetter(0x3f20, 0x3fff, this.paletteGetter.bind(this));
        this.secondaryOam = new Uint8Array(32);
        this.secondaryOamISprite = new Int8Array(8);
        this.oam = new Uint8Array(256);
        this.rgspriteRenderingInfo = [];
        for (var isprite = 0; isprite < 8; isprite++)
            this.rgspriteRenderingInfo.push(new SpriteRenderingInfo());
        for (var i = 0; i < 32; i++)
            this.vmemory.setByte(0x3f00 + i, this.initialPaletteValues[i]);
    }
    Object.defineProperty(PPU.prototype, "y", {
        /**
         * yyy NN YYYYY XXXXX
            ||| || ||||| +++++-- coarse X scroll
            ||| || +++++-------- coarse Y scroll
            ||| ++-------------- nametable select
            +++----------------- fine Y scroll
         */
        get: function () {
            return (this.t >> 12) & 0x7;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PPU.prototype, "currentNameTable", {
        get: function () {
            return (this.t >> 10) & 0x3;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PPU.prototype, "coarseY", {
        get: function () {
            return (this.t >> 5) & 31;
        },
        set: function (value) {
            this.t = (this.t & 0x7c1f) | ((value & 31) << 5);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PPU.prototype, "coarseX", {
        get: function () {
            return this.t & 31;
        },
        set: function (value) {
            this.t = (this.t & 0x7fe0) | ((value & 31));
        },
        enumerable: true,
        configurable: true
    });
    PPU.prototype.setRenderer = function (renderer) {
        this.renderer = renderer;
        this.data = this.renderer.getBuffer();
    };
    PPU.prototype.nameTableSetter = function (addr, value) {
        return this.vmemory.setByte(addr - 0x1000, value);
    };
    PPU.prototype.nameTableGetter = function (addr) {
        return this.vmemory.getByte(addr - 0x1000);
    };
    PPU.prototype.paletteSetter = function (addr, value) {
        if (addr === 0x3f10)
            addr = 0x3f00;
        else
            addr = 0x3f00 + (addr - 0x3f20) % 0x20;
        return this.vmemory.setByte(addr, value);
    };
    PPU.prototype.paletteGetter = function (addr) {
        if (addr === 0x3f10)
            addr = 0x3f00;
        else
            addr = 0x3f00 + (addr - 0x3f20) % 0x20;
        return this.vmemory.getByte(addr);
    };
    PPU.prototype.ppuRegistersGetter = function (addr) {
        addr = (addr - 0x2000) % 8;
        switch (addr) {
            case 0x2:
                {
                    /*
                    7  bit  0
                    ---- ----
                    VSO. ....
                    |||| ||||
                    |||+-++++- Least significant bits previously written into a PPU register
                    |||        (due to register not being updated for this address)
                    ||+------- Sprite overflow. The intent was for this flag to be set
                    ||         whenever more than eight sprites appear on a scanline, but a
                    ||         hardware bug causes the actual behavior to be more complicated
                    ||         and generate false positives as well as false negatives; see
                    ||         PPU sprite evaluation. This flag is set during sprite
                    ||         evaluation and cleared at dot 1 (the second dot) of the
                    ||         pre-render line.
                    |+-------- Sprite 0 Hit.  Set when a nonzero pixel of sprite 0 overlaps
                    |          a nonzero background pixel; cleared at dot 1 of the pre-render
                    |          line.  Used for raster timing.
                    +--------- Vertical blank has started (0: not in vblank; 1: in vblank).
                               Set at dot 1 of line 241 (the line *after* the post-render
                               line); cleared after reading $2002 and at dot 1 of the
                               pre-render line.
                    Notes
                    Reading the status register will clear D7 mentioned above and also the address latch used by PPUSCROLL and PPUADDR. It does not clear the sprite 0 hit or overflow bit.
                    Once the sprite 0 hit flag is set, it will not be cleared until the end of the next vertical blank. If attempting to use this flag for raster timing, it is important to ensure that the sprite 0 hit check happens outside of vertical blank, otherwise the CPU will "leak" through and the check will fail. The easiest way to do this is to place an earlier check for D6 = 0, which will wait for the pre-render scanline to begin.
                    If using sprite 0 hit to make a bottom scroll bar below a vertically scrolling or freely scrolling playfield, be careful to ensure that the tile in the playfield behind sprite 0 is opaque.
                    Sprite 0 hit is not detected at x=255, nor is it detected at x=0 through 7 if the background or sprites are hidden in this area.
                    See: PPU rendering for more information on the timing of setting and clearing the flags.
                    Some Vs. System PPUs return a constant value in D4-D0 that the game checks.
                    Caution: Reading PPUSTATUS at the exact start of vertical blank will return 0 in bit 7 but clear the latch anyway, causing the program to miss frames. See NMI for details
                  */
                    this.w = 0;
                    var res = (this.flgVblank ? (1 << 7) : 0)
                        | (this.flgSpriteZeroHit ? (1 << 6) : 0)
                        | (this.flgSpriteOverflow ? (1 << 5) : 0)
                        | (this.lastWrittenStuff & 31);
                    //Read PPUSTATUS: Return old status of NMI_occurred in bit 7, then set NMI_occurred to false.
                    this.flgVblank = false;
                    this.flgVblankSuppress = true; //suppress setting flgVBlank in next ppu cycle http://wiki.nesdev.com/w/index.php/PPU_frame_timing#VBL_Flag_Timing
                    this.cpu.nmiLine = 1;
                    return res;
                }
            case 0x4:
                {
                    return this.oam[this.addrOam & 0xff];
                }
            case 0x7:
                {
                    this.v &= 0x3fff;
                    var res;
                    if (this.v >= 0x3f00) {
                        res = this.vmemory.getByte(this.v);
                        this.vramReadBuffer = this.vmemory.getByte((this.v & 0xff) | 0x2f00);
                    }
                    else {
                        res = this.vramReadBuffer;
                        this.vramReadBuffer = this.vmemory.getByte(this.v);
                    }
                    this.v += this.daddrWrite;
                    this.v &= 0x3fff;
                    return res;
                }
            default:
                console.error('unimplemented read from addr ' + addr);
                return 0;
        }
    };
    PPU.prototype.ppuRegistersSetter = function (addr, value) {
        this.lastWrittenStuff = value;
        value &= 0xff;
        addr = (addr - 0x2000) % 8;
        switch (addr) {
            case 0x0:
                this.t = (this.t & 0x73ff) | ((value & 3) << 10); //2 nametable select bits sent to $2000
                this.daddrWrite = value & 0x04 ? 32 : 1; //VRAM address increment per CPU read/write of PPUDATA
                this.addrSpriteBase = value & 0x08 ? 0x1000 : 0;
                this.addrTileBase = value & 0x10 ? 0x1000 : 0;
                this.spriteHeight = value & 0x20 ? 16 : 8;
                this.nmi_output = !!(value & 0x80);
                if (!this.nmi_output)
                    this.cpu.nmiLine = 1;
                if (this.sy === 261 && this.sx === 1)
                    this.flgVblank = false;
                if (this.nmi_output && this.flgVblank)
                    this.cpu.nmiLine = 0;
                break;
            case 0x1:
                this.imageGrayscale = !!(value & 0x01);
                this.showBgInLeftmost8Pixels = !!(value & 0x02);
                this.showSpritesInLeftmost8Pixels = !!(value & 0x04);
                this.showBg = !!(value & 0x08);
                this.showSprites = !!(value & 0x10);
                this.emphasizeRed = !!(value & 0x20);
                this.emphasizeGreen = !!(value & 0x40);
                this.emphasizeBlue = !!(value & 0x80);
                break;
            case 0x3:
                this.addrOam = value;
                break;
            case 0x4:
                if ((this.showBg || this.showSprites) && (this.sy === 261 || this.sy < 240)) {
                    this.addrOam += 4;
                }
                else {
                    this.oam[this.addrOam & 0xff] = value;
                    this.addrOam++;
                }
                this.addrOam &= 255;
                //this.addrOam++;
                break;
            case 0x5:
                if (this.w === 0) {
                    this.t = (this.t & 0x73e0) | ((value >> 3) & 0x1f);
                    this.x = value & 7;
                }
                else {
                    this.t = (this.t & 0x7c1f) | (((value >> 3) & 0x1f) << 5);
                    this.t = (this.t & 0x0fff) | (value & 7) << 10;
                }
                this.w = 1 - this.w;
                break;
            // Used to set the address of PPU Memory to be accessed via 0x2007
            // The first write to this register will set 8 lower address bits.
            // The second write will set 6 upper bits.The address will increment
            // either by 1 or by 32 after each access to $2007.
            case 0x6:
                if (this.w === 0) {
                    this.t = (this.t & 0x00ff) | ((value & 0x3f) << 8);
                }
                else {
                    this.t = (this.t & 0xff00) + (value & 0xff);
                    this.v = this.t;
                }
                this.w = 1 - this.w;
                break;
            case 0x7:
                this.vmemory.setByte(this.v & 0x3fff, value);
                this.v += this.daddrWrite;
                this.v &= 0x3fff;
                break;
        }
    };
    PPU.prototype.resetHoriV = function () {
        if (!this.showBg && !this.showSprites)
            return;
        // At dot 257 of each scanline
        // If rendering is enabled, the PPU copies all bits related to horizontal position from t to v:
        // v: ....F.. ...EDCBA = t: ....F.. ...EDCBA
        this.v = (this.v & 0xfbe0) | (this.t & 0x041f);
    };
    PPU.prototype.resetVertV = function () {
        if (!this.showBg && !this.showSprites)
            return;
        //During dots 280 to 304 of the pre-render scanline (end of vblank)
        //If rendering is enabled, at the end of vblank, shortly after the horizontal bits are copied from t to v at dot 257, the PPU will repeatedly copy the vertical bits from t to v from dots 280 to 304, completing the full initialization of v from t:
        //v: IHGF.ED CBA..... = t: IHGF.ED CBA.....
        this.v = (this.v & 0x041f) | (this.t & 0xfbe0);
    };
    PPU.prototype.incHoriV = function () {
        if (!this.showBg && !this.showSprites)
            return;
        // Coarse X increment
        // The coarse X component of v needs to be incremented when the next tile is reached.
        // Bits 0- 4 are incremented, with overflow toggling bit 10. This means that bits 0- 4 count 
        // from 0 to 31 across a single nametable, and bit 10 selects the current nametable horizontally.
        if ((this.v & 0x001F) === 31) {
            this.v &= ~0x001F; // coarse X = 0
            this.v ^= 0x0400; // switch horizontal nametable
        }
        else {
            this.v += 1; // increment coarse X
        }
    };
    PPU.prototype.incVertV = function () {
        if (!this.showBg && !this.showSprites)
            return;
        this.v = (this.v & ~0x001F) | (this.t & 0x1f); // reset coarse X
        this.v ^= 0x0400; // switch horizontal nametable
        // If rendering is enabled, fine Y is incremented at dot 256 of each scanline, overflowing to coarse Y, 
        // and finally adjusted to wrap among the nametables vertically.
        // Bits 12- 14 are fine Y.Bits 5- 9 are coarse Y.Bit 11 selects the vertical nametable.
        if ((this.v & 0x7000) !== 0x7000)
            this.v += 0x1000; // increment fine Y
        else {
            this.v &= ~0x7000; // fine Y = 0
            var y = (this.v & 0x03E0) >> 5; // let y = coarse Y
            if (y === 29) {
                y = 0; // coarse Y = 0
                this.v ^= 0x0800; // switch vertical nametable
            }
            else if (y === 31) {
                y = 0; // coarse Y = 0, nametable not switched
            }
            else {
                y += 1; // increment coarse Y
            }
            this.v = (this.v & ~0x03E0) | (y << 5); // put coarse Y back into v
        }
    };
    PPU.prototype.fetchUnusedNt = function () {
        if (!this.showBg && !this.showSprites)
            return;
        var addr = 0x2000 | (this.v & 0x0fff);
        this.vmemory.getByte(addr);
    };
    PPU.prototype.fetchNt = function () {
        if (!this.showBg && !this.showSprites)
            return;
        var addr = 0x2000 | (this.v & 0x0fff);
        this.nt = this.vmemory.getByte(addr);
    };
    PPU.prototype.fetchAt = function () {
        if (!this.showBg && !this.showSprites)
            return;
        var addr = 0x23C0 | (this.v & 0x0C00) | ((this.v >> 4) & 0x38) | ((this.v >> 2) & 0x07);
        this.at = this.vmemory.getByte(addr);
        var dx = (this.v >> 1) & 1; //second bit of coarse x
        var dy = (this.v >> 6) & 1; //second bit of coarse y
        var p = (this.at >> ((dy << 2) + (dx << 1))) & 3;
        this.p2 = (this.p2 & 0xffff00) | (p & 1 ? 0xff : 0);
        this.p3 = (this.p3 & 0xffff00) | (p & 2 ? 0xff : 0);
    };
    PPU.prototype.fetchSpriteTileLo = function (yTop, nt, flipVert) {
        var y = flipVert ? 7 - (this.sy - yTop) : this.sy - yTop;
        return this.vmemory.getByte(this.addrSpriteBase + nt * 16 + y);
    };
    PPU.prototype.fetchSpriteTileHi = function (yTop, nt, flipVert) {
        var y = flipVert ? 7 - (this.sy - yTop) : this.sy - yTop;
        return this.vmemory.getByte(this.addrSpriteBase + nt * 16 + 8 + y);
    };
    PPU.prototype.fetchBgTileLo = function () {
        if (!this.showBg && !this.showSprites)
            return;
        var y = (this.v >> 12) & 0x07;
        var b = this.vmemory.getByte(this.addrTileBase + this.nt * 16 + y);
        this.bgTileLo = (b & 0xff) | (this.bgTileLo & 0xffff00);
    };
    PPU.prototype.fetchBgTileHi = function () {
        if (!this.showBg && !this.showSprites)
            return;
        var y = (this.v >> 12) & 0x07;
        var b = this.vmemory.getByte(this.addrTileBase + this.nt * 16 + 8 + y);
        this.bgTileHi = (b & 0xff) | (this.bgTileHi & 0xffff00);
    };
    PPU.prototype.getNameTable = function (i) {
        var st = '';
        for (var y = 0; y < 30; y++) {
            for (var x = 0; x < 32; x++) {
                st += String.fromCharCode(this.vmemory.getByte(0x2000 + (i * 0x400) + x + y * 32));
            }
            st += '\n';
        }
        return st;
    };
    PPU.prototype.getPatternTable = function () {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var buf = new ArrayBuffer(imageData.data.length);
        var buf8 = new Uint8ClampedArray(buf);
        var data = new Uint32Array(buf);
        for (var t = 0; t < 2; t++) {
            for (var a = 0; a < 256; a++) {
                for (var x = 0; x < 8; x++) {
                    for (var y = 0; y < 8; y++) {
                        var irow = (a >> 4) * 8 + y;
                        var icol = 128 * t + (a & 15) * 8 + x;
                        var b1 = (this.vmemory.getByte(t * 0x1000 + a * 16 + y) >> (7 - x)) & 1;
                        var b2 = (this.vmemory.getByte(t * 0x1000 + a * 16 + y + 8) >> (7 - x)) & 1;
                        data[irow * 256 + icol] = this.colors[this.vmemory.getByte(0x3f00 + (b2 << 1) + b1)];
                    }
                }
            }
        }
        imageData.data.set(buf8);
        ctx.putImageData(imageData, 0, 0);
        document.body.appendChild(canvas);
    };
    PPU.prototype.getAttributeTable = function (i) {
        var st = '';
        for (var dy = 0; dy < 30; dy += 2) {
            for (var dx = 0; dx < 32; dx += 2) {
                var x = this.coarseX + dx;
                var y = this.coarseY + dy;
                var addr = 0x23C0 | (i << 10) | (((y >> 2) & 0x07) << 3) | ((x >> 2) & 0x07);
                var at = this.vmemory.getByte(addr);
                var x2 = (x >> 1) & 1; //second bit of coarse x
                var y2 = (y >> 1) & 1; //second bit of coarse y
                var p = (at >> ((y2 << 2) + (x2 << 1))) & 3;
                st += p + ' ';
            }
            st += '\n';
        }
        console.log(st);
    };
    PPU.prototype.step = function () {
        this.stepDraw();
        this.stepOam();
        this.stepBg();
        this.stepS();
        this.flgVblankSuppress = false;
    };
    PPU.prototype.stepOam = function () {
        //http://wiki.nesdev.com/w/index.php/PPU_sprite_evaluation
        if (this.sy === 261 && this.sx === 1) {
            this.flgSpriteOverflow = false;
        }
        else if (this.sy >= 0 && this.sy <= 239) {
            if (!this.showSprites && !this.showBg)
                return;
            if (this.sx >= 1 && this.sx <= 64) {
                // Cycles 1- 64: Secondary OAM (32 - byte buffer for current sprites on scanline) is
                // initialized to $FF - attempting to read $2004 will return $FF.Internally, the clear operation 
                // is implemented by reading from the OAM and writing into the secondary OAM as usual, only a signal 
                // is active that makes the read always return $FF.
                this.secondaryOam[this.sx] = 0xff;
                this.secondaryOamISprite[this.sx >> 2] = -1;
                if (this.sx === 64) {
                    this.addrOam = 0;
                    this.addrSecondaryOam = 0;
                    this.oamState = OamState.FillSecondaryOam;
                    this.copyToSecondaryOam = 0;
                }
            }
            else if (this.sx >= 65 && this.sx <= 256) {
                // Cycles 65- 256: Sprite evaluation
                //  On odd cycles, data is read from (primary) OAM
                //  On even cycles, data is written to secondary OAM (unless writes are inhibited, in which case it will read the value in secondary OAM instead)
                //  1. Starting at n = 0, read a sprite's Y-coordinate (OAM[n][0], copying it to the next open slot in secondary OAM
                //        (unless 8 sprites have been found, in which case the write is ignored).
                //     1a.If Y- coordinate is in range, copy remaining bytes of sprite data (OAM[n][1] thru OAM[n][3]) into secondary OAM.
                if (this.sx & 1) {
                    this.oamB = this.oam[this.addrOam];
                }
                else {
                    switch (this.oamState) {
                        case OamState.FillSecondaryOam:
                            this.secondaryOam[this.addrSecondaryOam] = this.oamB;
                            if (this.copyToSecondaryOam) {
                                this.copyToSecondaryOam--;
                                this.addrSecondaryOam++;
                                this.addrOam++;
                            }
                            else if (this.sy >= this.oamB && this.sy < this.oamB + this.spriteHeight) {
                                this.secondaryOamISprite[this.addrSecondaryOam >> 2] = this.addrOam >> 2;
                                this.addrSecondaryOam++;
                                this.copyToSecondaryOam = 3;
                                this.addrOam++;
                            }
                            else {
                                this.addrOam += 4;
                            }
                            if (this.addrSecondaryOam === 32) {
                                this.copyToSecondaryOam = 0;
                                this.oamState = OamState.CheckOverflow;
                            }
                            break;
                        case OamState.CheckOverflow:
                            if (this.copyToSecondaryOam) {
                                this.copyToSecondaryOam--;
                                this.addrOam++;
                            }
                            else if (this.sy >= this.oamB && this.sy < this.oamB + this.spriteHeight) {
                                ;
                                this.flgSpriteOverflow = true;
                                this.copyToSecondaryOam = 3;
                                this.addrOam++;
                            }
                            else {
                                this.addrOam += 4;
                                this.addrOam = (this.addrOam & 0xfffc) | (((this.addrOam & 3) + 1) & 3);
                            }
                            break;
                        case OamState.Done:
                            break;
                    }
                }
                if (this.addrOam >> 2 === 64) {
                    this.oamState = OamState.Done;
                    this.addrOam &= 0x3;
                }
                this.addrOam &= 255;
            }
            else if (this.sx >= 257 && this.sx <= 320) {
                var isprite = (this.sx - 257) >> 3;
                var addrOamBase = isprite << 2;
                var spriteRenderingInfo = this.rgspriteRenderingInfo[isprite];
                this.addrOam = 0;
                var b0 = this.secondaryOam[addrOamBase + 0];
                if (b0 >= 0xef) {
                    spriteRenderingInfo.xCounter = -1000;
                }
                else {
                    switch (this.sx & 7) {
                        case 1:
                            {
                                var b2 = this.secondaryOam[addrOamBase + 2];
                                var b3 = this.secondaryOam[addrOamBase + 3];
                                spriteRenderingInfo.ipaletteBase = (b2 & 3) << 2;
                                spriteRenderingInfo.behindBg = !!(b2 & (1 << 5));
                                spriteRenderingInfo.flipHoriz = !!(b2 & (1 << 6));
                                spriteRenderingInfo.flipVert = !!(b2 & (1 << 7));
                                spriteRenderingInfo.xCounter = b3;
                                spriteRenderingInfo.flgZeroSprite = !this.secondaryOamISprite[isprite];
                            }
                        case 0:
                            {
                                var b1 = this.secondaryOam[addrOamBase + 1];
                                spriteRenderingInfo.tileHi = this.fetchSpriteTileHi(b0, b1, spriteRenderingInfo.flipVert);
                                break;
                            }
                        case 6:
                            {
                                var b1 = this.secondaryOam[addrOamBase + 1];
                                this.rgspriteRenderingInfo[isprite].tileLo = this.fetchSpriteTileLo(b0, b1, spriteRenderingInfo.flipVert);
                                break;
                            }
                    }
                }
            }
        }
    };
    PPU.prototype.stepDraw = function () {
        if (this.sy === 261 && this.sx === 0)
            this.flgSpriteZeroHit = false;
        if (this.sx >= 1 && this.sy >= 0 && this.sx <= 256 && this.sy < 240) {
            var icolorBg;
            var bgTransparent = true;
            if (this.showBg) {
                var tileCol = 17 - this.x;
                var ipalette0 = (this.bgTileLo >> (tileCol)) & 1;
                var ipalette1 = (this.bgTileHi >> (tileCol - 2)) & 1;
                var ipalette2 = (this.p2 >> (tileCol + 2)) & 1;
                var ipalette3 = (this.p3 >> (tileCol + 2)) & 1;
                var ipalette = (ipalette3 << 3) + (ipalette2 << 2) + (ipalette1 << 1) + ipalette0;
                bgTransparent = !ipalette0 && !ipalette1;
                /* Addresses $3F04/$3F08/$3F0C can contain unique data, though these values are not used by the PPU when normally rendering
                    (since the pattern values that would otherwise select those cells select the backdrop color instead).
                    They can still be shown using the background palette hack, explained below.*/
                // 0 in each palette means the default background color -> ipalette = 0
                if ((ipalette & 3) === 0)
                    ipalette = 0;
                icolorBg = this.vmemory.getByte(0x3f00 | ipalette);
            }
            else {
                if (this.v >= 0x3f00 && this.v <= 0x3fff)
                    icolorBg = this.vmemory.getByte(this.v);
                else
                    icolorBg = this.vmemory.getByte(0x3f00);
            }
            var icolorSprite = -1;
            var spriteTransparent = true;
            var spriteBehindBg = true;
            var flgZeroSprite = false;
            if (this.showSprites) {
                for (var isprite = 0; isprite < 8; isprite++) {
                    var spriteRenderingInfo = this.rgspriteRenderingInfo[isprite];
                    if (spriteTransparent && spriteRenderingInfo.xCounter <= 0 && spriteRenderingInfo.xCounter >= -7) {
                        var tileCol = spriteRenderingInfo.flipHoriz ? -spriteRenderingInfo.xCounter : 7 + spriteRenderingInfo.xCounter;
                        var ipalette0 = (spriteRenderingInfo.tileLo >> tileCol) & 1;
                        var ipalette1 = (spriteRenderingInfo.tileHi >> tileCol) & 1;
                        if (ipalette0 || ipalette1) {
                            spriteTransparent = false;
                            spriteBehindBg = spriteRenderingInfo.behindBg;
                            flgZeroSprite = spriteRenderingInfo.flgZeroSprite;
                            var ipalette = spriteRenderingInfo.ipaletteBase + ipalette0 + (ipalette1 << 1);
                            if ((ipalette & 3) === 0)
                                ipalette = 0;
                            icolorSprite = this.vmemory.getByte(0x3f10 | ipalette);
                        }
                    }
                    spriteRenderingInfo.xCounter--;
                }
            }
            if (flgZeroSprite && !bgTransparent && this.showBg && this.showSprites
                && this.sx < 256 && this.sy > 0
                && (this.sx > 8 || (this.showSpritesInLeftmost8Pixels && this.showBgInLeftmost8Pixels))) {
                this.flgSpriteZeroHit = true;
            }
            if (!spriteTransparent && (bgTransparent || !spriteBehindBg))
                this.data[this.dataAddr] = this.colors[icolorSprite];
            else
                this.data[this.dataAddr] = this.colors[icolorBg];
            this.dataAddr++;
        }
    };
    PPU.prototype.stepBg = function () {
        //http://wiki.nesdev.com/w/images/d/d1/Ntsc_timing.png
        if (this.sy >= 0 && this.sy <= 239 || this.sy === 261) {
            if ((this.sx >= 1 && this.sx <= 256) || (this.sx >= 321 && this.sx <= 336)) {
                this.bgTileLo = (this.bgTileLo << 1) & 0xffffff;
                this.bgTileHi = (this.bgTileHi << 1) & 0xffffff;
                this.p2 = (this.p2 << 1) & 0xffffff;
                this.p3 = (this.p3 << 1) & 0xffffff;
                if (this.sy === 261) {
                    if (this.sx === 1)
                        this.flgVblank = false;
                }
                if ((this.sx & 0x07) === 2) {
                    this.fetchNt();
                }
                else if ((this.sx & 0x07) === 4) {
                    this.fetchAt();
                }
                else if ((this.sx & 0x07) === 6) {
                    this.fetchBgTileLo();
                }
                else if ((this.sx & 0x07) === 0) {
                    this.fetchBgTileHi();
                    if (this.sx === 256)
                        this.incVertV();
                    else
                        this.incHoriV();
                }
            }
            else if (this.sx === 257) {
                this.resetHoriV();
            }
            else if (this.sy === 261 && this.sx >= 280 && this.sx <= 304) {
                this.resetVertV();
            }
            else if (this.sx >= 337 && this.sx <= 340) {
                if ((this.sx & 2) === 0) {
                    this.fetchUnusedNt();
                }
            }
        }
        else if (this.sy === 240) {
            if (this.sx === 0) {
                this.renderer.render();
                this.iFrame++;
                this.dataAddr = 0;
            }
        }
        else if (this.sy === 241) {
            if (this.sx === 1 && !this.flgVblankSuppress) {
                this.flgVblank = true;
                if (this.nmi_output) {
                    this.cpu.nmiLine = 0;
                }
            }
            else if (this.sx === 260) {
                this.cpu.nmiLine = 1;
            }
        }
    };
    PPU.prototype.stepS = function () {
        if (this.sx === 338 && this.sy === 261)
            this.shortFrame = (this.iFrame & 1) && (this.showBg || this.showSprites);
        if (this.shortFrame && this.sx === 339 && this.sy === 261) {
            this.sx = 0;
            this.sy = 0;
        }
        else {
            this.sx++;
            if (this.sx === 341) {
                this.sx = 0;
                this.sy++;
            }
            if (this.sy === 262) {
                this.sy = 0;
            }
        }
    };
    PPU.syFirstVisible = 0;
    PPU.syPostRender = 240;
    PPU.syPreRender = 261;
    PPU.sxMin = 0;
    PPU.sxMax = 340;
    return PPU;
})();
var CanvasRenderer = (function () {
    function CanvasRenderer(canvas) {
        this.ctx = canvas.getContext("2d");
        this.imageData = this.ctx.getImageData(0, 0, 256, 240);
        var buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(buf);
        this.data = new Uint32Array(buf);
    }
    CanvasRenderer.prototype.getBuffer = function () {
        return this.data;
    };
    CanvasRenderer.prototype.render = function () {
        this.imageData.data.set(this.buf8);
        this.ctx.putImageData(this.imageData, 0, 0);
    };
    return CanvasRenderer;
})();
var WebGlRenderer = (function () {
    function WebGlRenderer(canvas) {
        _a = [canvas.width, canvas.height], this.width = _a[0], this.height = _a[1];
        var buf = new ArrayBuffer(this.width * this.height * 4);
        this.buf8 = new Uint8Array(buf);
        this.buf32 = new Uint32Array(buf);
        for (var i = 0; i < WebGlRenderer.CONVOLUTION_KERNEL_WEIGHTS.length; ++i) {
            WebGlRenderer.TOTAL_WEIGHT += WebGlRenderer.CONVOLUTION_KERNEL_WEIGHTS[i];
        }
        //////////////////////////////////////////////////////////////
        // ImageMetadata private properties
        var metadata = this;
        var contextAttributes = { premultipliedAlpha: true };
        this.glContext = (canvas.getContext('webgl', contextAttributes) || canvas.getContext('experimental-webgl', contextAttributes));
        this.glContext.clearColor(0.0, 0.0, 0.0, 0.0); // Set clear color to black, fully transparent
        var vertexShader = this.createShaderFromSource(this.glContext.VERTEX_SHADER, "\
            attribute vec2 aPosition;\
            attribute vec2 aTextureCoord;\
            \
            varying highp vec2 vTextureCoord;\
            \
            void main() {\
                gl_Position = vec4(aPosition, 0, 1);\
                vTextureCoord = aTextureCoord;\
            }");
        var fragmentShader = this.createShaderFromSource(this.glContext.FRAGMENT_SHADER, "\
            precision mediump float;\
            \
            varying highp vec2 vTextureCoord;\
            \
            uniform sampler2D uSampler;\
            uniform float uWeights[9];\
            uniform float uTotalWeight;\
            \
            /* Each sampled texture coordinate is 2 pixels appart rather than 1, to make filter effects more noticeable. */ \
            const float xInc = 2.0/640.0;\
            const float yInc = 2.0/480.0;\
            const int numElements = 9;\
            const int numCols = 3;\
            \
            void main() {\
                vec4 centerColor = texture2D(uSampler, vTextureCoord);\
                vec4 totalColor = vec4(0,0,0,0);\
                \
                for (int i = 0; i < numElements; i++) {\
                    int iRow = i / numCols;\
                    int iCol = i - (numCols * iRow);\
                    float xOff = float(iCol - 1) * xInc;\
                    float yOff = float(iRow - 1) * yInc;\
                    vec4 colorComponent = texture2D(uSampler, vec2(vTextureCoord.x+xOff, vTextureCoord.y+yOff));\
                    totalColor += (uWeights[i] * colorComponent);\
                }\
                \
                float effectiveWeight = uTotalWeight;\
                if (uTotalWeight <= 0.0) {\
                    effectiveWeight = 1.0;\
                }\
                /* Premultiply colors with alpha component for center pixel. */\
                gl_FragColor = vec4(totalColor.rgb * centerColor.a / effectiveWeight, centerColor.a);\
            }");
        var program = this.createProgram([vertexShader, fragmentShader]);
        this.glContext.useProgram(program);
        var positionAttribute = this.glContext.getAttribLocation(program, "aPosition");
        this.glContext.enableVertexAttribArray(positionAttribute);
        var textureCoordAttribute = this.glContext.getAttribLocation(program, "aTextureCoord");
        this.glContext.enableVertexAttribArray(textureCoordAttribute);
        // Associate the uniform texture sampler with TEXTURE0 slot
        var textureSamplerUniform = this.glContext.getUniformLocation(program, "uSampler");
        this.glContext.uniform1i(textureSamplerUniform, 0);
        // Associate the uniform convolution kernel weights with
        var convolutionKernelWeightsUniform = this.glContext.getUniformLocation(program, "uWeights[0]");
        this.glContext.uniform1fv(convolutionKernelWeightsUniform, WebGlRenderer.CONVOLUTION_KERNEL_WEIGHTS);
        var convolutionKernelTotalWeightUniform = this.glContext.getUniformLocation(program, "uTotalWeight");
        this.glContext.uniform1f(convolutionKernelTotalWeightUniform, WebGlRenderer.TOTAL_WEIGHT);
        // Create a buffer used to represent whole set of viewport vertices
        var vertexBuffer = this.glContext.createBuffer();
        this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, vertexBuffer);
        this.glContext.bufferData(this.glContext.ARRAY_BUFFER, WebGlRenderer.VIEWPORT_VERTICES, this.glContext.STATIC_DRAW);
        this.glContext.vertexAttribPointer(positionAttribute, 2, this.glContext.FLOAT, false, 0, 0);
        // Create a buffer used to represent whole set of vertex texture coordinates
        var textureCoordinateBuffer = this.glContext.createBuffer();
        this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, textureCoordinateBuffer);
        this.glContext.bufferData(this.glContext.ARRAY_BUFFER, WebGlRenderer.VERTEX_TEXTURE_COORDS, this.glContext.STATIC_DRAW);
        this.glContext.vertexAttribPointer(textureCoordAttribute, 2, this.glContext.FLOAT, false, 0, 0);
        // Create a texture to contain images from Kinect server
        // Note: TEXTURE_MIN_FILTER, TEXTURE_WRAP_S and TEXTURE_WRAP_T parameters need to be set
        //       so we can handle textures whose width and height are not a power of 2.
        this.texture = this.glContext.createTexture();
        this.glContext.bindTexture(this.glContext.TEXTURE_2D, this.texture);
        this.glContext.texParameteri(this.glContext.TEXTURE_2D, this.glContext.TEXTURE_MAG_FILTER, this.glContext.LINEAR);
        this.glContext.texParameteri(this.glContext.TEXTURE_2D, this.glContext.TEXTURE_MIN_FILTER, this.glContext.LINEAR);
        this.glContext.texParameteri(this.glContext.TEXTURE_2D, this.glContext.TEXTURE_WRAP_S, this.glContext.CLAMP_TO_EDGE);
        this.glContext.texParameteri(this.glContext.TEXTURE_2D, this.glContext.TEXTURE_WRAP_T, this.glContext.CLAMP_TO_EDGE);
        this.glContext.bindTexture(this.glContext.TEXTURE_2D, null);
        // Since we're only using one single texture, we just make TEXTURE0 the active one
        // at all times
        this.glContext.activeTexture(this.glContext.TEXTURE0);
        this.glContext.viewport(0, 0, this.width, this.height);
        var _a;
    }
    // Create a shader of specified type, with the specified source, and compile it.
    //     .createShaderFromSource(shaderType, shaderSource)
    //
    // shaderType: Type of shader to create (fragment or vertex shader)
    // shaderSource: Source for shader to create (string)
    WebGlRenderer.prototype.createShaderFromSource = function (shaderType, shaderSource) {
        var shader = this.glContext.createShader(shaderType);
        this.glContext.shaderSource(shader, shaderSource);
        this.glContext.compileShader(shader);
        // Check for errors during compilation
        var status = this.glContext.getShaderParameter(shader, this.glContext.COMPILE_STATUS);
        if (!status) {
            var infoLog = this.glContext.getShaderInfoLog(shader);
            console.log("Unable to compile '" + shaderType + "' shader. Error:" + infoLog);
            this.glContext.deleteShader(shader);
            return null;
        }
        return shader;
    };
    // Create a WebGL program attached to the specified shaders.
    //     .createProgram(shaderArray)
    //
    // shaderArray: Array of shaders to attach to program
    WebGlRenderer.prototype.createProgram = function (shaderArray) {
        var newProgram = this.glContext.createProgram();
        for (var shaderIndex = 0; shaderIndex < shaderArray.length; ++shaderIndex) {
            this.glContext.attachShader(newProgram, shaderArray[shaderIndex]);
        }
        this.glContext.linkProgram(newProgram);
        // Check for errors during linking
        var status = this.glContext.getProgramParameter(newProgram, this.glContext.LINK_STATUS);
        if (!status) {
            var infoLog = this.glContext.getProgramInfoLog(newProgram);
            console.log("Unable to link Kinect WebGL program. Error:" + infoLog);
            this.glContext.deleteProgram(newProgram);
            return null;
        }
        return newProgram;
    };
    WebGlRenderer.prototype.getBuffer = function () {
        return this.buf32;
    };
    WebGlRenderer.prototype.render = function () {
        this.glContext.bindTexture(this.glContext.TEXTURE_2D, this.texture);
        this.glContext.texImage2D(this.glContext.TEXTURE_2D, 0, this.glContext.RGBA, this.width, this.height, 0, this.glContext.RGBA, this.glContext.UNSIGNED_BYTE, this.buf8);
        this.glContext.drawArrays(this.glContext.TRIANGLES, 0, WebGlRenderer.NUM_VIEWPORT_VERTICES);
        this.glContext.bindTexture(this.glContext.TEXTURE_2D, null);
    };
    // vertices representing entire viewport as two triangles which make up the whole
    // rectangle, in post-projection/clipspace coordinates
    WebGlRenderer.VIEWPORT_VERTICES = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0]);
    WebGlRenderer.NUM_VIEWPORT_VERTICES = WebGlRenderer.VIEWPORT_VERTICES.length / 2;
    // Texture coordinates corresponding to each viewport vertex
    WebGlRenderer.VERTEX_TEXTURE_COORDS = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0]);
    // Convolution kernel weights (blurring effect by default)
    WebGlRenderer.CONVOLUTION_KERNEL_WEIGHTS = new Float32Array([
        1, 1, 1,
        1, 1, 1,
        1, 1, 1]);
    WebGlRenderer.TOTAL_WEIGHT = 0;
    return WebGlRenderer;
})();
///<reference path="Memory.ts"/>
var RepeatedMemory = (function () {
    function RepeatedMemory(count, memory) {
        this.count = count;
        this.memory = memory;
        this.sizeI = this.memory.size() * this.count;
    }
    RepeatedMemory.prototype.size = function () {
        return this.sizeI;
    };
    RepeatedMemory.prototype.getByte = function (addr) {
        if (addr > this.size())
            throw 'address out of bounds';
        return this.memory.getByte(addr % this.sizeI);
    };
    RepeatedMemory.prototype.setByte = function (addr, value) {
        if (addr > this.size())
            throw 'address out of bounds';
        return this.memory.setByte(addr % this.sizeI, value);
    };
    return RepeatedMemory;
})();
///<reference path="Memory.ts"/>
var ROM = (function () {
    function ROM(size) {
        this.memory = new Uint8Array(size);
    }
    ROM.fromBytes = function (memory) {
        var res = new ROM(0);
        res.memory = memory;
        return res;
    };
    ROM.prototype.size = function () {
        return this.memory.length;
    };
    ROM.prototype.getByte = function (addr) {
        return this.memory[addr];
    };
    ROM.prototype.setByte = function (addr, value) {
    };
    return ROM;
})();
///<reference path="NesEmulator.ts"/>
var StepTestRunner = (function () {
    function StepTestRunner() {
        this.ich = 0;
    }
    StepTestRunner.prototype.readLine = function () {
        var st = "";
        while (this.ich < this.expectedOutput.length) {
            if (this.expectedOutput[this.ich] === '\n') {
                this.ich++;
                return st;
            }
            else
                st += this.expectedOutput[this.ich];
            this.ich++;
        }
        return st;
    };
    ;
    StepTestRunner.prototype.run = function (nesemu, expectedOutput, log) {
        var prevLines = [];
        this.expectedOutput = expectedOutput;
        this.ich = 0;
        var line = this.readLine();
        nesemu.cpu.ip = parseInt(line.split(' ')[0], 16);
        while (nesemu.cpu.ip != 0x8014)
            nesemu.cpu.stepInstr();
        while (line) {
            var groups = line.match(/([^ ]+).*A:([^ ]+).*X:([^ ]+).*Y:([^ ]+).*P:([^ ]+).*SP:([^ ]+).*/);
            groups.shift();
            var regs = groups.map(function (x) { return parseInt(x, 16); });
            var ip = regs[0];
            var rA = regs[1];
            var rX = regs[2];
            var rY = regs[3];
            var rP = regs[4];
            var sp = regs[5];
            function tsto(ip, rA, rX, rY, rP, sp) {
                var stRP = rP.toString(2);
                stRP = Array(Math.max(8 - stRP.length + 1, 0)).join('0') + stRP;
                return 'ip:' + ip.toString(16)
                    + ' rA:' + rA.toString(16)
                    + ' rX:' + rX.toString(16)
                    + ' rY:' + rY.toString(16)
                    + ' rP:' + stRP
                    + ' sp:' + sp.toString(16);
            }
            var expected = tsto(ip, rA, rX, rY, rP, sp);
            var actual = tsto(nesemu.cpu.ip, nesemu.cpu.rA, nesemu.cpu.rX, nesemu.cpu.rY, nesemu.cpu.rP, nesemu.cpu.sp);
            if (expected !== actual) {
                prevLines.forEach(function (prevLine) { return log(prevLine); });
                log(expected);
                log(actual);
                log(' ');
                break;
            }
            prevLines.push(line);
            try {
                nesemu.cpu.stepInstr();
            }
            catch (e) {
                log(e);
                prevLines.forEach(function (prevLine) { return log(prevLine); });
            }
            if (prevLines.length > 10)
                prevLines.shift();
            line = this.readLine();
        }
        ;
        log('done');
    };
    return StepTestRunner;
})();
//# sourceMappingURL=app.js.map