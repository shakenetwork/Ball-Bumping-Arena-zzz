/* Shared lamp positions and swept collisions; the visible lamp radius is the collider radius. */
window.MapLayout = (() => {
  function lamps(halfExtent,scale=1){
    const list=[],edge=halfExtent-.3*scale,radius=.36*scale;
    for(const t of [-.66,0,.66]){
      list.push({x:t*halfExtent,z:-edge,r:radius},{x:t*halfExtent,z:edge,r:radius},
        {x:-edge,z:t*halfExtent,r:radius},{x:edge,z:t*halfExtent,r:radius});
    }
    return list;
  }
  function move(p,dt,posts){
    let remaining=dt;
    for(let attempt=0;attempt<6&&remaining>1e-7;attempt++){
      let hit=null,time=remaining;
      for(const post of posts){
        let dx=p.x-post.x,dz=p.z-post.z,r=p.r+post.r,d=Math.hypot(dx,dz);
        if(d<r){
          const nx=d>1e-8?dx/d:1,nz=d>1e-8?dz/d:0;
          p.x=post.x+nx*(r+.001);p.z=post.z+nz*(r+.001);
          const speed=p.vx*nx+p.vz*nz;if(speed<0){p.vx-=1.65*speed*nx;p.vz-=1.65*speed*nz;}
          dx=p.x-post.x;dz=p.z-post.z;
        }
        const a=p.vx*p.vx+p.vz*p.vz,b=2*(dx*p.vx+dz*p.vz),c=dx*dx+dz*dz-r*r;
        const disc=b*b-4*a*c;if(a<1e-10||b>=0||disc<0)continue;
        const t=(-b-Math.sqrt(disc))/(2*a);
        if(t>=0&&t<=time){time=t;hit=post;}
      }
      p.x+=p.vx*time;p.z+=p.vz*time;remaining-=time;
      if(!hit)return;
      const dx=p.x-hit.x,dz=p.z-hit.z,d=Math.hypot(dx,dz),nx=dx/d,nz=dz/d;
      const incoming=p.vx*nx+p.vz*nz;
      if(incoming<0){p.vx-=1.65*incoming*nx;p.vz-=1.65*incoming*nz;}
      p.x+=nx*.001;p.z+=nz*.001;
    }
  }
  function boundary(x,z,halfExtent,radius){
    const useX=Math.abs(x)>=Math.abs(z);
    return {distance:Math.max(Math.abs(x),Math.abs(z)),edge:halfExtent-radius*.82,nx:useX?(Math.sign(x)||1):0,nz:useX?0:(Math.sign(z)||1)};
  }
  return {lamps,move,boundary};
})();
