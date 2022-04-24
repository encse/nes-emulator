(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("nes-emulator"), require("jquery"));
	else if(typeof define === 'function' && define.amd)
		define(["nes-emulator", "jquery"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("nes-emulator"), require("jquery")) : factory(root["nes-emulator"], root["jquery"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE_0__, __WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */,
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var $ = __webpack_require__(1);
var nes_1 = __webpack_require__(0);
function delay() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { window.setTimeout(resolve, 0); })];
        });
    });
}
function runAll(nesRunners) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, nesRunners_1, nesRunner;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, nesRunners_1 = nesRunners;
                    _a.label = 1;
                case 1:
                    if (!(_i < nesRunners_1.length)) return [3 /*break*/, 5];
                    nesRunner = nesRunners_1[_i];
                    return [4 /*yield*/, nesRunner.run()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, delay()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
$('#btnTest').click(function () {
    var nesContainerElement = document.getElementById('nesContainer');
    var nesRunners = [
        // new NesRunner(nesContainerElement, 'ppu/color_test/color_test.nes'),
        // new NesRunner(nesContainerElement, 'ppu/palette/palette.nes'),
        // new NesRunner(nesContainerElement, 'ppu/tvpassfail/tv.nes', '$01'),
        // new NesRunner(nesContainerElement, 'ppu/full_palette/full_palette.nes', '$01'),
        // new NesRunner(nesContainerElement, 'ppu/full_palette/full_palette_alt.nes', '$01'),
        new nes_1.CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/1-clocking.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/2-details.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/3-A12_clocking.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/4-scanline_timing.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/5-MMC3.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'mmc/mmc3/rom_singles/6-MMC3_alt.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu/vram_access.nes', '$01'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu/vbl_clear_time.nes', '$01'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu/sprite_ram.nes', '$01'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu/palette_ram.nes', '$01'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu/power_up_palette.nes', '$01'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/ppu_vbl_nmi.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/01-vbl_basics.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/02-vbl_set_time.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/03-vbl_clear_time.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/04-nmi_control.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/05-nmi_timing.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/06-suppression.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/07-nmi_on_timing.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/08-nmi_off_timing.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/09-even_odd_frames.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/ppu_vbl_nmi/rom_singles/10-even_odd_timing.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_timing/sprite_hit_timing.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/01.basics.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/02.alignment.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/03.corners.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/04.flip.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/05.left_clip.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/06.right_edge.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/07.screen_bottom.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/08.double_height.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/09.timing_basics.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/10.timing_order.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_hit_tests_2005.10.05/11.edge_timing.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/1.Basics.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/2.Details.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/3.Timing.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/4.Obscure.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'ppu/sprite_overflow_tests/5.Emulator.nes', 'PASSED'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/cpu_interrupts.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/1-cli_latency.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/2-nmi_and_brk.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/3-nmi_and_irq.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/4-irq_and_dma.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/cpu_interrupts/rom_singles/5-branch_delays_irq.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_timing/instr_timing.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_timing/rom_singles/1-instr_timing.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_timing/rom_singles/2-branch_timing.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/01-basics.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/02-implied.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/03-immediate.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/04-zero_page.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/05-zp_xy.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/06-absolute.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/07-abs_xy.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/08-ind_x.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/09-ind_y.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/10-branches.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/11-stack.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/12-jmp_jsr.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/13-rts.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/14-rti.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/15-brk.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/rom_singles/16-special.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/official_only.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_test-v5/all_instrs.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_misc/01-abs_x_wrap.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_misc/02-branch_wrap.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_misc/03-dummy_reads.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_misc/04-dummy_reads_apu.nes', 'Passed'),
        new nes_1.CpuTestRunner(nesContainerElement, 'cpu/instr_misc/instr_misc.nes', 'Passed'),
    ];
    runAll(nesRunners);
});


/***/ })
/******/ ]);
});
//# sourceMappingURL=test.js.map