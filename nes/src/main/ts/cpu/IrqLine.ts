import {Mos6502} from "./Mos6502";
export class IrqLine {
    private _isRequested = false;

    public constructor(private cpu: Mos6502) {
        
    }

    request() {
        if (!this._isRequested) {
            this.cpu.irqLine--;
            this._isRequested = true;
        }
    }

    ack() {
        if (this._isRequested) {
            this.cpu.irqLine++;
            this._isRequested = false;
        }
    }

    isRequested() {
        return this._isRequested;
    }
}