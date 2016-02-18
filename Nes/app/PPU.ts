class SpriteRenderingInfo {
    xCounter: number;
    tileLo: number;
    tileHi: number;
    ipaletteBase:number;
    flipHoriz:boolean;
    flipVert: boolean;
    behindBg: boolean;
}

enum OamState {
    FillSecondaryOam,
    CheckOverflow,
    Done
}

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
    oamAddr: number = 0; // Current oam address
    v: number = 0; // Current VRAM address (15 bits)
    t: number = 0; // Temporary VRAM address (15 bits); can also be thought of as the address of the top left onscreen tile.
    x: number = 0; // Fine X scroll (3 bits)
    w: number = 0; // First or second write toggle (1 bit)
    nt:number; // current nametable byte;
    at:number; // current attribute table byte;
    p2:number; // current palette table byte;
    p3: number; // current palette table byte;
    bgTileLo:number; //low background tile byte
    bgTileHi:number; //high background tile byte;

    daddrWrite: number = 0;
    addrSpriteBase: number = 0;
    addrTileBase: number = 0;

   
    flgVblank = false;
    flgSpriteZeroHit = false;
    flgSpriteOverflow = false;
    nmi_output = false;


    spriteHeight = 8;
   
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

    public iFrame = 0;

    private secondaryOam: Uint8Array;
    private oam:Uint8Array;
    private rgspriteRenderingInfo: SpriteRenderingInfo[];
    private ispriteNext = 0;
    /**
     * yyy NN YYYYY XXXXX
        ||| || ||||| +++++-- coarse X scroll
        ||| || +++++-------- coarse Y scroll
        ||| ++-------------- nametable select
        +++----------------- fine Y scroll
     */

    get y() {
        return (this.t >> 12) & 0x7;
    }
    
    get currentNameTable() {
        return (this.t >> 10) & 0x3;
    }

    get coarseY() {
        return (this.t >> 5) & 31;
    }

    set coarseY(value:number) {
        this.t = (this.t & 0x7c1f) | ((value & 31) << 5);
    }
    get coarseX() {
        return this.t & 31;
    }

    set coarseX(value:number) {
        this.t = (this.t & 0x7fe0) | ((value & 31));
    }
    constructor(memory: CompoundMemory, public vmemory: CompoundMemory, private cpu:Mos6502) {
        if (vmemory.size() !== 0x4000)
            throw 'insufficient Vmemory size';

        memory.shadowSetter(0x2000, 0x3fff, this.ppuRegistersSetter.bind(this));
        memory.shadowGetter(0x2000, 0x3fff, this.ppuRegistersGetter.bind(this));

        vmemory.shadowSetter(0x3000, 0x3eff, this.nameTableSetter.bind(this));
        vmemory.shadowGetter(0x3000, 0x3eff, this.nameTableGetter.bind(this));

        vmemory.shadowSetter(0x3f10, 0x3f10, this.paletteSetter.bind(this));
        vmemory.shadowGetter(0x3f10, 0x3f10, this.paletteGetter.bind(this));

        vmemory.shadowSetter(0x3f20, 0x3fff, this.paletteSetter.bind(this));
        vmemory.shadowGetter(0x3f20, 0x3fff, this.paletteGetter.bind(this));

        this.secondaryOam = new Uint8Array(32);
        this.oam = new Uint8Array(256);
        this.rgspriteRenderingInfo = [];
        for (let isprite = 0; isprite < 8; isprite++)
            this.rgspriteRenderingInfo.push(new SpriteRenderingInfo());
    }

    public setCtx(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.imageData = this.ctx.getImageData(0, 0, 256, 240);
        this.buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(this.buf);
        this.data = new Uint32Array(this.buf);
    }

    private nameTableSetter(addr: number, value: number)
    {
       return this.vmemory.setByte(addr - 0x1000, value);
    }

    private nameTableGetter(addr: number) {
        return this.vmemory.getByte(addr - 0x1000);
    }

    private paletteSetter(addr: number, value: number) {
        if (addr === 0x3f10)
            addr = 0x3f00;
        else 
            addr = 0x3f00 + (addr - 0x3f20) % 0x20;
        return this.vmemory.setByte(addr, value);
    }

    private paletteGetter(addr: number) {
        if(addr === 0x3f10)
            addr = 0x3f00;
        else 
            addr = 0x3f00 + (addr - 0x3f20) % 0x20;
        return this.vmemory.getByte(addr);

    }

    lastWrittenStuff: number = 0;
    vramReadBuffer:number = 0;
    private ppuRegistersGetter(addr: number) {

        addr = (addr - 0x2000) % 8;
        switch (addr) {
        case 0x2:
        {
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

            let res = this.flgVblank ? (1 << 7) : 0;
            res += this.flgSpriteZeroHit ? (1 << 6) : 0;
            res += this.flgSpriteOverflow ? (1 << 5) : 0;
            res |= (this.lastWrittenStuff & 0x63);
            //Read PPUSTATUS: Return old status of NMI_occurred in bit 7, then set NMI_occurred to false.
            this.flgVblank = false;
            this.cpu.nmiLine = 1;
            return res;
        }
        case 0x7:
        {
            this.v &= 0x3fff;
            let res;
            if (this.v >= 0x3f00) {
                res = this.vmemory.getByte(this.v);
                this.vramReadBuffer = this.vmemory.getByte((this.v & 0xff) | 0x2f00);
            } else {
                res = this.vramReadBuffer;
                this.vramReadBuffer = this.vmemory.getByte(this.v);
            }
              
            this.v += this.daddrWrite;
            this.v &= 0x3fff;

            return res;
        }
        default:
            console.error('unimplemented read from addr ' + addr);
            return 0;
        }
    }

    private ppuRegistersSetter(addr: number, value: number) {
        this.lastWrittenStuff = value;
       
        value &= 0xff;
        addr = (addr - 0x2000) % 8;

        switch (addr) {
        case 0x0:
            this.t = (this.t & 0x73ff) | ((value & 3) << 10); //2 nametable select bits sent to $2000
            this.daddrWrite = value & 0x04 ? 32 : 1; //VRAM address increment per CPU read/write of PPUDATA
            this.addrSpriteBase = value & 0x08 ? 0x1000 : 0;
            this.addrTileBase = value & 0x10 ? 0x1000 : 0;
            this.spriteHeight = value & 0x20 ? 16 : 8;
            this.nmi_output = !!(value & 0x80);

            if (this.spriteHeight === 16)
                throw 'sprite height 16 is not supported';
            break;
        case 0x1:
            this.imageGrayscale = !!(value & 0x01);
            this.showBgInLeftmost8Pixels =  !!(value & 0x02);
            this.showSpritesInLeftmost8Pixels =  !!(value & 0x04);
            this.showBg =   !!(value & 0x08);
            this.showSprites =  !!(value & 0x10);
            this.emphasizeRed = !!(value & 0x20);
            this.emphasizeGreen =  !!(value & 0x40);
            this.emphasizeBlue =   !!(value & 0x80);
            break;
        case 0x3:
            this.oamAddr = value;
            break;
        case 0x4:
            this.oam[this.oamAddr++] = value;
            break;
        case 0x5:
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
        case 0x6: 
                
            
            if (this.w === 0) {
                this.t = (this.t & 0x00ff) | ((value & 0x3f) << 8);
            } else {
                this.t = (this.t & 0xff00) + (value & 0xff);
                this.v = this.t;
            }
            this.w = 1 - this.w;
            break;
        case 0x7:

            this.vmemory.setByte(this.v & 0x3fff, value);
            this.v += this.daddrWrite;
            this.v &= 0x3fff;
            break;
        }
    }

    private resetHoriV() {

        if (!this.showBg && !this.showSprites)
            return;
            
       // At dot 257 of each scanline
       // If rendering is enabled, the PPU copies all bits related to horizontal position from t to v:
       // v: ....F.. ...EDCBA = t: ....F.. ...EDCBA
        this.v = (this.v & 0xfbe0) | (this.t & 0x041f);
    }

    private resetVertV() {
         if (!this.showBg && !this.showSprites)
            return;

        //During dots 280 to 304 of the pre-render scanline (end of vblank)
        //If rendering is enabled, at the end of vblank, shortly after the horizontal bits are copied from t to v at dot 257, the PPU will repeatedly copy the vertical bits from t to v from dots 280 to 304, completing the full initialization of v from t:
        //v: IHGF.ED CBA..... = t: IHGF.ED CBA.....
        this.v = (this.v & 0x041f) | (this.t & 0xfbe0);
    }

    private incHoriV() {
        if (!this.showBg && !this.showSprites)
            return;
     
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

    private incVertV() {

        if (!this.showBg && !this.showSprites)
            return;

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

    private fetchUnusedNt() {
        if (!this.showBg && !this.showSprites)
            return;

        const addr = 0x2000 | (this.v & 0x0fff);
        this.vmemory.getByte(addr);
    }

    private fetchNt() {
        if (!this.showBg && !this.showSprites)
            return;

        const addr = 0x2000 | (this.v & 0x0fff);
        this.nt = this.vmemory.getByte(addr);
    }

    private fetchAt() {
        if (!this.showBg && !this.showSprites)
            return;
        const addr = 0x23C0 | (this.v & 0x0C00) | ((this.v >> 4) & 0x38) | ((this.v >> 2) & 0x07);
        this.at = this.vmemory.getByte(addr);
    
        let dx = (this.v >> 1) & 1; //second bit of coarse x
        let dy = (this.v >> 6) & 1; //second bit of coarse y
       
        let p = (this.at >> ((dy << 2) + (dx << 1))) & 3;

        this.p2 = (this.p2 & 0xffff00) | (p & 1 ? 0xff : 0);
        this.p3 = (this.p3 & 0xffff00) | (p & 2 ? 0xff : 0);
      
    }

    private fetchSpriteTileLo(yTop, nt, flipVert) {
        const y = flipVert ? 7 - (this.sy - yTop) : this.sy - yTop ;
        return this.vmemory.getByte(this.addrSpriteBase + nt * 16 + y);
    }

    private fetchSpriteTileHi(yTop, nt, flipVert) {
        const y = flipVert ? 7 - (this.sy - yTop) : this.sy - yTop;
        return this.vmemory.getByte(this.addrSpriteBase + nt * 16 + 8 + y);
    }

    private fetchBgTileLo() {
        if (!this.showBg && !this.showSprites)
            return;
        const y = (this.v >> 12) & 0x07;
        var b = this.vmemory.getByte(this.addrTileBase + this.nt * 16 + y);
        this.bgTileLo = (b & 0xff) | (this.bgTileLo & 0xffff00);
       
    }
    
    private fetchBgTileHi() {
        if (!this.showBg && !this.showSprites)
            return;
        const y = (this.v >> 12) & 0x07;
        var b = this.vmemory.getByte(this.addrTileBase + this.nt * 16 + 8 + y);

        this.bgTileHi = (b & 0xff) | (this.bgTileHi & 0xffff00);
    }

    public getNameTable(i) {
        var st = '';
        for (var y = 0; y < 30; y++){
            for (var x = 0; x < 32; x++) {
                st += String.fromCharCode(this.vmemory.getByte(0x2000 + (i*0x400) + x + y * 32));
            }
            st += '\n';
        }
        console.log(st);
    }

    public getPatternTable() {
        const canvas:HTMLCanvasElement = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width,canvas.height);
        const buf = new ArrayBuffer(imageData.data.length);
        const buf8 = new Uint8ClampedArray(buf);
        const data = new Uint32Array(buf);

        for (let t = 0; t < 2; t++) {
            for (let a = 0; a < 256; a++) {
                for (let x = 0; x < 8; x ++) {
                    for (let y = 0; y < 8; y++) {
                        var irow = (a >> 4) * 8 + y;
                        var icol = 128 * t + (a & 15) * 8 + x;
                        
                        var b1 = (this.vmemory.getByte(t* 0x1000 + a * 16 + y) >> (7-x)) & 1;
                        var b2 = (this.vmemory.getByte(t* 0x1000 + a * 16 + y + 8) >> (7-x)) & 1;
                        data[ irow * 256 + icol] = this.colors[this.vmemory.getByte(0x3f00 + (b2 << 1) + b1)] ;
                    }
                }
            }
        }

        (<any>imageData.data).set(buf8);
        ctx.putImageData(imageData, 0, 0);
        document.body.appendChild(canvas);

    
    }
    public getAttributeTable(i) {
        var st = '';
        for (var dy = 0; dy < 30; dy+=2){
            for (var dx = 0; dx < 32; dx+=2) {
                var x = this.coarseX + dx;
                var y = this.coarseY + dy;

                const addr = 0x23C0 | (i << 10) | (((y >> 2) & 0x07) << 3) | ((x >> 2) & 0x07);
                var at = this.vmemory.getByte(addr);
                let x2 = (x >> 1) & 1; //second bit of coarse x
                let y2 = (y >> 1) & 1; //second bit of coarse y
       
                let p = (at >> ((y2 << 2) + (x2 << 1))) & 3;
                st += p + ' ';
            }
            st += '\n';
        }
        console.log(st);
    }
    icycle = 0;

    //iFrameX = 0;
    // zizi = 0;
    public step() {
        //if ((this.iFrame & 1) && !this.sx && !this.sy)
        //    this.stepI();

        this.stepI();

        //this.zizi++;

        //if (this.iFrameX != this.iFrame) {
        //    console.log('zizi', this.zizi);
        //    this.zizi = 0;
        //    this.iFrameX = this.iFrame;
        //}
    }

    oamB: number;
    m: number;
    n: number;
    addrSecondaryOam;
    oamState:OamState;

    public stepOam() {

        //http://wiki.nesdev.com/w/index.php/PPU_sprite_evaluation

        if (this.sy === 261 && this.sx === 1) {
            this.flgSpriteOverflow = false;
        } else if (this.sy >= 0 && this.sy <= 239) {
            if (this.sx >= 1 && this.sx <= 64) {
                // Cycles 1- 64: Secondary OAM (32 - byte buffer for current sprites on scanline) is
                // initialized to $FF - attempting to read $2004 will return $FF.Internally, the clear operation 
                // is implemented by reading from the OAM and writing into the secondary OAM as usual, only a signal 
                // is active that makes the read always return $FF.
                this.secondaryOam[this.sx] = 0xff;
                if (this.sx === 64) {
                    this.m = 0;
                    this.n = 0;
                    this.addrSecondaryOam = 0;
                    this.oamState = OamState.FillSecondaryOam;
                }
            }
            else if (this.sx >= 65 && this.sx <= 256) {
               // Cycles 65- 256: Sprite evaluation
               //  On odd cycles, data is read from (primary) OAM
               //  On even cycles, data is written to secondary OAM (unless writes are inhibited, in which case it will read the value in secondary OAM instead)
               //  1. Starting at n = 0, read a sprite's Y-coordinate (OAM[n][0], copying it to the next open slot in secondary OAM
               //        (unless 8 sprites have been found, in which case the write is ignored).
               //     1a.If Y- coordinate is in range, copy remaining bytes of sprite data (OAM[n][1] thru OAM[n][3]) into secondary OAM.

                if (this.sx & 1) {
                    this.oamB = this.oam[(this.n << 2) + this.m];
                } else {
                    switch (this.oamState) {
                        case OamState.FillSecondaryOam:
                            if (this.m === 0) {
                                this.secondaryOam[this.addrSecondaryOam] = this.oamB;
                                if (this.sy >= this.oamB && this.sy <= this.oamB + 7) {
                                    this.addrSecondaryOam++;
                                    this.m++; //start copying
                                } else {
                                    this.n++;
                                }
                            } else { //copying
                                this.secondaryOam[this.addrSecondaryOam++] = this.oamB;
                                this.m++;
                                if (this.m === 4)
                                    [this.n, this.m] = [this.n + 1, 0];
                            }

                            if (this.n === 64)
                                [this.oamState, this.n, this.m] = [OamState.Done, 0, 0];
                            else if (this.addrSecondaryOam === 32) //found 8 sprites
                                [this.oamState, this.n, this.m] = [OamState.CheckOverflow, this.n, 0];
                            break;

                        case OamState.CheckOverflow:
                            if (this.m === 0) {
                                if (this.oamB >= this.sy - 1 && this.oamB <= this.sy + 7) {
                                    this.flgSpriteOverflow = true;
                                    this.m++;
                                } else {
                                    this.n++;
                                    this.m++; //this is the sprite overflow bug.
                                }
                            } else { //dummy reads
                                this.m++;
                                if (this.m === 4) 
                                    [this.n, this.m] = [this.n + 1, 0]; 
                            }

                            if (this.n === 64)
                                [this.oamState, this.n, this.m] = [OamState.Done, 0, 0];
                            break;

                        case OamState.Done:
                            break;
                        }
                }
            }
            else if (this.sx >= 257 && this.sx <= 320) {
                let isprite = (this.sx - 257) >> 3;
                var addrOamBase = isprite << 2;
                let spriteRenderingInfo = this.rgspriteRenderingInfo[isprite];
                this.oamAddr = 0;
                let b0 = this.secondaryOam[addrOamBase + 0];

                if (b0 < 0xef) {
                    switch (this.sx & 7) {
                        case 1:
                        {
                            let b2 = this.secondaryOam[addrOamBase + 2];
                            let b3 = this.secondaryOam[addrOamBase + 3];
                            spriteRenderingInfo.ipaletteBase = (b2 & 3) << 2;
                            spriteRenderingInfo.behindBg = !!(b2 & (1 << 5));
                            spriteRenderingInfo.flipHoriz = !!(b2 & (1 << 6));
                            spriteRenderingInfo.flipVert = !!(b2 & (1 << 7));
                            spriteRenderingInfo.xCounter = b3;
                        }
                        case 0:
                        {
                            let b1 = this.secondaryOam[addrOamBase + 1];
                            spriteRenderingInfo.tileHi = this.fetchSpriteTileHi(b0, b1, spriteRenderingInfo.flipVert);
                            break;
                        }
                        case 6:
                        {
                            let b1 = this.secondaryOam[addrOamBase + 1];
                            this.rgspriteRenderingInfo[isprite].tileLo = this.fetchSpriteTileLo(b0, b1, spriteRenderingInfo.flipVert);
                            break;
                        }
                    }
                }
            }
            
        }
    }

    public stepI() {

        if (this.sx >= 0 && this.sy >= 0 && this.sx < 256 && this.sy < 240) {
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

            var icolorBg: number;
            var bgTransparent = true;
            if (this.showBg) {
                let tileCol = 16 - this.x;

                let ipalette0 = (this.bgTileLo >> (tileCol)) & 1;
                let ipalette1 = (this.bgTileHi >> (tileCol - 2)) & 1;
                let ipalette2 = (this.p2 >> (tileCol + 2)) & 1;
                let ipalette3 = (this.p3 >> (tileCol + 2)) & 1;
             
                let ipalette = (ipalette3 << 3) + (ipalette2 << 2) + (ipalette1 << 1) + ipalette0;
                bgTransparent = !ipalette0 && !ipalette1;
                 
                /* Addresses $3F04/$3F08/$3F0C can contain unique data, though these values are not used by the PPU when normally rendering 
                    (since the pattern values that would otherwise select those cells select the backdrop color instead).
                    They can still be shown using the background palette hack, explained below.*/


                // 0 in each palette means the default background color -> ipalette = 0
                if ((ipalette & 3) === 0)
                    ipalette = 0;

                icolorBg = this.vmemory.getByte(0x3f00 | ipalette);
                
            } else {

                if (this.v >= 0x3f00 && this.v <= 0x3fff)
                    icolorBg = this.vmemory.getByte(this.v);
                else
                    icolorBg = this.vmemory.getByte(0x3f00);
            }

            let icolorSprite = -1;
            var spriteTransparent = true;
            var spriteBehindBg = true;
            if (this.showSprites) {
                for (let isprite = 0; isprite < 8; isprite++) {
                    var spriteRenderingInfo = this.rgspriteRenderingInfo[isprite];

                    if (spriteTransparent && spriteRenderingInfo.xCounter <= 0 && spriteRenderingInfo.xCounter >= -7) {
                        let tileCol =  spriteRenderingInfo.flipHoriz ? -spriteRenderingInfo.xCounter : 7 + spriteRenderingInfo.xCounter;
                        let ipalette0 = (spriteRenderingInfo.tileLo >> tileCol) & 1;
                        let ipalette1 = (spriteRenderingInfo.tileHi >> tileCol) & 1;
                        if (ipalette0 || ipalette1) {
                            spriteTransparent = false;
                            spriteBehindBg = spriteRenderingInfo.behindBg;

                            let ipalette = spriteRenderingInfo.ipaletteBase + ipalette0 + (ipalette1 << 1);
                            if ((ipalette & 3) === 0)
                                ipalette = 0;
                            icolorSprite = this.vmemory.getByte(0x3f10 | ipalette);
                        }
                    }

                    spriteRenderingInfo.xCounter--;
                }
            }

            if (!spriteTransparent && (bgTransparent || !spriteBehindBg))
                this.data[this.dataAddr] = this.colors[icolorSprite];
            else
                this.data[this.dataAddr] = this.colors[icolorBg];
            this.dataAddr++;
        }

        ////dummy sprite zero hit
        if (this.sy === 30 && this.sx === 1)
            this.flgSpriteZeroHit = true;
        if (this.sy === 261 && this.sx === 0)
            this.flgSpriteZeroHit = false;

      
        this.stepOam();

        //http://wiki.nesdev.com/w/images/d/d1/Ntsc_timing.png
        if (this.sy >= 0 && this.sy <= 239 || this.sy === 261) {

             if ((this.sx >= 1 && this.sx <= 256) || (this.sx >= 321 && this.sx <= 336)) {
                this.bgTileLo = (this.bgTileLo << 1) & 0xffffff;
                this.bgTileHi = (this.bgTileHi << 1) & 0xffffff;
                this.p2 = (this.p2 << 1) & 0xffffff;
                this.p3 = (this.p3 << 1) & 0xffffff;

                if (this.sy === 261) {
                    if (this.sx === 1) {
                        this.flgVblank = false;
                        //sprite 0, overflow
                    }
                }

                if ((this.sx & 0x07) === 2) {
                    this.fetchNt();
                } else if ((this.sx & 0x07) === 4) {
                    this.fetchAt();
                } else if ((this.sx & 0x07) === 6) {
                    this.fetchBgTileLo();
                } else if ((this.sx & 0x07) === 0) {
                    this.fetchBgTileHi();

                    if (this.sx === 256)
                        this.incVertV();
                    else
                        this.incHoriV();
                }

               

            } else if (this.sx === 257) {
                this.resetHoriV();
            } else if (this.sy === 261 && this.sx >= 280 && this.sx <= 304) {
                this.resetVertV();
            } else if (this.sx >= 337 && this.sx <= 340) {
                if ((this.sx & 2) === 0) {
                    this.fetchUnusedNt();
                }
            } 
        } else if (this.sy === 240) {
            if (this.sx === 0) {
                (<any>this.imageData.data).set(this.buf8);
                this.ctx.putImageData(this.imageData, 0, 0);
                this.iFrame++;
                this.dataAddr = 0;
            }
        } else if (this.sy === 241) {
            if (this.sx === 1) {
                this.flgVblank = true;
                if (this.nmi_output) {
                  //  this.nmi_output = false;
                //    console.log('ppu nmi');
                    this.cpu.nmiLine = 0;
                }
            } else if (this.sx === 250) {
                this.cpu.nmiLine = 1;
            }
        }

        if ((this.showBg || this.showSprites) && this.sx === 339 && this.sy === 261 && (this.iFrame & 1)) {
            this.sx = 0;
            this.sy = 0;
        } else {
            this.sx++;
            if (this.sx === 341) {
                this.sx = 0;
                this.sy++;
            }
            if (this.sy === 262) {
                this.sy = 0;
            }
        }


    }

    private colors = [
        0xff545454, 0xff741e00, 0xff901008, 0xff880030,
        0xff640044, 0xff30005c, 0xff000454, 0xff00183c, 
        0xff002a20, 0xff003a08, 0xff004000, 0xff003c00, 
        0xff3c3200, 0xff000000, 0xff000000, 0xff000000,
        0xff989698, 0xffc44c08, 0xffec3230, 0xffe41e5c, 
        0xffb01488, 0xff6414a0, 0xff202298, 0xff003c78, 
        0xff005a54, 0xff007228, 0xff007c08, 0xff287600, 
        0xff786600, 0xff000000, 0xff000000, 0xff000000,
        0xffeceeec, 0xffec9a4c, 0xffec7c78, 0xffec62b0, 
        0xffec54e4, 0xffb458ec, 0xff646aec, 0xff2088d4, 
        0xff00aaa0, 0xff00c474, 0xff20d04c, 0xff6ccc38, 
        0xffccb438, 0xff3c3c3c, 0xff000000, 0xff000000,
        0xffeceeec, 0xffeccca8, 0xffecbcbc, 0xffecb2d4, 
        0xffecaeec, 0xffd4aeec, 0xffb0b4ec, 0xff90c4e4, 
        0xff78d2cc, 0xff78deb4, 0xff90e2a8, 0xffb4e298, 
        0xffe4d6a0, 0xffa0a2a0, 0xff000000, 0xff000000
    ];





}