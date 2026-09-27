window.HollowVisuals={create({THREE,stageRoot,topY}){
  const root=new THREE.Group();root.name='hollow-metro';stageRoot.add(root);
  const {halfX,halfZ,cars}=window.HollowMap.layout;
  function box(w,h,d,x,y,z,color,emissive){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.75,metalness:.25,emissive:emissive||'#000000',emissiveIntensity:.5}));m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;root.add(m);return m;
  }
  box(halfX*2,.76,halfZ*2,0,topY-.38,0,'#1c3040');
  for(let x=-8.25;x<9;x+=1.5)for(let row=0;row<7;row++){const z=-halfZ+(row+.5)*11/7;box(1.46,.025,11/7-.04,x,topY+.008,z,(Math.round(x*2)+row)%3?'#293f4d':'#344c56');}
  // Interrupted rails, sleepers and service lighting evoke a ruined transit platform.
  for(const z of [-.48,.48])box(18,.04,.055,0,topY+.033,z,'#72868a');
  for(let x=-8.5;x<9;x+=.65)box(.08,.022,1.3,x,topY+.02,0,'#14272e');
  for(const side of [-1,1]){
    box(18,.16,.16,0,topY+1.02,side*halfZ,'#577d78');
    box(18,.07,.07,0,topY+.53,side*halfZ,'#315852');
    for(let x=-8.8;x<=8.81;x+=1.6)box(.14,1.05,.14,x,topY+.525,side*halfZ,'#314b53');
    box(18,.025,.055,0,topY+.05,side*(halfZ-.25),'#5ba394','#376f63');
  }
  for(const x of [-halfX,halfX])for(let z=-5.2;z<5.3;z+=.65)box(.15,.03,.34,x,topY+.03,z,'#a79b65');
  cars.forEach(c=>{
    box(c.hx*2,1.12,c.hz*2,c.x,topY+.56,c.z,'#344b58');
    box(c.hx*2-.12,.1,c.hz*2-.1,c.x,topY+1.14,c.z,'#58747b');
    for(const side of [-1,1]){
      box(c.hx*2-.08,.12,.03,c.x,topY+.35,c.z+side*(c.hz+.016),'#668e75');
      for(let i=-1;i<=1;i++)box(.63,.34,.025,c.x+i*.88,topY+.81,c.z+side*(c.hz+.018),'#0b2029','#1f5148');
    }
    for(const x of [-.8,.8])box(.5,.035,.64,c.x+x,topY+1.205,c.z,'#253d47');
  });
  const fields=[],etherRadius=window.HollowMap.layout.etherRadius;
  for(let i=0;i<12;i++){
    const g=new THREE.Group();root.add(g);
    const orb=new THREE.Mesh(new THREE.SphereGeometry(etherRadius,40,24),new THREE.MeshPhysicalMaterial({color:'#ad72f4',transparent:true,opacity:.7,depthWrite:false,roughness:.12,metalness:0,clearcoat:1,clearcoatRoughness:.08,emissive:'#54228c',emissiveIntensity:.22}));orb.position.y=topY+etherRadius;g.add(orb);
    // A small soft-white glint remains legible from the overhead game camera.
    const glint=new THREE.Mesh(new THREE.SphereGeometry(.15,16,10),new THREE.MeshBasicMaterial({color:'#f7eaff',transparent:true,opacity:.65,depthWrite:false}));
    glint.position.set(-etherRadius*.3,etherRadius*.943,-etherRadius*.15);glint.scale.set(1.8,.18,.8);orb.add(glint);
    g.visible=false;fields.push({g,orb,glint});
  }
  return {setVisible(v){root.visible=v;},update(state,time){
    const zones=[...state.active.map(z=>({...z,warning:false})),...state.warning.map(z=>({...z,warning:true}))];
    fields.forEach(({g,orb,glint},i)=>{const q=zones[i];g.visible=!!q;if(!q)return;const growth=q.growth??1;g.position.set(q.x,0,q.z);orb.scale.setScalar(growth);orb.position.y=topY+etherRadius*growth+Math.sin(time*2+i)*.05*growth;orb.material.opacity=.7;glint.material.opacity=.65;});
  }};
}};
