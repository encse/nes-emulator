import {NesEmulator} from '../NesEmulator';
export class StepTestRunner {

    private expectedOutput: string;
    private ich = 0;

    public run(nesemu: NesEmulator, expectedOutput: string, log: (st: string) => void): void {
        const prevLines = [];
        this.expectedOutput = expectedOutput;
        this.ich = 0;
        let line = this.readLine();

        nesemu.cpu.ip = parseInt(line.split(' ')[0], 16);
        while (nesemu.cpu.ip !== 0x8014) {
            nesemu.cpu.stepInstr();
        }

        while (line) {
            const groups = line.match(/([^ ]+).*A:([^ ]+).*X:([^ ]+).*Y:([^ ]+).*P:([^ ]+).*SP:([^ ]+).*/);
            groups.shift();
            const regs = groups.map((x) => parseInt(x, 16));
            const ip = regs[0];
            const rA = regs[1];
            const rX = regs[2];
            const rY = regs[3];
            const rP = regs[4];
            const sp = regs[5];

            const expected = this.tsto(ip, rA, rX, rY, rP, sp);
            const actual = this.tsto(nesemu.cpu.ip, nesemu.cpu.rA, nesemu.cpu.rX, nesemu.cpu.rY, nesemu.cpu.rP, nesemu.cpu.sp);

            if (expected !== actual) {
                prevLines.forEach((prevLine) => log(prevLine));
                log(expected);
                log(actual);
                log(' ');
                break;
            }
            prevLines.push(line);

            try {
                nesemu.cpu.stepInstr();
            } catch (e) {
                log(e);
                prevLines.forEach((prevLine) => log(prevLine));
            }
            if (prevLines.length > 10) {
                prevLines.shift();
            }
            line = this.readLine();
        }

        log('done');
    }

    private tsto(ip: number, rA: number, rX: number, rY: number, rP: number, sp: number) {
     let stRP = rP.toString(2);
     stRP = Array(Math.max(8 - stRP.length + 1, 0)).join('0') + stRP;
     return 'ip:' + ip.toString(16)
         + ' rA:' + rA.toString(16)
         + ' rX:' + rX.toString(16)
         + ' rY:' + rY.toString(16)
         + ' rP:' + stRP
         + ' sp:' + sp.toString(16)
         ;
    }

    private readLine(): string {
        let st = '';
        while (this.ich < this.expectedOutput.length) {
            if (this.expectedOutput[this.ich] === '\n') {
                this.ich++;
                return st;
            } else {
                st += this.expectedOutput[this.ich];
            }
            this.ich++;
        }
        return st;
    }
}
