import {Memory} from "./Memory";
export class Rom implements Memory {
    private memory: Uint8Array;
    constructor(size: number) {
        this.memory = new Uint8Array(size);
    }

    static fromBytes(memory: Uint8Array) {
        const res = new Rom(0);
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
    }

    subArray(addr: number, size: number) {
        return Rom.fromBytes(this.memory.subarray(addr, addr + size));
    }
}