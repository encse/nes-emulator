///<reference path="Memory.ts"/>

class Most6502Base {
    opcode: number;
    memory: Memory;
    ip: number = 0;
    sp: number = 0;
    t: number = 0;
    b: number = 0;
    rA: number = 0;
    rX: number = 0;
    rY: number = 0;

    private flgCarry: number = 0;
    private flgZero: number = 0;
    private flgNegative: number = 0;
    private flgOverflow: number = 0;
    private flgInterruptDisable: number = 1;
    private flgDecimalMode: number = 0;
    private flgBreakCommand: number = 0;

    addr: number;
    addrHi: number;
    addrLo: number;
    addrPtr: number;
    ptrLo: number;
    ptrHi: number;
    ipC: number;
    addrC: number;

    public addrReset = 0xfffc;
    public addrIRQ = 0xfffe;
    public addrNMI = 0xfffa;
  
    private pushByte(byte: number) {
        this.memory.setByte(0x100 + this.sp, byte & 0xff);
        this.sp = this.sp === 0 ? 0xff : this.sp - 1;
    }

    private popByte():number{
        this.sp = this.sp === 0xff ? 0 : this.sp + 1;
        return this.memory.getByte(0x100 + this.sp);
    }

    public get rP(): number {
        return (this.flgNegative << 7) +
            (this.flgOverflow << 6) +
            (1 << 5) +
            (this.flgBreakCommand << 4) +
            (this.flgDecimalMode << 3) +
            (this.flgInterruptDisable << 2) +
            (this.flgZero << 1) +
            (this.flgCarry << 0);
    }

    public set rP(byte: number) {
        this.flgNegative = (byte >> 7) & 1;
        this.flgOverflow = (byte >> 6) & 1;
        //skip (byte >> 5) & 1;
        //skip this.flgBreakCommand = (byte >> 4) & 1;
        this.flgBreakCommand = 0;
        this.flgDecimalMode = (byte >> 3) & 1;
        this.flgInterruptDisable = (byte >> 2) & 1;
        this.flgZero = (byte >> 1) & 1;
        this.flgCarry = (byte >> 0) & 1;
    }

    public clk() {

        if (this.t === 0) {
            this.opcode = this.memory.getByte(this.ip);
            this.addr = this.addrHi = this.addrLo = this.addrPtr = this.ptrLo = this.ptrHi = this.ipC = this.addrC = 0;
        }

        switch (this.opcode) {
case 0x69: /* ADC Immediate 2 */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x65: /* ADC ZeroPage 3 */ {
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x75: /* ADC ZeroPageX 4 */ {
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x6d: /* ADC Absolute 4 */ {
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
            this.ip++;
            this.t++;
            break;
        }
        case 3: {
            this.b = this.memory.getByte(this.addr);
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x7d: /* ADC AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                const sum = this.rA + this.b + this.flgCarry;
                const bothPositive = this.b < 128 && this.rA < 128;
                const bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum % 256;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x79: /* ADC AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                const sum = this.rA + this.b + this.flgCarry;
                const bothPositive = this.b < 128 && this.rA < 128;
                const bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum % 256;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x61: /* ADC IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x71: /* ADC IndirectY 5pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                const sum = this.rA + this.b + this.flgCarry;
                const bothPositive = this.b < 128 && this.rA < 128;
                const bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum % 256;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 5: {
            this.b = this.memory.getByte(this.addr);
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x29: /* AND Immediate 2 */ {
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
    break;
}
case 0x25: /* AND ZeroPage 3 */ {
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
    break;
}
case 0x35: /* AND ZeroPageX 4 */ {
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
    break;
}
case 0x2d: /* AND Absolute 4 */ {
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
    break;
}
case 0x3d: /* AND AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0x39: /* AND AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0x21: /* AND IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
    break;
}
case 0x31: /* AND IndirectY 5pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b &= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
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
    break;
}
case 0xa: /* ASL Accumulator 2 */ {
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
    break;
}
case 0x6: /* ASL ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x16: /* ASL ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xe: /* ASL Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x1e: /* ASL AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x90: /* BCC Relative 2pc bc  */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            if (!this.flgCarry) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 2: {
            this.memory.getByte(this.ip);
            this.b = this.b >= 128 ? this.b - 256 : this.b;
            this.ipC = (this.ip & 0xff) + this.b >> 8;
            this.ip += this.b;
            if (this.ipC) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 3: {
            this.ip += this.ipC << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xb0: /* BCS Relative 2pc bc  */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            if (this.flgCarry) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 2: {
            this.memory.getByte(this.ip);
            this.b = this.b >= 128 ? this.b - 256 : this.b;
            this.ipC = (this.ip & 0xff) + this.b >> 8;
            this.ip += this.b;
            if (this.ipC) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 3: {
            this.ip += this.ipC << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xf0: /* BEQ Relative 2pc bc  */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            if (this.flgZero) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 2: {
            this.memory.getByte(this.ip);
            this.b = this.b >= 128 ? this.b - 256 : this.b;
            this.ipC = (this.ip & 0xff) + this.b >> 8;
            this.ip += this.b;
            if (this.ipC) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 3: {
            this.ip += this.ipC << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x30: /* BMI Relative 2pc bc  */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            if (this.flgNegative) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 2: {
            this.memory.getByte(this.ip);
            this.b = this.b >= 128 ? this.b - 256 : this.b;
            this.ipC = (this.ip & 0xff) + this.b >> 8;
            this.ip += this.b;
            if (this.ipC) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 3: {
            this.ip += this.ipC << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xd0: /* BNE Relative 2pc bc  */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            if (!this.flgZero) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 2: {
            this.memory.getByte(this.ip);
            this.b = this.b >= 128 ? this.b - 256 : this.b;
            this.ipC = (this.ip & 0xff) + this.b >> 8;
            this.ip += this.b;
            if (this.ipC) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 3: {
            this.ip += this.ipC << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x10: /* BPL Relative 2pc bc  */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            if (!this.flgNegative) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 2: {
            this.memory.getByte(this.ip);
            this.b = this.b >= 128 ? this.b - 256 : this.b;
            this.ipC = (this.ip & 0xff) + this.b >> 8;
            this.ip += this.b;
            if (this.ipC) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 3: {
            this.ip += this.ipC << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x50: /* BVC Relative 2pc bc  */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            if (!this.flgOverflow) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 2: {
            this.memory.getByte(this.ip);
            this.b = this.b >= 128 ? this.b - 256 : this.b;
            this.ipC = (this.ip & 0xff) + this.b >> 8;
            this.ip += this.b;
            if (this.ipC) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 3: {
            this.ip += this.ipC << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x70: /* BVS Relative 2pc bc  */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            if (this.flgOverflow) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 2: {
            this.memory.getByte(this.ip);
            this.b = this.b >= 128 ? this.b - 256 : this.b;
            this.ipC = (this.ip & 0xff) + this.b >> 8;
            this.ip += this.b;
            if (this.ipC) {
                this.t++;
            } else {
                this.t = 0;
            }
            break;
        }
        case 3: {
            this.ip += this.ipC << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x24: /* BIT ZeroPage 3 */ {
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
            this.b = this.rA & this.b;
            this.flgZero = !this.b ? 1 : 0;
            this.flgNegative = this.b & 128 ? 1 : 0;
            this.flgOverflow = this.b & 64 ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x2c: /* BIT Absolute 4 */ {
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
            this.ip++;
            this.t++;
            break;
        }
        case 3: {
            this.b = this.memory.getByte(this.addr);
            this.b = this.rA & this.b;
            this.flgZero = !this.b ? 1 : 0;
            this.flgNegative = this.b & 128 ? 1 : 0;
            this.flgOverflow = this.b & 64 ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x18: /* CLC Implied 2 */ {
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
    break;
}
case 0xd8: /* CLD Implied 2 */ {
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
    break;
}
case 0x58: /* CLI Implied 2 */ {
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
    break;
}
case 0xb8: /* CLV Implied 2 */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.memory.getByte(this.ip);
            this.flgOverflow = 1;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xc9: /* CMP Immediate 2 */ {
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
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xc5: /* CMP ZeroPage 3 */ {
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
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xd5: /* CMP ZeroPageX 4 */ {
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
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xcd: /* CMP Absolute 4 */ {
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
            this.ip++;
            this.t++;
            break;
        }
        case 3: {
            this.b = this.memory.getByte(this.addr);
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xdd: /* CMP AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero =  this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xd9: /* CMP AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero =  this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xc1: /* CMP IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xd1: /* CMP IndirectY 5pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero =  this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 5: {
            this.b = this.memory.getByte(this.addr);
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xe0: /* CPX Immediate 2 */ {
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
            this.flgZero =  this.rX === this.b ? 1 : 0;
            this.flgNegative = (this.rX - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xe4: /* CPX ZeroPage 3 */ {
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
            this.flgZero =  this.rX === this.b ? 1 : 0;
            this.flgNegative = (this.rX - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xec: /* CPX Absolute 4 */ {
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
            this.ip++;
            this.t++;
            break;
        }
        case 3: {
            this.b = this.memory.getByte(this.addr);
            this.flgCarry = this.rX >= this.b ? 1 : 0;
            this.flgZero =  this.rX === this.b ? 1 : 0;
            this.flgNegative = (this.rX - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xc0: /* CPY Immediate 2 */ {
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
            this.flgZero =  this.rY === this.b ? 1 : 0;
            this.flgNegative = (this.rY - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xc4: /* CPY ZeroPage 3 */ {
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
            this.flgZero =  this.rY === this.b ? 1 : 0;
            this.flgNegative = (this.rY - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xcc: /* CPY Absolute 4 */ {
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
            this.ip++;
            this.t++;
            break;
        }
        case 3: {
            this.b = this.memory.getByte(this.addr);
            this.flgCarry = this.rY >= this.b ? 1 : 0;
            this.flgZero =  this.rY === this.b ? 1 : 0;
            this.flgNegative = (this.rY - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xc6: /* DEC ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xd6: /* DEC ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xce: /* DEC Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xde: /* DEC AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xca: /* DEX Accumulator 2 */ {
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
    break;
}
case 0x88: /* DEY Accumulator 2 */ {
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
    break;
}
case 0xe6: /* INC ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xf6: /* INC ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xee: /* INC Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xfe: /* INC AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xe8: /* INX Accumulator 2 */ {
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
    break;
}
case 0xc8: /* INY Accumulator 2 */ {
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
    break;
}
case 0x49: /* EOR Immediate 2 */ {
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
    break;
}
case 0x45: /* EOR ZeroPage 3 */ {
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
    break;
}
case 0x55: /* EOR ZeroPageX 4 */ {
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
    break;
}
case 0x4d: /* EOR Absolute 4 */ {
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
    break;
}
case 0x5d: /* EOR AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0x59: /* EOR AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0x41: /* EOR IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
    break;
}
case 0x51: /* EOR IndirectY 5pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b ^= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
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
    break;
}
case 0x4c: /* JMP Absolute 3 */ {
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
    break;
}
case 0x6c: /* JMP AbsoluteIndirect 5 */ {
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
            this.addrLo = this.memory.getByte( (this.ptrHi << 8) + this.ptrLo );
            this.t++;
            break;
        }
        case 4: {
            this.addrHi = this.memory.getByte( (this.ptrHi << 8) + ((this.ptrLo + 1) & 0xff) );
            this.ip = (this.addrHi << 8) + this.addrLo;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xa9: /* LDA Immediate 2 */ {
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
    break;
}
case 0xa5: /* LDA ZeroPage 3 */ {
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
    break;
}
case 0xb5: /* LDA ZeroPageX 4 */ {
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
    break;
}
case 0xad: /* LDA Absolute 4 */ {
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
    break;
}
case 0xbd: /* LDA AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0xb9: /* LDA AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0xa1: /* LDA IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
    break;
}
case 0xb1: /* LDA IndirectY 5pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
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
    break;
}
case 0xa2: /* LDX Immediate 2 */ {
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
    break;
}
case 0xa6: /* LDX ZeroPage 3 */ {
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
    break;
}
case 0xb6: /* LDX ZeroPageY 4 */ {
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
    break;
}
case 0xae: /* LDX Absolute 4 */ {
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
    break;
}
case 0xbe: /* LDX AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rX = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0xa0: /* LDY Immediate 2 */ {
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
    break;
}
case 0xa4: /* LDY ZeroPage 3 */ {
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
    break;
}
case 0xb4: /* LDY ZeroPageX 4 */ {
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
    break;
}
case 0xac: /* LDY Absolute 4 */ {
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
    break;
}
case 0xbc: /* LDY AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b & 128 ? 1 : 0;
                this.rY = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0x4a: /* LSR Accumulator 2 */ {
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
    break;
}
case 0x46: /* LSR ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x56: /* LSR ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x4e: /* LSR Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x5e: /* LSR AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xea: /* NOP Implied 2 */ {
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
    break;
}
case 0x9: /* ORA Immediate 2 */ {
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
    break;
}
case 0x5: /* ORA ZeroPage 3 */ {
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
    break;
}
case 0x15: /* ORA ZeroPageX 4 */ {
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
    break;
}
case 0xd: /* ORA Absolute 4 */ {
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
    break;
}
case 0x1d: /* ORA AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0x19: /* ORA AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0x1: /* ORA IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
    break;
}
case 0x11: /* ORA IndirectY 5pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b |= this.rA;
                this.flgZero = !this.b ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
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
    break;
}
case 0x48: /* PHA Implied 3 */ {
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
    break;
}
case 0x8: /* PHP Implied 3 */ {
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
    break;
}
case 0x68: /* PLA Implied 4 */ {
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
    break;
}
case 0x28: /* PLP Implied 4 */ {
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
    break;
}
case 0x2a: /* ROL Accumulator 2 */ {
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
    break;
}
case 0x26: /* ROL ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x36: /* ROL ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x2e: /* ROL Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x3e: /* ROL AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x6a: /* ROR Accumulator 2 */ {
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
    break;
}
case 0x66: /* ROR ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x76: /* ROR ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x6e: /* ROR Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x7e: /* ROR AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x0: /* BRK BRK 7 */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.memory.getByte(this.ip);
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
            this.flgBreakCommand = 1;
            this.pushByte(this.rP);
            this.flgBreakCommand = 0;
            this.t++;
            break;
        }
        case 5: {
            this.ip = this.memory.getByte(this.addrIRQ);
            this.t++;
            break;
        }
        case 6: {
            this.ip |= this.memory.getByte(this.addrIRQ + 1) << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x40: /* RTI RTI 6 */ {
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
    break;
}
case 0xe9: /* SBC Immediate 2 */ {
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xe5: /* SBC ZeroPage 3 */ {
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xf5: /* SBC ZeroPageX 4 */ {
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xed: /* SBC Absolute 4 */ {
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
            this.ip++;
            this.t++;
            break;
        }
        case 3: {
            this.b = this.memory.getByte(this.addr);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xfd: /* SBC AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b = 255 - this.b;
                const sum = this.rA + this.b + this.flgCarry;
                const bothPositive = this.b < 128 && this.rA < 128;
                const bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum % 256;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xf9: /* SBC AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b = 255 - this.b;
                const sum = this.rA + this.b + this.flgCarry;
                const bothPositive = this.b < 128 && this.rA < 128;
                const bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum % 256;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xe1: /* SBC IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xf1: /* SBC IndirectY 5pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.b = 255 - this.b;
                const sum = this.rA + this.b + this.flgCarry;
                const bothPositive = this.b < 128 && this.rA < 128;
                const bothNegative = this.b >= 128 && this.rA >= 128;
                this.flgCarry = sum > 255 ? 1 : 0;
                this.b = sum % 256;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
                this.rA = this.b;
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 5: {
            this.b = this.memory.getByte(this.addr);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x38: /* SEC Implied 2 */ {
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
    break;
}
case 0xf8: /* SED Implied 2 */ {
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
    break;
}
case 0x78: /* SEI Implied 2 */ {
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
    break;
}
case 0x85: /* STA ZeroPage 3 */ {
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
    break;
}
case 0x95: /* STA ZeroPageX 4 */ {
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
    break;
}
case 0x8d: /* STA Absolute 4 */ {
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
    break;
}
case 0x9d: /* STA AbsoluteX 5 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
    break;
}
case 0x99: /* STA AbsoluteY 5 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
    break;
}
case 0x81: /* STA IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
    break;
}
case 0x91: /* STA IndirectY 6 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
    break;
}
case 0x86: /* STX ZeroPage 3 */ {
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
    break;
}
case 0x96: /* STX ZeroPageY 4 */ {
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
    break;
}
case 0x8e: /* STX Absolute 4 */ {
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
    break;
}
case 0x84: /* STY ZeroPage 3 */ {
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
    break;
}
case 0x94: /* STY ZeroPageX 4 */ {
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
    break;
}
case 0x8c: /* STY Absolute 4 */ {
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
    break;
}
case 0xaa: /* TAX Accumulator 2 */ {
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
    break;
}
case 0xa8: /* TAY Accumulator 2 */ {
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
    break;
}
case 0xba: /* TSX Accumulator 2 */ {
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
    break;
}
case 0x8a: /* TXA Accumulator 2 */ {
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
    break;
}
case 0x9a: /* TXS Accumulator 2 */ {
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
    break;
}
case 0x98: /* TYA Accumulator 2 */ {
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
    break;
}
case 0x20: /* JSR JSR 6 */ {
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
            this.ip = this.addrLo;
            this.ip |= this.memory.getByte(this.ip) << 8;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x60: /* RTS RTS 6 */ {
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
    break;
}
case 0x1a: /* NOP Implied 2 */ {
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
    break;
}
case 0x3a: /* NOP Implied 2 */ {
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
    break;
}
case 0x5a: /* NOP Implied 2 */ {
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
    break;
}
case 0x7a: /* NOP Implied 2 */ {
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
    break;
}
case 0xda: /* NOP Implied 2 */ {
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
    break;
}
case 0xfa: /* NOP Implied 2 */ {
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
    break;
}
case 0x4: /* NOP ZeroPage 3 */ {
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
    break;
}
case 0x14: /* NOP ZeroPageX 4 */ {
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
    break;
}
case 0x34: /* NOP ZeroPageX 4 */ {
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
    break;
}
case 0x44: /* NOP ZeroPage 3 */ {
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
    break;
}
case 0x54: /* NOP ZeroPageX 4 */ {
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
    break;
}
case 0x74: /* NOP ZeroPageX 4 */ {
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
    break;
}
case 0xd4: /* NOP ZeroPageX 4 */ {
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
    break;
}
case 0xf4: /* NOP ZeroPageX 4 */ {
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
    break;
}
case 0x64: /* NOP ZeroPage 3 */ {
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
    break;
}
case 0x80: /* NOP Immediate 2 */ {
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
    break;
}
case 0x82: /* NOP Immediate 2 */ {
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
    break;
}
case 0xc2: /* NOP Immediate 2 */ {
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
    break;
}
case 0xe2: /* NOP Immediate 2 */ {
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
    break;
}
case 0x89: /* NOP Immediate 2 */ {
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
    break;
}
case 0xc: /* NOP Absolute 4 */ {
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
    break;
}
case 0x1c: /* NOP AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x3c: /* NOP AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x5c: /* NOP AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x7c: /* NOP AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xdc: /* NOP AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xfc: /* NOP AbsoluteX 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xc3: /* DCP IndirectX 8 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b - 1) & 0xff;
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero = this.rA === this.b? 1 : 0;
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
    break;
}
case 0xc7: /* DCP ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b - 1) & 0xff;
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero = this.rA === this.b? 1 : 0;
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
    break;
}
case 0xcf: /* DCP Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b - 1) & 0xff;
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero = this.rA === this.b? 1 : 0;
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
    break;
}
case 0xd3: /* DCP IndirectY 8 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b - 1) & 0xff;
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero = this.rA === this.b? 1 : 0;
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
    break;
}
case 0xd7: /* DCP ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b - 1) & 0xff;
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero = this.rA === this.b? 1 : 0;
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
    break;
}
case 0xdb: /* DCP AbsoluteY 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b - 1) & 0xff;
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero = this.rA === this.b? 1 : 0;
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
    break;
}
case 0xdf: /* DCP AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b - 1) & 0xff;
            this.flgCarry = this.rA >= this.b ? 1 : 0;
            this.flgZero = this.rA === this.b? 1 : 0;
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
    break;
}
case 0xe3: /* ISC IndirectX 8 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b + 1) & 0xff;
            this.flgZero = !this.b ? 1 : 0;
            this.flgNegative = this.b & 0x80 ? 1 : 0;
            this.t++;
            break;
        }
        case 7: {
            this.memory.setByte(this.addr, this.b);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xe7: /* ISC ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b + 1) & 0xff;
            this.flgZero = !this.b ? 1 : 0;
            this.flgNegative = this.b & 0x80 ? 1 : 0;
            this.t++;
            break;
        }
        case 4: {
            this.memory.setByte(this.addr, this.b);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xef: /* ISC Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b + 1) & 0xff;
            this.flgZero = !this.b ? 1 : 0;
            this.flgNegative = this.b & 0x80 ? 1 : 0;
            this.t++;
            break;
        }
        case 5: {
            this.memory.setByte(this.addr, this.b);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xf3: /* ISC IndirectY 8 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b + 1) & 0xff;
            this.flgZero = !this.b ? 1 : 0;
            this.flgNegative = this.b & 0x80 ? 1 : 0;
            this.t++;
            break;
        }
        case 7: {
            this.memory.setByte(this.addr, this.b);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xf7: /* ISC ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b + 1) & 0xff;
            this.flgZero = !this.b ? 1 : 0;
            this.flgNegative = this.b & 0x80 ? 1 : 0;
            this.t++;
            break;
        }
        case 5: {
            this.memory.setByte(this.addr, this.b);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xfb: /* ISC AbsoluteY 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b + 1) & 0xff;
            this.flgZero = !this.b ? 1 : 0;
            this.flgNegative = this.b & 0x80 ? 1 : 0;
            this.t++;
            break;
        }
        case 6: {
            this.memory.setByte(this.addr, this.b);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xff: /* ISC AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
            this.b = (this.b + 1) & 0xff;
            this.flgZero = !this.b ? 1 : 0;
            this.flgNegative = this.b & 0x80 ? 1 : 0;
            this.t++;
            break;
        }
        case 6: {
            this.memory.setByte(this.addr, this.b);
            this.b = 255 - this.b;
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xab: /* LAX Immediate 2 */ {
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
    break;
}
case 0xa7: /* LAX ZeroPage 3 */ {
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
    break;
}
case 0xb7: /* LAX ZeroPageY 4 */ {
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
    break;
}
case 0xaf: /* LAX Absolute 4 */ {
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
    break;
}
case 0xbf: /* LAX AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.rX = this.b;
                this.t = 0;
            }
            this.t++;
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
    break;
}
case 0xa3: /* LAX IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
    break;
}
case 0xb3: /* LAX IndirectY 5pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.flgZero = this.b === 0 ? 1 : 0;
                this.flgNegative = this.b >= 128 ? 1 : 0;
                this.rA = this.b;
                this.rX = this.b;
                this.t = 0;
            }
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
    break;
}
case 0x83: /* SAX IndirectX 6 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
    break;
}
case 0x87: /* SAX ZeroPage 3 */ {
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
    break;
}
case 0x8f: /* SAX Absolute 4 */ {
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
    break;
}
case 0x97: /* SAX ZeroPageY 4 */ {
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
    break;
}
case 0x3: /* SLO IndirectX 8 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x7: /* SLO ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xf: /* SLO Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x13: /* SLO IndirectY 8 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x17: /* SLO ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x1b: /* SLO AbsoluteY 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x1f: /* SLO AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x23: /* RLA IndirectX 8 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x27: /* RLA ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x2f: /* RLA Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x33: /* RLA IndirectY 8 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x37: /* RLA ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x3b: /* RLA AbsoluteY 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x3f: /* RLA AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x63: /* RRA IndirectX 8 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
            this.memory.setByte(this.addr, this.b);
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x67: /* RRA ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x6f: /* RRA Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x73: /* RRA IndirectY 8 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x77: /* RRA ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x7b: /* RRA AbsoluteY 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x7f: /* RRA AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
            const sum = this.rA + this.b + this.flgCarry;
            const bothPositive = this.b < 128 && this.rA < 128;
            const bothNegative = this.b >= 128 && this.rA >= 128;
            this.flgCarry = sum > 255 ? 1 : 0;
            this.b = sum % 256;
            this.flgNegative = this.b >= 128 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
            this.rA = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x43: /* SRE IndirectX 8 */ {
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
            this.addrPtr = (this.memory.getByte(this.addrPtr) + this.rX) & 0xff;
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x47: /* SRE ZeroPage 5 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x4f: /* SRE Absolute 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x53: /* SRE IndirectY 8 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x57: /* SRE ZeroPageX 6 */ {
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x5b: /* SRE AbsoluteY 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0x5f: /* SRE AbsoluteX 7 */ {
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
                this.addr = this.addr + (this.addrC << 8);
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
            this.memory.setByte(this.addr, this.b);
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
    break;
}
case 0xb: /* ANC Immediate 2 */ {
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
    break;
}
case 0x2b: /* ANC Immediate 2 */ {
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
    break;
}
case 0x4b: /* ALR Immediate 2 */ {
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
    break;
}
case 0x6b: /* ARR Immediate 2 */ {
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
    break;
}
case 0xcb: /* AXS Immediate 2 */ {
    switch (this.t) {
        case 0: {
            this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.b = this.memory.getByte(this.ip);
            this.ip++;
            const res = (this.rA & this.rX) + 256 - this.b;
            this.rX = res & 0xff;
            this.flgNegative = (this.rX & 128) !== 0 ? 1 : 0;
            this.flgCarry = res > 255 ? 1 : 0;
            this.flgZero = this.rX === 0 ? 1 : 0;
            this.rX = this.b;
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x9c: /* SYA AbsoluteX 5 */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x9e: /* SXA AbsoluteY 5 */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x8b: /* XAA Immediate 2 */ {
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
    break;
}
case 0x93: /* AXA IndirectY 6 */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 5: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x9b: /* XAS AbsoluteY 5 */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0x9f: /* AXA AbsoluteY 5 */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
case 0xbb: /* LAR AbsoluteY 4pc  */ {
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
                this.addr = this.addr + (this.addrC << 8);
            } else {
                this.t = 0;
            }
            this.t++;
            break;
        }
        case 4: {
            this.b = this.memory.getByte(this.addr);
            this.t = 0;
            break;
        }
    }
    break;
}
}
        }
    }
