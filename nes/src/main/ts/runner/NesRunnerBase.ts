
import {Controller} from "../Controller";
import {Driver} from "../driver/Driver";
import {DriverFactory} from "../driver/DriverFactory";
import {NesEmulator} from "../NesEmulator";
import {NesImage} from "../NesImage";

export class NesRunnerBase {
    public onEndCallback: () => void;
    public headerElement: HTMLElement;
    public controller: Controller;
    public nesEmulator: NesEmulator;
    private logElement: HTMLElement;
    private canvas: HTMLCanvasElement;
    private driver: Driver;

    constructor(protected container: HTMLElement, private url: string) {
        const containerT = document.createElement("div");
        this.container.appendChild(containerT);
        this.container = containerT;
        this.onEndCallback = () => {
            // noop
        };

    }

    public log(...args: any[]) {
        let st = "";
        for (const arg of args) {
            st += " " + arg;
        }

        const div = document.createElement("div");
        div.innerHTML = st.replace(/\n/g, "<br/>");
        this.logElement.appendChild(div);
    }

    public logError(...args: any[]) {
        let st = "";
        for (const arg of args) {
            st += " " + arg;
        }

        const div = document.createElement("div");
        div.classList.add("error");
        div.innerHTML = st.replace(/\n/g, "<br/>");
        this.logElement.appendChild(div);
    }

    public onEnd(callback: () => void) {
        this.onEndCallback = callback;
    }

    public run() {
        this.headerElement = document.createElement("h2");
        this.container.appendChild(this.headerElement);

        this.canvas = document.createElement("canvas");
        this.canvas.width = 256;
        this.canvas.height = 240;
        this.container.appendChild(this.canvas);

        this.controller = new Controller(this.canvas);

        this.logElement = document.createElement("div");
        this.logElement.classList.add("log");
        this.container.appendChild(this.logElement);

        this.driver = new DriverFactory().createRenderer(this.canvas);

        this.initDnd();

        this.loadUrl(this.url, (rawBytes) => {
            this.createEmulator(rawBytes);
            if (!this.nesEmulator) {
                this.onEndCallback();
            } else {
                this.runI();
            }
        });
    }

    protected createEmulator(rawBytes: Uint8Array) {
        this.headerElement.innerText = `${this.url} ${this.driver.tsto()}`;

        try {
            const newEmulator = new NesEmulator(new NesImage(rawBytes), this.driver, this.controller);
            if (this.nesEmulator) {
                this.nesEmulator.destroy();
            }
            this.nesEmulator = newEmulator;

        } catch (e) {
            this.logError(e);
        }
    }

    protected runI() {
        this.onEndCallback();
    }

    private initDnd() {

        if ("draggable" in this.container) {

            this.container.ondragover = () => { this.container.classList.add("hover"); return false; };
            this.container.ondragend = () => { this.container.classList.remove("hover"); return false; };
            this.container.ondrop = (e) => {
                this.url = e.dataTransfer.files[0].name;
                this.container.classList.remove("hover");
                e.preventDefault();
                const fileReader = new FileReader();
                fileReader.onload = (progressEvent) => {
                    const arrayBufferNew = (progressEvent.target as any).result;
                    const rawBytes = new Uint8Array(arrayBufferNew);
                    this.createEmulator(rawBytes);
                };
                fileReader.readAsArrayBuffer(e.dataTransfer.files[0]);
            };
        }

    }

    private loadUrl(url: string, onLoad: (_: Uint8Array) => void) {

        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = (_) => {
            try {
                if (xhr.status > 99 && xhr.status < 299) {
                    onLoad(new Uint8Array(xhr.response));
                } else {
                    this.logError("http error " + xhr.status);
                    onLoad(null);
                }
            } catch (e) {
                this.logError(e);
            }
        };
        xhr.send();
    }
}
