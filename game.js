const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const ui={intro:$('#intro'),objective:$('#objective'),prompt:$('#prompt'),fade:$('#fade'),dialogue:$('#dialogue'),speaker:$('#dialogue-speaker'),title:$('#dialogue-title'),copy:$('#dialogue-copy'),inventory:$('#inventory'),items:$('#inventory-items')};
function $(s){return document.querySelector(s)}
const state={scene:'meadow',started:false,time:0,keys:new Set(),player:{x:0,y:170,hp:100,maxHp:100,angle:0,direction:'down',moving:false,sprinting:false,animTime:0,attacking:0,blocking:false,dash:0},enemies:[],items:[],inventory:[],mealTaken:false,knife:false,doorOpen:false,objective:'Survive',transitioning:false};
const enemyDefs={cultist:{name:'Blood Cultist',hp:70,speed:52,color:'#6d1721',damage:10},priest:{name:'Blood Priestess',hp:110,speed:40,color:'#8e2639',damage:15},high:{name:'High Priest',hp:999,speed:34,color:'#c9b08a',damage:28}};
const playerAtlas=new Image();playerAtlas.src='assets/characters/player/default/player-atlas.png';
const motionAtlases=Object.fromEntries(['walk','sprint','attack'].map(name=>{const image=new Image();image.src=`assets/characters/player/default/${name}.png`;return [name,image]}));
const spriteActions={idle:0,walk:1,sprint:2,attack:3,block:4,defeated:5},spriteRows={down:0,left:1,right:2,up:3};
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}addEventListener('resize',resize);resize();
function setObjective(text){state.objective=text;ui.objective.querySelector('b').textContent=text;ui.objective.classList.remove('show');requestAnimationFrame(()=>ui.objective.classList.add('show'));setTimeout(()=>ui.objective.classList.remove('show'),4200)}
function spawnEncounter(){state.enemies=[makeEnemy('cultist',-270,-100),makeEnemy('cultist',280,-120),makeEnemy('priest',-40,-260),makeEnemy('high',130,-330)]}
function makeEnemy(type,x,y){return {...enemyDefs[type],type,x,y,maxHp:enemyDefs[type].hp,cooldown:0,hit:0}}
$('#begin').onclick=()=>{ui.intro.classList.add('hidden');state.started=true;spawnEncounter();setTimeout(()=>setObjective('Survive'),250)};
$('#dialogue-next').onclick=()=>{ui.dialogue.classList.add('hidden');if(state.scene==='prison-wake')startPrison()};
$('#close-inventory').onclick=toggleInventory;$('#search').oninput=renderInventory;$('#type-filter').onchange=renderInventory;$('#rarity-filter').onchange=renderInventory;
$('#close-confluence').onclick=()=>$('#confluence').classList.add('hidden');
function toggleInventory(){ui.inventory.classList.toggle('hidden');renderInventory()}
function renderInventory(){const q=$('#search').value.toLowerCase(),type=$('#type-filter').value,rarity=$('#rarity-filter').value;const list=state.inventory.filter(x=>(type==='all'||x.type===type)&&(rarity==='all'||x.rarity===rarity)&&`${x.name} ${x.description}`.toLowerCase().includes(q));ui.items.innerHTML=list.map((x,i)=>`<article class="item"><div class="item-icon">${x.icon||'◆'}</div><div><h3>${x.name}</h3><p><span class="tag">${x.rarity} ${x.type}</span> · ${x.description}</p></div>${x.consumable?`<button data-id="${x.id}">Consume</button>`:''}</article>`).join('')||'<p>No matching items.</p>';$('#inventory-count').textContent=`${list.length} item${list.length===1?'':'s'}`;ui.items.querySelectorAll('button').forEach(b=>b.onclick=()=>consume(b.dataset.id))}
function consume(id){const item=state.inventory.find(x=>x.id===id);if(!item)return;if(item.name==='Blood Essence'){ELDORIA_DATA.progression.absorbCore('Death');item.consumable=false;item.description='Absorbed. Its first ability remains dormant until the build is complete.';renderInventory()}}
function showDialogue(speaker,title,copy){ui.speaker.textContent=speaker;ui.title.textContent=title;ui.copy.textContent=copy;ui.dialogue.classList.remove('hidden')}
function defeat(){if(state.transitioning)return;state.transitioning=true;ui.fade.classList.add('on');setTimeout(()=>{state.scene='prison-wake';state.enemies=[];state.player.hp=45;ui.fade.classList.remove('on');showDialogue('SOME TIME LATER','Cold stone. Iron bars.','You wake in a Blood Cult prison. A wooden tray slides beneath the door. Your captors have left you alive—for now.');state.transitioning=false},2200)}
function startPrison(){state.scene='prison';state.player.x=0;state.player.y=90;state.items=[{kind:'meal',x:-115,y:25,taken:false},{kind:'essence',x:140,y:-70,taken:false}];setObjective('Escape the cell')}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='o'){toggleInventory();return}if(ui.inventory&&!ui.inventory.classList.contains('hidden'))return;state.keys.add(k);if(k==='q')state.player.dash=.18;if(k===' '||k==='j')attack();if(k==='h')state.player.blocking=true;if(ELDORIA_DATA.ABILITY_KEYS.includes(k))flashSlot(k);if(k==='f')interact();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault()});addEventListener('keyup',e=>{state.keys.delete(e.key.toLowerCase());if(e.key.toLowerCase()==='h')state.player.blocking=false});
function attack(){if(!state.started||state.player.attacking>0)return;state.player.attacking=.5;state.player.animTime=0;for(const e of state.enemies){if(Math.hypot(e.x-state.player.x,e.y-state.player.y)<70){e.hp-=state.knife?32:12;e.hit=.15}}}
function interact(){if(state.scene!=='prison')return;const p=state.player;const meal=state.items.find(x=>x.kind==='meal'&&!x.taken),ess=state.items.find(x=>x.kind==='essence'&&!x.taken);if(meal&&Math.hypot(meal.x-p.x,meal.y-p.y)<70){meal.taken=true;state.mealTaken=true;state.knife=true;state.inventory.push({id:'knife',name:'Smuggled Table Knife',type:'Weapon',rarity:'Common',description:'A blunt meal knife. Just sharp enough for a rusted lock.',icon:'†'});setObjective('Use the knife on the lock')}else if(ess&&Math.hypot(ess.x-p.x,ess.y-p.y)<70){ess.taken=true;state.inventory.push({id:'blood',name:'Blood Essence',type:'Essence',rarity:'Epic',description:'A forbidden essence pulsing with stolen life. Consumption is optional.',icon:'◆',consumable:true});setObjective(state.doorOpen?'Find a way out':'Escape the cell')}else if(state.knife&&Math.abs(p.y+185)<70){state.doorOpen=true;setObjective('Find a way out')}}
function flashSlot(k){const el=[...document.querySelectorAll('.slot')].find(x=>x.dataset.key===k);if(el){el.classList.add('active');setTimeout(()=>el.classList.remove('active'),160)}}
function initSlots(){$('#ability-bar').innerHTML=ELDORIA_DATA.ABILITY_KEYS.map((k,i)=>`<div class="slot" data-key="${k}"><small>${k===' '?'Space':k}</small>${i+1}</div>`).join('')}initSlots();
function update(dt){if(!state.started||!ui.inventory.classList.contains('hidden')||!ui.dialogue.classList.contains('hidden'))return;state.time+=dt;const p=state.player;let dx=(state.keys.has('d')||state.keys.has('arrowright')?1:0)-(state.keys.has('a')||state.keys.has('arrowleft')?1:0),dy=(state.keys.has('s')||state.keys.has('arrowdown')?1:0)-(state.keys.has('w')||state.keys.has('arrowup')?1:0);const l=Math.hypot(dx,dy)||1;p.moving=!!(dx||dy);p.sprinting=p.moving&&state.keys.has('shift');if(p.moving){p.angle=Math.atan2(dy,dx);p.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down')}p.animTime+=dt;const speed=(p.sprinting?205:125)*(p.dash>0?3.2:1);dx/=l;dy/=l;p.x+=dx*speed*dt;p.y+=dy*speed*dt;p.attacking=Math.max(0,p.attacking-dt);p.dash=Math.max(0,p.dash-dt);if(state.scene==='meadow'){p.x=Math.max(-620,Math.min(620,p.x));p.y=Math.max(-420,Math.min(420,p.y));for(const e of state.enemies){let ex=p.x-e.x,ey=p.y-e.y,el=Math.hypot(ex,ey)||1;e.x+=ex/el*e.speed*dt;e.y+=ey/el*e.speed*dt;e.cooldown-=dt;e.hit=Math.max(0,e.hit-dt);if(el<42&&e.cooldown<=0){p.hp-=e.damage*(p.blocking?.25:1);e.cooldown=.8}}state.enemies=state.enemies.filter(e=>e.hp>0);if(p.hp<=0)defeat()}else if(state.scene==='prison'){p.x=Math.max(-220,Math.min(220,p.x));p.y=Math.max(state.doorOpen?-330:-175,Math.min(175,p.y));if(state.doorOpen&&p.y<-285&&!state.items.some(x=>x.kind==='essence'&&!x.taken)){setObjective('Reach the sanctuary');ui.prompt.classList.add('hidden')}}$('#health-fill').style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;$('#health-label').textContent=`${Math.max(0,Math.ceil(p.hp))} / ${p.maxHp}`;updatePrompt()}
function updatePrompt(){let msg='';if(state.scene==='prison'){const p=state.player;for(const x of state.items.filter(i=>!i.taken))if(Math.hypot(x.x-p.x,x.y-p.y)<70)msg=x.kind==='meal'?'<b>F</b> Search meal tray':'<b>F</b> Take Blood Essence';if(state.knife&&!state.doorOpen&&Math.abs(p.y+185)<70)msg='<b>F</b> Pick the lock'}ui.prompt.innerHTML=msg;ui.prompt.classList.toggle('hidden',!msg)}
function worldToScreen(x,y){return [innerWidth/2+(x-state.player.x),innerHeight/2+(y-state.player.y)]}
function render(){
  const w=innerWidth,h=innerHeight;
  if(state.scene==='meadow')drawMeadow(w,h);else drawPrison(w,h);
  const actors=[{y:state.player.y,paint:()=>{
    scenery.ellipse(ctx,w/2,h/2+22,24,8,'#081b2a40');
    drawPlayer(w/2,h/2);
  }},...state.enemies.map(e=>({y:e.y,paint:()=>drawEnemy(e)}))];
  if(state.scene==='meadow')actors.push(...scenery.trees);
  actors.sort((a,b)=>a.y-b.y).forEach(a=>a.paint());
  scenery.atmosphere(w,h);
  requestAnimationFrame(loop);
}
function drawMeadow(w,h){scenery.meadow(w,h)}
function drawPrison(w,h){scenery.prison(w,h)}
// Measured transparent row gaps in sprint.png; the artwork is not an equal 4-row grid.
// Each frame keeps its original aspect ratio and uses a shared 0.5 world-pixel scale.
const locomotionRows = [[35,229],[258,441],[470,654],[678,887]];
function drawPlayer(x,y) {
  const p=state.player, image=motionAtlases.sprint;
  if(!image.complete || !image.naturalWidth) return;
  const row=spriteRows[p.direction] ?? 0;
  const [top,bottom]=locomotionRows[row];
  const moving=p.moving && p.hp>0 && !p.blocking && p.attacking<=0;
  const frame=moving ? Math.floor(p.animTime*(p.sprinting?10:7))%8 : 0;
  // Integer boundaries avoid sampling neighbouring columns during filtering.
  const left=Math.ceil(frame*image.naturalWidth/8);
  const right=Math.floor((frame+1)*image.naturalWidth/8);
  const width=right-left, height=bottom-top, scale=0.5;
  ctx.save();
  ctx.imageSmoothingEnabled=true;
  ctx.translate(x,y+27);
  if(p.hp<=0) ctx.rotate(Math.PI/2);
  ctx.drawImage(image,left,top,width,height,-width*scale/2,-height*scale,width*scale,height*scale);
  ctx.restore();
  if(p.blocking){
    ctx.save();ctx.strokeStyle='#a9d9ef';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(x,y-15,34,p.angle-1.1,p.angle+1.1);ctx.stroke();ctx.restore();
  }
  if(p.attacking>0 && p.hp>0) {
    // The old attack sheet has overlapping effects. Draw an unrestricted swing
    // in world space instead of clipping its sword and trail to an atlas cell.
    const progress=Math.max(0,Math.min(1,1-p.attacking/0.5));
    const facing={down:Math.PI/2,left:Math.PI,right:0,up:-Math.PI/2}[p.direction];
    const angle=facing-1.5+progress*3;
    ctx.save();ctx.translate(x,y-20);
    ctx.strokeStyle='rgba(143,213,255,0.65)';ctx.lineWidth=8;
    ctx.beginPath();ctx.arc(0,0,53,angle-0.65,angle);ctx.stroke();
    ctx.rotate(angle);ctx.strokeStyle='#edf7ff';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(62,0);ctx.stroke();
    ctx.strokeStyle='#c7a566';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(24,-7);ctx.lineTo(24,7);ctx.stroke();ctx.restore();
  }
}
function drawEnemy(e){const [x,y]=worldToScreen(e.x,e.y);ctx.save();ctx.translate(x,y);ctx.fillStyle=e.hit>0?'#fff':e.color;ctx.beginPath();ctx.arc(0,0,e.type==='high'?22:16,0,7);ctx.fill();ctx.fillStyle='#17080a';ctx.fillRect(-13,12,26,e.type==='high'?34:26);ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillStyle='#f1e5dc';ctx.fillText(e.name,0,-25);ctx.fillStyle='#1b0b0d';ctx.fillRect(-24,-19,48,4);ctx.fillStyle='#ba2433';ctx.fillRect(-24,-19,48*Math.max(0,e.hp/e.maxHp),4);ctx.restore()}
let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render()}requestAnimationFrame(loop);
