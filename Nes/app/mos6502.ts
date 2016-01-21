///<reference path="Memory.ts"/>

class Mos6502 {
    t: number = 0;
    tLim: number = 0;

    private addrRA: number = -1;

    rA: number = 0;
    rX: number = 0;
    rY: number = 0;

    public ip: number;
    public sp: number;

    public addrReset = 0xfffc;
    public addrIRQ = 0xfffe;
    public addrNMI = 0xfffa;
 
    private flgCarry: number = 0;
    private flgZero: number = 0;
    private flgInterruptDisable: number = 0;

    //private get flgInterruptDisable() {
    //    return this._flgInterruptDisable;
    //}


    //private set flgInterruptDisable(v) {
    //    //console.log('flgInterruptDisable', v);
    //    this._flgInterruptDisable = v;
    //}


    number = 0;
    private flgDecimalMode: number = 0;
    private flgBreakCommand: number = 0;
    private flgOverflow: number = 0;
    private flgNegative: number = 0;

    public nmiLine = 1;
    private nmiLinePrev = 1;
    private nmiDetected: boolean;
    private nmiRequested: boolean;

    private irqRequested: boolean = false;
    public irqLine = 1;
    private irqDetected: boolean;

    private PollInterrupts() {
        if (this.nmiDetected) {
            this.nmiRequested = true;
            this.nmiDetected = false
        }
        if (this.irqDetected) {
            console.log('irq requested');
            this.irqRequested = true;
        }
    }

    private DetectInterrupts() {

        if (this.nmiLinePrev === 1 && this.nmiLine === 0) {
            this.nmiDetected = true;
        }
        this.nmiLinePrev = this.nmiLine;
        this.irqDetected = this.irqLine === 0;
    }

    public Reset() {
        this.ip = this.getWord(this.addrReset);
        this.sp = 0xfd;
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

    public constructor(public memory:Memory) {
        
    }

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

    private ISC(addr: number): void {
        this.SBC(this.INC(addr));
    }


    private SLO(addr: number): void {
        this.ORA(this.ASL(addr));
    }

    private RLA(addr: number): void {
        this.AND(this.ROL(addr));
    }

    private SRE(addr: number): void {
        this.EOR(this.LSR(addr));
    }

    private RRA(addr: number): void {
        this.ADC(this.ROR(addr));
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
    private BIT(byte: number): void {
        var res  = this.rA & byte;
        this.flgZero = res === 0 ? 1 : 0;
        this.flgNegative = byte & 128 ? 1 : 0;
        this.flgOverflow = byte & 64 ? 1 : 0;
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
    private ASL(addr: number): number {
        var byte = this.getByte(addr);
        var res = byte << 1;
        this.flgCarry = res > 255 ? 1 : 0;
        res &= 0xff;
        this.flgZero = res === 0 ? 1 : 0;
        this.flgNegative = res & 128 ? 1 : 0;

        this.setByte(addr, res);
        return res;
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
        if (!this.flgCarry) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
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
        if (this.flgCarry) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
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
        if (this.flgZero) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
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
        if (this.flgNegative) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
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
        if (!this.flgZero) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
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
        if (!this.flgNegative) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
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
        if (!this.flgOverflow) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
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
        if (this.flgOverflow) {
            this.setJmpFlags(sbyte);
            this.ip += sbyte;
        }
    }

 
    private CLC(): void {
        this.flgCarry = 0;
    }
    private CLD(): void {
        this.flgDecimalMode = 0;
    }
    private CLI(): void {
        console.log('$' + this.ip.toString(16),'CLI');
        this.flgInterruptDisable= 0;
    }
    private SEI(): void {
        console.log('$' + this.ip.toString(16), 'SEI');
        this.flgInterruptDisable = 1;
    }
    private CLV(): void {
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
        this.flgNegative = (this.rA - byte) & 128 ? 1 : 0;
    }

    private DCP(addr: number): void {
        var byte = this.getByte(addr);
        byte = byte === 0 ? 255 : byte - 1;
        this.setByte(addr, byte);

        this.flgCarry = this.rA >= byte ? 1 : 0;
        this.flgZero = this.rA === byte ? 1 : 0;
        this.flgNegative = (this.rA - byte) & 128 ? 1 : 0;

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
        this.flgNegative = (this.rX - byte) & 128 ? 1 : 0;
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
        this.flgNegative = (this.rY - byte) & 128 ? 1 : 0;
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
        var byte = this.getByte(addr);
        byte = byte === 0 ? 255 : byte - 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
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
    private INC(addr: number): number {
        var byte = this.getByte(addr);
        byte = byte === 255 ? 0 : byte + 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
        return byte;
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

    private LDA(byte:number): void {
        this.rA = byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    }

    private LAX(byte: number): void {
        this.rA = byte;
        this.rX = byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    }

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

    private LDX(byte: number): void {
        this.rX = byte;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    }

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
    private LDY(byte: number): void {
        this.rY = byte;
        this.flgZero = this.rY === 0 ? 1 : 0;
        this.flgNegative = this.rY >= 128 ? 1 : 0;
    }


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
    private LSR(addr: number): number {
        var byte = this.getByte(addr);
        this.flgCarry = byte % 2;
        byte >>= 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
        return byte;
    }
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
    private ORA(byte: number): void {
        this.rA |= byte;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    }

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
    private ROL(addr: number): number {
        var byte = this.getByte(addr);
        byte <<= 1;
        byte |= this.flgCarry;
        this.flgCarry = (byte & 256) === 256 ? 1 : 0;
        byte &= 255;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
        return byte;
    }

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
    private ROR(addr: number): number {
        var byte = this.getByte(addr);
        byte |= (this.flgCarry << 8);
        this.flgCarry = byte & 1;
        byte >>= 1;
        this.flgZero = byte === 0 ? 1 : 0;
        this.flgNegative = byte >= 128 ? 1 : 0;
        this.setByte(addr, byte);
        return byte;
    }



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

    private STA(addr: number): void {
        this.setByte(addr, this.rA);
    }
    private STX(addr: number): void {
        this.setByte(addr, this.rX);
    }
    private STY(addr: number): void {
        this.setByte(addr, this.rY);
    }

    private SAX(addr: number): void {
        this.setByte(addr, this.rX & this.rA);
    }

    private TAX(): void {
        this.rX = this.rA;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    }
    private TAY(): void {
        this.rY = this.rA;
        this.flgZero = this.rY === 0 ? 1 : 0;
        this.flgNegative = this.rY >= 128 ? 1 : 0;
    }
    private TSX(): void {
        this.rX = this.sp;
        this.flgZero = this.rX === 0 ? 1 : 0;
        this.flgNegative = this.rX >= 128 ? 1 : 0;
    }
    private TXA(): void {
        this.rA = this.rX;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    }
    private TXS(): void {
        this.sp = this.rX;
    }
    private TYA(): void {
        this.rA = this.rY;
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    }

    /*JSR - Jump to Subroutine
        The JSR instruction pushes the address (minus one) of the return point on to the stack and then sets the program counter to the target memory address.
     */
    private JSR(addr: number): void {
        console.log('$' + this.ip.toString(16), 'JSR');
        this.pushWord(this.ip + 3 - 1);
        this.ip = addr;
    }

    /**
     * RTS - Return from Subroutine
        The RTS instruction is used at the end of a subroutine to return to the calling routine. It pulls the program counter (minus one) from the stack.
     */
    private RTS(): void {
        console.log('$'+this.ip.toString(16), 'RTS');
        this.ip = this.popWord() + 1;
    }

    /**
         PHA - Push Accumulator

        Pushes a copy of the accumulator on to the stack. 
     */
    private PHA(): void {
        this.pushByte(this.rA);
    }


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
    private PLA(): void {
        this.rA = this.popByte();
        this.flgZero = this.rA === 0 ? 1 : 0;
        this.flgNegative = this.rA >= 128 ? 1 : 0;
    }

    /**
       PHP - Push Processor Status

        Pushes a copy of the status flags on to the stack. 
   */
    private PHP(): void {
        this.flgBreakCommand = 1;
        this.pushByte(this.rP);
        this.flgBreakCommand = 0;
    }


    /**
      PLP - Pull Processor Status

        Pulls an 8 bit value from the stack and into the processor flags. 
        The flags will take on new states as determined by the value pulled.

   */
    private PLP(): void {
        var v = this.popByte();
        this.rP = v;
        console.log('plp', 'irq dsiabled:', this.flgInterruptDisable, 'v:', v.toString(2));
        
    }


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
    private BRK(): void {
        console.log('process BRK');
        this.pushWord(this.ip + 2);
        this.flgBreakCommand = 1;
        this.PHP();
        this.flgInterruptDisable = 1;
        this.ip = this.getWord(this.addrIRQ);
    }

    private NMI(): void {
       // console.log('process NMI');

        this.pushWord(this.ip);
        this.pushByte(this.rP);
        this.flgInterruptDisable = 1;
        this.ip = this.getWord(this.addrNMI);
    }

    private IRQ(): void {
        if (!this.irqRequested)
            console.log('wtf');
        console.log('process irq');
       

        this.pushWord(this.ip);
        this.pushByte(this.rP);
        this.flgInterruptDisable = 1;
        this.ip = this.getWord(this.addrIRQ);
    }

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
    private RTI(): void {
        console.log('rti');
        this.PLP();
        this.ip = this.popWord();
    }

    private ALR(byte: number): void {
        //ALR #i($4B ii; 2 cycles)
        //Equivalent to AND #i then LSR A.
        this.AND(byte);
        this.LSR(this.addrRA);
    }

    private ANC(byte: number): void {
        //Does AND #i, setting N and Z flags based on the result. 
        //Then it copies N (bit 7) to C.ANC #$FF could be useful for sign- extending, much like CMP #$80.ANC #$00 acts like LDA #$00 followed by CLC.
        this.AND(byte);
        this.flgCarry = this.flgNegative;
    }

    private ARR(byte: number): void {
        //Similar to AND #i then ROR A, except sets the flags differently. N and Z are normal, but C is bit 6 and V is bit 6 xor bit 5.
        this.AND(byte);
        this.ROR(this.addrRA);
        this.flgCarry = (this.rA & (1 << 6)) !== 0 ? 1 : 0;
        this.flgOverflow = ((this.rA & (1 << 6)) >> 6) ^ ((this.rA & (1 << 5)) >> 5);
    }

    private AXS(byte: number): void {
       // Sets X to {(A AND X) - #value without borrow}, and updates NZC. 
        const res = (this.rA & this.rX) + 256 - byte;
        this.rX =  res & 0xff;
        this.flgNegative = (this.rX & 128) !== 0 ? 1 : 0;
        this.flgCarry = res > 255 ? 1 : 0;
        this.flgZero = this.rX === 0 ? 1 : 0;
    }

    private SYA(addr: number): void {
        //not implemented
    }

    private SXA(addr: number): void {
       //not implemented
    }
    private XAA(byte: number): void {
        //not implemented
    }

    private AXA(byte: number): void {
        //not implemented
    }
    private XAS(byte: number): void {
        //not implemented
    }
    private LAR(byte: number): void {
        //not implemented
    }


    private getByte(addr: number) {
        if (addr === this.addrRA)
            return this.rA;
        else
            return this.memory.getByte(addr);
    }

    private setByte(addr: number, byte: number) {
        if (addr === this.addrRA)
            this.rA = byte;
        else
            this.memory.setByte(addr, byte);
    }

    private getWord(addr: number): number {
        return this.memory.getByte(addr) + 256 * this.memory.getByte(addr + 1);
    }

    private getSByteRelative(): number { var b = this.memory.getByte(this.ip + 1); return b >= 128 ? b - 256 : b; }

    private getByteImmediate(): number { return this.memory.getByte(this.ip + 1); }
    private getWordImmediate(): number {
        //if ((this.ip & 0xff) === 0xff)
        //    this.pageCross = 1;

         return this.getWord(this.ip + 1);
    }

    private getAddrZeroPage(): number { return this.getByteImmediate(); }
    private getByteZeroPage(): number { return this.memory.getByte(this.getAddrZeroPage()); }
    private getWordZeroPage(): number { return this.getWord(this.getAddrZeroPage()); }

    private getAddrZeroPageX(): number { return (this.rX + this.getByteImmediate()) & 0xff; }
    private getByteZeroPageX(): number { return this.memory.getByte(this.getAddrZeroPageX()); }
    private getWordZeroPageX(): number { return this.getWord(this.getAddrZeroPageX()); }

    private getAddrZeroPageY(): number { return (this.rY + this.getByteImmediate()) & 0xff; }
    private getByteZeroPageY(): number { return this.memory.getByte(this.getAddrZeroPageY()); }
    private getWordZeroPageY(): number { return this.getWord(this.getAddrZeroPageY()); }

    private getAddrAbsolute(): number { return this.getWordImmediate(); }
    private getByteAbsolute(): number { return this.memory.getByte(this.getAddrAbsolute()); }
    private getWordAbsolute(): number { return this.getWord(this.getAddrAbsolute()); }

    private getAddrAbsoluteX(): number {
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
    }
    private getByteAbsoluteX(): number { return this.memory.getByte(this.getAddrAbsoluteX()); }
    private getWordAbsoluteX(): number { return this.getWord(this.getAddrAbsoluteX()) }

    private getAddrAbsoluteY(): number {

        var w = this.getWordImmediate();
        var addr = (this.rY + w) & 0xffff;
        if (this.rY + (w & 0xff) > 0xff)
            this.pageCross = 1;

        return addr;
    }
    private getByteAbsoluteY(): number { return this.memory.getByte(this.getAddrAbsoluteY()); }
    private getWordAbsoluteY(): number { return this.getWord(this.getAddrAbsoluteY()); }

    private getWordIndirect(): number { 
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
    }

    private getAddrIndirectX(): number {

        //The 6502's Indirect-Indexed-X ((Ind,X)) addressing mode is also partially broken 
        //if the zero- page address was hex FF (i.e.last address of zero- page FF), again a case of address wrap.
        var addrLo: number = (this.getByteImmediate() + this.rX) & 0xff;
        var addrHi: number = (addrLo + 1) & 0xff;
        return this.memory.getByte(addrLo) + 256 * this.memory.getByte(addrHi);
    }
    private getByteIndirectX(): number { return this.memory.getByte(this.getAddrIndirectX()); }
    private getWordIndirectX(): number { return this.getWord(this.getAddrIndirectX()); }


    private getAddrIndirectY(): number {
        
        //The 6502's Indirect-Indexed-Y ((Ind),Y) addressing mode is also partially broken.
        //If the zero- page address was hex FF (i.e.last address of zero- page FF), the processor 
        //would not fetch data from the address pointed to by 00FF and 0100 + Y, but rather the one in 00FF and 0000 + Y.
        //This defect continued through the entire NMOS line, but was fixed in some of the CMOS derivatives.
        
        var addrLo: number = this.getByteImmediate() & 0xff;
        var addrHi: number = (addrLo + 1) & 0xff;

        if (addrLo + this.rY > 0xff)
            this.pageCross = 1;

        return (this.memory.getByte(addrLo) + 256 * this.memory.getByte(addrHi) + this.rY) & 0xffff;
    }
    private getByteIndirectY(): number { return this.memory.getByte(this.getAddrIndirectY()); }
    private getWordIndirectY(): number { return this.getWord(this.getAddrIndirectY()); }

    private pushByte(byte: number) {
        this.memory.setByte(0x100 + this.sp, byte & 0xff);
        this.sp = this.sp === 0 ? 0xff : this.sp - 1;
    }

    private popByte():number{
        this.sp = this.sp === 0xff ? 0 : this.sp + 1;
        return this.memory.getByte(0x100 + this.sp);
    }

    private pushWord(word: number) {
        this.pushByte((word >> 8) & 0xff);
        this.pushByte(word & 0xff);
    }

    private popWord() {
        return this.popByte() + (this.popByte() << 8);
    }

    private pageCross = 0;
    private jumpSucceed = 0;
    private jumpToNewPage = 0;

    private setJmpFlags(sbyte) {
        this.jumpSucceed = 1;

        var addrDstLow = (this.ip & 0xff) + sbyte + 2; // +2 because we increment the IP with 2 anyway
        this.jumpToNewPage = addrDstLow < 0 || addrDstLow > 0xff ? 1 : 0;
    }

    public step() {

        if (this.t === this.tLim - 1)
            this.PollInterrupts();

        if (this.t === this.tLim)
            this.t = 0;

        if (this.t === 0) {
            const nmiWasRequested = this.nmiRequested;
            const irqWasRequested = this.irqRequested;
            this.irqRequested = false;
            this.nmiRequested = false;

            if (nmiWasRequested) {
                this.NMI();
                
                this.t = this.tLim = 0;
                return;
            }
            if (irqWasRequested && !this.flgInterruptDisable) {
                this.IRQ();
                this.t = this.tLim = 0;
                return;
            }

            //if (irqWasRequested && this.flgInterruptDisable) {
            //    console.log('flgInterruptDisable');
            //}
        }
     
        this.processInstruction();
        this.DetectInterrupts();
        this.t++;
    }

    currentOpcode : number;
    processInstruction() {
        this.pageCross = this.jumpSucceed = this.jumpToNewPage = 0;
        var ipPrev = this.ip;

        if (this.t === 0)
            this.currentOpcode = this.memory.getByte(this.ip);

        switch (this.currentOpcode) {
            case 0x69: if(this.t === 0) {this.ADC(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break; 
            case 0x65: if(this.t === 0) {this.ADC(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0x75: if(this.t === 0) {this.ADC(this.getByteZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0x6d: if(this.t === 0) {this.ADC(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0x7d: if(this.t === 0) {this.ADC(this.getByteAbsoluteX()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x79: if(this.t === 0) {this.ADC(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x61: if(this.t === 0) {this.ADC(this.getByteIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0x71: if(this.t === 0) {this.ADC(this.getByteIndirectY()); this.ip += 2; this.tLim = 5 + this.pageCross;} break;

            case 0x29: if(this.t === 0) {this.AND(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0x25: if(this.t === 0) {this.AND(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0x35: if(this.t === 0) {this.AND(this.getByteZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0x2D: if(this.t === 0) {this.AND(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0x3D: if(this.t === 0) {this.AND(this.getByteAbsoluteX()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x39: if(this.t === 0) {this.AND(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x21: if(this.t === 0) {this.AND(this.getByteIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0x31: if(this.t === 0) {this.AND(this.getByteIndirectY()); this.ip += 2; this.tLim = 5 + this.pageCross;} break;

            case 0x0a: if(this.t === 0) {this.ASL(this.addrRA); this.ip += 1; this.tLim = 2;} break;
            case 0x06: if(this.t === 0) {this.ASL(this.getAddrZeroPage()); this.ip += 2; this.tLim = 5;} break;
            case 0x16: if(this.t === 0) {this.ASL(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0x0e: if(this.t === 0) {this.ASL(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0x1e: if(this.t === 0) {this.ASL(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0x90: if(this.t === 0) {this.BCC(this.getSByteRelative()); this.ip += 2; this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;} break;
            case 0xb0: if(this.t === 0) {this.BCS(this.getSByteRelative()); this.ip += 2; this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;} break;
            case 0xf0: if(this.t === 0) {this.BEQ(this.getSByteRelative()); this.ip += 2; this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;} break;
            case 0x30: if(this.t === 0) {this.BMI(this.getSByteRelative()); this.ip += 2; this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;} break;
            case 0xd0: if(this.t === 0) {this.BNE(this.getSByteRelative()); this.ip += 2; this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;} break;
            case 0x10: if(this.t === 0) {this.BPL(this.getSByteRelative()); this.ip += 2; this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;} break;
            case 0x50: if(this.t === 0) {this.BVC(this.getSByteRelative()); this.ip += 2; this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;} break;
            case 0x70: if(this.t === 0) {this.BVS(this.getSByteRelative()); this.ip += 2; this.tLim = 2 + this.jumpSucceed + this.jumpToNewPage;} break;

            case 0x24: if(this.t === 0) {this.BIT(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0x2c: if(this.t === 0) {this.BIT(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;

            case 0x18: if(this.t === 0) {this.CLC(); this.ip += 1; this.tLim = 2;} break;
            case 0xd8: if(this.t === 0) {this.CLD(); this.ip += 1; this.tLim = 2;} break;
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
            case 0xb8: if(this.t === 0) {this.CLV(); this.ip += 1; this.tLim = 2;} break;

            case 0xc9: if(this.t === 0) {this.CMP(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xc5: if(this.t === 0) {this.CMP(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0xd5: if(this.t === 0) {this.CMP(this.getByteZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0xcd: if(this.t === 0) {this.CMP(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0xdd: if(this.t === 0) {this.CMP(this.getByteAbsoluteX()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xd9: if(this.t === 0) {this.CMP(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xc1: if(this.t === 0) {this.CMP(this.getByteIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0xd1: if(this.t === 0) {this.CMP(this.getByteIndirectY()); this.ip += 2; this.tLim = 5 + this.pageCross;} break;

            case 0xe0: if(this.t === 0) {this.CPX(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xe4: if(this.t === 0) {this.CPX(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0xec: if(this.t === 0) {this.CPX(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;

            case 0xc0: if(this.t === 0) {this.CPY(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xc4: if(this.t === 0) {this.CPY(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0xcc: if(this.t === 0) {this.CPY(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;

            case 0xc6: if(this.t === 0) {this.DEC(this.getAddrZeroPage()); this.ip += 2; this.tLim = 5;} break;
            case 0xd6: if(this.t === 0) {this.DEC(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0xce: if(this.t === 0) {this.DEC(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0xde: if(this.t === 0) {this.DEC(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0xca: if(this.t === 0) {this.DEX(); this.ip += 1; this.tLim = 2;} break;
            case 0x88: if(this.t === 0) {this.DEY(); this.ip += 1; this.tLim = 2;} break;

            case 0xe6: if(this.t === 0) {this.INC(this.getAddrZeroPage()); this.ip += 2; this.tLim = 5;} break;
            case 0xf6: if(this.t === 0) {this.INC(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0xee: if(this.t === 0) {this.INC(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0xfe: if(this.t === 0) {this.INC(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;
            case 0xe8: if(this.t === 0) {this.INX(); this.ip += 1; this.tLim = 2;} break;
            case 0xc8: if(this.t === 0) {this.INY(); this.ip += 1; this.tLim = 2;} break;

            case 0x49: if(this.t === 0) {this.EOR(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0x45: if(this.t === 0) {this.EOR(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0x55: if(this.t === 0) {this.EOR(this.getByteZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0x4D: if(this.t === 0) {this.EOR(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0x5D: if(this.t === 0) {this.EOR(this.getByteAbsoluteX()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x59: if(this.t === 0) {this.EOR(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x41: if(this.t === 0) {this.EOR(this.getByteIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0x51: if(this.t === 0) {this.EOR(this.getByteIndirectY()); this.ip += 2; this.tLim = 5 + this.pageCross;} break;


            case 0x4c: if(this.t === 0) {/*JMP*/ this.ip = this.getAddrAbsolute(); this.tLim = 3;} break;
            case 0x6c: if(this.t === 0) {/*JMP*/ this.ip = this.getWordIndirect(); this.tLim = 5;} break;

            case 0xa9: if(this.t === 0) {this.LDA(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xa5: if(this.t === 0) {this.LDA(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0xb5: if(this.t === 0) {this.LDA(this.getByteZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0xad: if(this.t === 0) {this.LDA(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0xbd: if(this.t === 0) {this.LDA(this.getByteAbsoluteX()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xb9: if(this.t === 0) {this.LDA(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xa1: if(this.t === 0) {this.LDA(this.getByteIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0xb1: if(this.t === 0) {this.LDA(this.getByteIndirectY()); this.ip += 2; this.tLim = 5 + this.pageCross;} break;

            case 0xa2: if(this.t === 0) {this.LDX(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xa6: if(this.t === 0) {this.LDX(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0xb6: if(this.t === 0) {this.LDX(this.getByteZeroPageY()); this.ip += 2; this.tLim = 4;} break;
            case 0xae: if(this.t === 0) {this.LDX(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0xbe: if(this.t === 0) {this.LDX(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;

            case 0xa0: if(this.t === 0) {this.LDY(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xa4: if(this.t === 0) {this.LDY(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0xb4: if(this.t === 0) {this.LDY(this.getByteZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0xac: if(this.t === 0) {this.LDY(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0xbc: if(this.t === 0) {this.LDY(this.getByteAbsoluteX()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;

            case 0x4a: if(this.t === 0) {this.LSR(this.addrRA); this.ip += 1; this.tLim = 2;} break;
            case 0x46: if(this.t === 0) {this.LSR(this.getAddrZeroPage()); this.ip += 2; this.tLim = 5;} break;
            case 0x56: if(this.t === 0) {this.LSR(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0x4e: if(this.t === 0) {this.LSR(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0x5e: if(this.t === 0) {this.LSR(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0xea: if(this.t === 0) {/*NOP*/ this.ip += 1; this.tLim = 2;} break;


            case 0x09: if(this.t === 0) {this.ORA(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0x05: if(this.t === 0) {this.ORA(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0x15: if(this.t === 0) {this.ORA(this.getByteZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0x0d: if(this.t === 0) {this.ORA(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0x1d: if(this.t === 0) {this.ORA(this.getByteAbsoluteX()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x19: if(this.t === 0) {this.ORA(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x01: if(this.t === 0) {this.ORA(this.getByteIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0x11: if(this.t === 0) {this.ORA(this.getByteIndirectY()); this.ip += 2; this.tLim = 5 + this.pageCross;} break;


            case 0x48: if(this.t === 0) {this.PHA(); this.ip += 1; this.tLim = 3;} break;
            case 0x08: if(this.t === 0) {this.PHP(); this.ip += 1; this.tLim = 3;} break;
            case 0x68: if(this.t === 0) {this.PLA(); this.ip += 1; this.tLim = 4;} break;
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
                    this.ROL(this.addrRA); this.ip += 1; this.tLim = 2;
                }
                break;
            case 0x26: if(this.t === 0) {this.ROL(this.getAddrZeroPage()); this.ip += 2; this.tLim = 5;} break;
            case 0x36: if(this.t === 0) {this.ROL(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0x2e: if(this.t === 0) {this.ROL(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0x3e: if(this.t === 0) {this.ROL(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0x6a: if(this.t === 0) {this.ROR(this.addrRA); this.ip += 1; this.tLim = 2;} break;
            case 0x66: if(this.t === 0) {this.ROR(this.getAddrZeroPage()); this.ip += 2; this.tLim = 5;} break;
            case 0x76: if(this.t === 0) {this.ROR(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0x6e: if(this.t === 0) {this.ROR(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0x7e: if(this.t === 0) {this.ROR(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0x00: if(this.t === 0) {this.BRK(); this.tLim = 7;} break;
            case 0x40: if(this.t === 0) {this.RTI(); this.tLim = 6;} break;

            case 0xe9: if(this.t === 0) {this.SBC(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xe5: if(this.t === 0) {this.SBC(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0xf5: if(this.t === 0) {this.SBC(this.getByteZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0xed: if(this.t === 0) {this.SBC(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0xfd: if(this.t === 0) {this.SBC(this.getByteAbsoluteX()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xf9: if(this.t === 0) {this.SBC(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xe1: if(this.t === 0) {this.SBC(this.getByteIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0xf1: if(this.t === 0) {this.SBC(this.getByteIndirectY()); this.ip += 2; this.tLim = 5 + this.pageCross;} break;

            case 0x38: if(this.t === 0) {/*SEC*/ this.flgCarry = 1; this.ip += 1; this.tLim = 2;} break;
            case 0xf8: if(this.t === 0) {/*SED*/ this.flgDecimalMode = 1; this.ip += 1; this.tLim = 2;} break;
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
              

            case 0x85: if(this.t === 0) {this.STA(this.getAddrZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0x95: if(this.t === 0) {this.STA(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0x8d: if(this.t === 0) {this.STA(this.getAddrAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0x9d: if(this.t === 0) {this.STA(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 5;} break;
            case 0x99: if(this.t === 0) {this.STA(this.getAddrAbsoluteY()); this.ip += 3; this.tLim = 5;} break;
            case 0x81: if(this.t === 0) {this.STA(this.getAddrIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0x91: if(this.t === 0) {this.STA(this.getAddrIndirectY()); this.ip += 2; this.tLim = 6;} break;

            case 0x86: if(this.t === 0) {this.STX(this.getAddrZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0x96: if(this.t === 0) {this.STX(this.getAddrZeroPageY()); this.ip += 2; this.tLim = 4;} break;
            case 0x8e: if(this.t === 0) {this.STX(this.getAddrAbsolute()); this.ip += 3; this.tLim = 4;} break;

            case 0x84: if(this.t === 0) {this.STY(this.getAddrZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0x94: if(this.t === 0) {this.STY(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 4;} break;
            case 0x8c: if(this.t === 0) {this.STY(this.getAddrAbsolute()); this.ip += 3; this.tLim = 4;} break;

            case 0xaa: if(this.t === 0) {this.TAX(); this.ip += 1; this.tLim = 2;} break;
            case 0xa8: if(this.t === 0) {this.TAY(); this.ip += 1; this.tLim = 2;} break;
            case 0xba: if(this.t === 0) {this.TSX(); this.ip += 1; this.tLim = 2;} break;
            case 0x8a: if(this.t === 0) {this.TXA(); this.ip += 1; this.tLim = 2;} break;
            case 0x9a: if(this.t === 0) {this.TXS(); this.ip += 1; this.tLim = 2;} break;
            case 0x98: if(this.t === 0) {this.TYA(); this.ip += 1; this.tLim = 2;} break;

            case 0x20: if(this.t === 0) {this.JSR(this.getAddrAbsolute()); this.tLim = 6;} break;
            case 0x60: if(this.t === 0) {this.RTS(); this.tLim = 6;} break;

            //unofficial opcodes below

            case 0x1a: if(this.t === 0) {/* *NOP*/ this.ip += 1; this.tLim = 2;} break;
            case 0x3a: if(this.t === 0) {/* *NOP*/ this.ip += 1; this.tLim = 2;} break;
            case 0x5a: if(this.t === 0) {/* *NOP*/ this.ip += 1; this.tLim = 2;} break;
            case 0x7a: if(this.t === 0) {/* *NOP*/ this.ip += 1; this.tLim = 2;} break;
            case 0xda: if(this.t === 0) {/* *NOP*/ this.ip += 1; this.tLim = 2;} break;
            case 0xfa: if(this.t === 0) {/* *NOP*/ this.ip += 1; this.tLim = 2;} break;
            case 0x04: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 3;} break;
            case 0x14: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 4;} break;
            case 0x34: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 4;} break;
            case 0x44: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 3;} break;
            case 0x54: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 4;} break;
            case 0x64: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 3;} break;
            case 0x74: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 4;} break;
            case 0xd4: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 4;} break;
            case 0xf4: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 4;} break;
            case 0x80: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 2;} break;
            case 0x82: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 2;} break;
            case 0xc2: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 2;} break;
            case 0xe2: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 2;} break;
            case 0x89: if(this.t === 0) {/* *NOP*/ this.ip += 2; this.tLim = 2;} break;
            case 0x0c: if(this.t === 0) {/* *NOP*/ this.ip += 3; this.tLim = 4;} break;
            case 0x1c: if(this.t === 0) {/* *NOP*/ this.getAddrAbsoluteX(); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x3c: if(this.t === 0) {/* *NOP*/ this.getAddrAbsoluteX(); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x5c: if(this.t === 0) {/* *NOP*/ this.getAddrAbsoluteX(); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0x7c: if(this.t === 0) {/* *NOP*/ this.getAddrAbsoluteX(); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xdc: if(this.t === 0) {/* *NOP*/ this.getAddrAbsoluteX(); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xfc: if(this.t === 0) {/* *NOP*/ this.getAddrAbsoluteX(); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xeb: if(this.t === 0) {this.SBC(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xc3: if(this.t === 0) {this.DCP(this.getAddrIndirectX()); this.ip += 2; this.tLim = 8;} break;
            case 0xc7: if(this.t === 0) {this.DCP(this.getAddrZeroPage()); this.ip += 2; this.tLim = 5;} break;
            case 0xcf: if(this.t === 0) {this.DCP(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0xd3: if(this.t === 0) {this.DCP(this.getAddrIndirectY()); this.ip += 2; this.tLim = 8;} break;
            case 0xd7: if(this.t === 0) {this.DCP(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0xdb: if(this.t === 0) {this.DCP(this.getAddrAbsoluteY()); this.ip += 3; this.tLim = 7;} break;
            case 0xdf: if(this.t === 0) {this.DCP(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0xe3: if(this.t === 0) {this.ISC(this.getAddrIndirectX()); this.ip += 2; this.tLim = 8;} break;
            case 0xe7: if(this.t === 0) {this.ISC(this.getAddrZeroPage()); this.ip += 2; this.tLim = 5;} break;
            case 0xef: if(this.t === 0) {this.ISC(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0xf3: if(this.t === 0) {this.ISC(this.getAddrIndirectY()); this.ip += 2; this.tLim = 8;} break;
            case 0xf7: if(this.t === 0) {this.ISC(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0xfb: if(this.t === 0) {this.ISC(this.getAddrAbsoluteY()); this.ip += 3; this.tLim = 7;} break;
            case 0xff: if(this.t === 0) {this.ISC(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0xab: if(this.t === 0) {this.LAX(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xa7: if(this.t === 0) {this.LAX(this.getByteZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0xb7: if(this.t === 0) {this.LAX(this.getByteZeroPageY()); this.ip += 2; this.tLim = 4;} break;
            case 0xaf: if(this.t === 0) {this.LAX(this.getByteAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0xbf: if(this.t === 0) {this.LAX(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;
            case 0xa3: if(this.t === 0) {this.LAX(this.getByteIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0xb3: if(this.t === 0) {this.LAX(this.getByteIndirectY()); this.ip += 2; this.tLim = 5 + this.pageCross;} break;

            case 0x83: if(this.t === 0) {this.SAX(this.getAddrIndirectX()); this.ip += 2; this.tLim = 6;} break;
            case 0x87: if(this.t === 0) {this.SAX(this.getAddrZeroPage()); this.ip += 2; this.tLim = 3;} break;
            case 0x8f: if(this.t === 0) {this.SAX(this.getAddrAbsolute()); this.ip += 3; this.tLim = 4;} break;
            case 0x97: if(this.t === 0) {this.SAX(this.getAddrZeroPageY()); this.ip += 2; this.tLim = 4;} break;

            case 0x03: if(this.t === 0) {this.SLO(this.getAddrIndirectX()); this.ip += 2; this.tLim = 8;} break;
            case 0x07: if(this.t === 0) {this.SLO(this.getByteImmediate()); this.ip += 2; this.tLim = 5;} break;
            case 0x0f: if(this.t === 0) {this.SLO(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0x13: if(this.t === 0) {this.SLO(this.getAddrIndirectY()); this.ip += 2; this.tLim = 8;} break;
            case 0x17: if(this.t === 0) {this.SLO(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0x1b: if(this.t === 0) {this.SLO(this.getAddrAbsoluteY()); this.ip += 3; this.tLim = 7;} break;
            case 0x1f: if(this.t === 0) {this.SLO(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0x23: if(this.t === 0) {this.RLA(this.getAddrIndirectX()); this.ip += 2; this.tLim = 8;} break;
            case 0x27: if(this.t === 0) {this.RLA(this.getByteImmediate()); this.ip += 2; this.tLim = 5;} break;
            case 0x2f: if(this.t === 0) {this.RLA(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0x33: if(this.t === 0) {this.RLA(this.getAddrIndirectY()); this.ip += 2; this.tLim = 8;} break;
            case 0x37: if(this.t === 0) {this.RLA(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0x3b: if(this.t === 0) {this.RLA(this.getAddrAbsoluteY()); this.ip += 3; this.tLim = 7;} break;
            case 0x3f: if(this.t === 0) {this.RLA(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0x63: if(this.t === 0) {this.RRA(this.getAddrIndirectX()); this.ip += 2; this.tLim = 8;} break;
            case 0x67: if(this.t === 0) {this.RRA(this.getByteImmediate()); this.ip += 2; this.tLim = 5;} break;
            case 0x6f: if(this.t === 0) {this.RRA(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0x73: if(this.t === 0) {this.RRA(this.getAddrIndirectY()); this.ip += 2; this.tLim = 8;} break;
            case 0x77: if(this.t === 0) {this.RRA(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0x7b: if(this.t === 0) {this.RRA(this.getAddrAbsoluteY()); this.ip += 3; this.tLim = 7;} break;
            case 0x7f: if(this.t === 0) {this.RRA(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0x43: if(this.t === 0) {this.SRE(this.getAddrIndirectX()); this.ip += 2; this.tLim = 8;} break;
            case 0x47: if(this.t === 0) {this.SRE(this.getByteImmediate()); this.ip += 2; this.tLim = 5;} break;
            case 0x4f: if(this.t === 0) {this.SRE(this.getAddrAbsolute()); this.ip += 3; this.tLim = 6;} break;
            case 0x53: if(this.t === 0) {this.SRE(this.getAddrIndirectY()); this.ip += 2; this.tLim = 8;} break;
            case 0x57: if(this.t === 0) {this.SRE(this.getAddrZeroPageX()); this.ip += 2; this.tLim = 6;} break;
            case 0x5b: if(this.t === 0) {this.SRE(this.getAddrAbsoluteY()); this.ip += 3; this.tLim = 7;} break;
            case 0x5f: if(this.t === 0) {this.SRE(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 7;} break;

            case 0x0b: if(this.t === 0) {this.ANC(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0x2b: if(this.t === 0) {this.ANC(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0x4b: if(this.t === 0) {this.ALR(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0x6b: if(this.t === 0) {this.ARR(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0xcb: if(this.t === 0) {this.AXS(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;

            case 0x9c: if(this.t === 0) {this.SYA(this.getAddrAbsoluteX()); this.ip += 3; this.tLim = 5;} break;
            case 0x9e: if(this.t === 0) {this.SXA(this.getAddrAbsoluteY()); this.ip += 3; this.tLim = 5;} break;
            case 0x8b: if(this.t === 0) {this.XAA(this.getByteImmediate()); this.ip += 2; this.tLim = 2;} break;
            case 0x93: if(this.t === 0) {this.AXA(this.getByteIndirectY()); this.ip += 2; this.tLim = 6;} break;
            case 0x9b: if(this.t === 0) {this.XAS(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 5;} break;
            case 0x9f: if(this.t === 0) {this.AXA(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 5;} break;
            case 0xbb: if(this.t === 0) {this.LAR(this.getByteAbsoluteY()); this.ip += 3; this.tLim = 4 + this.pageCross;} break;

            default:
                throw 'unkown opcode $' + (this.memory.getByte(this.ip)).toString(16);
        }
        if (this.tLim === 0) {
            throw 'sleep not set';
        }
        this.ip &= 0xffff;
    }
}