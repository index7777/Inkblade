#!/usr/bin/env python3
"""Prepare approved Xuanming P1 sources and candidate projectile sheets for runtime."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'boss'/'xuanming-p1'
PROJECTILES=OUT/'projectiles'
OUT.mkdir(parents=True,exist_ok=True)
PROJECTILES.mkdir(parents=True,exist_ok=True)

def ink_alpha(src, canvas=1024, max_subject=900):
    im=Image.open(src).convert('RGB')
    arr=np.asarray(im).astype(np.float32)
    lum=.299*arr[:,:,0]+.587*arr[:,:,1]+.114*arr[:,:,2]
    chroma=arr.max(axis=2)-arr.min(axis=2)
    # The checkerboard is baked into RGB. Its white and grey cells are both light,
    # neutral and repetitive, so remove the whole neutral-light band. Preserve dark
    # ink and the cinnabar core even when surrounded by the baked checker pattern.
    alpha=np.clip((220-lum)*10.0,0,255)
    alpha[(lum>216)&(chroma<11)]=0
    alpha=Image.fromarray(alpha.astype(np.uint8),'L').filter(ImageFilter.GaussianBlur(.45))
    rgba=Image.merge('RGBA',(*im.split(),alpha))
    bbox=alpha.getbbox()
    if not bbox: raise ValueError(f'empty source: {src}')
    # Remove the generator watermark zone after content detection.
    x0,y0,x1,y1=bbox
    x1=min(x1,int(im.width*.965)); y1=min(y1,int(im.height*.94))
    crop=rgba.crop((x0,y0,x1,y1))
    scale=min(max_subject/crop.width,max_subject/crop.height)
    crop=crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))),Image.Resampling.LANCZOS)
    dst=Image.new('RGBA',(canvas,canvas))
    dst.alpha_composite(crop,((canvas-crop.width)//2,(canvas-crop.height)//2))
    return dst

def split_sheet(src,prefix):
    sheet=Image.open(src).convert('RGBA')
    cell_w=sheet.width/4
    for i in range(4):
        cell=sheet.crop((round(i*cell_w),0,round((i+1)*cell_w),sheet.height))
        bbox=cell.getchannel('A').getbbox()
        if not bbox: raise ValueError(f'empty {prefix} frame {i+1}')
        cell=cell.crop(bbox)
        scale=min(420/cell.width,420/cell.height)
        cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
        dst=Image.new('RGBA',(512,512))
        dst.alpha_composite(cell,((512-cell.width)//2,(512-cell.height)//2))
        dst.save(PROJECTILES/f'{prefix}_{i+1:02}.png',optimize=True)

sources={
  'manifest':[ROOT/f'zon1_boss_P1_出場{i}.png' if i!=3 else ROOT/'zon1_boss_P1_出場3.Png' for i in range(1,5)],
  'skill':[ROOT/f'zon1_boss_P1_skill{i}.png' for i in (1,2,4)],
  'hurt':[ROOT/f'zone1_boss _受擊{i}.png' for i in range(1,5)]
}
for action,paths in sources.items():
    for i,p in enumerate(paths,1):
        ink_alpha(p).save(OUT/f'BOSS_XUANMING_P1_{action}_{i:02}.png',optimize=True)

split_sheet(ROOT/'art/staging/bosses/xuanming/projectiles/BOSS_XUANMING_HEAVY_CORE_sheet_candidate-v1.png','BOSS_XUANMING_HEAVY_CORE')
split_sheet(ROOT/'art/staging/bosses/xuanming/projectiles/BOSS_XUANMING_RING_WAVE_sheet_candidate-v1.png','BOSS_XUANMING_RING_WAVE')

manifest={
  'id':'boss.xuanming.p1','canvas':{'width':1024,'height':1024},
  'anchor':{'bodyPivot':{'x':.5,'y':.56},'head':{'x':.31,'y':.34},'healthBar':{'x':.5,'y':.045}},
  'actions':{
    'manifest':[f'BOSS_XUANMING_P1_manifest_{i:02}.png' for i in range(1,5)],
    'idle':['BOSS_XUANMING_P1_manifest_04.png'],
    'skill':[f'BOSS_XUANMING_P1_skill_{i:02}.png' for i in range(1,4)],
    'hurt':[f'BOSS_XUANMING_P1_hurt_{i:02}.png' for i in range(1,5)]
  },
  'projectiles':{
    'heavyCore':[f'projectiles/BOSS_XUANMING_HEAVY_CORE_{i:02}.png' for i in range(1,5)],
    'ringWave':[f'projectiles/BOSS_XUANMING_RING_WAVE_{i:02}.png' for i in range(1,5)]
  }
}
(OUT/'boss.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'output':str(OUT),'bodyFrames':11,'projectileFrames':8},ensure_ascii=False))
