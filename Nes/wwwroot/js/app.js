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
        this.irqDisabled = 0;
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
    APU.prototype.getter = function (addr) {
        switch (addr) {
            case 0x4015:
                return this.lc0 > 0 ? 1 : 0;
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
        //console.log('get ', addr.toString(16));
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
                this.idividerStep = this.isequencerStep = 0;
                this.mode = (value >> 7) & 1;
                this.irqDisabled = (value >> 6) & 1;
                if (this.irqDisabled === 0) {
                    console.log('APU', this.irqDisabled ? 'irq disabled' : 'irq enabled');
                    this.cpu.RequestIRQ();
                }
                if (this.mode !== 0)
                    throw 'not supported';
                break;
        }
        // console.log('set ', addr.toString(16), value);
    };
    APU.prototype.step = function () {
        //The divider generates an output clock rate of just under 240 Hz, and appears to
        //be derived by dividing the 21.47727 MHz system clock by 89490. The sequencer is
        //clocked by the divider's output.
        this.idividerStep++;
        if (this.idividerStep === 89490) {
            this.idividerStep = 0;
            this.isequencerStep++;
            if (this.mode === 0) {
                if (this.isequencerStep === 2) {
                    if (!this.lc0Halt && this.lc0 > 0) {
                        this.lc0--;
                        if (this.lc0 && this.irqDisabled === 0)
                            this.cpu.RequestIRQ();
                    }
                    this.isequencerStep = 0;
                }
            }
        }
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
        this.memory = new CompoundMemory(new RAM(0x8000), PRGBanks[0], PRGBanks[1]);
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
            this.memory.rgmemory[1] = this.PRGBanks[this.PRG0 >> 1];
            this.memory.rgmemory[2] = this.PRGBanks[(this.PRG0 >> 1) + 1];
        }
        else if (this.S === 0) {
            this.memory.rgmemory[1] = this.PRGBanks[0];
            this.memory.rgmemory[2] = this.PRGBanks[this.PRG0];
        }
        else {
            this.memory.rgmemory[1] = this.PRGBanks[this.PRG0];
            this.memory.rgmemory[2] = this.PRGBanks[0x0f];
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
var Mos6502 = (function () {
    function Mos6502(memory) {
        this.memory = memory;
        this.sleep = 0;
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
        this.flgDecimalMode = 0;
        this.flgBreakCommand = 0;
        this.flgOverflow = 0;
        this.flgNegative = 0;
        this.pageCross = 0;
        this.jumpSucceed = 0;
        this.jumpToNewPage = 0;
    }
    Mos6502.prototype.Reset = function () {
        this.ip = this.getWord(this.addrReset);
        this.sp = 0xfd;
    };
    Mos6502.prototype.RequestNMI = function () {
        console.log('RequestNMI');
        this.nmiRequested = true;
    };
    Mos6502.prototype.RequestIRQ = function () {
        console.log('RequestIRQ');
        this.irqRequested = true;
    };
    Object.defineProperty(Mos6502.prototype, "rP", {
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
    Mos6502.prototype.ADC = function (b) {
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
    Mos6502.prototype.SBC = function (b) {
        this.ADC(255 - b);
    };
    Mos6502.prototype.ISC = function (addr) {
        this.SBC(this.INC(addr));
    };
    Mos6502.prototype.SLO = function (addr) {
        this.ORA(this.ASL(addr));
    };
    Mos6502.prototype.RLA = function (addr) {
        this.AND(this.ROL(addr));
    };
    Mos6502.prototype.SRE = function (addr) {
        this.EOR(this.LSR(addr));
    };
    Mos6502.prototype.RRA = function (addr) {
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
    Mos6502.prototype.AND = function (byte) {
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
    Mos6502.prototype.EOR = function (byte) {
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
    Mos6502.prototype.BIT = function (byte) {
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
    Mos6502.prototype.ASL = function (addr) {
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
    Mos6502.prototype.BCC = function (sbyte) {
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
    Mos6502.prototype.BCS = function (sbyte) {
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
    Mos6502.prototype.BEQ = function (sbyte) {
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
    Mos6502.prototype.BMI = function (sbyte) {
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
    Mos6502.prototype.BNE = function (sbyte) {
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
    Mos6502.prototype.BPL = function (sbyte) {
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
    Mos6502.prototype.BVC = function (sbyte) {
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
    Mos6502.prototype.BVS = function (sbyte) {
        if (this.flgOverflow) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    };
    Mos6502.prototype.CLC = function () {
        this.flgCarry = 0;
    };
    Mos6502.prototype.CLD = function () {
        this.flgDecimalMode = 0;
    };
    Mos6502.prototype.CLI = function () {
        console.log('cli');
        this.flgInterruptDisable = 0;
    };
    Mos6502.prototype.CLV = function () {
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
        B	Break Command	Not affected
        V	Overflow Flag	Not affected
        N	Negative Flag	Set if bit 7 of the result is set

*/
    Mos6502.prototype.CMP = function (byte) {
        this.flgCarry = this.rA >= byte ? 1 : 0;
        this.flgZero = this.rA === byte ? 1 : 0;
        this.flgNegative = (this.rA - byte) & 128 ? 1 : 0;
    };
    Mos6502.prototype.DCP = function (addr) {
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
    Mos6502.prototype.CPX = function (byte) {
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
    Mos6502.prototype.CPY = function (byte) {
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
    Mos6502.prototype.DEC = function (addr) {
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
    Mos6502.prototype.DEX = function () {
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
    Mos6502.prototype.DEY = function () {
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
    Mos6502.prototype.INC = function (addr) {
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
    Mos6502.prototype.INX = function () {
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
    Mos6502.prototype.INY = function () {
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
    Mos6502.prototype.LDA = function (byte) {
        this.rA = byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    Mos6502.prototype.LAX = function (byte) {
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
    Mos6502.prototype.LDX = function (byte) {
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
    Mos6502.prototype.LDY = function (byte) {
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
    Mos6502.prototype.LSR = function (addr) {
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
    Mos6502.prototype.ORA = function (byte) {
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
    Mos6502.prototype.ROL = function (addr) {
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
    Mos6502.prototype.ROR = function (addr) {
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
    Mos6502.prototype.STA = function (addr) {
        this.setByte(addr, this.rA);
    };
    Mos6502.prototype.STX = function (addr) {
        this.setByte(addr, this.rX);
    };
    Mos6502.prototype.STY = function (addr) {
        this.setByte(addr, this.rY);
    };
    Mos6502.prototype.SAX = function (addr) {
        this.setByte(addr, this.rX & this.rA);
    };
    Mos6502.prototype.TAX = function () {
        this.rX = this.rA;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    };
    Mos6502.prototype.TAY = function () {
        this.rY = this.rA;
        this.flgZero = this.rY === 0 ? 1 : 0;
        this.flgNegative = this.rY >= 128 ? 1 : 0;
    };
    Mos6502.prototype.TSX = function () {
        this.rX = this.sp;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    };
    Mos6502.prototype.TXA = function () {
        this.rA = this.rX;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    Mos6502.prototype.TXS = function () {
        this.sp = this.rX;
    };
    Mos6502.prototype.TYA = function () {
        this.rA = this.rY;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    /*JSR - Jump to Subroutine
        The JSR instruction pushes the address (minus one) of the return point on to the stack and then sets the program counter to the target memory address.
     */
    Mos6502.prototype.JSR = function (addr) {
        this.pushWord(this.ip + 3 - 1);
        this.ip = addr;
    };
    /**
     * RTS - Return from Subroutine
        The RTS instruction is used at the end of a subroutine to return to the calling routine. It pulls the program counter (minus one) from the stack.
     */
    Mos6502.prototype.RTS = function () {
        this.ip = this.popWord() + 1;
    };
    /**
         PHA - Push Accumulator

        Pushes a copy of the accumulator on to the stack.
     */
    Mos6502.prototype.PHA = function () {
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
    Mos6502.prototype.PLA = function () {
        this.rA = this.popByte();
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    };
    /**
       PHP - Push Processor Status

        Pushes a copy of the status flags on to the stack.
   */
    Mos6502.prototype.PHP = function () {
        this.flgBreakCommand = 1;
        this.pushByte(this.rP);
        this.flgBreakCommand = 0;
    };
    /**
      PLP - Pull Processor Status

        Pulls an 8 bit value from the stack and into the processor flags.
        The flags will take on new states as determined by the value pulled.

   */
    Mos6502.prototype.PLP = function () {
        this.rP = this.popByte();
    };
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
    Mos6502.prototype.BRK = function () {
        console.log('process BRK');
        this.pushWord(this.ip + 2);
        this.flgBreakCommand = 1;
        this.PHP();
        this.flgInterruptDisable = 1;
        this.ip = this.getWord(this.addrIRQ);
    };
    Mos6502.prototype.NMI = function () {
        console.log('process NMI');
        this.nmiRequested = false;
        this.pushWord(this.ip);
        this.pushByte(this.rP);
        this.flgInterruptDisable = 1;
        this.ip = this.getWord(this.addrNMI);
    };
    Mos6502.prototype.IRQ = function () {
        console.log('process irq');
        this.irqRequested = false;
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
    Mos6502.prototype.RTI = function () {
        console.log('rti');
        this.PLP();
        this.ip = this.popWord();
    };
    Mos6502.prototype.ALR = function (byte) {
        //ALR #i($4B ii; 2 cycles)
        //Equivalent to AND #i then LSR A.
        this.AND(byte);
        this.LSR(this.addrRA);
    };
    Mos6502.prototype.ANC = function (byte) {
        //Does AND #i, setting N and Z flags based on the result. 
        //Then it copies N (bit 7) to C.ANC #$FF could be useful for sign- extending, much like CMP #$80.ANC #$00 acts like LDA #$00 followed by CLC.
        this.AND(byte);
        this.flgCarry = this.flgNegative;
    };
    Mos6502.prototype.ARR = function (byte) {
        //Similar to AND #i then ROR A, except sets the flags differently. N and Z are normal, but C is bit 6 and V is bit 6 xor bit 5.
        this.AND(byte);
        this.ROR(this.addrRA);
        this.flgCarry = (this.rA & (1 << 6)) !== 0 ? 1 : 0;
        this.flgOverflow = ((this.rA & (1 << 6)) >> 6) ^ ((this.rA & (1 << 5)) >> 5);
    };
    Mos6502.prototype.AXS = function (byte) {
        // Sets X to {(A AND X) - #value without borrow}, and updates NZC. 
        var res = (this.rA & this.rX) + 256 - byte;
        this.rX = res & 0xff;
        this.flgNegative = (this.rX & 128) !== 0 ? 1 : 0;
        this.flgCarry = res > 255 ? 1 : 0;
        this.flgZero = this.rX === 0 ? 1 : 0;
    };
    Mos6502.prototype.SYA = function (addr) {
        //not implemented
    };
    Mos6502.prototype.SXA = function (addr) {
        //not implemented
    };
    Mos6502.prototype.XAA = function (byte) {
        //not implemented
    };
    Mos6502.prototype.AXA = function (byte) {
        //not implemented
    };
    Mos6502.prototype.XAS = function (byte) {
        //not implemented
    };
    Mos6502.prototype.LAR = function (byte) {
        //not implemented
    };
    Mos6502.prototype.getByte = function (addr) {
        if (addr === this.addrRA)
            return this.rA;
        else
            return this.memory.getByte(addr);
    };
    Mos6502.prototype.setByte = function (addr, byte) {
        if (addr === this.addrRA)
            this.rA = byte;
        else
            this.memory.setByte(addr, byte);
    };
    Mos6502.prototype.getWord = function (addr) {
        return this.memory.getByte(addr) + 256 * this.memory.getByte(addr + 1);
    };
    Mos6502.prototype.getSByteRelative = function () { var b = this.memory.getByte(this.ip + 1); return b >= 128 ? b - 256 : b; };
    Mos6502.prototype.getByteImmediate = function () { return this.memory.getByte(this.ip + 1); };
    Mos6502.prototype.getWordImmediate = function () {
        //if ((this.ip & 0xff) === 0xff)
        //    this.pageCross = 1;
        return this.getWord(this.ip + 1);
    };
    Mos6502.prototype.getAddrZeroPage = function () { return this.getByteImmediate(); };
    Mos6502.prototype.getByteZeroPage = function () { return this.memory.getByte(this.getAddrZeroPage()); };
    Mos6502.prototype.getWordZeroPage = function () { return this.getWord(this.getAddrZeroPage()); };
    Mos6502.prototype.getAddrZeroPageX = function () { return (this.rX + this.getByteImmediate()) & 0xff; };
    Mos6502.prototype.getByteZeroPageX = function () { return this.memory.getByte(this.getAddrZeroPageX()); };
    Mos6502.prototype.getWordZeroPageX = function () { return this.getWord(this.getAddrZeroPageX()); };
    Mos6502.prototype.getAddrZeroPageY = function () { return (this.rY + this.getByteImmediate()) & 0xff; };
    Mos6502.prototype.getByteZeroPageY = function () { return this.memory.getByte(this.getAddrZeroPageY()); };
    Mos6502.prototype.getWordZeroPageY = function () { return this.getWord(this.getAddrZeroPageY()); };
    Mos6502.prototype.getAddrAbsolute = function () { return this.getWordImmediate(); };
    Mos6502.prototype.getByteAbsolute = function () { return this.memory.getByte(this.getAddrAbsolute()); };
    Mos6502.prototype.getWordAbsolute = function () { return this.getWord(this.getAddrAbsolute()); };
    Mos6502.prototype.getAddrAbsoluteX = function () {
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
    Mos6502.prototype.getByteAbsoluteX = function () { return this.memory.getByte(this.getAddrAbsoluteX()); };
    Mos6502.prototype.getWordAbsoluteX = function () { return this.getWord(this.getAddrAbsoluteX()); };
    Mos6502.prototype.getAddrAbsoluteY = function () {
        var w = this.getWordImmediate();
        var addr = (this.rY + w) & 0xffff;
        if (this.rY + (w & 0xff) > 0xff)
            this.pageCross = 1;
        return addr;
    };
    Mos6502.prototype.getByteAbsoluteY = function () { return this.memory.getByte(this.getAddrAbsoluteY()); };
    Mos6502.prototype.getWordAbsoluteY = function () { return this.getWord(this.getAddrAbsoluteY()); };
    Mos6502.prototype.getWordIndirect = function () {
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
    Mos6502.prototype.getAddrIndirectX = function () {
        //The 6502's Indirect-Indexed-X ((Ind,X)) addressing mode is also partially broken 
        //if the zero- page address was hex FF (i.e.last address of zero- page FF), again a case of address wrap.
        var addrLo = (this.getByteImmediate() + this.rX) & 0xff;
        var addrHi = (addrLo + 1) & 0xff;
        return this.memory.getByte(addrLo) + 256 * this.memory.getByte(addrHi);
    };
    Mos6502.prototype.getByteIndirectX = function () { return this.memory.getByte(this.getAddrIndirectX()); };
    Mos6502.prototype.getWordIndirectX = function () { return this.getWord(this.getAddrIndirectX()); };
    Mos6502.prototype.getAddrIndirectY = function () {
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
    Mos6502.prototype.getByteIndirectY = function () { return this.memory.getByte(this.getAddrIndirectY()); };
    Mos6502.prototype.getWordIndirectY = function () { return this.getWord(this.getAddrIndirectY()); };
    Mos6502.prototype.pushByte = function (byte) {
        this.memory.setByte(0x100 + this.sp, byte & 0xff);
        this.sp = this.sp === 0 ? 0xff : this.sp - 1;
    };
    Mos6502.prototype.popByte = function () {
        this.sp = this.sp === 0xff ? 0 : this.sp + 1;
        return this.memory.getByte(0x100 + this.sp);
    };
    Mos6502.prototype.pushWord = function (word) {
        this.pushByte((word >> 8) & 0xff);
        this.pushByte(word & 0xff);
    };
    Mos6502.prototype.popWord = function () {
        return this.popByte() + (this.popByte() << 8);
    };
    Mos6502.prototype.setJmpFlags = function (sbyte) {
        this.jumpSucceed = 1;
        var addrDstLow = (this.ip & 0xff) + sbyte + 2; // +2 because we increment the IP with 2 anyway
        this.jumpToNewPage = addrDstLow < 0 || addrDstLow > 0xff ? 1 : 0;
    };
    Mos6502.prototype.step = function () {
        if (this.sleep > 0) {
            this.sleep--;
            return;
        }
        if (this.nmiRequested) {
            this.NMI();
            return;
        }
        if (this.irqRequested && this.flgInterruptDisable === 0) {
            this.IRQ();
            return;
        }
        this.pageCross = this.jumpSucceed = this.jumpToNewPage = 0;
        var ipPrev = this.ip;
        switch (this.memory.getByte(this.ip)) {
            case 0x69:
                this.ADC(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x65:
                this.ADC(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x75:
                this.ADC(this.getByteZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x6d:
                this.ADC(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0x7d:
                this.ADC(this.getByteAbsoluteX());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x79:
                this.ADC(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x61:
                this.ADC(this.getByteIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x71:
                this.ADC(this.getByteIndirectY());
                this.ip += 2;
                this.sleep = 5 + this.pageCross;
                break;
            case 0x29:
                this.AND(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x25:
                this.AND(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x35:
                this.AND(this.getByteZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x2D:
                this.AND(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0x3D:
                this.AND(this.getByteAbsoluteX());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x39:
                this.AND(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x21:
                this.AND(this.getByteIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x31:
                this.AND(this.getByteIndirectY());
                this.ip += 2;
                this.sleep = 5 + this.pageCross;
                break;
            case 0x0a:
                this.ASL(this.addrRA);
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x06:
                this.ASL(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0x16:
                this.ASL(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x0e:
                this.ASL(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0x1e:
                this.ASL(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x90:
                this.BCC(this.getSByteRelative());
                this.ip += 2;
                this.sleep = 2 + this.jumpSucceed + this.jumpToNewPage;
                break;
            case 0xb0:
                this.BCS(this.getSByteRelative());
                this.ip += 2;
                this.sleep = 2 + this.jumpSucceed + this.jumpToNewPage;
                break;
            case 0xf0:
                this.BEQ(this.getSByteRelative());
                this.ip += 2;
                this.sleep = 2 + this.jumpSucceed + this.jumpToNewPage;
                break;
            case 0x30:
                this.BMI(this.getSByteRelative());
                this.ip += 2;
                this.sleep = 2 + this.jumpSucceed + this.jumpToNewPage;
                break;
            case 0xd0:
                this.BNE(this.getSByteRelative());
                this.ip += 2;
                this.sleep = 2 + this.jumpSucceed + this.jumpToNewPage;
                break;
            case 0x10:
                this.BPL(this.getSByteRelative());
                this.ip += 2;
                this.sleep = 2 + this.jumpSucceed + this.jumpToNewPage;
                break;
            case 0x50:
                this.BVC(this.getSByteRelative());
                this.ip += 2;
                this.sleep = 2 + this.jumpSucceed + this.jumpToNewPage;
                break;
            case 0x70:
                this.BVS(this.getSByteRelative());
                this.ip += 2;
                this.sleep = 2 + this.jumpSucceed + this.jumpToNewPage;
                break;
            case 0x24:
                this.BIT(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x2c:
                this.BIT(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0x18:
                this.CLC();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xd8:
                this.CLD();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x58:
                this.CLI();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xb8:
                this.CLV();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xc9:
                this.CMP(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xc5:
                this.CMP(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0xd5:
                this.CMP(this.getByteZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0xcd:
                this.CMP(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0xdd:
                this.CMP(this.getByteAbsoluteX());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xd9:
                this.CMP(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xc1:
                this.CMP(this.getByteIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0xd1:
                this.CMP(this.getByteIndirectY());
                this.ip += 2;
                this.sleep = 5 + this.pageCross;
                break;
            case 0xe0:
                this.CPX(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xe4:
                this.CPX(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0xec:
                this.CPX(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0xc0:
                this.CPY(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xc4:
                this.CPY(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0xcc:
                this.CPY(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0xc6:
                this.DEC(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0xd6:
                this.DEC(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0xce:
                this.DEC(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0xde:
                this.DEC(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0xca:
                this.DEX();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x88:
                this.DEY();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xe6:
                this.INC(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0xf6:
                this.INC(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0xee:
                this.INC(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0xfe:
                this.INC(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0xe8:
                this.INX();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xc8:
                this.INY();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x49:
                this.EOR(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x45:
                this.EOR(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x55:
                this.EOR(this.getByteZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x4D:
                this.EOR(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0x5D:
                this.EOR(this.getByteAbsoluteX());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x59:
                this.EOR(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x41:
                this.EOR(this.getByteIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x51:
                this.EOR(this.getByteIndirectY());
                this.ip += 2;
                this.sleep = 5 + this.pageCross;
                break;
            case 0x4c:
                this.ip = this.getAddrAbsolute();
                this.sleep = 3;
                break;
            case 0x6c:
                this.ip = this.getWordIndirect();
                this.sleep = 5;
                break;
            case 0xa9:
                this.LDA(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xa5:
                this.LDA(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0xb5:
                this.LDA(this.getByteZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0xad:
                this.LDA(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0xbd:
                this.LDA(this.getByteAbsoluteX());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xb9:
                this.LDA(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xa1:
                this.LDA(this.getByteIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0xb1:
                this.LDA(this.getByteIndirectY());
                this.ip += 2;
                this.sleep = 5 + this.pageCross;
                break;
            case 0xa2:
                this.LDX(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xa6:
                this.LDX(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0xb6:
                this.LDX(this.getByteZeroPageY());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0xae:
                this.LDX(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0xbe:
                this.LDX(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xa0:
                this.LDY(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xa4:
                this.LDY(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0xb4:
                this.LDY(this.getByteZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0xac:
                this.LDY(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0xbc:
                this.LDY(this.getByteAbsoluteX());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x4a:
                this.LSR(this.addrRA);
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x46:
                this.LSR(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0x56:
                this.LSR(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x4e:
                this.LSR(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0x5e:
                this.LSR(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0xea:
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x09:
                this.ORA(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x05:
                this.ORA(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x15:
                this.ORA(this.getByteZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x0d:
                this.ORA(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0x1d:
                this.ORA(this.getByteAbsoluteX());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x19:
                this.ORA(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x01:
                this.ORA(this.getByteIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x11:
                this.ORA(this.getByteIndirectY());
                this.ip += 2;
                this.sleep = 5 + this.pageCross;
                break;
            case 0x48:
                this.PHA();
                this.ip += 1;
                this.sleep = 3;
                break;
            case 0x08:
                this.PHP();
                this.ip += 1;
                this.sleep = 3;
                break;
            case 0x68:
                this.PLA();
                this.ip += 1;
                this.sleep = 4;
                break;
            case 0x28:
                this.PLP();
                this.ip += 1;
                this.sleep = 4;
                break;
            case 0x2a:
                this.ROL(this.addrRA);
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x26:
                this.ROL(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0x36:
                this.ROL(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x2e:
                this.ROL(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0x3e:
                this.ROL(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x6a:
                this.ROR(this.addrRA);
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x66:
                this.ROR(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0x76:
                this.ROR(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x6e:
                this.ROR(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0x7e:
                this.ROR(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x00:
                this.BRK();
                this.sleep = 7;
                break;
            case 0x40:
                this.RTI();
                this.sleep = 6;
                break;
            case 0xe9:
                this.SBC(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xe5:
                this.SBC(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0xf5:
                this.SBC(this.getByteZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0xed:
                this.SBC(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0xfd:
                this.SBC(this.getByteAbsoluteX());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xf9:
                this.SBC(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xe1:
                this.SBC(this.getByteIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0xf1:
                this.SBC(this.getByteIndirectY());
                this.ip += 2;
                this.sleep = 5 + this.pageCross;
                break;
            case 0x38:
                this.flgCarry = 1;
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xf8:
                this.flgDecimalMode = 1;
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x78:
                this.flgInterruptDisable = 1;
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x85:
                this.STA(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x95:
                this.STA(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x8d:
                this.STA(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0x9d:
                this.STA(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 5;
                break;
            case 0x99:
                this.STA(this.getAddrAbsoluteY());
                this.ip += 3;
                this.sleep = 5;
                break;
            case 0x81:
                this.STA(this.getAddrIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x91:
                this.STA(this.getAddrIndirectY());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x86:
                this.STX(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x96:
                this.STX(this.getAddrZeroPageY());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x8e:
                this.STX(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0x84:
                this.STY(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x94:
                this.STY(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x8c:
                this.STY(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0xaa:
                this.TAX();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xa8:
                this.TAY();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xba:
                this.TSX();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x8a:
                this.TXA();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x9a:
                this.TXS();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x98:
                this.TYA();
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x20:
                this.JSR(this.getAddrAbsolute());
                this.sleep = 6;
                break;
            case 0x60:
                this.RTS();
                this.sleep = 6;
                break;
            //unofficial opcodes below
            case 0x1a:
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x3a:
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x5a:
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x7a:
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xda:
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0xfa:
                this.ip += 1;
                this.sleep = 2;
                break;
            case 0x04:
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x14:
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x34:
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x44:
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x54:
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x64:
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x74:
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0xd4:
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0xf4:
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x80:
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x82:
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xc2:
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xe2:
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x89:
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x0c:
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0x1c:
                this.getAddrAbsoluteX();
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x3c:
                this.getAddrAbsoluteX();
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x5c:
                this.getAddrAbsoluteX();
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0x7c:
                this.getAddrAbsoluteX();
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xdc:
                this.getAddrAbsoluteX();
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xfc:
                this.getAddrAbsoluteX();
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xeb:
                this.SBC(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xc3:
                this.DCP(this.getAddrIndirectX());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0xc7:
                this.DCP(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0xcf:
                this.DCP(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0xd3:
                this.DCP(this.getAddrIndirectY());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0xd7:
                this.DCP(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0xdb:
                this.DCP(this.getAddrAbsoluteY());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0xdf:
                this.DCP(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0xe3:
                this.ISC(this.getAddrIndirectX());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0xe7:
                this.ISC(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0xef:
                this.ISC(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0xf3:
                this.ISC(this.getAddrIndirectY());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0xf7:
                this.ISC(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0xfb:
                this.ISC(this.getAddrAbsoluteY());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0xff:
                this.ISC(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0xab:
                this.LAX(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xa7:
                this.LAX(this.getByteZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0xb7:
                this.LAX(this.getByteZeroPageY());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0xaf:
                this.LAX(this.getByteAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0xbf:
                this.LAX(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            case 0xa3:
                this.LAX(this.getByteIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0xb3:
                this.LAX(this.getByteIndirectY());
                this.ip += 2;
                this.sleep = 5 + this.pageCross;
                break;
            case 0x83:
                this.SAX(this.getAddrIndirectX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x87:
                this.SAX(this.getAddrZeroPage());
                this.ip += 2;
                this.sleep = 3;
                break;
            case 0x8f:
                this.SAX(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 4;
                break;
            case 0x97:
                this.SAX(this.getAddrZeroPageY());
                this.ip += 2;
                this.sleep = 4;
                break;
            case 0x03:
                this.SLO(this.getAddrIndirectX());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0x07:
                this.SLO(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0x0f:
                this.SLO(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0x13:
                this.SLO(this.getAddrIndirectY());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0x17:
                this.SLO(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x1b:
                this.SLO(this.getAddrAbsoluteY());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x1f:
                this.SLO(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x23:
                this.RLA(this.getAddrIndirectX());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0x27:
                this.RLA(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0x2f:
                this.RLA(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0x33:
                this.RLA(this.getAddrIndirectY());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0x37:
                this.RLA(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x3b:
                this.RLA(this.getAddrAbsoluteY());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x3f:
                this.RLA(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x63:
                this.RRA(this.getAddrIndirectX());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0x67:
                this.RRA(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0x6f:
                this.RRA(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0x73:
                this.RRA(this.getAddrIndirectY());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0x77:
                this.RRA(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x7b:
                this.RRA(this.getAddrAbsoluteY());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x7f:
                this.RRA(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x43:
                this.SRE(this.getAddrIndirectX());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0x47:
                this.SRE(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 5;
                break;
            case 0x4f:
                this.SRE(this.getAddrAbsolute());
                this.ip += 3;
                this.sleep = 6;
                break;
            case 0x53:
                this.SRE(this.getAddrIndirectY());
                this.ip += 2;
                this.sleep = 8;
                break;
            case 0x57:
                this.SRE(this.getAddrZeroPageX());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x5b:
                this.SRE(this.getAddrAbsoluteY());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x5f:
                this.SRE(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 7;
                break;
            case 0x0b:
                this.ANC(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x2b:
                this.ANC(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x4b:
                this.ALR(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x6b:
                this.ARR(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0xcb:
                this.AXS(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x9c:
                this.SYA(this.getAddrAbsoluteX());
                this.ip += 3;
                this.sleep = 5;
                break;
            case 0x9e:
                this.SXA(this.getAddrAbsoluteY());
                this.ip += 3;
                this.sleep = 5;
                break;
            case 0x8b:
                this.XAA(this.getByteImmediate());
                this.ip += 2;
                this.sleep = 2;
                break;
            case 0x93:
                this.AXA(this.getByteIndirectY());
                this.ip += 2;
                this.sleep = 6;
                break;
            case 0x9b:
                this.XAS(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 5;
                break;
            case 0x9f:
                this.AXA(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 5;
                break;
            case 0xbb:
                this.LAR(this.getByteAbsoluteY());
                this.ip += 3;
                this.sleep = 4 + this.pageCross;
                break;
            default:
                throw 'unkown opcode $' + (this.memory.getByte(this.ip)).toString(16);
        }
        if (this.sleep === 0) {
            throw 'sleep not set';
        }
        this.sleep--;
        this.ip &= 0xffff;
    };
    return Mos6502;
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
        this.fPAL = !!(rawBytes[9]);
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
            this.ROMBanks[ibank] = new ROM(rawBytes.slice(idx, idx + 0x4000));
            idx += 0x4000;
        }
        for (var ibank = 0; ibank < this.VRAMBanks.length; ibank++) {
            this.VRAMBanks[ibank] = RAM.fromBytes(rawBytes.slice(idx, idx + 0x2000));
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
///<reference path="CompoundMemory.ts"/>
///<reference path="RAM.ts"/>
///<reference path="NesImage.ts"/>
///<reference path="Mos6502.ts"/>
var NesEmulator = (function () {
    function NesEmulator(nesImage, ctx) {
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
                if (nesImage.VRAMBanks.length > 1 || nesImage.VRAMBanks[0].size() !== 0x2000)
                    throw 'unknown VRAMBanks';
                var patternTable = nesImage.VRAMBanks.length > 0 ? nesImage.VRAMBanks[0] : new RAM(0x2000);
                var nameTableA = new RAM(0x400);
                var nameTableB = new RAM(0x400);
                var nameTableC = nesImage.fFourScreenVRAM ? new RAM(0x400) : nesImage.fVerticalMirroring ? nameTableA : nameTableB;
                var nameTableD = nesImage.fFourScreenVRAM ? new RAM(0x400) : nesImage.fVerticalMirroring ? nameTableB : nameTableA;
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
        this.cpu = new Mos6502(this.memory);
        this.apu = new APU(this.memory, this.cpu);
        this.ppu = new PPU(this.memory, this.vmemory, this.cpu);
        this.cpu.Reset();
    }
    NesEmulator.prototype.setCtx = function (ctx) {
        this.ppu.setCtx(ctx);
    };
    NesEmulator.prototype.step = function () {
        if (this.icycle % 4 === 0)
            this.ppu.step();
        if (this.icycle % 12 === 0)
            this.cpu.step();
        this.apu.step();
        this.icycle++;
    };
    return NesEmulator;
})();
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
        this._v = 0; // Current VRAM address (15 bits)
        this.t = 0; // Temporary VRAM address (15 bits); can also be thought of as the address of the top left onscreen tile.
        this.x = 0; // Fine X scroll (3 bits)
        this.w = 0; // First or second write toggle (1 bit)
        this.daddrWrite = 0;
        this.addrSpritePatternTable = 0;
        this.addrScreenPatternTable = 0;
        this.flgVblank = false;
        this.nmi_output = false;
        this.spriteHeight = 8;
        this._imageGrayscale = false;
        this._showBgInLeftmost8Pixels = false;
        this._showSpritesInLeftmost8Pixels = false;
        this._showBg = false;
        this._showSprites = false;
        this._emphasizeRed = false;
        this._emphasizeGreen = false;
        this._emphasizeBlue = false;
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
        this.icycle = 0;
        this.colors = [
            0xff545454, 0xff001e74, 0xff081090, 0xff300088, 0xff440064, 0xff5c0030, 0xff540400, 0xff3c1800,
            0xff202a00, 0xff083a00, 0xff004000, 0xff003c00, 0xff00323c, 0xff000000, 0xff000000, 0xff000000,
            0xff989698, 0xff084cc4, 0xff3032ec, 0xff5c1ee4, 0xff8814b0, 0xffa01464, 0xff982220, 0xff783c00,
            0xff545a00, 0xff287200, 0xff087c00, 0xff007628, 0xff006678, 0xff000000, 0xff000000, 0xff000000,
            0xffeceeec, 0xff4c9aec, 0xff787cec, 0xffb062ec, 0xffe454ec, 0xffec58b4, 0xffec6a64, 0xffd48820,
            0xffa0aa00, 0xff74c400, 0xff4cd020, 0xff38cc6c, 0xff38b4cc, 0xff3c3c3c, 0xff000000, 0xff000000,
            0xffeceeec, 0xffa8ccec, 0xffbcbcec, 0xffd4b2ec, 0xffecaeec, 0xffecaed4, 0xffecb4b0, 0xffe4c490,
            0xffccd278, 0xffb4de78, 0xffa8e290, 0xff98e2b4, 0xffa0d6e4, 0xffa0a2a0, 0xff000000, 0xff000000
        ];
        if (vmemory.size() !== 0x4000)
            throw 'insufficient Vmemory size';
        memory.shadowSetter(0x2000, 0x2007, this.setter.bind(this));
        memory.shadowGetter(0x2000, 0x2007, this.getter.bind(this));
    }
    Object.defineProperty(PPU.prototype, "v", {
        get: function () {
            return this._v;
        },
        set: function (value) {
            this._v = value;
        },
        enumerable: true,
        configurable: true
    });
    PPU.prototype.setCtx = function (ctx) {
        this.ctx = ctx;
        this.imageData = this.ctx.getImageData(0, 0, 256, 240);
        this.buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(this.buf);
        this.data = new Uint32Array(this.buf);
    };
    PPU.prototype.getter = function (addr) {
        switch (addr) {
            case 0x2002:
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
                    var res = this.flgVblank ? (1 << 7) : 0;
                    //Read PPUSTATUS: Return old status of NMI_occurred in bit 7, then set NMI_occurred to false.
                    this.flgVblank = false;
                    return res;
                }
            case 0x2007:
                {
                    var res = this.vmemory.getByte(this.v & 0x3fff);
                    this.v += this.daddrWrite;
                    this.v &= 0x3fff;
                    return res;
                }
            default:
                throw 'unimplemented read from addr ' + addr;
                return 0;
        }
    };
    PPU.prototype.setter = function (addr, value) {
        value &= 0xff;
        switch (addr) {
            case 0x2000:
                this.t = (this.v & 0x73ff) | ((value & 3) << 10);
                this.daddrWrite = value & 0x04 ? 32 : 1; //VRAM address increment per CPU read/write of PPUDATA
                this.addrSpritePatternTable = value & 0x08 ? 0x1000 : 0;
                this.addrScreenPatternTable = value & 0x10 ? 0x1000 : 0;
                this.spriteHeight = value & 0x20 ? 16 : 8;
                this.nmi_output = !!(value & 0x80);
                break;
            case 0x2001:
                var x = this.showBg;
                this.imageGrayscale = this._imageGrayscale = !!(value & 0x01);
                this.showBgInLeftmost8Pixels = this._showBgInLeftmost8Pixels = !!(value & 0x02);
                this.showSpritesInLeftmost8Pixels = this._showSpritesInLeftmost8Pixels = !!(value & 0x04);
                this.showBg = this._showBg = !!(value & 0x08);
                this.showSprites = this._showSprites = !!(value & 0x10);
                this.emphasizeRed = this._emphasizeRed = !!(value & 0x20);
                this.emphasizeGreen = this._emphasizeGreen = !!(value & 0x40);
                this.emphasizeBlue = this._emphasizeBlue = !!(value & 0x80);
                //if (x != this.showBg)
                //    console.log('show:', x, '->', this.showBg);
                break;
            case 0x2005:
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
            case 0x2006:
                if (this.w === 0) {
                    this.t = (this.t & 0x00ff) | ((value & 0x3f) << 8);
                }
                else {
                    this.t = (this.t & 0xff00) + (value & 0xff);
                    this.v = this.t;
                }
                this.w = 1 - this.w;
                break;
            case 0x2007:
                var vold = this.v;
                this.vmemory.setByte(this.v & 0x3fff, value);
                this.v += this.daddrWrite;
                this.v &= 0x3fff;
                //if ((this.showBg || this.showSprites) && this.sy < PPU.syPostRender)
                //    console.log('x ', this.showBg ? 'bg:on' : 'bg:off', vold.toString(16), value.toString(16), String.fromCharCode(value));
                break;
        }
    };
    PPU.prototype.incrementX = function () {
        this.x++;
        if (this.x === 8) {
            this.x = 0;
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
        }
    };
    PPU.prototype.incrementY = function () {
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
    PPU.prototype.getNameTable = function (i) {
        var st = '';
        for (var y = 0; y < 30; y++) {
            for (var x = 0; x < 32; x++) {
                st += String.fromCharCode(this.vmemory.getByte(0x2000 + (i * 0x400) + x + y * 32));
            }
            st += '\n';
        }
        console.log(st);
    };
    PPU.prototype.step = function () {
        if (this.sx === 0 && this.sy === PPU.syPostRender) {
            //console.log('ppu vblank start', this.icycle);
            this.sx = PPU.sxMin;
            this.imageData.data.set(this.buf8);
            this.ctx.putImageData(this.imageData, 0, 0);
            this.iFrame++;
            this.dataAddr = 0;
            this.flgVblank = true;
            this.imageGrayscale = this._imageGrayscale;
            this.showBgInLeftmost8Pixels = this._showBgInLeftmost8Pixels;
            this.showSpritesInLeftmost8Pixels = this._showSpritesInLeftmost8Pixels;
            this.showBg = this._showBg;
            this.showSprites = this._showSprites;
            this.emphasizeRed = this._emphasizeRed;
            this.emphasizeGreen = this._emphasizeGreen;
            this.emphasizeBlue = this._emphasizeBlue;
        }
        else if (this.sy >= PPU.syPostRender && this.sy <= PPU.syPreRender) {
            //vblank
            if (this.sx === 1 && this.sy === PPU.syPostRender && this.flgVblank && this.nmi_output) {
                this.nmi_output = false;
                this.cpu.RequestNMI();
            }
        }
        else if (this.sy === PPU.syFirstVisible && this.sx === 0) {
            //beginning of screen
            //console.log('ppu vblank end bg:',this.showBg );
            this.flgVblank = false;
            if (this.showBg || this.showSprites)
                this.v = this.t;
        }
        if ((this.showBg || this.showSprites) && this.sx >= 0 && this.sy >= PPU.syFirstVisible && this.sx < 256 && this.sy < PPU.syPostRender) {
            if (this.showBg) {
                // The high bits of v are used for fine Y during rendering, and addressing nametable data 
                // only requires 12 bits, with the high 2 CHR addres lines fixed to the 0x2000 region. 
                //
                // The address to be fetched during rendering can be deduced from v in the following way:
                //   tile address      = 0x2000 | (v & 0x0FFF)
                //   attribute address = 0x23C0 | (v & 0x0C00) | ((v >> 4) & 0x38) | ((v >> 2) & 0x07)
                //
                // The low 12 bits of the attribute address are composed in the following way:
                //   NN 1111 YYY XXX
                //   || |||| ||| +++-- high 3 bits of coarse X (x / 4)
                //   || |||| +++------ high 3 bits of coarse Y (y / 4)
                //   || ++++---------- attribute offset (960 bytes)
                //   ++--------------- nametable select
                var addrAttribute = 0x23C0 | (this.v & 0x0C00) | ((this.v >> 4) & 0x38) | ((this.v >> 2) & 0x07);
                var attribute = this.vmemory.getByte(addrAttribute);
                var addrTile = 0x2000 | (this.v & 0x0fff);
                var itile = this.vmemory.getByte(addrTile);
                var tileCol = 7 - (this.x);
                var tileRow = this.v >> 12;
                var ipalette0 = ((this.vmemory.getByte(this.addrScreenPatternTable + itile * 16 + tileRow)) >> tileCol) & 1;
                var ipalette1 = ((this.vmemory.getByte(this.addrScreenPatternTable + itile * 16 + 8 + tileRow)) >> tileCol) & 1;
                var ipalette23 = (attribute >> ((this.v >> 5) & 2 + (this.v >> 1) & 1)) & 3;
                var ipalette = (ipalette23 << 2) + (ipalette1 << 1) + ipalette0;
                /* Addresses $3F04/$3F08/$3F0C can contain unique data, though these values are not used by the PPU when normally rendering
                    (since the pattern values that would otherwise select those cells select the backdrop color instead).
                    They can still be shown using the background palette hack, explained below.*/
                if ((ipalette & 3) === 0)
                    ipalette = 0;
                var addrPalette = 0x3f00 + ipalette;
                var icolor = this.vmemory.getByte(addrPalette);
                var color = this.colors[icolor];
                this.data[this.dataAddr] = color;
                this.dataAddr++;
            }
            this.incrementX();
        }
        this.sx++;
        if (this.sx === PPU.sxMax + 1) {
            //end of scanline
            this.sx = 0;
            this.sy++;
            if (this.sy === PPU.syPreRender + 1) {
                this.sy = PPU.syFirstVisible;
            }
            else {
                if ((this.showBg || this.showSprites) && this.sy < PPU.syPostRender) {
                    this.incrementY();
                }
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
    function ROM(memory) {
        this.memory = memory;
    }
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
var StepTest = (function () {
    function StepTest() {
        this.ich = 0;
    }
    StepTest.prototype.readLine = function () {
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
    StepTest.prototype.run = function (nesemu, expectedOutput, log) {
        var prevLine = "BEGIN";
        this.expectedOutput = expectedOutput;
        this.ich = 0;
        var line = this.readLine();
        nesemu.cpu.ip = parseInt(line.split(' ')[0], 16);
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
                return 'ip:' + ip.toString(16) +
                    ' rA:' + rA.toString(16) +
                    ' rX:' + rX.toString(16) +
                    ' rY:' + rY.toString(16) +
                    ' rP:' + stRP +
                    ' sp:' + sp.toString(16);
            }
            var expected = tsto(ip, rA, rX, rY, rP, sp);
            var actual = tsto(nesemu.cpu.ip, nesemu.cpu.rA, nesemu.cpu.rX, nesemu.cpu.rY, nesemu.cpu.rP, nesemu.cpu.sp);
            if (expected !== actual) {
                log(prevLine);
                log(expected);
                log(actual);
                break;
            }
            nesemu.step();
            prevLine = line;
            line = this.readLine();
        }
        ;
        log('done');
    };
    return StepTest;
})();
//# sourceMappingURL=app.js.map