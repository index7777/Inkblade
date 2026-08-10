from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SHEETS = {
    "idle": Path(r"C:\Users\Index7\.codex\generated_images\019fe429-9b17-7883-a1d8-7bec08658d89\exec-7105b010-d420-4553-9c88-9a2a26093129.png"),
    "cast": Path(r"C:\Users\Index7\.codex\generated_images\019fe429-9b17-7883-a1d8-7bec08658d89\exec-9bf1cc96-59ee-4a78-88b3-654d7da8bb14.png"),
}
OUT = ROOT / "tmp" / "imagegen" / "hero-f-final" / "green"
OUT.mkdir(parents=True, exist_ok=True)


def foreground(rgb):
    d = rgb.astype(np.int32) - np.array([0, 255, 0], dtype=np.int32)
    return np.sqrt(np.sum(d * d, axis=2)) > 64


sets = {}
top = 10**9
bottom = 0
max_cell_w = 0
for name, path in SHEETS.items():
    rgb = np.asarray(Image.open(path).convert("RGB"))
    h, w = rgb.shape[:2]
    frames = []
    for i in range(6):
        x0 = round(i * w / 6)
        x1 = round((i + 1) * w / 6)
        cell = rgb[:, x0:x1].copy()
        mask = foreground(cell)
        ys, xs = np.where(mask)
        if len(xs) < 1000:
            raise RuntimeError(f"Too little subject coverage in {name} frame {i + 1}")
        top = min(top, int(ys.min()))
        bottom = max(bottom, int(ys.max()))
        max_cell_w = max(max_cell_w, cell.shape[1])
        frames.append(cell)
    sets[name] = frames

# Use one canvas for both sets. Vertical union crop keeps the exact same foot anchor;
# horizontal centering absorbs the one-pixel rounding difference between six cells.
pad_y = 8
y0 = max(0, top - pad_y)
y1 = min(next(iter(sets.values()))[0].shape[0], bottom + pad_y + 1)
canvas_w = max_cell_w
for name, frames in sets.items():
    for i, cell in enumerate(frames, 1):
        crop = cell[y0:y1]
        out = np.zeros((crop.shape[0], canvas_w, 3), dtype=np.uint8)
        out[:] = (0, 255, 0)
        ox = (canvas_w - crop.shape[1]) // 2
        out[:, ox:ox + crop.shape[1]] = crop
        Image.fromarray(out).save(OUT / f"HEROF_GEN_{name}_{i:02}.png")

print(f"canvas={canvas_w}x{y1-y0}; source-y={y0}:{y1}")
