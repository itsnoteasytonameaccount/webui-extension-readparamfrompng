document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "load-file-input";
    const container = document.createElement("container");
    container.appendChild(fileInput);
    container.className = "toolbar-container";
    const toolbarBtn = document.createElement("button");
    toolbarBtn.className = "toolbar-btn";
    const PNG_MARK = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const checkPNGMark = (bytes) => PNG_MARK.every((byte, index) => byte === bytes[index]);
    function networkEndian2Int(arr, start, end) {
        let intNumber = 0x00;
        let index = start;
        while (index < end) {
            intNumber = intNumber << 8;
            intNumber = intNumber | arr[index++];
        }
        return intNumber;
    }
    function bytes2str(bytes, start, end) {
        let arr = [];
        let index = start;
        while (index < end) {
            arr.push(String.fromCharCode(bytes[index++]));
        }
        return arr.join("");
    }
    function readDataBlock(bytes, start) {
        let offset = start;
        const length = networkEndian2Int(bytes, offset, offset + 4);
        offset += 4;
        const type = bytes2str(bytes, offset, offset + 4);
        offset += 4;
        const data = bytes.subarray(offset, offset + length);
        offset += length;
        const crc = networkEndian2Int(bytes.subarray(offset, offset + 4));
        return { length, type, data, crc };
    }

    class Txt2ImageConfig {
        constructor(str) {
            debugger;
            const arr = str.split("\n");
            const [prompt, negativePrompt, otherProps] = arr;
            this.prompt = prompt.replace(/^[a-z ]*parameters\S/i, "");
            this.negativePrompt = negativePrompt.replace(/^Negative prompt:\s*/i, "");
            const resultList = Object.fromEntries(
                otherProps
                    .match(/((steps|sampler|cfg scale|seed|size|model hash|mode)): ([^,]+)/gi)
                    .map((item) => item.split(": "))
            );
            this.otherProps = resultList;
        }

        fillForm() {
            const app = gradioApp();
            const promptInput = app.getElementById("txt2img_prompt").querySelector("textarea");
            const negPromptInput = app.getElementById("txt2img_neg_prompt").querySelector("textarea");
            const stepsInput = app.getElementById("txt2img_steps").querySelector("input[type='number']");
            const widthInput = app.getElementById("txt2img_width").querySelector("input[type='number']");
            const heightInput = app.getElementById("txt2img_height").querySelector("input[type='number']");
            const scaleInput = app.getElementById("txt2img_cfg_scale").querySelector("input[type='number']");
            const seedInput = app.getElementById("txt2img_seed").querySelector("input[type='number']");
            promptInput.value = this.prompt || promptInput.value;
            negPromptInput.value = this.negativePrompt || negPromptInput.value;
            const {
                Steps: steps = stepsInput.value,
                Size: size = "",
                ["CFG scale"]: scale = scaleInput.value,
                Seed: seed = -1,
            } = this.otherProps;
            const [width, height] = size.split("x");
            stepsInput.value = Number(steps);
            widthInput.value = Number(width || widthInput.value);
            heightInput.value = Number(height || heightInput.value);
            seedInput.value = Number(seed);
            scaleInput.value = Number(scale);
            this.dispatchEvent([
                promptInput,
                negPromptInput,
                stepsInput,
                widthInput,
                heightInput,
                seedInput,
                scaleInput,
            ]);
        }

        dispatchEvent(list) {
            const inputEvent = new Event("input", { bubbles: true, cancelable: false });
            const changeEvent = new Event("change", { bubbles: true, cancelable: false });
            list.forEach((element) => {
                element.dispatchEvent(inputEvent);
                element.dispatchEvent(changeEvent);
            });
        }
    }

    function readConfigFromFile(event) {
        const { target } = event;
        const bytes = new Uint8Array(target.result);
        let offset = 0;
        if (!checkPNGMark(bytes)) {
            return;
        }
        offset += PNG_MARK.length;
        while (offset < bytes.length) {
            const dataBlock = readDataBlock(bytes, offset);
            offset += dataBlock.length + 12;
            if (dataBlock.type === "tEXt") {
                txt2ImageConfig = new Txt2ImageConfig(bytes2str(dataBlock.data, 0, dataBlock.length));
                txt2ImageConfig.fillForm();
            }
        }
    }

    fileInput.addEventListener("change", (event) => {
        const { target } = event;
        if (!target.files.length) {
            return;
        }
        const fr = new FileReader();
        fr.onloadend = (e) => {
            readConfigFromFile(e);
            target.value = "";
        };
        fr.readAsArrayBuffer(target.files[0]);
    });

    const fragment = document.createDocumentFragment();
    fragment.appendChild(fileInput);
    fragment.appendChild(toolbarBtn);
    document.body.appendChild(fragment);

    const throttle = (eventFunc, step) => {
        let time = Date.now();
        return function (...args) {
            if (Date.now() - time <= step) {
                return;
            }
            eventFunc.apply(this, ...args);
        };
    };

    class DragHandler {
        constructor() {
            if (this.INSTANCE) {
                throw new Error("only one instance");
            }
            let activeElement = null;
            let prex = 0;
            let prey = 0;
            const dragMove = throttle((event) => {
                const { target } = event;
                console.log(target);
            });

            const dragEnd = () => {
                activeElement = null;
                window.removeEventListener("mousemove", dragMove);
            };

            const dragStart = (event) => {
                const { target } = event;
                let node = target;
                while (node !== document.body && node.getAttribute("draggable") !== "true") {
                    node = node.parentNode;
                }
                activeElement = node;
                window.addEventListener("mousemove", dragMove);
            };

            // 注册到windows上都是为避免操作过快导致事件不在元素上触发
            window.addEventListener("mousedown", dragStart);
            window.addEventListener("mouseout", dragEnd);
            window.addEventListener("mousedown", dragEnd);
        }

        static listener = {};

        static bindDraggableElement(elem, id, callback) {
            elem.setAttribute("draggable", "true");
        }
    }

    Object.defineProperty(DragHandler, "INSTANCE", {
        value: new DragHandler(),
        configurable: false,
        writable: false,
    });
});
