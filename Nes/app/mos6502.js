var Memory = (function () {
    function Memory() {
        this.memory = new Array(65535);
    }
    Memory.prototype.get = function () {
        return 0;
    };
    return Memory;
})();
var Mos6502 = (function () {
    function Mos6502() {
        this.rI = 0;
        this.rA = 0;
        this.rX = 0;
        this.rJ = 0;
        this.ip = 0;
    }
    Mos6502.prototype.step = function () {
        switch (this.memory.get(this.ip)) {
        }
    };
    return Mos6502;
})();
//# sourceMappingURL=mos6502.js.map