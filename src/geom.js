// 幾何 / 數學純函式(無全域相依)。架構遷移 Stage 2b 首個抽出模組。
'use strict';

// 折線外擴 d 距離(沿法線)
export function offsetPath(path,d){
  const out=[];
  for(let i=0;i<path.length;i++){
    const a=path[Math.max(0,i-1)], b=path[Math.min(path.length-1,i+1)];
    let nx=-(b.y-a.y), ny=(b.x-a.x); const L=Math.hypot(nx,ny)||1; nx/=L; ny/=L;
    out.push({x:path[i].x+nx*d, y:path[i].y+ny*d});
  }
  return out;
}

// 扇形陣:整條墨痕繞起點旋轉 ang
export function rotatePath(path,ang){
  const o=path[0], c=Math.cos(ang), s=Math.sin(ang), out=[];
  for(const pt of path){ const dx=pt.x-o.x, dy=pt.y-o.y;
    out.push({x:o.x+dx*c-dy*s, y:o.y+dx*s+dy*c}); }
  return out;
}

// 依可負擔長度截短筆跡
export function truncatePath(pts, maxLen){
  if(maxLen<=0 || pts.length<2) return null;
  const out=[pts[0]]; let acc=0;
  for(let i=1;i<pts.length;i++){
    const dx=pts[i].x-pts[i-1].x, dy=pts[i].y-pts[i-1].y, d=Math.hypot(dx,dy);
    if(acc+d<=maxLen){ out.push(pts[i]); acc+=d; }
    else{
      const t=(maxLen-acc)/(d||1);
      if(t>0.03) out.push({x:pts[i-1].x+dx*t, y:pts[i-1].y+dy*t});
      break;
    }
  }
  return out.length>=2 ? out : null;
}

// 線段 (ax,ay)-(bx,by) 到點 (px,py) 的最短距離
export function segCircleDist(ax, ay, bx, by, px, py){
  if(ax==null) return Math.hypot(px-bx, py-by);
  const dx=bx-ax, dy=by-ay, L2=dx*dx+dy*dy;
  if(L2<1e-6) return Math.hypot(px-bx, py-by);
  let t=((px-ax)*dx + (py-ay)*dy) / L2;
  t=t<0?0:(t>1?1:t);
  return Math.hypot(px-(ax+dx*t), py-(ay+dy*t));
}

// 雜湊(0..1),鎮痕視覺用
export function supHash(n){ const x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); }
