class Memory {
    memory: Int8Array = new Int8Array(65535);

    public getByte(addr: number): number {
        return this.memory[addr];
    }

    public getWord(addr: number): number {
        return this.memory[addr] + 256 * this.memory[addr + 1];
    }

    public setByte(addr: number, value: number): void {
        this.memory[addr] = value % 256;
    }

    public setWord(addr: number, value: number): void {
        this.memory[addr + 1] = (value >> 8) % 256;
        this.memory[addr] = value % 256;
    }
}


class Mos6502 {
    rA: number = 0;
    rX: number = 0;
    rY: number = 0;
    ip: number = 0;
    flgCarry: number = 0;
    flgZero: number = 0;
    flgInterruptDisable: number = 0;
    flgDecimalMode: number = 0;
    flgBreakCommand: number = 0;
    flgOverflow: number = 0;
    flgNegative: number = 0;
    memory: Memory;

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

        const sum = this.rA + b + this.flgCarry;
        const bothPositive = b < 128 && this.rA < 128;
        const bothNegative = b >= 128 && this.rA >= 128;

        this.flgCarry = sum > 255 ? 1 : 0;
        this.rA = sum % 256;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgOverflow = bothPositive && this.flgNegative || bothNegative && !this.flgNegative ? 1 : 0;
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
        this.ADC(255 - b);
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
    private EOR(byte: number): void {
        this.rA ^= byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    }


    /**
    *BIT - Bit Test

        A & M, N = M7, V = M6

        This instructions is used to test if one or more bits are set in a target memory location. The mask pattern in A is ANDed with the value in memory to set or clear the zero flag, but the result is not kept. Bits 7 and 6 of the value from memory are copied into the N and V flags.

        Processor Status after use:

        C	Carry Flag	Not affected
        Z	Zero Flag	Set if the result if the AND is zero
        I	Interrupt Disable	Not affected
        D	Decimal Mode Flag	Not affected
        B	Break Command	Not affected
        V	Overflow Flag	Set to bit 6 of the memory value
        N	Negative Flag	Set to bit 7 of the memory value

    */
    private BIT(byte: number): void {
        var res  = this.rA & byte;
        this.flgZero = res === 0 ? 1 : 0;
        this.flgNegative = res & 128 ? 1 : 0;
        this.flgOverflow = res & 64 ? 1 : 0;
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
    private BCC(sbyte: number): void {
        if (!this.flgCarry)
            this.ip += sbyte;
    }
  
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
    private BCS(sbyte: number): void {
        if (this.flgCarry)
            this.ip += sbyte;
    }

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
    private BEQ(sbyte: number): void {
        if (this.flgZero)
            this.ip += sbyte;
    }

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
    private BMI(sbyte: number): void {
        if (this.flgNegative)
            this.ip += sbyte;
    }   
    
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
    private BNE(sbyte: number): void {
        if (!this.flgZero)
            this.ip += sbyte;
    }    
    
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
    private BPL(sbyte: number): void {
        if (!this.flgNegative)
            this.ip += sbyte;
    }
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
    private BVC(sbyte: number): void {
        if (!this.flgOverflow)
            this.ip += sbyte;
    }

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
    private BVS(sbyte: number): void {
        if (this.flgOverflow)
            this.ip += sbyte;
    }

 
    private CLC(): void {
        this.flgCarry = 0;
    }
    private CLD(): void {
        this.flgDecimalMode = 0;
    }
    private CLI(): void {
        this.flgInterruptDisable= 0;
    }
    private CLO(): void {
        this.flgOverflow= 0;
    }

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
    private CMP(byte: number): void {
        this.flgCarry = this.rA >= byte ? 1 : 0;
        this.flgZero = this.rA === byte ? 1 : 0;
        this.flgNegative = this.rA < byte ? 1 : 0;
    }


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
    private CPX(byte: number): void {
        this.flgCarry = this.rX >= byte ? 1 : 0;
        this.flgZero = this.rX === byte ? 1 : 0;
        this.flgNegative = this.rX < byte ? 1 : 0;
    }


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
    private CPY(byte: number): void {
        this.flgCarry = this.rY >= byte ? 1 : 0;
        this.flgZero = this.rY === byte ? 1 : 0;
        this.flgNegative = this.rY < byte ? 1 : 0;
    }

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
    private DEC(addr: number): void {
        var byte = this.memory.getByte(addr);
        byte = byte === 0 ? 255 : byte - 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.memory.setByte(addr, byte);
    }

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
    private DEX(): void {
        this.rX = this.rX === 0 ? 255 : this.rX - 1;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    }

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
    private DEY(): void {
        this.rY = this.rY === 0 ? 255 : this.rY - 1;
        this.flgZero = this.rY === 0 ? 1 : 0;
        this.flgNegative = this.rY >= 128 ? 1 : 0;
    }

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
    private INC(addr: number): void {
        var byte = this.memory.getByte(addr);
        byte = byte === 255 ? 0 : byte + 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.memory.setByte(addr, byte);
    }

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
    private INX(): void {
        this.rX = this.rX === 255 ? 0 : this.rX + 1;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    }

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
    private INY(): void {
        this.rY = this.rY === 255 ? 0 : this.rY + 1;
        this.flgZero = this.rY === 0 ? 1 : 0;
        this.flgNegative = this.rY >= 128 ? 1 : 0;
    }
    private getSByteRelative(): number { var b = this.memory.getByte(this.ip + 1); return b >= 128 ? b - 256 : b; }

    private getByteImmediate(): number { return this.memory.getByte(this.ip + 1); }
    private getWordImmediate(): number { return this.memory.getWord(this.ip + 1); }

    private getAddrZeroPage(): number { return this.getByteImmediate(); }
    private getByteZeroPage(): number { return this.memory.getByte(this.getAddrZeroPage()); }
    private getWordZeroPage(): number { return this.memory.getWord(this.getAddrZeroPage()); }

    private getAddrZeroPageX(): number { return (this.rX + this.getByteImmediate()) % 256; }
    private getByteZeroPageX(): number { return this.memory.getByte(this.getAddrZeroPageX()); }
    private getWordZeroPageX(): number { return this.memory.getWord(this.getAddrZeroPageX()); }

    private getByteZeroPageY(): number { return this.memory.getByte((this.rY + this.getByteImmediate()) % 256); }
    private getWordZeroPageY(): number { return this.memory.getWord((this.rY + this.getByteImmediate()) % 256); }

    private getAddrAbsolute(): number { return this.getWordImmediate(); }
    private getByteAbsolute(): number { return this.memory.getByte(this.getAddrAbsolute()); }
    private getWordAbsolute(): number { return this.memory.getWord(this.getAddrAbsolute()); }

    private getAddrAbsoluteX(): number { return (this.rX + this.getWordImmediate()) % 65536; }
    private getByteAbsoluteX(): number { return this.memory.getByte(this.getAddrAbsoluteX()) }
    private getWordAbsoluteX(): number { return this.memory.getWord(this.getAddrAbsoluteX()) }

    private getByteAbsoluteY(): number { return this.memory.getByte((this.rY + this.getWordImmediate()) % 65536); }
    private getWordAbsoluteY(): number { return this.memory.getWord((this.rY + this.getWordImmediate()) % 65536); }

    private getByteIndirect(): number { return this.memory.getByte(this.memory.getWord(this.getWordImmediate())); }
    private getWordIndirect(): number { return this.memory.getWord(this.memory.getWord(this.getWordImmediate())); }
    private getWordIndirectWithxxFFBug(): number {
        /*
         The 6502's memory indirect jump instruction, JMP (<address>), is partially broken. 
         If <address> is hex xxFF (i.e., any word ending in FF), the processor will not jump to the address
         stored in xxFF and xxFF+1 as expected, but rather the one defined by xxFF and xx00 (for example,
         JMP ($10FF) would jump to the address stored in 10FF and 1000, instead of the one stored in 10FF and 1100).
         This defect continued through the entire NMOS line, but was corrected in the CMOS derivatives.
        */

        var addrLocation = this.getWordImmediate();
        var addr: number;
        if (addrLocation % 256 === 255)
            addr = this.memory.getByte(addrLocation) + 256 * this.memory.getByte( (addrLocation >> 8)  << 8 );
        else
            addr = this.memory.getWord(addrLocation); 
        return this.memory.getWord(addr);
    }

    private getByteIndirectX(): number { return this.memory.getByte(this.memory.getWord((this.getByteImmediate() + this.rX) % 256)); }
    private getWordIndirectX(): number { return this.memory.getWord(this.memory.getWord((this.getByteImmediate() + this.rX) % 256)); }

    private getByteIndirectY(): number { return this.memory.getByte((this.memory.getWord(this.getByteImmediate()) + this.rY) % 65536); }
    private getWordIndirectY(): number { return this.memory.getWord((this.memory.getWord(this.getByteImmediate()) + this.rY) % 65536); }

    public step() {
        switch (this.memory.getByte(this.ip)) {
            case 0x69: this.ADC(this.getByteImmediate()); this.ip += 2; break;
            case 0x65: this.ADC(this.getByteZeroPage()); this.ip += 2; break;
            case 0x75: this.ADC(this.getByteZeroPageX()); this.ip += 2; break;
            case 0x6d: this.ADC(this.getByteAbsolute()); this.ip += 3; break;
            case 0x7d: this.ADC(this.getByteAbsoluteX()); this.ip += 3; break;
            case 0x79: this.ADC(this.getByteAbsoluteY()); this.ip += 3; break;
            case 0x61: this.ADC(this.getByteIndirectX()); this.ip += 2; break;
            case 0x71: this.ADC(this.getByteIndirectY()); this.ip += 2; break;

            case 0xe9: this.SBC(this.getByteImmediate()); this.ip += 2; break;
            case 0xe5: this.SBC(this.getByteZeroPage()); this.ip += 2; break;
            case 0xf5: this.SBC(this.getByteZeroPageX()); this.ip += 2; break;
            case 0xed: this.SBC(this.getByteAbsolute()); this.ip += 3; break;
            case 0xfd: this.SBC(this.getByteAbsoluteX()); this.ip += 3; break;
            case 0xf9: this.SBC(this.getByteAbsoluteY()); this.ip += 3; break;
            case 0xe1: this.SBC(this.getByteIndirectX()); this.ip += 2; break;
            case 0xf1: this.SBC(this.getByteIndirectY()); this.ip += 2; break;

            case 0x29: this.AND(this.getByteImmediate()); this.ip += 2; break;
            case 0x25: this.AND(this.getByteZeroPage()); this.ip += 2; break;
            case 0x35: this.AND(this.getByteZeroPageX()); this.ip += 2; break;
            case 0x2D: this.AND(this.getByteAbsolute()); this.ip += 3; break;
            case 0x3D: this.AND(this.getByteAbsoluteX()); this.ip += 3; break;
            case 0x39: this.AND(this.getByteAbsoluteY()); this.ip += 3; break;
            case 0x21: this.AND(this.getByteIndirectX()); this.ip += 2; break;
            case 0x31: this.AND(this.getByteIndirectY()); this.ip += 2; break;

            case 0x0a: this.ASL(this.rA); this.ip += 1; break;
            case 0x06: this.ASL(this.getByteZeroPage()); this.ip += 2; break;
            case 0x0e: this.ASL(this.getByteAbsolute()); this.ip += 3; break;
            case 0x1e: this.ASL(this.getByteAbsoluteX()); this.ip += 3; break;

            case 0x90: this.BCC(this.getSByteRelative()); this.ip += 2; break;
            case 0xb0: this.BCS(this.getSByteRelative()); this.ip += 2; break;
            case 0xf0: this.BEQ(this.getSByteRelative()); this.ip += 2; break;
            case 0x30: this.BMI(this.getSByteRelative()); this.ip += 2; break;
            case 0xd0: this.BNE(this.getSByteRelative()); this.ip += 2; break;
            case 0x10: this.BPL(this.getSByteRelative()); this.ip += 2; break;
            case 0x50: this.BVC(this.getSByteRelative()); this.ip += 2; break;
            case 0x70: this.BVS(this.getSByteRelative()); this.ip += 2; break;

            case 0x18: this.CLC(); this.ip += 1; break;
            case 0xd8: this.CLD(); this.ip += 1; break;
            case 0x58: this.CLI(); this.ip += 1; break;
            case 0xb8: this.CLO(); this.ip += 1; break;

            case 0xc9: this.CMP(this.getByteImmediate()); this.ip += 2; break;
            case 0xc5: this.CMP(this.getByteZeroPage()); this.ip += 2; break;
            case 0xd5: this.CMP(this.getByteZeroPageX()); this.ip += 2; break;
            case 0xcd: this.CMP(this.getByteAbsolute()); this.ip += 3; break;
            case 0xdd: this.CMP(this.getByteAbsoluteX()); this.ip += 3; break;
            case 0xd9: this.CMP(this.getByteAbsoluteY()); this.ip += 3; break;
            case 0xc1: this.CMP(this.getByteIndirectX()); this.ip += 2; break;
            case 0xd1: this.CMP(this.getByteIndirectY()); this.ip += 2; break;

            case 0xe0: this.CPX(this.getByteImmediate()); this.ip += 2; break;
            case 0xe4: this.CPX(this.getByteZeroPage()); this.ip += 2; break;
            case 0xec: this.CPX(this.getByteAbsolute()); this.ip += 3; break;
            
            case 0xc0: this.CPY(this.getByteImmediate()); this.ip += 2; break;
            case 0xc4: this.CPY(this.getByteZeroPage()); this.ip += 2; break;
            case 0xcc: this.CPY(this.getByteAbsolute()); this.ip += 3; break;

            case 0xc6: this.DEC(this.getAddrZeroPage()); this.ip += 2; break;
            case 0xd6: this.DEC(this.getAddrZeroPageX()); this.ip += 2; break;
            case 0xce: this.DEC(this.getAddrAbsolute()); this.ip += 3; break;
            case 0xde: this.DEC(this.getAddrAbsoluteX()); this.ip += 3; break;
            case 0xca: this.DEX(); this.ip += 1; break;
            case 0x88: this.DEY(); this.ip += 1; break;

            case 0xe6: this.INC(this.getAddrZeroPage()); this.ip += 2; break;
            case 0xf6: this.INC(this.getAddrZeroPageX()); this.ip += 2; break;
            case 0xee: this.INC(this.getAddrAbsolute()); this.ip += 3; break;
            case 0xfe: this.INC(this.getAddrAbsoluteX()); this.ip += 3; break;
            case 0xe8: this.INX(); this.ip += 1; break;
            case 0xc8: this.INY(); this.ip += 1; break;

            case 0x49: this.EOR(this.getByteImmediate()); this.ip += 2; break;
            case 0x45: this.EOR(this.getByteZeroPage()); this.ip += 2; break;
            case 0x55: this.EOR(this.getByteZeroPageX()); this.ip += 2; break;
            case 0x4D: this.EOR(this.getByteAbsolute()); this.ip += 3; break;
            case 0x5D: this.EOR(this.getByteAbsoluteX()); this.ip += 3; break;
            case 0x59: this.EOR(this.getByteAbsoluteY()); this.ip += 3; break;
            case 0x41: this.EOR(this.getByteIndirectX()); this.ip += 2; break;
            case 0x51: this.EOR(this.getByteIndirectY()); this.ip += 2; break;

            case 0x24: this.BIT(this.getByteZeroPage()); this.ip += 2; break;
            case 0x2c: this.BIT(this.getByteAbsolute()); this.ip += 3; break;
         
            case 0x4c: this.ip = this.getWordAbsolute(); break;
            case 0x6c: this.ip = this.getWordIndirectWithxxFFBug(); break;
            //BIT - Bit Test
            //BRK - Force Interrupt
        }
    }
}