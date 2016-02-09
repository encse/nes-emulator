///<reference path="Memory.ts"/>
class ROM implements Memory {
    private memory: Uint8Array;
    constructor(size: number) {
        this.memory = new Uint8Array(size);
    }

    public static fromBytes(memory: Uint8Array) {
        var res = new ROM(0);
        res.memory = memory;
        return res;
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