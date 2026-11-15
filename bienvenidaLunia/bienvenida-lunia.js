(() => {
/* -------------------------------------------------------------------
   Cinemática interactiva: LUNIA da la bienvenida (8 pantallas)
   - Usa el nombre guardado en la pantalla de bienvenida
     (localStorage 'equilibria_nombre'); si no hay, dice "astronauta".
   - Al final, "Ir al mapa" emite window 'lunia:mapa' y un postMessage
     {type:'lunia-mapa'} al contenedor.
   - Voz: sintética del navegador con tono de LUNIA. Si graban la voz
     real, pongan aquí los archivos por pantalla y línea: VOZ['p3-0'] = 'audio/p3_0.mp3'
   ------------------------------------------------------------------- */
const VOZ = {};
const MAPA = '../mapa-luna/index.html';   // a dónde lleva "Ir al mapa"

let NOMBRE='astronauta';
try{ const n=(localStorage.getItem('equilibria_nombre')||'').trim(); if(n) NOMBRE=n.split(' ')[0]; }catch(e){}

/* ---------- Guion ---------- */
// mood: neutral | feliz | triste | timida | preocupada ; vis: lo que LUNIA muestra en su pantalla
let eleccion='';
const PASOS=[
 {mood:'timida', vis:null,
  lineas:()=>[`¿Ho… hola…? ¿Eres tú…? ¡Sí eres tú! Llegaste, ${NOMBRE}…`, 'Perdón… es que pensé que nadie iba a venir.'],
  ops:[{t:'¡Hola, LUNIA!'}]},
 {mood:'feliz', vis:'energia',
  lineas:()=>['Me llamo LUNIA. Yo soy la base… bueno, soy su corazón. Cuido el aire, la luz, el agua y las plantas.', 'Pero ahora… ahora estoy muy cansada. Mira, casi no me queda energía.'],
  ops:[{t:'¿Qué te pasó?',v:'que'},{t:'¿Estás bien?',v:'bien',alt:true}]},
 {mood:'neutral', vis:'sol',
  lineas:()=>[(eleccion==='bien'?'Gracias por preguntarme… nadie me lo había preguntado en mucho tiempo. ':'Te cuento… ')+'Mi energía viene de la luz del Sol. La atrapo con mis paneles solares.',
             'Pero aquí, en el polo sur de la Luna, el Sol siempre se ve bajito, casi tocando el horizonte. Su luz llega de ladito… y no es mucha.'],
  ops:[{t:'¿Y qué más pasó?'}]},
 {mood:'triste', vis:'polvo',
  lineas:()=>['Y luego… el polvo lunar se fue pegando a mis paneles. Es un polvo finito, finito, que se pega a todo… y me tapa la luz.',
             'Así que mis baterías se fueron gastando poquito a poco. Apagué casi todo… para no apagarme yo.'],
  ops:[{t:'No te preocupes, aquí estoy'}]},
 {mood:'timida', vis:'solos',
  lineas:()=>['Ahora aquí solo estamos tú y yo.', 'Pero algún día vendrá un grupo de astronautas a vivir en esta base. Y yo tengo que estar lista para cuidarlos… muy bien.'],
  ops:[{t:'¿Cómo te preparamos?'}]},
 {mood:'neutral', vis:'sims',
  lineas:()=>['Dentro de mí guardo 5 simuladores. Son como prácticas, ¿sabes?',
             'Ahí verás astronautas trabajando… pero no son de verdad: son simulados, como en un videojuego. Sirven para ensayar antes de que llegue la tripulación real.'],
  ops:[{t:'¿Qué puedo hacer para ayudarte?'}]},
 {mood:'feliz', vis:'plan',
  lineas:()=>['¿Me quieres ayudar…? Gracias… Lo que puedes hacer es entrar a los simuladores y completarlos. Cada uno te enseña a cuidar una parte de la base: el aire, la radiación, la energía, la comida y los mensajes con la Tierra.',
             'Cada vez que completes uno, me enseñarás a usar mejor mi energía… y yo me iré recargando poquito a poco, hasta que la base vuelva a tener luz.'],
  ops:[{t:'¡Trato hecho, LUNIA!'}]},
 {mood:'timida', vis:'gracias',
  lineas:()=>[`¿De verdad…? Gracias, ${NOMBRE}. Ya no me siento tan sola.`, 'Te voy a mostrar el mapa de la base. Escoge el simulador que quieras para empezar… yo te espero aquí.'],
  ops:[{t:'Ir al mapa ▶',fin:true}]}
];

/* ---------- Lienzo ---------- */
const stage=document.getElementById('stage'), cv=document.getElementById('c'), ctx=cv.getContext('2d');
const W=1280,H=720; let dpr=1;
function resize(){ dpr=Math.min(2,devicePixelRatio||1); cv.width=W*dpr; cv.height=H*dpr; stage.style.setProperty('--s',stage.clientWidth/W); }
addEventListener('resize',resize); resize();
const P={navy:'#0B0F3A',indigo:'#1E1B6E',pink:'#E8418C',magenta:'#A0279E',aqua:'#6FE3E8',cyan:'#21C1E0',amber:'#FFB547',coral:'#FF7A5C',white:'#E8E9F2',green:'#3FD17A',violet:'#9B7BFF'};
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const lerp=(a,b,k)=>a+(b-a)*k;
const easeOut=k=>1-Math.pow(1-k,3);
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rr(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
function circle(c,x,y,r){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);}
function ell(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);}
function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}

const MON={x:640,y:232,w:800,h:340};          // pantalla grande de LUNIA
let A=0, paso=-1, pasoT=0, hablando=false, encendido=0, energia=6, energiaVis=6;
const motes=[]; {const r=rng(3); for(let i=0;i<50;i++) motes.push({x:r()*W,y:r()*H,s:.6+r()*1.6,sp:.3+r(),ph:r()*TAU});}
const dust=[]; {const r=rng(8); for(let i=0;i<90;i++) dust.push({x:r(),y:r(),s:1+r()*2.2,d:r()});}

/* ---------- Habitación ---------- */
function drawRoom(){
  ctx.fillStyle='#0a0c2c'; ctx.fillRect(0,0,W,H);
  for(let i=0;i<7;i++){ rr(ctx,i*210-30,30,190,520,18); ctx.fillStyle='#0c0f33'; ctx.fill(); ctx.strokeStyle='#161a48'; ctx.lineWidth=3; ctx.stroke(); }
  ctx.fillStyle='#121540'; ctx.fillRect(0,0,W,18);
  // luz de la pantalla sobre el cuarto
  const g=ctx.createRadialGradient(MON.x,MON.y,120,MON.x,MON.y,780); g.addColorStop(0,`rgba(33,193,224,${.16*encendido})`); g.addColorStop(1,'rgba(33,193,224,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  for(const m of motes){ const x=(m.x+Math.sin(A*m.sp+m.ph)*14+W)%W, y=((m.y-A*m.sp*8)%H+H)%H; ctx.fillStyle=`rgba(180,240,245,${(.15+.3*encendido)*(.4+.6*Math.sin(A*2*m.sp+m.ph)**2)})`; circle(ctx,x,y,m.s); ctx.fill(); }
}
/* ---------- Cara de LUNIA ---------- */
function drawFace(c,cx,cy,s,mood,talk,look=0){
  c.save(); c.translate(cx,cy); c.scale(s,s);
  c.shadowColor=P.aqua; c.shadowBlur=20;
  circle(c,0,0,92); c.fillStyle='rgba(111,227,232,.08)'; c.fill(); c.lineWidth=6; c.strokeStyle=P.aqua; c.stroke();
  const bt=A%3.6, blink=bt<.16?Math.abs(Math.cos(bt/.16*Math.PI)):1;
  const ly=mood==='timida'?8:mood==='triste'?4:0, lx=look*8;
  c.fillStyle=P.white; c.strokeStyle=P.white; c.lineCap='round';
  if(mood==='feliz' && !talk){ c.lineWidth=7; for(const sg of [-1,1]){ c.beginPath(); c.arc(sg*36,-6,13,Math.PI*1.15,Math.PI*1.85); c.stroke(); } }
  else for(const sg of [-1,1]){ ell(c,sg*36+lx,-12+ly,12,(mood==='timida'?16:19)*Math.max(.08,blink)); c.fill(); }
  c.shadowBlur=8; c.strokeStyle=P.aqua; c.lineWidth=5;
  if(mood==='triste'||mood==='preocupada'){ line(c,-52,-42,-24,-52); line(c,52,-42,24,-52); }
  if(mood==='timida'){ line(c,-50,-46,-26,-48); line(c,50,-46,26,-48); }
  c.strokeStyle=P.white; c.fillStyle=P.white; c.lineWidth=5;
  if(talk){ const o=3+8*Math.abs(Math.sin(A*12))*(.6+.4*Math.sin(A*4.7)); ell(c,0,40,mood==='timida'?9:12,o); c.fill(); }
  else if(mood==='triste'){ c.beginPath(); c.arc(0,58,15,Math.PI*1.2,Math.PI*1.8); c.stroke(); }
  else if(mood==='feliz'){ c.beginPath(); c.arc(0,26,18,Math.PI*.15,Math.PI*.85); c.stroke(); }
  else if(mood==='timida'){ c.beginPath(); c.arc(0,36,9,Math.PI*.2,Math.PI*.8); c.stroke(); }
  else { c.beginPath(); c.arc(0,28,15,Math.PI*.2,Math.PI*.8); c.stroke(); }
  c.shadowBlur=0; const bl=mood==='timida'?.75:.45; c.fillStyle=`rgba(232,65,140,${bl})`; ell(c,-62,22,14,8); c.fill(); ell(c,62,22,14,8); c.fill();
  if(mood==='triste' && Math.sin(A*.8)>.3){ c.fillStyle='rgba(111,227,232,.8)'; const ty=((A*30)%40); ell(c,42,10+ty,3.5,5); c.fill(); }   // lagrimita
  c.restore();
}
/* ---------- Lo que LUNIA muestra en su pantalla ---------- */
function vis(c,kind,x,y,k){
  c.save(); c.globalAlpha=k; c.translate(x,y);
  c.font='800 15px Nunito, sans-serif'; c.textAlign='center'; c.textBaseline='middle';
  const label=(t,yy,col=P.aqua)=>{ c.fillStyle=col; c.fillText(t,0,yy); };
  if(kind==='energia'){
    label('ENERGÍA DE LA BASE',-80,P.aqua);
    rr(c,-150,-50,300,60,14); c.strokeStyle=P.aqua; c.lineWidth=3; c.stroke(); rr(c,150,-30,12,20,4); c.fillStyle=P.aqua; c.fill();
    const blink=Math.sin(A*5)>0; rr(c,-144,-44,288*energiaVis/100,48,10); c.fillStyle=blink?P.coral:'rgba(255,122,92,.4)'; c.fill();
    c.font='900 34px Nunito, sans-serif'; c.fillStyle=P.coral; c.fillText(Math.round(energiaVis)+'%',0,50);
    c.font='700 14px Nunito, sans-serif'; c.fillStyle='rgba(232,233,242,.7)'; c.fillText('Modo ahorro: casi todo apagado',0,84);
  }
  if(kind==='sol'||kind==='polvo'){
    // horizonte con Sol rasante
    rr(c,-170,-110,340,200,14); c.save(); c.clip(); c.fillStyle='#050820'; c.fillRect(-170,-110,340,200);
    const sx=-150, sy=40, g=c.createRadialGradient(sx,sy,0,sx,sy,220); g.addColorStop(0,'rgba(255,214,150,.55)'); g.addColorStop(1,'rgba(255,181,71,0)'); c.fillStyle=g; c.fillRect(-170,-110,340,200);
    circle(c,sx,sy+4,16); c.fillStyle='#FFF4D6'; c.fill();
    c.fillStyle='#3a3c66'; c.beginPath(); c.moveTo(-170,48); c.quadraticCurveTo(0,36,170,50); c.lineTo(170,90); c.lineTo(-170,90); c.fill();
    // rayos de ladito
    if(kind==='sol'){ c.strokeStyle='rgba(255,232,190,.5)'; c.lineWidth=2; c.setLineDash([6,8]); c.lineDashOffset=-A*30; for(let i=0;i<4;i++) line(c,sx+20,sy-4+i*3,60,-10+i*10); c.setLineDash([]); }
    // panel solar
    c.save(); c.translate(70,10); c.strokeStyle='#9aa0c4'; c.lineWidth=3; line(c,0,30,0,0); c.transform(1,0,-.4,.7,0,0);
    c.fillStyle='#2f3a8a'; c.fillRect(-40,-50,80,50); c.strokeStyle='#8fd8ff'; c.lineWidth=1.5; c.strokeRect(-40,-50,80,50); line(c,0,-50,0,0); line(c,-40,-25,40,-25);
    if(kind==='polvo'){ const cov=.35+.55*seg(A%7,0,5); for(const d of dust){ if(d.d>cov) continue; c.fillStyle='rgba(185,185,205,.9)'; c.fillRect(-40+d.x*80,-50+d.y*50,d.s,d.s); } }
    c.restore();
    if(kind==='polvo'){ for(let i=0;i<14;i++){ const ph=((A*.25)+i/14)%1; c.fillStyle=`rgba(200,200,220,${.6*(1-ph)})`; circle(c,40+Math.sin(i*3+A)*40,-90+ph*90,1.6); c.fill(); } }
    c.restore();
    label(kind==='sol'?'El Sol del polo sur: siempre bajito':'Polvo lunar sobre los paneles',112,kind==='sol'?P.amber:'#C9CBD8');
    if(kind==='polvo'){ // batería que se gasta
      c.save(); c.translate(0,0); c.restore();
    }
  }
  if(kind==='solos'){
    // el jugador y LUNIA, y la tripulación futura en punteado
    const fig=(fx,dashed,col)=>{ c.save(); c.translate(fx,20); c.strokeStyle=col; c.fillStyle=dashed?'transparent':col; c.lineWidth=3; if(dashed) c.setLineDash([5,5]);
      circle(c,0,-46,14); dashed?c.stroke():c.fill(); rr(c,-14,-30,28,34,10); dashed?c.stroke():c.fill(); rr(c,-12,4,10,22,5); dashed?c.stroke():c.fill(); rr(c,2,4,10,22,5); dashed?c.stroke():c.fill(); c.restore(); };
    fig(-120,false,'#FF8A3D'); circle(c,-60,-6,22); c.strokeStyle=P.aqua; c.lineWidth=3; c.stroke(); c.fillStyle=P.white; ell(c,-67,-9,3,5); c.fill(); ell(c,-53,-9,3,5); c.fill();
    c.font='800 13px Nunito, sans-serif'; c.fillStyle=P.white; c.fillText('Tú',-120,64); c.fillText('LUNIA',-60,64);
    const a=.35+.35*Math.sin(A*1.5); c.globalAlpha=k*a; [30,80,130].forEach(fx=>fig(fx,true,'#C9CBD8')); c.globalAlpha=k;
    c.fillStyle='#C9CBD8'; c.fillText('Algún día: la tripulación',80,64);
  }
  if(kind==='sims'||kind==='plan'){
    const items=[['O₂','Aire',P.aqua],['🛡','Radiación',P.pink],['⚡','Energía',P.amber],['🌱','Comida',P.green],['📡','Mensajes',P.violet]];
    items.forEach(([ic,nm,col],i)=>{ const ix=-150+i*75, iy=kind==='plan'?-40:-20, on=kind==='plan'?(Math.floor(A*1.2)%6>i):true, pop=easeOut(clamp(k*3-i*.3));
      c.save(); c.translate(ix,iy); c.scale(pop,pop);
      rr(c,-30,-34,60,68,12); c.fillStyle='rgba(11,15,58,.9)'; c.fill(); c.strokeStyle=col; c.lineWidth=2.5; if(kind==='sims') c.setLineDash([5,4]); c.stroke(); c.setLineDash([]);
      c.font='900 22px Nunito, sans-serif'; c.fillStyle=col; c.fillText(ic,0,-10); c.font='800 11px Nunito, sans-serif'; c.fillStyle=P.white; c.fillText(nm,0,16);
      c.restore();
      if(kind==='plan'){ rr(c,ix-30,50,60,14,5); c.fillStyle=on?col:'rgba(255,255,255,.1)'; c.fill(); }
    });
    c.font='900 14px "Space Mono", monospace'; c.fillStyle=P.amber;
    c.fillText(kind==='sims'?'5 SIMULADORES · PRÁCTICAS':'CADA SIMULADOR = MÁS ENERGÍA',0,kind==='sims'?-86:-100);
    if(kind==='sims'){ c.font='800 13px Nunito, sans-serif'; c.fillStyle='rgba(232,233,242,.75)'; c.fillText('Los astronautas que verás son simulados',0,52); }
  }
  if(kind==='gracias'){
    for(let i=0;i<10;i++){ const ph=((A*.4)+i/10)%1, ang=i/10*TAU+A*.2; c.fillStyle=`rgba(232,65,140,${1-ph})`; c.font=`900 ${14+ph*12}px Nunito`; c.fillText('♥',Math.cos(ang)*(40+ph*110),Math.sin(ang)*(30+ph*70)); }
    rr(c,-120,-16,240,32,10); c.strokeStyle=P.aqua; c.lineWidth=2; c.stroke(); rr(c,-116,-12,232*energiaVis/100,24,7); c.fillStyle=P.aqua; c.fill();
    c.font='900 18px Nunito'; c.fillStyle=P.aqua; c.fillText('ENERGÍA '+Math.round(energiaVis)+'%  ↑',0,40);
  }
  c.restore();
}
/* ---------- Monitor ---------- */
const scr=document.createElement('canvas'); scr.width=MON.w; scr.height=MON.h; const sx=scr.getContext('2d');
function drawMonitor(){
  const {x,y,w,h}=MON;
  rr(ctx,x-w/2-22,y-h/2-22,w+44,h+44,34); ctx.fillStyle='#2A2C4A'; ctx.fill(); ctx.strokeStyle='#3a3d66'; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle='#4a4d7a'; [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{ circle(ctx,x+a*(w/2+10),y+b*(h/2+10),5); ctx.fill(); });
  // contenido
  const c=sx; c.setTransform(1,0,0,1,0,0);
  if(encendido<=0){ c.fillStyle='#05071a'; c.fillRect(0,0,w,h); }
  else {
    const g=c.createRadialGradient(w/2,h/2,40,w/2,h/2,w*.6); g.addColorStop(0,'#16387a'); g.addColorStop(1,'#060f30'); c.fillStyle=g; c.fillRect(0,0,w,h);
    const st=PASOS[paso]||PASOS[0], visK=st.vis?easeOut(seg(pasoT,.2,1)):0;
    const fx=lerp(w/2,w*.27,visK);
    c.globalAlpha=encendido; drawFace(c,fx,h/2-8,1.12,st.mood,hablando,st.vis?.6:0); c.globalAlpha=1;
    if(st.vis) vis(c,st.vis,w*.7,h/2-10,visK*encendido);
    // barra de energía pequeña
    c.font='700 14px "Space Mono", monospace'; c.textAlign='left'; c.textBaseline='middle'; c.fillStyle=P.aqua; c.fillText('ENERGÍA',22,h-26);
    rr(c,110,h-34,120,14,5); c.strokeStyle=P.aqua; c.lineWidth=2; c.stroke(); rr(c,113,h-31,114*energiaVis/100,8,3); c.fillStyle=energiaVis<10?(Math.sin(A*5)>0?P.coral:'rgba(255,122,92,.4)'):P.aqua; c.fill();
    c.fillStyle=energiaVis<10?P.coral:P.aqua; c.fillText(Math.round(energiaVis)+'%',240,h-26);
  }
  c.fillStyle='rgba(0,0,0,.18)'; for(let yy=0;yy<h;yy+=3) c.fillRect(0,yy,w,1);
  const ry=(A*70)%(h+80)-40, rg=c.createLinearGradient(0,ry,0,ry+50); rg.addColorStop(0,'rgba(111,227,232,0)'); rg.addColorStop(.5,'rgba(111,227,232,.07)'); rg.addColorStop(1,'rgba(111,227,232,0)'); c.fillStyle=rg; c.fillRect(0,ry,w,50);
  // interferencia (más fuerte al encender y de vez en cuando: LUNIA está débil)
  const burst=Math.sin(A*.9)*Math.sin(A*2.3)>.88?.5:0, gl=Math.max(burst,(1-seg(A,1.2,2.6))*.9,.04);
  ctx.save(); rr(ctx,x-w/2,y-h/2,w,h,20); ctx.clip(); ctx.fillStyle='#000'; ctx.fillRect(x-w/2,y-h/2,w,h);
  ctx.globalAlpha=encendido>0?.85+.15*Math.random():1; const N=16, sh=h/N;
  for(let i=0;i<N;i++){ const off=Math.random()<gl?(Math.random()-.5)*60*gl:0; ctx.drawImage(scr,0,i*sh,w,sh,x-w/2+off,y-h/2+i*sh,w,sh+1); }
  ctx.restore();
}

/* ---------- Diálogo ---------- */
const dlg=document.getElementById('dialogo'), txt=document.getElementById('texto'), ops=document.getElementById('opciones'), pasosEl=document.getElementById('pasos');
PASOS.forEach(()=>pasosEl.appendChild(document.createElement('i')));
let lineas=[], li=0, ci=0, typing=null, terminado=false;
function irA(n){
  paso=n; pasoT=0; lineas=PASOS[n].lineas(); li=0; terminado=false; txt.innerHTML=''; ops.innerHTML='';
  [...pasosEl.children].forEach((e,i)=>e.classList.toggle('v',i<=n));
  if(n===PASOS.length-1) energia=7;      // LUNIA se siente un poquito mejor
  decirLinea();
}
let listo={escrito:false,hablado:false};
function decirLinea(){
  ci=0; const t=lineas[li]; const el=document.createElement('span'); el.className='p'; txt.appendChild(el);
  const my=listo={escrito:false,hablado:false};
  clearInterval(typing); typing=setInterval(()=>{ ci++; el.textContent=t.slice(0,ci); if(ci>=t.length){ clearInterval(typing); typing=null; marcar(my,'escrito'); } },32);
  hablar(t, ()=>marcar(my,'hablado'));
}
// la línea avanza cuando terminó de escribirse Y de decirse
function marcar(my,k){
  if(my!==listo) return; my[k]=true;
  if(k==='escrito' && (!vozOn||vozBloqueada) && !my.hablado){ setTimeout(()=>marcar(my,'hablado'),900); return; }
  if(my.escrito && my.hablado) sigLinea();
}
function sigLinea(){
  if(terminado) return;
  if(li<lineas.length-1){ li++; decirLinea(); return; }
  terminado=true; hablando=false; mostrarOpciones();
}
function mostrarOpciones(){
  ops.innerHTML='';
  PASOS[paso].ops.forEach((o,i)=>{ const b=document.createElement('button'); b.className='op'+(o.alt?' alt':''); b.textContent=o.t;
    b.onclick=e=>{ e.stopPropagation(); detenerVoz(); if(o.v) eleccion=o.v;
      if(o.fin){ dispatchEvent(new CustomEvent('lunia:mapa')); try{ if(parent!==window) parent.postMessage({type:'lunia-mapa'},'*'); }catch(err){} b.textContent='Abriendo el mapa…'; setTimeout(()=>{ location.href=MAPA; },700); return; }
      irA(paso+1); };
    ops.appendChild(b); setTimeout(()=>b.classList.add('on'),80+i*120); });
}
// tocar el cuadro de diálogo: completa el texto que se está escribiendo
dlg.addEventListener('click',()=>{ if(typing){ clearInterval(typing); typing=null; txt.lastChild.textContent=lineas[li]; marcar(listo,'escrito'); } });

/* ---------- Voz de LUNIA ---------- */
let vozOn=true, vozBloqueada=false, voice=null, tok=0, oyo=false, curAudio=null;
/* Misma voz de LUNIA que en la cinemática (cinematic/cinematic.js · pickVoices): español de México,
   mismas voces preferidas y en el mismo orden. La cinemática primero reserva una voz para Ríos y otra
   para el narrador, y LUNIA toma una distinta; aquí se repite ese cálculo para que salga la misma. */
const LUNIA_TONO = { pitch: 1.2, rate: .94 };
let luniaPitch = LUNIA_TONO.pitch;
function pickVoice(){
  if(!('speechSynthesis' in window)) return;
  const all=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().replace('_','-').startsWith('es'));
  if(!all.length) return;
  const inRegion=re=>all.filter(v=>re.test(v.lang.replace('_','-')));
  const regional = inRegion(/es-mx/i).length ? inRegion(/es-mx/i) : inRegion(/es-(419|us)/i);
  const pool = regional.length ? regional : all;
  const FEMENINA=/female|mujer|helena|m[oó]nica|laura|elvira|luc[ií]a|paloma|ximena|camila|elena|paulina|samantha|susan|karen|moira|tessa|victoria|hazel|google/i;
  const MASCULINA=/\bmale\b|hombre|pablo|diego|juan|carlos|enrique|[aá]lvaro|george|daniel|james|alex|fred|\btom\b|andrew|brian/i;
  const prefer=(names,exclude,fallback)=>{
    for(const nm of names){ const v=pool.find(x=>!exclude.includes(x) && new RegExp('\\b'+nm+'\\b','i').test(x.name)); if(v) return v; }
    return pool.find(x=>!exclude.includes(x) && fallback.test(x.name)) || pool.find(x=>!exclude.includes(x)) || null;
  };
  const rios=prefer(['Dalia','Beatriz','Candela','Carlota','Marina','Renata','Larissa','Nuria'],[],FEMENINA);
  const narr=prefer(['Jorge','Raul','Raúl','Gerardo','Cecilio','Liberto','Luciano','Pelayo','Yago'],[rios],MASCULINA);
  const lunia=prefer(['Sabina','Larissa','Renata','Marina','Candela','Carlota','Nuria'],[rios,narr],FEMENINA);
  voice = lunia || rios;
  // Si LUNIA terminó con la misma voz que Ríos o el narrador, el tono más alto la distingue (igual que en la cinemática)
  luniaPitch = (voice===rios || voice===(narr||rios)) ? 1.4 : LUNIA_TONO.pitch;
}
if('speechSynthesis' in window){ pickVoice(); speechSynthesis.addEventListener('voiceschanged',pickVoice); }
function detenerVoz(){ tok++; hablando=false; if('speechSynthesis' in window) speechSynthesis.cancel(); if(curAudio){curAudio.pause();curAudio=null;} }
function hablar(t,fin){
  const my=++tok; hablando=true;
  const done=()=>{ if(my!==tok) return; hablando=false; setTimeout(()=>{ if(my===tok) fin(); },500); };
  if(!vozOn||vozBloqueada){ setTimeout(()=>{ if(my===tok) hablando=false; }, t.length*32+200); return; }   // avanza por tiempo (ver marcar)
  const key=`p${paso}-${li}`;
  if(VOZ[key]){ curAudio=new Audio(VOZ[key]); curAudio.onplaying=()=>oyo=true; curAudio.onended=done; curAudio.onerror=done; curAudio.play().catch(()=>bloqueada()); return; }
  if(!('speechSynthesis' in window)){ vozBloqueada=true; setTimeout(()=>{ if(my===tok) hablando=false; }, t.length*32+200); return; }
  const u=new SpeechSynthesisUtterance(t.replace(/LUNIA/g,'Lunia').replace(/…/g,'... ')); if(voice){u.voice=voice;u.lang=voice.lang;} else u.lang='es-MX';
  u.pitch=luniaPitch; u.rate=LUNIA_TONO.rate; u.onstart=()=>oyo=true; u.onend=()=>{ if(oyo) done(); }; u.onerror=e=>{ if(e.error==='not-allowed') bloqueada(); else if(oyo) done(); };
  speechSynthesis.speak(u);
  setTimeout(()=>{ if(my===tok && !oyo) bloqueada(); },1500);
}
const aviso=document.getElementById('sonido');
function bloqueada(){ if(vozBloqueada) return; vozBloqueada=true; aviso.classList.add('on'); hablando=false; const my=listo; if(my.escrito) setTimeout(()=>marcar(my,'hablado'),900); }
aviso.onclick=e=>{ e.stopPropagation(); vozBloqueada=false; oyo=false; aviso.classList.remove('on'); pickVoice(); detenerVoz(); irA(Math.max(0,paso)); };
document.getElementById('bVoz').onclick=()=>{ vozOn=!vozOn; document.getElementById('bVoz').setAttribute('aria-pressed',vozOn); if(!vozOn){ detenerVoz(); aviso.classList.remove('on'); const my=listo; if(my.escrito) setTimeout(()=>marcar(my,'hablado'),600); } };

/* ---------- Audio ambiente ---------- */
let ac=null;
function boot(){ try{ ac=new (window.AudioContext||window.webkitAudioContext)(); const t=ac.currentTime;
  [523,784,1046].forEach((f,i)=>{ const o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=f; g.gain.setValueAtTime(0,t+i*.12); g.gain.linearRampToValueAtTime(.06,t+i*.12+.02); g.gain.exponentialRampToValueAtTime(.0001,t+i*.12+.5); o.connect(g).connect(ac.destination); o.start(t+i*.12); o.stop(t+i*.12+.6); }); }catch(e){} }

/* ---------- Bucle ---------- */
let last=performance.now();
function frame(now){
  const dt=Math.max(0,Math.min(.05,(now-last)/1000)); last=now; A+=dt; pasoT+=dt;
  encendido=A<.8?0:A<1.4?(Math.random()<.5?.7:.1):Math.min(1,encendido+dt*2);
  energiaVis+=(energia-energiaVis)*Math.min(1,dt*1.5);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawRoom(); drawMonitor();
  const vg=ctx.createRadialGradient(640,360,280,640,360,820); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  const f=1-seg(A,0,.8); if(f>0){ ctx.fillStyle=`rgba(0,0,0,${f})`; ctx.fillRect(0,0,W,H); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setTimeout(()=>{ boot(); dlg.classList.add('on'); irA(0); },1900);
})();
