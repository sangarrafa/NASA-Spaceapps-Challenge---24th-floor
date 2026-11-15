(() => {
/* -------------------------------------------------------------------
   Mapa de la base lunar · Misión Equilibria
   - 5 estaciones al mismo nivel: el estudiante elige por cuál empezar.
   - El viaje a Marte (en el cohete) se desbloquea al completar las 5.
   Integración:
     window.EquilibriaMapa.completar('energia')   → marca una misión
     window.EquilibriaMapa.estado()               → {energia:true,...}
     evento window 'mapa:entrar' {detail:{id}}    → al pulsar "Entrar"
     evento window 'mapa:marte'                   → al pulsar Marte desbloqueado
   ------------------------------------------------------------------- */
const stage=document.getElementById('stage'), cv=document.getElementById('c'), ctx=cv.getContext('2d');
const W=1280,H=720; let dpr=1;
function resize(){ dpr=Math.min(2,devicePixelRatio||1); cv.width=W*dpr; cv.height=H*dpr; stage.style.setProperty('--s',stage.clientWidth/W); }
addEventListener('resize',resize); resize();

const P={navy:'#0B0F3A',indigo:'#1E1B6E',pink:'#E8418C',magenta:'#A0279E',aqua:'#6FE3E8',cyan:'#21C1E0',amber:'#FFB547',coral:'#FF7A5C',white:'#E8E9F2',green:'#3FD17A',violet:'#9B7BFF'};
const TAU=Math.PI*2;
const L=window.EqLang?window.EqLang.L:(es)=>es;
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
const lerp=(a,b,k)=>a+(b-a)*k;
const easeOut=k=>1-Math.pow(1-k,3);
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,TAU);}
function ell(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function q(p0,c,p1,t){const u=1-t;return{x:u*u*p0.x+2*u*t*c.x+t*t*p1.x,y:u*u*p0.y+2*u*t*c.y+t*t*p1.y};}

/* ---------------- Datos del mapa ---------------- */
const HUB={x:620,y:452};
const ST=[
  {id:'soporte',  nom:L('Soporte vital','Life support'),        icon:'O₂', col:P.aqua,   x:300,y:548, c:{x:430,y:560}, desc:L('Mantén el oxígeno y el agua para que todos puedan respirar y vivir en la base.','Keep the oxygen and water going so everyone can breathe and live at the base.')},
  {id:'energia',  nom:L('Energía','Energy'),              icon:'⚡', col:P.amber,  x:395,y:350, c:{x:470,y:420}, desc:L('Reparte la energía de los paneles solares entre todo lo que la necesita.','Share the solar panels’ energy among everything that needs it.')},
  {id:'alimentos',nom:L('Alimentos','Food'),            icon:'🌱', col:P.green,  x:640,y:628, c:{x:560,y:560}, desc:L('Cultiva plantas en el invernadero lunar para tener comida fresca.','Grow plants in the lunar greenhouse to have fresh food.')},
  {id:'blindaje', nom:L('Blindaje contra radiación','Radiation shielding'), icon:'🛡', col:P.pink, x:935,y:572, c:{x:800,y:560}, desc:L('Protege a la tripulación cuando el Sol lanza radiación.','Protect the crew when the Sun throws out radiation.')},
  {id:'comunica', nom:L('Comunicaciones','Communications'),       icon:'📡', col:P.violet, x:860,y:355, c:{x:760,y:380}, desc:L('Envía y recibe mensajes de la Tierra… aunque tarden en llegar.','Send and receive messages from Earth… even if they take a while to arrive.')},
];
// Pantalla a la que lleva "Entrar" en cada estación (las que aún no tienen misión solo emiten el evento)
const MISSION_SCREENS={ soporte:'../mision1-soportevital/index.html' };
// Una estación queda bloqueada mientras no tenga misión en MISSION_SCREENS: al agregarla aquí, se desbloquea sola
const estacionBloqueada=id=>!MISSION_SCREENS[id];
const PAD={x:150,y:420}, PADC={x:380,y:460};   // pista del cohete (Misión 1, ya hecha)
const MARS={x:1120,y:118,r:50};
const done={}; ST.forEach(s=>done[s.id]=false);
let unlockT=-1;   // momento en que se desbloqueó Marte (para animar)

/* ---------------- Fondo precalculado ---------------- */
const R=rng(9), stars=[]; for(let i=0;i<300;i++) stars.push({x:R()*W,y:R()*290,r:R()<.9?R()*1.2+.3:R()*1.6+1.1,p:R()*TAU,sp:.6+R()*2.4});
const craters=[]; {const r=rng(31); let n=0; while(n<34){ const x=r()*1300-10, y=300+r()*420; if(Math.hypot(x-HUB.x,(y-HUB.y)*1.8)<170) continue; if(ST.some(s=>Math.hypot(x-s.x,(y-s.y)*1.8)<110)) continue; craters.push({x,y,r:8+r()*(y-260)*.09}); n++; }}
const rocks=[]; {const r=rng(52); for(let i=0;i<40;i++) rocks.push({x:r()*1280,y:310+r()*410,s:3+r()*7});}
const meteors=[]; let nextMet=.8;

/* ---------------- Cielo y suelo ---------------- */
function horizonY(x){ return 255+Math.pow((x-640)/640,2)*40; }   // curvatura de la Luna
function drawSky(A){
  const g=ctx.createLinearGradient(0,0,0,320); g.addColorStop(0,'#05061f'); g.addColorStop(1,'#1E1B6E'); ctx.fillStyle=g; ctx.fillRect(0,0,W,330);
  const n=ctx.createRadialGradient(760,90,0,760,90,360); n.addColorStop(0,'rgba(160,39,158,.28)'); n.addColorStop(1,'rgba(160,39,158,0)'); ctx.fillStyle=n; ctx.fillRect(300,0,900,330);
  for(const s of stars){ ctx.globalAlpha=.35+.65*Math.max(0,Math.sin(A*s.sp+s.p)); ctx.fillStyle=s.r>1.6?'#FFE2B0':P.white; circle(s.x,s.y,s.r); ctx.fill(); } ctx.globalAlpha=1;
  // Tierra
  const ex=470,ey=78,er=26;
  const at=ctx.createRadialGradient(ex,ey,er*.9,ex,ey,er*1.6); at.addColorStop(0,'rgba(111,227,232,.45)'); at.addColorStop(1,'rgba(111,227,232,0)'); ctx.fillStyle=at; circle(ex,ey,er*1.6); ctx.fill();
  circle(ex,ey,er); ctx.fillStyle='#2f6fd0'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle='#3fae6a'; const o=(A*4)%60;
  ell(ex-20+o,ey-5,10,7); ctx.fill(); ell(ex-40+o,ey+8,7,5); ctx.fill(); ell(ex+5+o-60,ey+4,8,6); ctx.fill(); ell(ex+5+o,ey+4,8,6); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.5)'; ell(ex-6,ey-12,9,3); ctx.fill(); ctx.fillStyle='rgba(4,5,30,.55)'; ctx.fillRect(ex+8,ey-er,er,er*2); ctx.restore();
  ctx.font='800 13px Nunito, sans-serif'; ctx.textAlign='center'; ctx.fillStyle='rgba(232,233,242,.65)'; ctx.fillText(L('Tierra','Earth'),ex,ey+er+18);
  // estrellas fugaces
  nextMet-=1/60; if(nextMet<=0){ meteors.push({x:300+Math.random()*900,y:-10,vx:-(300+Math.random()*250),vy:150+Math.random()*120,life:0,max:1+Math.random()*.6}); nextMet=1.2+Math.random()*2.2; }
  for(let i=meteors.length-1;i>=0;i--){ const m=meteors[i]; m.life+=1/60; m.x+=m.vx/60; m.y+=m.vy/60; if(m.life>m.max||m.y>280){meteors.splice(i,1);continue;}
    const a=Math.min(1,m.life*5)*(1-m.life/m.max), gr=ctx.createLinearGradient(m.x,m.y,m.x-m.vx*.18,m.y-m.vy*.18); gr.addColorStop(0,`rgba(255,244,214,${a})`); gr.addColorStop(1,'rgba(255,181,71,0)');
    ctx.strokeStyle=gr; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(m.x,m.y); ctx.lineTo(m.x-m.vx*.18,m.y-m.vy*.18); ctx.stroke(); }
}
function drawMars(A,u){
  const {x,y,r}=MARS, pulse=.5+.5*Math.sin(A*1.5);
  const gl=ctx.createRadialGradient(x,y,r*.9,x,y,r*(1.6+u*.6)); gl.addColorStop(0,`rgba(255,122,92,${.3+u*.35+pulse*.1})`); gl.addColorStop(1,'rgba(255,122,92,0)'); ctx.fillStyle=gl; circle(x,y,r*2.2); ctx.fill();
  ctx.save(); circle(x,y,r); const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r); g.addColorStop(0,'#FFA978'); g.addColorStop(.6,'#E0603E'); g.addColorStop(1,'#8E2F2A'); ctx.fillStyle=g; ctx.fill(); ctx.clip();
  ctx.fillStyle='rgba(120,40,30,.35)'; [[-.3,.1,.3,.12],[.25,-.2,.22,.1],[.1,.4,.35,.1]].forEach(([dx,dy,rx,ry])=>{ell(x+dx*r,y+dy*r,rx*r,ry*r);ctx.fill();});
  ctx.fillStyle='rgba(255,245,240,.85)'; ell(x,y-r*.92,r*.35,r*.12); ctx.fill();
  // base marciana diminuta
  ctx.fillStyle='#FFD9C2'; ctx.beginPath(); ctx.arc(x+r*.15,y-r*.25,r*.12,Math.PI,0); ctx.fill();
  // velo de bloqueo
  if(u<1){ ctx.fillStyle=`rgba(11,15,58,${.62*(1-u)})`; ctx.fillRect(x-r,y-r,r*2,r*2); }
  ctx.restore();
  if(u<1){ // candado
    ctx.save(); ctx.globalAlpha=1-u; const by=y+Math.sin(A*2)*3 - u*20;
    ctx.strokeStyle='#E8E9F2'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x,by-8,11,Math.PI,0); ctx.stroke();
    rr(x-16,by-8,32,25,6); ctx.fillStyle='#E8E9F2'; ctx.fill(); circle(x,by+3,4); ctx.fillStyle=P.navy; ctx.fill(); ctx.fillRect(x-1.5,by+3,3,8);
    ctx.restore();
  }
  ctx.font='900 16px Nunito, sans-serif'; ctx.textAlign='center'; ctx.fillStyle=u>=1?P.amber:'rgba(232,233,242,.8)';
  ctx.fillText(u>=1?L('MARTE · ¡Misión 2 disponible!','MARS · Mission 2 available!'):L('MARTE · Misión 2','MARS · Mission 2'),x,y+r+24);
  if(u<1){ ctx.font='700 13px Nunito, sans-serif'; ctx.fillStyle='rgba(232,233,242,.6)'; ctx.fillText(L('Bloqueado: completa las 5 misiones lunares','Locked: complete the 5 lunar missions'),x,y+r+42); }
}
function drawGround(){
  ctx.beginPath(); ctx.moveTo(0,horizonY(0)); for(let x=0;x<=W;x+=20) ctx.lineTo(x,horizonY(x)); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
  const g=ctx.createLinearGradient(0,250,0,H); g.addColorStop(0,'#3a3c66'); g.addColorStop(.35,'#4a4c78'); g.addColorStop(1,'#33355e'); ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(200,200,240,.45)'; ctx.lineWidth=2; ctx.beginPath(); for(let x=0;x<=W;x+=20) x?ctx.lineTo(x,horizonY(x)):ctx.moveTo(x,horizonY(x)); ctx.stroke();
  // colinas lejanas
  ctx.fillStyle='#2f3160'; ctx.beginPath(); ctx.moveTo(0,horizonY(0)+2);
  for(let x=0;x<=W;x+=40) ctx.lineTo(x,horizonY(x)-6-Math.abs(Math.sin(x*.013))*14); ctx.lineTo(W,horizonY(W)+14); ctx.lineTo(0,horizonY(0)+14); ctx.closePath(); ctx.fill();
  for(const c of craters){ const ry=c.r*.42; ell(c.x,c.y,c.r,ry); ctx.fillStyle='#2b2d55'; ctx.fill();
    ctx.strokeStyle='rgba(210,210,240,.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(c.x,c.y+1,c.r,ry,0,.1,Math.PI-.1); ctx.stroke();
    ctx.strokeStyle='rgba(15,15,40,.5)'; ctx.beginPath(); ctx.ellipse(c.x,c.y,c.r,ry,0,Math.PI+.1,TAU-.1); ctx.stroke(); }
  for(const r of rocks){ ctx.fillStyle='rgba(0,0,0,.25)'; ell(r.x+2,r.y+2,r.s*1.2,r.s*.4); ctx.fill(); ctx.fillStyle='#5f6190'; ell(r.x,r.y,r.s,r.s*.6); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.18)'; ell(r.x-r.s*.3,r.y-r.s*.25,r.s*.4,r.s*.2); ctx.fill(); }
  // plataforma hexagonal alrededor de la base central
  ctx.save(); ell(HUB.x,HUB.y+8,175,70); ctx.fillStyle='#24264d'; ctx.fill(); ell(HUB.x,HUB.y,175,70); ctx.fillStyle='#55588a'; ctx.fill(); ctx.clip();
  ctx.strokeStyle='rgba(111,227,232,.18)'; ctx.lineWidth=1.5;
  for(let yy=-80;yy<=80;yy+=18) for(let xx=-200;xx<=200;xx+=30){ const ox=(Math.round(yy/18)%2)*15; ctx.beginPath(); ctx.ellipse(HUB.x+xx+ox,HUB.y+yy,13,6,0,0,TAU); ctx.stroke(); }
  ctx.restore(); ctx.strokeStyle='rgba(111,227,232,.45)'; ctx.lineWidth=2; ell(HUB.x,HUB.y,175,70); ctx.stroke();
}

/* ---------------- Caminos con piedras de paso ---------------- */
function road(p0,c,p1,w,col){
  ctx.save(); ctx.lineCap='round';
  ctx.strokeStyle='rgba(20,20,50,.35)'; ctx.lineWidth=w+8; ctx.beginPath(); ctx.moveTo(p0.x,p0.y+4); ctx.quadraticCurveTo(c.x,c.y+4,p1.x,p1.y+4); ctx.stroke();
  ctx.strokeStyle=col; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.quadraticCurveTo(c.x,c.y,p1.x,p1.y); ctx.stroke();
  ctx.restore();
}
function pads(p0,c,p1,n,col,A,locked,lit=1){
  for(let i=1;i<=n;i++){
    const t=i/(n+1), p=q(p0,c,p1,t), sz=lerp(.8,1.15,clamp((p.y-260)/460));
    const wave=locked?0:Math.max(0,Math.sin((t*3-A*1.6)*Math.PI))**6;
    ell(p.x,p.y+4,13*sz,6.5*sz); ctx.fillStyle='#1d1f45'; ctx.fill();
    ell(p.x,p.y,13*sz,6.5*sz);
    if(locked){ ctx.fillStyle=lit>0?`rgba(63,209,122,${.4+.6*lit})`:'#5a5c80'; }
    else { ctx.fillStyle=col; }
    ctx.fill();
    if(!locked && wave>.02){ ctx.save(); ctx.globalAlpha=wave; ctx.shadowColor='#fff'; ctx.shadowBlur=14; ell(p.x,p.y,13*sz,6.5*sz); ctx.fillStyle='#fff'; ctx.fill(); ctx.restore(); }
    ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(p.x,p.y,13*sz,6.5*sz,0,Math.PI,TAU); ctx.stroke();
  }
}

/* ---------------- Edificios ---------------- */
function plinth(x,y,rx,col,glow){
  ell(x,y+10,rx,rx*.4); ctx.fillStyle='#1d1f45'; ctx.fill();
  ell(x,y,rx,rx*.4); ctx.fillStyle='#5b5e92'; ctx.fill();
  ctx.save(); ctx.strokeStyle=col; ctx.lineWidth=3; ctx.globalAlpha=.55+.45*glow; ctx.shadowColor=col; ctx.shadowBlur=14*glow; ell(x,y,rx,rx*.4); ctx.stroke(); ctx.restore();
}
function dome(x,y,r,c1,c2){ const g=ctx.createRadialGradient(x-r*.4,y-r*.6,2,x,y-r*.3,r*1.2); g.addColorStop(0,c1); g.addColorStop(1,c2); ctx.beginPath(); ctx.arc(x,y,r,Math.PI,0); ctx.ellipse(x,y,r,r*.35,0,0,Math.PI); ctx.fillStyle=g; ctx.fill(); }
function cyl(x,y,w,h,c1,c2){ const g=ctx.createLinearGradient(x-w/2,0,x+w/2,0); g.addColorStop(0,c1); g.addColorStop(1,c2); ctx.fillStyle=g; ctx.fillRect(x-w/2,y-h,w,h); ell(x,y,w/2,w*.18); ctx.fill(); ell(x,y-h,w/2,w*.18); ctx.fillStyle=c1; ctx.fill(); }
function drawStation(s,A,hover){
  // Señales solo visuales (sin texto):
  // - Base bloqueada: conserva su color, sin brillo y con el anillo punteado (barrera cerrada).
  // - Base activa (desbloqueada y sin completar): un pin de ubicación de neón encima (ver más abajo).
  const apagada=estacionBloqueada(s.id), activa=!apagada && !done[s.id];
  const {x,y}=s, glow=apagada?0:done[s.id]?1:.5+.5*Math.sin(A*2.5+x), sc=hover?1.06:1;
  ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc); ctx.translate(-x,-y);
  plinth(x,y,62,done[s.id]?P.amber:s.col,glow);
  if(apagada){   // barrera: el borde de la base pasa a ser punteado
    ctx.save(); ctx.globalAlpha=1; ell(x,y,62,24.8); ctx.strokeStyle='#2a2c55'; ctx.lineWidth=4; ctx.stroke();
    ctx.setLineDash([7,7]); ctx.strokeStyle=s.col; ctx.lineWidth=3; ctx.globalAlpha=.85; ell(x,y,62,24.8); ctx.stroke(); ctx.restore();
  }
  switch(s.id){
    case 'soporte':
      cyl(x-26,y,20,46,'#E3F9FB','#7fb7c4'); cyl(x-6,y+4,20,40,'#E3F9FB','#7fb7c4');
      dome(x+22,y,30,'#F1F2FA','#8c90b3'); ctx.fillStyle=P.aqua; circle(x+22,y-14,7); ctx.fill();
      ctx.font='900 13px Nunito'; ctx.fillStyle=P.navy; ctx.textAlign='center'; ctx.fillText('O₂',x-26,y-22); break;
    case 'energia':
      for(let i=0;i<3;i++){ const px=x-34+i*30, py=y-6+i*4; ctx.strokeStyle='#9aa0c4'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(px,py+8); ctx.lineTo(px,py-14); ctx.stroke();
        ctx.save(); ctx.translate(px,py-22); ctx.transform(1,0,-.5,.6,0,0); ctx.fillStyle='#2f3a8a'; ctx.fillRect(-16,-14,32,28); ctx.strokeStyle='#8fd8ff'; ctx.lineWidth=1.5; ctx.strokeRect(-16,-14,32,28);
        ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(0,14); ctx.moveTo(-16,0); ctx.lineTo(16,0); ctx.stroke();
        ctx.fillStyle=`rgba(255,255,255,${.15+.15*Math.sin(A*2+i)})`; ctx.fillRect(-16,-14,32,10); ctx.restore(); }
      rr(x+22,y-22,18,26,4); ctx.fillStyle='#E3E6F5'; ctx.fill(); ctx.fillStyle=P.amber; ctx.fillRect(x+25,y-6,12,7); break;
    case 'alimentos':{
      ctx.save(); ctx.beginPath(); ctx.arc(x,y,40,Math.PI,0); ctx.ellipse(x,y,40,14,0,0,Math.PI); ctx.clip();
      const g=ctx.createLinearGradient(0,y-40,0,y); g.addColorStop(0,'rgba(170,255,200,.35)'); g.addColorStop(1,'rgba(63,209,122,.5)'); ctx.fillStyle=g; ctx.fillRect(x-40,y-42,80,56);
      for(let i=0;i<6;i++){ const px=x-28+i*11, h=10+((i*7)%9)+Math.sin(A*2+i)*1.5; ctx.strokeStyle='#2e9e57'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px,y+4); ctx.lineTo(px,y-h); ctx.stroke(); ctx.fillStyle=P.green; ell(px-3,y-h,4,2.5); ctx.fill(); ell(px+3,y-h+3,4,2.5); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle='rgba(220,255,235,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,40,Math.PI,0); ctx.stroke();
      ctx.strokeStyle='rgba(220,255,235,.35)'; [-20,0,20].forEach(d=>{ctx.beginPath();ctx.ellipse(x,y,Math.abs(d)?40-Math.abs(d)*.6:1,40,0,Math.PI,TAU);ctx.stroke();});
      ctx.fillStyle='rgba(255,255,255,.4)'; ell(x-16,y-26,8,4); ctx.fill(); break; }
    case 'blindaje':
      ctx.beginPath(); ctx.moveTo(x-46,y+4); ctx.quadraticCurveTo(x-40,y-46,x,y-48); ctx.quadraticCurveTo(x+40,y-46,x+46,y+4); ctx.closePath();
      { const g=ctx.createLinearGradient(x-46,0,x+46,0); g.addColorStop(0,'#8e90ae'); g.addColorStop(1,'#4c4e72'); ctx.fillStyle=g; ctx.fill(); }
      ctx.fillStyle='rgba(30,30,60,.25)'; for(let i=0;i<14;i++){ circle(x-34+((i*29)%68),y-6-((i*17)%36),2.5); ctx.fill(); }
      rr(x-12,y-24,24,28,6); ctx.fillStyle='#2b2d4c'; ctx.fill();
      ctx.save(); ctx.translate(x,y-34); ctx.fillStyle=P.pink; ctx.shadowColor=P.pink; ctx.shadowBlur=8*glow; ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(9,-6); ctx.lineTo(8,4); ctx.lineTo(0,10); ctx.lineTo(-8,4); ctx.lineTo(-9,-6); ctx.closePath(); ctx.fill(); ctx.restore(); break;
    case 'comunica':{
      ctx.strokeStyle='#9aa0c4'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x+10,y); ctx.lineTo(x+10,y-40); ctx.stroke();
      ctx.save(); ctx.translate(x+10,y-46); ctx.rotate(-.5+Math.sin(A*.6)*.15);
      ctx.beginPath(); ctx.ellipse(0,0,28,12,0,0,Math.PI); ctx.fillStyle='#E3E6F5'; ctx.fill(); ctx.strokeStyle='#8b8fae'; ctx.lineWidth=2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(0,-16); ctx.stroke(); circle(0,-17,3); ctx.fillStyle=(A%1.2)<.3?P.pink:'#8b8fae'; ctx.fill(); ctx.restore();
      // ondas (con retraso, como las comunicaciones reales)
      for(let i=0;i<3;i++){ const ph=((A*.6)+i/3)%1; ctx.strokeStyle=`rgba(155,123,255,${1-ph})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x+2,y-70,10+ph*36,-2.4,-1.2); ctx.stroke(); }
      rr(x-36,y-22,32,24,6); ctx.fillStyle='#C9CCE0'; ctx.fill(); ctx.fillStyle=P.violet; ctx.fillRect(x-30,y-16,20,6); break; }
  }
  ctx.restore();
  // Base activa: pin de ubicación (el símbolo universal de "aquí") en el color de la estación, flotando encima
  if(activa){
    const cy=y-92+Math.sin(A*4.8)*6, R=15;   // centro de la cabeza del pin
    const pin=()=>{ ctx.beginPath(); ctx.moveTo(x,cy+R+15);
      ctx.bezierCurveTo(x-R*.55,cy+R*.95,x-R,cy+R*.45,x-R,cy); ctx.arc(x,cy,R,Math.PI,0); ctx.bezierCurveTo(x+R,cy+R*.45,x+R*.55,cy+R*.95,x,cy+R+15); ctx.closePath(); };
    ctx.save();
    const g=ctx.createLinearGradient(0,cy-R,0,cy+R+15); g.addColorStop(0,'#FFFFFF'); g.addColorStop(.4,s.col); g.addColorStop(1,s.col);
    pin(); ctx.fillStyle=g; ctx.fill();
    // borde de neón en el color de la base: resplandor en dos capas y un núcleo claro
    ctx.lineJoin='round'; ctx.strokeStyle=s.col; ctx.shadowColor=s.col;
    pin(); ctx.lineWidth=5; ctx.shadowBlur=26; ctx.stroke();
    pin(); ctx.lineWidth=3.5; ctx.shadowBlur=10; ctx.stroke(); ctx.shadowBlur=0;
    pin(); ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=1.3; ctx.stroke();
    circle(x,cy,5.5); ctx.fillStyle=P.navy; ctx.fill();   // centro del pin
    ctx.restore();
  }
  // etiqueta
  const ly=y+46;
  ctx.save();
  ctx.font='900 15px Nunito, sans-serif'; const tw=ctx.measureText(s.nom).width;
  rr(x-tw/2-34,ly-14,tw+48,28,14); ctx.fillStyle='rgba(11,15,58,.9)'; ctx.fill(); ctx.strokeStyle=done[s.id]?P.amber:s.col; ctx.lineWidth=2; ctx.stroke();
  // Insignia sin número: candado abierto azul si se puede entrar (ámbar si ya está completada),
  // candado cerrado gris si está bloqueada. Se dibujan como figuras para que se vean igual en todos los navegadores.
  const bx=x-tw/2-18, bloq=estacionBloqueada(s.id), fondo=bloq?'#5A5C80':done[s.id]?P.amber:'#3B82F6';
  circle(bx,ly,10); ctx.fillStyle=fondo; ctx.fill();
  ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=P.white; ctx.lineWidth=1.8;
  ctx.beginPath();
  if(bloq){ ctx.arc(bx,ly-2,3.2,Math.PI,0); ctx.lineTo(bx+3.2,ly); ctx.moveTo(bx-3.2,ly-2); ctx.lineTo(bx-3.2,ly); }   // arco cerrado
  else { ctx.moveTo(bx-3.2,ly); ctx.lineTo(bx-3.2,ly-3.5); ctx.arc(bx,ly-3.5,3.2,Math.PI,-.15); }                        // arco abierto: el lado derecho queda suelto y levantado
  ctx.stroke();
  rr(bx-5,ly-.5,10,7,1.5); ctx.fillStyle=P.white; ctx.fill();                                                                // cuerpo
  circle(bx,ly+2.6,1.1); ctx.fillStyle=fondo; ctx.fill();                                                                    // cerradura
  ctx.restore();
  ctx.fillStyle=P.white; ctx.font='900 15px Nunito, sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(s.nom,x-tw/2-4,ly+1); ctx.textBaseline='alphabetic';
  ctx.restore();
}
function drawHub(A){
  const {x,y}=HUB;
  dome(x,y,70,'#F1F2FA','#7c80a8');
  ctx.strokeStyle='rgba(30,30,70,.25)'; ctx.lineWidth=2; [50,30].forEach(r=>{ctx.beginPath();ctx.arc(x,y,r,Math.PI,0);ctx.stroke();});
  // pantalla de LUNIA
  circle(x,y-36,20); ctx.fillStyle='#0f2550'; ctx.fill(); ctx.strokeStyle=P.aqua; ctx.lineWidth=3; ctx.shadowColor=P.aqua; ctx.shadowBlur=12; ctx.stroke(); ctx.shadowBlur=0;
  const bl=(A%3.6)<.15?.15:1; ctx.fillStyle=P.white; ell(x-7,y-38,3,5*bl); ctx.fill(); ell(x+7,y-38,3,5*bl); ctx.fill();
  ctx.strokeStyle=P.white; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y-33,5,.2*Math.PI,.8*Math.PI); ctx.stroke();
  // antena
  ctx.strokeStyle='#C9CBD8'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(x,y-70); ctx.lineTo(x,y-100); ctx.stroke();
  circle(x,y-102,4); ctx.fillStyle=(A%1.4)<.3?P.aqua:'rgba(111,227,232,.35)'; ctx.fill();
  ctx.font='900 16px Nunito, sans-serif'; const tw=ctx.measureText('BASE LUNIA').width; rr(x-tw/2-14,y+24,tw+28,26,13); ctx.fillStyle='rgba(11,15,58,.9)'; ctx.fill(); ctx.strokeStyle=P.aqua; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle=P.aqua; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(L('BASE LUNIA','LUNIA BASE'),x,y+38); ctx.textBaseline='alphabetic';
}
function drawLandingPad(A){
  const {x,y}=PAD;
  ell(x,y+8,60,22); ctx.fillStyle='#1d1f45'; ctx.fill(); ell(x,y,60,22); ctx.fillStyle='#55588a'; ctx.fill();
  ctx.strokeStyle=P.amber; ctx.lineWidth=2; ell(x,y,44,16); ctx.stroke(); ctx.font='900 18px Nunito'; ctx.fillStyle='rgba(255,181,71,.7)'; ctx.textAlign='center'; ctx.fillText('H',x,y+6);
  // cohete pequeño
  const rx=x+4, ry=y-4;
  ctx.strokeStyle='#C9CFE6'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(rx-10,ry-14); ctx.lineTo(rx-18,ry); ctx.moveTo(rx+10,ry-14); ctx.lineTo(rx+18,ry); ctx.stroke();
  ctx.fillStyle=P.pink; ctx.beginPath(); ctx.moveTo(rx-12,ry-24); ctx.lineTo(rx-22,ry-6); ctx.lineTo(rx-12,ry-10); ctx.fill(); ctx.beginPath(); ctx.moveTo(rx+12,ry-24); ctx.lineTo(rx+22,ry-6); ctx.lineTo(rx+12,ry-10); ctx.fill();
  ctx.fillStyle='#F2F5FF'; ctx.beginPath(); ctx.moveTo(rx,ry-70); ctx.quadraticCurveTo(rx+14,ry-50,rx+13,ry-10); ctx.lineTo(rx-13,ry-10); ctx.quadraticCurveTo(rx-14,ry-50,rx,ry-70); ctx.fill();
  ctx.fillStyle=P.pink; ctx.beginPath(); ctx.moveTo(rx,ry-70); ctx.quadraticCurveTo(rx+8,ry-62,rx+10,ry-56); ctx.lineTo(rx-10,ry-56); ctx.quadraticCurveTo(rx-8,ry-62,rx,ry-70); ctx.fill();
  circle(rx,ry-42,5); ctx.fillStyle=P.cyan; ctx.fill();
  ctx.font='900 13px Nunito, sans-serif'; const t=L('✓ Llegada a la Luna','✓ Arrival at the Moon'); const tw=ctx.measureText(t).width; rr(x-tw/2-12,y+20,tw+24,24,12); ctx.fillStyle='rgba(11,15,58,.9)'; ctx.fill(); ctx.strokeStyle=P.amber; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle=P.amber; ctx.textBaseline='middle'; ctx.fillText(t,x,y+33); ctx.textBaseline='alphabetic';
}
// Ruta de vuelo: Marte solo se alcanza en el cohete
const FL0={x:PAD.x+4,y:PAD.y-80}, FLC={x:620,y:40}, FL1={x:MARS.x-58,y:MARS.y+18};
function flightRoute(A,u){
  ctx.save(); ctx.lineCap='round'; ctx.setLineDash([4,12]); ctx.lineDashOffset=-A*(u>=1?40:6);
  ctx.strokeStyle=u>=1?`rgba(63,209,122,${.7+.3*Math.sin(A*3)})`:'rgba(232,233,242,.35)'; ctx.lineWidth=u>=1?5:4;
  ctx.beginPath(); ctx.moveTo(FL0.x,FL0.y); ctx.quadraticCurveTo(FLC.x,FLC.y,FL1.x,FL1.y); ctx.stroke(); ctx.restore();
  // punta de flecha junto a Marte
  const p=q(FL0,FLC,FL1,.97), p2=q(FL0,FLC,FL1,1), ang=Math.atan2(p2.y-p.y,p2.x-p.x);
  ctx.save(); ctx.translate(p2.x,p2.y); ctx.rotate(ang); ctx.fillStyle=u>=1?P.green:'rgba(232,233,242,.45)';
  ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(-8,-7); ctx.lineTo(-8,7); ctx.closePath(); ctx.fill(); ctx.restore();
  // cohete fantasma que recorre la ruta cuando ya está desbloqueada
  if(u>=1){ const t=(A*.18)%1, r=q(FL0,FLC,FL1,t), r2=q(FL0,FLC,FL1,Math.min(1,t+.01)), an=Math.atan2(r2.y-r.y,r2.x-r.x), s=10;
    ctx.save(); ctx.globalAlpha=Math.sin(t*Math.PI); ctx.translate(r.x,r.y); ctx.rotate(an);
    ctx.fillStyle=P.amber; ctx.beginPath(); ctx.moveTo(-s*.6,-s*.25); ctx.lineTo(-s*1.6-Math.random()*4,0); ctx.lineTo(-s*.6,s*.25); ctx.fill();
    ctx.fillStyle=P.pink; ctx.beginPath(); ctx.moveTo(-s*.5,-s*.4); ctx.lineTo(-s*.8,-s*.7); ctx.lineTo(-s*.1,-s*.35); ctx.fill(); ctx.beginPath(); ctx.moveTo(-s*.5,s*.4); ctx.lineTo(-s*.8,s*.7); ctx.lineTo(-s*.1,s*.35); ctx.fill();
    ctx.fillStyle='#F2F5FF'; ctx.beginPath(); ctx.moveTo(s,0); ctx.quadraticCurveTo(s*.3,-s*.45,-s*.6,-s*.35); ctx.lineTo(-s*.6,s*.35); ctx.quadraticCurveTo(s*.3,s*.45,s,0); ctx.fill(); ctx.restore(); }
  // candado / letrero a mitad de la ruta
  const m=q(FL0,FLC,FL1,.5), n=ST.filter(s=>done[s.id]).length;
  ctx.font='900 15px Nunito, sans-serif'; const t=u>=1?L('🚀 Ruta a Marte abierta','🚀 Route to Mars open'):L(`🔒 Ruta a Marte · ${n}/5`,`🔒 Route to Mars · ${n}/5`); const tw=ctx.measureText(t).width;
  rr(m.x-tw/2-14,m.y-15,tw+28,30,15); ctx.fillStyle='rgba(11,15,58,.92)'; ctx.fill(); ctx.strokeStyle=u>=1?P.green:P.coral; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle=u>=1?P.green:P.white; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(t,m.x,m.y+1); ctx.textBaseline='alphabetic';
}
// letrero sobre el cohete: el cohete es el transporte a Marte
function rocketSign(A,u){
  const x=PAD.x+4, y=PAD.y-96, bob=Math.sin(A*2)*3;
  ctx.font='900 14px Nunito, sans-serif'; const t=u>=1?L('¡Listo para ir a Marte!','Ready to go to Mars!'):L('Cohete a Marte','Rocket to Mars'); const tw=ctx.measureText(t).width;
  rr(x-tw/2-30,y-14+bob,tw+44,28,14); ctx.fillStyle='rgba(11,15,58,.92)'; ctx.fill(); ctx.strokeStyle=u>=1?P.green:P.coral; ctx.lineWidth=2; ctx.stroke();
  ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(u>=1?'🚀':'🔒',x-tw/2-20,y+1+bob); ctx.fillStyle=u>=1?P.green:P.white; ctx.fillText(t,x-tw/2+2,y+1+bob); ctx.textBaseline='alphabetic';
  // motores listos: brillo bajo el cohete al desbloquear
  if(u>0){ const g=ctx.createRadialGradient(x,PAD.y,4,x,PAD.y,70); g.addColorStop(0,`rgba(63,209,122,${.35*u*(.7+.3*Math.sin(A*4))})`); g.addColorStop(1,'rgba(63,209,122,0)'); ctx.fillStyle=g; ell(x,PAD.y,70,26); ctx.fill(); }
}

/* ---------------- Rover que pasea ----------------
   Recorre la red de caminos: camino de una estación → anillo alrededor de la base
   (siempre por delante del domo) → camino de la estación destino.
   Pasea al azar entre las 5 estaciones; al hacer clic en una, va directo hacia ella
   y se queda ahí mientras la ficha esté abierta. */
const RING={rx:150,ry:58};          // anillo de la plataforma central por donde cambia de camino
const T_PARADA=.8;                  // dónde se estaciona en cada camino (0 = base, 1 = estación)
const VEL_PASEO=95, VEL_DIRECTO=200; // px/s
// Ángulo en [-π/2, 3π/2): al interpolar entre dos caminos el rover pasa por abajo (delante de la base)
const ringAng=p=>{ let a=Math.atan2((p.y-HUB.y)/RING.ry,(p.x-HUB.x)/RING.rx); if(a<-Math.PI/2) a+=TAU; return a; };
const ringPt=a=>({x:HUB.x+Math.cos(a)*RING.rx, y:HUB.y+Math.sin(a)*RING.ry});
// Punto donde cada camino cruza el anillo
ST.forEach(s=>{ let lo=0,hi=1; for(let i=0;i<30;i++){ const m=(lo+hi)/2, p=q(HUB,s.c,s,m); if(((p.x-HUB.x)/RING.rx)**2+((p.y-HUB.y)/RING.ry)**2<1) lo=m; else hi=m; }
  s.tRing=(lo+hi)/2; s.aRing=ringAng(q(HUB,s.c,s,s.tRing)); });

function tramoCamino(s,t0,t1,out){ const n=Math.max(2,Math.ceil(Math.abs(t1-t0)*40)); for(let i=0;i<=n;i++){ const t=lerp(t0,t1,i/n); out.push({...q(HUB,s.c,s,t),s,t}); } }
function tramoAnillo(a0,a1,out){ const n=Math.max(2,Math.ceil(Math.abs(a1-a0)*12)); for(let i=0;i<=n;i++){ const a=lerp(a0,a1,i/n); out.push({...ringPt(a),a}); } }
// Ruta desde la posición actual (en un camino {s,t} o en el anillo {a}) hasta la estación destino
function ruta(desde,dest){
  const pts=[];
  if(desde.s===dest){ tramoCamino(dest,desde.t,T_PARADA,pts); }
  else {
    if(desde.s){ tramoCamino(desde.s,desde.t,desde.s.tRing,pts); tramoAnillo(desde.s.aRing,dest.aRing,pts); }
    else tramoAnillo(desde.a,dest.aRing,pts);
    tramoCamino(dest,dest.tRing,T_PARADA,pts);
  }
  let L=0; pts.forEach((p,i)=>{ if(i) L+=Math.hypot(p.x-pts[i-1].x,p.y-pts[i-1].y); p.L=L; });
  return pts;
}

const rover=(()=>{ const s=ST[Math.floor(Math.random()*ST.length)]; return {pos:{...q(HUB,s.c,s,T_PARADA),s,t:T_PARADA}, pts:null, d:0, vel:VEL_PASEO, espera:1+Math.random(), fija:null, dir:1}; })();
function roverIrA(dest,directo){
  rover.vel=directo?VEL_DIRECTO:VEL_PASEO;
  if(!rover.pts && rover.pos.s===dest && rover.pos.t===T_PARADA) return;   // ya está ahí
  rover.pts=ruta(rover.pos,dest); rover.d=0;
}
function updateRover(dt){
  if(rover.pts){
    const pts=rover.pts, tot=pts[pts.length-1].L;
    rover.d+=rover.vel*dt;
    if(rover.d>=tot){ rover.pos=pts[pts.length-1]; rover.pts=null; rover.espera=1.2+Math.random()*1.8; return; }
    let i=1; while(pts[i].L<rover.d) i++;
    const a=pts[i-1], b=pts[i], k=(rover.d-a.L)/((b.L-a.L)||1);
    const pos={x:lerp(a.x,b.x,k), y:lerp(a.y,b.y,k)};
    if(a.s&&a.s===b.s){ pos.s=a.s; pos.t=lerp(a.t,b.t,k); }
    else if(a.a!==undefined&&b.a!==undefined) pos.a=lerp(a.a,b.a,k);
    else Object.assign(pos,b.s?{s:b.s,t:b.t}:{a:b.a});           // unión camino/anillo (mismo punto)
    if(Math.abs(pos.x-rover.pos.x)>.05) rover.dir=Math.sign(pos.x-rover.pos.x);
    rover.pos=pos;
  } else if(!rover.fija){
    rover.espera-=dt;
    if(rover.espera<=0){ const otras=ST.filter(s=>s!==rover.pos.s); roverIrA(otras[Math.floor(Math.random()*otras.length)],false); }
  }
}
function drawRover(A){
  const p=rover.pos, bump=rover.pts?Math.sin(A*22)*.8:0, dir=rover.dir;
  ctx.save(); ctx.translate(p.x,p.y-8+bump); ctx.scale(dir,1);
  ctx.fillStyle='rgba(0,0,0,.3)'; ell(0,10,16,4); ctx.fill();
  rr(-14,-6,28,10,4); ctx.fillStyle='#E3E6F5'; ctx.fill(); ctx.fillStyle=P.amber; ctx.fillRect(-14,-2,28,3);
  rr(-6,-14,12,8,3); ctx.fillStyle=P.cyan; ctx.fill();
  ctx.strokeStyle='#C9CBD8'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(8,-6); ctx.lineTo(10,-18); ctx.stroke();
  for(const wx of [-9,0,9]){ circle(wx,5,4); ctx.fillStyle='#2b2d4c'; ctx.fill(); }
  ctx.restore();
}

/* ---------------- Interacción ---------------- */
let hover=null;
const tip=document.getElementById('tip');
function toLocal(e){ const r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H}; }
function hit(p){
  for(const s of ST) if(Math.hypot(p.x-s.x,(p.y-(s.y-14))*1.4)<70) return s;
  if(Math.hypot(p.x-MARS.x,p.y-MARS.y)<MARS.r+10) return 'marte';
  if(Math.hypot(p.x-PAD.x,(p.y-(PAD.y-40))*.8)<60) return 'cohete';
  return null;
}
const esEstacion=h=>h&&typeof h==='object';
cv.addEventListener('mousemove',e=>{ const h=hit(toLocal(e)); cv.style.cursor=h?'pointer':'default'; hover=esEstacion(h)?h:null; });
// Al cerrar la ficha, el rover vuelve a pasear
function cerrarTip(){ tip.classList.remove('on'); if(rover.fija){ rover.fija=null; rover.espera=1.5; } }
cv.addEventListener('click',e=>{ const h=hit(toLocal(e)); if(!h){ cerrarTip(); return; }
  if(esEstacion(h)){ rover.fija=h; roverIrA(h,true); }   // el rover va directo a la estación elegida
  showTip(h); });
function showTip(h){
  const r=cv.getBoundingClientRect(), sc=r.width/W;
  const tN=document.getElementById('tNom'), tD=document.getElementById('tDesc'), tE=document.getElementById('tEst'), tG=document.getElementById('tGo');
  let x,y,col,abajo=false;
  if(h==='marte'||h==='cohete'){
    const ok=unlockT>=0; col=P.coral;
    // La ficha aparece junto a lo que se pulsó: sobre el letrero del cohete, o debajo de Marte
    // (Marte está pegado al borde superior, así que encima no cabe)
    if(h==='cohete'){ x=PAD.x+4; y=PAD.y-112; }
    else { x=MARS.x; y=MARS.y+MARS.r+52; abajo=true; }
    tN.textContent=L('Marte · Misión 2','Mars · Mission 2'); tD.textContent=ok?L('¡Tu cohete está listo! Súbete y viaja a Marte: la segunda parte de la misión te espera en el planeta rojo.','Your rocket is ready! Get on board and travel to Mars: the second part of the mission is waiting for you on the red planet.'):L('A Marte se viaja en el cohete. Para que pueda despegar, primero tienes que completar las 5 misiones de la base lunar.','You travel to Mars in the rocket. Before it can take off, you need to complete the 5 missions of the lunar base.');
    tE.textContent=ok?L('🔓 Disponible','🔓 Available'):L(`🔒 Bloqueado · ${ST.filter(s=>done[s.id]).length} de 5 misiones`,`🔒 Locked · ${ST.filter(s=>done[s.id]).length} of 5 missions`); tE.style.color=ok?P.green:P.coral;
    tG.disabled=false; tG.classList.remove('bloqueado');
    tG.style.display=ok?'':'none'; tG.textContent=L('🚀 Despegar hacia Marte','🚀 Launch to Mars'); tG.onclick=()=>dispatchEvent(new CustomEvent('mapa:marte'));
  } else {
    x=h.x; y=h.y-62; col=h.col;
    tN.textContent=h.nom; tD.textContent=h.desc;
    // Las estaciones sin misión todavía (2, 3, 4 y 5) muestran su información pero no se pueden abrir
    const bloqueada=estacionBloqueada(h.id);
    tE.textContent=bloqueada?L('🔒 Bloqueada · Muy pronto','🔒 Locked · Coming soon'):done[h.id]?L('⭐ Completada','⭐ Completed'):L('● Disponible','● Available');
    tE.style.color=bloqueada?P.coral:done[h.id]?P.amber:col;
    tG.style.display=''; tG.disabled=bloqueada; tG.classList.toggle('bloqueado',bloqueada);
    tG.textContent=bloqueada?L('🔒 Entrar','🔒 Enter'):done[h.id]?L('Jugar otra vez ▶','Play again ▶'):L('Entrar ▶','Enter ▶');
    tG.onclick=()=>{ if(bloqueada) return; dispatchEvent(new CustomEvent('mapa:entrar',{detail:{id:h.id}})); try{ if(parent!==window) parent.postMessage({type:'mapa-entrar',id:h.id},'*'); }catch(e){}
      if(MISSION_SCREENS[h.id]) location.href=MISSION_SCREENS[h.id]; };
  }
  tip.classList.toggle('abajo',abajo);
  tip.style.borderColor=col; tip.style.left=(x*sc)+'px'; tip.style.top=((abajo?y:Math.max(140,y))*sc)+'px'; tip.classList.add('on');
}

/* ---------------- Progreso ---------------- */
const aviso=document.getElementById('aviso');
function updateProgress(){
  const n=ST.filter(s=>done[s.id]).length;
  document.getElementById('barra').style.width=(n/5*100)+'%';
  document.getElementById('prog').textContent=n===5?L('¡Completaste las 5 misiones! Marte te espera.','You completed all 5 missions! Mars is waiting.'):L(`Misiones completadas: ${n} de 5`,`Missions completed: ${n} of 5`);
  if(n===5 && unlockT<0){ unlockT=A; aviso.classList.add('on'); setTimeout(()=>aviso.classList.remove('on'),3500); }
  if(n<5) unlockT=-1;
}
function completar(id){ if(id in done){ done[id]=true; updateProgress(); } }
try{ const g=JSON.parse(localStorage.getItem('equilibria_misiones')||'{}'); for(const k in g) if(k in done) done[k]=!!g[k]; }catch(e){}
function save(){ try{ localStorage.setItem('equilibria_misiones',JSON.stringify(done)); }catch(e){} }
window.EquilibriaMapa={ completar:id=>{completar(id);save();}, estado:()=>({...done}), reiniciar:()=>{ ST.forEach(s=>done[s.id]=false); updateProgress(); save(); },
  // El juego que contiene el mapa avisa cuándo se muestra u oculta (p. ej. al entrar a una misión)
  mostrar:()=>{ visibleMapa=true; sonar(); }, ocultar:()=>{ visibleMapa=false; callar(); } };
document.getElementById('dComp').onclick=()=>{ cerrarTip(); ST.forEach((s,i)=>setTimeout(()=>{ completar(s.id); save(); },i*450)); };
document.getElementById('dReset').onclick=()=>{ cerrarTip(); window.EquilibriaMapa.reiniciar(); };

/* ---------------- Sonido ambiental ----------------
   Suena en bucle mientras se ve la base. Los navegadores bloquean el audio
   automático: si pasa, arranca con el primer clic o tecla del usuario.
   Se pausa al cambiar de pestaña y el botón 🔊 lo silencia (se recuerda). */
const ambiente=document.getElementById('ambiente'), btnSonido=document.getElementById('btnSonido');
const VOL_AMBIENTE=.45;
let mudo=false, visibleMapa=true, fundido=null;
try{ mudo=localStorage.getItem('equilibria_sonido_mudo')==='1'; }catch(e){}
function fundirA(obj,ms,alTerminar){
  clearInterval(fundido); const ini=ambiente.volume, t0=performance.now();
  fundido=setInterval(()=>{ const k=clamp((performance.now()-t0)/ms); ambiente.volume=lerp(ini,obj,k); if(k>=1){ clearInterval(fundido); alTerminar&&alTerminar(); } },30);
}
function sonar(){
  if(mudo||!visibleMapa||document.hidden) return;
  if(ambiente.paused){
    ambiente.volume=0;
    const p=ambiente.play();
    if(p&&p.then) p.then(quitarGestos,err=>{ if(err.name!=='NotAllowedError') console.warn('Sonido ambiental:',err.name,err.message); });
  }
  fundirA(VOL_AMBIENTE,1500);
}
function callar(){ fundirA(0,400,()=>ambiente.pause()); }
// El botón refleja si de verdad está sonando (no solo la preferencia)
function pintarBoton(){ const on=!ambiente.paused&&!mudo; btnSonido.textContent=on?'🔊':'🔇'; btnSonido.classList.toggle('mudo',!on); btnSonido.setAttribute('aria-label',on?L('Silenciar sonido ambiental','Mute background sound'):L('Activar sonido ambiental','Turn on background sound')); }
ambiente.addEventListener('play',pintarBoton); ambiente.addEventListener('pause',pintarBoton);
ambiente.addEventListener('error',()=>console.warn('Sonido ambiental: no se pudo cargar',ambiente.currentSrc,ambiente.error&&ambiente.error.code));
btnSonido.onclick=e=>{
  e.stopPropagation();
  const sonando=!ambiente.paused&&!mudo;
  mudo=sonando;   // si no estaba sonando (silenciado o bloqueado por el navegador), el botón lo enciende
  try{ localStorage.setItem('equilibria_sonido_mudo',mudo?'1':'0'); }catch(err){}
  mudo?callar():sonar(); pintarBoton();
};
// Primer gesto del usuario: se escuchan varios eventos porque cada navegador cuenta distintos
// (Safari no acepta pointerdown). Se siguen escuchando hasta que el audio arranque de verdad.
const GESTOS=['pointerdown','mousedown','touchend','click','keydown'];
function alGesto(e){ if(e.target!==btnSonido && ambiente.paused) sonar(); }   // el botón tiene su propia lógica
function quitarGestos(){ GESTOS.forEach(g=>document.removeEventListener(g,alGesto,true)); }
GESTOS.forEach(g=>document.addEventListener(g,alGesto,true));
document.addEventListener('visibilitychange',()=>document.hidden?callar():sonar());
pintarBoton(); sonar();

/* ---------------- Bucle ---------------- */
let A=0, last=performance.now();
function frame(now){
  const dt=Math.max(0,Math.min(.05,(now-last)/1000)); last=now; A+=dt;
  const u=unlockT<0?0:clamp((A-unlockT)/2.2);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawSky(A); drawMars(A,u); drawGround();
  flightRoute(A,u);
  // caminos
  road(PAD,PADC,HUB,26,'#6b6ea0');
  for(const s of ST) road(HUB,s.c,s,26,'#6b6ea0');
  pads(PAD,PADC,HUB,5,P.amber,A,false);
  for(const s of ST) pads(HUB,s.c,s,4,done[s.id]?P.amber:s.col,A+ST.indexOf(s)*.3,false);
  // objetos ordenados por profundidad
  const items=[...ST.map(s=>({y:s.y,f:()=>drawStation(s,A,hover===s)})),{y:HUB.y,f:()=>drawHub(A)},{y:PAD.y,f:()=>drawLandingPad(A)}].sort((a,b)=>a.y-b.y);
  for(const it of items) it.f();
  rocketSign(A,u);
  updateRover(dt); drawRover(A);
  const vg=ctx.createRadialGradient(640,400,300,640,400,820); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.45)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  requestAnimationFrame(frame);
}
updateProgress();
requestAnimationFrame(frame);
})();
