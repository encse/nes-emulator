///<reference path="Memory.ts"/>
///<reference path="RAM.ts"/>
///<reference path="CompoundMemory.ts"/>
class MMC1 {

    iWrite: number = 0;
    rTemp: number = 0;

    /**
     * $8000-9FFF:  [...C PSMM]
     */
    r0: number = 0;
  
    /** CHR Mode (0=8k mode, 1=4k mode) */
    get C(): number { return (this.r0 >> 4) & 1; }
    /** PRG Size (0=32k mode, 1=16k mode) */
    get P(): number { return (this.r0 >> 3) & 1; }
    /**
     * Slot select:
     *  0 = $C000 swappable, $8000 fixed to page $00 (mode A)
     *  1 = $8000 swappable, $C000 fixed to page $0F (mode B)
     *  This bit is ignored when 'P' is clear (32k mode)
     */
    get S(): number { return (this.r0 >> 2) & 1; }
    /**
     *  Mirroring control:
     *  %00 = 1ScA
     *  %01 = 1ScB
     *  %10 = Vert
     *  %11 = Horz
     */
    get M(): number { return this.r0 & 3; }

    /**
     *  $A000-BFFF:  [...C CCCC]
        CHR Reg 0
     */
    r1: number = 0;
    get CHR0(): number { return this.r1 & 31 ; }

    /**
     *  $C000-DFFF:  [...C CCCC]
     *  CHR Reg 1
     */
    r2: number = 0;
    get CHR1(): number { return this.r1 & 31; }

    /**
     * $E000-FFFF:  [...W PPPP]
     */
    r3: number = 0;
    get PRG0(): number { return this.r3 & 15; }
    /**
     * W = WRAM Disable (0=enabled, 1=disabled)
     * Disabled WRAM cannot be read or written.  Earlier MMC1 versions apparently do not have this bit implemented.
     * Later ones do.
     */
    get W(): number { return (this.r3 >> 4) & 1; }

    memory: CompoundMemory;
    vmemory: CompoundMemory;
    private nametable:CompoundMemory;
    private nametableA:RAM;
    private nametableB:RAM;

    constructor(private PRGBanks: Memory[], private VROMBanks: Memory[]) {
        while (PRGBanks.length < 2)
            PRGBanks.push(new RAM(0x4000));

        while (VROMBanks.length < 2)
            VROMBanks.push(new RAM(0x1000));

        this.memory = new CompoundMemory(
            new RAM(0x8000),
            PRGBanks[0],
            PRGBanks[1]
        );

        this.nametableA = new RAM(0x400);
        this.nametableB = new RAM(0x400);
        this.nametable = new CompoundMemory(this.nametableA, this.nametableB, this.nametableA, this.nametableB);
        
        this.vmemory = new CompoundMemory(
            VROMBanks[0],
            VROMBanks[1],
            this.nametable,
            new RAM(0x1000)
        );

        this.memory.shadowSetter(0x8000, 0xffff, this.setByte.bind(this));
        
    }

    private setByte(addr: number, value: number): void {
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
        } else {
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
    }

    private update() {

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
        } else {
            console.log('chr mode 2:', this.CHR0);
            this.vmemory.rgmemory[0] = this.VROMBanks[this.CHR0];
            this.vmemory.rgmemory[1] = this.VROMBanks[this.CHR1];
        }

        if (this.M === 0) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[1] = this.nametable.rgmemory[2] = this.nametable.rgmemory[3] = this.nametableA;
        } else if (this.M === 1){
            this.nametable.rgmemory[0] = this.nametable.rgmemory[1] = this.nametable.rgmemory[2] = this.nametable.rgmemory[3] = this.nametableB;
        } else if (this.M === 2) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[2] = this.nametableA;
            this.nametable.rgmemory[1] = this.nametable.rgmemory[3] = this.nametableB;
        } else if (this.M === 3) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[2] = this.nametableB;
            this.nametable.rgmemory[1] = this.nametable.rgmemory[3] = this.nametableA;
        }
    }
}