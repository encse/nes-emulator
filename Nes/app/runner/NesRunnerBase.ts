
class NesRunnerBase {
    onEndCallback: () => void;
    logElement: HTMLElement;
    headerElement: HTMLElement;

    nesEmulator: NesEmulator;


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

    private loadEmulator(onLoad) {
        this.headerElement = document.createElement("h2");
        this.container.appendChild(this.headerElement);

        var canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 240;
        canvas.style.zoom = "2";

        this.container.appendChild(canvas);
        const driver = new DriverFactory().createRenderer(canvas);

        this.headerElement.innerText = `${this.url} ${driver.tsto()}`;

        this.logElement = document.createElement("div");
        this.logElement.classList.add('log');
        this.container.appendChild(this.logElement);

        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = _ => {
            if (xhr.status > 99 && xhr.status < 299) {
                const blob = new Uint8Array(xhr.response);
                onLoad(new NesEmulator(new NesImage(blob), canvas, driver));
            } else {
                this.logError("http error " + xhr.status);
                onLoad(null);
            }
        }
        xhr.send();
    }

    onEnd(callback: () => void) {
        this.onEndCallback = callback;
    }

    run() {
        this.loadEmulator((nesEmulator: NesEmulator) => {
            this.nesEmulator = nesEmulator;

            if (!nesEmulator)
                this.onEndCallback();
            else
                this.runI();
        });
    }

    protected runI() {
        this.onEndCallback();
    }
}