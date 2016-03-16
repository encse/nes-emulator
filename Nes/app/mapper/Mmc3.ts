///<reference path="IMemoryMapper.ts"/>
class Mmc3 implements IMemoryMapper {


    memory: CompoundMemory;
    vmemory: CompoundMemory;
   
    chrMode:number;
    prgMode:number;

    horizontalMirroring = 0;
    fourScreenVram = 0;
    temp: number;

    r:number[];
    private PRGBanks: Memory[];
    private CHRBanks: Memory[];
    private nametable: CompoundMemory;
    private nametableA: Ram;
    private nametableB: Ram;
    private nametableC: Ram;
    private nametableD: Ram;

    private prgRam: MaskableRam;

    constructor(nesImage: NesImage) {
        this.PRGBanks = this.splitMemory(nesImage.ROMBanks, 0x2000);
        this.CHRBanks = this.splitMemory(nesImage.VRAMBanks, 0x400);

        this.r = [0, 0, 0, 0, 0, 0, 0, 0];

        this.prgRam = new MaskableRam(0x2000);
        this.memory = new CompoundMemory(
            new RepeatedMemory(4, new Ram(0x800)), //0x2000
            new Ram(0x4000),
            this.prgRam,
            this.PRGBanks[0],
            this.PRGBanks[1],
            this.PRGBanks[this.PRGBanks.length - 2],
            this.PRGBanks[this.PRGBanks.length - 1]
        );
        
        this.nametableA = new Ram(0x400);
        this.nametableB = nesImage.fFourScreenVRAM || nesImage.fVerticalMirroring ? new Ram(0x400) : this.nametableA;
        this.nametableC = nesImage.fFourScreenVRAM || !nesImage.fVerticalMirroring ? new Ram(0x400) : this.nametableA;
        this.nametableD = nesImage.fFourScreenVRAM ? new Ram(0x400) : nesImage.fVerticalMirroring ? this.nametableB : this.nametableC;
        this.nametable = new CompoundMemory(this.nametableA, this.nametableB, this.nametableC, this.nametableD);

        this.horizontalMirroring = nesImage.fVerticalMirroring ? 0 : 1;
        this.fourScreenVram = nesImage.fFourScreenVRAM ? 0 : 1;

        this.vmemory = new CompoundMemory(
            this.CHRBanks[0],
            this.CHRBanks[1],
            this.CHRBanks[2],
            this.CHRBanks[3],
            this.CHRBanks[4],
            this.CHRBanks[5],
            this.CHRBanks[6],
            this.CHRBanks[7],
            this.nametable,
            new Ram(0x1000)
        );

        this.memory.shadowSetter(0x8000, 0xffff, this.setByte.bind(this));
    }

    private setByte(addr: number, value: number): void {
        if (addr <= 0x9ffe) {
            if (addr & 1) { //bank data
                this.r[this.temp] = value;
                this.update();
            } else { //bank select
                this.temp = value & 7;
                this.chrMode = (value >> 7) & 1;
                this.prgMode = (value >> 6) & 1;
            }
        }
        else if (addr <= 0xbfff) {
            if (addr & 1) { //prg ram protect
                this.prgRam.readEnable = !!((value >> 7) & 1);
                this.prgRam.writeEnable = !((value >> 6) & 1);
            } else { //mirroring
                this.horizontalMirroring = value & 1;
                this.update();
            }
        }
       
    }

    private update() {

        /*
                           $8000   $A000   $C000   $E000  
                         +-------+-------+-------+-------+
            PRG Mode 0:  |  R:6  |  R:7  | { -2} | { -1} |
                         +-------+-------+-------+-------+
            PRG Mode 1:  | { -2} |  R:7  |  R:6  | { -1} |
                         +-------+-------+-------+-------+
        */
        if (!this.prgMode) {
            this.memory.rgmemory[2] = this.PRGBanks[this.r[6]];
            this.memory.rgmemory[3] = this.PRGBanks[this.r[7]];
            this.memory.rgmemory[4] = this.PRGBanks[this.PRGBanks.length - 2];
            this.memory.rgmemory[5] = this.PRGBanks[this.PRGBanks.length - 1];
        }
        else {
            this.memory.rgmemory[2] = this.PRGBanks[this.PRGBanks.length - 2];
            this.memory.rgmemory[3] = this.PRGBanks[this.r[7]];
            this.memory.rgmemory[4] = this.PRGBanks[this.r[6]];
            this.memory.rgmemory[5] = this.PRGBanks[this.PRGBanks.length - 1];
        }

        /*
                           $0000   $0400   $0800   $0C00   $1000   $1400   $1800   $1C00 
                         +---------------+---------------+-------+-------+-------+-------+
            CHR Mode 0:  |     <R:0>     |     <R:1>     |  R:2  |  R:3  |  R:4  |  R:5  |
                         +---------------+---------------+---------------+---------------+
            CHR Mode 1:  |  R:2  |  R:3  |  R:4  |  R:5  |     <R:0>     |     <R:1>     |
                         +-------+-------+-------+-------+---------------+---------------+
       */
        if (!this.chrMode) {
            this.vmemory.rgmemory[0] = this.CHRBanks[this.r[0] >> 1];
            this.vmemory.rgmemory[1] = this.CHRBanks[(this.r[0] >> 1) + 1];
            this.vmemory.rgmemory[2] = this.CHRBanks[this.r[1] >> 1];
            this.vmemory.rgmemory[3] = this.CHRBanks[(this.r[1] >> 1) + 1];
            this.vmemory.rgmemory[4] = this.CHRBanks[this.r[2]];
            this.vmemory.rgmemory[5] = this.CHRBanks[this.r[3]];
            this.vmemory.rgmemory[6] = this.CHRBanks[this.r[4]];
            this.vmemory.rgmemory[7] = this.CHRBanks[this.r[5]];
        }
        else {
            this.vmemory.rgmemory[0] = this.CHRBanks[this.r[2]];
            this.vmemory.rgmemory[1] = this.CHRBanks[this.r[3]];
            this.vmemory.rgmemory[2] = this.CHRBanks[this.r[4]];
            this.vmemory.rgmemory[3] = this.CHRBanks[this.r[5]];
            this.vmemory.rgmemory[4] = this.CHRBanks[this.r[0] >> 1];
            this.vmemory.rgmemory[5] = this.CHRBanks[(this.r[0] >> 1) + 1];
            this.vmemory.rgmemory[6] = this.CHRBanks[this.r[1] >> 1];
            this.vmemory.rgmemory[7] = this.CHRBanks[(this.r[1] >> 1) + 1];
        }

        if (!this.fourScreenVram) {
            if (this.horizontalMirroring) {
                this.nametable[0] = this.nametableA;
                this.nametable[1] = this.nametableA;
                this.nametable[2] = this.nametableB;
                this.nametable[3] = this.nametableB;
            } else {
                this.nametable[0] = this.nametableA;
                this.nametable[1] = this.nametableB;
                this.nametable[2] = this.nametableA;
                this.nametable[3] = this.nametableB;
            }
        }
    }

    splitMemory(romBanks: ROM[], size: number): Memory[] {
        const result = [];
        for (let rom of romBanks) {
            let i = 0;
            if (rom.size() % size) 
                throw 'cannot split memory';
            while (i < rom.size()) {
                result.push(rom.subArray(i, size));
                i += size;
            }
        }
        return result;
    }
}