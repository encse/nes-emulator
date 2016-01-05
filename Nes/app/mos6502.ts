class Memory {
    memory: Int8Array = new Int8Array(65535);

    public getByte(addr:number): number {
        return this.memory[addr];
    }

    public getWord(addr: number): number {
        return 256 * this.memory[addr] + this.memory[addr + 1];
    }

    public setByte(addr: number, value:number):void{
        this.memory[addr] = value % 256;
    }

    public setWord(addr: number, value: number): void {
        this.memory[addr] = (value / 256) % 256;
        this.memory[addr + 1] = value % 256;
    }
}


class Mos6502 {
    rI: number = 0;
    rA: number = 0;
    rX: number = 0;
    rY: number = 0;
    ip: number = 0;
    flgCarry:number=0;
    flgZero:number=0;
    flgInterruptDisable:number=0;
    flgDecimalMode:number=0;
    flgBreakCommand:number=0;
    flgOverflow:number=0;
    flgNegative:number=0;
    memory:Memory;

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
    private ADC(b: number): void {

        const uSum = this.rA + b + this.flgCarry;
        const sSum = (this.rA >= 128 ? this.rA - 256 : this.rA) + (b >= 128 ? b - 256 : b) + this.flgCarry;
        this.flgOverflow = sSum < -128 || sSum > 127 ? 1 : 0;
        this.flgCarry = uSum > 255 ? 1 : 0;
        this.rA = (uSum + 256)  % 256;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
        this.flgZero = this.rA === 0 ? 1 : 0;
    }

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
    private SBC(b: number): void {

        const uSub = this.rA - b + this.flgCarry - 1;
        const sSub = (this.rA >= 128 ? this.rA - 256 : this.rA) - (b >= 128 ? b - 256 : b) + this.flgCarry - 1;
        this.flgOverflow = sSub < -128 || sSub > 127 ? 1 : 0;
        this.flgCarry = this.rA >= b ? 1 : 0;
        this.rA = (uSub + 256) % 256;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
        this.flgZero = this.rA === 0 ? 1 : 0;
    }
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
    private AND(byte: number): void {
        this.rA &= byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    }

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
    private ASL(byte: number): void {
        this.rA = byte << 1;
        this.flgCarry = this.rA > 255 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
        this.rA %= 256;
        this.flgZero = this.rA === 0 ? 1 : 0;
    }

    private getByteImmediate(): number { return this.memory.getByte(this.ip + 1);}
    private getWordImmediate(): number { return this.memory.getWord(this.ip + 1); }

    private getByteZeroPage():number { return this.memory.getByte(this.getByteImmediate());}
    private getWordZeroPage(): number { return this.memory.getWord(this.getByteImmediate());}

    private getByteZeroPageX(): number { return this.memory.getByte((this.rX + this.getByteImmediate()) % 256); }
    private getWordZeroPageX(): number { return this.memory.getWord((this.rX + this.getByteImmediate()) % 256);}

    private getByteZeroPageY(): number { return this.memory.getByte((this.rY + this.getByteImmediate()) % 256); }
    private getWordZeroPageY(): number { return this.memory.getWord((this.rY + this.getByteImmediate()) % 256);}

    private getByteAbsolute(): number { return this.memory.getByte(this.getWordImmediate());}
    private getWordAbsolute(): number { return this.memory.getWord(this.getWordImmediate());}
    private getByteAbsoluteX(): number { return this.memory.getByte((this.rX + this.getWordImmediate()) % 65536) }
    private getWordAbsoluteX(): number { return this.memory.getWord((this.rX + this.getWordImmediate()) % 65536)}
    private getByteAbsoluteY(): number { return this.memory.getByte((this.rY + this.getWordImmediate()) % 65536);}
    private getWordAbsoluteY(): number { return this.memory.getWord((this.rY + this.getWordImmediate()) % 65536);}

    private getByteIndirect(): number { return this.memory.getByte(this.memory.getWord(this.getWordImmediate())); }
    private getWordIndirect(): number { return this.memory.getWord(this.memory.getWord(this.getWordImmediate()));}

    private getByteIndirectX(): number { return this.memory.getByte(this.memory.getWord((this.getByteImmediate() + this.rX) % 256)); }
    private getWordIndirectX(): number { return this.memory.getWord(this.memory.getWord((this.getByteImmediate() + this.rX) % 256));}

    private getByteIndirectY(): number { return this.memory.getByte((this.memory.getWord(this.getByteImmediate()) + this.rY) % 65536); }
    private getWordIndirectY(): number { return this.memory.getWord((this.memory.getWord(this.getByteImmediate()) + this.rY) % 65536); }

    public step() {
        switch (this.memory.getByte(this.ip)) {
            case 0x69: this.ADC(this.getByteImmediate()); this.ip += 2; break;
            case 0x65: this.ADC(this.getByteZeroPage());  this.ip += 2; break;
            case 0x75: this.ADC(this.getByteZeroPageX()); this.ip += 2; break;
            case 0x6d: this.ADC(this.getByteAbsolute());  this.ip += 3; break;
            case 0x7d: this.ADC(this.getByteAbsoluteX()); this.ip += 3; break;
            case 0x79: this.ADC(this.getByteAbsoluteY()); this.ip += 3; break;
            case 0x61: this.ADC(this.getByteIndirectX()); this.ip += 2; break;
            case 0x71: this.ADC(this.getByteIndirectY()); this.ip += 2; break;

            case 0xe9: this.SBC(this.getByteImmediate()); this.ip += 2; break;
            case 0xe5: this.SBC(this.getByteZeroPage());  this.ip += 2; break;
            case 0xf5: this.SBC(this.getByteZeroPageX()); this.ip += 2; break;
            case 0xed: this.SBC(this.getByteAbsolute());  this.ip += 3; break;
            case 0xfd: this.SBC(this.getByteAbsoluteX()); this.ip += 3; break;
            case 0xf9: this.SBC(this.getByteAbsoluteY()); this.ip += 3; break;
            case 0xe1: this.SBC(this.getByteIndirectX()); this.ip += 2; break;
            case 0xf1: this.SBC(this.getByteIndirectY()); this.ip += 2; break;

            case 0x29: this.AND(this.getByteImmediate()); this.ip += 2; break;
            case 0x25: this.AND(this.getByteZeroPage());  this.ip += 2; break;
            case 0x35: this.AND(this.getByteZeroPageX()); this.ip += 2; break;
            case 0x2D: this.AND(this.getByteAbsolute());  this.ip += 3; break;
            case 0x3D: this.AND(this.getByteAbsoluteX()); this.ip += 3; break;
            case 0x39: this.AND(this.getByteAbsoluteY()); this.ip += 3; break;
            case 0x21: this.AND(this.getByteIndirectX()); this.ip += 2; break;
            case 0x31: this.AND(this.getByteIndirectY()); this.ip += 2; break;

            case 0x0a: this.ASL(this.rA); this.ip += 1; break;
            case 0x06: this.ASL(this.getByteZeroPage()); this.ip += 2; break;
            case 0x0e: this.ASL(this.getByteAbsolute()); this.ip += 3; break;
            case 0x1e: this.ASL(this.getByteAbsoluteX()); this.ip += 3; break;

        }
    }
}