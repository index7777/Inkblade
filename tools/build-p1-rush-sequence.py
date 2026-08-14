from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/boss/xuanming-p1/new-master-review/rush-cast-five-beat-review-v1.png"
RELEASE = ROOT / "assets/boss/xuanming-p1/new-master-review/rush-release-separated-review-v2.png"
OUT = ROOT / "assets/boss/xuanming-p1/new-master/rush-cast"
CANVAS = 1536
TARGET_HEAD = (515, 500)


def paper_to_alpha(image):
    image = image.convert("RGB")
    gray = image.convert("L")
    alpha = gray.point(lambda value: 0 if value >= 238 else min(255, int((238 - value) * 3.7)))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))
    ink = Image.merge("RGB", (gray, gray, gray))
    ink.putalpha(alpha)
    return ink


def normalize(image, source_head, scale):
    image = image.convert("RGBA")
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    head = (source_head[0] * scale, source_head[1] * scale)
    offset = (round(TARGET_HEAD[0] - head[0]), round(TARGET_HEAD[1] - head[1]))
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(image, offset)
    return canvas


def build_release():
    source = paper_to_alpha(Image.open(RELEASE))
    boss_layer = source.crop((0, 0, source.width, 760))
    boss = normalize(boss_layer, (535, 394), 1.36)

    projectile = source.crop((250, 700, 1050, source.height))
    bbox = projectile.getchannel("A").getbbox()
    projectile = projectile.crop(bbox)
    projectile.thumbnail((600, 360), Image.Resampling.LANCZOS)
    boss.alpha_composite(projectile, (TARGET_HEAD[0] - projectile.width // 2, 1040))
    return boss


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE).convert("RGB")
    cuts = [0, round(sheet.width / 5), round(sheet.width * 2 / 5), round(sheet.width * 3 / 5), round(sheet.width * 4 / 5), sheet.width]
    panel_specs = [
        (0, (174, 302)),
        (1, (173, 304)),
        (2, (176, 310)),
        (4, (174, 304)),
    ]
    panels = []
    for panel_index, head in panel_specs:
        panel = sheet.crop((cuts[panel_index], 0, cuts[panel_index + 1], sheet.height))
        panels.append(normalize(paper_to_alpha(panel), head, 3.05))

    release = build_release()
    frames = [panels[0], panels[1], panels[2], release, panels[3]]
    for index, frame in enumerate(frames, 1):
        frame.save(OUT / f"BOSS_XUANMING_P1_RUSH_CAST_{index:02d}.png")

    paper = (239, 232, 216, 255)
    cell = 640
    contact = Image.new("RGBA", (cell * 5, cell), paper)
    for index, frame in enumerate(frames):
        contact.alpha_composite(frame.resize((cell, cell), Image.Resampling.LANCZOS), (cell * index, 0))
        ImageDraw.Draw(contact).text((cell * index + 18, 18), str(index + 1), fill=(55, 48, 42, 220))
    contact.resize((1600, 320), Image.Resampling.LANCZOS).convert("RGB").save(
        OUT / "BOSS_XUANMING_P1_RUSH_CAST_CONTACT_SHEET.jpg", quality=92
    )


if __name__ == "__main__":
    main()
