import {Memory} from "./Memory";
export class CleverRam implements Memory {
    public writeEnable: boolean = true;
    public readEnable: boolean = true;

    private memory: Uint8Array;

    constructor(private sizeI: number, repeat: number = 1) {
        this.memory = new Uint8Array(sizeI);
        this.sizeI *= repeat;
    }

    public size() {
        return this.sizeI ;
    }

    public getByte(addr: number): number {
        if (!this.readEnable) {
            return 0;
        }

        return this.memory[addr > this.sizeI ? addr % this.sizeI : addr];
    }

    public setByte(addr: number, value: number): void {
        if (this.writeEnable) {
            this.memory[addr > this.sizeI ? addr % this.sizeI : addr] = value & 0xff;
        }
    }

}
