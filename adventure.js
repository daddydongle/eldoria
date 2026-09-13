// Combat timing and equipment are independent of the character artwork.
const WEAPONS={
 fists:{name:'Unarmed',damage:10,reach:57,arc:1.0,windup:.16,recovery:.34,cost:12,style:'punch'},
 knife:{name:'Table knife',damage:24,reach:76,arc:.7,windup:.18,recovery:.38,cost:18,style:'thrust'},
 sword:{name:'Iron sword',damage:36,reach:102,arc:1.3,windup:.32,recovery:.52,cost:30,style:'slash'},
 axe:{name:'Wood axe',damage:48,reach:82,arc:.9,windup:.48,recovery:.68,cost:40,style:'chop'}
};
Object.assign(state,{weapon:'fists',wheel:false,stairClimb:null});
Object.assign(state.player,{stamina:100,regenDelay:0,hurt:0,swing:null});
const equipment=()=>Object.keys(WEAPONS).filter(k=>k==='fists'||(k==='knife'&&state.knife)||state.inventory.some(i=>i.id===k));
const combatHud=document.createElement('div');combatHud.className='combat-hud';document.body.append(combatHud);
const wheel=document.createElement('div');wheel.id='weapon-wheel';wheel.className='hidden';wheel.innerHTML='<div class="wheel-disc" role="dialog" aria-label="Weapon selection"><h2>Weapons</h2><p>Point to select · release Tab to equip</p><div class="wheel-options"></div><small>Unfound weapons are locked</small></div>';document.body.append(wheel);
let wheelChoice='fists';
function openWheel(){
 if(paused()||state.stairClimb||state.player.attacking>0)return;
 clearKeys();state.wheel=true;wheelChoice=state.weapon;wheel.classList.remove('hidden');const options=wheel.querySelector('.wheel-options');options.replaceChildren();
 Object.entries(WEAPONS).forEach(([key,w],i)=>{const b=document.createElement('button');b.textContent=w.name;b.disabled=!equipment().includes(key);b.dataset.weapon=key;b.style.setProperty('--angle',i*90+'deg');b.classList.toggle('selected',key===wheelChoice);b.onpointerenter=()=>chooseWeapon(key);b.onclick=()=>chooseWeapon(key);options.append(b)});
}
function chooseWeapon(key){if(!equipment().includes(key))return;wheelChoice=key;wheel.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.weapon===key))}
function closeWheel(commit=true){if(state.wheel&&commit)state.weapon=wheelChoice;state.wheel=false;wheel.classList.add('hidden');clearKeys()}
addEventListener('keydown',e=>{
 if(e.key==='Tab'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)openWheel();return}
 if(state.stairClimb){e.preventDefault();e.stopImmediatePropagation();return}
 if(state.wheel){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')closeWheel(false);const keys=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'];if(keys.includes(e.key))chooseWeapon(Object.keys(WEAPONS)[keys.indexOf(e.key)])}
},true);
addEventListener('keyup',e=>{if(e.key==='Tab'){e.preventDefault();closeWheel()}},true);
addEventListener('blur',()=>closeWheel(false));
attack=function(){
 const p=state.player,w=WEAPONS[state.weapon];
 if(paused()||state.wheel||state.stairClimb||p.hp<=0||p.attacking>0||p.dash>0||p.blocking||p.stamina<w.cost)return;
 p.stamina-=w.cost;p.regenDelay=.7;p.attacking=w.windup+w.recovery;
 p.swing={weapon:state.weapon,angle:p.angle,elapsed:0,hit:false};
};
function updateCombat(dt){
 const p=state.player;p.hurt=Math.max(0,p.hurt-dt);p.regenDelay=Math.max(0,p.regenDelay-dt);
 if(!p.regenDelay&&!p.blocking)p.stamina=Math.min(100,p.stamina+27*dt);
 if(p.swing){const s=p.swing,w=WEAPONS[s.weapon];s.elapsed+=dt;
  if(!s.hit&&s.elapsed>=w.windup){s.hit=true;for(const e of state.enemies){
   const angle=Math.atan2(e.y-p.y,e.x-p.x),delta=Math.atan2(Math.sin(angle-s.angle),Math.cos(angle-s.angle));
   if(e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<w.reach&&Math.abs(delta)<w.arc){e.hp-=w.damage;e.hit=.14;if(e.type==='high'&&state.scene==='meadow')e.hp=Math.max(1,e.hp);}
  }}
  if(s.elapsed>=w.windup+w.recovery)p.swing=null;
 }
}
function receiveHit(e){
 const p=state.player;if(p.hurt>0)return;
 const toward=Math.atan2(e.y-p.y,e.x-p.x),delta=Math.atan2(Math.sin(toward-p.angle),Math.cos(toward-p.angle));
 const guarded=p.blocking&&Math.abs(delta)<1.25&&p.stamina>=20;
 if(guarded){p.stamina-=20;p.regenDelay=1;p.hp-=e.damage*.15}else{p.hp-=e.damage;p.hurt=.28;if(p.blocking){p.blocking=false;p.stamina=0;p.regenDelay=1.2}}
 // Hits do not cancel enemy commitments: attack-spamming is not a stun lock.
}
const originalPlayerDraw=drawPlayer;
drawPlayer=function(x,y){
 if(state.stairHidden&&state.scene==='prison')return;
 const p=state.player,s=p.swing,climb=state.stairClimb;
 ctx.save();if(climb){const t=Math.min(1,climb.elapsed/1.2);ctx.beginPath();ctx.rect(0,climb.screenY-85,innerWidth,innerHeight);ctx.clip();y-=t*150;}
 let reach=0,phase=0;
 if(s){const w=WEAPONS[s.weapon];phase=s.elapsed/w.windup;reach=phase<1?-4*Math.sin(phase*Math.PI):Math.sin(Math.min(1,(s.elapsed-w.windup)/w.recovery)*Math.PI)*9;
  x+=Math.cos(s.angle)*reach;y+=Math.sin(s.angle)*reach;ctx.translate(x,y+22);ctx.rotate(Math.sin(Math.min(1,phase)*Math.PI)*.045);ctx.translate(-x,-y-22);
 }
 if(p.hurt>0)ctx.filter='brightness(1.5)';
 const timer=p.attacking;p.attacking=0;const moving=p.moving;if(s)p.moving=false;originalPlayerDraw(x,y);p.attacking=timer;p.moving=moving;ctx.filter='none';
 if(s){const w=WEAPONS[s.weapon],t=Math.min(1,s.elapsed/(w.windup+w.recovery)),strike=Math.sin(Math.PI*t),a=s.angle+(w.style==='slash'?-1.3+t*2.6:w.style==='chop'?-.65+t*1.3:0);
  ctx.save();ctx.translate(x,y-15);ctx.rotate(a);ctx.lineCap='round';
  const hand=19+strike*(w.style==='thrust'?25:12);ctx.strokeStyle='#795b42';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(9,8);ctx.lineTo(hand,0);ctx.stroke();scenery.ellipse(ctx,hand,0,5,5,'#c3a184');
  if(w.style==='punch'){scenery.ellipse(ctx,hand+6,0,7,6,'#b38d69')}
  else{const len=w.style==='thrust'?23:w.style==='slash'?49:38;ctx.strokeStyle='#64462e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(hand,0);ctx.lineTo(hand+len,0);ctx.stroke();
   ctx.fillStyle='#d6e0dd';ctx.beginPath();if(w.style==='chop'){ctx.moveTo(hand+24,-5);ctx.lineTo(hand+42,-17);ctx.lineTo(hand+45,14);ctx.lineTo(hand+25,5)}else{ctx.moveTo(hand+7,-3);ctx.lineTo(hand+len+7,0);ctx.lineTo(hand+7,3)}ctx.closePath();ctx.fill();
   if(w.style==='slash'){ctx.strokeStyle='#bbae75';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hand+5,-9);ctx.lineTo(hand+5,9);ctx.stroke()}
  }
  if(t>.2&&t<.75){ctx.strokeStyle='#ece8ce66';ctx.lineWidth=2;ctx.beginPath();if(w.style==='thrust'){ctx.moveTo(hand,8);ctx.lineTo(hand+29,8)}else ctx.arc(0,0,hand+22,-.6,0);ctx.stroke()}ctx.restore();
 }
 ctx.restore();
};
function beginStairClimb(){clearKeys();state.stairHidden=false;state.player.direction='up';state.player.angle=-Math.PI/2;state.stairClimb={elapsed:0,screenY:innerHeight/2};ui.prompt.classList.add('hidden')}
function updateStairClimb(dt){const s=state.stairClimb;s.elapsed+=dt;state.player.moving=true;state.player.sprinting=false;state.player.animTime+=dt;if(s.elapsed>1.65){state.stairClimb=null;state.stairHidden=true;state.player.moving=false;enterVatRoom()}}
const houses=[{x:-290,y:-240,w:205,h:145,name:'The Wheatsheaf Inn'},{x:290,y:-255,w:205,h:140,name:'Willowbrook Smithy'},{x:-320,y:170,w:180,h:130,name:'Orchard Cottage'},{x:330,y:180,w:180,h:130,name:'Miller’s Home'}];
function townWalkable(x,y,r){return Math.abs(x)<690-r&&Math.abs(y)<540-r&&!houses.some(b=>Math.abs(x-b.x)<b.w/2+r&&y>b.y-35-r&&y<b.y+b.h/2+r)&&Math.hypot(x,y+70)>42+r}
function enterTown(){transition(()=>{state.scene='town';state.completed=false;state.enemies=[];state.player.x=0;state.player.y=440;state.player.hp=100;state.player.stamina=100;setObjective('Explore Willowbrook · find the smithy');showDialogue('WILLOWBROOK · RURAL DISTRICT','Fresh air. Familiar sounds.','Thatched cottages and wheat fields replace cold stone. A hammer rings from the smithy to the northeast. There may be a better weapon on its outdoor rack.');})}
const baseInteract=interact;
interact=function(){if(state.scene!=='town'){baseInteract();return}if(Math.hypot(state.player.x-180,state.player.y+125)<90){for(const k of ['sword','axe'])if(!state.inventory.some(i=>i.id===k))state.inventory.push({id:k,name:WEAPONS[k].name,type:'Weapon',rarity:'Common',description:'Loaned by the Willowbrook smith. Select with Tab.',icon:'†'});setObjective('Sword and axe acquired · hold Tab to choose')}else if(Math.hypot(state.player.x+100,state.player.y+40)<85)showDialogue('WILLOWBROOK RESIDENT','You look like you need a rest.','The cult keeps to the old abbey. You are safe here. The smith lends tools to travellers—try the rack across the lane.');};
const basePrompt=updatePrompt;updatePrompt=function(){basePrompt();if(state.scene==='town'){let msg='Willowbrook · country district';if(Math.hypot(state.player.x-180,state.player.y+125)<90)msg='<b>F</b> Borrow sword and wood axe · <b>Tab</b> weapon wheel';else if(Math.hypot(state.player.x+100,state.player.y+40)<85)msg='<b>F</b> Talk to resident';ui.prompt.innerHTML=msg;ui.prompt.classList.remove('hidden')}};
function drawTown(w,h){
 ctx.fillStyle='#6f8949';ctx.fillRect(0,0,w,h);ctx.save();const [x,y]=worldToScreen(0,0);ctx.translate(x,y);
 ctx.fillStyle='#b5a278';ctx.fillRect(-66,-550,132,1100);ctx.fillRect(-700,-140,1400,105);ctx.fillRect(-700,310,1400,80);
 for(let i=0;i<600;i++){const x=Math.sin(i*78.3)*690,y=Math.cos(i*21.7)*540;if(Math.abs(x)<75||Math.abs(y+90)<60||Math.abs(y-350)<45)continue;ctx.strokeStyle=i%3?'#b3bd6866':'#395d4166';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2,y-5);ctx.stroke()}
 for(let i=0;i<160;i++){const x=Math.sin(i*47.1)*670,y=Math.cos(i*19.3)*530;if(Math.abs(x)<58||Math.abs(y+90)<43||Math.abs(y-350)<30)scenery.ellipse(ctx,x,y,3+i%3,2,'#74664a30')}
 for(const side of [-1,1])for(let row=0;row<3;row++){const xx=side*540,yy=60+row*62;ctx.fillStyle='#715c37';ctx.fillRect(xx-62,yy-18,125,35);for(let i=0;i<8;i++){scenery.ellipse(ctx,xx-52+i*15,yy,7,5,'#4c753e');scenery.ellipse(ctx,xx-53+i*15,yy-3,3,2,row%2?'#c6a85a':'#a1b66c')}}
 for(const side of [-1,1]){ctx.strokeStyle='#a58a57';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(side*435,35);ctx.lineTo(side*655,35);ctx.moveTo(side*435,46);ctx.lineTo(side*655,46);ctx.stroke();for(let i=0;i<9;i++){ctx.fillStyle='#8f7448';ctx.fillRect(side*(435+i*27)-3,27,6,34)}}
 for(const side of [-1,1]){ctx.fillStyle='#a99242';ctx.fillRect(side<0?-650:460,-500,180,275);for(let c=0;c<12;c++)for(let r=0;r<22;r++){const x=(side<0?-640:470)+c*14,y=-490+r*12;ctx.strokeStyle='#e0c36a';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(state.time+c)*2,y-9);ctx.stroke()}ctx.strokeStyle='#735839';ctx.lineWidth=3;ctx.strokeRect(side<0?-655:455,-505,190,285);}
 for(const b of houses){const {x,y,w:ww,h:hh}=b;ctx.fillStyle='#243e3544';ctx.fillRect(x-ww/2+12,y-38,ww,hh+22);ctx.fillStyle='#dfc89b';ctx.fillRect(x-ww/2,y-35,ww,hh);ctx.fillStyle='#624a35';for(const xx of [x-ww/2,x,x+ww/2-7])ctx.fillRect(xx,y-35,7,hh);ctx.fillRect(x-ww/2,y+hh-43,ww,7);ctx.fillStyle='#40372e';ctx.fillRect(x-17,y+hh-79,34,44);
  for(const xx of [x-ww*.32,x+ww*.28]){ctx.fillStyle='#70928a';ctx.fillRect(xx-13,y+5,26,27);ctx.strokeStyle='#6e5033';ctx.strokeRect(xx-13,y+5,26,27);ctx.beginPath();ctx.moveTo(xx,y+5);ctx.lineTo(xx,y+32);ctx.stroke()}
  ctx.fillStyle='#927037';ctx.beginPath();ctx.moveTo(x-ww/2-18,y-26);ctx.lineTo(x,y-112);ctx.lineTo(x+ww/2+18,y-26);ctx.closePath();ctx.fill();ctx.strokeStyle='#d1b66d';for(let i=0;i<8;i++){const yy=y-100+i*10,half=(i+1)*ww/18;ctx.beginPath();ctx.moveTo(x-half,yy);ctx.lineTo(x+half,yy+3);ctx.stroke()}
  ctx.fillStyle='#f0ddb2';ctx.font='13px Georgia';ctx.textAlign='center';ctx.fillText(b.name,x,y+hh+19);
 }
 scenery.ellipse(ctx,0,-70,45,30,'#b7b7a1');scenery.ellipse(ctx,0,-73,31,19,'#435d62');ctx.strokeStyle='#66513b';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-35,-75);ctx.lineTo(-35,-135);ctx.lineTo(35,-135);ctx.lineTo(35,-75);ctx.stroke();ctx.fillStyle='#8a6339';ctx.fillRect(-48,-145,96,14);
 ctx.fillStyle='#715132';ctx.fillRect(153,-136,55,12);ctx.fillRect(155,-136,5,40);ctx.fillRect(200,-136,5,40);ctx.strokeStyle='#d6dad4';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(171,-147);ctx.lineTo(171,-112);ctx.moveTo(187,-145);ctx.lineTo(190,-110);ctx.stroke();ctx.fillStyle='#b5beb8';ctx.fillRect(187,-145,14,10);
 scenery.ellipse(ctx,-100,-22,13,6,'#35473555');ctx.fillStyle='#6f4f65';ctx.fillRect(-110,-53,20,32);scenery.ellipse(ctx,-100,-62,9,10,'#d3b18a');scenery.ellipse(ctx,-100,-71,16,5,'#d5b65e');
 ctx.restore();
}
const originalRender=render;render=function(){originalRender();combatHud.textContent=WEAPONS[state.weapon].name+' · Stamina '+Math.ceil(state.player.stamina)+' / 100 · Hold Tab: weapons';};
