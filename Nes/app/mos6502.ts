///<reference path="Memory.ts"/>
///<reference path="Mos6502Base.ts"/>

class Mos6502 extends Most6502Base {
  

    public constructor(public memory: Memory) {
        super(memory);
    }
    public trace(opcode: number) {
        //console.log(this.ip.toString(16), this.opcodeToMnemonic(opcode));
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
}