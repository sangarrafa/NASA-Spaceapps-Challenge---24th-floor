(() => {
/* ---------------------------------------------------------------
   Introducción a la Misión 1.
   - El botón "¡Intenta despegar!" abre el minijuego "Misión 1 · ¡Rumbo a la Luna!".
     Al integrar todo en un solo juego, cambien su href por la pantalla del
     minijuego o escuchen el evento window 'intro-mision1:fin'.
   - Voz: sintética del navegador. Si graban la voz real, pongan aquí los
     archivos (uno por frase, en orden) y se usarán en su lugar.
   --------------------------------------------------------------- */
const VOICE_FILES = [ /* 'audio/intro_0.mp3', 'audio/intro_1.mp3', ... */ ];

const L=window.EqLang?window.EqLang.L:(es)=>es;
const EN_LINES = [
  'You’re ready to go to the Moon and complete your mission!',
  'But watch out! Before liftoff, there’s something you need to know:',
  'the Moon never stands still, it’s always going around the Earth.',
  'Also, a rocket takes about three days to get from the Earth to the Moon, and in that time the Moon keeps moving.',
  'That’s why astronauts don’t aim the rocket at where the Moon is... but at where it will be when the rocket arrives.'
];
const LINES = [
  '¡Estás listo para ir a la Luna y cumplir tu misión!',
  'Pero, ¡cuidado! Antes de despegar, hay algo que debes saber:',
  'la Luna nunca se queda quieta, siempre está dando vueltas alrededor de la Tierra.',
  'Además, un cohete tarda unos tres días en llegar de la Tierra a la Luna, y en ese tiempo la Luna sigue avanzando.',
  'Por eso, los astronautas no apuntan el cohete a donde está la Luna... sino a donde va a estar cuando el cohete llegue.'
];
if(window.EqLang && EqLang.get()==='en') LINES.splice(0, LINES.length, ...EN_LINES);

const stage=document.getElementById('stage'), cv=document.getElementById('c'), ctx=cv.getContext('2d');
const W=1280,H=720; let dpr=1;
function resize(){ dpr=Math.min(2,devicePixelRatio||1); cv.width=W*dpr; cv.height=H*dpr; stage.style.setProperty('--s',stage.clientWidth/W); }
addEventListener('resize',resize); resize();

const P={pink:'#E8418C',aqua:'#6FE3E8',amber:'#FFB547',coral:'#FF7A5C',white:'#E8E9F2'};
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU);}
function ell(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);}

const R=rng(11), stars=[]; for(let i=0;i<260;i++) stars.push({x:R()*W,y:R()*H,r:R()*1.3+.3,p:R()*TAU,sp:.5+R()*2});
const land=[], clouds=[]; {const r=rng(5); for(let i=0;i<24;i++) land.push({lon:r()*TAU,lat:(r()-.5)*2,r:.12+r()*.18}); for(let i=0;i<16;i++) clouds.push({lon:r()*TAU,lat:(r()-.5)*2.2,r:.06+r()*.1});}
const craters=[]; {const r=rng(21); for(let i=0;i<9;i++){const a=r()*TAU,d=Math.sqrt(r())*.7; craters.push({x:Math.cos(a)*d,y:Math.sin(a)*d,r:.1+r()*.14});}}

// Escena fija: Tierra en el centro-derecha, la Luna girando a su alrededor
const EX=940, EY=380, ER=96, ORX=250, ORY=250*0.42;  // órbita vista en perspectiva
let A=0, ang=-Math.PI/2;           // ángulo de la Luna
let showFuture=0;                   // 0..1: muestra "donde va a estar"
const AHEAD=0.7;                    // ~40° por delante (lo que avanza la Luna en ~3 días)
const trail=[];

function drawEarth(){
  ctx.save();
  const at=ctx.createRadialGradient(EX,EY,ER*.95,EX,EY,ER*1.3); at.addColorStop(0,'rgba(111,227,232,.5)'); at.addColorStop(1,'rgba(111,227,232,0)');
  ctx.fillStyle=at; circle(EX,EY,ER*1.3); ctx.fill();
  const og=ctx.createRadialGradient(EX-ER*.3,EY-ER*.3,ER*.1,EX,EY,ER); og.addColorStop(0,'#4aa0f0'); og.addColorStop(1,'#123f99');
  circle(EX,EY,ER); ctx.fillStyle=og; ctx.fill(); ctx.clip();
  const blobs=(arr,col,rot)=>{ctx.fillStyle=col; for(const b of arr){const lo=b.lon+A*rot,z=Math.cos(lo)*Math.cos(b.lat); if(z<-.05)continue;
    ell(EX+ER*Math.sin(lo)*Math.cos(b.lat),EY+ER*Math.sin(b.lat)*.95,b.r*ER*Math.max(.25,z),b.r*ER*.75); ctx.fill();}};
  blobs(land,'#3fae6a',.25); blobs(clouds,'rgba(255,255,255,.6)',.32);
  const sh=ctx.createLinearGradient(EX-ER*.2,0,EX+ER,0); sh.addColorStop(0,'rgba(5,8,30,0)'); sh.addColorStop(1,'rgba(5,8,30,.75)');
  ctx.fillStyle=sh; ctx.fillRect(EX-ER,EY-ER,ER*2,ER*2);
  ctx.restore();
  ctx.font='800 17px Nunito, sans-serif'; ctx.fillStyle='rgba(232,233,242,.85)'; ctx.textAlign='center'; ctx.fillText(L('Tierra','Earth'),EX,EY+ER+30);
}
function moonPos(a){ return {x:EX+Math.cos(a)*ORX, y:EY+Math.sin(a)*ORY, s:1+Math.sin(a)*.18}; } // más grande cuando pasa por delante
function drawMoon(x,y,r,alpha=1,ghost=false){
  ctx.save(); ctx.globalAlpha=alpha;
  if(ghost){ ctx.setLineDash([6,7]); ctx.lineDashOffset=-A*20; ctx.strokeStyle=P.pink; ctx.lineWidth=3; circle(x,y,r); ctx.stroke(); ctx.restore(); return; }
  const gl=ctx.createRadialGradient(x,y,r*.9,x,y,r*1.6); gl.addColorStop(0,'rgba(200,190,255,.3)'); gl.addColorStop(1,'rgba(200,190,255,0)'); ctx.fillStyle=gl; circle(x,y,r*1.6); ctx.fill();
  const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r); g.addColorStop(0,'#F0F0F8'); g.addColorStop(.65,'#B9BACB'); g.addColorStop(1,'#7C7E9C');
  circle(x,y,r); ctx.fillStyle=g; ctx.fill(); ctx.clip();
  ctx.fillStyle='rgba(80,82,120,.4)'; for(const c of craters){ circle(x+c.x*r,y+c.y*r,c.r*r); ctx.fill(); }
  ctx.restore();
}
function drawOrbit(front){
  // dibuja la mitad de atrás o la de adelante de la órbita
  ctx.save(); ctx.setLineDash([4,10]); ctx.strokeStyle='rgba(111,227,232,.45)'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.ellipse(EX,EY,ORX,ORY,0,front?0:Math.PI,front?Math.PI:TAU); ctx.stroke(); ctx.restore();
}
function drawArrowAlongOrbit(a0,a1,col,alpha){
  ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle=col; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); const n=24; for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n; const x=EX+Math.cos(a)*(ORX+28), y=EY+Math.sin(a)*(ORY+16); i?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.stroke();
  const ax=EX+Math.cos(a1)*(ORX+28), ay=EY+Math.sin(a1)*(ORY+16), tx=-Math.sin(a1)*ORX, ty=Math.cos(a1)*ORY, l=Math.hypot(tx,ty), ux=tx/l, uy=ty/l;
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(ax+ux*12,ay+uy*12); ctx.lineTo(ax-ux*6-uy*9,ay-uy*6+ux*9); ctx.lineTo(ax-ux*6+uy*9,ay-uy*6-ux*9); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function label(text,x,y,col,alpha){
  if(alpha<=0) return;
  ctx.save(); ctx.globalAlpha=alpha; ctx.font='900 17px Nunito, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(text).width+26; ctx.fillStyle='rgba(11,15,58,.88)'; ctx.beginPath(); ctx.roundRect(x-w/2,y-16,w,32,16); ctx.fill();
  ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle=col; ctx.fillText(text,x,y); ctx.restore();
}
function render(){
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
  for(const s of stars){ ctx.globalAlpha=.5+.5*Math.sin(A*s.sp+s.p); ctx.fillStyle=P.white; circle(s.x,s.y,s.r); ctx.fill(); } ctx.globalAlpha=1;
  const m=moonPos(ang), behind=Math.sin(ang)<0;
  drawOrbit(false);
  // estela
  ctx.save(); trail.forEach((p,i)=>{ ctx.globalAlpha=i/trail.length*.45; ctx.fillStyle=P.aqua; circle(p.x,p.y,3*p.s); ctx.fill(); }); ctx.restore();
  // "donde va a estar"
  const fa=ang+AHEAD, f=moonPos(fa);
  if(showFuture>0 && Math.sin(fa)<0) drawMoon(f.x,f.y,34*f.s,showFuture,true);
  if(behind) drawMoon(m.x,m.y,34*m.s);
  drawEarth();
  drawOrbit(true);
  if(showFuture>0 && Math.sin(fa)>=0) drawMoon(f.x,f.y,34*f.s,showFuture,true);
  if(!behind) drawMoon(m.x,m.y,34*m.s);
  if(showFuture>0){ drawArrowAlongOrbit(ang+.18,fa-.2,P.pink,showFuture*.8);
    label(L('Aquí está','It’s here'),m.x,m.y-34*m.s-26,P.aqua,showFuture); label(L('Aquí va a estar','It will be here'),f.x,f.y+34*f.s+26,P.pink,showFuture); }
  else label(L('Luna','Moon'),m.x,m.y-34*m.s-26,P.white,.9);
  // nota de escala
  ctx.font='700 13px Nunito, sans-serif'; ctx.fillStyle='rgba(232,233,242,.45)'; ctx.textAlign='right'; ctx.textBaseline='alphabetic';
  ctx.fillText(L('Dibujo sin escala · La Luna tarda unos 27 días en dar una vuelta a la Tierra (NASA)','Not to scale · The Moon takes about 27 days to go around the Earth (NASA)'),W-24,H-20);
}

/* ------------- Narración ------------- */
let started=false, idx=-1, voice=null, tok=0, safety=null, curAudio=null, wantFuture=false;
let speed=1;   // velocidad elegida (1 · 1.5 · 2): voz, tiempos de la narración y animación
// Temporizador de respaldo que respeta la velocidad: si cambia a mitad de la frase, se reprograma el tiempo que falta
let safetyFn=null, safetyLeft=0, safetyAt=0;
function armSafety(fn,ms){ clearTimeout(safety); safetyFn=fn; safetyLeft=ms; safetyAt=performance.now(); safety=setTimeout(fn,ms/speed); }
function rearmSafety(oldSpeed){ if(!safetyFn) return; const now=performance.now(); safetyLeft=Math.max(0,safetyLeft-(now-safetyAt)*oldSpeed); safetyAt=now; clearTimeout(safety); safety=setTimeout(safetyFn,safetyLeft/speed); }
function clearSafety(){ clearTimeout(safety); safetyFn=null; }
function pickVoice(){
  if(!('speechSynthesis' in window)) return;
  const EN=window.EqLang&&EqLang.get()==='en';
  const vs=speechSynthesis.getVoices().filter(v=>(EN?/^en/i:/^es/i).test(v.lang)); if(!vs.length) return;
  const sc=v=>((EN?/en[-_]US/i:/es[-_](MX|US|CO|419)/i).test(v.lang)?3:0)+(/female|mujer|paulina|sabina|helena|m[oó]nica|laura|dalia|luc[ií]a|google/i.test(v.name)?2:0);
  voice=vs.sort((a,b)=>sc(b)-sc(a))[0];
}
if('speechSynthesis' in window){ pickVoice(); speechSynthesis.addEventListener('voiceschanged',pickVoice); }
const els=[document.getElementById('h1'),...document.querySelectorAll('.frase')];
function highlight(i){ els.forEach((e,j)=>{ e.classList.toggle('activa',j===i); e.classList.toggle('vista',j<i); }); }
let blocked=false, heard=false;
const hint=document.getElementById('sonido');
function markBlocked(){ if(blocked||heard) return; blocked=true; hint.classList.add('on'); }
function speakLine(i){
  idx=i; highlight(i); if(i===4) wantFuture=true;
  if(i>=LINES.length){ finish(); return; }
  const my=++tok, next=()=>{ if(my!==tok) return; clearSafety(); setTimeout(()=>{ if(my===tok) speakLine(i+1); },450/speed); };
  // si no hay voz (o el navegador la bloquea), el texto avanza solo con este tiempo
  armSafety(next,(LINES[i].length*.075+1.8)*1000);
  if(blocked) return;
  if(VOICE_FILES[i]){ curAudio=new Audio(VOICE_FILES[i]); curAudio.playbackRate=speed; curAudio.onplaying=()=>{heard=true;}; curAudio.onended=next; curAudio.onerror=next;
    curAudio.play().catch(e=>{ if(e&&e.name==='NotAllowedError') markBlocked(); }); return; }
  if(!('speechSynthesis' in window)) return;
  const u=new SpeechSynthesisUtterance(LINES[i]); if(voice){u.voice=voice;u.lang=voice.lang;} else u.lang=window.EqLang?EqLang.speechLang():'es-MX';
  u.rate=Math.min(2,.93*speed); u.pitch=1.05;
  u.onstart=()=>{ heard=true; };
  u.onend=()=>{ if(heard) next(); };
  u.onerror=e=>{ if(my!==tok) return; if(e.error==='not-allowed'){ markBlocked(); return; } if(heard) next(); };
  speechSynthesis.speak(u);
  if(i===0) setTimeout(()=>{ if(my===tok && !heard) markBlocked(); },1500);
}
function stopVoice(){ tok++; clearSafety(); if('speechSynthesis' in window) speechSynthesis.cancel(); if(curAudio){curAudio.pause();curAudio=null;} }
function finish(){ stopVoice(); idx=99; els.forEach(e=>{e.classList.remove('activa');e.classList.add('vista');}); wantFuture=true;
  hint.classList.remove('on'); document.getElementById('saltar').classList.remove('on'); document.getElementById('cta').classList.add('on'); }
function begin(){
  started=true; heard=false; document.getElementById('cta').classList.remove('on');
  document.getElementById('saltar').classList.add('on'); wantFuture=false; pickVoice(); stopVoice();
  setTimeout(()=>speakLine(0),600/speed);
}
// Si el navegador bloqueó el sonido, el primer toque en cualquier parte reinicia la narración con voz
function unlock(e){
  if(!blocked) return;
  if(e.target.closest && e.target.closest('#bGo,#saltar,#vel')) return;
  blocked=false; hint.classList.remove('on'); begin();
}
stage.addEventListener('pointerdown',unlock); addEventListener('keydown',unlock);
document.getElementById('bOtra').onclick=begin;
document.getElementById('saltar').onclick=finish;
// Velocidad: 1x · 1.5x · 2x. La frase que ya se está diciendo sigue a su ritmo; la siguiente sale con la nueva velocidad.
const velBtns=[...document.querySelectorAll('#vel button')];
function setSpeed(v){ const old=speed; speed=v; velBtns.forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===v)));
  if(curAudio) curAudio.playbackRate=v; rearmSafety(old); }
velBtns.forEach(b=>b.onclick=()=>setSpeed(+b.dataset.v));
document.getElementById('bGo').addEventListener('click',()=>{ stopVoice(); dispatchEvent(new CustomEvent('intro-mision1:fin')); try{ if(parent!==window) parent.postMessage({type:'intro-mision1-fin'},'*'); }catch(e){} });

// Arranca sola en cuanto se abre la pantalla
if('speechSynthesis' in window && !speechSynthesis.getVoices().length){
  let go=false; const st=()=>{ if(!go){ go=true; begin(); } };
  speechSynthesis.addEventListener('voiceschanged',st,{once:true}); setTimeout(st,700);
} else begin();

let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000)*speed; last=now; A+=dt;
  ang+=dt*.42; if(ang>Math.PI*1.5) ang-=TAU;
  const m=moonPos(ang); trail.push(m); if(trail.length>40) trail.shift();
  showFuture+=((wantFuture?1:0)-showFuture)*Math.min(1,dt*3);
  render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__test=(i)=>{ if(i>=5){finish();} else {highlight(i); wantFuture=i===4;} };
})();
