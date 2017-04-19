import {CpuTestRunner} from "./runner/CpuTestRunner";
const window:Window = require('window');
const $:any = require('jQuery');


function runAll(nesRunners) {
    var i = 0;
    function runSingle() {
        if (i < nesRunners.length) {
            nesRunners[i].onEndCallback = function () {
                i++;
                window.setTimeout(runSingle(), 0);
            };
            nesRunners[i].run();
        }
    }
    runSingle();
}



$('#btnTest').click(() => {

    var nesContainerElement = document.getElementById('nesContainer');

    var nesRunners = [
        //new NesRunner(nesContainerElement, 'ppu/color_test/color_test.nes'),
        //new NesRunner(nesContainerElement, 'ppu/palette/palette.nes'),
        //new NesRunner(nesContainerElement, 'ppu/tvpassfail/tv.nes', '$01'),
        //new NesRunner(nesContainerElement, 'ppu/full_palette/full_palette.nes', '$01'),
        //new NesRunner(nesContainerElement, 'ppu/full_palette/full_palette_alt.nes', '$01'),

        new CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/1-clocking.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/2-details.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/3-A12_clocking.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/4-scanline_timing.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/5-MMC3.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/6-MMC3_alt.nes', 'Passed'),

        new CpuTestRunner(nesContainerElement, 'ppu/ppu/vram_access.nes', '$01'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu/vbl_clear_time.nes', '$01'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu/sprite_ram.nes', '$01'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu/palette_ram.nes', '$01'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu/power_up_palette.nes', '$01'),

        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/ppu_vbl_nmi.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/01-vbl_basics.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/02-vbl_set_time.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/03-vbl_clear_time.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/04-nmi_control.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/05-nmi_timing.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/06-suppression.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/07-nmi_on_timing.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/08-nmi_off_timing.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/09-even_odd_frames.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/10-even_odd_timing.nes', 'Passed'),

        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_timing/sprite_hit_timing.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/01.basics.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/02.alignment.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/03.corners.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/04.flip.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/05.left_clip.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/06.right_edge.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/07.screen_bottom.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/08.double_height.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/09.timing_basics.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/10.timing_order.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/11.edge_timing.nes', 'PASSED'),

        new CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/1.Basics.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/2.Details.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/3.Timing.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/4.Obscure.nes', 'PASSED'),
        new CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/5.Emulator.nes', 'PASSED'),

        new CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/cpu_interrupts.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/1-cli_latency.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/2-nmi_and_brk.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/3-nmi_and_irq.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/4-irq_and_dma.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/5-branch_delays_irq.nes', 'Passed'),

        new CpuTestRunner(nesContainerElement, 'cpu/instr_timing/instr_timing.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_timing/rom_singles/1-instr_timing.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_timing/rom_singles/2-branch_timing.nes', 'Passed'),

        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/01-basics.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/02-implied.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/03-immediate.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/04-zero_page.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/05-zp_xy.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/06-absolute.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/07-abs_xy.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/08-ind_x.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/09-ind_y.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/10-branches.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/11-stack.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/12-jmp_jsr.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/13-rts.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/14-rti.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/15-brk.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/16-special.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/official_only.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/all_instrs.nes', 'Passed'),

        new CpuTestRunner(nesContainerElement, 'cpu/instr_misc/01-abs_x_wrap.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_misc/02-branch_wrap.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_misc/03-dummy_reads.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_misc/04-dummy_reads_apu.nes', 'Passed'),
        new CpuTestRunner(nesContainerElement, 'cpu/instr_misc/instr_misc.nes', 'Passed')
    ];

    runAll(nesRunners);

});