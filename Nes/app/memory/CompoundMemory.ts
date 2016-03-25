///<reference path="Memory.ts"/>
class CompoundMemory implements Memory {
    rgmemory: Memory[] = [];
    private setters: { addrFirst: number, addrLast: number, setter: (addr: number, value: number) => void }[] = [];
    private getters: { addrFirst: number, addrLast: number, getter: (addr: number) => number }[] = [];

    private sizeI: number;
    public lastAddr: number;

    public constructor(...rgmemory: Memory[]) {
        this.sizeI = 0;
        this.rgmemory = rgmemory;
        rgmemory.forEach(memory => this.sizeI += memory.size());
        this.initAccessors();
    }

    size(): number {
        return this.sizeI;
    }

    shadowSetter(addrFirst: number, addrLast: number, setter: (addr: number, value: number) => void) {
        this.setters.push({ addrFirst: addrFirst, addrLast: addrLast, setter: setter });
        this.initAccessors();
    }

    shadowGetter(addrFirst: number, addrLast: number, getter: (addr: number) => number) {
        this.getters.push({ addrFirst: addrFirst, addrLast: addrLast, getter: getter });
        this.initAccessors();
    }

    getByte(addr: number): number {
        throw 'address out of bounds';
    }

    setByte(addr: number, value: number): void {
        throw 'address out of bounds';
    }

    initAccessors() {
        this.initGetter();
        this.initSetter();
    }

    initGetter() {
        let stGetters = '';
        for (let i = 0; i < this.getters.length; i++) {
            let getter = this.getters[i];
            stGetters += `if (${getter.addrFirst} <= addr && addr <= ${getter.addrLast}) return this.getters[${i}].getter(addr);\n`;
        }

        let addrLim = 0;
        let addrFirst = 0;
        for (let i = 0; i < this.rgmemory.length; i++) {
            const memory = this.rgmemory[i];
            addrLim += memory.size();
            let modifiedAddr = '';
            if (!addrFirst)
                modifiedAddr = 'addr';
            else
                modifiedAddr = `addr - ${addrFirst}`;
            stGetters += `if (addr < ${addrLim}) return this.rgmemory[${i}].getByte(${modifiedAddr});\n`;
            addrFirst += memory.size();
        }
        eval(`this.getByte = function(addr) { ${stGetters} }`);
    }

    initSetter() {
        let stSetters = '';
        for (let i = 0; i < this.setters.length; i++) {
            let setter = this.setters[i];
            stSetters += `if (${setter.addrFirst} <= addr && addr <= ${setter.addrLast}) return this.setters[${i}].setter(addr, value);\n`;
        }

        let addrLim = 0;
        let addrFirst = 0;
        for (let i = 0; i < this.rgmemory.length; i++) {
            const memory = this.rgmemory[i];
            addrLim += memory.size();
            let modifiedAddr = '';
            if (!addrFirst)
                modifiedAddr = 'addr';
            else
                modifiedAddr = `addr - ${addrFirst}`;
            stSetters += `if (addr < ${addrLim}) return this.rgmemory[${i}].setByte(${modifiedAddr}, value);\n`;
            addrFirst += memory.size();
        }
        eval(`this.setByte = function(addr, value) {
             this.lastAddr = addr;
             ${stSetters} }`);
    }
}