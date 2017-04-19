import {Memory} from "./Memory";
export class Rom implements Memory {
    public static fromBytes(memory: Uint8Array) {
        const res = new Rom(0);
        res.memory = memory;
        return res;
    }
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
        // noop
    }

    public subArray(addr: number, size: number) {
        return Rom.fromBytes(this.memory.subarray(addr, addr + size));
    }
}
