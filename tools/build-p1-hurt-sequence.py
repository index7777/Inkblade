from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/boss/xuanming-p1/new-master-review/hurt-four-beat-review-v1.png"
OUT = ROOT / "assets/boss/xuanming-p1/new-master/hurt"
CANVAS = 1536
TARGET_HEAD = (515, 500)
SCALE = 1.92


def paper_to_alpha(image):
    image = image.convert("RGB")
    gray = image.convert("L")
    alpha = gray.point(lambda value: 0 if value >= 238 else min(255, int((238 - value) * 3.7)))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))
    ink = Image.merge("RGB", (gray, gray, gray))
    ink.putalpha(alpha)
    return ink


def normalize(panel, source_head):
    panel = paper_to_alpha(panel)
    panel = panel.resize((round(panel.width * SCALE), round(panel.height * SCALE)), Image.Resampling.LANCZOS)
    head = (source_head[0] * SCALE, source_head[1] * SCALE)
    offset = (round(TARGET_HEAD[0] - head[0]), round(TARGET_HEAD[1] - head[1]))
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(panel, offset)
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE).convert("RGB")
    cuts = [round(sheet.width * index / 4) for index in range(5)]
    source_heads = [(185, 310), (207, 308), (172, 309), (177, 309)]
    frames = []
    for index in range(4):
        panel = sheet.crop((cuts[index], 0, cuts[index + 1], sheet.height))
        frame = normalize(panel, source_heads[index])
        frame.save(OUT / f"BOSS_XUANMING_P1_HURT_{index + 1:02d}.png")
        frames.append(frame)

    paper = (239, 232, 216, 255)
    cell = 640
    contact = Image.new("RGBA", (cell * 4, cell), paper)
    for index, frame in enumerate(frames):
        contact.alpha_composite(frame.resize((cell, cell), Image.Resampling.LANCZOS), (cell * index, 0))
        ImageDraw.Draw(contact).text((cell * index + 18, 18), str(index + 1), fill=(55, 48, 42, 220))
    contact.resize((1536, 384), Image.Resampling.LANCZOS).convert("RGB").save(
        OUT / "BOSS_XUANMING_P1_HURT_CONTACT_SHEET.jpg", quality=92
    )


if __name__ == "__main__":
    main()
