from __future__ import annotations

import argparse, json, re, shutil, sys
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ACTOR = "ink_blade"
DIRECTIONS = ("N", "E", "S")
NAME = re.compile(r"^(ink_blade)_(body)_(walk)_(N|E|S)_(\d{2})\.png$")
OUTPUTS = ROOT / "art/comfyui/outputs/ink_blade"
STAGING = ROOT / "art/staging/actors/ink_blade"
APPROVED = STAGING / "approved"
RUNTIME = ROOT / "assets/actors/enemies/ink_blade/runtime/body/walk"
SOURCE = ROOT / "assets/actors/enemies/ink_blade/source/body/walk"
MANIFEST = ROOT / "assets/actors/enemies/ink_blade/actor.manifest.json"
REPORT = ROOT / "art/reports/ink_blade_pipeline.json"
CANVAS = (362, 201)
FIXTURE_CANVAS = (548, 512)
FOOT_PIVOT = {"x": .5, "y": .88}

def scan(folder: Path):
    valid, orphan = [], []
    for path in sorted(p for p in folder.glob("*") if p.is_file() and p.name != ".gitkeep"):
        match = NAME.match(path.name)
        if match: valid.append((path, match))
        else: orphan.append(path)
    return valid, orphan

def inspect(paths):
    issues, sizes, alpha, nonempty = [], set(), {}, {}
    for path, match in paths:
        with Image.open(path) as im:
            sizes.add(im.size)
            has_alpha = "A" in im.getbands()
            alpha[path.name] = has_alpha
            if not has_alpha:
                issues.append(f"missing alpha channel: {path.name}")
                ratio = 1.0
            else:
                channel = im.getchannel("A")
                ratio = sum(1 for value in channel.getdata() if value > 8) / (im.width * im.height)
            nonempty[path.name] = round(ratio, 6)
            if ratio < .002: issues.append(f"almost empty image: {path.name} ({ratio:.4%})")
    if len(sizes) > 1: issues.append("frame dimensions are inconsistent: " + repr(sorted(sizes)))
    return issues, sizes, alpha, nonempty

def grouped(paths):
    result = {direction: [] for direction in DIRECTIONS}
    for path, match in paths: result[match.group(4)].append((int(match.group(5)), path))
    for direction in result: result[direction].sort()
    return result

def frame_gaps(groups):
    missing = {}
    for direction, frames in groups.items():
        numbers = {number for number, _ in frames}
        if numbers:
            gaps = [index for index in range(1, max(numbers) + 1) if index not in numbers]
            if gaps: missing[direction] = gaps
    return missing

def report(status, phase, **data):
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    payload = {"actor": ACTOR, "status": status, "phase": phase,
               "generatedAt": datetime.now(timezone.utc).isoformat(), **data}
    REPORT.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))

def stage(_args):
    valid, orphan = scan(OUTPUTS)
    if not valid: raise SystemExit("No contract PNG files found in " + str(OUTPUTS))
    STAGING.mkdir(parents=True, exist_ok=True)
    for path, _ in valid: shutil.copy2(path, STAGING / path.name)
    issues, sizes, alpha, nonempty = inspect(valid)
    groups = grouped(valid)
    missing = [d for d, frames in groups.items() if not frames]
    if missing: issues.append("missing directions: " + ", ".join(missing))
    missing_frames = frame_gaps(groups)
    if missing_frames: issues.append("missing frame numbers: " + repr(missing_frames))
    status = "ready_for_approval" if not issues else "failed"
    report(status, "staging", files=len(valid), directions={d:len(v) for d,v in groups.items()},
           sizes=[list(x) for x in sorted(sizes)], alpha=alpha, nonemptyRatio=nonempty,
           missing=missing, missingFrames=missing_frames, orphanFiles=[p.name for p in orphan], issues=issues,
           approvalInstruction="Copy reviewed PNGs from staging root into staging/approved before process.")
    if issues: raise SystemExit(2)

def fixture(_args):
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    for direction in DIRECTIONS:
        for index in range(1, 10):
            src = ROOT / f"assets/enemies/ENE_BLADE_walk_{index:02}.png"
            dst = OUTPUTS / f"ink_blade_body_walk_{direction}_{index:02}.png"
            with Image.open(src) as raw:
                im=raw.convert("RGBA")
                out=Image.new("RGBA",FIXTURE_CANVAS,(0,0,0,0))
                out.alpha_composite(im,((FIXTURE_CANVAS[0]-im.width)//2,FIXTURE_CANVAS[1]-im.height))
                out.save(dst,optimize=True)
    print("Created contract fixtures from legacy art; AI GENERATION NOT VERIFIED")

def normalize(src: Path, dst: Path):
    with Image.open(src) as raw:
        im = raw.convert("RGBA")
        alpha = im.getchannel("A"); bbox = alpha.getbbox()
        if not bbox: raise ValueError("empty frame " + src.name)
        crop = im.crop(bbox)
        scale = min(CANVAS[0] / crop.width, (CANVAS[1] * .88) / crop.height, 1.0)
        if scale < 1: crop = crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))), Image.Resampling.LANCZOS)
        out = Image.new("RGBA", CANVAS, (0,0,0,0))
        foot_x = round(CANVAS[0]*FOOT_PIVOT["x"]); foot_y = round(CANVAS[1]*FOOT_PIVOT["y"])
        out.alpha_composite(crop, (foot_x-crop.width//2, foot_y-crop.height))
        dst.parent.mkdir(parents=True, exist_ok=True); out.save(dst, optimize=True)

def process(args):
    valid, orphan = scan(APPROVED)
    if not valid: raise SystemExit("No manually approved PNG files found in " + str(APPROVED))
    issues, sizes, alpha, nonempty = inspect(valid); groups = grouped(valid)
    missing = [d for d, frames in groups.items() if not frames]
    missing_frames = frame_gaps(groups)
    counts = {len(v) for v in groups.values()}
    if missing: issues.append("missing directions: " + ", ".join(missing))
    if missing_frames: issues.append("missing frame numbers: " + repr(missing_frames))
    if len(counts) != 1: issues.append("frame counts differ by direction")
    targets = [RUNTIME/d/f"ink_blade_body_walk_{d}_{i:02}.png" for d, frames in groups.items() for i,_ in frames]
    existing = [p for p in targets if p.exists()]
    if MANIFEST.exists() and not args.force:
        try: existing_source = json.loads(MANIFEST.read_text(encoding="utf-8")).get("assetSource")
        except (json.JSONDecodeError, OSError): existing_source = None
        if existing_source != "ai-runtime":
            issues.append("refusing to replace a non ai-runtime manifest without --force")
    if existing and not args.force:
        issues.append(f"refusing to overwrite {len(existing)} runtime files without --force")
    if issues:
        report("failed", "process", issues=issues, missing=missing, missingFrames=missing_frames, orphanFiles=[p.name for p in orphan])
        raise SystemExit(2)
    runtime_files = {}
    for direction, frames in groups.items():
        runtime_files[direction] = []
        for output_index, (_, src) in enumerate(frames, 1):
            source_dst = SOURCE/direction/src.name
            source_dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, source_dst)
            dst = RUNTIME/direction/f"ink_blade_body_walk_{direction}_{output_index:02}.png"
            normalize(src, dst)
            runtime_files[direction].append(dst.relative_to(ROOT).as_posix())
    frame_count = next(iter(counts))
    manifest = {
      "schemaVersion":1,"actorId":"enemy.ink_blade","version":"0.2.0","kind":"enemy","assetSource":"ai-runtime",
      "canvas":{"width":CANVAS[0],"height":CANVAS[1],"footPivot":FOOT_PIVOT},
      "authoredDirections":list(DIRECTIONS),"mirrorX":True,
      "layers":{"weaponBack":{"order":10,"required":False},"body":{"order":20,"required":True},"weaponFront":{"order":30,"required":False}},
      "animations":{"walk":{"fps":4.2,"loop":True,"frameCount":frame_count,"directions":{
        d:{"body":{"files":runtime_files[d]}} for d in DIRECTIONS}}},
      "fallbacks":{"idle":"walk","run":"walk","attack":"walk"}
    }
    refs = [ROOT/file for d in DIRECTIONS for file in runtime_files[d]]
    if any(not p.exists() for p in refs): raise SystemExit("runtime reference validation failed")
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    report("passed", "runtime", files=len(refs), directions={d:len(runtime_files[d]) for d in DIRECTIONS},
           canvas=list(CANVAS), footPivot=FOOT_PIVOT, manifest=MANIFEST.relative_to(ROOT).as_posix(),
           sourceFiles=[p.relative_to(ROOT).as_posix() for p in sorted(SOURCE.rglob("*.png"))],
           runtimeFiles=[p.relative_to(ROOT).as_posix() for p in refs], orphanFiles=[p.name for p in orphan],
           note="PIPELINE PASS; AI GENERATION NOT YET VERIFIED")

def main():
    parser=argparse.ArgumentParser(); sub=parser.add_subparsers(dest="command",required=True)
    sub.add_parser("fixture").add_argument("actor",choices=[ACTOR])
    sub.add_parser("stage").add_argument("actor",choices=[ACTOR])
    p=sub.add_parser("process"); p.add_argument("actor",choices=[ACTOR]); p.add_argument("--force",action="store_true")
    args=parser.parse_args()
    if args.command=="fixture": fixture(args)
    elif args.command=="stage": stage(args)
    else: process(args)

if __name__ == "__main__": main()
