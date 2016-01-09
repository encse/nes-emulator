var Memory = (function () {
    function Memory() {
        this.memory = new Uint8Array(65535);
    }
    Memory.prototype.getByte = function (addr) {
        return this.memory[addr];
    };
    Memory.prototype.getWord = function (addr) {
        return this.memory[addr] + 256 * this.memory[addr + 1];
    };
    Memory.prototype.setByte = function (addr, value) {
        this.memory[addr] = value % 256;
    };
    Memory.prototype.setWord = function (addr, value) {
        this.memory[addr + 1] = (value >> 8) % 256;
        this.memory[addr] = value % 256;
    };
    return Memory;
})();
var Mos6502 = (function () {
    function Mos6502(memory, ip, sp) {
        this.memory = memory;
        this.ip = ip;
        this.sp = sp;
        this.addrRA = -1;
        this.rA = 0;
        this.rX = 0;
        this.rY = 0;
        this.flgCarry = 0;
        this.flgZero = 0;
        this.flgInterruptDisable = 1;
        this.flgDecimalMode = 0;
        this.flgBreakCommand = 0;
        this.flgOverflow = 0;
        this.flgNegative = 0;
    }
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
        if (!this.flgCarry)
            this.ip += sbyte;
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
        if (this.flgCarry)
            this.ip += sbyte;
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
        if (this.flgZero)
            this.ip += sbyte;
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
        if (this.flgNegative)
            this.ip += sbyte;
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
        if (!this.flgZero)
            this.ip += sbyte;
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
        if (!this.flgNegative)
            this.ip += sbyte;
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
        if (!this.flgOverflow)
            this.ip += sbyte;
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
        if (this.flgOverflow)
            this.ip += sbyte;
    };
    Mos6502.prototype.CLC = function () {
        this.flgCarry = 0;
    };
    Mos6502.prototype.CLD = function () {
        this.flgDecimalMode = 0;
    };
    Mos6502.prototype.CLI = function () {
        this.flgInterruptDisable = 0;
    };
    Mos6502.prototype.CLO = function () {
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
        this.pushWord(this.ip + 2);
        this.PHP();
        this.ip = this.memory.getWord(0xfffe);
    };
    /**
     * RTI - Return from Interrupt

        The RTI instruction is used at the end of an interrupt processing routine. It pulls the processor flags from the stack followed by the program counter.

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
        this.PLP();
        this.ip = this.popWord();
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
    Mos6502.prototype.getSByteRelative = function () { var b = this.memory.getByte(this.ip + 1); return b >= 128 ? b - 256 : b; };
    Mos6502.prototype.getByteImmediate = function () { return this.memory.getByte(this.ip + 1); };
    Mos6502.prototype.getWordImmediate = function () { return this.memory.getWord(this.ip + 1); };
    Mos6502.prototype.getAddrZeroPage = function () { return this.getByteImmediate(); };
    Mos6502.prototype.getByteZeroPage = function () { return this.memory.getByte(this.getAddrZeroPage()); };
    Mos6502.prototype.getWordZeroPage = function () { return this.memory.getWord(this.getAddrZeroPage()); };
    Mos6502.prototype.getAddrZeroPageX = function () { return (this.rX + this.getByteImmediate()) & 0xff; };
    Mos6502.prototype.getByteZeroPageX = function () { return this.memory.getByte(this.getAddrZeroPageX()); };
    Mos6502.prototype.getWordZeroPageX = function () { return this.memory.getWord(this.getAddrZeroPageX()); };
    Mos6502.prototype.getAddrZeroPageY = function () { return (this.rY + this.getByteImmediate()) & 0xff; };
    Mos6502.prototype.getByteZeroPageY = function () { return this.memory.getByte(this.getAddrZeroPageY()); };
    Mos6502.prototype.getWordZeroPageY = function () { return this.memory.getWord(this.getAddrZeroPageY()); };
    Mos6502.prototype.getAddrAbsolute = function () { return this.getWordImmediate(); };
    Mos6502.prototype.getByteAbsolute = function () { return this.memory.getByte(this.getAddrAbsolute()); };
    Mos6502.prototype.getWordAbsolute = function () { return this.memory.getWord(this.getAddrAbsolute()); };
    Mos6502.prototype.getAddrAbsoluteX = function () { return (this.rX + this.getWordImmediate()) & 0xffff; };
    Mos6502.prototype.getByteAbsoluteX = function () { return this.memory.getByte(this.getAddrAbsoluteX()); };
    Mos6502.prototype.getWordAbsoluteX = function () { return this.memory.getWord(this.getAddrAbsoluteX()); };
    Mos6502.prototype.getAddrAbsoluteY = function () { return (this.rY + this.getWordImmediate()) & 0xffff; };
    Mos6502.prototype.getByteAbsoluteY = function () { return this.memory.getByte(this.getAddrAbsoluteY()); };
    Mos6502.prototype.getWordAbsoluteY = function () { return this.memory.getWord(this.getAddrAbsoluteY()); };
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
    Mos6502.prototype.getWordIndirectX = function () { return this.memory.getWord(this.getAddrIndirectX()); };
    Mos6502.prototype.getAddrIndirectY = function () {
        //The 6502's Indirect-Indexed-Y ((Ind),Y) addressing mode is also partially broken.
        //If the zero- page address was hex FF (i.e.last address of zero- page FF), the processor 
        //would not fetch data from the address pointed to by 00FF and 0100 + Y, but rather the one in 00FF and 0000 + Y.
        //This defect continued through the entire NMOS line, but was fixed in some of the CMOS derivatives.
        var addrLo = this.getByteImmediate() & 0xff;
        var addrHi = (addrLo + 1) & 0xff;
        return (this.memory.getByte(addrLo) + 256 * this.memory.getByte(addrHi) + this.rY) & 0xffff;
    };
    Mos6502.prototype.getByteIndirectY = function () { return this.memory.getByte(this.getAddrIndirectY()); };
    Mos6502.prototype.getWordIndirectY = function () { return this.memory.getWord(this.getAddrIndirectY()); };
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
    Mos6502.prototype.step = function () {
        switch (this.memory.getByte(this.ip)) {
            case 0x69:
                this.ADC(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0x65:
                this.ADC(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0x75:
                this.ADC(this.getByteZeroPageX());
                this.ip += 2;
                break;
            case 0x6d:
                this.ADC(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0x7d:
                this.ADC(this.getByteAbsoluteX());
                this.ip += 3;
                break;
            case 0x79:
                this.ADC(this.getByteAbsoluteY());
                this.ip += 3;
                break;
            case 0x61:
                this.ADC(this.getByteIndirectX());
                this.ip += 2;
                break;
            case 0x71:
                this.ADC(this.getByteIndirectY());
                this.ip += 2;
                break;
            case 0x29:
                this.AND(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0x25:
                this.AND(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0x35:
                this.AND(this.getByteZeroPageX());
                this.ip += 2;
                break;
            case 0x2D:
                this.AND(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0x3D:
                this.AND(this.getByteAbsoluteX());
                this.ip += 3;
                break;
            case 0x39:
                this.AND(this.getByteAbsoluteY());
                this.ip += 3;
                break;
            case 0x21:
                this.AND(this.getByteIndirectX());
                this.ip += 2;
                break;
            case 0x31:
                this.AND(this.getByteIndirectY());
                this.ip += 2;
                break;
            case 0x0a:
                this.ASL(this.addrRA);
                this.ip += 1;
                break;
            case 0x06:
                this.ASL(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0x16:
                this.ASL(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x0e:
                this.ASL(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x1e:
                this.ASL(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0x90:
                this.BCC(this.getSByteRelative());
                this.ip += 2;
                break;
            case 0xb0:
                this.BCS(this.getSByteRelative());
                this.ip += 2;
                break;
            case 0xf0:
                this.BEQ(this.getSByteRelative());
                this.ip += 2;
                break;
            case 0x30:
                this.BMI(this.getSByteRelative());
                this.ip += 2;
                break;
            case 0xd0:
                this.BNE(this.getSByteRelative());
                this.ip += 2;
                break;
            case 0x10:
                this.BPL(this.getSByteRelative());
                this.ip += 2;
                break;
            case 0x50:
                this.BVC(this.getSByteRelative());
                this.ip += 2;
                break;
            case 0x70:
                this.BVS(this.getSByteRelative());
                this.ip += 2;
                break;
            case 0x18:
                this.CLC();
                this.ip += 1;
                break;
            case 0xd8:
                this.CLD();
                this.ip += 1;
                break;
            case 0x58:
                this.CLI();
                this.ip += 1;
                break;
            case 0xb8:
                this.CLO();
                this.ip += 1;
                break;
            case 0xc9:
                this.CMP(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0xc5:
                this.CMP(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0xd5:
                this.CMP(this.getByteZeroPageX());
                this.ip += 2;
                break;
            case 0xcd:
                this.CMP(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0xdd:
                this.CMP(this.getByteAbsoluteX());
                this.ip += 3;
                break;
            case 0xd9:
                this.CMP(this.getByteAbsoluteY());
                this.ip += 3;
                break;
            case 0xc1:
                this.CMP(this.getByteIndirectX());
                this.ip += 2;
                break;
            case 0xd1:
                this.CMP(this.getByteIndirectY());
                this.ip += 2;
                break;
            case 0xe0:
                this.CPX(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0xe4:
                this.CPX(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0xec:
                this.CPX(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0xc0:
                this.CPY(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0xc4:
                this.CPY(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0xcc:
                this.CPY(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0xc6:
                this.DEC(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0xd6:
                this.DEC(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0xce:
                this.DEC(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0xde:
                this.DEC(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0xca:
                this.DEX();
                this.ip += 1;
                break;
            case 0x88:
                this.DEY();
                this.ip += 1;
                break;
            case 0xe6:
                this.INC(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0xf6:
                this.INC(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0xee:
                this.INC(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0xfe:
                this.INC(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0xe8:
                this.INX();
                this.ip += 1;
                break;
            case 0xc8:
                this.INY();
                this.ip += 1;
                break;
            case 0x49:
                this.EOR(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0x45:
                this.EOR(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0x55:
                this.EOR(this.getByteZeroPageX());
                this.ip += 2;
                break;
            case 0x4D:
                this.EOR(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0x5D:
                this.EOR(this.getByteAbsoluteX());
                this.ip += 3;
                break;
            case 0x59:
                this.EOR(this.getByteAbsoluteY());
                this.ip += 3;
                break;
            case 0x41:
                this.EOR(this.getByteIndirectX());
                this.ip += 2;
                break;
            case 0x51:
                this.EOR(this.getByteIndirectY());
                this.ip += 2;
                break;
            case 0x24:
                this.BIT(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0x2c:
                this.BIT(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0x4c:
                this.ip = this.getAddrAbsolute();
                break;
            case 0x6c:
                this.ip = this.getWordIndirect();
                break;
            case 0xa9:
                this.LDA(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0xa5:
                this.LDA(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0xb5:
                this.LDA(this.getByteZeroPageX());
                this.ip += 2;
                break;
            case 0xad:
                this.LDA(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0xbd:
                this.LDA(this.getByteAbsoluteX());
                this.ip += 3;
                break;
            case 0xb9:
                this.LDA(this.getByteAbsoluteY());
                this.ip += 3;
                break;
            case 0xa1:
                this.LDA(this.getByteIndirectX());
                this.ip += 2;
                break;
            case 0xb1:
                this.LDA(this.getByteIndirectY());
                this.ip += 2;
                break;
            case 0xa2:
                this.LDX(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0xa6:
                this.LDX(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0xb6:
                this.LDX(this.getByteZeroPageY());
                this.ip += 2;
                break;
            case 0xae:
                this.LDX(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0xbe:
                this.LDX(this.getByteAbsoluteY());
                this.ip += 3;
                break;
            case 0xa0:
                this.LDY(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0xa4:
                this.LDY(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0xb4:
                this.LDY(this.getByteZeroPageX());
                this.ip += 2;
                break;
            case 0xac:
                this.LDY(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0xbc:
                this.LDY(this.getByteAbsoluteX());
                this.ip += 3;
                break;
            case 0x4a:
                this.LSR(this.addrRA);
                this.ip += 1;
                break;
            case 0x46:
                this.LSR(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0x56:
                this.LSR(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x4e:
                this.LSR(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x5e:
                this.LSR(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0xea:
                this.ip += 1;
                break;
            case 0x09:
                this.ORA(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0x05:
                this.ORA(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0x15:
                this.ORA(this.getByteZeroPageX());
                this.ip += 2;
                break;
            case 0x0d:
                this.ORA(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0x1d:
                this.ORA(this.getByteAbsoluteX());
                this.ip += 3;
                break;
            case 0x19:
                this.ORA(this.getByteAbsoluteY());
                this.ip += 3;
                break;
            case 0x01:
                this.ORA(this.getByteIndirectX());
                this.ip += 2;
                break;
            case 0x11:
                this.ORA(this.getByteIndirectY());
                this.ip += 2;
                break;
            case 0x48:
                this.PHA();
                this.ip += 1;
                break;
            case 0x08:
                this.PHP();
                this.ip += 1;
                break;
            case 0x68:
                this.PLA();
                this.ip += 1;
                break;
            case 0x28:
                this.PLP();
                this.ip += 1;
                break;
            case 0x2a:
                this.ROL(this.addrRA);
                this.ip += 1;
                break;
            case 0x26:
                this.ROL(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0x36:
                this.ROL(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x2e:
                this.ROL(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x3e:
                this.ROL(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0x6a:
                this.ROR(this.addrRA);
                this.ip += 1;
                break;
            case 0x66:
                this.ROR(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0x76:
                this.ROR(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x6e:
                this.ROR(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x7e:
                this.ROR(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0x00:
                this.BRK();
                break;
            case 0x40:
                this.RTI();
                break;
            case 0xe9:
                this.SBC(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0xe5:
                this.SBC(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0xf5:
                this.SBC(this.getByteZeroPageX());
                this.ip += 2;
                break;
            case 0xed:
                this.SBC(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0xfd:
                this.SBC(this.getByteAbsoluteX());
                this.ip += 3;
                break;
            case 0xf9:
                this.SBC(this.getByteAbsoluteY());
                this.ip += 3;
                break;
            case 0xe1:
                this.SBC(this.getByteIndirectX());
                this.ip += 2;
                break;
            case 0xf1:
                this.SBC(this.getByteIndirectY());
                this.ip += 2;
                break;
            case 0x38:
                this.flgCarry = 1;
                this.ip += 1;
                break;
            case 0xf8:
                this.flgDecimalMode = 1;
                this.ip += 1;
                break;
            case 0x78:
                this.flgInterruptDisable = 1;
                this.ip += 1;
                break;
            case 0x85:
                this.STA(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0x95:
                this.STA(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x8d:
                this.STA(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x9d:
                this.STA(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0x99:
                this.STA(this.getAddrAbsoluteY());
                this.ip += 3;
                break;
            case 0x81:
                this.STA(this.getAddrIndirectX());
                this.ip += 2;
                break;
            case 0x91:
                this.STA(this.getAddrIndirectY());
                this.ip += 2;
                break;
            case 0x86:
                this.STX(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0x96:
                this.STX(this.getAddrZeroPageY());
                this.ip += 2;
                break;
            case 0x8e:
                this.STX(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x84:
                this.STY(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0x94:
                this.STY(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x8c:
                this.STY(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0xaa:
                this.TAX();
                this.ip += 1;
                break;
            case 0xa8:
                this.TAY();
                this.ip += 1;
                break;
            case 0xba:
                this.TSX();
                this.ip += 1;
                break;
            case 0x8a:
                this.TXA();
                this.ip += 1;
                break;
            case 0x9a:
                this.TXS();
                this.ip += 1;
                break;
            case 0x98:
                this.TYA();
                this.ip += 1;
                break;
            case 0x20:
                this.JSR(this.getAddrAbsolute());
                break;
            case 0x60:
                this.RTS();
                break;
            //unofficial opcodes below
            case 0x1a:
                this.ip += 1;
                break;
            case 0x3a:
                this.ip += 1;
                break;
            case 0x5a:
                this.ip += 1;
                break;
            case 0x7a:
                this.ip += 1;
                break;
            case 0xda:
                this.ip += 1;
                break;
            case 0xfa:
                this.ip += 1;
                break;
            case 0x04:
                this.ip += 2;
                break;
            case 0x14:
                this.ip += 2;
                break;
            case 0x34:
                this.ip += 2;
                break;
            case 0x44:
                this.ip += 2;
                break;
            case 0x54:
                this.ip += 2;
                break;
            case 0x64:
                this.ip += 2;
                break;
            case 0x74:
                this.ip += 2;
                break;
            case 0xd4:
                this.ip += 2;
                break;
            case 0xf4:
                this.ip += 2;
                break;
            case 0x80:
                this.ip += 2;
                break;
            case 0x0c:
                this.ip += 3;
                break;
            case 0x1c:
                this.ip += 3;
                break;
            case 0x3c:
                this.ip += 3;
                break;
            case 0x5c:
                this.ip += 3;
                break;
            case 0x7c:
                this.ip += 3;
                break;
            case 0xdc:
                this.ip += 3;
                break;
            case 0xfc:
                this.ip += 3;
                break;
            case 0xeb:
                this.SBC(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0xc3:
                this.DCP(this.getAddrIndirectX());
                this.ip += 2;
                break;
            case 0xc7:
                this.DCP(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0xcf:
                this.DCP(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0xd3:
                this.DCP(this.getAddrIndirectY());
                this.ip += 2;
                break;
            case 0xd7:
                this.DCP(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0xdb:
                this.DCP(this.getAddrAbsoluteY());
                this.ip += 3;
                break;
            case 0xdf:
                this.DCP(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0xe3:
                this.ISC(this.getAddrIndirectX());
                this.ip += 2;
                break;
            case 0xe7:
                this.ISC(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0xef:
                this.ISC(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0xf3:
                this.ISC(this.getAddrIndirectY());
                this.ip += 2;
                break;
            case 0xf7:
                this.ISC(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0xfb:
                this.ISC(this.getAddrAbsoluteY());
                this.ip += 3;
                break;
            case 0xff:
                this.ISC(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0xa7:
                this.LAX(this.getByteZeroPage());
                this.ip += 2;
                break;
            case 0xb7:
                this.LAX(this.getByteZeroPageY());
                this.ip += 2;
                break;
            case 0xaf:
                this.LAX(this.getByteAbsolute());
                this.ip += 3;
                break;
            case 0xbf:
                this.LAX(this.getByteAbsoluteY());
                this.ip += 3;
                break;
            case 0xa3:
                this.LAX(this.getByteIndirectX());
                this.ip += 2;
                break;
            case 0xb3:
                this.LAX(this.getByteIndirectY());
                this.ip += 2;
                break;
            case 0x83:
                this.SAX(this.getAddrIndirectX());
                this.ip += 2;
                break;
            case 0x87:
                this.SAX(this.getAddrZeroPage());
                this.ip += 2;
                break;
            case 0x8f:
                this.SAX(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x97:
                this.SAX(this.getAddrZeroPageY());
                this.ip += 2;
                break;
            case 0x03:
                this.SLO(this.getAddrIndirectX());
                this.ip += 2;
                break;
            case 0x07:
                this.SLO(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0x0f:
                this.SLO(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x13:
                this.SLO(this.getAddrIndirectY());
                this.ip += 2;
                break;
            case 0x17:
                this.SLO(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x1b:
                this.SLO(this.getAddrAbsoluteY());
                this.ip += 3;
                break;
            case 0x1f:
                this.SLO(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0x23:
                this.RLA(this.getAddrIndirectX());
                this.ip += 2;
                break;
            case 0x27:
                this.RLA(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0x2f:
                this.RLA(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x33:
                this.RLA(this.getAddrIndirectY());
                this.ip += 2;
                break;
            case 0x37:
                this.RLA(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x3b:
                this.RLA(this.getAddrAbsoluteY());
                this.ip += 3;
                break;
            case 0x3f:
                this.RLA(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0x63:
                this.RRA(this.getAddrIndirectX());
                this.ip += 2;
                break;
            case 0x67:
                this.RRA(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0x6f:
                this.RRA(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x73:
                this.RRA(this.getAddrIndirectY());
                this.ip += 2;
                break;
            case 0x77:
                this.RRA(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x7b:
                this.RRA(this.getAddrAbsoluteY());
                this.ip += 3;
                break;
            case 0x7f:
                this.RRA(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
            case 0x43:
                this.SRE(this.getAddrIndirectX());
                this.ip += 2;
                break;
            case 0x47:
                this.SRE(this.getByteImmediate());
                this.ip += 2;
                break;
            case 0x4f:
                this.SRE(this.getAddrAbsolute());
                this.ip += 3;
                break;
            case 0x53:
                this.SRE(this.getAddrIndirectY());
                this.ip += 2;
                break;
            case 0x57:
                this.SRE(this.getAddrZeroPageX());
                this.ip += 2;
                break;
            case 0x5b:
                this.SRE(this.getAddrAbsoluteY());
                this.ip += 3;
                break;
            case 0x5f:
                this.SRE(this.getAddrAbsoluteX());
                this.ip += 3;
                break;
        }
    };
    return Mos6502;
})();
//# sourceMappingURL=app.js.map