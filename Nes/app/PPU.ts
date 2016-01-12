class PPU {
    
    /**
     *
        Address range	Size	Description
        $0000-$0FFF	$1000	Pattern table 0
        $1000-$1FFF	$1000	Pattern Table 1
        $2000-$23FF	$0400	Nametable 0
        $2400-$27FF	$0400	Nametable 1
        $2800-$2BFF	$0400	Nametable 2
        $2C00-$2FFF	$0400	Nametable 3
        $3000-$3EFF	$0F00	Mirrors of $2000-$2EFF
        $3F00-$3F1F	$0020	Palette RAM indexes
        $3F20-$3FFF	$00E0	Mirrors of $3F00-$3F1F

     */
    rgaddrNametable = [0x2000, 0x2400, 0x2800, 0x2c00];
    rgcolorBackground = [0x00000, 0x0000ff, 0x00ff00, 0x000000, 0xff0000, 0x000000, 0x000000, 0x000000];

    iaddrWrite = 0;
    addrWrite = 0;
    daddrWrite = 1;
    addrSpritePatternTable = 0;
    addrScreenPatternTable = 0;
    spriteHeight = 8;
    vblankEnable = false;
    imageMask = false;
    spriteMask = false;
    screenEnable = false;
    spritesEnable = false;
    icolorBackground:number;

    inametable: number;

    constructor(memory: CompoundMemory, public vmemory: Memory) {
        if (vmemory.size() !== 0x4000)
            throw 'insufficient Vmemory size';

        memory.shadowSetter(0x2000, 0x2007, this.setter.bind(this));
    }
 
    private setter(addr: number, value: number) {
        value &= 0xff;

        /*$0x2006 Used to set the address of PPU Memory to be accessed via
          $2007. The first write to this register will set 8 lower
          address bits. The second write will set 6 upper bits. The
          address will increment either by 1 or by 32 after each
          access to $2007 (see "PPU Memory").
        */
        switch (addr) {
            case 0x2000:
                this.inametable = value & 0x03;
                this.daddrWrite = value & 0x04 ? 32 : 1;
                this.addrSpritePatternTable = value & 0x08 ? 0x1000 : 0;
                this.addrScreenPatternTable = value & 0x10 ? 0x1000 : 0;
                this.spriteHeight = value & 0x20 ? 16 : 8;
                this.vblankEnable = !!(value & 0x80);
                break;
            case 0x2001:
                this.imageMask = !!(value & 0x01);
                this.spriteMask = !!(value & 0x02);
                this.screenEnable = !!(value & 0x04);
                this.spritesEnable = !!(value & 0x08);
                this.imageMask = !!(value & 0x01);
                this.icolorBackground = (value >> 4) & 0x07;
                break;
            case 0x2006:
                if (this.iaddrWrite === 0) {
                    this.addrWrite = (value & 0x3f) << 8;
                    this.iaddrWrite = 1;
                } else {
                    this.addrWrite |= value & 0xff;
                    this.iaddrWrite = 0;
                }
                break;
            case 0x2007:
                this.vmemory.setByte(this.addrWrite, value);
                this.addrWrite += this.daddrWrite;
                break;
        }
    }

    public render(canvas: HTMLCanvasElement) {
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, 256, 240);
        var buf = new ArrayBuffer(imageData.data.length);

        var buf8 = new Uint8ClampedArray(buf);
        var data = new Uint32Array(buf);
        for (let nametableRow = 0; nametableRow < 30; nametableRow++) {
            for (let nametableCol = 0; nametableCol < 32; nametableCol++) {
                let addrPattern = this.rgaddrNametable[this.inametable] + nametableCol + 32 * nametableRow;
                let ipattern = this.vmemory.getByte(addrPattern);
                for (let y = 0; y < 8; y++) {
                    let patternRow = this.vmemory.getByte(this.addrScreenPatternTable + ipattern * 16 + y);
                    for (let x = 7; x >= 0; x--) {
                        let dataAddr = ((nametableRow*8 + y) * 256 + (nametableCol * 8) + 7 - x);
                        if (patternRow & (1 << x))
                            data[dataAddr] = 0xffffffff;
                        else
                            data[dataAddr] = 0xff000000;
                    }
                }
            }
        }
        (<any>imageData.data).set(buf8);
        ctx.putImageData(imageData, 0, 0);
    }
}