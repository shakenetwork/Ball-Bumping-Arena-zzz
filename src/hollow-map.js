/* Hollow-specific layout and clock. Coordinates are also used by the art module. */
window.HollowMap=(()=>{
  const layout=Object.freeze({halfX:9,halfZ:5.5,etherRadius:3,dps:8,
    cars:[{x:-3,z:-2,hx:1.65,hz:.6},{x:3,z:2,hx:1.65,hz:.6}]});
  // Half an orb's diameter: overlaps are allowed, but centers never stack together.
  const minimumEtherCenterGap=layout.etherRadius;
  function countAt(t){return Math.min(4,Math.max(1,Math.floor(t/10)-1));}
  function clearOfCars(x,z,r){return layout.cars.every(c=>Math.hypot(Math.max(0,Math.abs(x-c.x)-c.hx),Math.max(0,Math.abs(z-c.z)-c.hz))>r+.15);}
  function generate(count,rng=Math.random,occupied=[]){
    const points=[];
    const candidates=[];
    for(let i=0;i<1200;i++)candidates.push({x:(rng()*2-1)*(layout.halfX-layout.etherRadius),z:(rng()*2-1)*(layout.halfZ-layout.etherRadius),r:layout.etherRadius});
    for(const p of candidates)if(clearOfCars(p.x,p.z,p.r)&&occupied.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>=minimumEtherCenterGap))points.push(p);
    const spread=[];
    while(points.length&&spread.length<count){
      const available=points.filter(p=>spread.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>=minimumEtherCenterGap));
      if(!available.length)break;
      const chosen=available[Math.floor(rng()*available.length)];
      spread.push(chosen);
      for(let i=points.length-1;i>=0;i--){
        const p=points[i];
        if(p===chosen||Math.hypot(p.x-chosen.x,p.z-chosen.z)<minimumEtherCenterGap)points.splice(i,1);
      }
    }
    return spread;
  }
  function create(rng=Math.random){
    let spawnedThrough=-1,waves=[];
    function reset(){spawnedThrough=-1;waves=[];return update(0);}
    function update(t){
      const through=Math.floor(t/10);
      while(spawnedThrough<through){
        spawnedThrough++;
        const start=spawnedThrough*10;
        waves=waves.filter(w=>start-w.start<25);
        const occupied=waves.flatMap(w=>w.positions);
        waves.push({start,positions:generate(countAt(start),rng,occupied)});
      }
      waves=waves.filter(w=>t-w.start<25);
      const fields=waves.flatMap(w=>{const age=Math.max(0,t-w.start),growth=Math.min(1,age/15);return w.positions.map(p=>({...p,growth,r:p.r*growth,age,warning:age<15}));});
      return {active:fields,warning:[],count:fields.length,seconds:10-(t-through*10)};
    }
    return {reset,update};
  }
  function touching(p,zones){return zones.some(q=>q.r>0&&Math.hypot(p.x-q.x,p.z-q.z)<q.r+p.r*.5);}
  function resolve(p){
    for(let iteration=0;iteration<3;iteration++){
      for(const c of layout.cars){
        const qx=Math.max(c.x-c.hx,Math.min(c.x+c.hx,p.x)),qz=Math.max(c.z-c.hz,Math.min(c.z+c.hz,p.z));
        let dx=p.x-qx,dz=p.z-qz,d=Math.hypot(dx,dz),nx,nz,depth;
        if(d>=p.r)continue;
        if(d>1e-8){nx=dx/d;nz=dz/d;depth=p.r-d;}
        else{const ex=c.hx-Math.abs(p.x-c.x),ez=c.hz-Math.abs(p.z-c.z);if(ex<ez){nx=Math.sign(p.x-c.x)||1;nz=0;depth=p.r+ex;}else{nx=0;nz=Math.sign(p.z-c.z)||1;depth=p.r+ez;}}
        p.x+=nx*(depth+.001);p.z+=nz*(depth+.001);const v=p.vx*nx+p.vz*nz;if(v<0){p.vx-=v*1.55*nx;p.vz-=v*1.55*nz;}
      }
      const limit=layout.halfZ-p.r;
      // Rails end at the open ends; they cannot rescue a ball already beyond the platform.
      if(Math.abs(p.x)<layout.halfX+p.r&&Math.abs(p.z)>limit){const side=Math.sign(p.z);p.z=side*limit;if(p.vz*side>0)p.vz*=-.6;}
    }
  }
  function move(p,dt){const steps=Math.max(1,Math.ceil(Math.hypot(p.vx,p.vz)*dt/.12));for(let i=0;i<steps;i++){p.x+=p.vx*dt/steps;p.z+=p.vz*dt/steps;resolve(p);}}
  return {layout,countAt,generate,create,touching,resolve,move};
})();
