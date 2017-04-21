 import {Mos6502} from '../cpu/Mos6502';
  import {CompoundMemory} from '../memory/CompoundMemory';
  import {PPU} from '../PPU';
  export interface MemoryMapper {
    memory: CompoundMemory;
    vmemory: CompoundMemory;

    setCpuAndPpu(cpu: Mos6502, ppu: PPU): void;
    clk(): void;
}
