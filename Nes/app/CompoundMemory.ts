///<reference path="Memory.ts"/>
class CompoundMemory implements Memory {
    public rgmemory: Memory[] = [];
    private setters: {addrFirst: number, addrLast: number, setter:(addr: number, value: number) => void}[] = [];
    private getters: { addrFirst: number, addrLast: number, getter: (addr: number) => number}[] = [];

    private sizeI: number;
    
    public constructor(...rgmemory: Memory[]) {
        this.sizeI = 0;
        this.rgmemory = rgmemory;
        rgmemory.forEach(memory => this.sizeI += memory.size());
    }

    public size():number {
        return this.sizeI;
    }

    public shadowSetter(addrFirst: number, addrLast: number, setter: (addr: number, value: number) => void) {
        this.setters.push({addrFirst: addrFirst, addrLast: addrLast, setter: setter });
    }
    public shadowGetter(addrFirst: number, addrLast: number, getter: (addr: number) => number) {
        this.getters.push({ addrFirst: addrFirst, addrLast: addrLast, getter: getter });
    }
    public getByte(addr: number): number {
        for (let i = 0; i < this.getters.length; i++) {
            const getter = this.getters[i];
            if (getter.addrFirst <= addr && addr <= getter.addrLast) {
                return getter.getter(addr);
            }
        }

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

        for (let i = 0; i < this.setters.length; i++) {
            const setter = this.setters[i];
            if (setter.addrFirst <= addr && addr <= setter.addrLast) {
                setter.setter(addr, value);
                return;
            }
        }

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