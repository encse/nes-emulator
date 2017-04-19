import {CanvasDriver} from './CanvasDriver';
import {Driver} from './Driver';
import {WebGlDriver} from './WebGlDriver';
export class DriverFactory {

    public createRenderer(canvas: HTMLCanvasElement): Driver {
        try {
            return new WebGlDriver(canvas);
        } catch (e) {
            console.error(e);
            return new CanvasDriver(canvas);
        }
    }
}
