export interface Driver {
    render(): void;
    getBuffer(): Uint8Array;
    tsto(): void;
}
