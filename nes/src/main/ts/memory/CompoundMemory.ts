import {Memory} from "./Memory";
export class CompoundMemory implements Memory {
    public rgmemory: Memory[] = [];
    public lastAddr: number;

    private setters: Array<{ addrFirst: number, addrLast: number, setter: (addr: number, value: number) => void }> = [];
    private getters: Array<{ addrFirst: number, addrLast: number, getter: (addr: number) => number }> = [];
    private sizeI: number;

    public constructor(...rgmemory: Memory[]) {
        this.sizeI = 0;
        this.rgmemory = rgmemory;
        rgmemory.forEach((memory) => this.sizeI += memory.size());
        this.initAccessors();
    }

    public size(): number {
        return this.sizeI;
    }

    public shadowSetter(addrFirst: number, addrLast: number, setter: (addr: number, value: number) => void) {
        this.setters.push({ addrFirst, addrLast, setter });
        this.initAccessors();
    }

    public shadowGetter(addrFirst: number, addrLast: number, getter: (addr: number) => number) {
        this.getters.push({ addrFirst, addrLast, getter });
        this.initAccessors();
    }

    public getByte(addr: number): number {
        throw new Error("address out of bounds");
    }

    public setByte(addr: number, value: number): void {
        throw new Error("address out of bounds");
    }

    private initAccessors() {
        this.initGetter();
        this.initSetter();
    }

    private initGetter() {
        let stGetters = "";
        for (let i = 0; i < this.getters.length; i++) {
            const getter = this.getters[i];
            let check = "";
            if (getter.addrFirst === getter.addrLast) {
                check = `addr === ${getter.addrFirst}`;
            } else {
                check = `${getter.addrFirst} <= addr && addr <= ${getter.addrLast}`;
            }

            stGetters += `if (${check}) return this.getters[${i}].getter(addr);\n`;
        }

        let addrLim = 0;
        let addrFirst = 0;
        for (let i = 0; i < this.rgmemory.length; i++) {
            const memory = this.rgmemory[i];
            addrLim += memory.size();
            let modifiedAddr = "";
            if (!addrFirst) {
                modifiedAddr = "addr";
            } else {
                modifiedAddr = `addr - ${addrFirst}`;
            }

            stGetters += `if (addr < ${addrLim}) return this.rgmemory[${i}].getByte(${modifiedAddr});\n`;
            addrFirst += memory.size();
        }
        eval(`this.getByte = function(addr) { ${stGetters} }`);
    }

    private initSetter() {
        let stSetters = "";
        for (let i = 0; i < this.setters.length; i++) {
            const setter = this.setters[i];
            let check = "";
            if (setter.addrFirst === setter.addrLast) {
                check = `addr === ${setter.addrFirst}`;
            } else {
                check = `${setter.addrFirst} <= addr && addr <= ${setter.addrLast}`;
            }
            stSetters += `if (${check}) return this.setters[${i}].setter(addr, value);\n`;
        }

        let addrLim = 0;
        let addrFirst = 0;
        for (let i = 0; i < this.rgmemory.length; i++) {
            const memory = this.rgmemory[i];
            addrLim += memory.size();
            let modifiedAddr = "";
            if (!addrFirst) {
                modifiedAddr = "addr";
            } else {
                modifiedAddr = `addr - ${addrFirst}`;
            }
            stSetters += `if (addr < ${addrLim}) return this.rgmemory[${i}].setByte(${modifiedAddr}, value);\n`;
            addrFirst += memory.size();
        }
        eval(`this.setByte = function(addr, value) {
             this.lastAddr = addr;
             ${stSetters} }`);
    }
}
