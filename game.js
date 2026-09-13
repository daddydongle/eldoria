const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
function $(s){return document.querySelector(s)}
const ui={intro:$('#intro'),objective:$('#objective'),prompt:$('#prompt'),fade:$('#fade'),dialogue:$('#dialogue'),speaker:$('#dialogue-speaker'),title:$('#dialogue-title'),copy:$('#dialogue-copy'),inventory:$('#inventory'),items:$('#inventory-items')};
const state={scene:'meadow',started:false,time:0,keys:new Set(),player:{x:0,y:170,hp:100,maxHp:100,angle:Math.PI/2,direction:'down',moving:false,sprinting:false,animTime:0,attacking:0,blocking:false,dash:0,dashCooldown:0},enemies:[],items:[],inventory:[],knife:false,doorOpen:false,objective:'Survive',transitioning:false,dialogueAction:null,completed:false};
const enemyDefs={cultist:{name:'Blood Cultist',hp:70,speed:52,color:'#6d1721',damage:10,skin:0},priest:{name:'Blood Priestess',hp:110,speed:40,color:'#8e2639',damage:15,skin:1},high:{name:'High Priest',hp:999,speed:34,color:'#c9b08a',damage:28,skin:2}};
const sprintImage=new Image();sprintImage.src='assets/characters/player/default/sprint.png';
const idleImage=new Image(),enemyImage=new Image(),artFrames=new Map();
function prepareArt(image,columns){
  const buffer=document.createElement('canvas');buffer.width=image.naturalWidth;buffer.height=image.naturalHeight;
  const c=buffer.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  try{
    const pixels=c.getImageData(0,0,buffer.width,buffer.height).data,frames=[];
    for(let col=0;col<columns;col++){
      const l=Math.ceil(col*buffer.width/columns),r=Math.floor((col+1)*buffer.width/columns);
      let x0=r,y0=buffer.height,x1=l,y1=0;
      for(let y=0;y<buffer.height;y++)for(let x=l;x<r;x++)if(pixels[(y*buffer.width+x)*4+3]>100){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
      frames.push({x:x0,y:y0,w:Math.max(1,x1-x0+1),h:Math.max(1,y1-y0+1)});
    }
    artFrames.set(image,frames);
  }catch{artFrames.set(image,Array.from({length:columns},(_,i)=>({x:i*image.width/columns,y:0,w:image.width/columns,h:image.height})))}
}
// Measured opaque bounds avoid file:// pixel-access restrictions including padding
// in the idle size. These four crops share the movement sprite's foot anchor.
idleImage.onload=()=>artFrames.set(idleImage,[{x:70,y:93,w:412,h:556},{x:680,y:95,w:337,h:554},{x:1157,y:95,w:337,h:553},{x:1693,y:93,w:391,h:555}]);enemyImage.onload=()=>prepareArt(enemyImage,3);
idleImage.src='assets/characters/player/default/idle-directions.png';enemyImage.src='assets/characters/enemies/blood-cult.png';
const spriteRows={down:0,left:1,right:2,up:3},locomotionRows=[[35,229],[258,441],[470,654],[678,887]];
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
addEventListener('resize',resize);resize();
let objectiveTimer;
function setObjective(text){state.objective=text;ui.objective.querySelector('b').textContent=text;ui.objective.classList.add('show');clearTimeout(objectiveTimer);objectiveTimer=setTimeout(()=>ui.objective.classList.remove('show'),5500)}
function makeEnemy(type,x,y,overrides={}){const e={...enemyDefs[type],type,x,y,cooldown:1,hit:0,windup:0,attackX:0,attackY:0,...overrides};e.maxHp=e.hp;return e}
function spawnEncounter(){state.enemies=[makeEnemy('cultist',-270,-100),makeEnemy('cultist',280,-120),makeEnemy('priest',-40,-260),makeEnemy('high',130,-330)]}
function clearKeys(){state.keys.clear();state.player.moving=false;state.player.sprinting=false;state.player.blocking=false}
function paused(){return !state.started||state.transitioning||!ui.inventory.classList.contains('hidden')||!ui.dialogue.classList.contains('hidden')}
$('#begin').onclick=()=>{ui.intro.classList.add('hidden');state.started=true;spawnEncounter();setObjective('Survive')};
$('#dialogue-next').onclick=()=>{ui.dialogue.classList.add('hidden');const action=state.dialogueAction;state.dialogueAction=null;clearKeys();action?.()};
$('#close-inventory').onclick=toggleInventory;
$('#search').oninput=renderInventory;$('#type-filter').onchange=renderInventory;$('#rarity-filter').onchange=renderInventory;
$('#close-confluence').onclick=()=>$('#confluence').classList.add('hidden');
function toggleInventory(){if(!state.started||state.transitioning)return;clearKeys();ui.inventory.classList.toggle('hidden');renderInventory()}
function renderInventory(){
 const q=$('#search').value.toLowerCase(),type=$('#type-filter').value,rarity=$('#rarity-filter').value;
 const list=state.inventory.filter(x=>(type==='all'||x.type===type)&&(rarity==='all'||x.rarity===rarity)&&(x.name+' '+x.description).toLowerCase().includes(q));
 ui.items.replaceChildren();
 for(const item of list){
   const a=document.createElement('article');a.className='item';const icon=document.createElement('div');icon.className='item-icon';icon.textContent=item.icon||'◆';
   const copy=document.createElement('div'),title=document.createElement('h3'),desc=document.createElement('p');title.textContent=item.name;desc.textContent=item.rarity+' '+item.type+' · '+item.description;copy.append(title,desc);a.append(icon,copy);
   if(item.consumable){const b=document.createElement('button');b.textContent='Consume';b.onclick=()=>consume(item.id);a.append(b)}ui.items.append(a);
 }
 if(!list.length)ui.items.textContent='No matching items.';$('#inventory-count').textContent=list.length+' items';
}
function consume(id){
 const item=state.inventory.find(x=>x.id===id);if(!item?.consumable)return;
 if(item.name==='Blood Essence'){state.bloodConsumed=true;item.consumable=false;item.description='Absorbed. The Blood Essence is dormant; its abilities are not yet defined.'}renderInventory();
}
function showDialogue(speaker,title,copy,action=null){clearKeys();state.dialogueAction=action;ui.speaker.textContent=speaker;ui.title.textContent=title;ui.copy.textContent=copy;ui.dialogue.classList.remove('hidden')}
function transition(action){
 if(state.transitioning)return;state.transitioning=true;clearKeys();ui.fade.classList.add('on');
 setTimeout(()=>{action();ui.fade.classList.remove('on');state.transitioning=false},1100);
}
function defeat(){
 if(state.scene==='meadow')transition(()=>{state.scene='prison-wake';state.enemies=[];state.player.x=0;state.player.y=90;state.player.hp=45;showDialogue('SOME TIME LATER','Cold stone. Iron bars.','A meal tray lies beside you. Find a tool, escape the cell, and fight your way upstairs.',()=>startPrison())});
 else transition(()=>showDialogue('A SECOND CHANCE','The guards drag you back.','Your equipment is still hidden in your clothes. Try blocking a strike or dashing out of its red warning circle.',()=>startPrison()));
}
function startPrison(){
 state.scene='prison';Object.assign(state.player,{x:0,y:90,hp:100,direction:'down',attacking:0});state.enemies=[];state.doorOpen=false;
 state.items=[{kind:'meal',x:-115,y:25,taken:state.knife},{kind:'essence',x:140,y:-70,taken:state.inventory.some(i=>i.id==='blood')}];
 clearKeys();setObjective(state.knife?'Use the knife on the lock':'Search the meal tray');
}
function openCell(){
 state.doorOpen=true;state.enemies=[makeEnemy('cultist',-70,-330,{hp:56,damage:7,speed:53}),makeEnemy('cultist',85,-495,{hp:56,damage:7,speed:53}),makeEnemy('priest',0,-650,{hp:84,damage:9,speed:42})];
 setObjective('Fight to the stairs · 3 guards');
}
function enterVatRoom(){
 transition(()=>{state.scene='vat';Object.assign(state.player,{x:0,y:270,direction:'up',attacking:0,hp:Math.min(100,state.player.hp+30)});state.items=[];
 state.enemies=[makeEnemy('cultist',-220,50,{hp:56,damage:8,speed:55}),makeEnemy('priest',210,-140,{hp:84,damage:9,speed:43})];
 setObjective('Escape the crimson vat chamber');showDialogue('THE UPPER SANCTUM','The crimson vat','A giant iron vessel churns with red liquid. Two more cultists stand between you and the northern exit. Your knife is your way out.');});
}
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase(),typing=/INPUT|SELECT|TEXTAREA/.test(e.target.tagName);
 if(typing){if(k==='escape'){e.target.blur();if(!ui.inventory.classList.contains('hidden'))toggleInventory()}return}
 if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(e.repeat)return;
 if(k==='i'){toggleInventory();return}if(k==='escape'&&!ui.inventory.classList.contains('hidden')){toggleInventory();return}
 if(paused())return;state.keys.add(k);
 if(k==='q'&&state.player.dashCooldown<=0){state.player.dash=.16;state.player.dashCooldown=.9}
 if(k===' '||k==='j')attack();if(k==='h')state.player.blocking=true;
 if(ELDORIA_DATA.ABILITY_KEYS.includes(k))flashSlot(k);if(k==='f')interact();
});
addEventListener('keyup',e=>{state.keys.delete(e.key.toLowerCase());if(e.key.toLowerCase()==='h')state.player.blocking=false});addEventListener('blur',clearKeys);
function attack(){
 if(paused()||state.player.hp<=0||state.player.attacking>0)return;
 const p=state.player;p.attacking=.4;p.animTime=0;
 for(const e of state.enemies)if(Math.hypot(e.x-p.x,e.y-p.y)<88){
  e.hp-=state.knife?28:12;if(e.type==='high'&&state.scene==='meadow')e.hp=Math.max(1,e.hp);
  e.hit=.18;e.windup=0;e.cooldown=Math.max(e.cooldown,.65);
  const d=Math.hypot(e.x-p.x,e.y-p.y)||1,nx=e.x+(e.x-p.x)/d*12,ny=e.y+(e.y-p.y)/d*12;
  if(walkable(nx,ny,12)){e.x=nx;e.y=ny}
 }
}
function interact(){
 const p=state.player;
 if(state.scene==='prison'){
  const item=state.items.find(i=>!i.taken&&Math.hypot(i.x-p.x,i.y-p.y)<70);
  if(item){item.taken=true;if(item.kind==='meal'){
   state.knife=true;p.hp=100;state.inventory.push({id:'knife',name:'Smuggled Table Knife',type:'Weapon',rarity:'Common',description:'Equipped. 28 damage per strike; also picks the cell lock.',icon:'†'});setObjective('Use the knife on the lock');
  }else state.inventory.push({id:'blood',name:'Blood Essence',type:'Essence',rarity:'Epic',description:'Optional story essence. Its abilities remain unknown.',icon:'◆',consumable:true});
  }else if(state.knife&&!state.doorOpen&&Math.abs(p.x)<60&&Math.abs(p.y+170)<65)openCell();
 }else if(state.scene==='vat'&&!state.enemies.length&&p.y<-290&&Math.abs(p.x)<80&&!state.completed){
  state.completed=true;setObjective('Escaped the Blood Cult');showDialogue('DAWN BEYOND THE CULT','You made it out.','You leave the steaming crimson vat behind. Your knife—and your choice about the Blood Essence—remain yours. End of this tutorial chapter.');
 }
}
function flashSlot(k){const slot=[...document.querySelectorAll('.slot')].find(x=>x.dataset.key===k);if(slot){slot.classList.add('active');setTimeout(()=>slot.classList.remove('active'),160)}}
function initSlots(){
 const prog=ELDORIA_DATA.progression,abilities=prog.slots();$('#ability-bar').replaceChildren();
 ELDORIA_DATA.ABILITY_KEYS.forEach((key,i)=>{const el=document.createElement('div');el.className='slot';el.dataset.key=key;el.title=abilities[i]||'Essence '+(Math.floor(i/2)+1)+' · ability '+(i%2+1)+' (locked)';el.innerHTML='<small>'+key+'</small>'+(abilities[i]&&prog.unlockedAbilities.includes(abilities[i])?'✦':'◇');$('#ability-bar').append(el)});
}
initSlots();
function walkable(x,y,r=14){
 if(state.scene==='meadow')return x>=-620&&x<=620&&y>=-420&&y<=420;
 if(state.scene==='prison'){
  if(y>175||y<-840)return false;if(y>=-145)return Math.abs(x)<=220;
  if(y>-248)return state.doorOpen&&Math.abs(x)<=42-r*.2;
  if(y<-710)return state.doorOpen&&Math.abs(x)<=80-r;
  return state.doorOpen&&Math.abs(x)<=220;
 }
 if(state.scene==='vat'){if(Math.abs(x)>330||y>295||y<-340)return false;return (x/(120+r))**2+((y+85)/(90+r))**2>1}
 return false;
}
function move(entity,dx,dy,r=14){if(walkable(entity.x+dx,entity.y,r))entity.x+=dx;if(walkable(entity.x,entity.y+dy,r))entity.y+=dy}
function updateEnemies(dt){
 const p=state.player;
 for(const e of state.enemies){
  if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);e.cooldown-=dt;
  const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;e.moving=false;
  if(state.scene!=='meadow'&&d>265)continue;
  if(e.windup>0){e.windup-=dt;if(e.windup<=0){if(Math.hypot(p.x-e.attackX,p.y-e.attackY)<54&&p.dash<=0)p.hp-=e.damage*(p.blocking?.2:1);e.cooldown=1.1}}
  else if(d<67&&e.cooldown<=0){e.windup=.6;e.attackX=p.x;e.attackY=p.y}
  else if(d>45){
   const bx=e.x,by=e.y;move(e,dx/d*e.speed*dt,dy/d*e.speed*dt,12);
   if(e.x===bx&&e.y===by)move(e,-dy/d*e.speed*dt,dx/d*e.speed*dt,12);e.moving=true;
  }
 }
 const killed=state.enemies.filter(e=>e.hp<=0).length;state.enemies=state.enemies.filter(e=>e.hp>0);
 if(killed&&state.scene!=='meadow'){
  p.hp=Math.min(100,p.hp+killed*10);
  if(state.scene==='prison')setObjective(state.enemies.length?'Fight to the stairs · '+state.enemies.length+' guards':'Run up the stairs');
  else if(!state.enemies.length)setObjective('Leave through the northern door');
 }
}
function update(dt){
 if(paused())return;const p=state.player;state.time+=dt;if(state.completed){clearKeys();return}
 let dx=(state.keys.has('d')||state.keys.has('arrowright')?1:0)-(state.keys.has('a')||state.keys.has('arrowleft')?1:0),dy=(state.keys.has('s')||state.keys.has('arrowdown')?1:0)-(state.keys.has('w')||state.keys.has('arrowup')?1:0);
 const d=Math.hypot(dx,dy)||1;p.moving=!!(dx||dy);p.sprinting=p.moving&&state.keys.has('shift');
 if(p.moving){p.angle=Math.atan2(dy,dx);p.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down')}
 p.animTime+=dt;p.attacking=Math.max(0,p.attacking-dt);p.dash=Math.max(0,p.dash-dt);p.dashCooldown=Math.max(0,p.dashCooldown-dt);
 if(state.keys.has(' ')||state.keys.has('j'))attack();
 const speed=(p.sprinting?205:125)*(p.blocking?.6:1)*(p.dash>0?3.2:1);move(p,dx/d*speed*dt,dy/d*speed*dt);updateEnemies(dt);
 if(state.scene==='meadow'&&state.time>35)p.hp-=35*dt;
 if(p.hp<=0){p.hp=0;defeat()}
 if(state.scene==='prison'&&p.y<-815){if(!state.enemies.length)enterVatRoom();else{p.y=-813;setObjective('Defeat the remaining guards first')}}
 $('#health-fill').style.width=p.hp+'%';$('#health-label').textContent=Math.ceil(p.hp)+' / 100';updatePrompt();
}
function updatePrompt(){
 const p=state.player;let msg='';
 if(state.scene==='prison'){
  for(const i of state.items.filter(i=>!i.taken))if(Math.hypot(i.x-p.x,i.y-p.y)<70)msg=i.kind==='meal'?'<b>F</b> Search meal tray':'<b>F</b> Take Blood Essence (optional)';
  if(state.knife&&!state.doorOpen&&Math.abs(p.x)<60&&Math.abs(p.y+170)<65)msg='<b>F</b> Pick the lock';
  if(p.y<-700)msg=state.enemies.length?'Defeat the guards to reach the upper room':'Keep moving north to climb the stairs';
 }
 if(state.scene==='vat'&&p.y<-290&&Math.abs(p.x)<80)msg=state.enemies.length?'The guards block your escape':'<b>F</b> Leave the cult';
 ui.prompt.innerHTML=msg;ui.prompt.classList.toggle('hidden',!msg);
}
function worldToScreen(x,y){return [innerWidth/2+x-state.player.x,innerHeight/2+y-state.player.y]}
function render(){
 const w=innerWidth,h=innerHeight;
 if(state.scene==='meadow')scenery.meadow(w,h);else if(state.scene==='vat')scenery.vat(w,h);else scenery.prison(w,h);
 for(const e of state.enemies)if(e.windup>0){const [x,y]=worldToScreen(e.attackX,e.attackY);scenery.ellipse(ctx,x,y,54,27,'#df365444');ctx.strokeStyle='#ff8d79';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,54,27,0,0,Math.PI*2);ctx.stroke()}
 const actors=[{y:state.player.y,paint:()=>{scenery.ellipse(ctx,w/2,h/2+22,24,8,'#081b2a40');drawPlayer(w/2,h/2)}},...state.enemies.map(e=>({y:e.y,paint:()=>drawEnemy(e)}))];
 if(state.scene==='meadow')actors.push(...scenery.trees);if(state.scene==='vat')actors.push({y:15,paint:()=>scenery.cauldron()});
 actors.sort((a,b)=>a.y-b.y).forEach(a=>a.paint());scenery.atmosphere(w,h);
}
function drawArt(image,index,x,y,height,flip=false){
 const f=artFrames.get(image)?.[index];if(!f)return false;const scale=height/f.h;ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);
 ctx.drawImage(image,f.x,f.y,f.w,f.h,-f.w*scale/2,-height,f.w*scale,height);ctx.restore();return true;
}
function drawPlayer(x,y){
 const p=state.player,row=spriteRows[p.direction]??0,moving=p.moving&&p.hp>0&&!p.blocking&&p.attacking<=0;
 ctx.save();if(p.hp<=0){ctx.translate(x,y+20);ctx.rotate(Math.PI/2);ctx.translate(-x,-y-20)}
 const idleHeight=(locomotionRows[row][1]-locomotionRows[row][0])*.5;
 if(!moving&&drawArt(idleImage,row,x,y+27,idleHeight)){}
 else if(sprintImage.complete&&sprintImage.naturalWidth){
  const [top,bottom]=locomotionRows[row],frame=moving?Math.floor(p.animTime*(p.sprinting?10:7))%8:0,l=Math.ceil(frame*sprintImage.naturalWidth/8),r=Math.floor((frame+1)*sprintImage.naturalWidth/8);
  ctx.drawImage(sprintImage,l,top,r-l,bottom-top,x-(r-l)*.25,y+27-(bottom-top)*.5,(r-l)*.5,(bottom-top)*.5);
 }ctx.restore();
 if(p.blocking){ctx.strokeStyle='#a9d9ef';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-15,34,p.angle-1.1,p.angle+1.1);ctx.stroke()}
 if(p.attacking>0&&p.hp>0){
  const progress=Math.max(0,Math.min(1,1-p.attacking/.4)),angle=p.angle-1.3+progress*2.6;
  ctx.save();ctx.translate(x,y-15);ctx.rotate(angle);ctx.strokeStyle=state.knife?'#d9e2dcaa':'#e7d0b78c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,38,-.45,0);ctx.stroke();
  if(state.knife){ctx.strokeStyle='#f1f3ec';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(43,0);ctx.stroke();ctx.strokeStyle='#806244';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(23,0);ctx.stroke()}
  else scenery.ellipse(ctx,34,0,6,5,'#dec4a4');ctx.restore();
 }
}
function drawEnemy(e){
 const [x,y]=worldToScreen(e.x,e.y);if(x<-150||x>innerWidth+150||y<-150||y>innerHeight+160)return;
 scenery.ellipse(ctx,x,y+20,23,8,'#09122150');const height=e.type==='high'?118:98,bob=e.moving?Math.sin(state.time*10+e.x*.03)*1.3:0;
 ctx.save();if(e.hit>0)ctx.filter='brightness(1.6)';
 if(!drawArt(enemyImage,e.skin,x,y+22+bob,height,state.player.x<e.x)){ctx.fillStyle=e.color;ctx.beginPath();ctx.moveTo(x,y-62);ctx.lineTo(x+22,y+15);ctx.lineTo(x-22,y+15);ctx.fill()}
 ctx.restore();ctx.textAlign='center';ctx.font='11px system-ui';ctx.fillStyle='#f1e5dc';ctx.fillText(e.name,x,y-height-4);
 ctx.fillStyle='#1b0b0d';ctx.fillRect(x-24,y-height+2,48,4);ctx.fillStyle='#ba2433';ctx.fillRect(x-24,y-height+2,48*Math.max(0,e.hp/e.maxHp),4);
}
let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
