from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SHEETS = {
    "idle": Path(r"C:\Users\Index7\.codex\generated_images\019fe429-9b17-7883-a1d8-7bec08658d89\exec-64bb3617-a871-416a-9203-1a658c884efe.png"),
    "attack": Path(r"C:\Users\Index7\.codex\generated_images\019fe429-9b17-7883-a1d8-7bec08658d89\exec-1688a584-71c6-47f3-86ac-4f56e99899e9.png"),
}
OUT = ROOT / "tmp" / "imagegen" / "hero-x-final" / "green"
OUT.mkdir(parents=True, exist_ok=True)


def extract_frames(path: Path, frame_count=6):
    rgb = np.asarray(Image.open(path).convert("RGB"))
    h, w = rgb.shape[:2]
    # Generated chroma backgrounds vary slightly, so key by distance from pure green.
    delta = rgb.astype(np.int32) - np.array([0, 255, 0], dtype=np.int32)
    fg = (np.sqrt(np.sum(delta * delta, axis=2)) > 70).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(fg, 8)
    frames = []
    cell = w / 6
    used = set()
    for i in range(frame_count):
        expected = (i + .5) * cell
        candidates = [
            j for j in range(1, count)
            if stats[j, cv2.CC_STAT_AREA] > 2500
            and abs(centroids[j, 0] - expected) < cell * .72
            and j not in used
        ]
        if not candidates:
            raise RuntimeError(f"No principal sprite component for {path.name} frame {i + 1}")
        # Prefer the large figure nearest the expected cell center.
        principal = max(candidates, key=lambda j: stats[j, cv2.CC_STAT_AREA] / (1 + abs(centroids[j, 0] - expected) / cell))
        used.add(principal)
        mask = labels == principal
        ys, xs = np.where(mask)
        # Body center is more stable than the full component centroid when the sword extends.
        mid = (ys > h * .23) & (ys < h * .76)
        body_x = float(np.median(xs[mid])) if np.any(mid) else float(np.median(xs))
        frames.append((rgb, mask, body_x, xs.min(), xs.max()))
    return h, frames


all_sets = {}
max_left = max_right = 0
canvas_h = 0
for name, path in SHEETS.items():
    # The generated attack sheet's last two figures overlap. Use its first four
    # clean connected figures and build the recovery from clean earlier poses.
    h, frames = extract_frames(path, 4 if name == "attack" else 6)
    canvas_h = max(canvas_h, h)
    all_sets[name] = frames
    for _, _, body_x, xmin, xmax in frames:
        max_left = max(max_left, int(np.ceil(body_x - xmin)))
        max_right = max(max_right, int(np.ceil(xmax - body_x)))

# Build a clean six-frame attack arc without the overlapping fifth/sixth figures.
atk = all_sets["attack"]
idle = all_sets["idle"]
all_sets["attack"] = [idle[0], atk[1], atk[2], atk[3], atk[2], idle[1]]

# One shared canvas for idle and attack keeps scale and foot placement identical in-game.
pad = 14
canvas_w = max_left + max_right + pad * 2
center_x = max_left + pad
for name, frames in all_sets.items():
    for i, (rgb, mask, body_x, _, _) in enumerate(frames, 1):
        out = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)
        out[:] = (0, 255, 0)
        shift = int(round(center_x - body_x))
        ys, xs = np.where(mask)
        tx = xs + shift
        valid = (tx >= 0) & (tx < canvas_w)
        out[ys[valid], tx[valid]] = rgb[ys[valid], xs[valid]]
        Image.fromarray(out).save(OUT / f"HEROX_{name}_{i:02}.png")

print(f"canvas={canvas_w}x{canvas_h}; left={max_left}; right={max_right}")
