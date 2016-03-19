///<reference path="CompoundMemory.ts"/>
class CompoundMemoryWithAccessCheck extends CompoundMemory {

    constructor(private onAccess: (addr: number) => void, ...rgmemory: Memory[] ) {
        super(...rgmemory);
    }

    getByte(addr: number): number {
        this.onAccess(addr);
        return super.getByte(addr);
    }

    setByte(addr: number, value: number): void {
        this.onAccess(addr);
        return super.setByte(addr, value);
    }
}