import {Most6502Base} from '../../../../../codegen/build/generated/Mos6502Base'
import {Memory} from "../memory/Memory";
export class Mos6502 extends Most6502Base {
  

    public constructor(public memory: Memory) {
        super(memory);
        if (memory.size() !== 0x10000)
            throw 'invalid memory size';
    }
    public trace(opcode: number) {
      //  console.log(this.ip.toString(16), this.opcodeToMnemonic(opcode), 'ra:', this.rA.toString(16));
    }

    public status() {
        return {irq: this.irqLine, disass: this.disass(10)};
    }

    public step() {

        this.clk();
    }

    public stepInstr() {

        this.clk();
        while (this.t !== 0)
            this.clk();
    }

    private getByte(addr: number): number {
        return this.memory.getByte(addr);
    }

    private getWord(addr: number): number {
        return this.memory.getByte(addr) + 256 * this.memory.getByte(addr + 1);
    }

    public reset() {
        this.ip = this.getWord(this.addrReset);
        this.sp = 0xfd;
    }
    public disass(i, ip:number = null) {
        var rgst = [];

        if(!ip)
           ip = this.ipCur;
        while (i > 0) {
            var opcode = this.memory.getByte(ip);
            rgst.push('$' + ip.toString(16) + ' ' + this.opcodeToMnemonic(opcode));
            ip += this.sizeFromOpcode(opcode);
            i--;
        }
        return rgst;
    }
}