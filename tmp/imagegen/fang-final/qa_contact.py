from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "assets" / "enemies" / "generated" / "fang"
OUT = ROOT / "tmp" / "imagegen" / "fang-final" / "fang-game-scale-qa.png"

paper = (238, 229, 210, 255)
cell_w, cell_h = 164, 116
sheet = Image.new("RGBA", (cell_w * 6, cell_h * 2), paper)
draw = ImageDraw.Draw(sheet)

for row, kind in enumerate(("move", "attack")):
    records = []
    for i in range(1, 7):
        im = Image.open(SRC / f"ENE_INK_FANG_{kind}_{i:02}.png").convert("RGBA")
        dest_h = 72 if kind == "move" else round(72 * 265 / 201)
        dest_w = round(im.width * dest_h / im.height)
        shown = im.resize((dest_w, dest_h), Image.Resampling.LANCZOS)
        x = (i - 1) * cell_w + (cell_w - dest_w) // 2
        # Match the game ground line: both animation sets end at the same screen y.
        ground = row * cell_h + 101
        y = ground - dest_h
        sheet.alpha_composite(shown, (x, y))
        draw.line(((i - 1) * cell_w, ground, i * cell_w, ground), fill=(145, 112, 84, 90), width=1)
        draw.text(((i - 1) * cell_w + 3, row * cell_h + 3), f"{kind[0].upper()}{i}", fill=(80, 56, 43, 255))
        b = im.getchannel("A").getbbox()
        records.append((b[2]-b[0], b[3]-b[1], b[3]))
    print(kind, records)

sheet.convert("RGB").save(OUT)
print(OUT)
