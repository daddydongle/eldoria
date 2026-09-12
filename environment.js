// World decoration is generated once; movement never reshuffles the scenery.
const scenery = (() => {
  let seed = 73129;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const ellipse = (c,x,y,rx,ry,color) => {
    c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();
  };
  const ground=document.createElement('canvas');ground.width=2400;ground.height=1900;
  const g=ground.getContext('2d');g.translate(1200,950);
  g.fillStyle='#496b38';g.fillRect(-1200,-950,2400,1900);
  for(let i=0;i<240;i++){
    const x=random()*2400-1200,y=random()*1900-950,r=50+random()*140;
    const light=g.createRadialGradient(x,y,0,x,y,r);
    light.addColorStop(0,i%2?'#93a95a35':'#163e3438');light.addColorStop(1,'#496b3800');
    g.fillStyle=light;g.fillRect(x-r,y-r,r*2,r*2);
  }
  const pathX=y=>95+Math.sin(y/270)*150;
  // A worn trail, with broken grass edges rather than a solid ribbon.
  g.strokeStyle='#b3a17438';g.lineWidth=78;g.lineJoin='round';g.beginPath();
  for(let y=-950;y<=950;y+=5){if(y===-950)g.moveTo(pathX(y),y);else g.lineTo(pathX(y),y);}g.stroke();
  for(let i=0;i<3500;i++){
    const y=random()*1900-950,x=pathX(y)+(random()-.5)*90;
    ellipse(g,x,y,1+random()*3,.5+random(),i%2?'#c2ac7830':'#53694332');
  }
  for(let i=0;i<27000;i++){
    const x=random()*2400-1200,y=random()*1900-950,onPath=Math.abs(x-pathX(y))<36;
    if(onPath && random()<.88){ellipse(g,x,y,random()*2+.5,.6,'#cab78c55');continue;}
    g.strokeStyle=['#aac17460','#314f3580','#d1ce8345','#254a3760'][i%4];g.lineWidth=.7;
    const h=2+random()*6;g.beginPath();g.moveTo(x,y);g.lineTo(x-1,y-h);g.moveTo(x,y);g.lineTo(x+2,y-h*.7);g.stroke();
  }
  for(let i=0;i<100;i++){
    const x=random()*2100-1050,y=random()*1600-800;
    if(Math.abs(x-pathX(y))<65)continue;
    for(let j=0;j<10+random()*15;j++){
      const fx=x+(random()-.5)*70,fy=y+(random()-.5)*44;
      g.strokeStyle='#2c5335';g.beginPath();g.moveTo(fx,fy+4);g.lineTo(fx,fy-2);g.stroke();
      const col=['#eadbb1','#ceacda','#edce73','#e7c4ce'][i%4];
      ellipse(g,fx-1.5,fy,1.8,1.3,col);ellipse(g,fx+1.5,fy,1.8,1.3,col);ellipse(g,fx,fy-1.6,1.4,1.8,col);
      ellipse(g,fx,fy,.8,.8,'#f6d57c');
    }
  }
  for(let i=0;i<90;i++){
    const x=random()*2100-1050,y=random()*1500-750,r=3+random()*12;
    ellipse(g,x+4,y+3,r*1.3,r*.6,'#203b3445');
    ellipse(g,x,y,r,r*.65,'#626d60');ellipse(g,x-2,y-3,r*.7,r*.35,'#98a08a');
    ellipse(g,x+3,y,r*.5,r*.3,'#5c7545');
  }
  // Decorative boundary stones make the edge of the encounter visible.
  for(let i=0;i<88;i++){
    const a=i/88*Math.PI*2,x=Math.cos(a)*655,y=Math.sin(a)*455;
    ellipse(g,x+5,y+4,12,7,'#213b354a');ellipse(g,x,y,10,7,'#727c64');
    ellipse(g,x-2,y-3,7,3,'#a1a68b');
  }
  const treeImages=Array.from({length:5},()=>{
    const c=document.createElement('canvas');c.width=230;c.height=255;const t=c.getContext('2d');
    ellipse(t,135,225,76,18,'#0e282c38');
    t.fillStyle='#514736';t.beginPath();t.moveTo(100,225);t.lineTo(110,122);t.lineTo(127,122);t.lineTo(136,227);t.lineTo(116,216);t.closePath();t.fill();
    t.strokeStyle='#8c7950';t.lineWidth=3;t.beginPath();t.moveTo(115,212);t.lineTo(117,151);t.stroke();
    for(let i=0;i<48;i++){
      const a=random()*Math.PI*2,r=Math.sqrt(random())*63,x=115+Math.cos(a)*r,y=103+Math.sin(a)*r*.8;
      const radius=20+random()*15,shade=t.createRadialGradient(x-8,y-12,1,x,y,radius);
      shade.addColorStop(0,['#8caa56','#719d51','#9ab566'][i%3]);shade.addColorStop(.65,'#487a43');shade.addColorStop(1,'#2e583d');
      ellipse(t,x,y,radius,radius*.83,shade);
    }
    for(let i=0;i<90;i++){const a=random()*6.28,r=Math.sqrt(random())*68;ellipse(t,115+Math.cos(a)*r,95+Math.sin(a)*r*.7,2.5,1.3,'#b8c77d60');}
    return c;
  });
  const trees=[[-440,10],[-320,-240],[420,-90],[505,290],[-490,345],[320,-385],[-590,-350],[600,-340],[-260,440],[600,80],[-740,130],[820,-80],[-810,-480],[810,470]]
    .map(([x,y],i)=>({x,y,paint(){const [sx,sy]=worldToScreen(x,y);if(sx<-250||sx>innerWidth+250||sy<-50||sy>innerHeight+260)return;
      ctx.save();if(Math.abs(state.player.x-x)<85&&state.player.y<y&&state.player.y>y-165)ctx.globalAlpha=.45;
      ctx.drawImage(treeImages[i%5],sx-115,sy-225);ctx.restore();}}));

  function meadow(w,h){
    ctx.fillStyle='#496b38';ctx.fillRect(0,0,w,h);
    const [x,y]=worldToScreen(-1200,-950);ctx.drawImage(ground,x,y);
    // A softly glowing arrival circle beneath the meadow grass.
    const [ax,ay]=worldToScreen(0,195);ctx.save();ctx.strokeStyle='#d8e7b23b';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(ax,ay,60,28,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function glow(x,y,r,color){const light=ctx.createRadialGradient(x,y,0,x,y,r);light.addColorStop(0,color);light.addColorStop(1,'rgba(0,0,0,0)');ellipse(ctx,x,y,r,r,light);}
  function prison(w,h){
    ctx.fillStyle='#10191c';ctx.fillRect(0,0,w,h);ctx.save();const [ox,oy]=worldToScreen(0,0);ctx.translate(ox,oy);
    // The corridor spans the existing escape area, beyond the cell's north door.
    ctx.fillStyle='#242e31';ctx.fillRect(-250,-430,500,640);
    for(let row=0;row<16;row++)for(let col=0;col<9;col++){
      const x=-250+col*62-(row%2)*31,y=-430+row*41;
      ctx.save();ctx.beginPath();ctx.rect(-250,-430,500,640);ctx.clip();
      ctx.fillStyle=['#354044','#303b40','#3b4445','#323d41'][(row*3+col)%4];ctx.fillRect(x+1,y+1,59,38);
      ctx.strokeStyle='#52606355';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+2,y+37);ctx.lineTo(x+2,y+2);ctx.lineTo(x+57,y+2);ctx.stroke();
      if((row+col)%5===0){ctx.strokeStyle='#17292a80';ctx.beginPath();ctx.moveTo(x+20,y+3);ctx.lineTo(x+26,y+17);ctx.lineTo(x+20,y+25);ctx.stroke();}ctx.restore();
    }
    // Damp patches, moss, and a straw sleeping mat.
    for(let i=0;i<15;i++)ellipse(ctx,-228+(i%3)*14,-175+i*24,12,19,'#485c463c');
    ellipse(ctx,165,110,57,18,'#162b3655');
    ctx.fillStyle='#4b4938';ctx.fillRect(-215,77,73,106);
    for(let i=0;i<68;i++){const x=-212+(i*17%65),y=80+(i*23%98);ctx.strokeStyle=i%2?'#aa94565c':'#d4b96b42';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+11,y+8);ctx.stroke();}
    function wall(x,y,width,height){ctx.fillStyle='#111c21';ctx.fillRect(x+7,y+10,width,height);ctx.fillStyle='#536064';ctx.fillRect(x,y,width,height);
      ctx.fillStyle='#748080';ctx.fillRect(x,y,width,4);ctx.fillStyle='#263239';ctx.fillRect(x,y+height-9,width,9);
      ctx.strokeStyle='#27363b';for(let xx=x+32;xx<x+width;xx+=42){ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+height-9);ctx.stroke();}}
    wall(-277,-235,214,40);wall(64,-235,213,40);wall(-277,-235,27,460);wall(250,-235,27,460);wall(-277,210,554,29);
    // Door posts and a sliding iron grate. Open state exposes the passage.
    wall(-70,-235,12,53);wall(58,-235,12,53);
    if(!state.doorOpen){ctx.fillStyle='#101d24';ctx.fillRect(-57,-214,114,13);for(let x=-52;x<=52;x+=17){ctx.fillStyle='#18262e';ctx.fillRect(x,-218,5,73);ctx.fillStyle='#809091';ctx.fillRect(x,-218,1,73);}ctx.fillStyle='#35454a';ctx.fillRect(-57,-161,114,5);ctx.fillStyle='#c0a268';ctx.fillRect(35,-187,13,16);ellipse(ctx,41,-180,2,3,'#242d2b');}
    else {ctx.fillStyle='#bacac133';ctx.fillRect(-54,-221,108,6);}
    for(const tx of [-175,175]){
      const ty=-213,flame=1+Math.sin(performance.now()/170+tx)*.1;
      glow(tx,ty+27,170,'rgba(242,158,65,0.17)');
      ctx.fillStyle='#211f1b';ctx.fillRect(tx-4,ty+4,8,25);ctx.fillStyle='#826642';ctx.fillRect(tx-8,ty+2,16,5);
      ellipse(ctx,tx,ty-3,6*flame,13*flame,'#e79040');ellipse(ctx,tx-1,ty,3,8,'#ffe4a0');
    }
    // Chains at the north wall.
    ctx.strokeStyle='#82908a';ctx.lineWidth=1.5;for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(-115,-194+i*6,3,5,0,0,Math.PI*2);ctx.stroke();}
    for(const item of state.items.filter(i=>!i.taken)){
      const {x,y}=item;
      if(item.kind==='meal'){
        ellipse(ctx,x,y+9,30,11,'#09141880');ctx.fillStyle='#786347';ctx.fillRect(x-26,y-13,52,27);ctx.strokeStyle='#baa17b';ctx.strokeRect(x-24,y-11,48,23);
        ellipse(ctx,x-7,y,13,8,'#aba18a');ellipse(ctx,x-7,y-1,10,5,'#66533e');ellipse(ctx,x+14,y,7,5,'#b18a51');
        ctx.fillStyle='#d1ccc0';ctx.fillRect(x+20,y-7,2,16);
      } else {
        const pulse=Math.sin(performance.now()/420)*3;glow(x,y,48+pulse,'rgba(231,56,108,0.32)');
        ellipse(ctx,x,y+19,17,5,'#090d1e70');
        ctx.fillStyle='#d84479';ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+12,y-2);ctx.lineTo(x,y+19);ctx.lineTo(x-12,y-2);ctx.closePath();ctx.fill();
        ctx.fillStyle='#ffb0c3';ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+3,y-2);ctx.lineTo(x-12,y-2);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#f694b4';ctx.stroke();
      }
    }
    ctx.restore();
  }
  function atmosphere(w,h){
    if(state.scene==='meadow'){
      const time=performance.now()/1000;ctx.save();
      for(let i=0;i<26;i++){const [x,y]=worldToScreen(Math.sin(i*18.4)*730+Math.sin(time*.2+i)*22,Math.cos(i*7.3)*500+Math.sin(time*.4+i)*15);ellipse(ctx,x,y,1.3,1.3,'#f3eac76a');}
      ctx.restore();
    }
    const v=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.28,w/2,h/2,Math.max(w,h)*.7);
    v.addColorStop(0,'#081c2200');v.addColorStop(1,state.scene==='meadow'?'#102d304d':'#060d19b0');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
  }
  return {meadow,prison,trees,atmosphere,ellipse};
})();
