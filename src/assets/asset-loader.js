export class AssetLoader{
  constructor(){ this.images=new Map(); }
  loadImage(url){
    if(this.images.has(url)) return this.images.get(url);
    const record={url,image:null,ready:false,error:null,promise:null};
    record.promise=new Promise(resolve=>{
      const image=new Image(); record.image=image;
      image.onload=()=>{ record.ready=true; resolve(record); };
      image.onerror=()=>{ record.error=new Error('Unable to load '+url); resolve(record); };
      image.src=url;
    });
    this.images.set(url,record); return record;
  }
}
