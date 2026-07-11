#!/usr/bin/env python3
"""
生成课程配套的 ComfyUI 工作流:
- workflows/*.json          UI 格式(拖进画布用)
- workflows/api/*_api.json  API 格式(POST /prompt 用, 也是实机验证用)

用一份图定义同时产出两种格式, 保证一致。
运行: python3 tools/gen_workflows.py
"""
import json
from pathlib import Path

OUT = Path(__file__).parent.parent / "workflows"
(OUT / "api").mkdir(parents=True, exist_ok=True)

# 每种节点: (UI widget 名顺序, 输出口 [(名, 类型)...], 输入口 [(名, 类型)...])
# api_skip: 只存在于 UI、不进 API 格式的 widget
NODE_DEFS = {
    "CheckpointLoaderSimple": dict(
        widgets=["ckpt_name"], outputs=[("MODEL", "MODEL"), ("CLIP", "CLIP"), ("VAE", "VAE")],
        inputs=[], size=[340, 100]),
    "CLIPTextEncode": dict(
        widgets=["text"], outputs=[("CONDITIONING", "CONDITIONING")],
        inputs=[("clip", "CLIP")], size=[400, 180]),
    "EmptyLatentImage": dict(
        widgets=["width", "height", "batch_size"], outputs=[("LATENT", "LATENT")],
        inputs=[], size=[315, 110]),
    "KSampler": dict(
        widgets=["seed", "control_after_generate", "steps", "cfg", "sampler_name", "scheduler", "denoise"],
        api_skip=["control_after_generate"],
        outputs=[("LATENT", "LATENT")],
        inputs=[("model", "MODEL"), ("positive", "CONDITIONING"), ("negative", "CONDITIONING"), ("latent_image", "LATENT")],
        size=[315, 270]),
    "VAEDecode": dict(
        widgets=[], outputs=[("IMAGE", "IMAGE")],
        inputs=[("samples", "LATENT"), ("vae", "VAE")], size=[210, 50]),
    "SaveImage": dict(
        widgets=["filename_prefix"], outputs=[],
        inputs=[("images", "IMAGE")], size=[320, 280]),
    "LoadImage": dict(
        widgets=["image", "upload"], api_skip=["upload"],
        outputs=[("IMAGE", "IMAGE"), ("MASK", "MASK")],
        inputs=[], size=[320, 320]),
    "VAEEncode": dict(
        widgets=[], outputs=[("LATENT", "LATENT")],
        inputs=[("pixels", "IMAGE"), ("vae", "VAE")], size=[210, 50]),
    "VAEEncodeForInpaint": dict(
        widgets=["grow_mask_by"], outputs=[("LATENT", "LATENT")],
        inputs=[("pixels", "IMAGE"), ("vae", "VAE"), ("mask", "MASK")], size=[240, 100]),
    "LoraLoader": dict(
        widgets=["lora_name", "strength_model", "strength_clip"],
        outputs=[("MODEL", "MODEL"), ("CLIP", "CLIP")],
        inputs=[("model", "MODEL"), ("clip", "CLIP")], size=[340, 130]),
    "ControlNetLoader": dict(
        widgets=["control_net_name"], outputs=[("CONTROL_NET", "CONTROL_NET")],
        inputs=[], size=[360, 60]),
    "ControlNetApplyAdvanced": dict(
        widgets=["strength", "start_percent", "end_percent"],
        outputs=[("positive", "CONDITIONING"), ("negative", "CONDITIONING")],
        inputs=[("positive", "CONDITIONING"), ("negative", "CONDITIONING"),
                ("control_net", "CONTROL_NET"), ("image", "IMAGE")], size=[300, 170]),
    # 以下两个来自 ComfyUI_IPAdapter_plus 扩展(未装时节点显示为红色)
    "IPAdapterUnifiedLoader": dict(
        widgets=["preset"], outputs=[("model", "MODEL"), ("ipadapter", "IPADAPTER")],
        inputs=[("model", "MODEL")], size=[340, 80]),
    "IPAdapter": dict(
        widgets=["weight", "weight_type", "start_at", "end_at"],
        outputs=[("MODEL", "MODEL")],
        inputs=[("model", "MODEL"), ("ipadapter", "IPADAPTER"), ("image", "IMAGE")], size=[300, 160]),
}

NEG_DEFAULT = "low quality, blurry, bad anatomy, extra limbs, watermark, text"


class Graph:
    def __init__(self):
        self.nodes = []          # (id, class_type, widgets_values, pos)
        self.links = []          # (link_id, from_id, from_slot, to_id, to_slot, type)
        self._nid = 0
        self._lid = 0

    def add(self, class_type, widgets, pos):
        self._nid += 1
        self.nodes.append(dict(id=self._nid, ct=class_type, wv=widgets, pos=pos))
        return self._nid

    def link(self, src, src_slot, dst, dst_slot_name):
        """src_slot 用索引, dst 用输入口名字(查表转索引)"""
        self._lid += 1
        dst_ct = next(n["ct"] for n in self.nodes if n["id"] == dst)
        in_names = [i[0] for i in NODE_DEFS[dst_ct]["inputs"]]
        dst_slot = in_names.index(dst_slot_name)
        src_ct = next(n["ct"] for n in self.nodes if n["id"] == src)
        ltype = NODE_DEFS[src_ct]["outputs"][src_slot][1]
        self.links.append((self._lid, src, src_slot, dst, dst_slot, ltype))

    # ---------- UI 格式 ----------
    def to_ui(self):
        nodes_json = []
        for n in self.nodes:
            d = NODE_DEFS[n["ct"]]
            outputs = []
            for slot, (oname, otype) in enumerate(d["outputs"]):
                ls = [l[0] for l in self.links if l[1] == n["id"] and l[2] == slot]
                outputs.append({"name": oname, "type": otype, "links": ls or None,
                                "slot_index": slot})
            inputs = []
            for slot, (iname, itype) in enumerate(d["inputs"]):
                lk = next((l[0] for l in self.links if l[3] == n["id"] and l[4] == slot), None)
                inputs.append({"name": iname, "type": itype, "link": lk})
            node = {"id": n["id"], "type": n["ct"], "pos": n["pos"],
                    "size": d["size"], "flags": {}, "order": n["id"] - 1, "mode": 0,
                    "inputs": inputs, "outputs": outputs,
                    "properties": {"Node name for S&R": n["ct"]}}
            if d["widgets"]:
                node["widgets_values"] = n["wv"]
            nodes_json.append(node)
        return {"last_node_id": self._nid, "last_link_id": self._lid,
                "nodes": nodes_json,
                "links": [list(l) for l in self.links],
                "groups": [], "config": {}, "extra": {}, "version": 0.4}

    # ---------- API 格式 ----------
    def to_api(self):
        out = {}
        for n in self.nodes:
            d = NODE_DEFS[n["ct"]]
            skip = set(d.get("api_skip", []))
            inputs = {}
            for wname, wval in zip(d["widgets"], n["wv"]):
                if wname not in skip:
                    inputs[wname] = wval
            for slot, (iname, _) in enumerate(d["inputs"]):
                lk = next((l for l in self.links if l[3] == n["id"] and l[4] == slot), None)
                if lk:
                    inputs[iname] = [str(lk[1]), lk[2]]
            out[str(n["id"])] = {"class_type": n["ct"], "inputs": inputs,
                                 "_meta": {"title": n["ct"]}}
        return out


def txt2img(ckpt, w, h, pos_text, steps, cfg, prefix, seed=42):
    g = Graph()
    ck = g.add("CheckpointLoaderSimple", [ckpt], [50, 300])
    pos = g.add("CLIPTextEncode", [pos_text], [480, 150])
    neg = g.add("CLIPTextEncode", [NEG_DEFAULT], [480, 400])
    lat = g.add("EmptyLatentImage", [w, h, 1], [480, 640])
    ks = g.add("KSampler", [seed, "fixed", steps, cfg, "dpmpp_2m", "karras", 1.0], [950, 300])
    dec = g.add("VAEDecode", [], [1320, 300])
    sav = g.add("SaveImage", [prefix], [1580, 300])
    g.link(ck, 0, ks, "model"); g.link(ck, 1, pos, "clip"); g.link(ck, 1, neg, "clip")
    g.link(pos, 0, ks, "positive"); g.link(neg, 0, ks, "negative"); g.link(lat, 0, ks, "latent_image")
    g.link(ks, 0, dec, "samples"); g.link(ck, 2, dec, "vae"); g.link(dec, 0, sav, "images")
    return g


def build_all():
    wfs = {}

    wfs["wf01_sd15_txt2img"] = txt2img(
        "v1-5-pruned-emaonly-fp16.safetensors", 512, 512,
        "a cat astronaut floating inside a space station, detailed illustration, "
        "soft lighting, high quality", 25, 7.5, "course/wf01")

    wfs["wf02_sdxl_txt2img"] = txt2img(
        "sd_xl_base_1.0.safetensors", 1024, 1024,
        "a cat astronaut floating inside a space station, detailed illustration, "
        "soft lighting, high quality", 25, 6.0, "course/wf02")

    # wf03: SDXL 图生图
    g = Graph()
    ck = g.add("CheckpointLoaderSimple", ["sd_xl_base_1.0.safetensors"], [50, 300])
    img = g.add("LoadImage", ["example.png", "image"], [50, 640])
    enc = g.add("VAEEncode", [], [420, 660])
    pos = g.add("CLIPTextEncode", ["watercolor painting style, soft colors, high quality"], [480, 150])
    neg = g.add("CLIPTextEncode", [NEG_DEFAULT], [480, 400])
    ks = g.add("KSampler", [42, "fixed", 25, 6.0, "dpmpp_2m", "karras", 0.45], [950, 300])
    dec = g.add("VAEDecode", [], [1320, 300])
    sav = g.add("SaveImage", ["course/wf03"], [1580, 300])
    g.link(ck, 0, ks, "model"); g.link(ck, 1, pos, "clip"); g.link(ck, 1, neg, "clip")
    g.link(img, 0, enc, "pixels"); g.link(ck, 2, enc, "vae")
    g.link(pos, 0, ks, "positive"); g.link(neg, 0, ks, "negative"); g.link(enc, 0, ks, "latent_image")
    g.link(ks, 0, dec, "samples"); g.link(ck, 2, dec, "vae"); g.link(dec, 0, sav, "images")
    wfs["wf03_sdxl_img2img"] = g

    # wf04: SDXL inpaint(路线A: VAEEncodeForInpaint, 遮罩在 LoadImage 上右键画)
    g = Graph()
    ck = g.add("CheckpointLoaderSimple", ["sd_xl_base_1.0.safetensors"], [50, 300])
    img = g.add("LoadImage", ["example.png", "image"], [50, 640])
    enc = g.add("VAEEncodeForInpaint", [12], [460, 680])
    pos = g.add("CLIPTextEncode", ["a red scarf"], [480, 150])
    neg = g.add("CLIPTextEncode", [NEG_DEFAULT], [480, 400])
    ks = g.add("KSampler", [42, "fixed", 25, 6.0, "dpmpp_2m", "karras", 0.85], [950, 300])
    dec = g.add("VAEDecode", [], [1320, 300])
    sav = g.add("SaveImage", ["course/wf04"], [1580, 300])
    g.link(ck, 0, ks, "model"); g.link(ck, 1, pos, "clip"); g.link(ck, 1, neg, "clip")
    g.link(img, 0, enc, "pixels"); g.link(ck, 2, enc, "vae"); g.link(img, 1, enc, "mask")
    g.link(pos, 0, ks, "positive"); g.link(neg, 0, ks, "negative"); g.link(enc, 0, ks, "latent_image")
    g.link(ks, 0, dec, "samples"); g.link(ck, 2, dec, "vae"); g.link(dec, 0, sav, "images")
    wfs["wf04_sdxl_inpaint"] = g

    # wf05: SDXL + LoRA(下载后把 lora_name 换成你的文件)
    g = Graph()
    ck = g.add("CheckpointLoaderSimple", ["sd_xl_base_1.0.safetensors"], [50, 300])
    lo = g.add("LoraLoader", ["换成你下载的LoRA.safetensors", 1.0, 1.0], [430, 300])
    pos = g.add("CLIPTextEncode", ["触发词写这里, 1girl, silver hair, masterpiece, best quality"], [820, 150])
    neg = g.add("CLIPTextEncode", ["worst quality, low quality, bad anatomy, bad hands, watermark"], [820, 400])
    lat = g.add("EmptyLatentImage", [832, 1216, 1], [820, 640])
    ks = g.add("KSampler", [42, "fixed", 28, 6.0, "dpmpp_2m", "karras", 1.0], [1280, 300])
    dec = g.add("VAEDecode", [], [1640, 300])
    sav = g.add("SaveImage", ["course/wf05"], [1880, 300])
    g.link(ck, 0, lo, "model"); g.link(ck, 1, lo, "clip")
    g.link(lo, 0, ks, "model"); g.link(lo, 1, pos, "clip"); g.link(lo, 1, neg, "clip")
    g.link(pos, 0, ks, "positive"); g.link(neg, 0, ks, "negative"); g.link(lat, 0, ks, "latent_image")
    g.link(ks, 0, dec, "samples"); g.link(ck, 2, dec, "vae"); g.link(dec, 0, sav, "images")
    wfs["wf05_sdxl_lora"] = g

    # wf06: SDXL + ControlNet(openpose 骨架图放 Inputs, 模型用 union promax)
    g = Graph()
    ck = g.add("CheckpointLoaderSimple", ["sd_xl_base_1.0.safetensors"], [50, 300])
    cn = g.add("ControlNetLoader", ["controlnet-union-sdxl-promax.safetensors"], [50, 560])
    hint = g.add("LoadImage", ["pose.png", "image"], [50, 700])
    pos = g.add("CLIPTextEncode", ["1girl, school uniform, standing, classroom, masterpiece, best quality"], [480, 150])
    neg = g.add("CLIPTextEncode", ["worst quality, low quality, bad anatomy, watermark"], [480, 400])
    ap = g.add("ControlNetApplyAdvanced", [0.8, 0.0, 0.8], [900, 300])
    lat = g.add("EmptyLatentImage", [832, 1216, 1], [900, 640])
    ks = g.add("KSampler", [42, "fixed", 28, 6.0, "dpmpp_2m", "karras", 1.0], [1280, 300])
    dec = g.add("VAEDecode", [], [1640, 300])
    sav = g.add("SaveImage", ["course/wf06"], [1880, 300])
    g.link(ck, 0, ks, "model"); g.link(ck, 1, pos, "clip"); g.link(ck, 1, neg, "clip")
    g.link(pos, 0, ap, "positive"); g.link(neg, 0, ap, "negative")
    g.link(cn, 0, ap, "control_net"); g.link(hint, 0, ap, "image")
    g.link(ap, 0, ks, "positive"); g.link(ap, 1, ks, "negative"); g.link(lat, 0, ks, "latent_image")
    g.link(ks, 0, dec, "samples"); g.link(ck, 2, dec, "vae"); g.link(dec, 0, sav, "images")
    wfs["wf06_sdxl_controlnet"] = g

    # wf07: SDXL + IP-Adapter(需先装 ComfyUI_IPAdapter_plus 扩展, 否则节点为红)
    g = Graph()
    ck = g.add("CheckpointLoaderSimple", ["sd_xl_base_1.0.safetensors"], [50, 300])
    ul = g.add("IPAdapterUnifiedLoader", ["STANDARD (medium strength)"], [430, 300])
    ref = g.add("LoadImage", ["reference.png", "image"], [430, 520])
    ipa = g.add("IPAdapter", [0.7, "standard", 0.0, 0.9], [820, 300])
    pos = g.add("CLIPTextEncode", ["1girl, beach, sunset, masterpiece, best quality"], [820, 550])
    neg = g.add("CLIPTextEncode", ["worst quality, low quality, bad anatomy, watermark"], [820, 780])
    lat = g.add("EmptyLatentImage", [832, 1216, 1], [1200, 640])
    ks = g.add("KSampler", [42, "fixed", 28, 6.0, "dpmpp_2m", "karras", 1.0], [1280, 300])
    dec = g.add("VAEDecode", [], [1640, 300])
    sav = g.add("SaveImage", ["course/wf07"], [1880, 300])
    g.link(ck, 0, ul, "model")
    g.link(ul, 0, ipa, "model"); g.link(ul, 1, ipa, "ipadapter"); g.link(ref, 0, ipa, "image")
    g.link(ck, 1, pos, "clip"); g.link(ck, 1, neg, "clip")
    g.link(ipa, 0, ks, "model")
    g.link(pos, 0, ks, "positive"); g.link(neg, 0, ks, "negative"); g.link(lat, 0, ks, "latent_image")
    g.link(ks, 0, dec, "samples"); g.link(ck, 2, dec, "vae"); g.link(dec, 0, sav, "images")
    wfs["wf07_sdxl_ipadapter"] = g

    for name, graph in wfs.items():
        (OUT / f"{name}.json").write_text(
            json.dumps(graph.to_ui(), ensure_ascii=False, indent=1), encoding="utf-8")
        (OUT / "api" / f"{name}_api.json").write_text(
            json.dumps(graph.to_api(), ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"✓ {name}  (UI + API)")


if __name__ == "__main__":
    build_all()
