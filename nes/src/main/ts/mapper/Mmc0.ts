import {Mos6502} from "../cpu/Mos6502";
import {CleverRam} from "../memory/CleverRam";
import {CompoundMemory} from "../memory/CompoundMemory";
import {Memory} from "../memory/Memory";
import {Ram} from "../memory/RAM";
import {Rom} from "../memory/ROM";
import {NesImage} from "../NesImage";
import {MemoryMapper} from "./MemoryMapper";
export class Mmc0 implements MemoryMapper {
    public memory: CompoundMemory;
    public vmemory: CompoundMemory;
    private nametable: CompoundMemory;
    private nametableA: Ram;
    private nametableB: Ram;
    private CHRBanks: Memory[];
    private PRGBanks: Memory[];

    constructor(nesImage: NesImage) {
        this.PRGBanks = this.splitMemory(nesImage.ROMBanks, 0x4000);
        this.CHRBanks = this.splitMemory(nesImage.VRAMBanks, 0x1000);

        while (this.PRGBanks.length < 2) {
            this.PRGBanks.push(this.PRGBanks[0]);
        }

        while (this.CHRBanks.length < 2) {
            this.CHRBanks.push(new Ram(0x1000));
        }

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

        this.memory = new CompoundMemory(
            new CleverRam(0x800, 4),
            new Ram(0x2000),
            new Ram(0x4000),
            this.PRGBanks[0],
            this.PRGBanks[this.PRGBanks.length - 1],
        );

        this.vmemory = new CompoundMemory(
            this.CHRBanks[0],
            this.CHRBanks[1],
            this.nametable,
            new Ram(0x1000),
        );

    }

    public setCpuAndPpu(cpu: Mos6502) {
        // noop
    }

    public clk() {
        // noop
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
