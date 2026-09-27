/* Shared-device selection: identity, palette allocation and lobby UI. */
window.CharacterSelect = (() => {
  const ids = ['ailian', 'anby', 'xixifu'];
  const spare = ['#53a9ff', '#b18bff', '#45d8d0'];
  function allocate(selected, configs) {
    const seen = new Set(); let clone = 0;
    return selected.map((id, index) => {
      const character = configs[id]; const isClone = seen.has(id); seen.add(id);
      const hex = isClone ? spare[clone++] : character.baseColor;
      return { characterId:id, name:character.displayName, hex, css:hex, isClone,
        key:['F','J','A','L'][index], skillConfig:character.skillConfig };
    });
  }
  function create({configs, onPreview, onStart}) {
    const root = document.getElementById('characterSelect');
    const seats = root.querySelector('.selection-seats');
    const choices = root.querySelector('.character-choices');
    const confirm = root.querySelector('.selection-confirm');
    const heading = root.querySelector('.selection-turn');
    const detail = root.querySelector('.selection-detail');
    const colorBall = root.querySelector('.selection-color-ball');
    const colorLabel = root.querySelector('.selection-color-label');
    const colorValue = root.querySelector('.selection-color-value');
    let count=1, active=0, selected=[...ids,'ailian'], ready=[false,false,false,false];
    function roster() { return allocate(selected, configs); }
    function render() {
      const data=roster(); const current=data[active];
      seats.innerHTML=data.map((p,i)=>`<button type="button" data-seat="${i}" style="--seat-color:${p.hex}" class="selection-seat ${i===active?'active':''}" ${i>=count?'disabled':''}><b>${i<count?'P'+(i+1):'电脑'}</b><span>${p.name}</span><small>${i>=count?'自动补位':ready[i]?'已确认 ✓':i===active?'选择中':'待选择'}</small></button>`).join('');
      choices.innerHTML=ids.map(id=>`<button type="button" data-character="${id}" aria-pressed="${selected[active]===id}" class="character-choice ${selected[active]===id?'selected':''}">${configs[id].displayName}</button>`).join('');
      const all=ready.slice(0,count).every(Boolean);
      heading.textContent=all?'全员就绪，准备碰撞！':`P${active+1}，选择你的角色`;
      colorBall.style.setProperty('--seat-color', current.hex);
      colorLabel.textContent=`P${active+1} · 上场球色`;
      colorValue.textContent=current.hex.toUpperCase();
      detail.innerHTML=`<span class="selection-edition" style="color:${current.hex}">${current.isClone?'球色滤镜副本':'原生配色'} · P${active+1}</span><h2>${current.name}</h2><h3>${current.skillConfig.name} <small>${current.skillConfig.duration} 秒</small></h3><p>${current.skillConfig.warning}</p><small>球体与技能同色 · 可重复选择角色</small>`;
      confirm.textContent=all?'开始对局':`确认 P${active+1} 的角色`;
      onPreview(current);
    }
    seats.addEventListener('click',e=>{const b=e.target.closest('[data-seat]');if(!b||b.disabled)return;active=Number(b.dataset.seat);render();});
    choices.addEventListener('click',e=>{const b=e.target.closest('[data-character]');if(!b)return;selected[active]=b.dataset.character;ready.fill(false,active,count);render();});
    confirm.addEventListener('click',()=>{
      if(ready.slice(0,count).every(Boolean)){root.hidden=true;document.body.classList.remove('selecting-character');onStart(roster());return;}
      ready[active]=true;const next=ready.findIndex((r,i)=>i<count&&!r);if(next>=0)active=next;render();
    });
    root.querySelector('.selection-back').addEventListener('click',()=>{root.hidden=true;document.body.classList.remove('selecting-character');});
    return {open(n){count=n;active=0;ready.fill(false);root.hidden=false;document.body.classList.add('selecting-character');render();}, refresh(){if(!root.hidden)render();}};
  }
  return {allocate,create};
})();
