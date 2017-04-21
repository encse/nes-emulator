 import {APU} from './APU';
  import {Controller} from './Controller';
  import {IrqLine} from './cpu/IrqLine';
  import {Mos6502} from './cpu/Mos6502';
  import {Driver} from './driver/Driver';
  import {MemoryMapper} from './mapper/MemoryMapper';
  import {MemoryMapperFactory} from './mapper/MemoryMapperFactory';
  import {NesImage} from './NesImage';
  import {PPU} from './PPU';
  export class NesEmulator {
    public cpu: Mos6502;
    public memoryMapper: MemoryMapper;
    public ppu: PPU;
    public apu: APU;
    private bDma: number;
    private dmaRequested = false;
    private addrDma: number;
    private idma = 0;
    private icycle = 0;

    public constructor(nesImage: NesImage, driver: Driver, public controller: Controller) {
        if (nesImage.fPAL) {
            throw new Error('only NTSC images are supported');
        }

        this.memoryMapper = new MemoryMapperFactory().create(nesImage);

        this.memoryMapper.memory.shadowSetter(0x4014, 0x4014, (_, v) => {
            this.dmaRequested = true;
            this.addrDma = v << 8;
        });

        this.memoryMapper.memory.shadowGetter(0x4016, 0x4016, () => this.controller.reg4016);
        this.memoryMapper.memory.shadowSetter(0x4016, 0x4016, (_, v) => { this.controller.reg4016 = v; });
        this.memoryMapper.memory.shadowGetter(0x4017, 0x4017, () => this.controller.reg4017);

        this.cpu = new Mos6502(this.memoryMapper.memory);
        this.apu = new APU(this.memoryMapper.memory, new IrqLine(this.cpu));
        this.ppu = new PPU(this.memoryMapper.memory, this.memoryMapper.vmemory, this.cpu);
        this.ppu.setDriver(driver);

        this.memoryMapper.setCpuAndPpu(this.cpu, this.ppu);

        this.cpu.reset();
        this.controller.setPixelColorDelegate(this.ppu.getPixelColor.bind(this.ppu));
    }

    public step() {
        for (this.icycle = 0; this.icycle < 12; this.icycle++) {

            if ((this.icycle & 3) === 0) {

                const nmiBefore = this.cpu.nmiLine;
                this.ppu.step();
                this.memoryMapper.clk();
                const nmiAfter = this.cpu.nmiLine;
                if ((nmiBefore > nmiAfter) && this.icycle === 4) {
                    this.cpu.detectInterrupts();
                }
            }

            if (this.icycle === 0) {

                if (this.dmaRequested) {

                    this.dmaRequested = false;
                    this.idma = 512;
                    if (!(this.cpu.icycle & 1)) {
                        this.idma++;
                    }
                } else if (this.idma > 512) {
                    this.idma--;
                } else if (this.idma > 0) {

                    //  this.cpu.icycle++;
                    if (!(this.idma & 1)) {
                        this.bDma = this.memoryMapper.memory.getByte(this.addrDma++);
                        this.addrDma &= 0xffff;
                    } else {
                        this.memoryMapper.memory.setByte(0x2004, this.bDma);
                    }
                    this.idma--;

                } else {
                    this.cpu.step();
                }
            }

            this.apu.step();
        }
    }

    public destroy() {
        this.controller = null;
        this.apu = null;
        this.ppu = null;
        this.cpu = null;
    }
}
