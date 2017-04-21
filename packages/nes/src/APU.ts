import {IrqLine} from './cpu/IrqLine';
 import {CompoundMemory} from './memory/CompoundMemory';
 export class APU {

    private mode = 0;
    private frameIRQDisabled = 0;
    private idividerStep = 0;
    private isequencerStep = 0;
    private lc0 = 0;
    private lc0Halt = 0;
    private haltNoiseAndSquare = 0;
    private haltTriangle = 0;

    private lcTable = [
        [0x0A, 0x14, 0x28, 0x50, 0xA0, 0x3C, 0x0E, 0x1A, 0x0C, 0x18, 0x30, 0x60, 0xC0, 0x48, 0x10, 0x20],
        [0xFE, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0E, 0x10, 0x12, 0x14, 0x16, 0x18, 0x1A, 0x1C, 0x1E],
    ];

    /**
     *
     * --------------
     * Length Counter
     * --------------
     *
     * A length counter allows automatic duration control. Counting can be halted and
     * the counter can be disabled by clearing the appropriate bit in the status
     * register, which immediately sets the counter to 0 and keeps it there.
     *
     * The halt flag is in the channel's first register. For the square and noise
     * channels, it is bit 5, and for the triangle, bit 7:
     *
     *     --h- ----       halt (noise and square channels)
     *     h--- ----       halt (triangle channel)
     *
     * Note that the bit position for the halt flag is also mapped to another flag in
     * the Length Counter (noise and square) or Linear Counter (triangle).
     *
     * Unless disabled, a write the channel's fourth register immediately reloads the
     * counter with the value from a lookup table, based on the index formed by the
     * upper 5 bits:
     *
     *     iiii i---       length index
     *
     *     bits  bit 3
     *     7-4   0   1
     *         -------
     *     0   $0A $FE
     *     1   $14 $02
     *     2   $28 $04
     *     3   $50 $06
     *     4   $A0 $08
     *     5   $3C $0A
     *     6   $0E $0C
     *     7   $1A $0E
     *     8   $0C $10
     *     9   $18 $12
     *     A   $30 $14
     *     B   $60 $16
     *     C   $C0 $18
     *     D   $48 $1A
     *     E   $10 $1C
     *     F   $20 $1E
     *
     * See the clarifications section for a possible explanation for the values left
     * column of the table.
     *
     * When clocked by the frame sequencer, if the halt flag is clear and the counter
     * is non-zero, it is decremented.
     *
     */
    constructor(memory: CompoundMemory, private irqManager: IrqLine) {

        memory.shadowSetter(0x4000, 0x4017, this.setter.bind(this));
        memory.shadowGetter(0x4000, 0x4017, this.getter.bind(this));
    }

    public step() {

        // The divider generates an output clock rate of just under 240 Hz, and appears to
        // be derived by dividing the 21.47727 MHz system clock by 89490. The sequencer is
        // clocked by the divider's output.

        this.idividerStep++;

        if (this.idividerStep === 89490) {
            this.idividerStep = 0;
        }

        if (this.idividerStep === 0) {
            this.clockSequencer();
        }
    }

    private tsto(label: string) {
        // console.log('APU', label, this.cpu.status());
    }

    private getter(addr: number) {

        switch (addr) {
            case 0x4015:
                const res = ((this.irqManager.isRequested() ? 1 : 0) << 6) +
                    (this.lc0 > 0 ? 1 : 0);

                this.irqManager.ack();
                return res;
        }
        // When $4015 is read, the status of the channels' length counters and bytes
        // remaining in the current DMC sample, and interrupt flags are returned.
        // Afterwards the Frame Sequencer's frame interrupt flag is cleared.

        // if-d nt21

        // IRQ from DMC
        // frame interrupt
        // DMC sample bytes remaining > 0
        // triangle length counter > 0
        // square 2 length counter > 0
        // square 1 length counter > 0

        return 0;
    }

    private setter(addr: number, value: number) {
        switch (addr) {
            case 0x4000:

                // $4000 / 4 ddle nnnn   duty, loop env/ disable length, env disable, vol / env period

                // The halt flag is in the channel's first register. For the square and noise
                // channels, it is bit 5, and for the triangle, bit 7:

                // --h - ----       halt(noise and square channels)
                // h-- - ----       halt(triangle channel)

                this.lc0Halt = (value >> 5) & 1;
                break;
            // $4001 eppp nsss   enable sweep, period, negative, shift
            // $4002 pppp pppp   period low
            case 0x4003:
                // llll lppp   length index, period high
                // Unless disabled, a write the channel's fourth register immediately reloads the
                // counter with the value from a lookup table, based on the index formed by the
                // upper 5 bits:

                // iiii i-- - length index
                if (!this.lc0Halt) {
                    this.lc0 = this.lcTable[(value >> 3) & 1][value >> 4];
                }
                break;
            case 0x4015:
                // ---------------
                //     Status Register
                // ---------------

                //     The status register at $4015 allows control and query of the channels' length
                // counters, and query of the DMC and frame interrupts.It is the only register
                // which can also be read.

                // When $4015 is written to, the channels' length counter enable flags are set,
                // the DMC is possibly started or stopped, and the DMC's IRQ occurred flag is
                // cleared.

                // ---d nt21   DMC, noise, triangle, square 2, square 1

                // If d is set and the DMC's DMA reader has no more sample bytes to fetch, the DMC
                // sample is restarted.If d is clear then the DMA reader's sample bytes remaining
                // is set to 0.

                this.lc0Halt = 1 - (value & 1);
                break;

            case 0x4017:
                // On a write to $4017, the divider and sequencer are reset, then the sequencer is
                // configured. Two sequences are available, and frame IRQ generation can be
                // disabled.
                //  mi-- ----       mode, IRQ disable

                // If the mode flag is clear, the 4-step sequence is selected, otherwise the
                // 5-step sequence is selected and the sequencer is immediately clocked once.

                //     f = set interrupt flag
                //     l = clock length counters and sweep units
                //     e = clock envelopes and triangle's linear counter

                // mode 0: 4-step  effective rate (approx)
                // ---------------------------------------
                //     - - - f      60 Hz
                //     - l - l     120 Hz
                //     e e e e     240 Hz

                // mode 1: 5-step  effective rate (approx)
                // ---------------------------------------
                //     - - - - -   (interrupt flag never set)
                //     l - l - -    96 Hz
                //     e e e e -   192 Hz

                // At any time if the interrupt flag is set and the IRQ disable is clear, the
                // CPU's IRQ line is asserted.
                this.idividerStep = this.isequencerStep = -1;
                this.mode = (value >> 7) & 1;
                if (this.mode === 1) {
                    this.step();
                }

                this.frameIRQDisabled = (value >> 6) & 1;

                // Interrupt inhibit flag. If set, the frame interrupt flag is cleared, otherwise it is unaffected.
                if (this.frameIRQDisabled) {
                    this.irqManager.ack();
                }

                break;
        }

        this.tsto('set $' + addr.toString(16));

    }

    private clockSequencer() {

        if (this.isequencerStep === 1 || this.isequencerStep === 3) {
            if (!this.lc0Halt && this.lc0 > 0) {
                this.lc0--;
            }
        }

        if (!this.mode && !this.frameIRQDisabled) {

            if (!this.irqManager.isRequested() && this.isequencerStep === 3) {
                this.irqManager.request();
            }

            this.tsto('clockSequencer ' + this.isequencerStep);
        }
        this.isequencerStep = (this.isequencerStep + 1) % (4 + this.mode);

    }
}
