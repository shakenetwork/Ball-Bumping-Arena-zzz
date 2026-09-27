/* Map art only. Collision bounds, map timing and physics belong to the game. */
window.MapVisuals = (() => {
  const PALETTES = Object.freeze({
    hollowMetro: {
      background:'#101e2b',fog:'#101e2b',ground:'#132c32',podium:'#223640',sideBand:'#45635f',
      deck:'#293f4d',inset:'#293f4d',ring:'#5b8078',wallBody:'#314b53',wallCap:'#577d78',
      line:'#496963',medallion:'#293f4d',trigram:'#496963',safeZone:'#9344e8',safeBorder:'#cf91ff',safeGlow:'#9344e8'
    },
    suibianTemple: {
      background:'#a9b7ae', fog:'#a9b7ae', ground:'#85968e',
      podium:'#60666a', sideBand:'#8f805e', deck:'#a5a8a9', inset:'#898f94',
      ring:'#4c5358', wallBody:'#73797c', wallCap:'#b0a080',
      line:'#929085', medallion:'#686e75', trigram:'#aca08b',
      safeZone:'#88d5b4', safeBorder:'#b9ebcf', safeGlow:'#8eddbb'
    },
    livehouse404: {
      background:'#111c31', fog:'#111c31', ground:'#182a3f',
      podium:'#25314d', sideBand:'#586887', deck:'#273957', inset:'#344666',
      ring:'#66849c', wallBody:'#273957', wallCap:'#66849c',
      line:'#6e91ad', medallion:'#2c3c59', trigram:'#5c7695',
      safeZone:'#67b6bf', safeBorder:'#9de1dc', safeGlow:'#71d0d0'
    },
    starloopArena: {
      background:'#08090b', fog:'#08090b', ground:'#101114',
      podium:'#111317', sideBand:'#27282a', deck:'#e0e2df', inset:'#dedfdd',
      ring:'#aa9874', wallBody:'#111317', wallCap:'#b6a27b',
      line:'#b6b8ae', medallion:'#d5d7d3', trigram:'#aa9874',
      safeZone:'#aa9874', safeBorder:'#c5a96f', safeGlow:'#aa9874'
    }
  });
  const BEATS = Object.freeze({
    speed:'#ffb83f', ice:'#42e5ff', bounce:'#f46acb', gravity:'#9a86ff'
  });
  function create({THREE,scene,stageRoot,arenaRadius,topY,existing={}}) {
    const {podium,sideBand,deck,inset,ringMat,wallBodyMat,wallCapMat,
      lineMat,insetOutline,medallionBase,medallionRim,trigramMaterial,trigramRoot,
      safeZoneMaterial,safeZoneBorder,safeGlow,ground,taiji} = existing;
    const art = new THREE.Group();
    art.name='livehouse404-art';
    stageRoot.add(art);
    const disposable=[];
    const make=(geometry,material)=>{
      const mesh=new THREE.Mesh(geometry,material);art.add(mesh);disposable.push(geometry,material);return mesh;
    };
    const tiles=[];
    for(let row=0;row<4;row++)for(let col=0;col<4;col++){
      const step=arenaRadius/2,gap=.06;
      const tile=make(new THREE.BoxGeometry(step-gap*2,.06,step-gap*2),new THREE.MeshStandardMaterial({color:'#24445b',emissive:'#24445b',emissiveIntensity:.23,roughness:.48,metalness:.2}));
      tile.position.set(-arenaRadius+(col+.5)*step,topY-.018,-arenaRadius+(row+.5)*step);tile.receiveShadow=true;tiles.push(tile);
    }
    const base=make(new THREE.BoxGeometry(arenaRadius*2,.76,arenaRadius*2),new THREE.MeshStandardMaterial({color:'#202b40',roughness:.7}));base.position.y=topY-.38;base.receiveShadow=true;
    const ledMaterial=new THREE.MeshBasicMaterial({color:'#42e5ff',transparent:true,opacity:.9});
    const ledRing={material:ledMaterial};
    for(let side=0;side<4;side++){
      const horizontal=side<2,sign=side%2?1:-1;
      const strip=make(new THREE.BoxGeometry(horizontal?arenaRadius*2:.065,.04,horizontal?.065:arenaRadius*2),ledMaterial);
      strip.position.set(horizontal?0:sign*arenaRadius,topY+.02,horizontal?sign*arenaRadius:0);
    }
    const beams=[];
    window.MapLayout.lamps(arenaRadius).forEach(({x,z,r},i)=>{
      const angle=i/12*Math.PI*2;
      const lamp=make(new THREE.CylinderGeometry(r,r,.95,16),new THREE.MeshStandardMaterial({color:'#162638',emissive:'#42e5ff',emissiveIntensity:.55}));lamp.position.set(x,topY+.475,z);lamp.castShadow=true;
      const cap=make(new THREE.CylinderGeometry(r+.01,r+.01,.08,16),new THREE.MeshBasicMaterial({color:'#b8ecff'}));cap.position.set(x,topY+.95,z);
      const beam=make(new THREE.ConeGeometry(.65,2.8,10,1,true),new THREE.MeshBasicMaterial({color:'#42e5ff',transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
      beam.rotation.z=Math.PI;beam.position.set(x,topY+2.35,z);beams.push({beam,lamp,angle});
    });    const templeArt=new THREE.Group();stageRoot.add(templeArt);
    for(let i=0;i<16;i++){
      const angle=i*Math.PI/8;
      const block=new THREE.Mesh(new THREE.BoxGeometry(.42,.10,.88),new THREE.MeshStandardMaterial({color:i%2?'#ac9b79':'#96876c',roughness:.75,metalness:.18}));
      block.position.set(Math.sin(angle)*(arenaRadius+.18),topY-.03,Math.cos(angle)*(arenaRadius+.18));block.rotation.y=angle;
      templeArt.add(block);disposable.push(block.geometry,block.material);
    }
    // A dim stage-floor graphic: it is not a rail or collision edge.
    const inner=make(new THREE.RingGeometry(arenaRadius*.27,arenaRadius*.30,64),
      new THREE.MeshBasicMaterial({color:'#58a9bf',transparent:true,opacity:.18,depthWrite:false}));
    inner.rotation.x=-Math.PI/2;inner.position.y=topY+.029;inner.visible=false;
    const stageStripes=[];
    for(let i=-2;i<=2;i++){
      const stripe=make(new THREE.PlaneGeometry(arenaRadius*1.45,.035),
        new THREE.MeshBasicMaterial({color:'#5e8ba8',transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide}));
      stripe.rotation.x=-Math.PI/2;stripe.position.set(0,topY+.028,i*arenaRadius*.26);stripe.visible=false;stageStripes.push(stripe);
    }
    // Stage name sits outside the play surface, in the surrounding background.
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,96);
    ctx.fillStyle='#c0d8e7';ctx.font='bold 55px sans-serif';ctx.textAlign='center';
    ctx.fillText('404 ERROR',256,66);
    const labelTexture=new THREE.CanvasTexture(canvas);
    const label=make(new THREE.PlaneGeometry(arenaRadius*1.6,arenaRadius*.30),
      new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide}));
    label.rotation.x=-Math.PI/2;label.position.set(0,topY-.07,-arenaRadius*1.20);
    // Fixed, subdued side washes. Beat states only tint these small accents.
    const lamps=[];
    for(const x of [-1,1]){
      const lamp=make(new THREE.CircleGeometry(.15,20),
        new THREE.MeshBasicMaterial({color:'#4a9bac',transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide}));
      lamp.rotation.x=-Math.PI/2;lamp.position.set(x*arenaRadius*.9,topY+.03,-arenaRadius*.7);
      lamps.push(lamp);
    }
    const originalTaiji=taiji?.material?.map;
    let templeTaiji=null;
    if(taiji){
      const motif=document.createElement('canvas');motif.width=256;motif.height=256;
      const c=motif.getContext('2d'),r=116,x=128,y=128;
      c.fillStyle='#666d75';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
      c.fillStyle='#c3c6ca';c.beginPath();c.moveTo(x,y-r);
      c.bezierCurveTo(x+r,y-r,x+r,y,x,y);c.bezierCurveTo(x-r,y,x-r,y+r,x,y+r);
      c.arc(x,y,r,Math.PI/2,Math.PI*1.5,false);c.closePath();c.fill();
      c.fillStyle='#666d75';c.beginPath();c.arc(x,y-r/2,r/8,0,Math.PI*2);c.fill();
      c.fillStyle='#c3c6ca';c.beginPath();c.arc(x,y+r/2,r/8,0,Math.PI*2);c.fill();
      templeTaiji=new THREE.CanvasTexture(motif);
    }
    let mapId='suibianTemple',beatId=null,clock=0,switchGlow=0;
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
    function color(material,value){if(material?.color)material.color.set(value);}
    function setMap(id,scale=1){
      mapId=PALETTES[id]?id:'suibianTemple';const p=PALETTES[mapId];
      scene.background.set(p.background);if(scene.fog)scene.fog.color.set(p.fog);
      color(ground?.material,p.ground);color(podium?.material,p.podium);
      color(sideBand?.material,p.sideBand);color(deck?.material,p.deck);
      color(inset?.material,p.inset);color(ringMat,p.ring);
      color(wallBodyMat,p.wallBody);color(wallCapMat,p.wallCap);
      color(lineMat,p.line);color(insetOutline?.material,p.line);
      color(medallionBase?.material,p.medallion);color(medallionRim?.material,p.ring);
      color(trigramMaterial,p.trigram);
      if(safeZoneMaterial?.uniforms?.color)safeZoneMaterial.uniforms.color.value.set(p.safeZone);
      color(safeZoneBorder?.material,p.safeBorder);if(safeGlow)safeGlow.color.set(p.safeGlow);
      const isTemple=mapId==='suibianTemple';
      if(medallionBase)medallionBase.visible=isTemple;
      if(medallionRim)medallionRim.visible=isTemple;
      if(trigramRoot)trigramRoot.visible=isTemple;
      if(taiji){taiji.visible=isTemple;taiji.material.map=isTemple?templeTaiji:originalTaiji;taiji.material.needsUpdate=true;}
      art.visible=mapId==='livehouse404';art.scale.set(mapId==='livehouse404'?scale:1,1,mapId==='livehouse404'?scale:1);
      templeArt.visible=isTemple;beatId=null;
      templeArt.scale.set(isTemple?scale:1,1,isTemple?scale:1);
    }
    function setBeat(state,progress=0){
      if(mapId!=='livehouse404')return;
      const beatColor=BEATS[state]||'#4a9bac';
      if(beatId!==state){beatId=state;switchGlow=1;}
      const tint=new THREE.Color(beatColor);
      tiles.forEach((tile,i)=>{tile.material.color.set('#16283e').lerp(tint,.24+(i%3)*.11);tile.material.emissive.copy(tint);});
      ledRing.material.color.copy(tint);
      for(const item of beams){item.beam.material.color.copy(tint);item.lamp.material.emissive.copy(tint);}
      for(const lamp of lamps){lamp.material.color.set(beatColor);lamp.material.opacity=.35+Math.min(1,Math.max(0,progress))*.16;}
    }
    function update(dt=0){
      if(mapId!=='livehouse404')return;
      clock+=dt;switchGlow=Math.max(0,switchGlow-dt*1.8);
      const pulse=reducedMotion?.5:.5+.5*Math.sin(clock*Math.PI*2*.8);
      ledRing.material.opacity=.62+.3*pulse;
      tiles.forEach((tile,i)=>{tile.material.emissiveIntensity=.12+(i%3)*.035+switchGlow*.17;});
      beams.forEach(({beam,lamp,angle},i)=>{
        const wave=reducedMotion?.5:.5+.5*Math.sin(clock*Math.PI*2*.8+i*.8);
        beam.material.opacity=.07+wave*.13+switchGlow*.08;lamp.material.emissiveIntensity=.5+wave*1.8;
        beam.rotation.x=reducedMotion?0:Math.sin(clock*.65+angle)*.18;
      });
    }
    function dispose(){art.removeFromParent();templeArt.removeFromParent();for(const resource of disposable)resource.dispose();labelTexture.dispose();if(taiji){taiji.material.map=originalTaiji;taiji.material.needsUpdate=true;}templeTaiji?.dispose();}
    setMap(mapId);
    return {setMap,setBeat,update,dispose};
  }
  return {create,PALETTES};
})();
