(() => {
/* -------------------------------------------------------------
   Cinemática: llegada a la base lunar (~19 s)
   Integración: "Siguiente" emite window 'llegada:siguiente' y un
   postMessage {type:'llegada-fin'} al contenedor.
   El astronauta lleva el visor cerrado, así sirve para cualquier avatar.
   ------------------------------------------------------------- */
const stage=document.getElementById('stage'), cv=document.getElementById('c'), ctx=cv.getContext('2d');
const W=1280,H=720; let dpr=1;
function resize(){ dpr=Math.min(2,devicePixelRatio||1); cv.width=W*dpr; cv.height=H*dpr; stage.style.setProperty('--s',stage.clientWidth/W); }
addEventListener('resize',resize); resize();

const P={navy:'#0B0F3A',pink:'#E8418C',aqua:'#6FE3E8',cyan:'#21C1E0',amber:'#FFB547',coral:'#FF7A5C',white:'#E8E9F2'};
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const easeOut=k=>1-Math.pow(1-k,3);
const lerp=(a,b,k)=>a+(b-a)*k;
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,TAU);}
function ell(x,y,rx,ry,rot=0){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,TAU);}

/* ---------------- Línea de tiempo ---------------- */
const END=19;
const GY=600;                       // nivel del suelo
const RX=430;                       // cohete
const DOOR={x:405,y:468,w:50,h:72}; // escotilla del cohete
const BD={x:762,y:528,w:52,h:72};   // puerta de la base
const HOPS_START=8.6, HOPS_END=13.0, X_START=RX+44, X_DOOR=BD.x+BD.w/2;

let T=0, A=0, playing=true, ended=false;

/* ---------------- Fondo precalculado ---------------- */
const R=rng(7), stars=[]; for(let i=0;i<300;i++) stars.push({x:R()*W*1.4-100,y:R()*470,r:R()<.9?R()*1.2+.3:R()*1.6+1.1,p:R()*TAU,sp:.5+R()*2});
const R3=rng(99);
function ridge(y0,amp,step,f){const p=[];for(let x=-300;x<=1700;x+=step)p.push([x,y0+Math.sin(x*.0055+f)*amp+Math.sin(x*.019+f*2)*amp*.4+(R3()-.5)*amp*.4]);return p;}
const farR=ridge(450,26,30,1), midR=ridge(540,10,40,3);
const rocks=[]; {const r=rng(12); for(let i=0;i<26;i++) rocks.push({x:r()*1600-150,y:GY+10+r()*110,s:4+r()*12});}
const dustBase=[]; {const r=rng(44); for(let i=0;i<120;i++) dustBase.push([700+r()*360,470+r()*130,r()*2+.6]);}
const parts=[];
function puff(x,y,n){ for(let i=0;i<n;i++){ const a=Math.PI+Math.random()*Math.PI; parts.push({x,y,vx:Math.cos(a)*(20+Math.random()*50),vy:Math.sin(a)*(10+Math.random()*30),life:1+Math.random(),age:0,r:1.5+Math.random()*2.5}); } }

/* ---------------- Escenario ---------------- */
function fillRidge(pts,fill,edge,ew){
  ctx.beginPath(); ctx.moveTo(pts[0][0],H+300); for(const p of pts) ctx.lineTo(p[0],p[1]); ctx.lineTo(pts[pts.length-1][0],H+300); ctx.closePath(); ctx.fillStyle=fill; ctx.fill();
  if(edge){ ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.strokeStyle=edge; ctx.lineWidth=ew; ctx.stroke(); }
}
function drawSky(){
  ctx.fillStyle='#03041a'; ctx.fillRect(-400,-200,2200,1200);
  for(const s of stars){ ctx.globalAlpha=.5+.5*Math.sin(A*s.sp+s.p); ctx.fillStyle=s.r>1.6?'#FFE9C2':P.white; circle(s.x,s.y,s.r); ctx.fill(); } ctx.globalAlpha=1;
  // la Tierra, baja en el horizonte
  circle(1160,385,26); ctx.fillStyle='#2f6fd0'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle='#3fae6a'; ell(1152,380,11,7); ctx.fill(); ell(1168,394,6,4); ctx.fill(); ctx.fillStyle='rgba(3,4,26,.7)'; ctx.fillRect(1168,350,40,80); ctx.restore();
  const at=ctx.createRadialGradient(1160,385,24,1160,385,40); at.addColorStop(0,'rgba(111,227,232,.4)'); at.addColorStop(1,'rgba(111,227,232,0)'); ctx.fillStyle=at; circle(1160,385,40); ctx.fill();
  // Sol rasante a la izquierda
  const sg=ctx.createRadialGradient(-20,460,0,-20,460,460); sg.addColorStop(0,'rgba(255,214,150,.42)'); sg.addColorStop(1,'rgba(255,181,71,0)'); ctx.fillStyle=sg; ctx.fillRect(-400,0,900,H);
  circle(-10,455,20); ctx.fillStyle='#FFF4D6'; ctx.fill();
}
function drawGround(){
  const eg=ctx.createLinearGradient(-300,0,1700,0); eg.addColorStop(0,'rgba(255,232,190,1)'); eg.addColorStop(.6,'rgba(255,232,190,.4)'); eg.addColorStop(1,'rgba(255,232,190,.12)');
  fillRidge(farR,'#202247',eg,3);
  fillRidge(midR,'#2a2c55',eg,2);
  const g=ctx.createLinearGradient(0,GY-30,0,H+100); g.addColorStop(0,'#45476f'); g.addColorStop(1,'#25274b');
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(-300,GY-4); ctx.quadraticCurveTo(300,GY-12,700,GY); ctx.quadraticCurveTo(1100,GY+6,1700,GY-6); ctx.lineTo(1700,H+200); ctx.lineTo(-300,H+200); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(255,232,190,.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-300,GY-4); ctx.quadraticCurveTo(300,GY-12,700,GY); ctx.quadraticCurveTo(1100,GY+6,1700,GY-6); ctx.stroke();
  // cráter pequeño en primer plano
  ell(200,670,120,20); ctx.fillStyle='#0a0b22'; ctx.fill(); ctx.strokeStyle='rgba(225,220,240,.45)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(200,670,120,20,0,Math.PI,TAU); ctx.stroke();
  for(const r of rocks){ ctx.fillStyle='rgba(0,0,0,.4)'; ell(r.x+r.s*1.6,r.y+1,r.s*1.8,r.s*.25); ctx.fill(); ctx.fillStyle='#5a5c80'; ell(r.x,r.y-r.s*.3,r.s,r.s*.55); ctx.fill(); ctx.fillStyle='rgba(255,232,190,.35)'; ell(r.x-r.s*.35,r.y-r.s*.5,r.s*.4,r.s*.2); ctx.fill(); }
}
function longShadow(x0,x1,len,y=GY,a=.5){ ctx.fillStyle=`rgba(0,0,0,${a})`; ctx.beginPath(); ctx.moveTo(x0,y-2); ctx.lineTo(x1+len,y-4); ctx.lineTo(x1+len+10,y+10); ctx.lineTo(x0,y+8); ctx.closePath(); ctx.fill(); }

/* ---------------- Base lunar (oscura, sin energía) ---------------- */
function drawBase(doorOpen,panelOn,flick){
  longShadow(720,1040,380,GY,.55);
  // panel solar cubierto de polvo
  ctx.strokeStyle='#5d5f7c'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(1080,GY); ctx.lineTo(1080,GY-70); ctx.stroke();
  ctx.save(); ctx.translate(1080,GY-78); ctx.rotate(-.3); rr(-50,-22,100,44,4); ctx.fillStyle='#2c3060'; ctx.fill(); ctx.strokeStyle='#55587e'; ctx.lineWidth=2; ctx.stroke();
  ctx.strokeStyle='rgba(85,88,126,.7)'; for(let i=-25;i<50;i+=25){ctx.beginPath();ctx.moveTo(i,-22);ctx.lineTo(i,22);ctx.stroke();} ctx.beginPath();ctx.moveTo(-50,0);ctx.lineTo(50,0);ctx.stroke();
  ctx.fillStyle='rgba(160,160,180,.35)'; ctx.fillRect(-50,-22,100,44); ctx.restore();
  // módulo con la puerta
  const mg=ctx.createLinearGradient(720,0,900,0); mg.addColorStop(0,'#55577a'); mg.addColorStop(1,'#2f3150');
  rr(720,516,190,84,16); ctx.fillStyle=mg; ctx.fill(); ctx.strokeStyle='rgba(20,20,50,.35)'; ctx.lineWidth=2; ctx.stroke();
  // cúpula principal
  const dg=ctx.createRadialGradient(880,480,10,930,560,150); dg.addColorStop(0,'#6e7090'); dg.addColorStop(1,'#2a2c48');
  ctx.beginPath(); ctx.arc(940,GY,125,Math.PI,0); ctx.closePath(); ctx.fillStyle=dg; ctx.fill();
  ctx.strokeStyle='rgba(15,15,45,.35)'; ctx.lineWidth=3; [95,62,30].forEach(r=>{ctx.beginPath();ctx.arc(940,GY,r,Math.PI,0);ctx.stroke();});
  ctx.beginPath(); ctx.moveTo(940,GY-125); ctx.lineTo(940,GY); ctx.stroke();
  // ventanas apagadas (y un parpadeo final muy débil)
  [[880,540],[1000,540],[940,505]].forEach(([x,y],i)=>{ circle(x,y,12); ctx.fillStyle='#0d0f2c'; ctx.fill(); ctx.strokeStyle='#55587e'; ctx.lineWidth=3; ctx.stroke();
    if(flick>0 && i===2){ ctx.fillStyle=`rgba(111,227,232,${flick})`; circle(x,y,10); ctx.fill(); } });
  [[748,548],[848,548]].forEach(([x,y])=>{ circle(x,y,7); ctx.fillStyle='#0d0f2c'; ctx.fill(); });
  // antena
  ctx.strokeStyle='#7c7e9c'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(940,GY-125); ctx.lineTo(940,GY-185); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(928,GY-165,18,7,-.6,0,Math.PI); ctx.stroke();
  // letrero
  ctx.font='700 13px "Space Mono", monospace'; ctx.fillStyle='rgba(200,200,220,.45)'; ctx.textAlign='center'; ctx.fillText('LUNIA',840,532);
  // puerta (se abre hacia arriba)
  rr(BD.x-4,BD.y-4,BD.w+8,BD.h+4,10); ctx.fillStyle='#2b2d4c'; ctx.fill();
  ctx.fillStyle='#020210'; ctx.fillRect(BD.x,BD.y,BD.w,BD.h);
  const dh=BD.h*(1-doorOpen);
  if(dh>0){ ctx.save(); ctx.beginPath(); ctx.rect(BD.x,BD.y,BD.w,BD.h); ctx.clip();
    const pg=ctx.createLinearGradient(BD.x,0,BD.x+BD.w,0); pg.addColorStop(0,'#5d5f80'); pg.addColorStop(1,'#43456a');
    ctx.fillStyle=pg; ctx.fillRect(BD.x,BD.y+BD.h-dh,BD.w,dh);
    ctx.strokeStyle='rgba(15,15,45,.5)'; ctx.lineWidth=2; for(let y=BD.y+BD.h-dh+12;y<BD.y+BD.h;y+=14){ctx.beginPath();ctx.moveTo(BD.x+4,y);ctx.lineTo(BD.x+BD.w-4,y);ctx.stroke();}
    ctx.restore(); }
  // panel de la puerta
  rr(BD.x+BD.w+8,BD.y+22,12,18,3); ctx.fillStyle='#1a1c3f'; ctx.fill();
  circle(BD.x+BD.w+14,BD.y+31,3); ctx.fillStyle=panelOn?P.aqua:'rgba(255,90,80,.35)'; if(panelOn){ctx.shadowColor=P.aqua;ctx.shadowBlur=10;} ctx.fill(); ctx.shadowBlur=0;
  // polvo encima de todo
  ctx.fillStyle='rgba(190,190,210,.3)'; for(const d of dustBase){ ctx.fillRect(d[0],d[1],d[2],d[2]); }
  ell(900,GY+2,210,9); ctx.fillStyle='rgba(110,112,144,.45)'; ctx.fill();
}

/* ---------------- Cohete aterrizado ---------------- */
function drawRocket(hatch){
  longShadow(RX-60,RX+60,300,GY,.5);
  // patas
  ctx.strokeStyle='#C9CFE6'; ctx.lineWidth=7; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(RX-40,540); ctx.lineTo(RX-80,GY-2); ctx.moveTo(RX+40,540); ctx.lineTo(RX+80,GY-2); ctx.stroke();
  ctx.fillStyle='#8b8fae'; ell(RX-82,GY,14,4); ctx.fill(); ell(RX+82,GY,14,4); ctx.fill();
  // aletas
  ctx.fillStyle=P.pink;
  ctx.beginPath(); ctx.moveTo(RX-52,470); ctx.lineTo(RX-96,560); ctx.lineTo(RX-52,548); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(RX+52,470); ctx.lineTo(RX+96,560); ctx.lineTo(RX+52,548); ctx.closePath(); ctx.fill();
  // tobera
  ctx.fillStyle='#4a4d72'; ctx.beginPath(); ctx.moveTo(RX-26,556); ctx.lineTo(RX+26,556); ctx.lineTo(RX+34,576); ctx.lineTo(RX-34,576); ctx.closePath(); ctx.fill();
  // cuerpo
  const bg=ctx.createLinearGradient(RX-56,0,RX+56,0); bg.addColorStop(0,'#FFFFFF'); bg.addColorStop(.55,'#E3E6F5'); bg.addColorStop(1,'#A8ADCB');
  ctx.beginPath(); ctx.moveTo(RX,300); ctx.bezierCurveTo(RX+50,340,RX+58,400,RX+56,470); ctx.lineTo(RX+52,558); ctx.lineTo(RX-52,558); ctx.lineTo(RX-56,470); ctx.bezierCurveTo(RX-58,400,RX-50,340,RX,300); ctx.closePath();
  ctx.fillStyle=bg; ctx.fill();
  // punta rosada
  ctx.save(); ctx.clip(); ctx.fillStyle=P.pink; ctx.fillRect(RX-60,290,120,48); ctx.fillStyle=P.aqua; ctx.fillRect(RX-60,338,120,6); ctx.restore();
  // ventanita
  circle(RX,392,17); ctx.fillStyle='#2b2d4c'; ctx.fill(); circle(RX,392,12); const wg=ctx.createRadialGradient(RX-4,388,1,RX,392,12); wg.addColorStop(0,'#BFF7FA'); wg.addColorStop(1,P.cyan); ctx.fillStyle=wg; ctx.fill();
  // polvo en la base del cohete
  ctx.fillStyle='rgba(150,150,175,.35)'; ctx.fillRect(RX-52,540,104,18);
  // escotilla: interior iluminado + puerta que gira sobre su bisagra izquierda
  const d=DOOR;
  rr(d.x-3,d.y-3,d.w+6,d.h+6,12); ctx.fillStyle='#8b8fae'; ctx.fill();
  if(hatch>0){
    rr(d.x,d.y,d.w,d.h,10); const ig=ctx.createLinearGradient(0,d.y,0,d.y+d.h); ig.addColorStop(0,'#FFE7B8'); ig.addColorStop(1,'#FFB547'); ctx.fillStyle=ig; ctx.fill();
    // luz que sale de la escotilla
    const lg=ctx.createRadialGradient(d.x+d.w/2,d.y+d.h,5,d.x+d.w/2,d.y+d.h,150); lg.addColorStop(0,`rgba(255,214,150,${.35*hatch})`); lg.addColorStop(1,'rgba(255,214,150,0)');
    ctx.fillStyle=lg; ctx.beginPath(); ctx.moveTo(d.x,d.y+d.h*.2); ctx.lineTo(d.x+d.w,d.y+d.h*.2); ctx.lineTo(d.x+d.w+120,GY+40); ctx.lineTo(d.x-80,GY+40); ctx.closePath(); ctx.fill();
  }
  const dw=d.w*(1-hatch*.92);
  rr(d.x,d.y,dw,d.h,10); ctx.fillStyle=hatch>0?'#C3C8E0':'#DADDF0'; ctx.fill(); ctx.strokeStyle='#8b8fae'; ctx.lineWidth=2; ctx.stroke();
  if(dw>14){ circle(d.x+dw-9,d.y+d.h/2,3); ctx.fillStyle='#6b6f93'; ctx.fill(); }
  // escalera
  ctx.strokeStyle='#9aa0c4'; ctx.lineWidth=3;
  const lx1=d.x+12, lx2=d.x+d.w-12;
  ctx.beginPath(); ctx.moveTo(lx1,d.y+d.h); ctx.lineTo(lx1-4,GY); ctx.moveTo(lx2,d.y+d.h); ctx.lineTo(lx2+4,GY); ctx.stroke();
  ctx.lineWidth=2; for(let y=d.y+d.h+12;y<GY;y+=13){ const k=(y-d.y-d.h)/(GY-d.y-d.h); ctx.beginPath(); ctx.moveTo(lx1-4*k,y); ctx.lineTo(lx2+4*k,y); ctx.stroke(); }
}

/* ---------------- Astronauta ---------------- */
// view: 'right' | 'front' | 'back' ; walk: fase de pasos ; wave: 0..1 ; lamp: 0..1
function drawAstro(x,y,s,view,walk=0,wave=0,lamp=0,alpha=1,climb=0){
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(x,y); ctx.scale(s,s);
  const suit='#F2F3FA', suitD='#C9CCE0';
  // haz de la linterna del casco
  if(lamp>0 && view==='right'){
    const g=ctx.createLinearGradient(10,-66,240,-20); g.addColorStop(0,`rgba(255,240,200,${.45*lamp})`); g.addColorStop(1,'rgba(255,240,200,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(10,-70); ctx.lineTo(250,-120); ctx.lineTo(250,40); ctx.closePath(); ctx.fill();
  }
  const legA=Math.sin(walk)*6, legB=-legA;
  // mochila (detrás)
  if(view==='right'){ rr(-24,-60,12,30,5); ctx.fillStyle=suitD; ctx.fill(); }
  if(view==='back'){ rr(-15,-60,30,32,7); ctx.fillStyle=suitD; ctx.fill(); }
  // piernas y botas
  const leg=(dx,off)=>{ rr(dx+off*.3,-32,10,25,5); ctx.fillStyle=suit; ctx.fill(); rr(dx+off-1,-9,13,9,4); ctx.fillStyle='#8b8fae'; ctx.fill(); };
  if(view==='back' && climb){ leg(-11,Math.sin(climb)*4); leg(1,-Math.sin(climb)*4); }
  else { leg(-11,view==='right'?legB:0); leg(1,view==='right'?legA:0); }
  // cuerpo
  rr(-16,-58,32,32,11); ctx.fillStyle=suit; ctx.fill();
  ctx.fillStyle=P.pink; ctx.fillRect(-16,-34,32,5);
  if(view!=='back'){ rr(view==='right'?2:-6,-52,11,9,3); ctx.fillStyle=P.aqua; ctx.fill(); }
  if(view==='back'){ rr(-15,-60,30,32,7); ctx.fillStyle=suitD; ctx.fill(); rr(-9,-54,18,8,3); ctx.fillStyle=P.aqua; ctx.fill(); }
  // brazos
  const arm=(sx,ang)=>{ ctx.save(); ctx.translate(sx,-53); ctx.rotate(ang); rr(-5,0,10,24,5); ctx.fillStyle=suit; ctx.fill(); circle(0,25,5.5); ctx.fillStyle='#8b8fae'; ctx.fill(); ctx.restore(); };
  if(view==='right'){ arm(-4,Math.sin(walk)*.5+.1); arm(6,-Math.sin(walk)*.5-.1); }
  else if(view==='back'){ const c=climb?Math.sin(climb)*.5:0; arm(-14,Math.PI-.25+c); arm(14,Math.PI+.25-c); }
  else { arm(-15,.25); arm(15,-.25 - wave*(2.4+Math.sin(A*10)*.35)); }
  // casco
  circle(0,-70,16); ctx.fillStyle=suit; ctx.fill(); ctx.strokeStyle=suitD; ctx.lineWidth=2; ctx.stroke();
  if(view!=='back'){
    const vx=view==='right'?5:0;
    ell(vx,-70,view==='right'?9.5:11,9.5); const vg=ctx.createLinearGradient(vx-10,-80,vx+10,-60); vg.addColorStop(0,'#FFB547'); vg.addColorStop(.45,'#A0279E'); vg.addColorStop(1,'#1E1B6E'); ctx.fillStyle=vg; ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.7)'; ell(vx-3,-75,3.5,2,-.5); ctx.fill();
  }
  // linterna del casco
  if(view!=='back'){ circle(view==='right'?12:9,-83,3); ctx.fillStyle=lamp>0?'#FFF4D6':'#8b8fae'; if(lamp>0){ctx.shadowColor='#FFE7B8';ctx.shadowBlur=12;} ctx.fill(); ctx.shadowBlur=0; }
  ctx.restore();
}
function astroShadow(x,y,s,h=0){ ctx.fillStyle=`rgba(0,0,0,${.45*(1-h/40)})`; ctx.beginPath(); ctx.moveTo(x-8*s,y); ctx.lineTo(x+(150+h*3)*s,y-3); ctx.lineTo(x+(150+h*3)*s,y+4); ctx.lineTo(x-8*s,y+5); ctx.closePath(); ctx.fill(); }

/* ---------------- Estado del astronauta según T ---------------- */
function astroState(T){
  const S=.88;
  if(T<4.5) return null;
  if(T<6.6){ // sale de la escotilla y saluda
    const k=easeOut(seg(T,4.5,5.3));
    return {x:DOOR.x+DOOR.w/2, y:DOOR.y+DOOR.h, s:S*lerp(.75,1,k), view:'front', wave:seg(T,5.4,5.7)*(1-seg(T,6.3,6.6)), alpha:k, inDoor:true};
  }
  if(T<8.6){ // baja por la escalera
    const k=ease(seg(T,6.8,8.4));
    return {x:DOOR.x+DOOR.w/2, y:lerp(DOOR.y+DOOR.h,GY,k), s:S, view:'back', climb:(T-6.8)*9, alpha:1};
  }
  if(T<HOPS_END){ // saltitos con poca gravedad hacia la base
    const k=seg(T,HOPS_START,HOPS_END), N=5, ph=k*N, hop=ph%1;
    const x=lerp(X_START-6,X_DOOR,ease(k)*.15+k*.85);
    const h=Math.sin(hop*Math.PI)*22;
    return {x, y:GY-h, s:S, view:'right', walk:ph*Math.PI*2, lamp:seg(T,9.0,9.6), alpha:1, h};
  }
  if(T<14.6) return {x:X_DOOR, y:GY, s:S, view:T<13.4?'right':'back', lamp:1, alpha:1};
  if(T<16.2){ // entra en la base
    const k=seg(T,14.6,16.2);
    return {x:X_DOOR, y:GY-k*6, s:S*lerp(1,.78,k), view:'back', walk:k*12, alpha:1-k*.9, enter:true};
  }
  return null;
}

/* ---------------- Audio (sintetizado, suave) ---------------- */
let ac=null, master, sndOn=true, noiseBuf;
function initAudio(){
  if(ac) return; try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  master=ac.createGain(); master.gain.value=sndOn?.7:0; master.connect(ac.destination);
  noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  // colchón misterioso
  const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=600; const pg=ac.createGain(); pg.gain.value=0; lp.connect(pg).connect(master);
  [110,164.81,207.65].forEach((f,i)=>{ const o=ac.createOscillator(); o.type=i?'triangle':'sawtooth'; o.frequency.value=f; o.detune.value=(i-1)*6; const g=ac.createGain(); g.gain.value=.05; o.connect(g).connect(lp); o.start(); });
  pg.gain.setTargetAtTime(.5,ac.currentTime,1.5);
}
function tone(f,dur,vol,type='sine',f2){ if(!ac) return; const t=ac.currentTime, o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+dur); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g).connect(master); o.start(t); o.stop(t+dur+.05); }
function hiss(dur,vol,f=3000){ if(!ac) return; const t=ac.currentTime, s=ac.createBufferSource(); s.buffer=noiseBuf; const fl=ac.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=f; const g=ac.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.05); g.gain.exponentialRampToValueAtTime(.0001,t+dur); s.connect(fl).connect(g).connect(master); s.start(t); s.stop(t+dur); }
const SFX={ hatch(){ hiss(.9,.25,2500); tone(320,.25,.06,'square',200); }, step(){ tone(70,.25,.25,'sine',45); }, beep(){ tone(880,.1,.06); setTimeout(()=>tone(1320,.14,.06),120); },
  door(){ hiss(1.1,.2,1500); tone(140,1,.08,'sawtooth',90); }, close(){ tone(90,.4,.2,'sine',50); hiss(.3,.15,800); }, flick(){ tone(660,.6,.03,'triangle'); } };

/* ---------------- Eventos ---------------- */
const EVENTS=[ {t:3.2,fn:SFX.hatch}, {t:13.5,fn:SFX.beep}, {t:13.8,fn:SFX.door}, {t:16.3,fn:SFX.close}, {t:17.6,fn:SFX.flick} ];
for(let i=0;i<5;i++){ const t=HOPS_START+(i+1)*(HOPS_END-HOPS_START)/5; EVENTS.push({t, fn:()=>{ SFX.step(); const st=astroState(t-.001); if(st) puff(st.x,GY,10); }}); }
EVENTS.push({t:8.45,fn:()=>{ SFX.step(); puff(DOOR.x+DOOR.w/2,GY,12); }});
function fire(t0,t1){ for(const e of EVENTS) if(e.t>t0&&e.t<=t1) e.fn(); }

/* ---------------- Render ---------------- */
function render(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  // cámara: plano general, luego se acerca siguiendo al astronauta hasta la puerta
  const k1=ease(seg(T,0,4)), k2=ease(seg(T,8.6,14));
  const z=lerp(.92,1.0,k1)+.38*k2;
  const fx=lerp(lerp(700,660,k1),760,k2), fy=lerp(450,470,k1)+50*k2;
  ctx.save(); ctx.translate(640,380); ctx.scale(z,z); ctx.translate(-fx,-fy);
  drawSky(); drawGround();
  const st=astroState(T);
  const doorOpen=ease(seg(T,13.8,14.6))*(1-ease(seg(T,16.2,16.9)));
  const flick=T>17.4 ? (Math.random()<.5?.12:.03)*(1-seg(T,18.4,18.9)) : 0;
  drawBase(doorOpen, T>13.5 && T<17, flick);
  drawRocket(ease(seg(T,3.2,4.4)));
  // luz de la linterna sobre la base
  if(st && st.lamp>0 && st.view==='right'){ const g=ctx.createRadialGradient(st.x+180,GY-60,10,st.x+180,GY-60,170); g.addColorStop(0,`rgba(255,240,200,${.16*st.lamp})`); g.addColorStop(1,'rgba(255,240,200,0)'); ctx.fillStyle=g; ctx.fillRect(st.x,GY-250,400,300); }
  if(st){
    if(!st.inDoor) astroShadow(st.x,GY,st.s,st.h||0);
    if(st.inDoor){ ctx.save(); rr(DOOR.x,DOOR.y,DOOR.w,DOOR.h+40,10); ctx.clip(); }
    if(st.enter){ ctx.save(); ctx.beginPath(); ctx.rect(BD.x,BD.y,BD.w,BD.h); ctx.clip(); }
    drawAstro(st.x,st.y,st.s,st.view,st.walk||0,st.wave||0,st.lamp||0,st.alpha,st.climb||0);
    if(st.inDoor||st.enter) ctx.restore();
  }
  // partículas de polvo
  for(const p of parts){ ctx.fillStyle=`rgba(190,190,210,${.6*(1-p.age/p.life)})`; circle(p.x,p.y,p.r); ctx.fill(); }
  ctx.restore();
  // rótulo
  const s='POLO SUR LUNAR · BASE LUNIA · SIN ENERGÍA', n=Math.floor(clamp((T-.6)*28,0,s.length));
  ctx.globalAlpha=1-seg(T,5,6); ctx.font='700 20px "Space Mono", monospace'; ctx.textAlign='left'; ctx.fillStyle=P.aqua; ctx.shadowColor=P.aqua; ctx.shadowBlur=10;
  ctx.fillText(s.slice(0,n),40,56); ctx.shadowBlur=0; ctx.globalAlpha=1;
  // viñeta y fundidos
  const vg=ctx.createRadialGradient(640,360,280,640,360,820); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  const fade=Math.max(1-seg(T,0,1.2), seg(T,18.6,END)*.65);
  if(fade>0){ ctx.fillStyle=`rgba(0,0,0,${fade})`; ctx.fillRect(0,0,W,H); }
}

/* ---------------- Bucle ---------------- */
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; A+=dt;
  if(playing && !ended){ const nt=Math.min(END,T+dt); fire(T,nt); T=nt; if(T>=END) finish(); }
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.age+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=12*dt; if(p.age>p.life) parts.splice(i,1); }  // poca gravedad: el polvo cae lento
  render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function finish(){ ended=true; document.getElementById('end').classList.add('on'); document.getElementById('bSkip').style.display='none'; }
function restart(){ T=0; ended=false; parts.length=0; document.getElementById('end').classList.remove('on'); document.getElementById('bSkip').style.display=''; }
// El navegador solo deja sonar el audio después de un toque: se activa en el primer clic
function unlockAudio(){ initAudio(); if(ac&&ac.state==='suspended') ac.resume().catch(()=>{}); }
initAudio(); stage.addEventListener('pointerdown',unlockAudio); addEventListener('keydown',unlockAudio);
document.getElementById('bSnd').onclick=()=>{ sndOn=!sndOn; document.getElementById('bSnd').setAttribute('aria-pressed',sndOn); unlockAudio(); if(master) master.gain.setTargetAtTime(sndOn?.7:0,ac.currentTime,.05); };
document.getElementById('bSkip').onclick=()=>{ T=END; finish(); };
document.getElementById('bAgain').onclick=restart;
document.getElementById('bNext').onclick=()=>{ dispatchEvent(new CustomEvent('llegada:siguiente')); try{ if(parent!==window) parent.postMessage({type:'llegada-fin'},'*'); }catch(e){} };
})();
