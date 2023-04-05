import html

from ldm.modules.encoders.modules import FrozenCLIPEmbedder, FrozenOpenCLIPEmbedder
from modules import script_callbacks, shared, scripts
import open_clip.tokenizer

import gradio as gr

class Script(scripts.Script):
    def title(self):
        print('title')
        pass

    def ui(self, is_img2img):
        checkbox_iterate = gr.Checkbox(label="我的内容", value=False)
        print('ui')
        return [checkbox_iterate]

    def run(self, checkbox_iterate):
        print('run')
        pass