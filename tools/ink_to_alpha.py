#!/usr/bin/env python3
"""白底黑墨 → 真透明 PNG(亮度轉 alpha)。
用法: python tools/ink_to_alpha.py 輸入.png 輸出.png [--threshold 250]
- alpha = 255 - 亮度:白→透明、黑→不透明,墨的濃淡自然成半透明(適合煙霧/飛白)。
- 紅色像素(紅眼等高飽和紅)自動保留為不透明並維持顏色。
- 適用墨靈/煙霧/FX;墨刃兵、墨獸實體(白底黑墨)亦可用,比 rembg 穩。
"""
import sys
import numpy as np
from PIL import Image

def main():
    if len(sys.argv) < 3:
        print("用法: python tools/ink_to_alpha.py 輸入.png 輸出.png [--threshold 250]"); sys.exit(2)
    src, dst = sys.argv[1], sys.argv[2]
    thr = 250
    if "--threshold" in sys.argv:
        thr = int(sys.argv[sys.argv.index("--threshold")+1])
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[:,:,0], a[:,:,1], a[:,:,2]
    lum = 0.299*r + 0.587*g + 0.114*b
    alpha = np.clip(255.0 - lum, 0, 255)          # 白→0(透明)、黑→255(不透明)
    # 接近純白的像素直接視為全透明(去掉殘底)
    alpha[lum >= thr] = 0
    # 保留紅色(紅眼):紅明顯大於綠藍 → 拉高 alpha
    red = (r - np.maximum(g, b)) > 40
    alpha[red] = np.maximum(alpha[red], 220)
    out = np.dstack([a, alpha]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst)
    op = float((alpha>10).mean()*100)
    print(f"OK -> {dst} | 不透明像素佔比 {op:.1f}%")

if __name__ == "__main__":
    main()
