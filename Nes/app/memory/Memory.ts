interface Memory {
    getByte(addr: number): number;
    setByte(addr: number, value: number): void;

    size():number;
}