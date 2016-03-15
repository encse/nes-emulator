///<reference path="CompoundMemory.ts"/>
///<reference path="RAM.ts"/>
///<reference path="NesImage.ts"/>
///<reference path="Mos6502.ts"/>
class NesEmulator {
    cpu: Mos6502;
    memory: CompoundMemory;
    vmemory: CompoundMemory;
    ppu: PPU;
    apu: APU;
    controller: Controller;

    public constructor(nesImage: NesImage, canvas:HTMLCanvasElement) {
        if (nesImage.fPAL)
            throw 'only NTSC images are supported';
        switch (nesImage.mapperType)
        {
            case 0:
                if (nesImage.ROMBanks.length === 1) {
                    this.memory = new CompoundMemory(
                            new RAM(0xc000),
                            nesImage.ROMBanks[0]);
                }
                else if (nesImage.ROMBanks.length === 2) {
                    this.memory = new CompoundMemory(
                        new RAM(0x8000),
                        nesImage.ROMBanks[0],
                        nesImage.ROMBanks[1]);
                }

                if (nesImage.VRAMBanks.length > 1)
                    throw 'unknown VRAMBanks';
                if (nesImage.VRAMBanks.length === 1 && nesImage.VRAMBanks[0].size() !== 0x2000)
                    throw 'unknown VRAMBanks';

                const patternTable = nesImage.VRAMBanks.length > 0 ? nesImage.VRAMBanks[0] : new RAM(0x2000);
                const nameTableA = new RAM(0x400);
                const nameTableB = nesImage.fFourScreenVRAM || nesImage.fVerticalMirroring ? new RAM(0x400) : nameTableA;
                const nameTableC = nesImage.fFourScreenVRAM || !nesImage.fVerticalMirroring ? new RAM(0x400) : nameTableA;
                const nameTableD = nesImage.fFourScreenVRAM ? new RAM(0x400) : nesImage.fVerticalMirroring ? nameTableB : nameTableC;
                const rest = new RAM(0x1000);

                this.vmemory = new CompoundMemory(patternTable, nameTableA, nameTableB, nameTableC, nameTableD, rest);
                break;
            case 1:
                const mmc1 = new MMC1(nesImage.ROMBanks, nesImage.VRAMBanks);
                this.memory = mmc1.memory;
                this.vmemory = mmc1.vmemory;
              
        }

        if (!this.memory)
            throw 'unkown mapper ' + nesImage.mapperType;

        this.memory.shadowSetter(0x4014, 0x4014, (_, v) => {
            this.dmaRequested = true;
            this.addrDma = v << 8;
        });

        this.memory.shadowGetter(0x4016, 0x4016, () => { return this.controller.reg4016; });
        this.memory.shadowSetter(0x4016, 0x4016, (_, v) => { this.controller.reg4016 = v; });
        this.memory.shadowGetter(0x4017, 0x4017, () => { return this.controller.reg4016; });

        this.cpu = new Mos6502(this.memory);
        this.apu = new APU(this.memory, this.cpu);
       // this.ppu = <any> new PPUOld(this.memory, this.vmemory, this.cpu);
        this.ppu = new PPU(this.memory, this.vmemory, this.cpu);
        this.ppu.setRenderer(new RendererFactory().createRenderer(canvas));
        this.cpu.reset();
        this.controller = new Controller(canvas);

        window['nesemulator'] = this;
    }

  
    private bDma: number;
    private dmaRequested = false;
    private addrDma: number;
    private idma = 0;
    private icycle = 0;
    step() {

        for (this.icycle = 0; this.icycle < 12; this.icycle++) {

            if ((this.icycle & 3) === 0) {
                const nmiBefore = this.cpu.nmiLine;
                this.ppu.step();
                const nmiAfter = this.cpu.nmiLine;
                if (nmiBefore > nmiAfter && this.icycle === 4)
                    this.cpu.detectInterrupts();
            }

            if (this.icycle === 0) {
                    
                if (this.dmaRequested) {

                    if (!(this.cpu.icycle & 1)) {
                        this.dmaRequested = false;
                        this.idma = 512;
                    }
                    this.cpu.icycle++;
                } else if (this.idma > 512) {
                    this.idma--;
                    this.cpu.icycle++;
                } else if (this.idma > 0) {
                    
                    this.cpu.icycle++;
                    if (!(this.idma & 1)) {
                        this.bDma = this.memory.getByte(this.addrDma++);
                        this.addrDma &= 0xffff;
                    } else {
                        this.memory.setByte(0x2004, this.bDma);
                    }
                    this.idma--;
                  
                }
                else {
                    this.cpu.step();
                }
            }
            
            this.apu.step();
        }
    }
}
