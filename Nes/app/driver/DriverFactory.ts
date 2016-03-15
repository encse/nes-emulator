class DriverFactory {

    createRenderer(canvas:HTMLCanvasElement): IDriver {
        try {
            return new WebGlDriver(canvas);
        }
        catch (e) {
            console.error(e);
            return new CanvasDriver(canvas);
        }
    }
}