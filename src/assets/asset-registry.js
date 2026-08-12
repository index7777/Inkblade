import { AssetLoader } from './asset-loader.js';
import { DIRECTIONS, resolveAvailableDirection } from '../animation/direction.js';

export class AssetRegistry{
  constructor(loader=new AssetLoader()){ this.loader=loader; this.actors=new Map(); }
  async loadActorManifest(url){
    const response=await fetch(url,{cache:'no-cache'});
    if(!response.ok) throw new Error('Unable to load actor manifest '+url+' ('+response.status+')');
    return this.registerActor(await response.json());
  }
  registerActor(manifest){
    const errors=validateActorManifest(manifest);
    if(errors.length) throw new Error('Invalid actor manifest: '+errors.join('; '));
    const runtime={manifest,clips:{},ready:false};
    for(const [action,clip] of Object.entries(manifest.animations)){
      runtime.clips[action]={};
      for(const [direction,layers] of Object.entries(clip.directions||{})){
        runtime.clips[action][direction]={};
        for(const [layer,desc] of Object.entries(layers)){
          runtime.clips[action][direction][layer]=desc.files.map(file=>this.loader.loadImage(file));
        }
      }
    }
    runtime.ready=true; this.actors.set(manifest.actorId,runtime); return runtime;
  }
  getActor(id){ return this.actors.get(id)||null; }
  resolveFrameDirection(id,direction){
    const actor=this.getActor(id); if(!actor) return null;
    return resolveAvailableDirection(direction,actor.manifest.authoredDirections,{allowFlipX:actor.manifest.mirrorX!==false});
  }
  getFrame(id,action,direction,layer,index){
    const actor=this.getActor(id); if(!actor) return null;
    const mapped=this.resolveFrameDirection(id,direction);
    if(!mapped) return null;
    const clip=actor.clips[action]||actor.clips[actor.manifest.fallbacks?.[action]]||actor.clips.walk;
    const records=clip?.[mapped.direction]?.[layer]; if(!records?.length) return null;
    const rec=records[index%records.length];
    return rec?.ready?{image:rec.image,flipX:mapped.flipX}:null;
  }
}

export function validateActorManifest(m){
  const e=[];
  if(!m||m.schemaVersion!==1)e.push('schemaVersion must be 1');
  if(!m?.actorId)e.push('actorId is required');
  const authored=m?.authoredDirections||[];
  if(!authored.length)e.push('authoredDirections requires at least one direction');
  for(const d of authored) if(!DIRECTIONS.includes(d)) e.push('invalid authored direction '+d);
  if(!m?.canvas?.width||!m?.canvas?.height||!m?.canvas?.footPivot)e.push('canvas and footPivot are required');
  if(!m?.animations?.walk)e.push('walk animation is required');
  for(const [action,clip] of Object.entries(m?.animations||{})){
    for(const direction of Object.keys(clip.directions||{})){
      if(!authored.includes(direction)) e.push(action+' contains undeclared direction '+direction);
    }
    for(const direction of authored){
      if(!clip.directions?.[direction]) e.push(action+' missing authored direction '+direction);
    }
  }
  return e;
}
