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


     /**
     *The PPU uses the current VRAM address for both reading and writing PPU memory thru $2007, and for 
     * fetching nametable data to draw the background. As it's drawing the background, it updates the 
     * address to point to the nametable data currently being drawn. Bits 10-11 hold the base address of 
     * the nametable minus $2000. Bits 12-14 are the Y offset of a scanline within a tile.
        The 15 bit registers t and v are composed this way during rendering:
        yyy NN YYYYY XXXXX
        ||| || ||||| +++++-- coarse X scroll
        ||| || +++++-------- coarse Y scroll
        ||| ++-------------- nametable select
        +++----------------- fine Y scroll
     */
    _v: number = 0; // Current VRAM address (15 bits)

    get v() {
        return this._v;
    }
    set v(value: number) {
        this._v = value;
    }
    t: number = 0; // Temporary VRAM address (15 bits); can also be thought of as the address of the top left onscreen tile.
    x: number = 0; // Fine X scroll (3 bits)
    w: number = 0; // First or second write toggle (1 bit)
    daddrWrite: number = 0;
    addrSpritePatternTable: number = 0;
    addrScreenPatternTable: number = 0;

   
    nmi_occured = false;
    nmi_output = false;


    spriteHeight = 8;
    _imageGrayscale = false;
    _showBgInLeftmost8Pixels = false;
    _showSpritesInLeftmost8Pixels = false;
    _showBg = false;
    _showSprites = false;
    _emphasizeRed = false;
    _emphasizeGreen = false;
    _emphasizeBlue = false;

    imageGrayscale = false;
    showBgInLeftmost8Pixels = false;
    showSpritesInLeftmost8Pixels = false;
    showBg = false;
    showSprites = false;
    emphasizeRed = false;
    emphasizeGreen = false;
    emphasizeBlue = false;

    static syFirstVisible = 0;
    static syPostRender= 240;
    static syPreRender= 261;
    static sxMin = 0;
    static sxMax = 340;

    private sy = PPU.syFirstVisible;
    private sx = PPU.sxMin;

    private ctx:CanvasRenderingContext2D;
    private imageData: ImageData;
    private buf: ArrayBuffer;
    private buf8: Uint8ClampedArray;
    private data: Uint32Array;
    private dataAddr = 0;

  

    constructor(memory: CompoundMemory, public vmemory: Memory, private cpu:Mos6502) {
        if (vmemory.size() !== 0x4000)
            throw 'insufficient Vmemory size';

        memory.shadowSetter(0x2000, 0x2007, this.setter.bind(this));
        memory.shadowGetter(0x2000, 0x2007, this.getter.bind(this));
    }

    public setCtx(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.imageData = this.ctx.getImageData(0, 0, 256, 240);
        this.buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(this.buf);
        this.data = new Uint32Array(this.buf);
    }

    private getter(addr: number) {
        switch (addr) {
        case 0x2002:
            /*
                7  bit  0
                ---- ----
                VSO. ....
                |||| ||||
                |||+-++++- Least significant bits previously written into a PPU register
                |||        (due to register not being updated for this address)
                ||+------- Sprite overflow. The intent was for this flag to be set
                ||         whenever more than eight sprites appear on a scanline, but a
                ||         hardware bug causes the actual behavior to be more complicated
                ||         and generate false positives as well as false negatives; see
                ||         PPU sprite evaluation. This flag is set during sprite
                ||         evaluation and cleared at dot 1 (the second dot) of the
                ||         pre-render line.
                |+-------- Sprite 0 Hit.  Set when a nonzero pixel of sprite 0 overlaps
                |          a nonzero background pixel; cleared at dot 1 of the pre-render
                |          line.  Used for raster timing.
                +--------- Vertical blank has started (0: not in vblank; 1: in vblank).
                           Set at dot 1 of line 241 (the line *after* the post-render
                           line); cleared after reading $2002 and at dot 1 of the
                           pre-render line.
                Notes
                Reading the status register will clear D7 mentioned above and also the address latch used by PPUSCROLL and PPUADDR. It does not clear the sprite 0 hit or overflow bit.
                Once the sprite 0 hit flag is set, it will not be cleared until the end of the next vertical blank. If attempting to use this flag for raster timing, it is important to ensure that the sprite 0 hit check happens outside of vertical blank, otherwise the CPU will "leak" through and the check will fail. The easiest way to do this is to place an earlier check for D6 = 0, which will wait for the pre-render scanline to begin.
                If using sprite 0 hit to make a bottom scroll bar below a vertically scrolling or freely scrolling playfield, be careful to ensure that the tile in the playfield behind sprite 0 is opaque.
                Sprite 0 hit is not detected at x=255, nor is it detected at x=0 through 7 if the background or sprites are hidden in this area.
                See: PPU rendering for more information on the timing of setting and clearing the flags.
                Some Vs. System PPUs return a constant value in D4-D0 that the game checks.
                Caution: Reading PPUSTATUS at the exact start of vertical blank will return 0 in bit 7 but clear the latch anyway, causing the program to miss frames. See NMI for details
              */
            this.w = 0;

            var res = this.nmi_occured ? (1<<7) : 0;
            //Read PPUSTATUS: Return old status of NMI_occurred in bit 7, then set NMI_occurred to false.
            this.nmi_occured = false;
            return res;
        default:
            throw 'unimplemented read from addr ' + addr;
            return 0;
        }
    }

    private setter(addr: number, value: number) {
        value &= 0xff;

     
        switch (addr) {
        case 0x2000:
            this.t = (this.v & 0x73ff) | ((value & 3) << 10);
            this.daddrWrite = value & 0x04 ? 32 : 1; //VRAM address increment per CPU read/write of PPUDATA
            this.addrSpritePatternTable = value & 0x08 ? 0x1000 : 0;
            this.addrScreenPatternTable = value & 0x10 ? 0x1000 : 0;
            this.spriteHeight = value & 0x20 ? 16 : 8;
            this.nmi_output = !!(value & 0x80);

          
            break;
        case 0x2001:
            this._imageGrayscale = !!(value & 0x01);
            this._showBgInLeftmost8Pixels = !!(value & 0x02);
            this._showSpritesInLeftmost8Pixels = !!(value & 0x04);
            this._showBg = !!(value & 0x08);
            this._showSprites = !!(value & 0x10);
            this._emphasizeRed = !!(value & 0x20);
            this._emphasizeGreen = !!(value & 0x40);
            this._emphasizeBlue = !!(value & 0x80);
            break;
        case 0x2005:
            if (this.w === 0) {
                this.t = (this.t & 0x73e0) | ((value >> 3) & 0x1f);
                this.x = value & 7;
            } else {
                this.t = (this.t & 0x7c1f) | (((value >> 3) & 0x1f) << 5);
                this.t = (this.t & 0x0fff) | (value & 7) << 10;
            }
            this.w = 1 - this.w;
            break;
           
        // Used to set the address of PPU Memory to be accessed via 0x2007
        // The first write to this register will set 8 lower address bits.
        // The second write will set 6 upper bits.The address will increment
        // either by 1 or by 32 after each access to $2007.
        case 0x2006: 
                
            
            if (this.w === 0) {
                this.t = (this.t & 0x00ff) | ((value & 0x3f) << 8);
            } else {
                this.t = (this.t & 0xff00) + (value & 0xff);
                this.v = this.t;
            }
            this.w = 1 - this.w;
            break;
        case 0x2007:
            var vold = this.v;
          
            this.vmemory.setByte(this.v & 0x3fff, value);
            this.v += this.daddrWrite;
            this.v &= 0x3fff;
            console.log('x', this.showBg, vold, this.v, String.fromCharCode(value));
            break;
        }
    }

    private incrementX() {
       
        this.x++;
        if (this.x === 8) {
            this.x = 0;
            // Coarse X increment
            // The coarse X component of v needs to be incremented when the next tile is reached.
            // Bits 0- 4 are incremented, with overflow toggling bit 10. This means that bits 0- 4 count 
            // from 0 to 31 across a single nametable, and bit 10 selects the current nametable horizontally.

            if ((this.v & 0x001F) === 31) { // if coarse X == 31
                this.v &= ~0x001F; // coarse X = 0
                this.v ^= 0x0400; // switch horizontal nametable
            } else {
                this.v += 1; // increment coarse X
            }
        }
    }

    private incrementY() {
       
        this.v = (this.v & ~0x001F) | (this.t & 0x1f); // reset coarse X
        this.v ^= 0x0400; // switch horizontal nametable

        // If rendering is enabled, fine Y is incremented at dot 256 of each scanline, overflowing to coarse Y, 
        // and finally adjusted to wrap among the nametables vertically.
        // Bits 12- 14 are fine Y.Bits 5- 9 are coarse Y.Bit 11 selects the vertical nametable.
        if ((this.v & 0x7000) !== 0x7000) // if fine Y < 7
            this.v += 0x1000; // increment fine Y
        else {
            this.v &= ~0x7000; // fine Y = 0

            var y = (this.v & 0x03E0) >> 5; // let y = coarse Y
            if (y === 29) {
                y = 0; // coarse Y = 0
                this.v ^= 0x0800; // switch vertical nametable
            } else if (y === 31) {
                y = 0; // coarse Y = 0, nametable not switched
            } else {
                y += 1; // increment coarse Y
            }
            this.v = (this.v & ~0x03E0) | (y << 5); // put coarse Y back into v
            /* Row 29 is the last row of tiles in a nametable. To wrap to the next nametable when incrementing coarse Y from 29, 
               the vertical nametable is switched by toggling bit 11, and coarse Y wraps to row 0.
               Coarse Y can be set out of bounds (> 29), which will cause the PPU to read the attribute data stored there as tile data. 
               If coarse Y is incremented from 31, it will wrap to 0, but the nametable will not switch. 
               For this reason, a write >= 240 to $2005 may appear as a "negative" scroll value, where 1 or 2 rows of attribute data will 
               appear before the nametable's tile data is reached.
            */
        }
    }
    public getNameTable(i) {
        var st = '';
        for (var y = 0; y < 30; y++){
            for (var x = 0; x < 32; x++) {
                st += String.fromCharCode(this.vmemory.getByte(0x2000 + x + y * 32));
            }
            st += '\n';

        }
        console.log(st);
    }

    icycle = 0;

    public step() {


        if (this.sx === 0 && this.sy === PPU.syPostRender) {
            console.log('ppu vblank start', this.icycle);
            this.sx = PPU.sxMin;
            (<any>this.imageData.data).set(this.buf8);
            this.ctx.putImageData(this.imageData, 0, 0);

            this.dataAddr = 0;
            this.nmi_occured = true;

            this.imageGrayscale = this._imageGrayscale;
            this.showBgInLeftmost8Pixels = this._showBgInLeftmost8Pixels;
            this.showSpritesInLeftmost8Pixels = this._showSpritesInLeftmost8Pixels;
            this.showBg = this._showBg;
            this.showSprites = this._showSprites;
            this.emphasizeRed = this._emphasizeRed;
            this.emphasizeGreen = this._emphasizeGreen;
            this.emphasizeBlue = this._emphasizeBlue;


        } else if (this.sy >= PPU.syPostRender && this.sy <= PPU.syPreRender) {
            //vblank
            if (this.nmi_occured && this.nmi_output) {
                this.nmi_output = false;
                this.cpu.RequestNMI();
            }
        } else if (this.sy === PPU.syFirstVisible && this.sx === 0) {
            //beginning of screen
            console.log('ppu vblank end');
            this.nmi_occured = false;

            if (this.showBg)
                this.v = this.t;
        }

        
        if (this.showBg && this.sx >= 0 && this.sy >= PPU.syFirstVisible && this.sx < 256 && this.sy < PPU.syPostRender) {

            // The high bits of v are used for fine Y during rendering, and addressing nametable data 
            // only requires 12 bits, with the high 2 CHR addres lines fixed to the 0x2000 region. 
            //
            // The address to be fetched during rendering can be deduced from v in the following way:
            //   tile address      = 0x2000 | (v & 0x0FFF)
            //   attribute address = 0x23C0 | (v & 0x0C00) | ((v >> 4) & 0x38) | ((v >> 2) & 0x07)
            //
            // The low 12 bits of the attribute address are composed in the following way:
            //   NN 1111 YYY XXX
            //   || |||| ||| +++-- high 3 bits of coarse X (x / 4)
            //   || |||| +++------ high 3 bits of coarse Y (y / 4)
            //   || ++++---------- attribute offset (960 bytes)
            //   ++--------------- nametable select

            let addrAttribute = 0x23C0 | (this.v & 0x0C00) | ((this.v >> 4) & 0x38) | ((this.v >> 2) & 0x07);
            var attribute = this.vmemory.getByte(addrAttribute);

            let addrTile = 0x2000 | (this.v & 0x0fff);
            let itile = this.vmemory.getByte(addrTile);
            var tileCol = 7 - (this.x);
            var tileRow = this.v >> 12;

            let ipalette0 = ((this.vmemory.getByte(this.addrScreenPatternTable + itile * 16 + tileRow)) >> tileCol) & 1;
            let ipalette1 = ((this.vmemory.getByte(this.addrScreenPatternTable + itile * 16 + 8 + tileRow)) >> tileCol) & 1;
            let ipalette23 = (attribute >> ((this.v >> 5) & 2 + (this.v >> 1) & 1)) & 3;
            let ipalette = (ipalette23 << 2) + (ipalette1 << 1) + ipalette0;

            /* Addresses $3F04/$3F08/$3F0C can contain unique data, though these values are not used by the PPU when normally rendering 
                (since the pattern values that would otherwise select those cells select the backdrop color instead).
                They can still be shown using the background palette hack, explained below.*/
            if ((ipalette & 3) === 0)
                ipalette = 0;
            let addrPalette = 0x3f00 + ipalette;
            let icolor = this.vmemory.getByte(addrPalette);
            let color = this.colors[icolor];
            this.data[this.dataAddr] = color;
            this.dataAddr++;
            this.incrementX();
        }

        this.sx++;
        if (this.sx === PPU.sxMax + 1) {
            //end of scanline
            this.sx = 0;
            this.sy++;
            if (this.sy === PPU.syPreRender + 1) {
                this.sy = PPU.syFirstVisible;
            } else {
                if(this.sy < PPU.syPostRender)
                    this.incrementY();
            }
        }

    }

    private colors = [
        0xff545454, 0xff001e74, 0xff081090, 0xff300088, 0xff440064, 0xff5c0030, 0xff540400, 0xff3c1800,
        0xff202a00, 0xff083a00, 0xff004000, 0xff003c00, 0xff00323c, 0xff000000, 0xff000000, 0xff000000,

        0xff989698, 0xff084cc4, 0xff3032ec, 0xff5c1ee4, 0xff8814b0, 0xffa01464, 0xff982220, 0xff783c00,
        0xff545a00, 0xff287200, 0xff087c00, 0xff007628, 0xff006678, 0xff000000, 0xff000000, 0xff000000,

        0xffeceeec, 0xff4c9aec, 0xff787cec, 0xffb062ec, 0xffe454ec, 0xffec58b4, 0xffec6a64, 0xffd48820,
        0xffa0aa00, 0xff74c400, 0xff4cd020, 0xff38cc6c, 0xff38b4cc, 0xff3c3c3c, 0xff000000, 0xff000000,

        0xffeceeec, 0xffa8ccec, 0xffbcbcec, 0xffd4b2ec, 0xffecaeec, 0xffecaed4, 0xffecb4b0, 0xffe4c490,
        0xffccd278, 0xffb4de78, 0xffa8e290, 0xff98e2b4, 0xffa0d6e4, 0xffa0a2a0, 0xff000000, 0xff000000
    ];
}