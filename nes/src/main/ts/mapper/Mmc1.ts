import {Mos6502} from "../cpu/Mos6502";
import {CleverRam} from "../memory/CleverRam";
import {CompoundMemory} from "../memory/CompoundMemory";
import {Memory} from "../memory/Memory";
import {Ram} from "../memory/RAM";
import {Rom} from "../memory/ROM";
import {NesImage} from "../NesImage";
import {MemoryMapper} from "./MemoryMapper";
export class Mmc1 implements MemoryMapper {

    public memory: CompoundMemory;
    public vmemory: CompoundMemory;

    private iWrite: number = 0;
    private rTemp: number = 0;

    /*
     * $8000-9FFF:  [...C PSMM]
     */
    private r0: number = 0;

    /* CHR Mode (0=8k mode, 1=4k mode) */
    private get C(): number {
        return (this.r0 >> 4) & 1;
    }

    /* PRG Size (0=32k mode, 1=16k mode) */
    private get P(): number {
        return (this.r0 >> 3) & 1;
    }

    /*
     * Slot select:
     *  0 = $C000 swappable, $8000 fixed to page $00 (mode A)
     *  1 = $8000 swappable, $C000 fixed to page $0F (mode B)
     *  This bit is ignored when 'P' is clear (32k mode)
     */
    private get S(): number {
        return (this.r0 >> 2) & 1;
    }

    /*
     *  Mirroring control:
     *  %00 = 1ScA
     *  %01 = 1ScB
     *  %10 = Vert
     *  %11 = Horz
     */
    private get M(): number {
        return this.r0 & 3;
    }

    /*
     *  $A000-BFFF:  [...C CCCC]
     CHR Reg 0
     */
    private r1: number = 0;

    private get CHR0(): number {
        return this.r1 & 31;
    }

    /*
     *  $C000-DFFF:  [...C CCCC]
     *  CHR Reg 1
     */
    private r2: number = 0;

    private get CHR1(): number {
        return this.r2 & 31;
    }

    /*
     * $E000-FFFF:  [...W PPPP]
     */
    private r3: number = 0;

    private get PRG0(): number {
        return this.r3 & 15;
    }

    /*
     * W = WRAM Disable (0=enabled, 1=disabled)
     * Disabled WRAM cannot be read or written.  Earlier MMC1 versions apparently do not have this bit implemented.
     * Later ones do.
     */
    private get W(): number {
        return (this.r3 >> 4) & 1;
    }

    private nametable: CompoundMemory;
    private nametableA: Ram;
    private nametableB: Ram;
    private PRGBanks: Memory[];
    private CHRBanks: Memory[];

    constructor(nesImage: NesImage) {
        this.PRGBanks = this.splitMemory(nesImage.ROMBanks, 0x4000);
        this.CHRBanks = this.splitMemory(nesImage.VRAMBanks, 0x1000);

        while (this.PRGBanks.length < 2) {
            this.PRGBanks.push(new Ram(0x4000));
        }

        while (this.CHRBanks.length < 2) {
            this.CHRBanks.push(new Ram(0x1000));
        }

        this.memory = new CompoundMemory(
            new CleverRam(0x800, 4),
            new Ram(0x2000),
            new Ram(0x4000),
            this.PRGBanks[0],
            this.PRGBanks[this.PRGBanks.length - 1],
        );

        this.nametableA = new Ram(0x400);
        this.nametableB = new Ram(0x400);
        this.nametable = new CompoundMemory(this.nametableA, this.nametableB, this.nametableA, this.nametableB);

        this.vmemory = new CompoundMemory(
            this.CHRBanks[0],
            this.CHRBanks[1],
            this.nametable,
            new Ram(0x1000),
        );

        this.memory.shadowSetter(0x8000, 0xffff, this.setByte.bind(this));
        this.r0 = 3 << 2;
        this.r1 = 0; // chr0
        this.r2 = 1; // chr1
        this.r3 = 0; // prg1
        this.update();

    }

    public setCpuAndPpu(cpu: Mos6502) {
        // noop
    }

    public clk() {
        // noop
    }

    private setByte(addr: number, value: number): void {
        /* Temporary reg port ($8000-FFFF):
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
        const flgReset = value >> 7;
        const flgData = value & 0x1;
        if (flgReset === 1) {
            this.r0 = 3 << 2;
            this.iWrite = 0;
            this.rTemp = 0;
        } else {
            this.rTemp = (this.rTemp & (0xff - (1 << this.iWrite))) | ((flgData & 1) << this.iWrite);
            this.iWrite++;
            if (this.iWrite === 5) {
                if (addr <= 0x9fff) {
                    this.r0 = this.rTemp;
                } else if (addr <= 0xbfff) {
                    this.r1 = this.rTemp;
                } else if (addr <= 0xdfff) {
                    this.r2 = this.rTemp;
                } else if (addr <= 0xffff) {
                    this.r3 = this.rTemp;
                }
                this.update();

                this.iWrite = 0;
                this.rTemp = 0;
            }
        }
    }

    private update() {

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
        if (this.P === 0) {
            this.memory.rgmemory[3] = this.PRGBanks[this.PRG0 & 0xfe];
            this.memory.rgmemory[4] = this.PRGBanks[this.PRG0 | 1];
        } else if (this.S === 0) {
            this.memory.rgmemory[3] = this.PRGBanks[0];
            this.memory.rgmemory[4] = this.PRGBanks[this.PRG0];
        } else {
            this.memory.rgmemory[3] = this.PRGBanks[this.PRG0];
            this.memory.rgmemory[4] = this.PRGBanks[this.PRGBanks.length - 1];
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
            this.vmemory.rgmemory[0] = this.CHRBanks[this.CHR0 & 0xfe];
            this.vmemory.rgmemory[1] = this.CHRBanks[this.CHR0 | 1];
        } else {
            this.vmemory.rgmemory[0] = this.CHRBanks[this.CHR0];
            this.vmemory.rgmemory[1] = this.CHRBanks[this.CHR1];
        }

        if (this.M === 0) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[1] = this.nametable.rgmemory[2] = this.nametable.rgmemory[3] = this.nametableA;
        } else if (this.M === 1) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[1] = this.nametable.rgmemory[2] = this.nametable.rgmemory[3] = this.nametableB;
        } else if (this.M === 2) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[2] = this.nametableA;
            this.nametable.rgmemory[1] = this.nametable.rgmemory[3] = this.nametableB;
        } else if (this.M === 3) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[1] = this.nametableA;
            this.nametable.rgmemory[2] = this.nametable.rgmemory[3] = this.nametableB;

        }
    }

    private splitMemory(romBanks: Rom[], size: number): Memory[] {
        const result = [];
        for (const rom of romBanks) {
            let i = 0;
            if (rom.size() % size) {
                throw new Error("cannot split memory");
            }
            while (i < rom.size()) {
                result.push(rom.subArray(i, size));
                i += size;
            }
        }
        return result;
    }
}
