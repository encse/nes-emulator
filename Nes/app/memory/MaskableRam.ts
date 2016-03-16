///<reference path="Ram.ts"/>
class MaskableRam extends Ram {

    public writeEnable:boolean = true;
    public readEnable:boolean = true;

    constructor(size: number) {
        super(size);
    }

    getByte(addr: number): number {
        if (!this.readEnable)
            return 0;
        return super.getByte(addr);
    }

    setByte(addr: number, value: number): void {
        if (this.writeEnable)
            super.setByte(addr, value);
    }
}