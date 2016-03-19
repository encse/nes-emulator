///<reference path="IMemoryMapper.ts"/>
class Mmc0 implements IMemoryMapper{
    memory: CompoundMemory;
    vmemory: CompoundMemory;

    constructor(nesImage: NesImage) {
        if (nesImage.ROMBanks.length === 1) {
            this.memory = new CompoundMemory(
                new Ram(0xc000),
                nesImage.ROMBanks[0]);
        }
        else if (nesImage.ROMBanks.length === 2) {
            this.memory = new CompoundMemory(
                new Ram(0x8000),
                nesImage.ROMBanks[0],
                nesImage.ROMBanks[1]);
        }

        if (nesImage.VRAMBanks.length > 1)
            throw 'unknown VRAMBanks';
        if (nesImage.VRAMBanks.length === 1 && nesImage.VRAMBanks[0].size() !== 0x2000)
            throw 'unknown VRAMBanks';

        const patternTable = nesImage.VRAMBanks.length > 0 ? nesImage.VRAMBanks[0] : new Ram(0x2000);
        const nameTableA = new Ram(0x400);
        const nameTableB = nesImage.fFourScreenVRAM || nesImage.fVerticalMirroring ? new Ram(0x400) : nameTableA;
        const nameTableC = nesImage.fFourScreenVRAM || !nesImage.fVerticalMirroring ? new Ram(0x400) : nameTableA;
        const nameTableD = nesImage.fFourScreenVRAM ? new Ram(0x400) : nesImage.fVerticalMirroring ? nameTableB : nameTableC;
        const rest = new Ram(0x1000);

        this.vmemory = new CompoundMemory(patternTable, nameTableA, nameTableB, nameTableC, nameTableD, rest);
    }

    setCpu(cpu: Mos6502) {
        
    }
}