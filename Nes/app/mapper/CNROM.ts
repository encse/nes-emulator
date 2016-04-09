/// <reference path="IMemoryMapper.ts"/>
class CNROM implements IMemoryMapper {

    memory: CompoundMemory;
    vmemory: CompoundMemory;
    private nametable:CompoundMemory;
    private nametableA:Ram;
    private nametableB:Ram;
    private PRGBanks: Memory[];
    private CHRBanks: Memory[];

    constructor(nesImage: NesImage) {
        this.PRGBanks = this.splitMemory(nesImage.ROMBanks, 0x4000);
        this.CHRBanks = this.splitMemory(nesImage.VRAMBanks, 0x1000);

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
    
        //7  bit  0
        //---- ----
        //cccc ccCC
        //|||| ||||
        //++++-++++- Select 8 KB CHR ROM bank for PPU $0000- $1FFF        
        //CNROM only implements the lowest 2 bits, capping it at 32 KiB CHR. Other boards may implement 4 or more bits for larger CHR.

        this.vmemory.rgmemory[0] = this.CHRBanks[(value & 0x3) << 1];
        this.vmemory.rgmemory[1] = this.CHRBanks[((value & 0x3) << 1) + 1];
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