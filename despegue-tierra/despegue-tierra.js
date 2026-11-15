(() => {
/* -------------------------------------------------------------
   Cinemática: el cadete sube al cohete (~15 s) y se detiene antes
   del despegue. "Siguiente" emite window 'despegue:siguiente' y un
   postMessage {type:'despegue-siguiente'} al contenedor.
   El cadete no lleva casco (lo lleva bajo el brazo): cuando tengan
   el avatar del test, se puede cambiar el color de piel y pelo en AVATAR.
   ------------------------------------------------------------- */
const AVATAR={piel:'#C68863', pielSombra:'#A96F50', pelo:'#2A1830'};
const MENSAJE='Espera, aún no puedes arrancar, hay algo que debes hacer antes...';

const stage=document.getElementById('stage'), cv=document.getElementById('c'), ctx=cv.getContext('2d');
const W=1280,H=720; let dpr=1;
function resize(){ dpr=Math.min(2,devicePixelRatio||1); cv.width=W*dpr; cv.height=H*dpr; stage.style.setProperty('--s',stage.clientWidth/W); }
addEventListener('resize',resize); resize();

const P={navy:'#0B0F3A',indigo:'#1E1B6E',pink:'#E8418C',magenta:'#A0279E',aqua:'#6FE3E8',cyan:'#21C1E0',amber:'#FFB547',coral:'#FF7A5C',white:'#E8E9F2'};
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
function line(x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}

/* ---------------- Escena ---------------- */
const GY=612;                 // suelo
const PADY=592;               // parte de arriba de la plataforma
const RX=790;                 // centro del cohete
const DOOR={x:765,y:430,w:50,h:74};
const DECK=DOOR.y+DOOR.h;     // altura del puente de acceso
const TW={x:600,w:56,top:300};// torre de lanzamiento
const ELX=TW.x+TW.w/2;        // centro del ascensor
const FREEZE=14.8;

let T=0, A=0, frozen=false;

const R=rng(4), stars=[]; for(let i=0;i<160;i++) stars.push({x:R()*W,y:R()*300,r:R()*1.2+.3,p:R()*TAU,sp:.6+R()*2});
// público a lo lejos (en dos graderías)
const crowd=[]; {const r=rng(11), cols=[P.pink,P.aqua,P.amber,P.coral,'#9B7BFF','#3FD17A','#FFFFFF'];
  for(const [x0,x1] of [[40,420],[1000,1250]]) for(let row=0;row<3;row++) for(let x=x0+row*6;x<x1;x+=15+r()*5)
    crowd.push({x, y:528+row*13, row, col:cols[Math.floor(r()*cols.length)], skin:['#C68863','#8D5A3B','#E0B08A','#6B3F2A'][Math.floor(r()*4)], ph:r()*TAU, sp:5+r()*4}); }
const smoke=[], sparks=[], confetti=[];

/* ---------------- Fondo ---------------- */
function drawSky(){
  const g=ctx.createLinearGradient(0,0,0,GY); g.addColorStop(0,'#0B0F3A'); g.addColorStop(.45,'#1E1B6E'); g.addColorStop(.75,'#A0279E'); g.addColorStop(1,'#FF7A5C');
  ctx.fillStyle=g; ctx.fillRect(-300,-200,1900,GY+200);
  for(const s of stars){ ctx.globalAlpha=(.3+.7*Math.max(0,Math.sin(A*s.sp+s.p)))*(1-s.y/320); ctx.fillStyle=P.white; circle(s.x,s.y,s.r); ctx.fill(); } ctx.globalAlpha=1;
  // la Luna: el destino
  const mx=1090,my=120,mr=40;
  const gl=ctx.createRadialGradient(mx,my,mr*.9,mx,my,mr*2); gl.addColorStop(0,'rgba(230,225,255,.35)'); gl.addColorStop(1,'rgba(230,225,255,0)'); ctx.fillStyle=gl; circle(mx,my,mr*2); ctx.fill();
  circle(mx,my,mr); const mg=ctx.createRadialGradient(mx-12,my-12,4,mx,my,mr); mg.addColorStop(0,'#F4F4FA'); mg.addColorStop(1,'#A9AAC4'); ctx.fillStyle=mg; ctx.fill();
  ctx.fillStyle='rgba(110,112,150,.35)'; circle(mx-12,my-6,9); ctx.fill(); circle(mx+10,my+12,6); ctx.fill(); circle(mx+14,my-14,5); ctx.fill();
  // colinas lejanas
  ctx.fillStyle='#4a2a7a'; ctx.beginPath(); ctx.moveTo(-300,GY-40); for(let x=-300;x<=1600;x+=60) ctx.lineTo(x,GY-60-Math.abs(Math.sin(x*.006))*50); ctx.lineTo(1600,GY); ctx.lineTo(-300,GY); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#2e1f5e'; ctx.beginPath(); ctx.moveTo(-300,GY-20); for(let x=-300;x<=1600;x+=50) ctx.lineTo(x,GY-30-Math.abs(Math.sin(x*.011+1))*26); ctx.lineTo(1600,GY); ctx.lineTo(-300,GY); ctx.closePath(); ctx.fill();
}
function drawCrowd(cheer){
  // graderías
  for(const [x0,x1] of [[30,430],[990,1260]]){ ctx.fillStyle='#24194f'; ctx.beginPath(); ctx.moveTo(x0,575); ctx.lineTo(x1,575); ctx.lineTo(x1-10,540); ctx.lineTo(x0+10,540); ctx.closePath(); ctx.fill(); }
  for(const c of crowd){
    const jump=cheer>0?Math.max(0,Math.sin(A*c.sp*.8+c.ph))*5*cheer:0;
    const clap=Math.sin(A*c.sp+c.ph), y=c.y-jump, s=1-c.row*.08;
    ctx.fillStyle=c.col; rr(c.x-4*s,y-12*s,8*s,12*s,3); ctx.fill();
    ctx.fillStyle=c.skin; circle(c.x,y-15*s,3.6*s); ctx.fill();
    ctx.strokeStyle=c.col; ctx.lineWidth=2*s; ctx.lineCap='round';
    if(cheer>.5 && (c.ph*10|0)%3===0){ line(c.x-3*s,y-10*s,c.x-6*s,y-22*s); line(c.x+3*s,y-10*s,c.x+6*s,y-22*s); }   // brazos arriba
    else { const d=2+clap*2.5; line(c.x-3*s,y-9*s,c.x-d*s,y-17*s); line(c.x+3*s,y-9*s,c.x+d*s,y-17*s); }               // aplaudiendo
  }
  // vallas y pancarta
  ctx.strokeStyle='rgba(232,233,242,.35)'; ctx.lineWidth=2;
  for(const [x0,x1] of [[30,430],[990,1260]]){ line(x0,566,x1,566); for(let x=x0;x<=x1;x+=20) line(x,566,x,580); }
  rr(150,488,160,30,8); ctx.fillStyle=P.pink; ctx.fill(); ctx.font='900 15px Nunito, sans-serif'; ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('¡VAMOS, CADETE!',230,504);
  ctx.strokeStyle='#c9cbd8'; ctx.lineWidth=2; line(155,518,155,535); line(305,518,305,535);
  rr(1060,490,140,28,8); ctx.fillStyle=P.aqua; ctx.fill(); ctx.fillStyle=P.navy; ctx.fillText('¡A LA LUNA! 🌙',1130,505); ctx.strokeStyle='#c9cbd8'; line(1065,518,1065,535); line(1195,518,1195,535);
  ctx.textBaseline='alphabetic';
}
function drawGround(){
  const g=ctx.createLinearGradient(0,GY-10,0,H); g.addColorStop(0,'#3a2f6e'); g.addColorStop(1,'#1d1745'); ctx.fillStyle=g; ctx.fillRect(-300,GY-30,1900,400);
  ctx.fillStyle='rgba(255,122,92,.18)'; ctx.fillRect(-300,GY-30,1900,4);
  // camino hacia la torre
  ctx.fillStyle='#4b4380'; ctx.beginPath(); ctx.moveTo(-300,GY+40); ctx.lineTo(TW.x+20,PADY+8); ctx.lineTo(TW.x+20,PADY+22); ctx.lineTo(-300,GY+90); ctx.closePath(); ctx.fill();
  // plataforma de lanzamiento
  rr(560,PADY,420,26,6); ctx.fillStyle='#6b6ea0'; ctx.fill(); ctx.fillStyle='#55588a'; ctx.fillRect(560,PADY+14,420,12);
  ctx.strokeStyle=P.amber; ctx.lineWidth=3; ctx.setLineDash([14,10]); line(580,PADY+7,960,PADY+7); ctx.setLineDash([]);
  // foso de llamas
  rr(RX-60,PADY+2,120,10,4); ctx.fillStyle='#1a1440'; ctx.fill();
}
function drawTower(bridge){
  // estructura de celosía
  ctx.strokeStyle='#9aa0c4'; ctx.lineWidth=4; line(TW.x,PADY,TW.x,TW.top); line(TW.x+TW.w,PADY,TW.x+TW.w,TW.top);
  ctx.lineWidth=2; for(let y=PADY;y>TW.top;y-=30){ line(TW.x,y,TW.x+TW.w,y-30); line(TW.x+TW.w,y,TW.x,y-30); line(TW.x,y,TW.x+TW.w,y); }
  rr(TW.x-8,TW.top-14,TW.w+16,16,4); ctx.fillStyle='#6b6ea0'; ctx.fill();
  circle(TW.x+TW.w/2,TW.top-22,5); ctx.fillStyle=(A%1.2)<.4?P.pink:'rgba(232,65,140,.3)'; ctx.fill();
  // puente de acceso (se retrae hacia la torre)
  const len=(RX-DOOR.w/2-6-(TW.x+TW.w))*bridge;
  if(len>2){ rr(TW.x+TW.w,DECK,len,10,3); ctx.fillStyle='#C9CCE0'; ctx.fill(); ctx.strokeStyle='#9aa0c4'; ctx.lineWidth=2; line(TW.x+TW.w,DECK-26,TW.x+TW.w+len,DECK-26);
    for(let x=TW.x+TW.w;x<=TW.x+TW.w+len;x+=16) line(x,DECK,x,DECK-26); }
}
function drawElevator(y){
  rr(ELX-24,y,48,8,3); ctx.fillStyle=P.amber; ctx.fill();
  ctx.strokeStyle='rgba(255,181,71,.6)'; ctx.lineWidth=1.5; line(ELX-22,y,ELX-22,y-70); line(ELX+22,y,ELX+22,y-70); line(ELX-22,y-70,ELX+22,y-70);
}

/* ---------------- Cohete ---------------- */
function drawRocket(lift,hatch){
  ctx.save(); ctx.translate(0,-lift);
  ctx.strokeStyle='#C9CFE6'; ctx.lineWidth=7; ctx.lineCap='round';
  ctx.fillStyle=P.pink;
  ctx.beginPath(); ctx.moveTo(RX-58,470); ctx.lineTo(RX-108,PADY); ctx.lineTo(RX-58,575); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(RX+58,470); ctx.lineTo(RX+108,PADY); ctx.lineTo(RX+58,575); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#4a4d72'; ctx.beginPath(); ctx.moveTo(RX-30,580); ctx.lineTo(RX+30,580); ctx.lineTo(RX+38,PADY); ctx.lineTo(RX-38,PADY); ctx.closePath(); ctx.fill();
  const bg=ctx.createLinearGradient(RX-62,0,RX+62,0); bg.addColorStop(0,'#FFFFFF'); bg.addColorStop(.55,'#E3E6F5'); bg.addColorStop(1,'#A8ADCB');
  ctx.beginPath(); ctx.moveTo(RX,250); ctx.bezierCurveTo(RX+56,295,RX+64,370,RX+62,460); ctx.lineTo(RX+58,582); ctx.lineTo(RX-58,582); ctx.lineTo(RX-62,460); ctx.bezierCurveTo(RX-64,370,RX-56,295,RX,250); ctx.closePath();
  ctx.fillStyle=bg; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle=P.pink; ctx.fillRect(RX-70,240,140,56); ctx.fillStyle=P.aqua; ctx.fillRect(RX-70,296,140,7); ctx.fillStyle='rgba(30,27,110,.15)'; ctx.fillRect(RX-70,540,140,8); ctx.restore();
  circle(RX,360,19); ctx.fillStyle='#2b2d4c'; ctx.fill(); circle(RX,360,13); const wg=ctx.createRadialGradient(RX-4,356,1,RX,360,13); wg.addColorStop(0,'#BFF7FA'); wg.addColorStop(1,P.cyan); ctx.fillStyle=wg; ctx.fill();
  ctx.font='900 16px Nunito, sans-serif'; ctx.fillStyle=P.indigo; ctx.textAlign='center'; ctx.fillText('EQUILIBRIA',RX,530);
  // escotilla
  const d=DOOR; rr(d.x-3,d.y-3,d.w+6,d.h+6,12); ctx.fillStyle='#8b8fae'; ctx.fill();
  if(hatch>0){ rr(d.x,d.y,d.w,d.h,10); const ig=ctx.createLinearGradient(0,d.y,0,d.y+d.h); ig.addColorStop(0,'#FFE7B8'); ig.addColorStop(1,'#FFB547'); ctx.fillStyle=ig; ctx.fill(); }
  const dw=d.w*(1-hatch*.92); rr(d.x,d.y,dw,d.h,10); ctx.fillStyle=hatch>0?'#C3C8E0':'#DADDF0'; ctx.fill(); ctx.strokeStyle='#8b8fae'; ctx.lineWidth=2; ctx.stroke();
  if(dw>14){ circle(d.x+dw-9,d.y+d.h/2,3); ctx.fillStyle='#6b6f93'; ctx.fill(); }
  ctx.restore();
}
function drawFlame(power,lift){
  if(power<=0) return;
  const y=PADY-lift+2, L=(60+Math.random()*30)*power, w=34*power;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient(RX,y+10,4,RX,y+30,L*1.3); g.addColorStop(0,`rgba(255,250,220,${.9*power})`); g.addColorStop(.4,`rgba(255,181,71,${.7*power})`); g.addColorStop(1,'rgba(255,90,60,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(RX-w,y); ctx.quadraticCurveTo(RX-w*.6,y+L*.7,RX,y+L*1.3); ctx.quadraticCurveTo(RX+w*.6,y+L*.7,RX+w,y); ctx.closePath(); ctx.fill();
  ctx.fillStyle=`rgba(255,255,240,${power})`; ctx.beginPath(); ctx.moveTo(RX-w*.45,y); ctx.quadraticCurveTo(RX,y+L*.6,RX+w*.45,y); ctx.fill();
  ctx.restore();
  // resplandor sobre el suelo
  const gl=ctx.createRadialGradient(RX,PADY,10,RX,PADY,420*power); gl.addColorStop(0,`rgba(255,181,71,${.45*power})`); gl.addColorStop(1,'rgba(255,122,92,0)'); ctx.fillStyle=gl; ctx.fillRect(RX-450,PADY-300,900,450);
}

/* ---------------- Cadete (uniforme naranja, sin casco) ---------------- */
function drawCadet(x,y,s,view,walk=0,wave=0,alpha=1){
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(x,y); ctx.scale(s,s);
  const o='#FF8A3D', od='#D9631E';
  const legA=Math.sin(walk)*6;
  const leg=(dx,off)=>{ rr(dx+off*.3,-30,10,24,5); ctx.fillStyle=od; ctx.fill(); rr(dx+off-1,-8,13,8,4); ctx.fillStyle='#2b2d4c'; ctx.fill(); };
  if(view==='right'){ leg(-10,-legA); leg(1,legA); } else { leg(-11,0); leg(1,0); }
  // cuerpo
  rr(-15,-58,30,32,10); ctx.fillStyle=o; ctx.fill();
  ctx.fillStyle='#FFFFFF'; ctx.fillRect(-15,-34,30,4);           // cinturón reflectivo
  if(view!=='back'){ ctx.fillStyle=P.pink; rr(view==='right'?3:-11,-52,9,8,2); ctx.fill();   // parche de la misión
    ctx.fillStyle=P.aqua; circle(view==='right'?-4:6,-48,3.5); ctx.fill(); }
  else { ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='900 7px Nunito'; ctx.textAlign='center'; ctx.fillText('CADETE',0,-42); }
  // brazos (uno sostiene el casco)
  const arm=(sx,ang)=>{ ctx.save(); ctx.translate(sx,-53); ctx.rotate(ang); rr(-4.5,0,9,22,4.5); ctx.fillStyle=o; ctx.fill(); circle(0,23,4.5); ctx.fillStyle=AVATAR.piel; ctx.fill(); ctx.restore(); };
  const helmet=(hx,hy)=>{ circle(hx,hy,10); ctx.fillStyle='#F2F3FA'; ctx.fill(); ctx.strokeStyle='#C9CCE0'; ctx.lineWidth=1.5; ctx.stroke();
    ell(hx+2,hy,6,6); const vg=ctx.createLinearGradient(hx-6,hy-6,hx+6,hy+6); vg.addColorStop(0,P.amber); vg.addColorStop(1,P.indigo); ctx.fillStyle=vg; ctx.fill(); };
  if(view==='right'){ arm(-3,.4+Math.sin(walk)*.3); helmet(8,-38); arm(6,-.5); }
  else if(view==='back'){ arm(-13,.2); arm(13,-.2); }
  else { arm(-14,.35); helmet(-16,-36); arm(14,-.25-wave*(2.4+Math.sin(A*10)*.35)); }
  // cuello y cabeza
  ctx.fillStyle=AVATAR.pielSombra; ctx.fillRect(-4,-62,8,6);
  circle(0,-72,12); ctx.fillStyle=view==='back'?AVATAR.pelo:AVATAR.piel; ctx.fill();
  if(view!=='back'){
    ctx.fillStyle=AVATAR.pelo; ctx.beginPath(); ctx.arc(0,-74,12.5,Math.PI*1.02,Math.PI*1.98); ctx.fill();
    if(view==='right'){ ctx.beginPath(); ctx.arc(-6,-73,7,Math.PI*.6,Math.PI*1.6); ctx.fill(); }
    const ex=view==='right'?5:0;
    ctx.fillStyle='#1b1030'; ell(ex-4,-71,1.6,2.2); ctx.fill(); ell(ex+4,-71,1.6,2.2); ctx.fill();
    ctx.strokeStyle='#6b2a3a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(ex,-67,3.5,.15*Math.PI,.85*Math.PI); ctx.stroke();
    ctx.fillStyle='rgba(232,65,140,.35)'; ell(ex-7,-67,2.5,1.5); ctx.fill(); ell(ex+7,-67,2.5,1.5); ctx.fill();
  } else { ctx.fillStyle=AVATAR.pielSombra; ell(-12,-71,2,3); ctx.fill(); ell(12,-71,2,3); ctx.fill(); }
  ctx.restore();
}
function cadetState(T){
  const S=.92;
  if(T<2) return {x:300,y:GY+30,s:S*.95,view:'right',walk:0};
  if(T<4.2){ const k=seg(T,2,4.2); return {x:lerp(300,ELX,k), y:lerp(GY+30,PADY,k), s:S*lerp(.95,1,k), view:'right', walk:(T-2)*9}; }
  if(T<6.4){ const k=ease(seg(T,4.4,6.3)); return {x:ELX, y:lerp(PADY,DECK,k), s:S, view:'front', elev:true}; }
  if(T<7.4){ const k=seg(T,6.4,7.4); return {x:lerp(ELX,DOOR.x+DOOR.w/2,k), y:DECK, s:S, view:'right', walk:(T-6.4)*9}; }
  if(T<8.6) return {x:DOOR.x+DOOR.w/2, y:DECK, s:S, view:'front', wave:seg(T,7.5,7.8)*(1-seg(T,8.3,8.6))};
  if(T<9.4) return {x:DOOR.x+DOOR.w/2, y:DECK, s:S, view:'back'};
  if(T<10.4){ const k=seg(T,9.4,10.4); return {x:DOOR.x+DOOR.w/2, y:DECK-k*4, s:S*lerp(1,.8,k), view:'back', walk:k*10, alpha:1-k*.8, enter:true}; }
  return null;
}

/* ---------------- Partículas ---------------- */
function emitSmoke(power){
  for(let i=0;i<3*power;i++){ const dir=Math.random()<.5?-1:1;
    smoke.push({x:RX+dir*(20+Math.random()*30), y:PADY+6, vx:dir*(80+Math.random()*220)*power, vy:-(10+Math.random()*40), r:14+Math.random()*16, life:0, max:2+Math.random()*1.6}); }
  if(Math.random()<.6) sparks.push({x:RX+(Math.random()-.5)*50,y:PADY,vx:(Math.random()-.5)*300,vy:-Math.random()*160,life:0,max:.5+Math.random()*.4});
}
function updParts(dt){
  for(let i=smoke.length-1;i>=0;i--){ const p=smoke[i]; p.life+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.97; p.vy-=4*dt; p.r+=26*dt; if(p.life>p.max) smoke.splice(i,1); }
  for(let i=sparks.length-1;i>=0;i--){ const p=sparks[i]; p.life+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=400*dt; if(p.life>p.max) sparks.splice(i,1); }
  for(let i=confetti.length-1;i>=0;i--){ const p=confetti[i]; p.life+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=60*dt; p.rot+=p.vr*dt; if(p.life>p.max) confetti.splice(i,1); }
}
function drawParts(){
  for(const p of confetti){ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha=1-p.life/p.max; ctx.fillStyle=p.col; ctx.fillRect(-3,-1.5,6,3); ctx.restore(); }
  for(const p of smoke){ const a=Math.min(1,p.life*3)*(1-p.life/p.max); const warm=clamp(1-p.life*1.2);
    ctx.fillStyle=`rgba(${lerp(235,255,warm)|0},${lerp(232,190,warm)|0},${lerp(245,150,warm)|0},${.75*a})`; circle(p.x,p.y,p.r); ctx.fill(); }
  ctx.strokeStyle='#FFE7B8'; ctx.lineWidth=2; ctx.lineCap='round';
  for(const p of sparks){ ctx.globalAlpha=1-p.life/p.max; line(p.x,p.y,p.x-p.vx*.02,p.y-p.vy*.02); } ctx.globalAlpha=1;
}
function throwConfetti(){ const cols=[P.pink,P.aqua,P.amber,'#fff','#3FD17A'];
  for(const x0 of [230,1130]) for(let i=0;i<30;i++) confetti.push({x:x0+(Math.random()-.5)*160,y:520,vx:(Math.random()-.5)*120,vy:-120-Math.random()*120,rot:Math.random()*TAU,vr:(Math.random()-.5)*10,life:0,max:2+Math.random(),col:cols[i%cols.length]}); }

/* ---------------- Audio ---------------- */
let ac=null, master, sndOn=true, noiseBuf, crowdGain, engGain;
function initAudio(){
  if(ac) return; try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  master=ac.createGain(); master.gain.value=sndOn?.7:0; master.connect(ac.destination);
  noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  // murmullo del público
  const n=ac.createBufferSource(); n.buffer=noiseBuf; n.loop=true; const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=900; bp.Q.value=.4;
  crowdGain=ac.createGain(); crowdGain.gain.value=.05; n.connect(bp).connect(crowdGain).connect(master); n.start();
  // motor
  const m=ac.createBufferSource(); m.buffer=noiseBuf; m.loop=true; const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=220;
  engGain=ac.createGain(); engGain.gain.value=0; m.connect(lp).connect(engGain).connect(master); m.start();
}
function clap(){ if(!ac) return; const t=ac.currentTime, s=ac.createBufferSource(); s.buffer=noiseBuf; const f=ac.createBiquadFilter(); f.type='highpass'; f.frequency.value=1500;
  const g=ac.createGain(); g.gain.setValueAtTime(.07*Math.random(),t); g.gain.exponentialRampToValueAtTime(.0001,t+.06); s.connect(f).connect(g).connect(master); s.start(t,Math.random()); s.stop(t+.08); }
function tone(f,dur,vol,type='sine',f2){ if(!ac) return; const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g).connect(master); o.start(t); o.stop(t+dur+.05); }
const EVENTS=[ {t:4.4,fn:()=>tone(220,1.8,.05,'triangle',330)}, {t:8.6,fn:()=>tone(320,.3,.06,'square',200)}, {t:10.4,fn:()=>tone(90,.4,.2,'sine',50)},
  {t:11.0,fn:()=>tone(150,1,.05,'sawtooth',100)}, {t:12.0,fn:()=>{ tone(60,2.5,.3,'sawtooth',40); throwConfetti(); }}, {t:7.6,fn:throwConfetti} ];
function fire(t0,t1){ for(const e of EVENTS) if(e.t>t0&&e.t<=t1) e.fn(); }

/* ---------------- Render ---------------- */
function render(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const power=easeOut(seg(T,12,13.6)), lift=ease(seg(T,14.2,FREEZE))*16;
  const shake=power*(T<FREEZE?3+power*3:4);
  // cámara: se acerca para seguir al cadete y se aleja para el encendido
  const zin=ease(seg(T,4,6.4))*(1-ease(seg(T,10.6,12.2)));
  const z=1+.42*zin, fx=lerp(640,lerp(ELX,DOOR.x,seg(T,6.4,7.4))+40,zin), fy=lerp(380,DECK-60,zin);
  ctx.save(); ctx.translate(640,360); ctx.scale(z,z); ctx.translate(-fx,-fy);
  if(shake>0) ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  drawSky();
  const cheer=Math.max(seg(T,7.4,8)*(1-seg(T,9,10)), seg(T,12,13));
  drawCrowd(cheer);
  drawGround();
  const bridge=1-ease(seg(T,11,12));
  const st=cadetState(T);
  const elY=T<4.4?PADY:T<6.4?lerp(PADY,DECK,ease(seg(T,4.4,6.3))):DECK;
  drawTower(bridge);
  drawElevator(elY);
  drawFlame(power,lift);
  drawRocket(lift, ease(seg(T,8.6,9.3))*(1-ease(seg(T,10.4,11))));
  if(st){
    if(st.enter){ ctx.save(); ctx.beginPath(); ctx.rect(DOOR.x,DOOR.y,DOOR.w,DOOR.h); ctx.clip(); }
    else { ctx.fillStyle='rgba(0,0,0,.25)'; ell(st.x,st.y+1,12,3); ctx.fill(); }
    drawCadet(st.x,st.y,st.s,st.view,st.walk||0,st.wave||0,st.alpha??1);
    if(st.enter) ctx.restore();
  }
  drawParts();
  ctx.restore();
  // rótulo y cuenta regresiva
  const s='CENTRO ESPACIAL · ACADEMIA DE CADETES', n=Math.floor(clamp((T-.4)*30,0,s.length));
  ctx.globalAlpha=1-seg(T,4,5); ctx.font='700 20px "Space Mono", monospace'; ctx.textAlign='left'; ctx.fillStyle=P.aqua; ctx.shadowColor=P.aqua; ctx.shadowBlur=10; ctx.fillText(s.slice(0,n),40,56); ctx.shadowBlur=0; ctx.globalAlpha=1;
  if(T>11 && T<=FREEZE){ const c=Math.max(0,Math.ceil(13.5-T)); ctx.font='900 64px Nunito, sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.shadowColor=P.amber; ctx.shadowBlur=20;
    ctx.fillText(c>0?String(c):'¡IGNICIÓN!',640,120); ctx.shadowBlur=0; }
  const vg=ctx.createRadialGradient(640,360,300,640,360,820); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.45)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  const fade=1-seg(T,0,1); if(fade>0){ ctx.fillStyle=`rgba(0,0,0,${fade})`; ctx.fillRect(0,0,W,H); }
}

/* ---------------- Bucle ---------------- */
let last=performance.now(), clapT=0;
function frame(now){
  const dt=Math.max(0,Math.min(.05,(now-last)/1000)); last=now;
  if(!frozen){
    A+=dt; const nt=Math.min(FREEZE,T+dt); fire(T,nt); T=nt;
    const power=easeOut(seg(T,12,13.6)); if(power>0) emitSmoke(power);
    updParts(dt);
    if(ac){ clapT-=dt; const cheer=Math.max(seg(T,7.4,8)*(1-seg(T,9,10)),seg(T,12,13)); if(clapT<=0){ clap(); clapT=.03+Math.random()*(.12-cheer*.08); }
      crowdGain.gain.setTargetAtTime(.04+cheer*.08,ac.currentTime,.2); engGain.gain.setTargetAtTime(power*.9,ac.currentTime,.1); }
    if(T>=FREEZE) freeze();
  }
  render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------------- Pausa final ---------------- */
const pausa=document.getElementById('pausa'), txt=document.getElementById('txt'), bNext=document.getElementById('bNext');
let typer=null;
function freeze(){
  frozen=true; T=FREEZE;
  if(ac){ engGain.gain.setTargetAtTime(0,ac.currentTime,.15); crowdGain.gain.setTargetAtTime(0,ac.currentTime,.15); tone(300,.5,.12,'square',120); }
  document.getElementById('bSkip').style.display='none';
  pausa.classList.add('on'); let i=0; clearInterval(typer);
  typer=setInterval(()=>{ i++; txt.innerHTML=MENSAJE.slice(0,i)+'<span class="cur"></span>'; if(i>=MENSAJE.length){ clearInterval(typer); bNext.classList.add('on'); } },38);
}
function restart(){ clearInterval(typer); T=0; A=0; frozen=false; smoke.length=0; sparks.length=0; confetti.length=0; txt.innerHTML=''; bNext.classList.remove('on'); pausa.classList.remove('on'); document.getElementById('bSkip').style.display=''; }
function unlockAudio(){ initAudio(); if(ac&&ac.state==='suspended') ac.resume().catch(()=>{}); }
initAudio(); stage.addEventListener('pointerdown',unlockAudio); addEventListener('keydown',unlockAudio);
document.getElementById('bSnd').onclick=()=>{ sndOn=!sndOn; document.getElementById('bSnd').setAttribute('aria-pressed',sndOn); unlockAudio(); if(master) master.gain.setTargetAtTime(sndOn?.7:0,ac.currentTime,.05); };
document.getElementById('bSkip').onclick=()=>{ for(let t=T;t<FREEZE;t+=1/30){ if(t>12) emitSmoke(easeOut(seg(t,12,13.6))); updParts(1/30); } fire(T,FREEZE); T=FREEZE; freeze(); };
document.getElementById('otra').onclick=restart;
bNext.onclick=()=>{ dispatchEvent(new CustomEvent('despegue:siguiente')); try{ if(parent!==window) parent.postMessage({type:'despegue-siguiente'},'*'); }catch(e){} };
})();
