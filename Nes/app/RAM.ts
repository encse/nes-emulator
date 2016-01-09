///<reference path="Memory.ts"/>
class RAM implements Memory {
    private memory: Uint8Array;
    constructor(size: number) {
        this.memory = new Uint8Array(size);
    }
    public size() {
        return this.memory.length;
    }

    public getByte(addr: number): number {
        return this.memory[addr];
    }

    public setByte(addr: number, value: number): void {
        this.memory[addr] = value & 0xff;
    }
}