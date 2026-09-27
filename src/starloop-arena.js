window.StarloopArena = (() => {
  const DROP_INTERVAL = 10;
  const DROP_FALL_SECONDS = .8;
  const SHIELD_SECONDS = 6;

  function createCycle(){
    let wave=0,drop=null;
    return {
      reset(players=[]){wave=0;drop=null;players.forEach(p=>p.starShieldUntil=0);return drop;},
      update(time,players=[]){
        const next=Math.floor(Math.max(0,time)/DROP_INTERVAL);
        if(next>wave){wave=next;drop={born:next*DROP_INTERVAL};}
        if(drop&&time-drop.born>=DROP_FALL_SECONDS){
          const eligible=players.filter(p=>!p.eliminated&&p.fall<=0&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.hypot(p.x,p.z)<(p.r||0)+.95)
            .sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z)||a.index-b.index);
          if(eligible.length){eligible[0].starShieldUntil=time+SHIELD_SECONDS;drop=null;}
        }
        return drop;
      },
      get drop(){return drop;},
      secondsToNext(time){return DROP_INTERVAL-(Math.max(0,time)%DROP_INTERVAL);},
    };
  }

  // Resolve the contact while treating active star shields as immovable in collision response.
  // The shielded player's own movement is retained and can still transfer force to an opponent.
  function protectedCollision(a,b,nx,nz,overlap,time,options={}){
    const shieldA=(a.starShieldUntil||0)>time,shieldB=(b.starShieldUntil||0)>time;
    if(!shieldA&&!shieldB)return {handled:false,shieldA:false,shieldB:false,impulse:0};

    const correction=Number.isFinite(overlap)?Math.max(0,overlap):0;
    if(shieldA&&shieldB){
      a.x-=nx*correction*.5;a.z-=nz*correction*.5;
      b.x+=nx*correction*.5;b.z+=nz*correction*.5;
    }else if(shieldA){b.x+=nx*correction;b.z+=nz*correction;}
    else{a.x-=nx*correction;a.z-=nz*correction;}

    const invA=options.invA>0?options.invA:1,invB=options.invB>0?options.invB:1;
    const rel=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;
    let impulse=0;
    if(rel<0&&shieldA!==shieldB){
      const invSum=invA+invB;
      const restitution=Number.isFinite(options.restitution)?options.restitution:.8;
      const multiplier=Number.isFinite(options.multiplier)?Math.max(0,options.multiplier):1;
      impulse=-(1+restitution)*rel/invSum*multiplier;
      if(shieldA){b.vx+=nx*impulse*invB;b.vz+=nz*impulse*invB;}
      else{a.vx-=nx*impulse*invA;a.vz-=nz*impulse*invA;}
    }
    return {handled:true,shieldA,shieldB,impulse,invA,invB};
  }

  function createVisuals({THREE,stageRoot,topY}){
    const root=new THREE.Group(),deck=new THREE.Group();root.name='starloop-arena';root.add(deck);stageRoot.add(root);
    function disc(radius,color,y){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.12,96),new THREE.MeshStandardMaterial({color,roughness:.72}));m.position.y=y;deck.add(m);return m;}
    disc(7.2,'#111317',topY-.08);
    disc(6.75,'#eeeae5',topY);
    disc(1.4,'#202126',topY+.07);
    for(const r of [1.4,2,4.5,6.35,6.75,6.98]){
      const m=new THREE.Mesh(new THREE.TorusGeometry(r,r>6.7?.045:.018,6,96),new THREE.MeshBasicMaterial({color:r>6.7?'#b72e40':'#a9a3a0'}));
      m.rotation.x=Math.PI/2;m.position.y=topY+.072;deck.add(m);
    }
    for(let i=0;i<24;i++){
      const angle=i*Math.PI/12;
      const m=new THREE.BoxGeometry(.012,.01,6),line=new THREE.Mesh(m,new THREE.MeshBasicMaterial({color:'#b6b8ae'}));
      line.position.set(Math.sin(angle)*3.2,topY+.07,Math.cos(angle)*3.2);line.rotation.y=angle;deck.add(line);
    }
    // Two curved side walls. The top and bottom quarters remain open for knockouts.
    for(const side of [0,Math.PI]){
      for(let i=0;i<24;i++){
        const angle=side+Math.PI/4+(i+.5)*Math.PI/48;
        const wall=new THREE.Mesh(new THREE.BoxGeometry(.49,.65,.16),new THREE.MeshStandardMaterial({color:i%4===0?'#a32135':'#17191f',roughness:.45,metalness:.35}));
        wall.position.set(Math.sin(angle)*7.08,topY+.325,Math.cos(angle)*7.08);wall.rotation.y=angle;deck.add(wall);
        const light=new THREE.Mesh(new THREE.BoxGeometry(.43,.035,.18),new THREE.MeshBasicMaterial({color:i%4===0?'#fff1e7':'#eb354d'}));
        light.position.copy(wall.position);light.position.y=topY+.66;light.rotation.y=angle;deck.add(light);
      }
    }
    for(let i=0;i<16;i++){
      const angle=i*Math.PI/8;
      const accent=new THREE.Mesh(new THREE.BoxGeometry(.22,.025,.55),new THREE.MeshStandardMaterial({color:i%2?'#25262b':'#b5263a',roughness:.6}));
      accent.position.set(Math.sin(angle)*6.05,topY+.075,Math.cos(angle)*6.05);accent.rotation.y=angle;deck.add(accent);
    }
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.95),new THREE.MeshStandardMaterial({color:'#ff2448',emissive:'#d90930',emissiveIntensity:.65,metalness:.35,roughness:.16}));root.add(gem);
    const marker=new THREE.Mesh(new THREE.RingGeometry(1.08,1.18,48),new THREE.MeshBasicMaterial({color:'#ff3a54',side:THREE.DoubleSide,transparent:true,opacity:.8}));marker.rotation.x=-Math.PI/2;marker.position.y=topY+.15;root.add(marker);
    const shields=new Map();
    function setMap(active,scale=1){root.visible=active;deck.scale.set(scale,1,scale);}
    function update(drop,time,players){
      gem.visible=marker.visible=Boolean(drop);
      if(drop){const falling=Math.max(0,1-(time-drop.born)/DROP_FALL_SECONDS);gem.position.set(0,topY+1.12+falling*5,0);gem.rotation.y=time*1.4;}
      for(const p of players){
        let s=shields.get(p.index);
        if(!s){
          const group=new THREE.Group(),gear=new THREE.Group();group.add(gear);
          const material=new THREE.MeshBasicMaterial({color:'#ff2949',side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false});
          const ring=new THREE.Mesh(new THREE.RingGeometry(1.13,1.2,96),material);
          ring.rotation.x=-Math.PI/2;gear.add(ring);
          const teeth=[];
          for(let i=0;i<8;i++){
            const angle=(i+.5)*Math.PI/4;
            const tooth=new THREE.Mesh(new THREE.BoxGeometry(.18,.018,.11),material);
            tooth.position.set(Math.cos(angle)*1.27,0,-Math.sin(angle)*1.27);
            tooth.rotation.y=angle;gear.add(tooth);teeth.push(tooth);
          }
          const canvas=document.createElement('canvas');canvas.width=256;canvas.height=80;
          const c=canvas.getContext('2d');c.clearRect(0,0,256,80);c.font='bold 42px sans-serif';c.textAlign='center';
          c.lineWidth=6;c.strokeStyle='#281017';c.strokeText('霸体',128,54);c.fillStyle='#ff5369';c.fillText('霸体',128,54);
          const texture=new THREE.CanvasTexture(canvas);
          const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,depthWrite:false,transparent:true}));label.scale.set(1.8,.5625,1);group.add(label);
          root.add(group);s={group,gear,ring,teeth,material,label};shields.set(p.index,s);
        }
        const left=Math.max(0,(p.starShieldUntil||0)-time);
        s.group.visible=left>0&&!p.eliminated&&p.fall<=0;
        s.group.position.set(p.x,topY+.18,p.z);
        const progress=Math.min(1,left/SHIELD_SECONDS),age=SHIELD_SECONDS-left;
        s.gear.scale.set(p.r/.93,1,p.r/.93);s.gear.rotation.y=time*.5;
        s.ring.geometry.setDrawRange(0,Math.ceil(96*progress)*6);
        s.teeth.forEach((tooth,i)=>tooth.visible=progress>(i+.5)/8);
        s.material.opacity=left<1?.55+.35*(.5+.5*Math.sin(time*Math.PI*6)):.9;
        s.label.visible=left>0&&age<.8;
        s.label.material.opacity=Math.max(0,1-age/.8);
        s.label.position.set(0,p.r+1,-p.r-.45-age*.3);
      }
    }
    return {setMap,update};
  }

  return {DROP_INTERVAL,DROP_FALL_SECONDS,SHIELD_SECONDS,createCycle,protectedCollision,createVisuals};
})();
