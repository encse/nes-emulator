var Most6502Base = (function () {
    function Most6502Base() {
    }
    Most6502Base.prototype.clk = function () {
        switch (this.opcode) {
            case 0x69: {
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
            case 0x65: {
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
            case 0x75: {
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
            case 0x6d: {
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x7d: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
                            var sum = this.rA + this.b + this.flgCarry;
                            var bothPositive = this.b < 128 && this.rA < 128;
                            var bothNegative = this.b >= 128 && this.rA >= 128;
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x79: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
                            var sum = this.rA + this.b + this.flgCarry;
                            var bothPositive = this.b < 128 && this.rA < 128;
                            var bothNegative = this.b >= 128 && this.rA >= 128;
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x61: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.b = this.memory.getByte(this.addr);
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x71: {
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
                        else {
                            var sum = this.rA + this.b + this.flgCarry;
                            var bothPositive = this.b < 128 && this.rA < 128;
                            var bothNegative = this.b >= 128 && this.rA >= 128;
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x29: {
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
            case 0x25: {
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
            case 0x35: {
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
            case 0x2d: {
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
            case 0x3d: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x39: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x21: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0x31: {
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
                        else {
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
            case 0xa: {
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
            case 0x6: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 0x80 ? 1 : 0;
                        this.b = (this.b << 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x16: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 0x80 ? 1 : 0;
                        this.b = (this.b << 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xe: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 0x80 ? 1 : 0;
                        this.b = (this.b << 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x1e: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 0x80 ? 1 : 0;
                        this.b = (this.b << 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x90: {
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
                        }
                        else {
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
                        }
                        else {
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
            case 0xb0: {
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
                        }
                        else {
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
                        }
                        else {
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
            case 0xf0: {
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
                        }
                        else {
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
                        }
                        else {
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
            case 0x30: {
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
                        }
                        else {
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
                        }
                        else {
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
            case 0xd0: {
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
                        }
                        else {
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
                        }
                        else {
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
            case 0x10: {
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
                        }
                        else {
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
                        }
                        else {
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
            case 0x50: {
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
                        }
                        else {
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
                        }
                        else {
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
            case 0x70: {
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
                        }
                        else {
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
                        }
                        else {
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
            case 0x24: {
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
            case 0x2c: {
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
            case 0x18: {
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
            case 0xd8: {
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
            case 0x58: {
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
            case 0xb8: {
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
            case 0xc9: {
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
                break;
            }
            case 0xc5: {
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
                break;
            }
            case 0xd5: {
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
                break;
            }
            case 0xcd: {
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
                        this.flgZero = this.rA === this.b ? 1 : 0;
                        this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xdd: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
                            this.flgCarry = this.rA >= this.b ? 1 : 0;
                            this.flgZero = this.rA === this.b ? 1 : 0;
                            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                            this.t = 0;
                        }
                        this.t++;
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
                break;
            }
            case 0xd9: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
                            this.flgCarry = this.rA >= this.b ? 1 : 0;
                            this.flgZero = this.rA === this.b ? 1 : 0;
                            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                            this.t = 0;
                        }
                        this.t++;
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
                break;
            }
            case 0xc1: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
                break;
            }
            case 0xd1: {
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
                        else {
                            this.flgCarry = this.rA >= this.b ? 1 : 0;
                            this.flgZero = this.rA === this.b ? 1 : 0;
                            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                            this.t = 0;
                        }
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
                break;
            }
            case 0xe0: {
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
                break;
            }
            case 0xe4: {
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
                break;
            }
            case 0xec: {
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
                        this.flgZero = this.rX === this.b ? 1 : 0;
                        this.flgNegative = (this.rX - this.b) & 128 ? 1 : 0;
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xc0: {
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
                break;
            }
            case 0xc4: {
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
                break;
            }
            case 0xcc: {
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
                        this.flgZero = this.rY === this.b ? 1 : 0;
                        this.flgNegative = (this.rY - this.b) & 128 ? 1 : 0;
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xc6: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b - 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xd6: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b - 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xce: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b - 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xde: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b - 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xca: {
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
            case 0x88: {
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
            case 0xe6: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b + 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xf6: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b + 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xee: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b + 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xfe: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b + 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xe8: {
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
            case 0xc8: {
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
            case 0x49: {
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
            case 0x45: {
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
            case 0x55: {
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
            case 0x4d: {
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
            case 0x5d: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x59: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x41: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0x51: {
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
                        else {
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
            case 0x4c: {
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
            case 0x6c: {
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
                break;
            }
            case 0xa9: {
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
            case 0xa5: {
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
            case 0xb5: {
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
            case 0xad: {
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
            case 0xbd: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0xb9: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0xa1: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0xb1: {
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
                        else {
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
            case 0xa2: {
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
            case 0xa6: {
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
            case 0xb6: {
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
            case 0xae: {
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
            case 0xbe: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0xa2: {
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
            case 0xa6: {
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
            case 0xb6: {
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
            case 0xae: {
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
            case 0xbe: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x4a: {
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
            case 0x46: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x56: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x4e: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x5e: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xea: {
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
            case 0x9: {
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
            case 0x5: {
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
            case 0x15: {
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
            case 0xd: {
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
            case 0x1d: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x19: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x1: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0x11: {
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
                        else {
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
            case 0x48: {
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
            case 0x8: {
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
            case 0x68: {
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
            case 0x28: {
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
            case 0x2a: {
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
            case 0x26: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b << 1) | this.flgCarry;
                        this.flgCarry = this.b & 0x100 ? 1 : 0;
                        this.b &= 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x36: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b << 1) | this.flgCarry;
                        this.flgCarry = this.b & 0x100 ? 1 : 0;
                        this.b &= 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x2e: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b << 1) | this.flgCarry;
                        this.flgCarry = this.b & 0x100 ? 1 : 0;
                        this.b &= 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x3e: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b << 1) | this.flgCarry;
                        this.flgCarry = this.b & 0x100 ? 1 : 0;
                        this.b &= 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x6a: {
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
            case 0x66: {
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
                        this.setByte(this.addr, this.b);
                        this.b |= this.flgCarry << 8;
                        this.flgCarry = this.b & 1 ? 1 : 0;
                        this.b >>= 1;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x76: {
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
                        this.setByte(this.addr, this.b);
                        this.b |= this.flgCarry << 8;
                        this.flgCarry = this.b & 1 ? 1 : 0;
                        this.b >>= 1;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x6e: {
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
                        this.setByte(this.addr, this.b);
                        this.b |= this.flgCarry << 8;
                        this.flgCarry = this.b & 1 ? 1 : 0;
                        this.b >>= 1;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x7e: {
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
                        this.setByte(this.addr, this.b);
                        this.b |= this.flgCarry << 8;
                        this.flgCarry = this.b & 1 ? 1 : 0;
                        this.b >>= 1;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x0: {
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
            case 0x40: {
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
            case 0xe9: {
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
            case 0xe5: {
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
            case 0xf5: {
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
            case 0xed: {
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xfd: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
                            this.b = 255 - this.b;
                            var sum = this.rA + this.b + this.flgCarry;
                            var bothPositive = this.b < 128 && this.rA < 128;
                            var bothNegative = this.b >= 128 && this.rA >= 128;
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xf9: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
                            this.b = 255 - this.b;
                            var sum = this.rA + this.b + this.flgCarry;
                            var bothPositive = this.b < 128 && this.rA < 128;
                            var bothNegative = this.b >= 128 && this.rA >= 128;
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xe1: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0xf1: {
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
                        else {
                            this.b = 255 - this.b;
                            var sum = this.rA + this.b + this.flgCarry;
                            var bothPositive = this.b < 128 && this.rA < 128;
                            var bothNegative = this.b >= 128 && this.rA >= 128;
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x18: {
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
            case 0xd8: {
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
            case 0x58: {
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
            case 0x85: {
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
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x95: {
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
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x8d: {
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
                        ;
                        this.ip++;
                        this.t++;
                        break;
                    }
                    case 3: {
                        this.b = this.rA;
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x9d: {
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
            case 0x99: {
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
            case 0x81: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0x91: {
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
            case 0x86: {
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
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x96: {
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
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x8e: {
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
                        ;
                        this.ip++;
                        this.t++;
                        break;
                    }
                    case 3: {
                        this.b = this.rX;
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x84: {
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
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x94: {
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
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x8c: {
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
                        ;
                        this.ip++;
                        this.t++;
                        break;
                    }
                    case 3: {
                        this.b = this.rY;
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xaa: {
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
            case 0xa8: {
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
            case 0xba: {
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
            case 0x8a: {
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
            case 0x9a: {
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
            case 0x98: {
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
            case 0x20: {
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
            case 0x60: {
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
            case 0x1a: {
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
            case 0x3a: {
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
            case 0x5a: {
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
            case 0x7a: {
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
            case 0xda: {
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
            case 0xfa: {
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
            case 0x4: {
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
            case 0x14: {
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
            case 0x34: {
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
            case 0x44: {
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
            case 0x54: {
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
            case 0x74: {
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
            case 0xd4: {
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
            case 0xf4: {
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
            case 0x64: {
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
            case 0x80: {
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
            case 0x82: {
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
            case 0xc2: {
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
            case 0xe2: {
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
            case 0x89: {
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
            case 0xc: {
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
            case 0x1c: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x3c: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x5c: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x7c: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0xdc: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0xfc: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0xc3: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
                break;
            }
            case 0xc7: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b - 1) & 0xff;
                        this.flgCarry = this.rA >= this.b ? 1 : 0;
                        this.flgZero = this.rA === this.b ? 1 : 0;
                        this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xcf: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b - 1) & 0xff;
                        this.flgCarry = this.rA >= this.b ? 1 : 0;
                        this.flgZero = this.rA === this.b ? 1 : 0;
                        this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xd3: {
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
                break;
            }
            case 0xd7: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b - 1) & 0xff;
                        this.flgCarry = this.rA >= this.b ? 1 : 0;
                        this.flgZero = this.rA === this.b ? 1 : 0;
                        this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xdb: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b - 1) & 0xff;
                        this.flgCarry = this.rA >= this.b ? 1 : 0;
                        this.flgZero = this.rA === this.b ? 1 : 0;
                        this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xdf: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b - 1) & 0xff;
                        this.flgCarry = this.rA >= this.b ? 1 : 0;
                        this.flgZero = this.rA === this.b ? 1 : 0;
                        this.flgNegative = (this.rA - this.b) & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xe3: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xe7: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b + 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
                        this.b = 255 - this.b;
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xef: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b + 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.b = 255 - this.b;
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xf3: {
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xf7: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b + 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        this.b = 255 - this.b;
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xfb: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b + 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.b = 255 - this.b;
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xff: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b + 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        this.b = 255 - this.b;
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0xab: {
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
            case 0xa7: {
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
            case 0xb7: {
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
            case 0xaf: {
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
            case 0xbf: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0xa3: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0xb3: {
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
                        else {
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
            case 0xab: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0xa7: {
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
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xaf: {
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
                        ;
                        this.ip++;
                        this.t++;
                        break;
                    }
                    case 3: {
                        this.b = this.rA & this.rX;
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0xbf: {
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
                        this.setByte(this.addr, this.b);
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x3: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0x7: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 0x80 ? 1 : 0;
                        this.b = (this.b << 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
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
            case 0xf: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 0x80 ? 1 : 0;
                        this.b = (this.b << 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
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
            case 0x13: {
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
            case 0x17: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 0x80 ? 1 : 0;
                        this.b = (this.b << 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
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
            case 0x1b: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 0x80 ? 1 : 0;
                        this.b = (this.b << 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
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
            case 0x1f: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 0x80 ? 1 : 0;
                        this.b = (this.b << 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
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
            case 0x23: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0x27: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b << 1) | this.flgCarry;
                        this.flgCarry = this.b & 0x100 ? 1 : 0;
                        this.b &= 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
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
            case 0x2f: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b << 1) | this.flgCarry;
                        this.flgCarry = this.b & 0x100 ? 1 : 0;
                        this.b &= 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
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
            case 0x33: {
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
            case 0x37: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b << 1) | this.flgCarry;
                        this.flgCarry = this.b & 0x100 ? 1 : 0;
                        this.b &= 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
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
            case 0x3b: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b << 1) | this.flgCarry;
                        this.flgCarry = this.b & 0x100 ? 1 : 0;
                        this.b &= 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
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
            case 0x3f: {
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
                        this.setByte(this.addr, this.b);
                        this.b = (this.b << 1) | this.flgCarry;
                        this.flgCarry = this.b & 0x100 ? 1 : 0;
                        this.b &= 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
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
            case 0x63: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x67: {
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
                        this.setByte(this.addr, this.b);
                        this.b |= this.flgCarry << 8;
                        this.flgCarry = this.b & 1 ? 1 : 0;
                        this.b >>= 1;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x6f: {
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
                        this.setByte(this.addr, this.b);
                        this.b |= this.flgCarry << 8;
                        this.flgCarry = this.b & 1 ? 1 : 0;
                        this.b >>= 1;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x73: {
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
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x77: {
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
                        this.setByte(this.addr, this.b);
                        this.b |= this.flgCarry << 8;
                        this.flgCarry = this.b & 1 ? 1 : 0;
                        this.b >>= 1;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x7b: {
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
                        this.setByte(this.addr, this.b);
                        this.b |= this.flgCarry << 8;
                        this.flgCarry = this.b & 1 ? 1 : 0;
                        this.b >>= 1;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x7f: {
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
                        this.setByte(this.addr, this.b);
                        this.b |= this.flgCarry << 8;
                        this.flgCarry = this.b & 1 ? 1 : 0;
                        this.b >>= 1;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
                        var sum = this.rA + this.b + this.flgCarry;
                        var bothPositive = this.b < 128 && this.rA < 128;
                        var bothNegative = this.b >= 128 && this.rA >= 128;
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
            case 0x43: {
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
                        ;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.addrHi = this.memory.getByte((this.addrPtr + 1) & 0xff);
                        this.addr = this.addrLo + (this.addrHi << 8);
                        ;
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
            case 0x47: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 4: {
                        this.setByte(this.addr, this.b);
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
            case 0x4f: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
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
            case 0x53: {
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
            case 0x57: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 5: {
                        this.setByte(this.addr, this.b);
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
            case 0x5b: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
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
            case 0x5f: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
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
            case 0x5f: {
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
                        this.setByte(this.addr, this.b);
                        this.flgCarry = this.b & 1;
                        this.b = (this.b >> 1) & 0xff;
                        this.flgZero = !this.b ? 1 : 0;
                        this.flgNegative = this.b & 0x80 ? 1 : 0;
                        this.t++;
                        break;
                    }
                    case 6: {
                        this.setByte(this.addr, this.b);
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
            case 0x5f: {
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
            case 0x5f: {
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
            case 0x5f: {
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
            case 0x5f: {
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
            case 0x5f: {
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
                        this.rX = res & 0xff;
                        this.flgNegative = (this.rX & 128) !== 0 ? 1 : 0;
                        ;
                        this.flgCarry = res > 255 ? 1 : 0;
                        this.flgZero = this.rX === 0 ? 1 : ;
                        ;
                        this.rX = this.b;
                        this.t = 0;
                        break;
                    }
                }
                break;
            }
            case 0x9c: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x9e: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x8b: {
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
            case 0x93: {
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
                        else {
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
            case 0x9b: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0x9f: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
            case 0xbb: {
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
                            this.addr = this.addr + (this.addrO << 8);
                        }
                        else {
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
    };
    return Most6502Base;
})();
