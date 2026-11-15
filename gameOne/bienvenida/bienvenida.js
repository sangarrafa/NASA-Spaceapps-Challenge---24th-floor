(() => {
const L=window.EqLang?window.EqLang.L:(es)=>es;
/* -------------------------------------------------------------
   Pantalla de bienvenida · Misión Equilibria
   Integración: al enviar el nombre se emite el evento window
   'equilibria:login' con {detail:{nombre}} y un postMessage
   {type:'equilibria-login', nombre} al contenedor. El nombre también
   se guarda en este navegador (localStorage 'equilibria_nombre').
   ------------------------------------------------------------- */
const stage=document.getElementById('stage'), cv=document.getElementById('c'), ctx=cv.getContext('2d');
const W=1280,H=720; let dpr=1;
function resize(){ dpr=Math.min(2,devicePixelRatio||1); cv.width=W*dpr; cv.height=H*dpr; stage.style.setProperty('--s',stage.clientWidth/W); requestAnimationFrame(drawArrow); }
addEventListener('resize',resize); resize();

const P={navy:'#0B0F3A',indigo:'#1E1B6E',pink:'#E8418C',magenta:'#A0279E',aqua:'#6FE3E8',cyan:'#21C1E0',amber:'#FFB547',coral:'#FF7A5C',white:'#E8E9F2'};
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,TAU);}
function ell(x,y,rx,ry,rot=0){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,TAU);}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}

/* ---------- elementos precalculados ---------- */
const R=rng(17);
const stars=[]; for(let i=0;i<420;i++) stars.push({x:R()*W,y:R()*H,r:R()<.92?R()*1.2+.3:R()*1.6+1.2,p:R()*TAU,sp:.6+R()*2.4,c:R()<.15?'#FFE2B0':R()<.15?'#C9F6FF':'#E8E9F2'});
const nebulas=[{x:820,y:120,r:320,c:'160,39,158'},{x:300,y:420,r:280,c:'30,27,110'},{x:1100,y:260,r:240,c:'232,65,140'}];
const land=[], clouds=[]; {const r=rng(5); for(let i=0;i<26;i++) land.push({lon:r()*TAU,lat:(r()-.5)*2,r:.1+r()*.18}); for(let i=0;i<20;i++) clouds.push({lon:r()*TAU,lat:(r()-.5)*2.2,r:.05+r()*.1});}
const mcraters=[]; {const r=rng(21); for(let i=0;i<10;i++){const a=r()*TAU,d=Math.sqrt(r())*.75; mcraters.push({x:Math.cos(a)*d,y:Math.sin(a)*d,r:.08+r()*.14});}}
const marsSpots=[]; {const r=rng(33); for(let i=0;i<9;i++){const a=r()*TAU,d=Math.sqrt(r())*.75; marsSpots.push({x:Math.cos(a)*d,y:Math.sin(a)*d,rx:.12+r()*.2,ry:.06+r()*.1});}}
const asteroids=[]; {const r=rng(8); for(let i=0;i<5;i++){ const pts=[]; const n=7+Math.floor(r()*3); for(let k=0;k<n;k++) pts.push(.7+r()*.3); asteroids.push({x:r()*W,y:80+r()*560,s:5+r()*9,vx:4+r()*8,vy:(r()-.5)*4,rot:r()*TAU,vr:(r()-.5)*.6,pts}); }}

let A=0;

/* ---------- cuerpos ---------- */
const EARTH={x:150,y:650,r:240}, MOON={x:250,y:165,r:58}, MARS={x:1125,y:540,r:118};

function drawStars(){
  for(const s of stars){ ctx.globalAlpha=.35+.65*Math.max(0,Math.sin(A*s.sp+s.p)); ctx.fillStyle=s.c; circle(s.x,s.y,s.r); ctx.fill();
    if(s.r>1.6 && Math.sin(A*s.sp+s.p)>.85){ ctx.strokeStyle=s.c; ctx.lineWidth=1; ctx.globalAlpha*=.6; ctx.beginPath(); ctx.moveTo(s.x-6,s.y); ctx.lineTo(s.x+6,s.y); ctx.moveTo(s.x,s.y-6); ctx.lineTo(s.x,s.y+6); ctx.stroke(); } }
  ctx.globalAlpha=1;
}
function drawNebulas(){
  for(const n of nebulas){ const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r); g.addColorStop(0,`rgba(${n.c},.28)`); g.addColorStop(1,`rgba(${n.c},0)`); ctx.fillStyle=g; ctx.fillRect(n.x-n.r,n.y-n.r,n.r*2,n.r*2); }
}
function drawEarth(){
  const {x,y,r}=EARTH;
  ctx.save();
  const at=ctx.createRadialGradient(x,y,r*.95,x,y,r*1.16); at.addColorStop(0,'rgba(111,227,232,.55)'); at.addColorStop(1,'rgba(111,227,232,0)'); ctx.fillStyle=at; circle(x,y,r*1.16); ctx.fill();
  const og=ctx.createRadialGradient(x-r*.3,y-r*.35,r*.1,x,y,r); og.addColorStop(0,'#4aa0f0'); og.addColorStop(1,'#123f99'); circle(x,y,r); ctx.fillStyle=og; ctx.fill(); ctx.clip();
  const blobs=(arr,col,rot)=>{ctx.fillStyle=col; for(const b of arr){const lo=b.lon+A*rot,z=Math.cos(lo)*Math.cos(b.lat); if(z<-.05)continue;
    ell(x+r*Math.sin(lo)*Math.cos(b.lat),y+r*Math.sin(b.lat)*.95,b.r*r*Math.max(.25,z),b.r*r*.75); ctx.fill();}};
  blobs(land,'#3fae6a',.05); blobs(clouds,'rgba(255,255,255,.6)',.07);
  const sh=ctx.createLinearGradient(x-r,y-r,x+r*.6,y+r*.4); sh.addColorStop(0,'rgba(5,8,30,.7)'); sh.addColorStop(.5,'rgba(5,8,30,0)'); ctx.fillStyle=sh; ctx.fillRect(x-r,y-r,r*2,r*2);
  ctx.restore();
}
function drawMoonBody(){
  const {x,y,r}=MOON;
  ctx.save();
  const gl=ctx.createRadialGradient(x,y,r*.9,x,y,r*1.6); gl.addColorStop(0,'rgba(200,190,255,.3)'); gl.addColorStop(1,'rgba(200,190,255,0)'); ctx.fillStyle=gl; circle(x,y,r*1.6); ctx.fill();
  const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r); g.addColorStop(0,'#F0F0F8'); g.addColorStop(.65,'#B9BACB'); g.addColorStop(1,'#7C7E9C');
  circle(x,y,r); ctx.fillStyle=g; ctx.fill(); ctx.clip();
  ctx.fillStyle='rgba(80,82,120,.4)'; for(const c of mcraters){ circle(x+c.x*r,y+c.y*r,c.r*r); ctx.fill(); }
  ctx.restore();
}
function drawMarsBody(){
  const {x,y,r}=MARS;
  ctx.save();
  const gl=ctx.createRadialGradient(x,y,r*.95,x,y,r*1.2); gl.addColorStop(0,'rgba(255,122,92,.35)'); gl.addColorStop(1,'rgba(255,122,92,0)'); ctx.fillStyle=gl; circle(x,y,r*1.2); ctx.fill();
  const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r); g.addColorStop(0,'#FFA978'); g.addColorStop(.6,'#E0603E'); g.addColorStop(1,'#8E2F2A');
  circle(x,y,r); ctx.fillStyle=g; ctx.fill(); ctx.clip();
  ctx.fillStyle='rgba(120,40,30,.35)'; for(const m of marsSpots){ ell(x+m.x*r+Math.sin(A*.05)*4,y+m.y*r,m.rx*r,m.ry*r,.3); ctx.fill(); }
  ctx.fillStyle='rgba(255,245,240,.85)'; ell(x-r*.05,y-r*.93,r*.32,r*.12); ctx.fill();   // casquete polar
  const sh=ctx.createLinearGradient(x+r*.2,y,x+r,y+r*.3); sh.addColorStop(0,'rgba(20,6,20,0)'); sh.addColorStop(1,'rgba(20,6,20,.55)'); ctx.fillStyle=sh; ctx.fillRect(x-r,y-r,r*2,r*2);
  ctx.restore();
  ctx.font='800 15px Nunito, sans-serif'; ctx.fillStyle='rgba(232,233,242,.7)'; ctx.textAlign='center'; ctx.fillText(L('Marte','Mars'),x,y+r+26);
}
// base sobre un planeta, en el ángulo a (0 = derecha, -π/2 = arriba)
function drawBase(cx,cy,R,a,s,col,light){
  const bx=cx+Math.cos(a)*R, by=cy+Math.sin(a)*R;
  ctx.save(); ctx.translate(bx,by); ctx.rotate(a+Math.PI/2); ctx.scale(s,s);
  // panel solar
  ctx.strokeStyle='#7a7da3'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-30,0); ctx.lineTo(-30,-16); ctx.stroke();
  ctx.save(); ctx.translate(-30,-19); ctx.rotate(-.3); ctx.fillStyle='#2f3a7a'; ctx.fillRect(-13,-6,26,12); ctx.strokeStyle='#6FE3E8'; ctx.lineWidth=1; ctx.strokeRect(-13,-6,26,12); ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(0,6); ctx.stroke(); ctx.restore();
  // módulo
  ctx.fillStyle=col[1]; ctx.beginPath(); ctx.roundRect(4,-14,30,14,6); ctx.fill();
  // cúpula
  const g=ctx.createRadialGradient(-6,-14,2,0,-6,22); g.addColorStop(0,col[0]); g.addColorStop(1,col[1]);
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,18,Math.PI,0); ctx.closePath(); ctx.fill();
  // ventanas encendidas
  const on=.6+.4*Math.sin(A*3+light);
  ctx.fillStyle=`rgba(255,212,120,${on})`; ctx.shadowColor='#FFB547'; ctx.shadowBlur=8;
  circle(6,-9,3); ctx.fill(); circle(15,-7,2.6); ctx.fill(); circle(25,-7,2.6); ctx.fill(); ctx.shadowBlur=0;
  // antena con luz
  ctx.strokeStyle='#C9CBD8'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(0,-34); ctx.stroke();
  const bl=(A+light)%1.6<.25; circle(0,-35,2.6); ctx.fillStyle=bl?P.pink:'rgba(232,65,140,.35)'; if(bl){ctx.shadowColor=P.pink;ctx.shadowBlur=10;} ctx.fill(); ctx.shadowBlur=0;
  ctx.restore();
}
function drawSatellite(){
  // pequeño satélite que orbita la Tierra
  const a=A*.35, x=EARTH.x+Math.cos(a)*(EARTH.r+50), y=EARTH.y+Math.sin(a)*(EARTH.r+50)*.55-30;
  if(Math.sin(a)>.6) return;   // detrás de la Tierra
  ctx.save(); ctx.translate(x,y); ctx.rotate(a);
  ctx.fillStyle='#C9CBD8'; ctx.fillRect(-4,-4,8,8); ctx.fillStyle='#2f3a7a'; ctx.fillRect(-18,-3,12,6); ctx.fillRect(6,-3,12,6);
  ctx.restore();
}

/* ---------- cohete en viaje: Tierra → Luna → Marte ---------- */
const PATH=[ {x:300,y:440},{x:240,y:340},{x:330,y:230},{x:350,y:90}, {x:620,y:30},{x:1010,y:60},{x:1040,y:260},{x:1050,y:390} ];
function bez(p0,p1,p2,p3,t){const u=1-t;return{x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y};}
function rocketAt(t){ // t 0..1 a lo largo de los dos tramos
  if(t<.45){ const k=t/.45; return bez(PATH[0],PATH[1],PATH[2],PATH[3],k); }
  const k=(t-.45)/.55; return bez(PATH[3],PATH[4],PATH[5],PATH[6],k);
}
const trail=[];
function drawRocket(){
  const CYCLE=16, ph=(A%CYCLE)/CYCLE;
  const t=clamp((ph-.04)/.86);
  const fade=Math.min(clamp((ph-.04)/.05),clamp((.92-ph)/.05));
  const p=rocketAt(t), q=rocketAt(Math.min(1,t+.004));
  trail.push({x:p.x,y:p.y,a:fade}); if(trail.length>70) trail.shift();
  if(ph<.05) trail.length=0;
  ctx.save(); for(let i=1;i<trail.length;i++){ const a=i/trail.length*.5*trail[i].a; ctx.strokeStyle=`rgba(255,181,71,${a})`; ctx.lineWidth=i/trail.length*4; ctx.beginPath(); ctx.moveTo(trail[i-1].x,trail[i-1].y); ctx.lineTo(trail[i].x,trail[i].y); ctx.stroke(); } ctx.restore();
  if(fade<=0) return;
  const ang=Math.atan2(q.y-p.y,q.x-p.x), s=15;
  ctx.save(); ctx.globalAlpha=fade; ctx.translate(p.x,p.y); ctx.rotate(ang);
  const l=s*(1.1+Math.random()*.7);
  ctx.fillStyle='#FFB547'; ctx.beginPath(); ctx.moveTo(-s*.6,-s*.3); ctx.lineTo(-s*.6-l,0); ctx.lineTo(-s*.6,s*.3); ctx.fill();
  ctx.fillStyle='#FFF3C4'; ctx.beginPath(); ctx.moveTo(-s*.6,-s*.15); ctx.lineTo(-s*.6-l*.5,0); ctx.lineTo(-s*.6,s*.15); ctx.fill();
  ctx.fillStyle=P.pink; ctx.beginPath(); ctx.moveTo(-s*.5,-s*.45); ctx.lineTo(-s*.85,-s*.75); ctx.lineTo(-s*.1,-s*.35); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-s*.5,s*.45); ctx.lineTo(-s*.85,s*.75); ctx.lineTo(-s*.1,s*.35); ctx.fill();
  ctx.fillStyle='#F2F5FF'; ctx.beginPath(); ctx.moveTo(s,0); ctx.quadraticCurveTo(s*.3,-s*.45,-s*.6,-s*.35); ctx.lineTo(-s*.6,s*.35); ctx.quadraticCurveTo(s*.3,s*.45,s,0); ctx.fill();
  ctx.fillStyle=P.cyan; circle(s*.2,0,s*.16); ctx.fill();
  ctx.restore();
}

/* ---------- meteoritos y estrellas fugaces ---------- */
const meteors=[]; let nextMeteor=1.2;
function spawnMeteor(){
  const big=Math.random()<.3;
  meteors.push({x:200+Math.random()*1000,y:-20,vx:-(260+Math.random()*260),vy:220+Math.random()*200,life:0,max:1.4+Math.random(),big});
}
function drawMeteors(dt){
  nextMeteor-=dt; if(nextMeteor<=0){ spawnMeteor(); nextMeteor=1.5+Math.random()*2.5; }
  for(let i=meteors.length-1;i>=0;i--){ const m=meteors[i]; m.life+=dt; m.x+=m.vx*dt; m.y+=m.vy*dt;
    const a=Math.min(1,m.life*4)*(1-m.life/m.max); if(m.life>m.max){ meteors.splice(i,1); continue; }
    const len=m.big?.22:.14, g=ctx.createLinearGradient(m.x,m.y,m.x-m.vx*len,m.y-m.vy*len);
    g.addColorStop(0,`rgba(255,240,210,${a})`); g.addColorStop(1,'rgba(255,181,71,0)');
    ctx.strokeStyle=g; ctx.lineWidth=m.big?3.2:2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(m.x,m.y); ctx.lineTo(m.x-m.vx*len,m.y-m.vy*len); ctx.stroke();
    ctx.fillStyle=`rgba(255,250,235,${a})`; circle(m.x,m.y,m.big?3:2); ctx.fill(); }
}
function drawAsteroids(dt){
  for(const a of asteroids){ a.x+=a.vx*dt; a.y+=a.vy*dt; a.rot+=a.vr*dt; if(a.x>W+30){a.x=-30;}
    ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(a.rot); ctx.fillStyle='#5a5c7e'; ctx.beginPath();
    a.pts.forEach((k,i)=>{ const ang=i/a.pts.length*TAU, x=Math.cos(ang)*a.s*k, y=Math.sin(ang)*a.s*k; i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
    ctx.closePath(); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.15)'; circle(-a.s*.25,-a.s*.25,a.s*.3); ctx.fill(); ctx.restore(); }
}

/* ---------- bucle ---------- */
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; A+=dt;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const bg=ctx.createRadialGradient(640,300,100,640,360,900); bg.addColorStop(0,'#1a1760'); bg.addColorStop(.5,'#0B0F3A'); bg.addColorStop(1,'#04051a');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  drawNebulas(); drawStars(); drawAsteroids(dt); drawMeteors(dt);
  drawMarsBody(); drawBase(MARS.x,MARS.y,MARS.r,-Math.PI*.76,1.4,['#FFD9C2','#B8705E'],0.7);
  drawMoonBody(); drawBase(MOON.x,MOON.y,MOON.r,-Math.PI*.3,1.0,['#E6E8F2','#8b8da3'],0);
  drawRocket();
  drawEarth(); drawSatellite();
  ctx.font='800 15px Nunito, sans-serif'; ctx.fillStyle='rgba(232,233,242,.7)'; ctx.textAlign='center';
  ctx.fillText(L('Luna','Moon'),MOON.x,MOON.y+MOON.r+26); ctx.fillText(L('Tierra','Earth'),EARTH.x+60,EARTH.y-EARTH.r-22);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- flecha desde "aquí" hasta el recuadro ---------- */
const aqui=document.getElementById('aqui'), input=document.getElementById('nombre'), svg=document.getElementById('flecha');
function drawArrow(){
  const sr=stage.getBoundingClientRect(), a=aqui.getBoundingClientRect(), b=input.getBoundingClientRect(), s=sr.width/W;
  const x0=a.right-sr.left+8*s, y0=a.top-sr.top+a.height*.55;
  const x1=b.right-sr.left-40*s, y1=b.top-sr.top-6*s;
  const c1x=x0+70*s, c1y=y0+4*s, c2x=x1+40*s, c2y=y1-34*s;
  document.getElementById('fl').setAttribute('d',`M${x0},${y0} C${c1x},${c1y} ${c2x},${c2y} ${x1},${y1}`);
  document.getElementById('fl').style.strokeWidth=4*s;
  // punta en la dirección final de la curva
  const ang=Math.atan2(y1-c2y,x1-c2x), L=16*s;
  const p1=[x1-Math.cos(ang-.5)*L,y1-Math.sin(ang-.5)*L], p2=[x1-Math.cos(ang+.5)*L,y1-Math.sin(ang+.5)*L];
  const pt=document.getElementById('punta'); pt.setAttribute('d',`M${p1[0]},${p1[1]} L${x1},${y1} L${p2[0]},${p2[1]}`); pt.style.strokeWidth=5*s;
}
document.fonts && document.fonts.ready.then(drawArrow);
setTimeout(drawArrow,300);
// pequeño rebote de la punta
let bob=0; setInterval(()=>{ bob+=.25; svg.style.transform=`translateY(${Math.sin(bob)*3}px)`; },50);

/* ---------- formulario ---------- */
const go=document.getElementById('go'), msg=document.getElementById('msg');
const limpio=()=>input.value.replace(/\s+/g,' ').trim();
input.addEventListener('input',()=>{
  const n=limpio(); go.disabled=n.length<2;
  msg.textContent = n.length>=2 && !n.includes(' ') ? L('¿Escribiste también tu apellido?','Did you also type your last name?') : '';
});
// Next screen of the flow, linked with a relative path like the other screens do
const NEXT_SCREEN='../antesDeDespegar/index.html';
let leaving=false;
document.getElementById('card').addEventListener('submit',e=>{
  e.preventDefault(); const nombre=limpio(); if(nombre.length<2||leaving) return;
  leaving=true;
  try{ localStorage.setItem('equilibria_nombre',nombre); }catch(err){}
  dispatchEvent(new CustomEvent('equilibria:login',{detail:{nombre}}));
  try{ if(parent!==window) parent.postMessage({type:'equilibria-login',nombre},'*'); }catch(err){}
  const primero=nombre.split(' ')[0];
  document.getElementById('hola').textContent=L(`¡Hola, ${primero}!`,`Hi, ${primero}!`);
  document.getElementById('saludo').classList.add('on');
  input.blur();
  // Let the greeting be read, then hand off to the next screen (event and postMessage were sent above)
  setTimeout(()=>{ location.href=NEXT_SCREEN; },2200);
});
setTimeout(()=>{ try{ input.focus({preventScroll:true}); }catch(e){} },400);
})();
