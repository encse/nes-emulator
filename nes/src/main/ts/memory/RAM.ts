import {Memory} from "./Memory";
export class Ram implements Memory {
    public static fromBytes(memory: Uint8Array) {
        const res = new Ram(0);
        res.memory = memory;
        return res;
    }

    private memory: Uint8Array;

    constructor(private sizeI: number) {
        this.memory = new Uint8Array(sizeI);
    }

    public size() {
        return this.memory.length ;
    }

    public getByte(addr: number): number {
        return this.memory[addr];
    }

    public setByte(addr: number, value: number): void {
         this.memory[addr] = value & 0xff;
    }

}
