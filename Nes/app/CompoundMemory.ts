///<reference path="Memory.ts"/>
class CompoundMemory implements Memory {
    protected rgmemory: Memory[] = [];
    private sizeI: number;

    public add(memory: Memory): CompoundMemory {
        this.rgmemory.push(memory);
        this.sizeI += memory.size();
        return this;
    }

    public size():number {
        return this.sizeI;
    }

    public getByte(addr: number):number {
        for (let i = 0; i < this.rgmemory.length; i++) {
            let memory = this.rgmemory[i];
            if (addr < memory.size())
                return memory.getByte(addr);
            else
                addr -= memory.size();
        }

        throw 'address out of bounds';
    }

    public setByte(addr: number, value: number): void {
        for (let i = 0; i < this.rgmemory.length; i++) {
            let memory = this.rgmemory[i];
            if (addr < memory.size()) {
                memory.setByte(addr, value);
                return;
            } else
                addr -= memory.size();
        }
    }
}