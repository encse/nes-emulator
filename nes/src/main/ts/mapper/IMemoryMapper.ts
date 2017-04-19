import {CompoundMemory} from "../memory/CompoundMemory";
import {Mos6502} from "../cpu/Mos6502";
import {PPU} from "../PPU";
export interface IMemoryMapper {
    memory: CompoundMemory;
    vmemory: CompoundMemory;

    setCpuAndPpu(cpu: Mos6502, ppu: PPU);
    clk();
}