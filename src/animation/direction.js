export const DIRECTIONS = Object.freeze(['N','NE','E','SE','S','SW','W','NW']);

const MIRRORS = Object.freeze({
  NW:{source:'NE',flipX:true},
  W:{source:'E',flipX:true},
  SW:{source:'SE',flipX:true}
});

export function resolveDirection(x,y,last='S',deadZone=.045){
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<deadZone) return DIRECTIONS.includes(last)?last:'S';
  // Canvas +Y points down. Rotate so sector zero is north, then advance clockwise.
  const angle=Math.atan2(x,-y);
  const index=(Math.round(angle/(Math.PI/4))+8)%8;
  return DIRECTIONS[index];
}

export function resolveAuthoredDirection(direction,aliases=MIRRORS){
  const dir=DIRECTIONS.includes(direction)?direction:'S';
  const alias=aliases&&aliases[dir];
  return alias?{direction:alias.source,flipX:!!alias.flipX}:{direction:dir,flipX:false};
}

const VECTOR=Object.freeze({
  N:[0,-1],NE:[1,-1],E:[1,0],SE:[1,1],S:[0,1],SW:[-1,1],W:[-1,0],NW:[-1,-1]
});
const HORIZONTAL_MIRROR=Object.freeze({N:'N',NE:'NW',E:'W',SE:'SW',S:'S',SW:'SE',W:'E',NW:'NE'});

export function resolveAvailableDirection(direction,authoredDirections,options={}){
  const wanted=DIRECTIONS.includes(direction)?direction:'S';
  const authored=[...new Set((authoredDirections||[]).filter(d=>DIRECTIONS.includes(d)))];
  if(!authored.length) return null;
  const allowFlip=options.allowFlipX!==false, candidates=[];
  for(const source of authored){
    candidates.push({direction:source,source,flipX:false});
    const mirrored=HORIZONTAL_MIRROR[source];
    if(allowFlip&&mirrored!==source) candidates.push({direction:mirrored,source,flipX:true});
  }
  const [wx,wy]=VECTOR[wanted];
  candidates.sort((a,b)=>{
    const [ax,ay]=VECTOR[a.direction], [bx,by]=VECTOR[b.direction];
    const da=(wx*ax+wy*ay)/(Math.hypot(wx,wy)*Math.hypot(ax,ay));
    const db=(wx*bx+wy*by)/(Math.hypot(wx,wy)*Math.hypot(bx,by));
    // A diagonal is exactly equidistant from its vertical and horizontal
    // neighbours. Prefer the vertical view in the same hemisphere so sparse
    // N/E/S sets resolve NE/NW to N and SE/SW to S deterministically.
    const verticalAffinity=([x,y])=>wx!==0&&wy!==0&&x===0&&Math.sign(y)===Math.sign(wy)?1:0;
    return db-da || verticalAffinity([bx,by])-verticalAffinity([ax,ay]) ||
      Number(a.flipX)-Number(b.flipX) || DIRECTIONS.indexOf(a.direction)-DIRECTIONS.indexOf(b.direction);
  });
  const best=candidates[0];
  return {direction:best.source,flipX:best.flipX,resolvedDirection:best.direction};
}

export const DEFAULT_DIRECTION_ALIASES=MIRRORS;
