from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "zone1_boss _受擊1.png"
OUT = ROOT / "assets" / "boss" / "xuanming-p1" / "new-master"
SIZE = 1536


def build_master():
    source = Image.open(SOURCE).convert("RGB")
    # The supplied reference is flattened over a pale checkerboard. Crop only the
    # authored dragon region, excluding the unrelated lower-right mark.
    source = source.crop((85, 20, 1810, 1650))
    gray = source.convert("L")

    # Treat paper/checker values as transparency and retain pale wash as a soft
    # alpha edge. This is intentionally luminance-derived, not green-screened.
    alpha = gray.point(lambda value: 0 if value >= 238 else min(255, int((238 - value) * 3.65)))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))

    # White eyes sit inside the dark head and must remain opaque. Closing the
    # local head matte recovers those enclosed highlights without filling the
    # open negative space around the body.
    head_close = alpha.crop((120, 260, 760, 940)).filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.MinFilter(21))
    alpha.paste(ImageChops.lighter(alpha.crop((120, 260, 760, 940)), head_close), (120, 260))

    ink = Image.merge("RGB", (gray, gray, gray))
    ink.putalpha(alpha)
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError("Master extraction produced an empty alpha matte")
    ink = ink.crop(bbox)
    scale = min(1310 / ink.width, 1350 / ink.height)
    ink = ink.resize((round(ink.width * scale), round(ink.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    anchor = ((SIZE - ink.width) // 2, (SIZE - ink.height) // 2)
    canvas.alpha_composite(ink, anchor)
    return canvas


def reveal(master, radius, softness, opacity=1.0):
    # One fixed master and one fixed head anchor are used for every frame.
    center = (535, 565)
    mask = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((center[0] - radius, center[1] - radius,
                  center[0] + radius, center[1] + radius), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(softness))
    base_alpha = master.getchannel("A")
    frame_alpha = ImageChops.multiply(base_alpha, mask)
    if opacity != 1.0:
        frame_alpha = frame_alpha.point(lambda value: round(value * opacity))
    frame = master.copy()
    frame.putalpha(frame_alpha)
    return frame


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    master = build_master()
    master.save(OUT / "BOSS_XUANMING_P1_MASTER_WHITE_EYES.png")

    specs = [
        (155, 55, 0.34),
        (260, 48, 0.58),
        (390, 44, 0.78),
        (555, 38, 0.90),
        (760, 30, 0.97),
        (1200, 10, 1.00),
    ]
    frames = []
    for index, spec in enumerate(specs, 1):
        frame = reveal(master, *spec)
        frame.save(OUT / f"BOSS_XUANMING_P1_ENTRANCE_{index:02d}.png")
        frames.append(frame)

    paper = (239, 232, 216, 255)
    sheet = Image.new("RGBA", (SIZE * 3, SIZE * 2), paper)
    for index, frame in enumerate(frames):
        preview = Image.new("RGBA", (SIZE, SIZE), paper)
        preview.alpha_composite(frame)
        sheet.alpha_composite(preview, ((index % 3) * SIZE, (index // 3) * SIZE))
    sheet.resize((1536, 1024), Image.Resampling.LANCZOS).convert("RGB").save(
        OUT / "BOSS_XUANMING_P1_ENTRANCE_CONTACT_SHEET.jpg", quality=92
    )


if __name__ == "__main__":
    main()
