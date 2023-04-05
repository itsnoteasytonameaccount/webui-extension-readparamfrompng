(function (module) {
    module.exports = {
        TOOLKIT_ICON: "⚒",
        WEBUI_GLOBAL_METHOD: {
            gradioApp,
        },
        FORM_ELEMENTS_GETTER: {
            promptInput: (app) => app.getElementById("txt2img_prompt").querySelector("textarea"),
            negPromptInput: (app) => app.getElementById("txt2img_neg_prompt").querySelector("textarea"),
            stepsInput: (app) => app.getElementById("txt2img_steps").querySelector("input[type='number']"),
            widthInput: (app) => app.getElementById("txt2img_width").querySelector("input[type='number']"),
            heightInput: (app) => app.getElementById("txt2img_height").querySelector("input[type='number']"),
            scaleInput: (app) => app.getElementById("txt2img_cfg_scale").querySelector("input[type='number']"),
            seedInput: (app) => app.getElementById("txt2img_seed").querySelector("input[type='number']"),
        },
        PARAMETERS_MATCH_PATTERN: /((steps|sampler|cfg scale|seed|size|model hash|mode)): ([^,]+)/gi,
        PROMPT_MATCH_PATTERN: /^[a-z ]*parameters\S/i,
        NEGPROMPT_MATCH_PATTERN: /^Negative prompt:\s*/i,
        PNG_MARK: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    };
})(
    typeof module !== "undefined"
        ? module
        : (() => {
              // simple polyfill
              return {
                  set exports(value) {
                      const moduleName = "./constants.js";
                      const { ReadPNGExtensionModule = {} } = window;
                      ReadPNGExtensionModule[moduleName] = ReadPNGExtensionModule[moduleName] || {};
                      ReadPNGExtensionModule[moduleName].default = value;
                      window.ReadPNGExtensionModule = ReadPNGExtensionModule;
                  },
                  get exports() {
                      const moduleName = "./constants.js";
                      window.ReadPNGExtensionModule = ReadPNGExtensionModule || {};
                      ReadPNGExtensionModule[moduleName] = ReadPNGExtensionModule[moduleName] || {};
                      return ReadPNGExtensionModule[moduleName];
                  },
              };
          })()
);
