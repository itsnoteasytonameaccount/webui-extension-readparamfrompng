(function (module, require) {
    const {
        FORM_ELEMENTS_GETTER,
        WEBUI_GLOBAL_METHOD,
        PNG_MARK,
        PARAMETERS_MATCH_PATTERN,
        PROMPT_MATCH_PATTERN,
        NEGPROMPT_MATCH_PATTERN,
    } = require("./constants.js");
    const throttle = (eventFunc, step) => {
        let time = Date.now();
        return function (...args) {
            if (Date.now() - time <= step) {
                return;
            }
            eventFunc.apply(this, ...args);
            time = Date.now();
        };
    };

    class DragHandler {
        constructor() {
            if (this.INSTANCE) {
                throw new Error("only one instance");
            }
            let activeCallback = null;
            let prex = 0;
            let prey = 0;
            const dragMove = throttle((event) => {
                const { screenX, screenY } = event;
                activeCallback && activeCallback(screenX - prex, screenY - prey);
                prex = screenX;
                prey = screenY;
            });

            const dragEnd = () => {
                activeCallback = null;
                window.removeEventListener("mousemove", dragMove);
            };

            const dragStart = (event) => {
                const { target, screenX, screenY } = event;
                let node = target;
                while (node !== null && node !== document.body && node.getAttribute("draggable")) {
                    node = node.parentNode;
                }
                if (node === null || node === document.body) {
                    return;
                }
                activeCallback = DragHandler.listener[node.getAttribute("draggable")];
                prex = screenX;
                prey = screenY;
                window.addEventListener("mousemove", dragMove);
            };

            window.addEventListener("mousedown", dragStart);
            window.addEventListener("mouseout", dragEnd);
            window.addEventListener("mousedown", dragEnd);
        }

        static listener = {};

        static bindDraggableElement(elem, id, callback) {
            elem.setAttribute("draggable", id);
            this.listener[id] = callback;
        }
    }

    Object.defineProperty(DragHandler, "INSTANCE", {
        value: new DragHandler(),
        configurable: false,
        writable: false,
    });

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
            const arr = str.split("\n");
            const [prompt, negativePrompt, otherProps] = arr;
            this.prompt = prompt.replace(PROMPT_MATCH_PATTERN, "");
            this.negativePrompt = negativePrompt.replace(NEGPROMPT_MATCH_PATTERN, "");
            const resultList = Object.fromEntries(
                otherProps.match(PARAMETERS_MATCH_PATTERN).map((item) => item.split(": "))
            );
            this.otherProps = resultList;
        }

        fillForm() {
            const app = WEBUI_GLOBAL_METHOD.gradioApp();
            const promptInput = FORM_ELEMENTS_GETTER.promptInput(app);
            const negPromptInput = FORM_ELEMENTS_GETTER.negPromptInput(app);
            const stepsInput = FORM_ELEMENTS_GETTER.stepsInput(app);
            const widthInput = FORM_ELEMENTS_GETTER.widthInput(app);
            const heightInput = FORM_ELEMENTS_GETTER.heightInput(app);
            const scaleInput = FORM_ELEMENTS_GETTER.scaleInput(app);
            const seedInput = FORM_ELEMENTS_GETTER.seedInput(app);
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

        static readConfigFromFile(arraybuffer) {
            const bytes = new Uint8Array(arraybuffer);
            let offset = 0;
            if (!checkPNGMark(bytes)) {
                return;
            }
            offset += PNG_MARK.length;
            while (offset < bytes.length) {
                const dataBlock = readDataBlock(bytes, offset);
                offset += dataBlock.length + 12;
                if (dataBlock.type === "tEXt") {
                    const txt2ImageConfig = new Txt2ImageConfig(bytes2str(dataBlock.data, 0, dataBlock.length));
                    txt2ImageConfig.fillForm();
                }
            }
        }
    }

    module.exports = {
        Txt2ImageConfig,
        DragHandler,
    };
})(
    typeof module !== "undefined"
        ? module
        : (() => {
              // simple polyfill
              return {
                  set exports(value) {
                      const moduleName = "./tools.js";
                      const { ReadPNGExtensionModule = {} } = window;
                      ReadPNGExtensionModule[moduleName] = ReadPNGExtensionModule[moduleName] || {};
                      ReadPNGExtensionModule[moduleName].default = value;
                      window.ReadPNGExtensionModule = ReadPNGExtensionModule;
                  },
                  get exports() {
                      const moduleName = "./tools.js";
                      window.ReadPNGExtensionModule = ReadPNGExtensionModule || {};
                      ReadPNGExtensionModule[moduleName] = ReadPNGExtensionModule[moduleName] || {};
                      return ReadPNGExtensionModule[moduleName];
                  },
              };
          })(),
    typeof require !== "undefined"
        ? require
        : function (moduleName) {
              const { [moduleName]: result = {} } = window.ReadPNGExtensionModule;
              const { default: defaultObj = {} } = result;
              return {
                  ...result,
                  ...defaultObj,
              };
          }
);
