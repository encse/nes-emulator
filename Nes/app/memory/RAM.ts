///<reference path="Memory.ts"/>
class RAM implements Memory {
    private memory: Uint8Array;
    constructor(size: number) {
        this.memory = new Uint8Array(size);
    }

    static fromBytes(memory: Uint8Array) {
        var res = new RAM(0);
        res.memory = memory;
        return res;
    }

    size() {
        return this.memory.length;
    }

    getByte(addr: number): number {
        return this.memory[addr];
    }

    setByte(addr: number, value: number): void {
        this.memory[addr] = value & 0xff;
    }
}