export interface IDriver {
    render();
    getBuffer(): Uint8Array;
    tsto();
}