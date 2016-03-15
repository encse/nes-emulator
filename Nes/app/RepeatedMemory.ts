///<reference path="Memory.ts"/>
class RepeatedMemory implements Memory {
    sizeI: number;

    public constructor(private count: number, private memory: Memory) {
        this.sizeI = this.memory.size() * this.count;
    }

    size():number {
        return this.sizeI;
    }

    getByte(addr: number): number {
        if (addr > this.size())
            throw 'address out of bounds';
        return this.memory.getByte(addr % this.sizeI);
    }

    setByte(addr: number, value: number): void {
        if (addr > this.size())
            throw 'address out of bounds';
        return this.memory.setByte(addr % this.sizeI, value);
    }

}