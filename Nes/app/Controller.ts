enum ControllerKeys {
    A_Key,
    B_Key,
    Select_Key,
    Start_Key,
    Up,
    Down,
    Left,
    Right,
};

class Controller {

    s: number = 0;
    i: number = 0;

    keyStateA = [0, 0, 0, 0, 0, 0, 0, 0];
    keyStateB = [0, 0, 0, 0, 0, 0, 0, 0];

    keyUpEvents: (() => void)[] = [];

    constructor(canvas: HTMLElement) {
        canvas.tabIndex = 1;
        canvas.focus();

        canvas.addEventListener('blur', (_) => {
            setTimeout(() => {canvas.focus(); }, 20);
        });

        canvas.addEventListener('keydown', this.onKeyDown.bind(this), false);
        canvas.addEventListener('keyup', this.onKeyUp.bind(this), false);

        this.registerKeyboardHandler(40, () => { this.keyStateA[ControllerKeys.Down] = 0; });
        this.registerKeyboardHandler(38, () => { this.keyStateA[ControllerKeys.Up] = 0; });
        this.registerKeyboardHandler(37, () => { this.keyStateA[ControllerKeys.Left] = 0; });
        this.registerKeyboardHandler(39, () => { this.keyStateA[ControllerKeys.Right] = 0; });
        this.registerKeyboardHandler(13, () => { this.keyStateA[ControllerKeys.Start_Key] = 0; });
        this.registerKeyboardHandler(32, () => { this.keyStateA[ControllerKeys.Select_Key] = 0; });
        this.registerKeyboardHandler(65, () => { this.keyStateA[ControllerKeys.A_Key] = 0; });
        this.registerKeyboardHandler(66, () => { this.keyStateA[ControllerKeys.B_Key] = 0; });
    }

    registerKeyboardHandler(keycode: number, callback: () => void) {
        this.keyUpEvents[keycode] = callback;
    }

    onKeyDown(event:KeyboardEvent) {
        switch (event.keyCode) {
            case 40: this.keyStateA[ControllerKeys.Down] = 1; break;
            case 38: this.keyStateA[ControllerKeys.Up] = 1; break;
            case 37: this.keyStateA[ControllerKeys.Left] = 1; break;
            case 39: this.keyStateA[ControllerKeys.Right] = 1; break;
            case 13: this.keyStateA[ControllerKeys.Start_Key] = 1; break;
            case 32: this.keyStateA[ControllerKeys.Select_Key] = 1; break;
            case 65: this.keyStateA[ControllerKeys.A_Key] = 1; break;
            case 66: this.keyStateA[ControllerKeys.B_Key] = 1; break;
        }
        event.preventDefault();
    }

    onKeyUp(event: KeyboardEvent) {
        const callback = this.keyUpEvents[event.keyCode];
        if (callback) {
            callback();
            event.preventDefault();
        }
    }

    set reg4016(value:number) {
        this.s = value & 1;
        if (!this.s)
            this.i = 0;
    }
    /**
     * Front-loading NES $4016 and $4017, and Top-loading NES $4017
        7  bit  0
        ---- ----
        OOOx xxxD
        |||| ||||
        |||| |||+- Serial controller data
        |||+-+++-- Always 0
        +++------- Open bus
    */
    get reg4016() {

        if (this.s)
            return this.keyStateA[0];
        else {
            var r = this.keyStateA[this.i % 8];
            this.i++;

            return r;
        }
    }

    get reg4017() {
        if (this.s)
            return 0x40 | this.keyStateB[0];
        else if (this.i < 8)
            return 0x40 | this.keyStateB[this.i++];
        else
            return 0x40 | 1;
    }
}