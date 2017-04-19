
enum ControllerKeys {
    A_Key,
    B_Key,
    Select_Key,
    Start_Key,
    Up,
    Down,
    Left,
    Right,

}

export type GetPixelColorDelegate = (x: number, y: number) => number;

export class Controller {

    private s: number = 0;
    private iA: number = 0;
    private iB: number = 0;

    private keyStateA = [0, 0, 0, 0, 0, 0, 0, 0];
    private keyStateB = [0, 0, 0, 0, 0, 0, 0, 0];

    private mouseState = {pressed: false, x: 0, y: 0};

    private keyUpEvents: Array<() => void> = [];
    private getPixelColor: GetPixelColorDelegate;

    constructor(private canvas: HTMLCanvasElement) {
        canvas.tabIndex = 1;
        canvas.focus();

        canvas.addEventListener("keydown", this.onKeyDown.bind(this), false);
        canvas.addEventListener("keyup", this.onKeyUp.bind(this), false);
        canvas.addEventListener("mousedown", this.onMouseDown.bind(this), false);
        canvas.addEventListener("mouseup", this.onMouseUp.bind(this), false);
        canvas.addEventListener("mousemove", this.onMouseMove.bind(this), false);

        this.registerKeyboardHandler(40, () => {
            this.keyStateA[ControllerKeys.Down] = 0;
        });
        this.registerKeyboardHandler(38, () => {
            this.keyStateA[ControllerKeys.Up] = 0;
        });
        this.registerKeyboardHandler(37, () => {
            this.keyStateA[ControllerKeys.Left] = 0;
        });
        this.registerKeyboardHandler(39, () => {
            this.keyStateA[ControllerKeys.Right] = 0;
        });
        this.registerKeyboardHandler(13, () => {
            this.keyStateA[ControllerKeys.Start_Key] = 0;
        });
        this.registerKeyboardHandler(32, () => {
            this.keyStateA[ControllerKeys.Select_Key] = 0;
        });
        this.registerKeyboardHandler(65, () => {
            this.keyStateA[ControllerKeys.A_Key] = 0;
        });
        this.registerKeyboardHandler(66, () => {
            this.keyStateA[ControllerKeys.B_Key] = 0;
        });
    }

    public setPixelColorDelegate(getPixelColor: GetPixelColorDelegate) {
        this.getPixelColor = getPixelColor;
    }

    public registerKeyboardHandler(keycode: number, callback: () => void) {
        this.keyUpEvents[keycode] = callback;
    }

    private onKeyDown(event: KeyboardEvent) {
        switch (event.keyCode) {
            case 40:
                this.keyStateA[ControllerKeys.Down] = 1;
                break;
            case 38:
                this.keyStateA[ControllerKeys.Up] = 1;
                break;
            case 37:
                this.keyStateA[ControllerKeys.Left] = 1;
                break;
            case 39:
                this.keyStateA[ControllerKeys.Right] = 1;
                break;
            case 13:
                this.keyStateA[ControllerKeys.Start_Key] = 1;
                break;
            case 32:
                this.keyStateA[ControllerKeys.Select_Key] = 1;
                break;
            case 65:
                this.keyStateA[ControllerKeys.A_Key] = 1;
                break;
            case 66:
                this.keyStateA[ControllerKeys.B_Key] = 1;
                break;
        }
        event.preventDefault();
    }

    private onKeyUp(event: KeyboardEvent) {
        const callback = this.keyUpEvents[event.keyCode];
        if (callback) {
            callback();
            event.preventDefault();
        }
    }

    private onMouseDown(event: MouseEvent) {
        this.mouseState.pressed = true;
    }

    private onMouseUp(event: MouseEvent) {
        this.mouseState.pressed = false;
    }

    private onMouseMove(event: MouseEvent) {
        this.mouseState.x = event.offsetX;
        this.mouseState.y = event.offsetY;
    }

    public set reg4016(value: number) {
        this.s = value & 1;
        if (!this.s) {
            this.iA = 0;
            this.iB = 0;
        }

    }

    /*
     Front-loading NES $4016 and $4017, and Top-loading NES $4017
     7  bit  0
     ---- ----
     OOOx xxxD
     |||| ||||
     |||| |||+- Serial controller data
     |||+-+++-- Always 0
     +++------- Open bus
     */
    public get reg4016() {
        if (this.s) {
            return this.keyStateA[0];
        } else if (this.iA < 8) {
            return this.keyStateA[this.iA++];
        } else {
            return 0x40 | 1;
        }
    }

    /*
     7  bit  0
     ---- ----
     xxxT WxxS
     | |  |
     | |  +- Serial data (Vs.)
     | +---- Light sense (0: detected; 1: not detected) (NES/FC)
     +------ Trigger (0: released; 1: pulled) (NES/FC)
     */
    public get reg4017() {

        const screenX = Math.floor(this.mouseState.x * 256 / this.canvas.clientWidth);
        const screenY = Math.floor(this.mouseState.y * 240 / this.canvas.clientHeight);
        const color = this.getPixelColor(screenX, screenY) & 0xffffff;
        const brightness = 0.2126 * ((color >> 16) & 0xff) + 0.7152 * ((color >> 8) & 0xff) + 0.0722 * (color & 0xff);
        return (this.mouseState.pressed ? 1 << 4 : 0) | (brightness < 128 ? 1 << 3 : 0);
    }

}
