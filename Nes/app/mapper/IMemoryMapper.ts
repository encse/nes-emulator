interface IMemoryMapper {
    memory: CompoundMemory;
    vmemory: CompoundMemory;

    setCpu(cpu:Mos6502);
}