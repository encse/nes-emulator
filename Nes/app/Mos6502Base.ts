///<reference path="Memory.ts"/>

class Most6502Base {

    public addrReset = 0xfffc;
    public addrIRQ = 0xfffe;
    public addrNMI = 0xfffa;

    public opcode: number;
    public ip: number = 0;
    public ipCur: number = 0;
    public sp: number = 0;
    public t: number = 0;
    public b: number = 0;
    public rA: number = 0;
    public rX: number = 0;
    public rY: number = 0;
    
    public nmiLine = 1;
    private nmiLinePrev = 1;
    private nmiRequested = false;
    private nmiDetected: boolean;
   
    public irqLine = 1;
    private irqRequested = false;
    private irqDetected: boolean;

    private flgCarry: number = 0;
    private flgZero: number = 0;
    private flgNegative: number = 0;
    private flgOverflow: number = 0;
    private flgInterruptDisable: number = 1;
    private flgDecimalMode: number = 0;
    private flgBreakCommand: number = 0;

    private addr: number;
    private addrHi: number;
    private addrLo: number;
    private addrPtr: number;
    private ptrLo: number;
    private ptrHi: number;
    private ipC: number;
    private addrC: number;
    private enablePCIncrement = true;
    private enableInterruptPoll = true;
    private canSetFlgBreak = true;
    private addrBrk : number;

    private bDma:number;
    private dmaRequested = false;
    private addrDma:number;
    private idma = -1;

    private icycle = 0;

    private opcodes: (()=>void)[] = [];
    public constructor(public memory: Memory) {
        this.opcodes[105] = () => this.op0x69();
this.opcodes[101] = () => this.op0x65();
this.opcodes[117] = () => this.op0x75();
this.opcodes[109] = () => this.op0x6d();
this.opcodes[125] = () => this.op0x7d();
this.opcodes[121] = () => this.op0x79();
this.opcodes[97] = () => this.op0x61();
this.opcodes[113] = () => this.op0x71();
this.opcodes[41] = () => this.op0x29();
this.opcodes[37] = () => this.op0x25();
this.opcodes[53] = () => this.op0x35();
this.opcodes[45] = () => this.op0x2d();
this.opcodes[61] = () => this.op0x3d();
this.opcodes[57] = () => this.op0x39();
this.opcodes[33] = () => this.op0x21();
this.opcodes[49] = () => this.op0x31();
this.opcodes[10] = () => this.op0xa();
this.opcodes[6] = () => this.op0x6();
this.opcodes[22] = () => this.op0x16();
this.opcodes[14] = () => this.op0xe();
this.opcodes[30] = () => this.op0x1e();
this.opcodes[144] = () => this.op0x90();
this.opcodes[176] = () => this.op0xb0();
this.opcodes[240] = () => this.op0xf0();
this.opcodes[48] = () => this.op0x30();
this.opcodes[208] = () => this.op0xd0();
this.opcodes[16] = () => this.op0x10();
this.opcodes[80] = () => this.op0x50();
this.opcodes[112] = () => this.op0x70();
this.opcodes[36] = () => this.op0x24();
this.opcodes[44] = () => this.op0x2c();
this.opcodes[24] = () => this.op0x18();
this.opcodes[216] = () => this.op0xd8();
this.opcodes[88] = () => this.op0x58();
this.opcodes[184] = () => this.op0xb8();
this.opcodes[201] = () => this.op0xc9();
this.opcodes[197] = () => this.op0xc5();
this.opcodes[213] = () => this.op0xd5();
this.opcodes[205] = () => this.op0xcd();
this.opcodes[221] = () => this.op0xdd();
this.opcodes[217] = () => this.op0xd9();
this.opcodes[193] = () => this.op0xc1();
this.opcodes[209] = () => this.op0xd1();
this.opcodes[224] = () => this.op0xe0();
this.opcodes[228] = () => this.op0xe4();
this.opcodes[236] = () => this.op0xec();
this.opcodes[192] = () => this.op0xc0();
this.opcodes[196] = () => this.op0xc4();
this.opcodes[204] = () => this.op0xcc();
this.opcodes[198] = () => this.op0xc6();
this.opcodes[214] = () => this.op0xd6();
this.opcodes[206] = () => this.op0xce();
this.opcodes[222] = () => this.op0xde();
this.opcodes[202] = () => this.op0xca();
this.opcodes[136] = () => this.op0x88();
this.opcodes[230] = () => this.op0xe6();
this.opcodes[246] = () => this.op0xf6();
this.opcodes[238] = () => this.op0xee();
this.opcodes[254] = () => this.op0xfe();
this.opcodes[232] = () => this.op0xe8();
this.opcodes[200] = () => this.op0xc8();
this.opcodes[73] = () => this.op0x49();
this.opcodes[69] = () => this.op0x45();
this.opcodes[85] = () => this.op0x55();
this.opcodes[77] = () => this.op0x4d();
this.opcodes[93] = () => this.op0x5d();
this.opcodes[89] = () => this.op0x59();
this.opcodes[65] = () => this.op0x41();
this.opcodes[81] = () => this.op0x51();
this.opcodes[76] = () => this.op0x4c();
this.opcodes[108] = () => this.op0x6c();
this.opcodes[169] = () => this.op0xa9();
this.opcodes[165] = () => this.op0xa5();
this.opcodes[181] = () => this.op0xb5();
this.opcodes[173] = () => this.op0xad();
this.opcodes[189] = () => this.op0xbd();
this.opcodes[185] = () => this.op0xb9();
this.opcodes[161] = () => this.op0xa1();
this.opcodes[177] = () => this.op0xb1();
this.opcodes[162] = () => this.op0xa2();
this.opcodes[166] = () => this.op0xa6();
this.opcodes[182] = () => this.op0xb6();
this.opcodes[174] = () => this.op0xae();
this.opcodes[190] = () => this.op0xbe();
this.opcodes[160] = () => this.op0xa0();
this.opcodes[164] = () => this.op0xa4();
this.opcodes[180] = () => this.op0xb4();
this.opcodes[172] = () => this.op0xac();
this.opcodes[188] = () => this.op0xbc();
this.opcodes[74] = () => this.op0x4a();
this.opcodes[70] = () => this.op0x46();
this.opcodes[86] = () => this.op0x56();
this.opcodes[78] = () => this.op0x4e();
this.opcodes[94] = () => this.op0x5e();
this.opcodes[234] = () => this.op0xea();
this.opcodes[9] = () => this.op0x9();
this.opcodes[5] = () => this.op0x5();
this.opcodes[21] = () => this.op0x15();
this.opcodes[13] = () => this.op0xd();
this.opcodes[29] = () => this.op0x1d();
this.opcodes[25] = () => this.op0x19();
this.opcodes[1] = () => this.op0x1();
this.opcodes[17] = () => this.op0x11();
this.opcodes[72] = () => this.op0x48();
this.opcodes[8] = () => this.op0x8();
this.opcodes[104] = () => this.op0x68();
this.opcodes[40] = () => this.op0x28();
this.opcodes[42] = () => this.op0x2a();
this.opcodes[38] = () => this.op0x26();
this.opcodes[54] = () => this.op0x36();
this.opcodes[46] = () => this.op0x2e();
this.opcodes[62] = () => this.op0x3e();
this.opcodes[106] = () => this.op0x6a();
this.opcodes[102] = () => this.op0x66();
this.opcodes[118] = () => this.op0x76();
this.opcodes[110] = () => this.op0x6e();
this.opcodes[126] = () => this.op0x7e();
this.opcodes[0] = () => this.op0x0();
this.opcodes[64] = () => this.op0x40();
this.opcodes[233] = () => this.op0xe9();
this.opcodes[229] = () => this.op0xe5();
this.opcodes[245] = () => this.op0xf5();
this.opcodes[237] = () => this.op0xed();
this.opcodes[253] = () => this.op0xfd();
this.opcodes[249] = () => this.op0xf9();
this.opcodes[225] = () => this.op0xe1();
this.opcodes[241] = () => this.op0xf1();
this.opcodes[56] = () => this.op0x38();
this.opcodes[248] = () => this.op0xf8();
this.opcodes[120] = () => this.op0x78();
this.opcodes[133] = () => this.op0x85();
this.opcodes[149] = () => this.op0x95();
this.opcodes[141] = () => this.op0x8d();
this.opcodes[157] = () => this.op0x9d();
this.opcodes[153] = () => this.op0x99();
this.opcodes[129] = () => this.op0x81();
this.opcodes[145] = () => this.op0x91();
this.opcodes[134] = () => this.op0x86();
this.opcodes[150] = () => this.op0x96();
this.opcodes[142] = () => this.op0x8e();
this.opcodes[132] = () => this.op0x84();
this.opcodes[148] = () => this.op0x94();
this.opcodes[140] = () => this.op0x8c();
this.opcodes[170] = () => this.op0xaa();
this.opcodes[168] = () => this.op0xa8();
this.opcodes[186] = () => this.op0xba();
this.opcodes[138] = () => this.op0x8a();
this.opcodes[154] = () => this.op0x9a();
this.opcodes[152] = () => this.op0x98();
this.opcodes[32] = () => this.op0x20();
this.opcodes[96] = () => this.op0x60();
this.opcodes[26] = () => this.op0x1a();
this.opcodes[58] = () => this.op0x3a();
this.opcodes[90] = () => this.op0x5a();
this.opcodes[122] = () => this.op0x7a();
this.opcodes[218] = () => this.op0xda();
this.opcodes[250] = () => this.op0xfa();
this.opcodes[4] = () => this.op0x4();
this.opcodes[20] = () => this.op0x14();
this.opcodes[52] = () => this.op0x34();
this.opcodes[68] = () => this.op0x44();
this.opcodes[84] = () => this.op0x54();
this.opcodes[116] = () => this.op0x74();
this.opcodes[212] = () => this.op0xd4();
this.opcodes[244] = () => this.op0xf4();
this.opcodes[100] = () => this.op0x64();
this.opcodes[128] = () => this.op0x80();
this.opcodes[130] = () => this.op0x82();
this.opcodes[194] = () => this.op0xc2();
this.opcodes[226] = () => this.op0xe2();
this.opcodes[137] = () => this.op0x89();
this.opcodes[12] = () => this.op0xc();
this.opcodes[28] = () => this.op0x1c();
this.opcodes[60] = () => this.op0x3c();
this.opcodes[92] = () => this.op0x5c();
this.opcodes[124] = () => this.op0x7c();
this.opcodes[220] = () => this.op0xdc();
this.opcodes[252] = () => this.op0xfc();
this.opcodes[235] = () => this.op0xeb();
this.opcodes[195] = () => this.op0xc3();
this.opcodes[199] = () => this.op0xc7();
this.opcodes[207] = () => this.op0xcf();
this.opcodes[211] = () => this.op0xd3();
this.opcodes[215] = () => this.op0xd7();
this.opcodes[219] = () => this.op0xdb();
this.opcodes[223] = () => this.op0xdf();
this.opcodes[227] = () => this.op0xe3();
this.opcodes[231] = () => this.op0xe7();
this.opcodes[239] = () => this.op0xef();
this.opcodes[243] = () => this.op0xf3();
this.opcodes[247] = () => this.op0xf7();
this.opcodes[251] = () => this.op0xfb();
this.opcodes[255] = () => this.op0xff();
this.opcodes[171] = () => this.op0xab();
this.opcodes[167] = () => this.op0xa7();
this.opcodes[183] = () => this.op0xb7();
this.opcodes[175] = () => this.op0xaf();
this.opcodes[191] = () => this.op0xbf();
this.opcodes[163] = () => this.op0xa3();
this.opcodes[179] = () => this.op0xb3();
this.opcodes[131] = () => this.op0x83();
this.opcodes[135] = () => this.op0x87();
this.opcodes[143] = () => this.op0x8f();
this.opcodes[151] = () => this.op0x97();
this.opcodes[3] = () => this.op0x3();
this.opcodes[7] = () => this.op0x7();
this.opcodes[15] = () => this.op0xf();
this.opcodes[19] = () => this.op0x13();
this.opcodes[23] = () => this.op0x17();
this.opcodes[27] = () => this.op0x1b();
this.opcodes[31] = () => this.op0x1f();
this.opcodes[35] = () => this.op0x23();
this.opcodes[39] = () => this.op0x27();
this.opcodes[47] = () => this.op0x2f();
this.opcodes[51] = () => this.op0x33();
this.opcodes[55] = () => this.op0x37();
this.opcodes[59] = () => this.op0x3b();
this.opcodes[63] = () => this.op0x3f();
this.opcodes[99] = () => this.op0x63();
this.opcodes[103] = () => this.op0x67();
this.opcodes[111] = () => this.op0x6f();
this.opcodes[115] = () => this.op0x73();
this.opcodes[119] = () => this.op0x77();
this.opcodes[123] = () => this.op0x7b();
this.opcodes[127] = () => this.op0x7f();
this.opcodes[67] = () => this.op0x43();
this.opcodes[71] = () => this.op0x47();
this.opcodes[79] = () => this.op0x4f();
this.opcodes[83] = () => this.op0x53();
this.opcodes[87] = () => this.op0x57();
this.opcodes[91] = () => this.op0x5b();
this.opcodes[95] = () => this.op0x5f();
this.opcodes[11] = () => this.op0xb();
this.opcodes[43] = () => this.op0x2b();
this.opcodes[75] = () => this.op0x4b();
this.opcodes[107] = () => this.op0x6b();
this.opcodes[203] = () => this.op0xcb();
this.opcodes[156] = () => this.op0x9c();
this.opcodes[158] = () => this.op0x9e();
this.opcodes[139] = () => this.op0x8b();
this.opcodes[147] = () => this.op0x93();
this.opcodes[155] = () => this.op0x9b();
this.opcodes[159] = () => this.op0x9f();
this.opcodes[187] = () => this.op0xbb();

    }

    public dma(addrDma:number) {
        this.dmaRequested = true;
        this.addrDma = addrDma;
    }

    private pollInterrupts() {
        if (this.nmiDetected) {
            this.nmiRequested = true;
            this.nmiDetected = false;
            //console.log('nmi Requested');
        }
        if (this.irqDetected) {
            //console.log('irq requested');
            this.irqRequested = true;
        }
    }

    private detectInterrupts() {

        if (this.nmiLinePrev === 1 && this.nmiLine === 0) {
            this.nmiDetected = true;
        }
        this.nmiLinePrev = this.nmiLine;
        this.irqDetected = !this.irqLine && !this.flgInterruptDisable;
    }
 
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

    public trace(opcode){
    
    }
   
    public clk() {
        this.icycle++;
        if (this.dmaRequested) {
            this.dmaRequested = false;
            this.idma = 513 + (this.icycle % 2);
            return;
        } else if (this.idma > 0) {
            if (this.idma === 514 || this.idma === 513) {
                //nop
            } else if (!(this.idma & 1)) {
                this.bDma = this.memory.getByte(this.addrDma ++);
                this.addrDma &= 0xffff;
            } else {
                this.memory.setByte(0x2004, this.bDma);
            }
            this.idma--;
            return;
        }

        if (this.t === 0) {

            if (this.nmiRequested || this.irqRequested) {
                this.canSetFlgBreak = false;
                //console.log('processing irq/nmi');
                this.enablePCIncrement = false;
                this.opcode = 0;
            } else {
                this.opcode = this.memory.getByte(this.ip);
            }
            this.ipCur = this.ip;
            this.trace(this.opcode);
    
            this.addr = this.addrHi = this.addrLo = this.addrPtr = this.ptrLo = this.ptrHi = this.ipC = this.addrC = 0;
        }

        this.opcodes[this.opcode]();


        if (this.t === 0 && this.opcode !== 0x0) {
            if (this.enableInterruptPoll)
                this.pollInterrupts();
            this.enableInterruptPoll = true;
        }

        this.detectInterrupts();
    }
op0x69() /* ADC Immediate 2 */ {
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
}
op0x65() /* ADC ZeroPage 3 */ {
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
}
op0x75() /* ADC ZeroPageX 4 */ {
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
}
op0x6d() /* ADC Absolute 4 */ {
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
}
op0x7d() /* ADC AbsoluteX 4pc  */ {
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
}
op0x79() /* ADC AbsoluteY 4pc  */ {
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
}
op0x61() /* ADC IndirectX 6 */ {
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
}
op0x71() /* ADC IndirectY 5pc  */ {
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
}
op0x29() /* AND Immediate 2 */ {
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
}
op0x25() /* AND ZeroPage 3 */ {
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
}
op0x35() /* AND ZeroPageX 4 */ {
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
}
op0x2d() /* AND Absolute 4 */ {
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
}
op0x3d() /* AND AbsoluteX 4pc  */ {
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
            } else {
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
}
op0x39() /* AND AbsoluteY 4pc  */ {
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
            } else {
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
}
op0x21() /* AND IndirectX 6 */ {
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
}
op0x31() /* AND IndirectY 5pc  */ {
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
            } else {
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
}
op0xa() /* ASL Accumulator 2 */ {
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
}
op0x6() /* ASL ZeroPage 5 */ {
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
}
op0x16() /* ASL ZeroPageX 6 */ {
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
}
op0xe() /* ASL Absolute 6 */ {
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
}
op0x1e() /* ASL AbsoluteX 7 */ {
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
}
op0x90() /* BCC Relative 2pc bc  */ {
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
            } else {
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
            } else {
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
}
op0xb0() /* BCS Relative 2pc bc  */ {
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
            } else {
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
            } else {
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
}
op0xf0() /* BEQ Relative 2pc bc  */ {
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
            } else {
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
            } else {
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
}
op0x30() /* BMI Relative 2pc bc  */ {
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
            } else {
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
            } else {
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
}
op0xd0() /* BNE Relative 2pc bc  */ {
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
            } else {
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
            } else {
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
}
op0x10() /* BPL Relative 2pc bc  */ {
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
            } else {
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
            } else {
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
}
op0x50() /* BVC Relative 2pc bc  */ {
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
            } else {
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
            } else {
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
}
op0x70() /* BVS Relative 2pc bc  */ {
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
            } else {
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
            } else {
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
}
op0x24() /* BIT ZeroPage 3 */ {
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
}
op0x2c() /* BIT Absolute 4 */ {
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
}
op0x18() /* CLC Implied 2 */ {
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
}
op0xd8() /* CLD Implied 2 */ {
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
}
op0x58() /* CLI Implied 2 */ {
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
}
op0xb8() /* CLV Implied 2 */ {
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
}
op0xc9() /* CMP Immediate 2 */ {
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
}
op0xc5() /* CMP ZeroPage 3 */ {
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
}
op0xd5() /* CMP ZeroPageX 4 */ {
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
}
op0xcd() /* CMP Absolute 4 */ {
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
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
}
op0xdd() /* CMP AbsoluteX 4pc  */ {
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
            } else {
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero =  this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
            }
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
}
op0xd9() /* CMP AbsoluteY 4pc  */ {
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
            } else {
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero =  this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
            }
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
}
op0xc1() /* CMP IndirectX 6 */ {
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
            this.flgZero =  this.rA === this.b ? 1 : 0;
            this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
}
op0xd1() /* CMP IndirectY 5pc  */ {
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
            } else {
                this.flgCarry = this.rA >= this.b ? 1 : 0;
                this.flgZero =  this.rA === this.b ? 1 : 0;
                this.flgNegative = (this.rA - this.b) & 128 ? 1 : 0;
                this.t = 0;
            }
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
}
op0xe0() /* CPX Immediate 2 */ {
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
}
op0xe4() /* CPX ZeroPage 3 */ {
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
}
op0xec() /* CPX Absolute 4 */ {
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
            this.flgZero =  this.rX === this.b ? 1 : 0;
            this.flgNegative = (this.rX - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
}
op0xc0() /* CPY Immediate 2 */ {
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
}
op0xc4() /* CPY ZeroPage 3 */ {
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
}
op0xcc() /* CPY Absolute 4 */ {
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
            this.flgZero =  this.rY === this.b ? 1 : 0;
            this.flgNegative = (this.rY - this.b) & 128 ? 1 : 0;
            this.t = 0;
            break;
        }
    }
}
op0xc6() /* DEC ZeroPage 5 */ {
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
}
op0xd6() /* DEC ZeroPageX 6 */ {
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
}
op0xce() /* DEC Absolute 6 */ {
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
}
op0xde() /* DEC AbsoluteX 7 */ {
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
}
op0xca() /* DEX Accumulator 2 */ {
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
}
op0x88() /* DEY Accumulator 2 */ {
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
}
op0xe6() /* INC ZeroPage 5 */ {
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
}
op0xf6() /* INC ZeroPageX 6 */ {
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
}
op0xee() /* INC Absolute 6 */ {
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
}
op0xfe() /* INC AbsoluteX 7 */ {
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
}
op0xe8() /* INX Accumulator 2 */ {
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
}
op0xc8() /* INY Accumulator 2 */ {
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
}
op0x49() /* EOR Immediate 2 */ {
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
}
op0x45() /* EOR ZeroPage 3 */ {
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
}
op0x55() /* EOR ZeroPageX 4 */ {
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
}
op0x4d() /* EOR Absolute 4 */ {
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
}
op0x5d() /* EOR AbsoluteX 4pc  */ {
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
            } else {
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
}
op0x59() /* EOR AbsoluteY 4pc  */ {
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
            } else {
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
}
op0x41() /* EOR IndirectX 6 */ {
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
}
op0x51() /* EOR IndirectY 5pc  */ {
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
            } else {
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
}
op0x4c() /* JMP Absolute 3 */ {
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
}
op0x6c() /* JMP AbsoluteIndirect 5 */ {
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
}
op0xa9() /* LDA Immediate 2 */ {
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
}
op0xa5() /* LDA ZeroPage 3 */ {
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
}
op0xb5() /* LDA ZeroPageX 4 */ {
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
}
op0xad() /* LDA Absolute 4 */ {
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
}
op0xbd() /* LDA AbsoluteX 4pc  */ {
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
            } else {
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
}
op0xb9() /* LDA AbsoluteY 4pc  */ {
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
            } else {
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
}
op0xa1() /* LDA IndirectX 6 */ {
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
}
op0xb1() /* LDA IndirectY 5pc  */ {
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
            } else {
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
}
op0xa2() /* LDX Immediate 2 */ {
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
}
op0xa6() /* LDX ZeroPage 3 */ {
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
}
op0xb6() /* LDX ZeroPageY 4 */ {
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
}
op0xae() /* LDX Absolute 4 */ {
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
}
op0xbe() /* LDX AbsoluteY 4pc  */ {
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
            } else {
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
}
op0xa0() /* LDY Immediate 2 */ {
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
}
op0xa4() /* LDY ZeroPage 3 */ {
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
}
op0xb4() /* LDY ZeroPageX 4 */ {
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
}
op0xac() /* LDY Absolute 4 */ {
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
}
op0xbc() /* LDY AbsoluteX 4pc  */ {
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
            } else {
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
}
op0x4a() /* LSR Accumulator 2 */ {
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
}
op0x46() /* LSR ZeroPage 5 */ {
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
}
op0x56() /* LSR ZeroPageX 6 */ {
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
}
op0x4e() /* LSR Absolute 6 */ {
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
}
op0x5e() /* LSR AbsoluteX 7 */ {
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
}
op0xea() /* NOP Implied 2 */ {
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
}
op0x9() /* ORA Immediate 2 */ {
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
}
op0x5() /* ORA ZeroPage 3 */ {
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
}
op0x15() /* ORA ZeroPageX 4 */ {
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
}
op0xd() /* ORA Absolute 4 */ {
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
}
op0x1d() /* ORA AbsoluteX 4pc  */ {
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
            } else {
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
}
op0x19() /* ORA AbsoluteY 4pc  */ {
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
            } else {
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
}
op0x1() /* ORA IndirectX 6 */ {
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
}
op0x11() /* ORA IndirectY 5pc  */ {
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
            } else {
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
}
op0x48() /* PHA Implied 3 */ {
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
}
op0x8() /* PHP Implied 3 */ {
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
}
op0x68() /* PLA Implied 4 */ {
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
}
op0x28() /* PLP Implied 4 */ {
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
}
op0x2a() /* ROL Accumulator 2 */ {
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
}
op0x26() /* ROL ZeroPage 5 */ {
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
}
op0x36() /* ROL ZeroPageX 6 */ {
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
}
op0x2e() /* ROL Absolute 6 */ {
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
}
op0x3e() /* ROL AbsoluteX 7 */ {
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
}
op0x6a() /* ROR Accumulator 2 */ {
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
}
op0x66() /* ROR ZeroPage 5 */ {
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
}
op0x76() /* ROR ZeroPageX 6 */ {
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
}
op0x6e() /* ROR Absolute 6 */ {
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
}
op0x7e() /* ROR AbsoluteX 7 */ {
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
}
op0x0() /* BRK BRK 7 */ {
    switch (this.t) {
        case 0: {
            if(this.enablePCIncrement) this.ip++;
            this.t++;
            break;
        }
        case 1: {
            this.memory.getByte(this.ip);
            if(this.enablePCIncrement) this.ip++;
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
            if (this.canSetFlgBreak) this.flgBreakCommand = 1;
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
}
op0x40() /* RTI RTI 6 */ {
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
}
op0xe9() /* SBC Immediate 2 */ {
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
}
op0xe5() /* SBC ZeroPage 3 */ {
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
}
op0xf5() /* SBC ZeroPageX 4 */ {
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
}
op0xed() /* SBC Absolute 4 */ {
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
}
op0xfd() /* SBC AbsoluteX 4pc  */ {
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
}
op0xf9() /* SBC AbsoluteY 4pc  */ {
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
}
op0xe1() /* SBC IndirectX 6 */ {
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
}
op0xf1() /* SBC IndirectY 5pc  */ {
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
}
op0x38() /* SEC Implied 2 */ {
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
}
op0xf8() /* SED Implied 2 */ {
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
}
op0x78() /* SEI Implied 2 */ {
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
}
op0x85() /* STA ZeroPage 3 */ {
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
}
op0x95() /* STA ZeroPageX 4 */ {
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
}
op0x8d() /* STA Absolute 4 */ {
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
}
op0x9d() /* STA AbsoluteX 5 */ {
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
}
op0x99() /* STA AbsoluteY 5 */ {
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
}
op0x81() /* STA IndirectX 6 */ {
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
}
op0x91() /* STA IndirectY 6 */ {
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
}
op0x86() /* STX ZeroPage 3 */ {
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
}
op0x96() /* STX ZeroPageY 4 */ {
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
}
op0x8e() /* STX Absolute 4 */ {
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
}
op0x84() /* STY ZeroPage 3 */ {
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
}
op0x94() /* STY ZeroPageX 4 */ {
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
}
op0x8c() /* STY Absolute 4 */ {
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
}
op0xaa() /* TAX Accumulator 2 */ {
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
}
op0xa8() /* TAY Accumulator 2 */ {
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
}
op0xba() /* TSX Accumulator 2 */ {
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
}
op0x8a() /* TXA Accumulator 2 */ {
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
}
op0x9a() /* TXS Accumulator 2 */ {
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
}
op0x98() /* TYA Accumulator 2 */ {
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
}
op0x20() /* JSR JSR 6 */ {
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
}
op0x60() /* RTS RTS 6 */ {
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
}
op0x1a() /* NOP Implied 2 */ {
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
}
op0x3a() /* NOP Implied 2 */ {
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
}
op0x5a() /* NOP Implied 2 */ {
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
}
op0x7a() /* NOP Implied 2 */ {
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
}
op0xda() /* NOP Implied 2 */ {
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
}
op0xfa() /* NOP Implied 2 */ {
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
}
op0x4() /* NOP ZeroPage 3 */ {
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
}
op0x14() /* NOP ZeroPageX 4 */ {
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
}
op0x34() /* NOP ZeroPageX 4 */ {
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
}
op0x44() /* NOP ZeroPage 3 */ {
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
}
op0x54() /* NOP ZeroPageX 4 */ {
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
}
op0x74() /* NOP ZeroPageX 4 */ {
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
}
op0xd4() /* NOP ZeroPageX 4 */ {
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
}
op0xf4() /* NOP ZeroPageX 4 */ {
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
}
op0x64() /* NOP ZeroPage 3 */ {
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
}
op0x80() /* NOP Immediate 2 */ {
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
}
op0x82() /* NOP Immediate 2 */ {
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
}
op0xc2() /* NOP Immediate 2 */ {
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
}
op0xe2() /* NOP Immediate 2 */ {
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
}
op0x89() /* NOP Immediate 2 */ {
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
}
op0xc() /* NOP Absolute 4 */ {
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
}
op0x1c() /* NOP AbsoluteX 4pc  */ {
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
            } else {
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
}
op0x3c() /* NOP AbsoluteX 4pc  */ {
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
            } else {
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
}
op0x5c() /* NOP AbsoluteX 4pc  */ {
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
            } else {
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
}
op0x7c() /* NOP AbsoluteX 4pc  */ {
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
            } else {
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
}
op0xdc() /* NOP AbsoluteX 4pc  */ {
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
            } else {
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
}
op0xfc() /* NOP AbsoluteX 4pc  */ {
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
            } else {
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
}
op0xeb() /* SBC Immediate 2 */ {
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
}
op0xc3() /* DCP IndirectX 8 */ {
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
}
op0xc7() /* DCP ZeroPage 5 */ {
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
}
op0xcf() /* DCP Absolute 6 */ {
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
}
op0xd3() /* DCP IndirectY 8 */ {
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
}
op0xd7() /* DCP ZeroPageX 6 */ {
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
}
op0xdb() /* DCP AbsoluteY 7 */ {
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
}
op0xdf() /* DCP AbsoluteX 7 */ {
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
}
op0xe3() /* ISC IndirectX 8 */ {
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
}
op0xe7() /* ISC ZeroPage 5 */ {
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
}
op0xef() /* ISC Absolute 6 */ {
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
}
op0xf3() /* ISC IndirectY 8 */ {
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
}
op0xf7() /* ISC ZeroPageX 6 */ {
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
}
op0xfb() /* ISC AbsoluteY 7 */ {
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
}
op0xff() /* ISC AbsoluteX 7 */ {
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
}
op0xab() /* LAX Immediate 2 */ {
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
}
op0xa7() /* LAX ZeroPage 3 */ {
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
}
op0xb7() /* LAX ZeroPageY 4 */ {
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
}
op0xaf() /* LAX Absolute 4 */ {
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
}
op0xbf() /* LAX AbsoluteY 4pc  */ {
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
            } else {
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
}
op0xa3() /* LAX IndirectX 6 */ {
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
}
op0xb3() /* LAX IndirectY 5pc  */ {
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
            } else {
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
}
op0x83() /* SAX IndirectX 6 */ {
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
}
op0x87() /* SAX ZeroPage 3 */ {
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
}
op0x8f() /* SAX Absolute 4 */ {
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
}
op0x97() /* SAX ZeroPageY 4 */ {
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
}
op0x3() /* SLO IndirectX 8 */ {
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
}
op0x7() /* SLO ZeroPage 5 */ {
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
}
op0xf() /* SLO Absolute 6 */ {
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
}
op0x13() /* SLO IndirectY 8 */ {
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
}
op0x17() /* SLO ZeroPageX 6 */ {
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
}
op0x1b() /* SLO AbsoluteY 7 */ {
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
}
op0x1f() /* SLO AbsoluteX 7 */ {
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
}
op0x23() /* RLA IndirectX 8 */ {
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
}
op0x27() /* RLA ZeroPage 5 */ {
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
}
op0x2f() /* RLA Absolute 6 */ {
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
}
op0x33() /* RLA IndirectY 8 */ {
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
}
op0x37() /* RLA ZeroPageX 6 */ {
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
}
op0x3b() /* RLA AbsoluteY 7 */ {
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
}
op0x3f() /* RLA AbsoluteX 7 */ {
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
}
op0x63() /* RRA IndirectX 8 */ {
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
}
op0x67() /* RRA ZeroPage 5 */ {
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
}
op0x6f() /* RRA Absolute 6 */ {
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
}
op0x73() /* RRA IndirectY 8 */ {
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
}
op0x77() /* RRA ZeroPageX 6 */ {
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
}
op0x7b() /* RRA AbsoluteY 7 */ {
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
}
op0x7f() /* RRA AbsoluteX 7 */ {
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
}
op0x43() /* SRE IndirectX 8 */ {
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
}
op0x47() /* SRE ZeroPage 5 */ {
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
}
op0x4f() /* SRE Absolute 6 */ {
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
}
op0x53() /* SRE IndirectY 8 */ {
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
}
op0x57() /* SRE ZeroPageX 6 */ {
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
}
op0x5b() /* SRE AbsoluteY 7 */ {
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
}
op0x5f() /* SRE AbsoluteX 7 */ {
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
}
op0xb() /* ANC Immediate 2 */ {
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
}
op0x2b() /* ANC Immediate 2 */ {
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
}
op0x4b() /* ALR Immediate 2 */ {
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
}
op0x6b() /* ARR Immediate 2 */ {
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
}
op0xcb() /* AXS Immediate 2 */ {
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
            this.b = res & 0xff;
            this.flgNegative = (this.b & 128) !== 0 ? 1 : 0;
            this.flgCarry = res > 255 ? 1 : 0;
            this.flgZero = this.b === 0 ? 1 : 0;
            this.rX = this.b;
            this.t = 0;
            break;
        }
    }
}
op0x9c() /* SYA AbsoluteX 5 */ {
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
}
op0x9e() /* SXA AbsoluteY 5 */ {
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
}
op0x8b() /* XAA Immediate 2 */ {
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
}
op0x93() /* AXA IndirectY 6 */ {
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
}
op0x9b() /* XAS AbsoluteY 5 */ {
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
}
op0x9f() /* AXA AbsoluteY 5 */ {
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
}
op0xbb() /* LAR AbsoluteY 4pc  */ {
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
            } else {
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
}

    public opcodeToMnemonic(opcode:number){
        if(opcode === 105) return 'ADC Immediate';
if(opcode === 101) return 'ADC ZeroPage';
if(opcode === 117) return 'ADC ZeroPageX';
if(opcode === 109) return 'ADC Absolute';
if(opcode === 125) return 'ADC AbsoluteX';
if(opcode === 121) return 'ADC AbsoluteY';
if(opcode === 97) return 'ADC IndirectX';
if(opcode === 113) return 'ADC IndirectY';
if(opcode === 41) return 'AND Immediate';
if(opcode === 37) return 'AND ZeroPage';
if(opcode === 53) return 'AND ZeroPageX';
if(opcode === 45) return 'AND Absolute';
if(opcode === 61) return 'AND AbsoluteX';
if(opcode === 57) return 'AND AbsoluteY';
if(opcode === 33) return 'AND IndirectX';
if(opcode === 49) return 'AND IndirectY';
if(opcode === 10) return 'ASL Accumulator';
if(opcode === 6) return 'ASL ZeroPage';
if(opcode === 22) return 'ASL ZeroPageX';
if(opcode === 14) return 'ASL Absolute';
if(opcode === 30) return 'ASL AbsoluteX';
if(opcode === 144) return 'BCC Relative';
if(opcode === 176) return 'BCS Relative';
if(opcode === 240) return 'BEQ Relative';
if(opcode === 48) return 'BMI Relative';
if(opcode === 208) return 'BNE Relative';
if(opcode === 16) return 'BPL Relative';
if(opcode === 80) return 'BVC Relative';
if(opcode === 112) return 'BVS Relative';
if(opcode === 36) return 'BIT ZeroPage';
if(opcode === 44) return 'BIT Absolute';
if(opcode === 24) return 'CLC Implied';
if(opcode === 216) return 'CLD Implied';
if(opcode === 88) return 'CLI Implied';
if(opcode === 184) return 'CLV Implied';
if(opcode === 201) return 'CMP Immediate';
if(opcode === 197) return 'CMP ZeroPage';
if(opcode === 213) return 'CMP ZeroPageX';
if(opcode === 205) return 'CMP Absolute';
if(opcode === 221) return 'CMP AbsoluteX';
if(opcode === 217) return 'CMP AbsoluteY';
if(opcode === 193) return 'CMP IndirectX';
if(opcode === 209) return 'CMP IndirectY';
if(opcode === 224) return 'CPX Immediate';
if(opcode === 228) return 'CPX ZeroPage';
if(opcode === 236) return 'CPX Absolute';
if(opcode === 192) return 'CPY Immediate';
if(opcode === 196) return 'CPY ZeroPage';
if(opcode === 204) return 'CPY Absolute';
if(opcode === 198) return 'DEC ZeroPage';
if(opcode === 214) return 'DEC ZeroPageX';
if(opcode === 206) return 'DEC Absolute';
if(opcode === 222) return 'DEC AbsoluteX';
if(opcode === 202) return 'DEX Accumulator';
if(opcode === 136) return 'DEY Accumulator';
if(opcode === 230) return 'INC ZeroPage';
if(opcode === 246) return 'INC ZeroPageX';
if(opcode === 238) return 'INC Absolute';
if(opcode === 254) return 'INC AbsoluteX';
if(opcode === 232) return 'INX Accumulator';
if(opcode === 200) return 'INY Accumulator';
if(opcode === 73) return 'EOR Immediate';
if(opcode === 69) return 'EOR ZeroPage';
if(opcode === 85) return 'EOR ZeroPageX';
if(opcode === 77) return 'EOR Absolute';
if(opcode === 93) return 'EOR AbsoluteX';
if(opcode === 89) return 'EOR AbsoluteY';
if(opcode === 65) return 'EOR IndirectX';
if(opcode === 81) return 'EOR IndirectY';
if(opcode === 76) return 'JMP Absolute';
if(opcode === 108) return 'JMP AbsoluteIndirect';
if(opcode === 169) return 'LDA Immediate';
if(opcode === 165) return 'LDA ZeroPage';
if(opcode === 181) return 'LDA ZeroPageX';
if(opcode === 173) return 'LDA Absolute';
if(opcode === 189) return 'LDA AbsoluteX';
if(opcode === 185) return 'LDA AbsoluteY';
if(opcode === 161) return 'LDA IndirectX';
if(opcode === 177) return 'LDA IndirectY';
if(opcode === 162) return 'LDX Immediate';
if(opcode === 166) return 'LDX ZeroPage';
if(opcode === 182) return 'LDX ZeroPageY';
if(opcode === 174) return 'LDX Absolute';
if(opcode === 190) return 'LDX AbsoluteY';
if(opcode === 160) return 'LDY Immediate';
if(opcode === 164) return 'LDY ZeroPage';
if(opcode === 180) return 'LDY ZeroPageX';
if(opcode === 172) return 'LDY Absolute';
if(opcode === 188) return 'LDY AbsoluteX';
if(opcode === 74) return 'LSR Accumulator';
if(opcode === 70) return 'LSR ZeroPage';
if(opcode === 86) return 'LSR ZeroPageX';
if(opcode === 78) return 'LSR Absolute';
if(opcode === 94) return 'LSR AbsoluteX';
if(opcode === 234) return 'NOP Implied';
if(opcode === 9) return 'ORA Immediate';
if(opcode === 5) return 'ORA ZeroPage';
if(opcode === 21) return 'ORA ZeroPageX';
if(opcode === 13) return 'ORA Absolute';
if(opcode === 29) return 'ORA AbsoluteX';
if(opcode === 25) return 'ORA AbsoluteY';
if(opcode === 1) return 'ORA IndirectX';
if(opcode === 17) return 'ORA IndirectY';
if(opcode === 72) return 'PHA Implied';
if(opcode === 8) return 'PHP Implied';
if(opcode === 104) return 'PLA Implied';
if(opcode === 40) return 'PLP Implied';
if(opcode === 42) return 'ROL Accumulator';
if(opcode === 38) return 'ROL ZeroPage';
if(opcode === 54) return 'ROL ZeroPageX';
if(opcode === 46) return 'ROL Absolute';
if(opcode === 62) return 'ROL AbsoluteX';
if(opcode === 106) return 'ROR Accumulator';
if(opcode === 102) return 'ROR ZeroPage';
if(opcode === 118) return 'ROR ZeroPageX';
if(opcode === 110) return 'ROR Absolute';
if(opcode === 126) return 'ROR AbsoluteX';
if(opcode === 0) return 'BRK BRK';
if(opcode === 64) return 'RTI RTI';
if(opcode === 233) return 'SBC Immediate';
if(opcode === 229) return 'SBC ZeroPage';
if(opcode === 245) return 'SBC ZeroPageX';
if(opcode === 237) return 'SBC Absolute';
if(opcode === 253) return 'SBC AbsoluteX';
if(opcode === 249) return 'SBC AbsoluteY';
if(opcode === 225) return 'SBC IndirectX';
if(opcode === 241) return 'SBC IndirectY';
if(opcode === 56) return 'SEC Implied';
if(opcode === 248) return 'SED Implied';
if(opcode === 120) return 'SEI Implied';
if(opcode === 133) return 'STA ZeroPage';
if(opcode === 149) return 'STA ZeroPageX';
if(opcode === 141) return 'STA Absolute';
if(opcode === 157) return 'STA AbsoluteX';
if(opcode === 153) return 'STA AbsoluteY';
if(opcode === 129) return 'STA IndirectX';
if(opcode === 145) return 'STA IndirectY';
if(opcode === 134) return 'STX ZeroPage';
if(opcode === 150) return 'STX ZeroPageY';
if(opcode === 142) return 'STX Absolute';
if(opcode === 132) return 'STY ZeroPage';
if(opcode === 148) return 'STY ZeroPageX';
if(opcode === 140) return 'STY Absolute';
if(opcode === 170) return 'TAX Accumulator';
if(opcode === 168) return 'TAY Accumulator';
if(opcode === 186) return 'TSX Accumulator';
if(opcode === 138) return 'TXA Accumulator';
if(opcode === 154) return 'TXS Accumulator';
if(opcode === 152) return 'TYA Accumulator';
if(opcode === 32) return 'JSR JSR';
if(opcode === 96) return 'RTS RTS';
if(opcode === 26) return 'NOP Implied';
if(opcode === 58) return 'NOP Implied';
if(opcode === 90) return 'NOP Implied';
if(opcode === 122) return 'NOP Implied';
if(opcode === 218) return 'NOP Implied';
if(opcode === 250) return 'NOP Implied';
if(opcode === 4) return 'NOP ZeroPage';
if(opcode === 20) return 'NOP ZeroPageX';
if(opcode === 52) return 'NOP ZeroPageX';
if(opcode === 68) return 'NOP ZeroPage';
if(opcode === 84) return 'NOP ZeroPageX';
if(opcode === 116) return 'NOP ZeroPageX';
if(opcode === 212) return 'NOP ZeroPageX';
if(opcode === 244) return 'NOP ZeroPageX';
if(opcode === 100) return 'NOP ZeroPage';
if(opcode === 128) return 'NOP Immediate';
if(opcode === 130) return 'NOP Immediate';
if(opcode === 194) return 'NOP Immediate';
if(opcode === 226) return 'NOP Immediate';
if(opcode === 137) return 'NOP Immediate';
if(opcode === 12) return 'NOP Absolute';
if(opcode === 28) return 'NOP AbsoluteX';
if(opcode === 60) return 'NOP AbsoluteX';
if(opcode === 92) return 'NOP AbsoluteX';
if(opcode === 124) return 'NOP AbsoluteX';
if(opcode === 220) return 'NOP AbsoluteX';
if(opcode === 252) return 'NOP AbsoluteX';
if(opcode === 235) return 'SBC Immediate';
if(opcode === 195) return 'DCP IndirectX';
if(opcode === 199) return 'DCP ZeroPage';
if(opcode === 207) return 'DCP Absolute';
if(opcode === 211) return 'DCP IndirectY';
if(opcode === 215) return 'DCP ZeroPageX';
if(opcode === 219) return 'DCP AbsoluteY';
if(opcode === 223) return 'DCP AbsoluteX';
if(opcode === 227) return 'ISC IndirectX';
if(opcode === 231) return 'ISC ZeroPage';
if(opcode === 239) return 'ISC Absolute';
if(opcode === 243) return 'ISC IndirectY';
if(opcode === 247) return 'ISC ZeroPageX';
if(opcode === 251) return 'ISC AbsoluteY';
if(opcode === 255) return 'ISC AbsoluteX';
if(opcode === 171) return 'LAX Immediate';
if(opcode === 167) return 'LAX ZeroPage';
if(opcode === 183) return 'LAX ZeroPageY';
if(opcode === 175) return 'LAX Absolute';
if(opcode === 191) return 'LAX AbsoluteY';
if(opcode === 163) return 'LAX IndirectX';
if(opcode === 179) return 'LAX IndirectY';
if(opcode === 131) return 'SAX IndirectX';
if(opcode === 135) return 'SAX ZeroPage';
if(opcode === 143) return 'SAX Absolute';
if(opcode === 151) return 'SAX ZeroPageY';
if(opcode === 3) return 'SLO IndirectX';
if(opcode === 7) return 'SLO ZeroPage';
if(opcode === 15) return 'SLO Absolute';
if(opcode === 19) return 'SLO IndirectY';
if(opcode === 23) return 'SLO ZeroPageX';
if(opcode === 27) return 'SLO AbsoluteY';
if(opcode === 31) return 'SLO AbsoluteX';
if(opcode === 35) return 'RLA IndirectX';
if(opcode === 39) return 'RLA ZeroPage';
if(opcode === 47) return 'RLA Absolute';
if(opcode === 51) return 'RLA IndirectY';
if(opcode === 55) return 'RLA ZeroPageX';
if(opcode === 59) return 'RLA AbsoluteY';
if(opcode === 63) return 'RLA AbsoluteX';
if(opcode === 99) return 'RRA IndirectX';
if(opcode === 103) return 'RRA ZeroPage';
if(opcode === 111) return 'RRA Absolute';
if(opcode === 115) return 'RRA IndirectY';
if(opcode === 119) return 'RRA ZeroPageX';
if(opcode === 123) return 'RRA AbsoluteY';
if(opcode === 127) return 'RRA AbsoluteX';
if(opcode === 67) return 'SRE IndirectX';
if(opcode === 71) return 'SRE ZeroPage';
if(opcode === 79) return 'SRE Absolute';
if(opcode === 83) return 'SRE IndirectY';
if(opcode === 87) return 'SRE ZeroPageX';
if(opcode === 91) return 'SRE AbsoluteY';
if(opcode === 95) return 'SRE AbsoluteX';
if(opcode === 11) return 'ANC Immediate';
if(opcode === 43) return 'ANC Immediate';
if(opcode === 75) return 'ALR Immediate';
if(opcode === 107) return 'ARR Immediate';
if(opcode === 203) return 'AXS Immediate';
if(opcode === 156) return 'SYA AbsoluteX';
if(opcode === 158) return 'SXA AbsoluteY';
if(opcode === 139) return 'XAA Immediate';
if(opcode === 147) return 'AXA IndirectY';
if(opcode === 155) return 'XAS AbsoluteY';
if(opcode === 159) return 'AXA AbsoluteY';
if(opcode === 187) return 'LAR AbsoluteY';
return '???';

    }

    public sizeFromOpcode(opcode:number){
        if(opcode === 105) return 2;
if(opcode === 101) return 2;
if(opcode === 117) return 2;
if(opcode === 109) return 3;
if(opcode === 125) return 3;
if(opcode === 121) return 3;
if(opcode === 97) return 2;
if(opcode === 113) return 2;
if(opcode === 41) return 2;
if(opcode === 37) return 2;
if(opcode === 53) return 2;
if(opcode === 45) return 3;
if(opcode === 61) return 3;
if(opcode === 57) return 3;
if(opcode === 33) return 2;
if(opcode === 49) return 2;
if(opcode === 10) return 1;
if(opcode === 6) return 2;
if(opcode === 22) return 2;
if(opcode === 14) return 3;
if(opcode === 30) return 3;
if(opcode === 144) return 2;
if(opcode === 176) return 2;
if(opcode === 240) return 2;
if(opcode === 48) return 2;
if(opcode === 208) return 2;
if(opcode === 16) return 2;
if(opcode === 80) return 2;
if(opcode === 112) return 2;
if(opcode === 36) return 2;
if(opcode === 44) return 3;
if(opcode === 24) return 1;
if(opcode === 216) return 1;
if(opcode === 88) return 1;
if(opcode === 184) return 1;
if(opcode === 201) return 2;
if(opcode === 197) return 2;
if(opcode === 213) return 2;
if(opcode === 205) return 3;
if(opcode === 221) return 3;
if(opcode === 217) return 3;
if(opcode === 193) return 2;
if(opcode === 209) return 2;
if(opcode === 224) return 2;
if(opcode === 228) return 2;
if(opcode === 236) return 3;
if(opcode === 192) return 2;
if(opcode === 196) return 2;
if(opcode === 204) return 3;
if(opcode === 198) return 2;
if(opcode === 214) return 2;
if(opcode === 206) return 3;
if(opcode === 222) return 3;
if(opcode === 202) return 1;
if(opcode === 136) return 1;
if(opcode === 230) return 2;
if(opcode === 246) return 2;
if(opcode === 238) return 3;
if(opcode === 254) return 3;
if(opcode === 232) return 1;
if(opcode === 200) return 1;
if(opcode === 73) return 2;
if(opcode === 69) return 2;
if(opcode === 85) return 2;
if(opcode === 77) return 3;
if(opcode === 93) return 3;
if(opcode === 89) return 3;
if(opcode === 65) return 2;
if(opcode === 81) return 2;
if(opcode === 76) return 3;
if(opcode === 108) return 3;
if(opcode === 169) return 2;
if(opcode === 165) return 2;
if(opcode === 181) return 2;
if(opcode === 173) return 3;
if(opcode === 189) return 3;
if(opcode === 185) return 3;
if(opcode === 161) return 2;
if(opcode === 177) return 2;
if(opcode === 162) return 2;
if(opcode === 166) return 2;
if(opcode === 182) return 2;
if(opcode === 174) return 3;
if(opcode === 190) return 3;
if(opcode === 160) return 2;
if(opcode === 164) return 2;
if(opcode === 180) return 2;
if(opcode === 172) return 3;
if(opcode === 188) return 3;
if(opcode === 74) return 1;
if(opcode === 70) return 2;
if(opcode === 86) return 2;
if(opcode === 78) return 3;
if(opcode === 94) return 3;
if(opcode === 234) return 1;
if(opcode === 9) return 2;
if(opcode === 5) return 2;
if(opcode === 21) return 2;
if(opcode === 13) return 3;
if(opcode === 29) return 3;
if(opcode === 25) return 3;
if(opcode === 1) return 2;
if(opcode === 17) return 2;
if(opcode === 72) return 1;
if(opcode === 8) return 1;
if(opcode === 104) return 1;
if(opcode === 40) return 1;
if(opcode === 42) return 1;
if(opcode === 38) return 2;
if(opcode === 54) return 2;
if(opcode === 46) return 3;
if(opcode === 62) return 3;
if(opcode === 106) return 1;
if(opcode === 102) return 2;
if(opcode === 118) return 2;
if(opcode === 110) return 3;
if(opcode === 126) return 3;
if(opcode === 0) return 2;
if(opcode === 64) return 1;
if(opcode === 233) return 2;
if(opcode === 229) return 2;
if(opcode === 245) return 2;
if(opcode === 237) return 3;
if(opcode === 253) return 3;
if(opcode === 249) return 3;
if(opcode === 225) return 2;
if(opcode === 241) return 2;
if(opcode === 56) return 1;
if(opcode === 248) return 1;
if(opcode === 120) return 1;
if(opcode === 133) return 2;
if(opcode === 149) return 2;
if(opcode === 141) return 3;
if(opcode === 157) return 3;
if(opcode === 153) return 3;
if(opcode === 129) return 2;
if(opcode === 145) return 2;
if(opcode === 134) return 2;
if(opcode === 150) return 2;
if(opcode === 142) return 3;
if(opcode === 132) return 2;
if(opcode === 148) return 2;
if(opcode === 140) return 3;
if(opcode === 170) return 1;
if(opcode === 168) return 1;
if(opcode === 186) return 1;
if(opcode === 138) return 1;
if(opcode === 154) return 1;
if(opcode === 152) return 1;
if(opcode === 32) return 3;
if(opcode === 96) return 2;
if(opcode === 26) return 1;
if(opcode === 58) return 1;
if(opcode === 90) return 1;
if(opcode === 122) return 1;
if(opcode === 218) return 1;
if(opcode === 250) return 1;
if(opcode === 4) return 2;
if(opcode === 20) return 2;
if(opcode === 52) return 2;
if(opcode === 68) return 2;
if(opcode === 84) return 2;
if(opcode === 116) return 2;
if(opcode === 212) return 2;
if(opcode === 244) return 2;
if(opcode === 100) return 2;
if(opcode === 128) return 2;
if(opcode === 130) return 2;
if(opcode === 194) return 2;
if(opcode === 226) return 2;
if(opcode === 137) return 2;
if(opcode === 12) return 3;
if(opcode === 28) return 3;
if(opcode === 60) return 3;
if(opcode === 92) return 3;
if(opcode === 124) return 3;
if(opcode === 220) return 3;
if(opcode === 252) return 3;
if(opcode === 235) return 2;
if(opcode === 195) return 2;
if(opcode === 199) return 2;
if(opcode === 207) return 3;
if(opcode === 211) return 2;
if(opcode === 215) return 2;
if(opcode === 219) return 3;
if(opcode === 223) return 3;
if(opcode === 227) return 2;
if(opcode === 231) return 2;
if(opcode === 239) return 3;
if(opcode === 243) return 2;
if(opcode === 247) return 2;
if(opcode === 251) return 3;
if(opcode === 255) return 3;
if(opcode === 171) return 2;
if(opcode === 167) return 2;
if(opcode === 183) return 2;
if(opcode === 175) return 3;
if(opcode === 191) return 3;
if(opcode === 163) return 2;
if(opcode === 179) return 2;
if(opcode === 131) return 2;
if(opcode === 135) return 2;
if(opcode === 143) return 3;
if(opcode === 151) return 2;
if(opcode === 3) return 2;
if(opcode === 7) return 2;
if(opcode === 15) return 3;
if(opcode === 19) return 2;
if(opcode === 23) return 2;
if(opcode === 27) return 3;
if(opcode === 31) return 3;
if(opcode === 35) return 2;
if(opcode === 39) return 2;
if(opcode === 47) return 3;
if(opcode === 51) return 2;
if(opcode === 55) return 2;
if(opcode === 59) return 3;
if(opcode === 63) return 3;
if(opcode === 99) return 2;
if(opcode === 103) return 2;
if(opcode === 111) return 3;
if(opcode === 115) return 2;
if(opcode === 119) return 2;
if(opcode === 123) return 3;
if(opcode === 127) return 3;
if(opcode === 67) return 2;
if(opcode === 71) return 2;
if(opcode === 79) return 3;
if(opcode === 83) return 2;
if(opcode === 87) return 2;
if(opcode === 91) return 3;
if(opcode === 95) return 3;
if(opcode === 11) return 2;
if(opcode === 43) return 2;
if(opcode === 75) return 2;
if(opcode === 107) return 2;
if(opcode === 203) return 2;
if(opcode === 156) return 3;
if(opcode === 158) return 3;
if(opcode === 139) return 2;
if(opcode === 147) return 2;
if(opcode === 155) return 3;
if(opcode === 159) return 3;
if(opcode === 187) return 3;
return 1;

    }

}
