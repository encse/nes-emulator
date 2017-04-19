
import {NesEmulator} from "../NesEmulator";
import {IDriver} from "../driver/IDriver";
import {Controller} from "../Controller";
import {NesImage} from "../NesImage";
import {DriverFactory} from "../driver/DriverFactory";

export class NesRunnerBase {
    onEndCallback: () => void;
    logElement: HTMLElement;
    headerElement: HTMLElement;

    nesEmulator: NesEmulator;
    canvas:HTMLCanvasElement;
    driver: IDriver;
    controller: Controller;

    constructor(protected container: HTMLElement, private url: string) {
        const containerT = document.createElement('div');
        this.container.appendChild(containerT);
        this.container = containerT;
        this.onEndCallback = () => { };

      
    }

    log(...args: Object[]) {
        let st = "";
        for (let i = 0; i < args.length; i++)
            st += " " + args[i];

        const div = document.createElement("div");
        div.innerHTML = st.replace(/\n/g, "<br/>");
        this.logElement.appendChild(div);
    }

    logError(...args:Object[]) {
        let st = "";
        for (let i = 0; i < args.length; i++)
            st += " " + args[i];

        const div = document.createElement("div");
        div.classList.add("error");
        div.innerHTML = st.replace(/\n/g, "<br/>");
        this.logElement.appendChild(div);
    }

    private loadUrl(url:string, onLoad) {
      
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = _ => {
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
        }
        xhr.send();
    }

    onEnd(callback: () => void) {
        this.onEndCallback = callback;
    }

    run() {
        this.headerElement = document.createElement("h2");
        this.container.appendChild(this.headerElement);

        this.canvas = document.createElement("canvas");
        this.canvas.width = 256;
        this.canvas.height = 240;
        this.container.appendChild(this.canvas);

        this.controller = new Controller(this.canvas);

        this.logElement = document.createElement("div");
        this.logElement.classList.add('log');
        this.container.appendChild(this.logElement);

        this.driver = new DriverFactory().createRenderer(this.canvas);

        this.initDnd();

        this.loadUrl(this.url, rawBytes => {
            this.createEmulator(rawBytes);
            if (!this.nesEmulator)
                this.onEndCallback();
            else
                this.runI();
        });
    }

    createEmulator(rawBytes: Uint8Array) {
        this.headerElement.innerText = `${this.url} ${this.driver.tsto()}`;

        try {
            var newEmulator = new NesEmulator(new NesImage(rawBytes), this.driver, this.controller);
            if (this.nesEmulator)
                this.nesEmulator.destroy();
            this.nesEmulator = newEmulator;

        } catch (e) {
            this.logError(e);
        }
    }

    initDnd() {

        if ('draggable' in this.container) {

            this.container.ondragover = () => { this.container.classList.add('hover'); return false; };
            this.container.ondragend = () => { this.container.classList.remove('hover'); return false; };
            this.container.ondrop = e => {
                this.url = e.dataTransfer.files[0].name;
                this.container.classList.remove('hover');
                e.preventDefault();
                var fileReader = new FileReader();
                fileReader.onload = progressEvent => {
                    const arrayBufferNew = (<any>progressEvent.target).result;
                    const rawBytes = new Uint8Array(arrayBufferNew);
                    this.createEmulator(rawBytes);
                };
                fileReader.readAsArrayBuffer(e.dataTransfer.files[0]);
            }
        }

        
    }
   
    protected runI() {
        this.onEndCallback();
    }
}