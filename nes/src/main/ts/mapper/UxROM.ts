import {IMemoryMapper} from "./IMemoryMapper";
import {CompoundMemory} from "../memory/CompoundMemory";
import {Ram} from "../memory/RAM";
import {Memory} from "../memory/Memory";
import {NesImage} from "../NesImage";
import {CleverRam} from "../memory/CleverRam";
import {Mos6502} from "../cpu/Mos6502";
import {Rom} from "../memory/ROM";
export class UxRom implements IMemoryMapper {

    memory: CompoundMemory;
    vmemory: CompoundMemory;
    private nametable:CompoundMemory;
    private nametableA:Ram;
    private nametableB:Ram;
    private PRGBanks: Memory[];
    private CHRBanks: Memory[];

    constructor(nesImage: NesImage) {
        this.PRGBanks = this.splitMemory(nesImage.ROMBanks, 0x4000);
        this.CHRBanks = [];

        while (this.PRGBanks.length < 2)
            this.PRGBanks.push(new Ram(0x4000));

        while (this.CHRBanks.length < 2)
            this.CHRBanks.push(new Ram(0x1000));

        this.memory = new CompoundMemory(
            new CleverRam(0x800, 4),
            new Ram(0x2000),
            new Ram(0x4000),
            this.PRGBanks[0],
            this.PRGBanks[this.PRGBanks.length - 1]
        );
      

        this.nametableA = new Ram(0x400);
        this.nametableB = new Ram(0x400);
        this.nametable = new CompoundMemory(this.nametableA, this.nametableB, this.nametableA, this.nametableB);

        if (nesImage.fVerticalMirroring) {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[2] = this.nametableA;
            this.nametable.rgmemory[1] = this.nametable.rgmemory[3] = this.nametableB;
        } else {
            this.nametable.rgmemory[0] = this.nametable.rgmemory[1] = this.nametableA;
            this.nametable.rgmemory[2] = this.nametable.rgmemory[3] = this.nametableB;
        }

        this.vmemory = new CompoundMemory(
            this.CHRBanks[0],
            this.CHRBanks[1],
            this.nametable,
            new Ram(0x1000)
        );

        this.memory.shadowSetter(0x8000, 0xffff, this.setByte.bind(this));
    }

    private setByte(addr: number, value: number): void {
       /*7  bit  0
        ---- ----
        xxxx pPPP
             ||||
             ++++- Select 16 KB PRG ROM bank for CPU $8000-$BFFF
         (UNROM uses bits 2-0; UOROM uses bits 3-0)
        
        Emulator implementations of iNES mapper 2 treat this as a full 8-bit bank select register, without bus conflicts. This allows the mapper to be used for similar boards that are compatible.
        To make use of all 8-bits for a 4 MB PRG ROM, an NES 2.0 header must be used (iNES can only effectively go to 2 MB).
        The original UxROM boards used by Nintendo were subject to bus conflicts, but the relevant games do not rely on this.
        */

        this.memory.rgmemory[3] = this.PRGBanks[value & 0xff];
    }


    splitMemory(romBanks: Rom[], size: number): Memory[] {
        const result = [];
        for (let rom of romBanks) {
            let i = 0;
            if (rom.size() % size)
                throw 'cannot split memory';
            while (i < rom.size()) {
                result.push(rom.subArray(i, size));
                i += size;
            }
        }
        return result;
    }

    setCpuAndPpu(cpu: Mos6502) {

    }



    clk() {}
}