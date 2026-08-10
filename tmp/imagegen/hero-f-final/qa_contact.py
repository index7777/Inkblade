from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "assets" / "hero-f" / "generated"
OUT = ROOT / "tmp" / "imagegen" / "hero-f-final" / "hero-f-60px-qa.png"
bg = (238, 229, 210, 255)
cell_w, cell_h = 62, 92
sheet = Image.new("RGBA", (cell_w * 6, cell_h * 2), bg)
draw = ImageDraw.Draw(sheet)

for row, kind in enumerate(("idle", "cast")):
    metrics = []
    for i in range(1, 7):
        im = Image.open(SRC / f"HEROF_GEN_{kind}_{i:02}.png").convert("RGBA")
        box = im.getchannel("A").getbbox()
        metrics.append((box[2] - box[0], box[3] - box[1], box[3]))
        h = 60
        w = round(im.width * h / im.height)
        small = im.resize((w, h), Image.Resampling.LANCZOS)
        x = i * cell_w - cell_w + (cell_w - w) // 2
        y = row * cell_h + 15
        sheet.alpha_composite(small, (x, y))
        draw.text((x + 1, row * cell_h + 2), f"{kind[0].upper()}{i}", fill=(82, 65, 50, 255))
    print(kind, metrics)

sheet.convert("RGB").save(OUT)
print(OUT)
