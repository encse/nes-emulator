class NesImage {
    /*
     * 0-3      String "NES^Z" used to recognize .NES files.
        4        Number of 16kB ROM banks.
        5        Number of 8kB VROM banks.
        6        bit 0     1 for vertical mirroring, 0 for horizontal mirroring.
                 bit 1     1 for battery-backed RAM at $6000-$7FFF.
                 bit 2     1 for a 512-byte trainer at $7000-$71FF.
                 bit 3     1 for a four-screen VRAM layout. 
                 bit 4-7   Four lower bits of ROM Mapper Type.
        7        bit 0     1 for VS-System cartridges.
                 bit 1-3   Reserved, must be zeroes!
                 bit 4-7   Four higher bits of ROM Mapper Type.
        8        Number of 8kB RAM banks. For compatibility with the previous
                 versions of the .NES format, assume 1x8kB RAM page when this
                 byte is zero.
        9        bit 0     1 for PAL cartridges, otherwise assume NTSC.
                 bit 1-7   Reserved, must be zeroes!
        10-15    Reserved, must be zeroes!
        16-...   ROM banks, in ascending order. If a trainer is present, its
                 512 bytes precede the ROM bank contents.
        ...-EOF  VROM banks, in ascending order.
     */

    private static magic = new Uint8Array([0x4e, 0x45, 0x53, 0x1a]);

    public ROMBanks:ROM[];
    public VRAMBanks: RAM[];
    public RAMBanks: RAM[];
    public fVerticalMirroring:boolean;
    public fBatteryPackedRAM:boolean;
    public trainer: Uint8Array = null;
    public fFourScreenVRAM:boolean;
    public mapperType:number;
    public fVSSystem:boolean;
    public fPAL:boolean;
   
    public constructor(rawBytes: Uint8Array) {
        for (let i = 0; i < 4; i++)
            if (rawBytes[i] !== NesImage.magic[i])
                throw 'invalid NES header';

        this.ROMBanks = new Array(rawBytes[4]);
        this.VRAMBanks = new Array(rawBytes[5]);

        this.fVerticalMirroring = !!(rawBytes[6] & 1);
        this.fBatteryPackedRAM = !!(rawBytes[6] & 2);
        var fTrainer = !!(rawBytes[6] & 4);
        this.fFourScreenVRAM = !!(rawBytes[6] & 8);
        this.mapperType = (rawBytes[7] & 0xf0) + (rawBytes[6] >> 4);
        this.fVSSystem = !!(rawBytes[7] & 1);
        if ((rawBytes[7] & 0x0e) !== 0)
             throw 'invalid NES header';

        this.RAMBanks = new Array(Math.min(1, rawBytes[8]));
        this.fPAL = (rawBytes[9] & 1) === 1;

        if ((rawBytes[9] & 0xfe) !== 0)
            throw 'invalid NES header';

        for (let i = 0xa; i < 0x10; i++)
            if(rawBytes[i] !== 0)
                throw 'invalid NES header';

        if (rawBytes.length !== 0x10 + (fTrainer ? 0x100 : 0) + this.ROMBanks.length * 0x4000 + this.VRAMBanks.length * 0x2000)
            throw 'invalid NES format';
        
        let idx = 0x10;
        if (fTrainer) {
            this.trainer = rawBytes.slice(idx, idx + 0x100);
            idx += 0x100;
        }

        for (let ibank = 0; ibank < this.RAMBanks.length; ibank++) {
            this.RAMBanks[ibank] = new RAM(0x2000);
        }

        for (let ibank = 0; ibank < this.ROMBanks.length; ibank++) {
            this.ROMBanks[ibank] = new ROM(rawBytes.slice(idx, idx + 0x4000));
            idx += 0x4000;
        }

        for (let ibank = 0; ibank < this.VRAMBanks.length; ibank++) {
            this.VRAMBanks[ibank] = RAM.fromBytes(rawBytes.slice(idx, idx + 0x2000));
            idx += 0x2000;
        }
    }
}