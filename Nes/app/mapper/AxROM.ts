/// <reference path="IMemoryMapper.ts"/>
class AxRom implements IMemoryMapper {

    memory: CompoundMemory;
    vmemory: CompoundMemory;
    private nametable:CompoundMemory;
    private nametableA:Ram;
    private nametableB:Ram;
    private PRGBanks: Memory[];
    private CHRBanks: Memory[];

    constructor(nesImage: NesImage) {
        this.PRGBanks = this.splitMemory(nesImage.ROMBanks, 0x4000);

        while (this.PRGBanks.length < 2)
            this.PRGBanks.push(new Ram(0x4000));

        this.memory = new CompoundMemory(
            new CleverRam(0x800, 4),
            new Ram(0x2000),
            new Ram(0x4000),
            this.PRGBanks[this.PRGBanks.length - 2],
            this.PRGBanks[this.PRGBanks.length - 1]
        );

        this.nametableA = new Ram(0x400);
        this.nametableB = new Ram(0x400);
        this.nametable = new CompoundMemory(this.nametableA, this.nametableA, this.nametableA, this.nametableA);

        this.vmemory = new CompoundMemory(
            new Ram(0x2000),
            this.nametable,
            new Ram(0x1000)
        );

        this.memory.shadowSetter(0x8000, 0xffff, this.setByte.bind(this));
    }

    private setByte(addr: number, value: number): void {
       /*7  bit  0
         ---- ----
         xxxM xPPP
            |  |||
            |  +++- Select 32 KB PRG ROM bank for CPU $8000-$FFFF
            +------ Select 1 KB VRAM page for all 4 nametables
        */

        this.memory.rgmemory[3] = this.PRGBanks[(value & 7) << 1 ];
        this.memory.rgmemory[4] = this.PRGBanks[((value & 7) << 1) | 1];
        this.nametable.rgmemory[0] = this.nametable.rgmemory[1] = this.nametable.rgmemory[2] = this.nametable.rgmemory[3] =
            (value >> 4) & 1 ? this.nametableB : this.nametableA;
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