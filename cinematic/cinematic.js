(() => {
/* Integration: "Next" dispatches window event 'cinematica:siguiente' and posts
   {type:'cinematica-fin'} to the parent frame. To swap the synthetic voices for
   recorded ones, map line ids to audio files per language in VOICE_FILES. */
const VOICE_FILES = {
  es: { /* n1:'audio/es/narrador_1.mp3', l1:'audio/es/lunia_1.mp3', r1:'audio/es/rios_1.mp3' */ },
  en: { /* n1:'audio/en/narrator_1.mp3', ... */ }
};

const STR = {
  es: {
    kickerIn:'TRANSMISIÓN ENTRANTE', startLine:'Algo nos está llamando desde el polo sur de la Luna.', receive:'▶ Recibir transmisión',
    language:'Idioma', speed:'Velocidad', togVoice:'🗣 Voz narrada', togSfx:'🔊 Música y efectos', hint:'Mejor con sonido · Espacio: pausa · S: saltar',
    pause:'⏸ Pausa', resume:'▶ Seguir', sound:'🔊 Sonido', voice:'🗣 Voz', skip:'Saltar ⏭',
    tPause:'Pausa (espacio)', tSfx:'Música y efectos', tVoice:'Voz narrada', tSpeed:'Velocidad del audio', tFull:'Pantalla completa', tSkip:'Saltar cinemática',
    academy:'ACADEMIA DE ASTRONAUTAS', question:'¿Cuál será tu súper habilidad?', next:'Siguiente ▶', replay:'↺ Ver de nuevo',
    credits:'Datos reales citados: NASA LRO (cráteres en sombra permanente del polo sur lunar) · NASA DONKI (registro de fulguraciones solares)',
    toast:'¡Listo, astronauta! Aquí empieza el test de súper habilidades.', canvasLabel:'Cinemática Equilibria',
    l1:'> SEÑAL DETECTADA', l2:'> ORIGEN: LUNA — POLO SUR', l3:'> ÚLTIMO CONTACTO: HACE 214 DÍAS', channel:'CANAL 7 · FRECUENCIA LUNAR · SEÑAL DÉBIL',
    heading:'RUMBO: LUNA · POLO SUR · ', lroTitle:'DATO REAL · NASA LRO', lroBody:'Cerca del polo sur de la Luna hay cráteres que nunca reciben luz del Sol.',
    energy:'ENERGÍA', radLabel:'radiación: no se ve a simple vista', flareTitle:'¿QUÉ ES UNA FULGURACIÓN?', flareBody:'Un destello gigante de energía que lanza el Sol.',
    donkiTitle:'DATO REAL · NASA DONKI', donkiBody:'La NASA registra cada fulguración solar en su base de datos DONKI.',
    earthHdr:'TIERRA · ACADEMIA DE ASTRONAUTAS', controlRoom:'Sala de Control de Misión', incoming:'SEÑAL ENTRANTE · LUNIA',
    origin:'ORIGEN: POLO SUR', contact:'CONTACTO: 214 DÍAS', energyPct:'ENERGÍA: 6%', backSmall:'CONTROL DE', backBig:'MISIÓN'
  },
  en: {
    kickerIn:'INCOMING TRANSMISSION', startLine:'Something is calling us from the Moon’s south pole.', receive:'▶ Receive transmission',
    language:'Language', speed:'Speed', togVoice:'🗣 Narration', togSfx:'🔊 Music & effects', hint:'Best with sound · Space: pause · S: skip',
    pause:'⏸ Pause', resume:'▶ Resume', sound:'🔊 Sound', voice:'🗣 Voice', skip:'Skip ⏭',
    tPause:'Pause (space)', tSfx:'Music & effects', tVoice:'Narration', tSpeed:'Audio speed', tFull:'Full screen', tSkip:'Skip cinematic',
    academy:'ASTRONAUT ACADEMY', question:'What will your superpower be?', next:'Next ▶', replay:'↺ Watch again',
    credits:'Real data cited: NASA LRO (permanently shadowed craters at the lunar south pole) · NASA DONKI (solar flare records)',
    toast:'Ready, astronaut! The superpower test starts here.', canvasLabel:'Equilibria cinematic',
    l1:'> SIGNAL DETECTED', l2:'> ORIGIN: MOON — SOUTH POLE', l3:'> LAST CONTACT: 214 DAYS AGO', channel:'CHANNEL 7 · LUNAR FREQUENCY · WEAK SIGNAL',
    heading:'HEADING: MOON · SOUTH POLE · ', lroTitle:'REAL DATA · NASA LRO', lroBody:'Near the Moon’s south pole there are craters that never get any sunlight.',
    energy:'ENERGY', radLabel:'radiation: invisible to the eye', flareTitle:'WHAT IS A SOLAR FLARE?', flareBody:'A giant flash of energy thrown out by the Sun.',
    donkiTitle:'REAL DATA · NASA DONKI', donkiBody:'NASA records every solar flare in its DONKI database.',
    earthHdr:'EARTH · ASTRONAUT ACADEMY', controlRoom:'Mission Control Room', incoming:'INCOMING SIGNAL · LUNIA',
    origin:'ORIGIN: SOUTH POLE', contact:'CONTACT: 214 DAYS', energyPct:'ENERGY: 6%', backSmall:'MISSION', backBig:'CONTROL'
  }
};
let lang = 'es';
const t = k => STR[lang][k];

const stage = document.getElementById('stage');
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const W = 1280, H = 720;
let dpr = 1;
function resize(){
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W*dpr; cv.height = H*dpr;
  stage.style.setProperty('--s', stage.clientWidth / W);
}
window.addEventListener('resize', resize); resize();

const P = {navy:'#0B0F3A',indigo:'#1E1B6E',violet:'#4B2A9E',magenta:'#A0279E',pink:'#E8418C',cyan:'#21C1E0',aqua:'#6FE3E8',amber:'#FFB547',coral:'#FF7A5C',white:'#E8E9F2',gray:'#A8A9B8',slate:'#2A2C4A',deep:'#1A1C3F'};
const TAU = Math.PI*2;
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const easeOut=k=>1-Math.pow(1-k,3);
const lerp=(a,b,k)=>a+(b-a)*k;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function circle(c,x,y,r){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);}
function ell(c,x,y,rx,ry,rot=0){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,TAU);}
function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}

/* ---------------- State ---------------- */
let T = 0;            // story time (waits for a voice line to finish at gates)
let A = 0;            // animation time (always runs)
let playing = false, paused = false, ended = false;
let voiceOn = true, sfxOn = true, speed = 1;
const END_T = 65;

/* ---------------- Script ---------------- */
const WHO = {
  narr:{name:{es:'',en:''},col:P.amber},
  lunia:{name:{es:'LUNIA',en:'LUNIA'},col:P.aqua},
  rios:{name:{es:'Comandante Ríos',en:'Commander Ríos'},col:P.pink}
};
const CUES = [
 {id:'n1',t:9.0, end:13.3,who:'narr',
  es:'En el polo sur de la Luna, donde algunos cráteres nunca han visto la luz del Sol...',
  en:'At the south pole of the Moon, where some craters have never seen the light of the Sun...'},
 {id:'n2',t:13.6,end:18.0,who:'narr',
  es:'...hay una base que lleva mucho tiempo abandonada.', esSpeak:'hay una base que lleva mucho tiempo abandonada.',
  en:'...there is a base that has been empty for a very long time.', enSpeak:'there is a base that has been empty for a very long time.'},
 {id:'l1',t:20.4,end:23.2,who:'lunia',mood:'neutral',
  es:'¿Hola...? ¿Alguien me escucha?', en:'Hello...? Can anyone hear me?'},
 {id:'l2',t:23.4,end:27.4,who:'lunia',mood:'neutral',
  es:'Me llamo LUNIA. Soy la inteligencia artificial que cuida esta base.', esSpeak:'Me llamo Lunia. Soy la inteligencia artificial que cuida esta base.',
  en:'My name is LUNIA. I am the artificial intelligence that looks after this base.', enSpeak:'My name is Lunia. I am the artificial intelligence that looks after this base.'},
 {id:'l3',t:27.6,end:30.4,who:'lunia',mood:'sad',
  es:'A la base le queda muy poquita energía. Y estoy sola.', en:'The base has very little energy left. And I am all alone.'},
 {id:'l4',t:30.6,end:32.0,who:'lunia',mood:'sad',
  es:'No quiero apagarme.', en:'I don’t want to shut down.'},
 {id:'l5',t:32.8,end:35.4,who:'lunia',mood:'scared',
  es:'Y el Sol... el Sol se está despertando.', en:'And the Sun... the Sun is waking up.'},
 {id:'l6',t:35.6,end:39.6,who:'lunia',mood:'scared',
  es:'Cuando se despierta, lanza algo que no se ve a simple vista, pero que es muy peligroso: se llama radiación.',
  en:'When it wakes up, it sends out something you can’t see with your eyes, but it is very dangerous: it’s called radiation.'},
 {id:'l7',t:39.8,end:43.0,who:'lunia',mood:'scared',
  es:'Tengo miedo. No puedo proteger la base yo sola.', en:'I’m scared. I can’t protect the base on my own.'},
 {id:'r1',t:48.0,end:50.2,who:'rios',
  es:'Recibimos la señal de LUNIA.', esSpeak:'Recibimos la señal de Lunia.',
  en:'We received LUNIA’s signal.', enSpeak:'We received Lunia’s signal.'},
 {id:'r2',t:50.4,end:55.2,who:'rios',
  es:'La base se está quedando sin energía. LUNIA necesita a alguien que la ayude a recargarla y a enfrentar la radiación del Sol cuando está de mal humor.',
  esSpeak:'La base se está quedando sin energía. Lunia necesita a alguien que la ayude a recargarla y a enfrentar la radiación del Sol cuando está de mal humor.',
  en:'The base is running out of energy. LUNIA needs someone to help recharge it and to face the Sun’s radiation when it’s in a bad mood.',
  enSpeak:'The base is running out of energy. Lunia needs someone to help recharge it and to face the Sun’s radiation when it’s in a bad mood.'},
 {id:'r3',t:55.4,end:58.4,who:'rios',mood:'smile',
  es:'Revisamos a todos los astronautas... y te elegimos a ti.', en:'We looked at every single astronaut... and we chose you.'},
 {id:'r4',t:58.6,end:61.2,who:'rios',mood:'smile',
  es:'Pero antes de enviarte a la Luna, necesito conocerte.', en:'But before we send you to the Moon, I need to get to know you.'},
 {id:'r5',t:61.4,end:65.0,who:'rios',mood:'smile',
  es:'Cada astronauta tiene una súper habilidad distinta. ¡Vamos a descubrir la tuya!', en:'Every astronaut has a different superpower. Let’s find out yours!'},
];
const GATES = [...CUES.map(c=>c.t), 18, 32, 43, END_T].sort((a,b)=>a-b);

/* ---------------- Voices ----------------
   Three distinct characters:
   - Narrator: warm, friendly (prefers a male voice so it contrasts with Ríos)
   - LUNIA: a friendly AI, higher pitch, slower and steadier, plus a soft
     electronic hum and chirps mixed under her lines
   - Commander Ríos: a kind adult woman, slightly lower and calm */
const PROF = {narr:{pitch:1.0,rate:.98}, lunia:{pitch:1.2,rate:.94}, rios:{pitch:1.0,rate:.97}};
/* Preferred voices by name, in priority order. Microsoft Edge exposes these through the
   Web Speech API. Spanish targets neutral Latin American Spanish (es-MX). LUNIA prefers the
   older desktop voices, which sound more synthetic, so she reads as a friendly AI. */
const VOICE_PREF = {
  es:{
    narr:['Jorge','Raul','Raúl','Gerardo','Cecilio','Liberto','Luciano','Pelayo','Yago'],
    rios:['Dalia','Beatriz','Candela','Carlota','Marina','Renata','Larissa','Nuria'],
    lunia:['Sabina','Larissa','Renata','Marina','Candela','Carlota','Nuria']
  },
  en:{
    narr:['Guy','Davis','Christopher','Eric','Roger','Ryan','David','Mark'],
    rios:['Jenny','Aria','Michelle','Ana','Sonia','Libby'],
    lunia:['Zira','Ana','Michelle','Jenny']
  }
};
const FEMALE_FALLBACK=/female|mujer|helena|m[oó]nica|laura|elvira|luc[ií]a|paloma|ximena|camila|elena|paulina|samantha|susan|karen|moira|tessa|victoria|hazel|google/i;
const MALE_FALLBACK=/\bmale\b|hombre|pablo|diego|juan|carlos|enrique|[aá]lvaro|george|daniel|james|alex|fred|\btom\b|andrew|brian/i;
let voices={narr:null,lunia:null,rios:null};
let speaking=false, speakingWho=null, speakingCue=null, speakTok=0, curAudio=null, safety=null;
function voiceInfoText(){
  const n=v=>v?v.name.replace(/^Microsoft\s+/i,'').replace(/\s+(Online\s*)?(\(Natural\)\s*)?-.*$/i,''):'—';
  return (lang==='es'?'Voces':'Voices')+': '+n(voices.narr)+' · '+n(voices.lunia)+' · '+n(voices.rios);
}
function refreshVoiceInfo(){ const el=document.getElementById('voiceInfo'); if(el) el.textContent=voiceInfoText(); }
function pickVoices(){
  if(!('speechSynthesis' in window)) return;
  const all=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().replace('_','-').startsWith(lang));
  if(!all.length){ voices={narr:null,lunia:null,rios:null}; refreshVoiceInfo(); return; }
  const inRegion=re=>all.filter(v=>re.test(v.lang.replace('_','-')));
  const regional = lang==='es' ? (inRegion(/es-mx/i).length ? inRegion(/es-mx/i) : inRegion(/es-(419|us)/i)) : inRegion(/en-us/i);
  const pool = regional.length ? regional : all;
  const prefer=(names,exclude,fallback)=>{
    for(const nm of names){
      const v=pool.find(x=>!exclude.includes(x) && new RegExp('\\b'+nm+'\\b','i').test(x.name));
      if(v) return v;
    }
    return pool.find(x=>!exclude.includes(x) && fallback.test(x.name)) || pool.find(x=>!exclude.includes(x)) || null;
  };
  const pref=VOICE_PREF[lang];
  const rios=prefer(pref.rios,[],FEMALE_FALLBACK);
  const narr=prefer(pref.narr,[rios],MALE_FALLBACK);
  const lunia=prefer(pref.lunia,[rios,narr],FEMALE_FALLBACK);
  voices={narr:narr||rios, lunia:lunia||rios, rios};
  refreshVoiceInfo();
}
function pitchFor(who){
  const p=PROF[who].pitch;
  if(who==='narr' && voices.narr===voices.rios) return .8;
  if(who==='lunia' && (voices.lunia===voices.rios || voices.lunia===voices.narr)) return 1.4;
  return p;
}
if('speechSynthesis' in window){ pickVoices(); speechSynthesis.onvoiceschanged = pickVoices; }

function stopVoice(){
  speakTok++; speaking=false; speakingWho=null; speakingCue=null; clearTimeout(safety);
  if('speechSynthesis' in window) speechSynthesis.cancel();
  if(curAudio){ curAudio.pause(); curAudio=null; }
}
function say(cue){
  if(!voiceOn) return;
  stopVoice();
  const tok = ++speakTok;
  const isLunia = cue.who==='lunia';
  const done = () => { if(tok===speakTok){ speaking=false; speakingWho=null; if(isLunia) robotChirp(true); } };
  speaking=true; speakingWho=cue.who; speakingCue=cue;
  const text = cue[lang], spoken = cue[lang+'Speak'] || text;
  const rate = Math.min(2, PROF[cue.who].rate*speed);
  safety = setTimeout(done, (text.length*0.085/rate + 2.5 + (isLunia ? text.split(/\s+/).length*.06 : 0))*1000);
  if(isLunia) robotChirp(false);
  const file = VOICE_FILES[lang][cue.id];
  if(file){
    curAudio = new Audio(file); curAudio.playbackRate = speed;
    curAudio.onended = done; curAudio.onerror = done;
    curAudio.play().catch(done);
    return;
  }
  if(!('speechSynthesis' in window)){ done(); return; }
  const v = voices[cue.who];
  const make = txt => {
    const u = new SpeechSynthesisUtterance(txt);
    if(v){ u.voice = v; u.lang = v.lang; } else u.lang = lang==='es' ? 'es-MX' : 'en-US';
    u.pitch = pitchFor(cue.who); u.rate = rate; u.volume = 1;
    return u;
  };
  if(!isLunia){ const u = make(spoken); u.onend = done; u.onerror = done; speechSynthesis.speak(u); return; }
  const chunks = robotChunks(spoken);
  const next = i => {
    if(tok!==speakTok) return;
    if(i>=chunks.length){ done(); return; }
    robotBlip();
    const u = make(chunks[i]);
    u.onend = () => setTimeout(() => next(i+1), 150/speed); u.onerror = done;
    speechSynthesis.speak(u);
  };
  next(0);
}

/* ---------------- Synth audio ---------------- */
let ac=null, master, comp, voiceFx, robotGain, sfxBus, noiseBuf, staticGain, padGain, padOscs=[];
function initAudio(){
  if(ac) return;
  try{ ac = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ac=null; return; }
  comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
  master = ac.createGain(); master.gain.value = sfxOn?.8:0; master.connect(comp);
  voiceFx = ac.createGain(); voiceFx.gain.value = voiceOn?1:0; voiceFx.connect(comp);
  noiseBuf = ac.createBuffer(1, ac.sampleRate*2, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const n = ac.createBufferSource(); n.buffer=noiseBuf; n.loop=true;
  const bp = ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1900; bp.Q.value=.5;
  staticGain = ac.createGain(); staticGain.gain.value=0;
  n.connect(bp).connect(staticGain).connect(master); n.start();
  padGain = ac.createGain(); padGain.gain.value=0;
  const lp = ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=650; lp.Q.value=.7;
  lp.connect(padGain).connect(master);
  const lfo = ac.createOscillator(); lfo.frequency.value=.07; const lfoG=ac.createGain(); lfoG.gain.value=220; lfo.connect(lfoG).connect(lp.frequency); lfo.start();
  [110,164.81,220,261.63].forEach((f,i)=>{
    const o=ac.createOscillator(); o.type=i%2?'triangle':'sawtooth'; o.frequency.value=f; o.detune.value=(i-1.5)*7;
    const g=ac.createGain(); g.gain.value=i===0?.06:.045; o.connect(g).connect(lp); o.start(); padOscs.push(o);
  });
  // LUNIA's electronic hum: a soft, tremolo'd square wave that only sounds while she talks
  robotGain = ac.createGain(); robotGain.gain.value=0;
  const ro=ac.createOscillator(); ro.type='square'; ro.frequency.value=96;
  const rlp=ac.createBiquadFilter(); rlp.type='lowpass'; rlp.frequency.value=700;
  const trem=ac.createGain(); trem.gain.value=.5;
  const tl=ac.createOscillator(); tl.frequency.value=11; const tlg=ac.createGain(); tlg.gain.value=.5; tl.connect(tlg).connect(trem.gain); tl.start();
  const ro2=ac.createOscillator(); ro2.type='sawtooth'; ro2.frequency.value=144; ro2.connect(rlp); ro2.start();
  ro.connect(rlp).connect(trem).connect(robotGain).connect(voiceFx); ro.start();
}
function setPad(freqs, level, tc=.6){
  if(!ac) return; const now=ac.currentTime;
  padOscs.forEach((o,i)=>o.frequency.setTargetAtTime(freqs[i], now, tc));
  padGain.gain.setTargetAtTime(level, now, tc);
}
function tone(f, dur, vol, type='sine', when=0, f2=null, dest=null){
  if(!ac) return; const t0=ac.currentTime+when;
  const o=ac.createOscillator(); o.type=type; o.frequency.setValueAtTime(f,t0);
  if(f2) o.frequency.exponentialRampToValueAtTime(f2, t0+dur);
  const g=ac.createGain(); g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol,t0+.01); g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  o.connect(g).connect(dest||master); o.start(t0); o.stop(t0+dur+.05);
}
function robotChirp(closing){
  if(!ac || !voiceOn) return;
  if(closing){ tone(1568,.06,.035,'square',0,null,voiceFx); tone(1046,.07,.03,'square',.07,null,voiceFx); }
  else { tone(1046,.06,.035,'square',0,null,voiceFx); tone(1568,.07,.03,'square',.07,null,voiceFx); }
}
function robotBlip(){ if(!ac || !voiceOn) return; tone(1900,.035,.02,'square',0,null,voiceFx); }
/* LUNIA speaks in short, evenly spaced chunks (about 4 words) so her cadence is flat and
   machine-like. Browsers do not let a page process speech-synthesis audio, so this plus the
   electronic hum and blips is how the robotic character is built. */
function robotChunks(text){
  const out=[];
  for(const p of (text.match(/[^.,;:?!…]+[.,;:?!…]*/g)||[text])){
    const w=p.trim().split(/\s+/).filter(Boolean); if(!w.length) continue;
    const n=Math.ceil(w.length/4), size=Math.ceil(w.length/n);
    for(let i=0;i<w.length;i+=size) out.push(w.slice(i,i+size).join(' '));
  }
  return out;
}
function noiseHit(dur, vol, type, f, f2=null, q=1){
  if(!ac) return; const t0=ac.currentTime;
  const s=ac.createBufferSource(); s.buffer=noiseBuf;
  const fl=ac.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t0); fl.Q.value=q;
  if(f2) fl.frequency.exponentialRampToValueAtTime(f2,t0+dur);
  const g=ac.createGain(); g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol,t0+Math.min(.05,dur*.2)); g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  s.connect(fl).connect(g).connect(master); s.start(t0, Math.random()); s.stop(t0+dur+.05);
}
const SFX = {
  beep(){ tone(1320,.09,.05); },
  spark(){ noiseHit(.18,.35,'highpass',2500); noiseHit(.08,.25,'highpass',5000); },
  boot(){ tone(523,.25,.08,'sine'); tone(784,.3,.08,'sine',.12); tone(1046,.45,.07,'sine',.24); },
  yawn(){ tone(180,1.4,.12,'triangle',0,90); },
  flare(){ noiseHit(1.6,.35,'bandpass',300,3200,1.2); tone(220,1.2,.08,'sawtooth',0,880); },
  rumble(){ tone(42,2.6,.6,'sine',0,30); noiseHit(2.6,.5,'lowpass',160,60); },
  whoosh(){ noiseHit(1.1,.3,'bandpass',2400,300,.9); },
  console(){ [0,.15,.3].forEach((w,i)=>tone(880+i*220,.08,.04,'square',w)); },
  arp(){ [523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>tone(f,1.2,.06,'triangle',i*.14)); }
};

/* ---------------- Timeline events ---------------- */
const EVENTS = [];
for(let b=.5;b<8;b+=1) EVENTS.push({t:b, fn:SFX.beep});
EVENTS.push(
 {t:8.1, fn:()=>setPad([110,164.81,220,261.63],.55,1.2)},
 {t:18.3,fn:()=>{SFX.spark(); spawnSparks(345,482,26);}},
 {t:18.9,fn:()=>{SFX.spark(); spawnSparks(345,482,20);}},
 {t:19.4,fn:()=>{SFX.spark(); spawnSparks(345,482,30);}},
 {t:19.65,fn:SFX.boot},
 {t:32.2,fn:()=>setPad([98,146.83,196,233.08],.5,1)},
 {t:34.1,fn:SFX.yawn},
 {t:36.0,fn:SFX.flare},
 {t:41.3,fn:SFX.rumble},
 {t:43.0,fn:()=>{SFX.whoosh(); setPad([130.81,196,261.63,329.63],.5,1);}},
 {t:45.7,fn:SFX.console},
 {t:END_T,fn:()=>{SFX.arp(); setPad([174.61,261.63,349.23,440],.45,1);}}
);
function fire(t0,t1){
  for(const e of EVENTS) if(e.t>t0 && e.t<=t1) e.fn();
  for(const c of CUES) if(c.t>t0 && c.t<=t1) say(c);
}

/* ---------------- Particles ---------------- */
const parts=[];
function spawnSparks(x,y,n){ for(let i=0;i<n;i++) parts.push({x,y,vx:(Math.random()-.25)*460,vy:-Math.random()*420-60,life:.4+Math.random()*.7,age:0}); }
function updParts(dt){ for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.age+=dt;p.vy+=950*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.age>p.life)parts.splice(i,1);} }
function drawParts(){
  ctx.save(); ctx.lineCap='round'; ctx.lineWidth=2.5;
  for(const p of parts){ const a=1-p.age/p.life; ctx.strokeStyle=`rgba(255,${190+Math.random()*60|0},120,${a})`; line(ctx,p.x,p.y,p.x-p.vx*.03,p.y-p.vy*.03); }
  ctx.restore();
}

/* ---------------- Precomputed resources ---------------- */
const R=rng(7), stars=[];
for(let i=0;i<340;i++) stars.push({x:R()*W,y:R()*H,r:R()<.9?R()*1.2+.3:R()*1.6+1.2,p:R()*TAU,sp:.5+R()*2});
function drawStars(alpha=1,zoom=1,ox=0,oy=0){
  ctx.save();
  for(const s of stars){
    const px=640+(s.x-640)*zoom+ox, py=360+(s.y-360)*zoom+oy;
    if(px<-5||px>W+5||py<-5||py>H+5) continue;
    ctx.globalAlpha=alpha*(.55+.45*Math.sin(A*s.sp+s.p));
    ctx.fillStyle=s.r>1.6?'#FFE9C2':'#E8E9F2';
    circle(ctx,px,py,s.r*Math.min(zoom,2)); ctx.fill();
  }
  ctx.restore();
}
const motes=[]; {const r=rng(3); for(let i=0;i<60;i++) motes.push({x:r()*W,y:r()*H,s:.6+r()*1.8,sp:.3+r(),ph:r()*TAU});}
function drawMotes(alpha,col='232,233,242'){
  ctx.save();
  for(const m of motes){ const x=(m.x+Math.sin(A*m.sp+m.ph)*14+W)%W, y=((m.y-A*m.sp*10)%H+H)%H;
    ctx.fillStyle=`rgba(${col},${alpha*(.4+.6*Math.sin(A*2*m.sp+m.ph)**2)})`; circle(ctx,x,y,m.s); ctx.fill(); }
  ctx.restore();
}
const noiseC=document.createElement('canvas'); noiseC.width=320; noiseC.height=180; const nx=noiseC.getContext('2d'); const nImg=nx.createImageData(320,180);
let nFrame=0;
function drawNoise(amt){
  if(amt<=0) return;
  if((nFrame++)%2===0){ const d=nImg.data; for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;} nx.putImageData(nImg,0,0); }
  ctx.save(); ctx.globalAlpha=amt; ctx.globalCompositeOperation='screen'; ctx.imageSmoothingEnabled=false; ctx.drawImage(noiseC,0,0,W,H); ctx.restore();
}
function vignette(a=.55){
  const g=ctx.createRadialGradient(640,360,260,640,360,820); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${a})`);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
}
function wrap(c,text,maxW){ const ws=text.split(' '),out=[]; let cur=''; for(const w of ws){const tt=cur?cur+' '+w:w; if(c.measureText(tt).width>maxW&&cur){out.push(cur);cur=w;}else cur=tt;} if(cur)out.push(cur); return out; }
function chip(x,y,w,title,body,col,alpha){
  if(alpha<=0) return;
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(0,(1-alpha)*10);
  ctx.font='700 19px Nunito, sans-serif'; const ls=wrap(ctx,body,w-36); const h=50+ls.length*25;
  rr(ctx,x,y,w,h,16); ctx.fillStyle='rgba(11,15,58,.9)'; ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke();
  ctx.textBaseline='top'; ctx.fillStyle=col; ctx.font='900 14px Nunito, sans-serif'; ctx.fillText(title,x+18,y+15);
  ctx.fillStyle=P.white; ctx.font='700 19px Nunito, sans-serif'; ls.forEach((l,i)=>ctx.fillText(l,x+18,y+38+i*25));
  ctx.restore();
}
const showA=(T,a,b)=>seg(T,a,a+.4)*(1-seg(T,b-.4,b));

/* ===================== SCENE 1 · Darkness (0–8 s) ===================== */
function s1(T){
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  const ph=((T-.5)%1+1)%1, fl=T<.5?0:Math.exp(-ph*5);
  ctx.save(); const g=ctx.createRadialGradient(640,210,0,640,210,40+fl*30); g.addColorStop(0,`rgba(111,227,232,${.25+.6*fl})`); g.addColorStop(1,'rgba(111,227,232,0)');
  ctx.fillStyle=g; circle(ctx,640,210,80); ctx.fill(); ctx.fillStyle=`rgba(232,253,255,${.35+.65*fl})`; circle(ctx,640,210,3.5+fl*2.5); ctx.fill(); ctx.restore();
  const L=[[t('l1'),1.8,P.amber],[t('l2'),3.3,P.aqua],[t('l3'),4.9,P.aqua]];
  ctx.font='700 30px "Space Mono", monospace'; ctx.textBaseline='middle';
  const wMax=Math.max(...L.map(l=>ctx.measureText(l[0]).width)), x0=(W-wMax)/2;
  let cursor=null;
  L.forEach(([s,t0,col],i)=>{
    if(T<t0) return;
    const n=Math.floor(clamp((T-t0)*22,0,s.length)); const txt=s.slice(0,n);
    let a=1; if(i===0 && n===s.length) a=Math.sin(A*7)>-.2?1:.35;
    ctx.globalAlpha=a; ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=12;
    ctx.fillText(txt,x0,320+i*58); ctx.shadowBlur=0; ctx.globalAlpha=1;
    cursor=[x0+ctx.measureText(txt).width+6, 320+i*58];
  });
  if(!cursor && T>.8) cursor=[x0,320];
  if(cursor && Math.sin(A*9)>0){ ctx.fillStyle=P.aqua; ctx.fillRect(cursor[0],cursor[1]-14,16,28); }
  ctx.strokeStyle='rgba(111,227,232,.35)'; ctx.lineWidth=3;
  [[x0-50,250,1,1],[x0+wMax+50,250,-1,1],[x0-50,470,1,-1],[x0+wMax+50,470,-1,-1]].forEach(([x,y,sx,sy])=>{ctx.beginPath();ctx.moveTo(x,y+sy*30);ctx.lineTo(x,y);ctx.lineTo(x+sx*30,y);ctx.stroke();});
  ctx.font='400 15px "Space Mono", monospace'; ctx.fillStyle='rgba(111,227,232,.5)'; ctx.textBaseline='alphabetic';
  ctx.fillText(t('channel'), x0-50, 500);
  ctx.fillStyle='rgba(0,0,0,.25)'; for(let y=0;y<H;y+=4) ctx.fillRect(0,y,W,2);
}

/* ===================== SCENE 2 · The Moon (8–18 s) ===================== */
const craters=[]; {const r=rng(21); for(let i=0;i<48;i++){ let a=r()*TAU, d=Math.sqrt(r())*.9; if(i<16){a=Math.PI/2+(r()-.5)*1.5; d=.62+r()*.3;} craters.push({x:Math.cos(a)*d,y:Math.sin(a)*d,r:.025+r()*.085}); }}
const maria=[{x:-.25,y:-.28,r:.27},{x:.22,y:-.08,r:.2},{x:-.06,y:.22,r:.16}];
function drawMoon(cx,cy,r){
  ctx.save();
  const gl=ctx.createRadialGradient(cx,cy,r*.95,cx,cy,r*1.3); gl.addColorStop(0,'rgba(180,170,240,.28)'); gl.addColorStop(1,'rgba(180,170,240,0)');
  ctx.fillStyle=gl; circle(ctx,cx,cy,r*1.3); ctx.fill();
  const g=ctx.createRadialGradient(cx+r*.3,cy-r*.35,r*.05,cx,cy,r); g.addColorStop(0,'#F0F0F8'); g.addColorStop(.6,'#B9BACB'); g.addColorStop(1,'#7C7E9C');
  circle(ctx,cx,cy,r); ctx.fillStyle=g; ctx.fill(); ctx.clip();
  ctx.fillStyle='rgba(110,112,150,.32)'; for(const m of maria){ circle(ctx,cx+m.x*r,cy+m.y*r,m.r*r); ctx.fill(); }
  for(const c of craters){
    const px=cx+c.x*r, py=cy+c.y*r, cr=c.r*r;
    ctx.fillStyle='rgba(70,72,112,.5)'; ell(ctx,px,py,cr,cr*.9); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=Math.max(1,cr*.13);
    ctx.beginPath(); ctx.ellipse(px,py,cr,cr*.9,0,-.4,Math.PI*.85); ctx.stroke();
  }
  const sp=ctx.createLinearGradient(cx,cy+r*.55,cx,cy+r); sp.addColorStop(0,'rgba(11,15,58,0)'); sp.addColorStop(1,'rgba(11,15,58,.55)');
  ctx.fillStyle=sp; ctx.fillRect(cx-r,cy,r*2,r);
  const sh=ctx.createLinearGradient(cx-r,cy,cx+r*.15,cy); sh.addColorStop(0,'rgba(8,10,40,.92)'); sh.addColorStop(1,'rgba(8,10,40,0)');
  ctx.fillStyle=sh; ctx.fillRect(cx-r,cy-r,r*2,r*2);
  ctx.restore();
}
function s2a(T){
  const k=ease(seg(T,8,12.6));
  ctx.fillStyle='#03041a'; ctx.fillRect(0,0,W,H);
  drawStars(1,1+k*1.8);
  const r=60*Math.pow(15,k), cx=lerp(880,640,k), cy=lerp(290,360-r*.86,k);
  drawMoon(cx,cy,r);
  ctx.font='700 16px "Space Mono", monospace'; ctx.fillStyle=`rgba(111,227,232,${.7*(1-seg(T,11,12))})`; ctx.textBaseline='alphabetic';
  ctx.fillText(t('heading')+Math.max(0,384400-Math.round(k*384000)).toLocaleString(lang)+' km',40,H-40);
}
const R3=rng(99);
function ridge(y0,amp,step,f){const p=[];for(let x=-400;x<=1800;x+=step)p.push([x,y0+Math.sin(x*.0055+f)*amp+Math.sin(x*.019+f*2)*amp*.4+(R3()-.5)*amp*.4]);return p;}
const farR=ridge(425,28,30,1), midR=ridge(512,12,40,3), nearR=ridge(668,12,45,5);
function fillRidge(pts,fill,edge,ew,facets){
  ctx.beginPath(); ctx.moveTo(pts[0][0],H+300); for(const p of pts) ctx.lineTo(p[0],p[1]); ctx.lineTo(pts[pts.length-1][0],H+300); ctx.closePath();
  ctx.fillStyle=fill; ctx.fill();
  if(facets){ ctx.fillStyle=facets; for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1]; if(b[1]<a[1]-2){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(b[0]+6,b[1]+40);ctx.lineTo(a[0]+4,a[1]+22);ctx.closePath();ctx.fill();}} }
  if(edge){ ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.strokeStyle=edge; ctx.lineWidth=ew; ctx.stroke(); }
}
const baseDust=[]; {const r=rng(44); for(let i=0;i<70;i++) baseDust.push([ (r()-.5)*190, -r()*60, r()*2+.5 ]);}
function drawBase(bx,by){
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.55)'; ctx.beginPath(); ctx.moveTo(bx-20,by+2); ctx.lineTo(bx+440,by-4); ctx.lineTo(bx+450,by+12); ctx.lineTo(bx-20,by+12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#5d5f7c'; ctx.lineWidth=3; line(ctx,bx-92,by,bx-92,by-44);
  ctx.save(); ctx.translate(bx-92,by-50); ctx.rotate(-.35); rr(ctx,-32,-15,64,30,3); ctx.fillStyle='#3a3e6c'; ctx.fill(); ctx.strokeStyle='#7a7da3'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.strokeStyle='rgba(122,125,163,.6)'; for(let i=-16;i<32;i+=16) line(ctx,i,-15,i,15); line(ctx,-32,0,32,0);
  ctx.fillStyle='rgba(180,180,200,.25)'; ctx.fillRect(-32,-15,64,30); ctx.restore();
  const mg=ctx.createLinearGradient(bx+18,0,bx+116,0); mg.addColorStop(0,'#b3b5c9'); mg.addColorStop(1,'#55577a');
  rr(ctx,bx+18,by-36,98,36,12); ctx.fillStyle=mg; ctx.fill();
  [bx+46,bx+74,bx+100].forEach(x=>{circle(ctx,x,by-18,6);ctx.fillStyle='#14163a';ctx.fill();ctx.strokeStyle='#3a3c5e';ctx.lineWidth=2;ctx.stroke();});
  const dg=ctx.createRadialGradient(bx-22,by-34,4,bx,by-10,60); dg.addColorStop(0,'#d2d4e2'); dg.addColorStop(1,'#5b5d7a');
  ctx.beginPath(); ctx.arc(bx,by,50,Math.PI,0); ctx.closePath(); ctx.fillStyle=dg; ctx.fill();
  ctx.strokeStyle='rgba(30,30,60,.3)'; ctx.lineWidth=2; [36,22].forEach(r=>{ctx.beginPath();ctx.arc(bx,by,r,Math.PI,0);ctx.stroke();});
  rr(ctx,bx-13,by-28,26,28,9); ctx.fillStyle='#2a2c4a'; ctx.fill();
  circle(ctx,bx+22,by-30,7); ctx.fillStyle='#14163a'; ctx.fill();
  ctx.strokeStyle='#8b8da3'; ctx.lineWidth=2.5; line(ctx,bx,by-50,bx,by-96);
  ctx.beginPath(); ctx.ellipse(bx-9,by-82,13,5,-.6,0,Math.PI); ctx.stroke();
  const bl=(A%2.2)<.12?1:0; circle(ctx,bx,by-98,3.2); ctx.fillStyle=`rgba(255,122,92,${.18+.6*bl})`; ctx.fill();
  ctx.fillStyle='rgba(200,200,215,.35)'; for(const d of baseDust){ if(Math.abs(d[0])<50 && d[1]>-Math.sqrt(2500-d[0]*d[0])) ctx.fillRect(bx+d[0],by+d[1],d[2],d[2]); }
  ell(ctx,bx,by+2,80,6); ctx.fillStyle='rgba(110,112,144,.5)'; ctx.fill();
  ctx.restore();
}
function drawPoleLandscape(k){
  ctx.fillStyle='#03041a'; ctx.fillRect(0,0,W,H);
  drawStars(1);
  ctx.save();
  const s=1+.24*k; ctx.translate(640,360); ctx.scale(s,s); ctx.translate(-640-170*k,-360-14*k);
  circle(ctx,1190,330,17); ctx.fillStyle='#2f6fd0'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle='#3fae6a'; ell(ctx,1185,326,7,5); ctx.fill(); ctx.fillStyle='rgba(3,4,26,.75)'; ctx.fillRect(1192,300,30,60); ctx.restore();
  const sg=ctx.createRadialGradient(20,445,0,20,445,420); sg.addColorStop(0,'rgba(255,214,150,.4)'); sg.addColorStop(1,'rgba(255,181,71,0)');
  ctx.fillStyle=sg; ctx.fillRect(-400,0,900,H); circle(ctx,20,442,18); ctx.fillStyle='#FFF4D6'; ctx.fill();
  const eg=ctx.createLinearGradient(-400,0,1700,0); eg.addColorStop(0,'rgba(255,232,190,1)'); eg.addColorStop(.6,'rgba(255,232,190,.45)'); eg.addColorStop(1,'rgba(255,232,190,.12)');
  fillRidge(farR,'#202247',eg,3,'rgba(255,214,150,.18)');
  fillRidge(midR,'#2d2f58',eg,2.5,'rgba(255,214,150,.12)');
  ell(ctx,520,590,350,72); ctx.fillStyle='#3a3c66'; ctx.fill();
  ell(ctx,520,592,322,62); ctx.fillStyle='#000'; ctx.fill();
  ctx.lineWidth=4; ctx.strokeStyle='rgba(225,220,240,.75)'; ctx.beginPath(); ctx.ellipse(520,592,322,62,0,Math.PI*1.02,Math.PI*1.98); ctx.stroke();
  ctx.strokeStyle='#4a4c72'; ctx.lineWidth=5; ctx.beginPath(); ctx.ellipse(520,592,324,64,0,.05,Math.PI*.95); ctx.stroke();
  ell(ctx,1180,640,150,30); ctx.fillStyle='#000'; ctx.fill(); ctx.strokeStyle='rgba(225,220,240,.5)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(1180,640,150,30,0,Math.PI,TAU); ctx.stroke();
  drawBase(905,560);
  fillRidge(nearR,'#14163a',null,0,null);
  ctx.restore();
  drawMotes(.25,'200,200,220');
}
function s2b(T){
  drawPoleLandscape(ease(seg(T,12.6,18)));
  chip(40,40,400,t('lroTitle'),t('lroBody'),P.amber,showA(T,14.3,17.7));
}

/* ===================== SCENE 3 · LUNIA wakes up (18–32 s) ===================== */
const scr=document.createElement('canvas'); scr.width=440; scr.height=310; const sx=scr.getContext('2d');
function drawLuniaFace(c,cx,cy,s,mood,talk,lx=0,ly=0){
  c.save(); c.translate(cx,cy); c.scale(s,s);
  c.shadowColor=P.aqua; c.shadowBlur=18;
  circle(c,0,0,92); c.fillStyle='rgba(111,227,232,.08)'; c.fill(); c.lineWidth=6; c.strokeStyle=P.aqua; c.stroke();
  const bt=A%3.4, blink=bt<.16?Math.abs(Math.cos(bt/.16*Math.PI)):1;
  const eh=(mood==='scared'?46:38)*Math.max(.08,blink), ew=mood==='scared'?27:24;
  c.fillStyle=P.white;
  for(const sg of [-1,1]){ ell(c,sg*36+lx*8,-12+ly*7,ew/2,eh/2); c.fill(); }
  c.shadowBlur=8;
  c.strokeStyle=P.aqua; c.lineWidth=5; c.lineCap='round';
  if(mood==='sad'){ line(c,-52,-42,-24,-52); line(c,52,-42,24,-52); }
  if(mood==='scared'){ line(c,-54,-50,-22,-62); line(c,54,-50,22,-62); }
  c.strokeStyle=P.white; c.fillStyle=P.white; c.lineWidth=5;
  if(talk){ const o=4+9*Math.abs(Math.sin(A*13))*(.6+.4*Math.sin(A*5.3)); ell(c,0,40,mood==='scared'?9:13,o); c.fill(); }
  else if(mood==='sad'){ c.beginPath(); c.arc(0,58,16,Math.PI*1.2,Math.PI*1.8); c.stroke(); }
  else if(mood==='scared'){ ell(c,0,42,8,10); c.stroke(); }
  else { c.beginPath(); c.arc(0,28,16,Math.PI*.2,Math.PI*.8); c.stroke(); }
  c.shadowBlur=0; c.fillStyle='rgba(232,65,140,.5)'; ell(c,-62,22,12,7); c.fill(); ell(c,62,22,12,7); c.fill();
  c.restore();
}
function paintScreen(on,bright,mood,talk,lx,ly){
  const c=sx;
  if(!on){
    c.fillStyle=`rgb(${5+bright*40|0},${7+bright*70|0},${26+bright*110|0})`; c.fillRect(0,0,440,310);
  } else {
    const g=c.createRadialGradient(220,140,20,220,155,260); g.addColorStop(0,'#16387a'); g.addColorStop(1,'#060f30'); c.fillStyle=g; c.fillRect(0,0,440,310);
    drawLuniaFace(c,220,126,1,mood,talk,lx,ly);
    c.font='700 15px "Space Mono", monospace'; c.textBaseline='middle'; c.fillStyle=P.aqua; c.fillText(t('energy'),92,264);
    rr(c,180,256,150,16,5); c.strokeStyle=P.aqua; c.lineWidth=2; c.stroke();
    const bl=Math.sin(A*5)>0; rr(c,183,259,10,10,3); c.fillStyle=bl?P.coral:'rgba(255,122,92,.35)'; c.fill();
    c.fillStyle=P.coral; c.fillText('6%',340,264);
  }
  c.fillStyle='rgba(0,0,0,.2)'; for(let y=0;y<310;y+=3) c.fillRect(0,y,440,1);
  const ry=(A*70)%400-50, rg=c.createLinearGradient(0,ry,0,ry+44); rg.addColorStop(0,'rgba(111,227,232,0)'); rg.addColorStop(.5,'rgba(111,227,232,.08)'); rg.addColorStop(1,'rgba(111,227,232,0)');
  c.fillStyle=rg; c.fillRect(0,ry,440,44);
  const rf=c.createLinearGradient(0,0,440,310); rf.addColorStop(0,'rgba(255,255,255,.07)'); rf.addColorStop(.4,'rgba(255,255,255,0)'); c.fillStyle=rf; c.fillRect(0,0,440,310);
}
function blitScreen(dx,dy,dw,dh,glitch,alpha){
  ctx.save(); rr(ctx,dx,dy,dw,dh,16*dw/440); ctx.clip(); ctx.fillStyle='#000'; ctx.fillRect(dx,dy,dw,dh); ctx.globalAlpha=alpha;
  const N=14, sh=310/N;
  for(let i=0;i<N;i++){ const off=(glitch>0&&Math.random()<glitch)?(Math.random()-.5)*70*glitch:0;
    ctx.drawImage(scr,0,i*sh,440,sh,dx+off*dw/440,dy+i*sh*dh/310,dw,sh*dh/310+1); }
  ctx.restore();
}
function burst(){ return Math.sin(A*.9)*Math.sin(A*2.3)>.86?.6:0; }
function porthole(cx,cy,r,inner){
  ctx.save(); circle(ctx,cx,cy,r); ctx.clip(); inner();
  const rf=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r); rf.addColorStop(0,'rgba(255,255,255,.08)'); rf.addColorStop(.35,'rgba(255,255,255,0)'); ctx.fillStyle=rf; ctx.fillRect(cx-r,cy-r,r*2,r*2);
  ctx.restore();
  ctx.lineWidth=r*.16; ctx.strokeStyle='#2A2C4A'; circle(ctx,cx,cy,r+r*.08); ctx.stroke();
  ctx.lineWidth=4; ctx.strokeStyle='#3a3d66'; circle(ctx,cx,cy,r+r*.16); ctx.stroke(); circle(ctx,cx,cy,r); ctx.stroke();
  ctx.fillStyle='#4a4d7a'; for(let i=0;i<12;i++){ const a=i/12*TAU; circle(ctx,cx+Math.cos(a)*(r+r*.08),cy+Math.sin(a)*(r+r*.08),r*.025+1.5); ctx.fill(); }
}
function wallPanels(){
  ctx.fillStyle='#0a0c2c'; ctx.fillRect(0,0,W,H);
  for(let i=0;i<7;i++){ rr(ctx,i*210-30,40,190,470,18); ctx.fillStyle='#0c0f33'; ctx.fill(); ctx.strokeStyle='#161a48'; ctx.lineWidth=3; ctx.stroke(); }
  ctx.fillStyle='#121540'; ctx.fillRect(0,0,W,24); ctx.strokeStyle='#1d2152'; ctx.lineWidth=10; line(ctx,0,14,W,14);
}
const MON={x:580,y:330};
function drawMonitor(cx,cy){
  ctx.strokeStyle='#1f2146'; ctx.lineWidth=8; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(cx-232,cy+150); ctx.bezierCurveTo(cx-300,cy+180,cx-320,cy+220,cx-360,cy+260); ctx.stroke();
  rr(ctx,cx-40,cy+170,80,44,6); ctx.fillStyle='#1f2146'; ctx.fill(); rr(ctx,cx-95,cy+206,190,14,7); ctx.fill();
  rr(ctx,cx-240,cy-175,480,350,30); ctx.fillStyle='#2A2C4A'; ctx.fill(); ctx.strokeStyle='#3a3d66'; ctx.lineWidth=3; ctx.stroke();
  rr(ctx,cx-228,cy-163,456,326,22); ctx.fillStyle='#14163a'; ctx.fill();
  ctx.fillStyle='#4a4d7a'; [[-226,-161],[226,-161],[-226,161],[226,161]].forEach(([x,y])=>{circle(ctx,cx+x*1.03,cy+y*1.04,4);ctx.fill();});
  ctx.strokeStyle='rgba(111,114,160,.7)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx+190,cy-175); ctx.lineTo(cx+205,cy-160); ctx.lineTo(cx+200,cy-150); ctx.lineTo(cx+214,cy-138); ctx.stroke();
  ctx.font='400 11px "Space Mono", monospace'; ctx.fillStyle='#5d6094'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('LUNIA-OS v0.3',cx,cy+169); ctx.textAlign='left';
}
function luniaMood(T){ let m='neutral'; for(const c of CUES) if(c.who==='lunia'&&c.t<=T) m=c.mood; return m; }
function s3(T){
  const on=T>=19.6;
  let bright=0;
  if(!on && T>18.15) bright=Math.random()<.35?.8:.05;
  if(on) bright=.75+.25*Math.random()*(T<21?1:.3);
  wallPanels();
  porthole(1060,250,110,()=>{ ctx.fillStyle='#020312'; ctx.fillRect(900,100,320,300); drawStars(1,1,420,-110);
    ctx.fillStyle='#3a3c5e'; ctx.beginPath(); ctx.moveTo(940,330); ctx.quadraticCurveTo(1060,300,1180,325); ctx.lineTo(1180,400); ctx.lineTo(940,400); ctx.fill();
    ctx.strokeStyle='rgba(255,232,190,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(940,330); ctx.quadraticCurveTo(1060,300,1180,325); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(0,548); ctx.lineTo(W,530); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fillStyle='#14163a'; ctx.fill();
  ctx.strokeStyle='#2A2C4A'; ctx.lineWidth=4; line(ctx,0,548,W,530);
  for(let i=0;i<8;i++){ const on2=on && i===5 && Math.sin(A*4)>0; rr(ctx,860+i*44,580,28,16,5); ctx.fillStyle=on2?P.amber:'#22254f'; ctx.fill(); }
  drawMonitor(MON.x,MON.y);
  paintScreen(on,bright,luniaMood(T),talking('lunia'),0,0);
  const gl=on?Math.max(.06,.9*(1-seg(T,19.6,21.4)),burst()):0;
  blitScreen(MON.x-220,MON.y-155,440,310,gl,on?(.82+.18*Math.random()):1);
  if(bright>0){ const g=ctx.createRadialGradient(MON.x,MON.y,100,MON.x,MON.y,700); g.addColorStop(0,`rgba(33,193,224,${.14*bright})`); g.addColorStop(1,'rgba(33,193,224,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  drawParts();
  drawMotes(on?.35:.12,'180,240,245');
}

/* ===================== SCENE 4 · The Sun stirs (32–43 s) ===================== */
// The Sun is a disc with a soft corona glow and a luminous ring (no spikes).
// The ring flares brighter for a moment when the solar flare happens.
function drawSun(cx,cy,r,T){
  const pulse=.5+.5*Math.sin(A*1.6);
  const boost=T>=36?Math.exp(-(T-36)*1.1):0;
  ctx.save();
  const gl=ctx.createRadialGradient(cx,cy,r*.8,cx,cy,r*2.4); gl.addColorStop(0,`rgba(255,181,71,${.45+.3*boost})`); gl.addColorStop(1,'rgba(255,122,92,0)');
  ctx.fillStyle=gl; circle(ctx,cx,cy,r*2.4); ctx.fill();
  const rad=r*(1.2+.015*pulse+.05*boost);
  ctx.shadowColor='rgba(255,196,110,1)'; ctx.shadowBlur=r*(.35+.45*boost);
  ctx.lineWidth=r*(.09+.03*pulse+.06*boost); ctx.strokeStyle=`rgba(255,206,130,${.7+.2*pulse})`; circle(ctx,cx,cy,rad); ctx.stroke();
  ctx.shadowBlur=0; ctx.lineWidth=r*.022; ctx.strokeStyle='rgba(255,246,222,.9)'; circle(ctx,cx,cy,rad); ctx.stroke();
  ctx.lineWidth=r*.03; ctx.strokeStyle=`rgba(255,181,71,${.16+.12*pulse+.25*boost})`; circle(ctx,cx,cy,r*(1.48+.04*pulse+.08*boost)); ctx.stroke();
  ctx.restore();

  ctx.save();
  const yawn=(T>=34&&T<35.9)?Math.sin(seg(T,34,35.9)*Math.PI):0, awake=seg(T,35.9,36.3);
  ctx.translate(cx,cy); ctx.scale(1-yawn*.03,1+yawn*.05);
  const dg=ctx.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r); dg.addColorStop(0,'#FFE7A8'); dg.addColorStop(.6,'#FFB547'); dg.addColorStop(1,'#FF8A5C');
  circle(ctx,0,0,r); ctx.fillStyle=dg; ctx.fill();
  ctx.strokeStyle='#8a3a2a'; ctx.fillStyle='#8a3a2a'; ctx.lineWidth=r*.055; ctx.lineCap='round';
  for(const sg of [-1,1]){
    const ex=sg*r*.36, ey=-r*.1;
    if(awake<.5){ ctx.beginPath(); ctx.arc(ex,ey-r*.06,r*(yawn>.3?.1:.13),Math.PI*.15,Math.PI*.85); ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(ex,ey,r*.1,r*.1,0,0,Math.PI); ctx.fill(); line(ctx,ex-r*.14,ey,ex+r*.14,ey);
           line(ctx,ex-sg*r*.16,ey-r*.24,ex+sg*r*.1,ey-r*.15); }
  }
  if(yawn>0){ ell(ctx,0,r*.32,r*.16*(.4+.6*yawn),r*.22*yawn+2); ctx.fill(); }
  else if(awake>=.5){ ctx.beginPath(); ctx.arc(0,r*.46,r*.14,Math.PI*1.2,Math.PI*1.8); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(0,r*.18,r*.1,Math.PI*.2,Math.PI*.8); ctx.stroke(); }
  ctx.fillStyle='rgba(232,65,140,.35)'; ell(ctx,-r*.56,r*.18,r*.13,r*.08); ctx.fill(); ell(ctx,r*.56,r*.18,r*.13,r*.08); ctx.fill();
  if(T<34){ ctx.fillStyle='#fff'; ctx.textBaseline='middle';
    for(let i=0;i<3;i++){ const ph=((A*.5)+i/3)%1; ctx.globalAlpha=Math.sin(ph*Math.PI); ctx.font=`900 ${Math.round(r*(.2+ph*.15))}px Nunito, sans-serif`; ctx.fillText('z',r*.8+ph*r*.6,-r*.75-ph*r*.8); } }
  ctx.restore();
}
function drawWaves(cx,cy,T){
  const a0=seg(T,36.5,37.1); if(a0<=0) return;
  ctx.save(); ctx.lineWidth=3; ctx.setLineDash([6,12]); ctx.lineDashOffset=-A*40;
  for(let i=0;i<7;i++){ const rad=120+(((T-36.5)*170+i*90)%640); const a=a0*.55*(1-rad/780);
    ctx.strokeStyle=`rgba(232,65,140,${a})`; ctx.beginPath(); ctx.arc(cx,cy,rad,1.6,3.1); ctx.stroke();
    ctx.strokeStyle=`rgba(111,227,232,${a*.6})`; ctx.beginPath(); ctx.arc(cx,cy,rad+8,1.65,3.05); ctx.stroke(); }
  ctx.restore();
}
function s4(T){
  ctx.save();
  let amp=0; if(T>41.3) amp=16*(1-seg(T,41.3,43)); if(T>36&&T<36.6) amp=Math.max(amp,6);
  if(amp>0) ctx.translate((Math.random()-.5)*amp,(Math.random()-.5)*amp);
  wallPanels();
  const PX=720,PY=320,PR=270, SX=820,SY=230,SR=92;
  porthole(PX,PY,PR,()=>{
    ctx.fillStyle='#020312'; ctx.fillRect(PX-PR,PY-PR,PR*2,PR*2); drawStars(1,1,80,-40);
    drawSun(SX,SY,SR,T);
    ctx.fillStyle='#3a3c5e'; ctx.beginPath(); ctx.moveTo(PX-PR,505); ctx.quadraticCurveTo(PX-60,470,PX+90,500); ctx.quadraticCurveTo(PX+200,520,PX+PR,490); ctx.lineTo(PX+PR,PY+PR); ctx.lineTo(PX-PR,PY+PR); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,232,190,.65)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(PX-PR,505); ctx.quadraticCurveTo(PX-60,470,PX+90,500); ctx.quadraticCurveTo(PX+200,520,PX+PR,490); ctx.stroke();
    drawWaves(SX,SY,T);
    const f=T>=36?Math.exp(-(T-36)*4):0; if(f>.01){ ctx.fillStyle=`rgba(255,240,220,${f*.6})`; ctx.fillRect(PX-PR,PY-PR,PR*2,PR*2); }
  });
  const ra=showA(T,37.4,43.2);
  if(ra>0){ ctx.save(); ctx.globalAlpha=ra; ctx.font='800 17px Nunito, sans-serif'; const lbl=t('radLabel'); const lw=ctx.measureText(lbl).width+30;
    ctx.setLineDash([5,6]); rr(ctx,505,418,lw,40,20); ctx.fillStyle='rgba(11,15,58,.75)'; ctx.fill(); ctx.strokeStyle=P.pink; ctx.lineWidth=2; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=P.white; ctx.textBaseline='middle'; ctx.fillText(lbl,520,438); ctx.restore(); }
  const ix=40,iy=300,iw=250,ih=176;
  rr(ctx,ix-14,iy-14,iw+28,ih+28,22); ctx.fillStyle='#2A2C4A'; ctx.fill(); ctx.strokeStyle='#3a3d66'; ctx.lineWidth=3; ctx.stroke();
  paintScreen(true,1,'scared',talking('lunia'),.9,-1);
  blitScreen(ix,iy,iw,ih,Math.max(.05,burst()),.9+.1*Math.random());
  chip(890,40,350,t('flareTitle'),t('flareBody'),P.coral,showA(T,36.3,39.6));
  chip(890,40,350,t('donkiTitle'),t('donkiBody'),P.amber,showA(T,39.6,43.2));
  ctx.restore();
}

/* ===================== SCENE 5 · Earth answers (43–65 s) ===================== */
const land=[], clouds=[]; {const r=rng(5); for(let i=0;i<30;i++) land.push({lon:r()*TAU,lat:(r()-.5)*2,r:.1+r()*.18}); for(let i=0;i<22;i++) clouds.push({lon:r()*TAU,lat:(r()-.5)*2.2,r:.05+r()*.1});}
function drawEarth(cx,cy,r){
  ctx.save();
  const at=ctx.createRadialGradient(cx,cy,r*.95,cx,cy,r*1.18); at.addColorStop(0,'rgba(111,227,232,.5)'); at.addColorStop(1,'rgba(111,227,232,0)'); ctx.fillStyle=at; circle(ctx,cx,cy,r*1.18); ctx.fill();
  const og=ctx.createRadialGradient(cx-r*.3,cy-r*.3,r*.1,cx,cy,r); og.addColorStop(0,'#4aa0f0'); og.addColorStop(1,'#123f99'); circle(ctx,cx,cy,r); ctx.fillStyle=og; ctx.fill(); ctx.clip();
  const blobs=(arr,col,rot)=>{ ctx.fillStyle=col; for(const b of arr){ const lo=b.lon+A*rot, z=Math.cos(lo)*Math.cos(b.lat); if(z<-.05) continue;
    ell(ctx,cx+r*Math.sin(lo)*Math.cos(b.lat),cy+r*Math.sin(b.lat)*.95,b.r*r*Math.max(.25,z),b.r*r*.75); ctx.fill(); } };
  blobs(land,'#3fae6a',.12); blobs(clouds,'rgba(255,255,255,.6)',.16);
  const sh=ctx.createLinearGradient(cx-r*.1,0,cx+r,0); sh.addColorStop(0,'rgba(5,8,30,0)'); sh.addColorStop(1,'rgba(5,8,30,.8)'); ctx.fillStyle=sh; ctx.fillRect(cx-r,cy-r,r*2,r*2);
  ctx.restore();
}
function s5a(T){
  const k=ease(seg(T,43,45.6));
  ctx.fillStyle='#03041a'; ctx.fillRect(0,0,W,H); drawStars(1,1+k*.6);
  drawEarth(640,lerp(360,560,k),lerp(140,640,k));
  const s=t('earthHdr'), n=Math.floor(clamp((T-43.3)*30,0,s.length));
  ctx.font='700 22px "Space Mono", monospace'; ctx.fillStyle=P.aqua; ctx.textBaseline='alphabetic'; ctx.shadowColor=P.aqua; ctx.shadowBlur=10;
  ctx.fillText(s.slice(0,n),40,60); ctx.shadowBlur=0;
  ctx.font='400 16px "Space Mono", monospace'; ctx.fillStyle='rgba(111,227,232,.6)'; if(T>44.4) ctx.fillText(t('controlRoom'),40,88);
}
function screenContent(i,x,y,w,h){
  ctx.save(); rr(ctx,x,y,w,h,10); ctx.clip();
  const tt=A;
  switch(i%6){
    case 0: ctx.strokeStyle=P.aqua; ctx.lineWidth=2; ctx.beginPath(); for(let j=0;j<=w;j+=4){const yy=y+h/2+Math.sin(j*.08+tt*3)*h*.25*Math.sin(j*.02+tt); j?ctx.lineTo(x+j,yy):ctx.moveTo(x+j,yy);} ctx.stroke(); break;
    case 1: for(let j=0;j<7;j++){const bh=(.3+.6*Math.abs(Math.sin(tt*1.5+j)))*(h-24); ctx.fillStyle=j%2?P.amber:P.coral; ctx.fillRect(x+12+j*(w-24)/7,y+h-12-bh,(w-24)/7-6,bh);} break;
    case 2: { const cx=x+w/2,cy=y+h/2,rr2=h*.38; ctx.strokeStyle='rgba(111,227,232,.4)'; ctx.lineWidth=1.5; circle(ctx,cx,cy,rr2); ctx.stroke(); circle(ctx,cx,cy,rr2*.5); ctx.stroke();
      ctx.strokeStyle=P.aqua; ctx.lineWidth=2.5; line(ctx,cx,cy,cx+Math.cos(tt*2)*rr2,cy+Math.sin(tt*2)*rr2); ctx.fillStyle=P.pink; if(Math.sin(tt*2)>.3){circle(ctx,cx+rr2*.6,cy+rr2*.4,4);ctx.fill();} break; }
    case 3: { circle(ctx,x+40,y+h/2,20); ctx.fillStyle=P.amber; ctx.fill(); ctx.font='700 13px "Space Mono", monospace'; ctx.fillStyle=P.amber; ctx.textBaseline='middle'; ctx.fillText('DONKI',x+70,y+22);
      ctx.strokeStyle=P.coral; ctx.lineWidth=2; ctx.beginPath(); for(let j=0;j<w-80;j+=5){const yy=y+h*.7-(j>60&&j<70?h*.35:Math.random()*4); j?ctx.lineTo(x+70+j,yy):ctx.moveTo(x+70+j,yy);} ctx.stroke(); break; }
    case 4: ctx.fillStyle='rgba(232,233,242,.35)'; for(let j=0;j<5;j++){ ctx.fillRect(x+14,y+16+j*18,(w-28)*(.4+.5*Math.abs(Math.sin(j*7.3+Math.floor(tt*.7)))),7); } break;
    case 5: { circle(ctx,x+w/2,y+h/2,h*.32); ctx.fillStyle='#A8A9B8'; ctx.fill(); if(Math.sin(tt*5)>0){ circle(ctx,x+w/2,y+h/2+h*.26,5); ctx.fillStyle=P.pink; ctx.fill(); } break; }
  }
  ctx.restore();
}
function drawControlRoom(){
  const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0d1040'); bg.addColorStop(1,'#1E1B6E'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  const cols=[60,250,820,1010]; let idx=0;
  for(const x of cols) for(const y of [40,170]){ rr(ctx,x,y,170,110,12); ctx.fillStyle='#10153f'; ctx.fill(); ctx.strokeStyle='#2f3270'; ctx.lineWidth=3; ctx.stroke(); screenContent(idx++,x+4,y+4,162,102); }
  rr(ctx,440,40,360,240,16); ctx.fillStyle='#0c1238'; ctx.fill(); ctx.strokeStyle=P.pink; ctx.lineWidth=3; ctx.stroke();
  ctx.font='700 14px "Space Mono", monospace'; ctx.fillStyle=P.pink; ctx.textBaseline='middle'; ctx.fillText((Math.sin(A*4)>-.3?'● ':'  ')+t('incoming'),458,62);
  drawLuniaFace(ctx,520,150,.42,'sad',false);
  ctx.font='700 13px "Space Mono", monospace'; ctx.fillStyle=P.aqua; ctx.fillText(t('origin'),590,120); ctx.fillText(t('contact'),590,145);
  ctx.fillStyle=Math.sin(A*5)>0?P.coral:'rgba(255,122,92,.4)'; ctx.fillText(t('energyPct'),590,170);
  ctx.strokeStyle=P.pink; ctx.lineWidth=2; ctx.beginPath(); for(let j=0;j<=320;j+=3){const yy=240+Math.sin(j*.12+A*6)*12*Math.abs(Math.sin(j*.03+A)); j?ctx.lineTo(460+j,yy):ctx.moveTo(460+j,yy);} ctx.stroke();
  rr(ctx,-20,470,1320,130,22); ctx.fillStyle='#151843'; ctx.fill(); ctx.strokeStyle='#2f3270'; ctx.lineWidth=3; ctx.stroke();
  for(let i=0;i<32;i++){ const c=[P.aqua,P.amber,P.pink,P.cyan][i%4]; const on=Math.sin(A*(1+i%5)+i)>.2; circle(ctx,30+i*39,500,5); ctx.fillStyle=on?c:'#2a2d60'; ctx.fill(); }
}
const SK='#C68863', SKD='#A96F50', HAIR='#2A1830', UNI='#2E2A8C', UNID='#221F6E';
function riosBody(front){
  ctx.beginPath(); ctx.moveTo(-205,10); ctx.lineTo(-188,-190); ctx.quadraticCurveTo(-178,-262,-95,-272); ctx.lineTo(95,-272); ctx.quadraticCurveTo(178,-262,188,-190); ctx.lineTo(205,10); ctx.closePath();
  const bg=ctx.createLinearGradient(-205,0,205,0); bg.addColorStop(0,front?'#3c37ae':'#2a2690'); bg.addColorStop(.6,UNI); bg.addColorStop(1,UNID);
  ctx.save(); ctx.shadowColor='rgba(111,227,232,.35)'; ctx.shadowBlur=30; ctx.fillStyle=bg; ctx.fill(); ctx.restore();
  ctx.strokeStyle=P.cyan; ctx.lineWidth=6; ctx.lineCap='round';
  for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*178,-212); ctx.quadraticCurveTo(s*164,-254,s*112,-263); ctx.stroke(); }
}
function drawRios(T){
  let view='front', sxv=1;
  if(T<46.6) view='back'; else if(T<47.4){ const k=seg(T,46.6,47.4); if(k<.5){view='back'; sxv=1-2*k;} else sxv=2*k-1; }
  sxv=Math.max(.04,sxv);
  const talk=talking('rios'), smile=T>=55.4;
  ctx.save(); ctx.translate(640,724); ctx.scale(sxv,1);
  if(view==='back'){
    riosBody(false);
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='rgba(111,227,232,.85)';
    ctx.font='800 18px Nunito, sans-serif'; ctx.fillText(t('backSmall'),0,-185); ctx.font='900 34px Nunito, sans-serif'; ctx.fillText(t('backBig'),0,-152); ctx.textAlign='left';
    rr(ctx,-27,-310,54,50,10); ctx.fillStyle=SKD; ctx.fill();
    ell(ctx,-66,-360,11,17); ell(ctx,66,-360,11,17); ctx.fillStyle=SKD; ctx.fill();
    ell(ctx,0,-372,72,84); ctx.fillStyle=HAIR; ctx.fill();
  } else {
    ell(ctx,0,-385,76,76); ctx.fillStyle=HAIR; ctx.fill();
    ell(ctx,-66,-360,11,17); ctx.fillStyle=SKD; ctx.fill(); ell(ctx,66,-360,11,17); ctx.fill();
    rr(ctx,-27,-310,54,50,10); ctx.fillStyle=SKD; ctx.fill();
    riosBody(true);
    ctx.beginPath(); ctx.moveTo(-36,-273); ctx.lineTo(0,-212); ctx.lineTo(36,-273); ctx.closePath(); ctx.fillStyle=SK; ctx.fill();
    ctx.strokeStyle=P.pink; ctx.lineWidth=9; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(-50,-273); ctx.lineTo(0,-200); ctx.lineTo(50,-273); ctx.stroke();
    ctx.strokeStyle=UNID; ctx.lineWidth=3; line(ctx,0,-196,0,10);
    circle(ctx,96,-178,24); ctx.fillStyle=P.indigo; ctx.fill(); ctx.strokeStyle=P.amber; ctx.lineWidth=3; ctx.stroke();
    circle(ctx,96,-178,12); ctx.fillStyle=P.aqua; ctx.fill(); circle(ctx,101,-182,10); ctx.fillStyle=P.indigo; ctx.fill();
    rr(ctx,-138,-196,84,26,7); ctx.fillStyle=P.white; ctx.fill(); ctx.fillStyle=P.navy; ctx.font='900 16px Nunito, sans-serif'; ctx.textBaseline='middle'; ctx.fillText('RÍOS',-120,-182);
    ell(ctx,0,-365,66,80); ctx.fillStyle=SK; ctx.fill();
    ctx.fillStyle=HAIR; ctx.beginPath(); ctx.moveTo(-70,-372); ctx.bezierCurveTo(-78,-440,-30,-458,8,-452); ctx.bezierCurveTo(52,-448,78,-420,70,-372); ctx.bezierCurveTo(52,-410,20,-418,-8,-410); ctx.bezierCurveTo(-36,-404,-56,-392,-70,-372); ctx.fill();
  }
  circle(ctx,0,-470,34); ctx.fillStyle=HAIR; ctx.fill(); ctx.strokeStyle='#4b2d57'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(0,-470,23,3.7,4.7); ctx.stroke();
  rr(ctx,-22,-444,44,9,4); ctx.fillStyle=P.pink; ctx.fill();
  ctx.strokeStyle='#14163a'; ctx.lineWidth=9; ctx.beginPath(); ctx.arc(0,-372,84,Math.PI*1.05,Math.PI*1.95); ctx.stroke();
  for(const s of (view==='back'?[-1,1]:[-1])){ rr(ctx,s*76-11,-382,22,40,9); ctx.fillStyle='#1A1C3F'; ctx.fill(); circle(ctx,s*76,-362,4); ctx.fillStyle=P.aqua; ctx.fill(); }
  if(view==='front'){
    ctx.strokeStyle='#1A1C3F'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(-74,-345); ctx.quadraticCurveTo(-62,-310,-32,-312); ctx.stroke(); circle(ctx,-28,-312,6); ctx.fillStyle=P.aqua; ctx.fill();
    const bt=A%4.1, bl=bt<.14?Math.max(.1,Math.abs(Math.cos(bt/.14*Math.PI))):1;
    for(const s of [-1,1]){ ell(ctx,s*25,-360,8.5,11*bl); ctx.fillStyle='#1b1030'; ctx.fill(); if(bl>.5){ circle(ctx,s*25+3,-364,2.6); ctx.fillStyle='#fff'; ctx.fill(); } }
    ctx.strokeStyle=HAIR; ctx.lineWidth=5; ctx.lineCap='round';
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*39,-383); ctx.quadraticCurveTo(s*27,-391,s*13,-386); ctx.stroke(); }
    ctx.strokeStyle=SKD; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-4,-344); ctx.quadraticCurveTo(0,-337,5,-343); ctx.stroke();
    ctx.fillStyle='rgba(232,65,140,.28)'; ell(ctx,-40,-334,13,8); ctx.fill(); ell(ctx,40,-334,13,8); ctx.fill();
    if(talk){ const o=4+8*Math.abs(Math.sin(A*12))*(.6+.4*Math.sin(A*4.7)); ell(ctx,0,-318,14,o); ctx.fillStyle='#5a1f2e'; ctx.fill(); }
    else if(smile){ ctx.beginPath(); ctx.moveTo(-21,-324); ctx.quadraticCurveTo(0,-296,21,-324); ctx.closePath(); ctx.fillStyle='#5a1f2e'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-18,-323); ctx.quadraticCurveTo(0,-314,18,-323); ctx.closePath(); ctx.fillStyle='#fff'; ctx.fill(); }
    else { ctx.strokeStyle='#6b2a3a'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,-332,15,.25*Math.PI,.75*Math.PI); ctx.stroke(); }
  }
  ctx.restore();
}
function s5b(T){
  const k=ease(seg(T,47.4,END_T));
  ctx.save(); const s=1+.1*k; ctx.translate(640,340); ctx.scale(s,s); ctx.translate(-640,-340);
  drawControlRoom(); drawRios(T);
  ctx.restore();
}

/* ===================== FINAL · Mystery silhouettes ===================== */
// Four white bust silhouettes ("who's that?" style) built from the same shapes as Commander Ríos:
// the same rounded shoulders, neck and head proportions. Only the hair and shoulder width change.
function makeSil(v){
  const c=document.createElement('canvas'); c.width=480; c.height=560; const g=c.getContext('2d');
  g.translate(240,540); g.fillStyle='#F3F6FF';
  const sw=[1,1.02,.94,1][v];
  g.beginPath(); g.moveTo(-205*sw,10); g.lineTo(-188*sw,-190); g.quadraticCurveTo(-178*sw,-262,-95*sw,-272); g.lineTo(95*sw,-272); g.quadraticCurveTo(178*sw,-262,188*sw,-190); g.lineTo(205*sw,10); g.closePath(); g.fill();
  rr(g,-27,-310,54,50,10); g.fill();
  ell(g,-66,-360,11,17); g.fill(); ell(g,66,-360,11,17); g.fill();
  ell(g,0,-365,66,80); g.fill();
  if(v===0){ // ponytail
    ell(g,0,-388,76,74); g.fill();
    g.beginPath(); g.moveTo(58,-432); g.bezierCurveTo(130,-452,162,-380,134,-296); g.bezierCurveTo(122,-342,104,-372,64,-394); g.closePath(); g.fill();
  } else if(v===1){ // short, spiky
    ell(g,0,-390,70,62); g.fill();
    g.beginPath(); g.moveTo(-66,-410);
    [[-58,-466],[-38,-438],[-22,-486],[-4,-446],[14,-492],[30,-446],[52,-474],[62,-424]].forEach(p=>g.lineTo(p[0],p[1]));
    g.lineTo(66,-390); g.lineTo(-66,-390); g.closePath(); g.fill();
  } else if(v===2){ // big curly puff
    circle(g,0,-420,92); g.fill(); circle(g,-72,-388,40); g.fill(); circle(g,72,-388,40); g.fill();
  } else { // long hair
    ell(g,0,-388,78,76); g.fill();
    for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*70,-400); g.bezierCurveTo(s*100,-370,s*106,-300,s*100,-236); g.lineTo(s*50,-246); g.lineTo(s*58,-330); g.closePath(); g.fill(); }
  }
  // fade the bust out at the bottom, like the commander's cut-off framing
  g.globalCompositeOperation='destination-in';
  const fade=g.createLinearGradient(0,-110,0,10); fade.addColorStop(0,'#000'); fade.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=fade; g.fillRect(-240,-540,480,560);
  return c;
}
const sils=[0,1,2,3].map(makeSil);
function sEnd(T){
  const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#1E1B6E'); bg.addColorStop(1,'#0B0F3A'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  drawStars(.8);
  ctx.save(); ctx.translate(640,548); ctx.scale(1,.18); const sp=ctx.createRadialGradient(0,0,0,0,0,560); sp.addColorStop(0,'rgba(111,227,232,.35)'); sp.addColorStop(1,'rgba(111,227,232,0)'); ctx.fillStyle=sp; circle(ctx,0,0,560); ctx.fill(); ctx.restore();
  const xs=[212,498,782,1068], S=.64;
  sils.forEach((s,i)=>{
    const k=easeOut(seg(T,END_T+.2+i*.22,END_T+.9+i*.22)); if(k<=0) return;
    const w=480*S, h=560*S, x=xs[i]-w/2, y=548-540*S+(1-k)*30+Math.sin(A*1.4+i*1.3)*3;
    ctx.save(); ctx.globalAlpha=k; ctx.shadowColor=P.aqua; ctx.shadowBlur=30; ctx.drawImage(s,x,y,w,h); ctx.shadowBlur=12; ctx.drawImage(s,x,y,w,h); ctx.restore();
  });
}

/* ---------------- Render loop ---------------- */
const DIPS=[8,12.6,18,32,43,45.6,END_T];
function activeCue(){ let c=null; for(const q of CUES) if(q.t<=T) c=q; return c; }
function talking(who){
  if(voiceOn && speaking) return speakingWho===who;
  const c=activeCue(); if(!c||c.who!==who) return false;
  return T<c.t+(c.end-c.t)*.75;
}
const subsEl=document.getElementById('subs'), whoEl=subsEl.querySelector('.who'), txtEl=subsEl.querySelector('.txt');
let subShown=null;
function updSubs(){
  const c=activeCue();
  const vis = playing && !ended && c && (T<c.end || (speaking && speakingCue===c));
  if(vis){ if(subShown!==c){ subShown=c; const nm=WHO[c.who].name[lang]; whoEl.textContent=nm; whoEl.style.display=nm?'block':'none'; whoEl.style.color=WHO[c.who].col; txtEl.textContent=c[lang]; } subsEl.classList.add('on'); }
  else subsEl.classList.remove('on');
}
function render(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(T<8) s1(T); else if(T<12.6) s2a(T); else if(T<18) s2b(T); else if(T<32) s3(T); else if(T<43) s4(T); else if(T<45.6) s5a(T); else if(T<END_T) s5b(T); else sEnd(T);
  let na=.025; if(T<8) na=lerp(.2,.09,seg(T,0,7)); else if(T>=18&&T<22) na=.07;
  drawNoise(na); vignette(T<8?.2:.5);
  let dip=0; for(const d of DIPS) dip=Math.max(dip,1-Math.abs(T-d)/.4); if(T<8) dip=Math.max(dip,seg(T,7.4,8));
  if(dip>0){ ctx.fillStyle=`rgba(0,0,0,${clamp(dip)})`; ctx.fillRect(0,0,W,H); }
  updSubs();
}
function audioTick(){
  if(!ac) return; let l=0;
  if(T<8) l=(.04+(Math.random()<.1?.14:0))*(1-seg(T,7.2,8));
  else if(T>=18.1&&T<19.6) l=Math.random()<.35?.2:.03;
  else if(T>=19.6&&T<32) l=.05*(1-seg(T,19.6,21.5))+(burst()?.05:0);
  else if(T>=32&&T<43) l=burst()?.03:0;
  staticGain.gain.setTargetAtTime(l,ac.currentTime,.02);
  robotGain.gain.setTargetAtTime((voiceOn && speaking && speakingWho==='lunia')?.055:0, ac.currentTime, .05);
}
function advance(dt){
  let nt=T+dt;
  if(speaking){ for(const g of GATES){ if(g>T && g<=nt){ nt=Math.min(nt,g-1e-4); break; } } }
  fire(T,nt); T=nt;
  if(T>=END_T && !ended) finish();
}
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000); last=now;
  if(playing && !paused){ const sdt=dt*speed; A+=sdt; updParts(sdt); if(!ended) advance(sdt); else T+=sdt; audioTick(); }
  else if(!playing){ A+=dt; }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------------- UI ---------------- */
const $=id=>document.getElementById(id);
const startEl=$('start'), endEl=$('end'), ctrl=$('controls');
function applyLang(){
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{ el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{ el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  $('langEs').setAttribute('aria-pressed', lang==='es'); $('langEn').setAttribute('aria-pressed', lang==='en');
  $('bPause').textContent = t(paused?'resume':'pause');
  subShown=null;
  pickVoices();
}
function syncToggles(){
  [['tVoice','bVoice',voiceOn],['tSfx','bSfx',sfxOn]].forEach(([a,b,v])=>{$(a).setAttribute('aria-pressed',v);$(b).setAttribute('aria-pressed',v);});
  $('spd1').setAttribute('aria-pressed', speed===1); $('spd125').setAttribute('aria-pressed', speed===1.25);
  $('bSpeed').textContent = speed===1 ? '1x' : '1.25x';
  if(curAudio) curAudio.playbackRate = speed;
  if(ac){ master.gain.setTargetAtTime(sfxOn?.8:0,ac.currentTime,.05); voiceFx.gain.setTargetAtTime(voiceOn?1:0,ac.currentTime,.05); }
}
const toggleVoice=()=>{ voiceOn=!voiceOn; if(!voiceOn) stopVoice(); syncToggles(); };
const toggleSfx=()=>{ sfxOn=!sfxOn; syncToggles(); };
const setSpeed=v=>{ speed=v; syncToggles(); };
$('tVoice').onclick=toggleVoice; $('bVoice').onclick=toggleVoice;
$('tSfx').onclick=toggleSfx; $('bSfx').onclick=toggleSfx;
$('spd1').onclick=()=>setSpeed(1); $('spd125').onclick=()=>setSpeed(1.25);
$('bSpeed').onclick=()=>{ setSpeed(speed===1?1.25:1); showCtrl(); };
$('langEs').onclick=()=>{ lang='es'; applyLang(); };
$('langEn').onclick=()=>{ lang='en'; applyLang(); };

function start(){
  initAudio(); if(ac && ac.state==='suspended') ac.resume().catch(()=>{});
  syncToggles(); pickVoices();
  if(voiceOn && 'speechSynthesis' in window){ try{ const u=new SpeechSynthesisUtterance(' '); u.volume=0; speechSynthesis.speak(u);}catch(e){} }
  T=0; ended=false; paused=false; playing=true; parts.length=0; subShown=null;
  startEl.classList.add('off'); endEl.classList.remove('on'); $('toast').classList.remove('on');
  $('bPause').textContent=t('pause'); showCtrl();
}
$('bStart').onclick=start;
function setPause(p){
  if(!playing||ended) return; paused=p;
  $('bPause').textContent=t(p?'resume':'pause');
  if(ac){ p?ac.suspend():ac.resume(); }
  if('speechSynthesis' in window){ p?speechSynthesis.pause():speechSynthesis.resume(); }
  if(curAudio){ p?curAudio.pause():curAudio.play().catch(()=>{}); }
}
$('bPause').onclick=()=>setPause(!paused);
function finish(){
  ended=true; stopVoice(); ctrl.classList.remove('show');
  setTimeout(()=>{ if(ended) endEl.classList.add('on'); },900);
}
function skip(){
  if(!playing||ended) return;
  if(paused) setPause(false);
  stopVoice(); const t0=T; T=END_T; fire(Math.max(t0,END_T-1e-3),END_T); finish();
}
$('bSkip').onclick=skip;
$('bReplay').onclick=()=>{ endEl.classList.remove('on'); setPad([110,164.81,220,261.63],0,.3); start(); };
$('bNext').onclick=()=>{
  window.dispatchEvent(new CustomEvent('cinematica:siguiente', {detail:{lang, speed}}));
  try{ if(window.parent!==window) window.parent.postMessage({type:'cinematica-fin', lang},'*'); }catch(e){}
  window.location.href='../test-habilidades/test-habilidades/index.html';
};
$('bFull').onclick=()=>{ try{ const r=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen(); r&&r.catch&&r.catch(()=>{}); }catch(e){} };
let hideT=null;
function showCtrl(){ if(!playing||ended) return; ctrl.classList.add('show'); clearTimeout(hideT); hideT=setTimeout(()=>{ if(!paused) ctrl.classList.remove('show'); },2600); }
stage.addEventListener('mousemove',showCtrl); stage.addEventListener('touchstart',showCtrl,{passive:true});
document.addEventListener('keydown',e=>{
  if(!playing){ if(e.key==='Enter' && e.target===document.body){ start(); } return; }
  if(e.code==='Space'){ e.preventDefault(); setPause(!paused); showCtrl(); }
  else if(e.key==='s'||e.key==='S'||e.key==='Escape') skip();
  else if(e.key==='Enter' && ended) $('bNext').click();
});
document.addEventListener('visibilitychange',()=>{ if(document.hidden && playing && !ended) setPause(true); });

window.Cinematica={ play:start, skip, pause:()=>setPause(true), resume:()=>setPause(false),
  setLang:l=>{ if(STR[l]){ lang=l; applyLang(); } }, setSpeed:v=>{ if(v===1||v===1.25) setSpeed(v); } };

applyLang(); syncToggles();
})();
