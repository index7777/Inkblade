import { resolveDirection } from './direction.js';

export class AnimationController{
  constructor(manifest,seed=0){
    this.manifest=manifest; this.action='walk'; this.direction='S'; this.lastDirection='S';
    this.elapsed=Math.max(0,Number(seed)||0); this.frameIndex=0;
  }
  setMotion(x,y){
    this.direction=resolveDirection(x,y,this.lastDirection);
    this.lastDirection=this.direction;
  }
  play(action,{restart=false}={}){
    if(!this.manifest.animations[action]) action=this.manifest.fallbacks?.[action]||'walk';
    if(action!==this.action||restart){ this.action=action; this.elapsed=0; this.frameIndex=0; }
  }
  update(deltaFrames=1){
    const clip=this.manifest.animations[this.action]||this.manifest.animations.walk;
    const count=Math.max(1,clip?.frameCount||1), fps=Math.max(.01,clip?.fps||6);
    this.elapsed+=Math.max(0,deltaFrames)/60;
    let index=Math.floor(this.elapsed*fps);
    if(clip?.loop!==false) index%=count; else index=Math.min(count-1,index);
    this.frameIndex=index;
    return index;
  }
}
