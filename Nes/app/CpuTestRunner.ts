///<reference path="NesEmulator.ts"/>
///<reference path="NesRunnerBase.ts"/>

class CpuTestRunner extends NesRunnerBase{
    callback = this.renderFrame.bind(this);

    constructor(container: HTMLElement, url: string, private checkForString: string) {
        super(container, url);
        this.container.classList.add('test-case');
        const collapseButton = document.createElement('div');
        collapseButton.className = 'collapse-button';
        collapseButton.onclick = (e:MouseEvent) => {
            $(this.container).toggleClass('collapsed');
        };
        this.container.appendChild(collapseButton);

    }

    protected testFinished(nesEmulator) {
        if (nesEmulator.cpu.getByte(0x6000) !== 0x80 &&
                nesEmulator.cpu.getByte(0x6001) === 0xde &&
                nesEmulator.cpu.getByte(0x6002) === 0xb0 &&
                nesEmulator.cpu.getByte(0x6003) === 0x61
        ) {
            const resultCode = nesEmulator.cpu.getByte(0x6000);
            if (resultCode !== 0) {
                this.log('res: ' + resultCode.toString(16));
                this.container.classList.add('failed');
            } else {
                this.container.classList.add('passed');
            }
            let res = "";
            let i = 0x6004;
            while (nesEmulator.cpu.getByte(i) !== 0) {
                res += String.fromCharCode(nesEmulator.cpu.getByte(i));
                i++;
            }
            this.log(res);

            return true;
        }


        if (nesEmulator.cpu.getByte(nesEmulator.cpu.ipCur) === 0x4c &&
            nesEmulator.cpu.getWord(nesEmulator.cpu.ipCur + 1) === nesEmulator.cpu.ipCur &&
            nesEmulator.cpu.flgInterruptDisable &&
            !nesEmulator.ppu.nmi_output
        ) {

            const out = nesEmulator.ppu.getNameTable(0);
            this.log(out);

            if (out.indexOf(this.checkForString) >= 0) {
                this.container.classList.add('passed');
            } else {
                this.container.classList.add('failed');
            }
            return true;
        }

        return false;
    }


    protected runI() {
        requestAnimationFrame(this.callback);
    }

    private renderFrame() {
        const nesEmulator = this.nesEmulator;
        const ppu = nesEmulator.ppu;

        if (this.testFinished(nesEmulator)) {
            this.container.classList.add('collapsed');
            this.onEndCallback();
            return;
        }

        try {
            const frameCurrent = ppu.iFrame;
            while (frameCurrent === ppu.iFrame)
                nesEmulator.step();
        } catch (e) {
            this.container.classList.add('collapsed');
            this.logError(e);
            this.onEndCallback();
            return;
        }
        requestAnimationFrame(this.callback);
    }
}