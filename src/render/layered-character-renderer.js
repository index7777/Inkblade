const LAYERS=['weaponBack','body','weaponFront'];
const controllers=new WeakMap();

export function controllerFor(entity,manifest,Controller){
  let controller=controllers.get(entity);
  if(!controller){ controller=new Controller(manifest,entity.anim||0); controllers.set(entity,controller); }
  return controller;
}

export function drawLayeredCharacter(ctx,registry,actorId,controller,entity,deltaFrames=1){
  const actor=registry.getActor(actorId); if(!actor||!controller) return false;
  const clip=actor.manifest.animations[controller.action]||actor.manifest.animations.walk;
  const index=controller.update(deltaFrames);
  const canvas=actor.manifest.canvas, height=entity.visualHeight||entity.r*2.1;
  const width=height*(canvas.width/canvas.height), pivot=canvas.footPivot;
  let drew=false, resolved=null;
  ctx.save(); ctx.translate(entity.x,entity.y);
  for(const layer of LAYERS){
    const frame=registry.getFrame(actorId,controller.action,controller.direction,layer,index);
    if(!frame) continue;
    resolved=resolved||registry.resolveFrameDirection(actorId,controller.direction);
    ctx.save(); if(frame.flipX) ctx.scale(-1,1);
    ctx.globalAlpha=(entity.hit>0?.9:1)*(entity.alpha==null?1:entity.alpha);
    ctx.drawImage(frame.image,-width*pivot.x,-height*pivot.y,width,height);
    ctx.restore(); drew=true;
  }
  ctx.restore(); ctx.globalAlpha=1;
  return drew?{actorId,source:actor.manifest.assetSource||'legacy',renderer:'manifest',logicalDirection:controller.direction,resolvedAssetDirection:resolved?.direction||null,flipX:!!resolved?.flipX,action:controller.action,frameIndex:index}:false;
}
