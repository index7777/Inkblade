from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "boss" / "xuanming-p1" / "new-master" / "core-cast"
CANVAS = 1536
TARGET_HEAD = (520, 505)
TARGET_EYE_GAP = 68


def paper_to_alpha(path):
    image = Image.open(path).convert("RGB")
    gray = image.convert("L")
    alpha = gray.point(lambda value: 0 if value >= 244 else min(255, int((244 - value) * 4.0)))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    ink = Image.merge("RGB", (gray, gray, gray))
    ink.putalpha(alpha)
    return ink


def normalize(image, source_head, source_eye_gap):
    image = image.convert("RGBA")
    scale = TARGET_EYE_GAP / source_eye_gap
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    scaled_head = (source_head[0] * scale, source_head[1] * scale)
    offset = (round(TARGET_HEAD[0] - scaled_head[0]), round(TARGET_HEAD[1] - scaled_head[1]))
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(image, offset)
    return canvas


def release_frame(body):
    projectile_path = ROOT / "assets/boss/xuanming-p1/projectiles/BOSS_XUANMING_HEAVY_CORE_01.png"
    projectile = Image.open(projectile_path).convert("RGBA")
    bbox = projectile.getchannel("A").getbbox()
    projectile = projectile.crop(bbox)
    projectile_alpha = projectile.getchannel("A")
    projectile_gray = projectile.convert("L")
    projectile = Image.merge("RGBA", (projectile_gray, projectile_gray, projectile_gray, projectile_alpha))
    projectile.thumbnail((145, 145), Image.Resampling.LANCZOS)
    frame = body.copy()
    # The core is already detached and positioned below the fixed head anchor.
    frame.alpha_composite(projectile, (TARGET_HEAD[0] - 150 - projectile.width // 2, TARGET_HEAD[1] + 165))
    return frame


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    specs = [
        (ROOT / "assets/boss/xuanming-p1/BOSS_XUANMING_P1_skill_01.png", (347, 478), 45, False),
        (ROOT / "assets/boss/xuanming-p1/BOSS_XUANMING_P1_skill_02.png", (347, 478), 45, False),
        (ROOT / "assets/boss/xuanming-p1/BOSS_XUANMING_P1_skill_03.png", (347, 478), 45, False),
    ]
    normalized = []
    for path, head, eye_gap, paper in specs:
        image = paper_to_alpha(path) if paper else Image.open(path).convert("RGBA")
        normalized.append(normalize(image, head, eye_gap))
    frames = [normalized[0], normalized[1], release_frame(normalized[0]), normalized[2]]
    for index, frame in enumerate(frames, 1):
        frame.save(OUT / f"BOSS_XUANMING_P1_CORE_CAST_{index:02d}.png")

    paper_color = (239, 232, 216, 255)
    cell = 640
    sheet = Image.new("RGBA", (cell * 4, cell), paper_color)
    for index, frame in enumerate(frames):
        preview = frame.resize((cell, cell), Image.Resampling.LANCZOS)
        sheet.alpha_composite(preview, (cell * index, 0))
        draw = ImageDraw.Draw(sheet)
        draw.text((cell * index + 18, 18), str(index + 1), fill=(55, 48, 42, 220))
    sheet.resize((1536, 384), Image.Resampling.LANCZOS).convert("RGB").save(
        OUT / "BOSS_XUANMING_P1_CORE_CAST_CONTACT_SHEET.jpg", quality=92
    )


if __name__ == "__main__":
    main()
