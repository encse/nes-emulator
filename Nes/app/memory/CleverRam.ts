/// <reference path="Memory.ts"/>
class CleverRam implements Memory {
    private memory: Uint8Array;
    public writeEnable: boolean = true;
    public readEnable: boolean = true;

    constructor(private sizeI: number, repeat:number = 1) {
        this.memory = new Uint8Array(sizeI);
        this.sizeI *= repeat;
    }

    static fromBytes(memory: Uint8Array) {
        var res = new CleverRam(0);
        res.memory = memory;
        return res;
    }

    size() {
        return this.sizeI ;
    }

    getByte(addr: number): number {
        if (!this.readEnable)
            return 0;

        return this.memory[addr > this.sizeI ? addr % this.sizeI : addr];
    }

    setByte(addr: number, value: number): void {
        if (this.writeEnable)
            this.memory[addr > this.sizeI ? addr % this.sizeI : addr] = value & 0xff;
    }

}