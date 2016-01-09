///<reference path="NesEmulator.ts"/>
class StepTest {

    public run(nesemu: NesEmulator, expectedOutput:string, log:(st: string)=>void ):void {
        const lines = expectedOutput.split('\n');
        for (let iline = 0; iline < lines.length; iline++) {
            const line = lines[iline];
            const groups = line.match(/([^ ]+).*A:([^ ]+).*X:([^ ]+).*Y:([^ ]+).*P:([^ ]+).*SP:([^ ]+).*/);
            groups.shift();
            const regs = groups.map(x => parseInt(x, 16));
            const ip = regs[0];
            const rA = regs[1];
            const rX = regs[2];
            const rY = regs[3];
            const rP = regs[4];
            const sp = regs[5];

            function tsto(ip: number, rA: number, rX: number, rY: number, rP: number, sp: number) {
                let stRP = rP.toString(2);
                stRP = Array(Math.max(8 - stRP.length + 1, 0)).join('0') + stRP;
                return 'ip:' + ip.toString(16) +
                    ' rA:' + rA.toString(16) +
                    ' rX:' + rX.toString(16) +
                    ' rY:' + rY.toString(16) +
                    ' rP:' + stRP +
                    ' sp:' + sp.toString(16);
            }

            const expected = tsto(ip, rA, rX, rY, rP, sp);
            const actual = tsto(nesemu.cpu.ip, nesemu.cpu.rA, nesemu.cpu.rX, nesemu.cpu.rY, nesemu.cpu.rP, nesemu.cpu.sp);

            if (expected !== actual) {
                log(iline > 0 ? lines[iline - 1] : "BEGIN");
                log(expected);
                log(actual);
                break;
            }
            nesemu.step();
        };

        log('done');
    }
}

