document.addEventListener("DOMContentLoaded", () =>
    ((require) => {
        const { TOOLKIT_ICON } = require("./constants.js");
        const { Txt2ImageConfig } = require("./tools.js");
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.id = "load-file-input";
        const container = document.createElement("container");
        container.appendChild(fileInput);
        container.className = "toolbar-container";
        const toolbarBtn = document.createElement("button");
        toolbarBtn.className = "toolbar-btn";
        toolbarBtn.textContent = TOOLKIT_ICON;
        container.appendChild(fileInput);

        fileInput.addEventListener("change", (event) => {
            const { target } = event;
            if (!target.files.length) {
                return;
            }
            const fr = new FileReader();
            fr.onloadend = (e) => {
                const { target } = e;
                Txt2ImageConfig.readConfigFromFile(target.result);
                target.value = "";
            };
            fr.readAsArrayBuffer(target.files[0]);
        });

        const fragment = document.createDocumentFragment();
        fragment.appendChild(container);
        fragment.appendChild(toolbarBtn);
        document.body.appendChild(fragment);
    })(
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
    )
);
