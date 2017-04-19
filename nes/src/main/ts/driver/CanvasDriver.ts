import {Driver} from "./Driver";
export class CanvasDriver implements Driver {

    private ctx: CanvasRenderingContext2D;
    private imageData: ImageData;
    private buf8: Uint8Array;
    private data: Uint32Array;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d");
        this.imageData = this.ctx.getImageData(0, 0, 256, 240);
        const buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(buf);
        this.data = new Uint32Array(buf);
    }

    public getBuffer(): Uint32Array {
        return this.data;
    }

    public render(): void {
        (this.imageData.data as any).set(this.buf8);
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    public tsto() {
        return "Canvas driver";
    }
}
