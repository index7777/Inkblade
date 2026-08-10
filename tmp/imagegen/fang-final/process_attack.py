from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SOURCE = Path(r"C:\Users\Index7\.codex\generated_images\019fe429-9b17-7883-a1d8-7bec08658d89\exec-5cff7ef8-8e68-4013-8b00-9e2c0ce3e361.png")
OUT = ROOT / "tmp" / "imagegen" / "fang-final" / "green"
OUT.mkdir(parents=True, exist_ok=True)

rgb = np.asarray(Image.open(SOURCE).convert("RGB"))
h, w = rgb.shape[:2]
delta = rgb.astype(np.int32) - np.array([0, 255, 0], dtype=np.int32)
fg = (np.sqrt(np.sum(delta * delta, axis=2)) > 65).astype(np.uint8)
count, labels, stats, centroids = cv2.connectedComponentsWithStats(fg, 8)

canvas_w, source_y0, source_y1 = 420, 242, 507
canvas_h = source_y1 - source_y0
cell_w = w / 6
used = set()
metrics = []
for i in range(6):
    expected_x = (i + .5) * cell_w
    candidates = [
        j for j in range(1, count)
        if stats[j, cv2.CC_STAT_AREA] > 5000
        and abs(centroids[j, 0] - expected_x) < cell_w * .62
        and j not in used
    ]
    if not candidates:
        raise RuntimeError(f"No clean Fang component for frame {i + 1}")
    principal = min(candidates, key=lambda j: abs(centroids[j, 0] - expected_x))
    used.add(principal)
    mask = labels == principal
    ys, xs = np.where(mask)
    out = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)
    out[:] = (0, 255, 0)
    tx = np.rint(xs - expected_x + canvas_w / 2).astype(int)
    ty = ys - source_y0
    valid = (tx >= 0) & (tx < canvas_w) & (ty >= 0) & (ty < canvas_h)
    out[ty[valid], tx[valid]] = rgb[ys[valid], xs[valid]]
    Image.fromarray(out).save(OUT / f"ENE_INK_FANG_attack_{i + 1:02}.png")
    metrics.append({
        "frame": i + 1,
        "source_bbox": [int(xs.min()), int(ys.min()), int(xs.max()+1), int(ys.max()+1)],
        "body_width": int(xs.max()-xs.min()+1),
        "body_height": int(ys.max()-ys.min()+1),
        "source_bottom": int(ys.max()+1),
    })

print(f"canvas={canvas_w}x{canvas_h}; source={w}x{h}")
for item in metrics:
    print(item)
