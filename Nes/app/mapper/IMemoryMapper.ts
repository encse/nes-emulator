interface IMemoryMapper {
    memory: CompoundMemory;
    vmemory: CompoundMemory;

    setCpuAndPpu(cpu:Mos6502, ppu:PPU);
}