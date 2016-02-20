///<reference path="NesEmulator.ts"/>
///<reference path="NesRunnerBase.ts"/>

class CpuTestRunner extends NesRunnerBase{

    callback = this.renderFrame.bind(this);

    constructor(container: HTMLElement, url: string) {
         super(container, url);
    }


    private testFinished(nesEmulator) {
        if (nesEmulator.cpu.getByte(0x6000) !== 0x80 &&
                nesEmulator.cpu.getByte(0x6001) === 0xde &&
                nesEmulator.cpu.getByte(0x6002) === 0xb0 &&
                nesEmulator.cpu.getByte(0x6003) === 0x61
        ) {
            const resultCode = nesEmulator.cpu.getByte(0x6000);
            if (resultCode !== 0)
                this.logError('res: ' + resultCode.toString(16));
            let res = "";
            let i = 0x6004;
            while (nesEmulator.cpu.getByte(i) !== 0) {
                res += String.fromCharCode(nesEmulator.cpu.getByte(i));
                i++;
            }
            this.log(res);
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
            this.onEndCallback();
            return;
        }

        const frameCurrent = ppu.iFrame;
        while (frameCurrent === ppu.iFrame)
            nesEmulator.step();

        requestAnimationFrame(this.callback);
    }
}