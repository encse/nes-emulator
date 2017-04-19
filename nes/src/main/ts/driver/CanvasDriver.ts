import {IDriver} from "./IDriver";
export class CanvasDriver implements IDriver {

    ctx: CanvasRenderingContext2D;
    imageData: ImageData;
    buf8: Uint8Array;
    data: Uint32Array;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d");
        this.imageData = this.ctx.getImageData(0, 0, 256, 240);
        const buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(buf);
        this.data = new Uint32Array(buf);
    }
    getBuffer(): Uint32Array {
        return this.data;
    }

    render(): void {
        (<any>this.imageData.data).set(this.buf8);
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    tsto() {
        return "Canvas driver";
    }
}