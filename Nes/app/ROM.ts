///<reference path="Memory.ts"/>
class ROM implements Memory {
    constructor(private memory: Uint8Array) {
    }

    public size() {
        return this.memory.length;
    }
    public getByte(addr: number): number {
        return this.memory[addr];
    }

    public setByte(addr: number, value: number): void {
    }
}