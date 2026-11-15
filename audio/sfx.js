/* ---------------------------------------------------------------------------
   sfx.js · Efectos de sonido sci-fi de Equilibria (sintetizados con Tone.js, 0 archivos de audio)

   Incluir DESPUÉS de audio-ambiente.js, en cada pantalla:
     <script src="../audio/audio-ambiente.js"></script>
     <script src="../audio/sfx.js"></script>
   Tone.js (lib/tone.min.js) se carga solo, en un momento libre tras abrir la página.

   Atributos opcionales en la etiqueta <script> de sfx.js:
     data-sin-teclas   sin tic al pulsar teclas
     data-sin-clic     sin sonido de clic / selección
     data-sin-hover    sin sonido al pasar el cursor
   Atributo opcional en cualquier elemento del juego:
     data-sfx="confirmar"  fuerza ese sonido al hacer clic (data-sfx="off" lo silencia)

   Eventos: window.dispatchEvent(new CustomEvent('eq:sfx', {detail:'glitch'})) o AudioSfx.play('glitch').
   --------------------------------------------------------------------------- */
(() => {
'use strict';
if (window.AudioSfx) return;

const SCRIPT = document.currentScript;
const has = n => !!(SCRIPT && SCRIPT.hasAttribute(n));
const TONE_SRC = new URL('../lib/tone.min.js', SCRIPT ? SCRIPT.src : location.href).href;
const KEY_VOL = 'equilibria:sfx';          // localStorage: {vol}
const KEY_ENT = 'equilibria:sfxEntrada';   // sessionStorage: marca "venimos de otra pantalla"
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];

let vol = 0.8, mute = false;
try { const v = JSON.parse(localStorage.getItem(KEY_VOL) || 'null'); if (v && typeof v.vol === 'number') vol = Math.min(1, Math.max(0, v.vol)); } catch (e) {}

/* ---------- carga perezosa de Tone.js ---------- */
let T = null, toneP = null;
function cargarTone() {
  if (window.Tone && window.Tone.Synth) { T = window.Tone; return Promise.resolve(T); }
  if (toneP) return toneP;
  toneP = new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = TONE_SRC; s.async = true;
    s.onload = () => { T = window.Tone; ok(T); };
    s.onerror = () => { toneP = null; fail(new Error('No se pudo cargar lib/tone.min.js')); };
    document.head.appendChild(s);
  });
  return toneP;
}
const idle = f => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 2500 }) : setTimeout(f, 900));
(document.readyState === 'complete' ? idle : f => addEventListener('load', () => idle(f), { once: true }))(() => { cargarTone().catch(() => {}); });

/* ---------- instrumentos (se crean una sola vez, tras el primer gesto) ---------- */
let I = null, ctx = null, listo = false, iniciando = null;
const last = {};
// Los instrumentos monofónicos no admiten dos disparos en el mismo instante.
const slot = (k, t) => { const l = last[k] === undefined ? -1 : last[k]; if (t <= l) t = l + 0.004; last[k] = t; return t; };

function construir() {
  const bus = window.AudioAmbiente ? AudioAmbiente.busSfx : (() => { const g = ctx.createGain(); g.connect(ctx.destination); return g; })();
  const out = new T.Gain(vol).connect(bus);
  const eco = new T.FeedbackDelay({ delayTime: 0.17, feedback: 0.32, wet: 1 }).connect(out);
  const envio = new T.Gain(0.3).connect(eco);
  const conEco = n => { n.connect(out); n.connect(envio); return n; };

  const blip = new T.PolySynth(T.Synth, { maxPolyphony: 8, options: { oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.05 } } }).connect(out);
  const fm = conEco(new T.PolySynth(T.FMSynth, { maxPolyphony: 8, options: { harmonicity: 3.01, modulationIndex: 9,
    oscillator: { type: 'sine' }, modulation: { type: 'square' },
    envelope: { attack: 0.002, decay: 0.28, sustain: 0, release: 0.2 },
    modulationEnvelope: { attack: 0.002, decay: 0.18, sustain: 0, release: 0.1 } } }));
  const gravesF = new T.Filter(1100, 'lowpass').connect(out);
  const grave = new T.PolySynth(T.Synth, { maxPolyphony: 4, options: { oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.004, decay: 0.16, sustain: 0.05, release: 0.1 } } }).connect(gravesF);
  const sirenaF = new T.Filter(2200, 'lowpass').connect(out);
  const sirena = new T.PolySynth(T.Synth, { maxPolyphony: 3, options: { oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.12, sustain: 0.2, release: 0.08 } } }).connect(sirenaF);

  const hpF = new T.Filter(4500, 'highpass').connect(out);
  const ruido = new T.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 } }).connect(hpF);
  const bpF = new T.Filter({ frequency: 800, type: 'bandpass', Q: 1.6 });
  conEco(bpF);
  const aire = new T.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.2, decay: 0.45, sustain: 0, release: 0.2 } }).connect(bpF);
  const lpF = new T.Filter({ frequency: 160, type: 'lowpass', rolloff: -24 }).connect(out);
  const retumbo = new T.NoiseSynth({ noise: { type: 'brown' }, envelope: { attack: 1.1, decay: 1.2, sustain: 0.3, release: 0.8 } }).connect(lpF);

  blip.volume.value = -9; fm.volume.value = -8; grave.volume.value = -12; sirena.volume.value = -17;
  ruido.volume.value = -22; aire.volume.value = -4; retumbo.volume.value = -5;
  I = { out, blip, fm, grave, sirena, ruido, aire, bpF, retumbo, lpF, hpF };
}

/* ---------- los sonidos ---------- */
const now = () => ctx.currentTime + 0.002;
const nota = (inst, f, d, t, v) => inst.triggerAttackRelease(f, d, t, v);
function barrido(tipo) {   // ruido filtrado que sube (entrada) o baja (salida)
  const t = slot('aire', now()), a = tipo === 'sube';
  I.bpF.frequency.cancelScheduledValues(t);
  I.bpF.frequency.setValueAtTime(a ? 220 : 4200, t);
  I.bpF.frequency.exponentialRampToValueAtTime(a ? 4600 : 260, t + 0.75);
  I.aire.triggerAttackRelease(0.5, t, a ? 0.9 : 0.7);
}
function rafaga(n, dur) {  // ráfagas de ruido y tonos graves entrecortados = glitch
  let t = now(); I.ruido.volume.value = -16;
  for (let i = 0; i < n; i++) {
    const tt = slot('ruido', t);
    I.hpF.frequency.setValueAtTime(rnd(1500, 7000), tt);
    I.ruido.triggerAttackRelease(rnd(0.02, 0.06), tt, rnd(0.6, 1));
    if (i % 2 === 0) nota(I.grave, rnd(70, 420), 0.04, t, 0.5);
    t += rnd(0.02, 0.07) * (dur / 0.35);
  }
}

const SND = {
  tecla()    { const t = now(); I.ruido.volume.value = -34 + rnd(-3, 2); I.hpF.frequency.setValueAtTime(rnd(3500, 6500), t);
               I.ruido.triggerAttackRelease(0.012, slot('ruido', t), 0.8); nota(I.blip, rnd(2300, 3400), 0.02, t, 0.1); },
  hover()    { nota(I.blip, rnd(2900, 3300), 0.03, now(), 0.09); },
  clic()     { const t = now(), f = rnd(1400, 1700); nota(I.blip, f, 0.04, t, 0.45); nota(I.blip, f * 1.5, 0.05, t + 0.045, 0.35); },
  seleccion(){ const t = now(); nota(I.blip, 1250, 0.04, t, 0.4); nota(I.blip, 1880, 0.07, t + 0.05, 0.4); },
  suave()    { const t = now(); nota(I.blip, 880, 0.05, t, 0.3); nota(I.blip, 620, 0.07, t + 0.06, 0.25); },
  confirmar(){ const t = now(); nota(I.fm, 659.25, 0.1, t, 0.5); nota(I.fm, 987.77, 0.18, t + 0.08, 0.55); },
  salida()   { const t = now(); nota(I.fm, 784, 0.08, t, 0.45); nota(I.fm, 1175, 0.12, t + 0.07, 0.45); barrido('baja'); },
  entrada()  { barrido('sube'); nota(I.fm, 1318.5, 0.3, now() + 0.45, 0.35); },
  error()    { const t = now(); nota(I.grave, 110, 0.13, t, 0.7); nota(I.grave, 98, 0.18, t + 0.15, 0.7);
               I.ruido.volume.value = -20; I.hpF.frequency.setValueAtTime(2500, t); I.ruido.triggerAttackRelease(0.05, slot('ruido', t), 0.8); },
  exito()    { const t = now(); [523.25, 659.25, 783.99].forEach((f, i) => nota(I.fm, f, 0.14, t + i * 0.06, 0.5)); },
  logro()    { const t = now(); [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => nota(I.fm, f, 0.22, t + i * 0.085, 0.5)); barrido('sube'); },
  revelar()  { const t = now(); nota(I.fm, 880, 0.2, t, 0.4); nota(I.fm, 1320, 0.3, t + 0.09, 0.35); },
  portada()  { barrido('sube'); const t = now() + 0.55; nota(I.fm, 1046.5, 0.35, t, 0.4); nota(I.fm, 1568, 0.5, t + 0.12, 0.3); },
  glitch()   { rafaga(7, 0.35); },
  transmision(){ rafaga(4, 0.2); const t = now() + 0.25; [1760, 1760, 2349].forEach((f, i) => nota(I.sirena, f, 0.05, t + i * 0.09, 0.5)); barrido('sube'); },
  radio()    { const t = now(); [1500, 1900, 1500].forEach((f, i) => nota(I.sirena, f, 0.04, t + i * 0.08, 0.5)); },
  alerta()   { const t = now(); [880, 660, 880, 660].forEach((f, i) => nota(I.sirena, f, 0.14, t + i * 0.2, 0.7)); },
  despegue() { const t = slot('retumbo', now());
               I.lpF.frequency.setValueAtTime(90, t); I.lpF.frequency.exponentialRampToValueAtTime(900, t + 2.4);
               I.retumbo.triggerAttackRelease(2.6, t, 1);
               [55, 82, 110, 165].forEach((f, i) => nota(I.grave, f * (1 + i * 0.5), 1.8, t + 0.15 * i, 0.35)); barrido('sube'); }
};
// ¿Cuánto baja la música ambiente con cada sonido grande? [factor, ms]
const DUCK = { portada: [0.6, 1500], glitch: [0.45, 700], transmision: [0.5, 1300], despegue: [0.3, 3200], logro: [0.6, 1100],
               entrada: [0.7, 900], salida: [0.75, 500], alerta: [0.6, 1000], error: [0.8, 300] };
// Separación mínima (ms) para que nada suene a ametralladora
const GAP = { tecla: 40, hover: 90, clic: 30, seleccion: 30, suave: 30, confirmar: 60, salida: 120, entrada: 400, glitch: 150 };
const UI = new Set(['clic', 'seleccion', 'suave', 'confirmar', 'salida']);
const lastAt = {}, registro = []; let lastUI = 0;

/* ---------- activación (autoplay) y reproducción ---------- */
function activar() {
  if (listo) return Promise.resolve(true);
  if (iniciando) return iniciando;
  try {                                          // dentro del gesto: crea y reanuda el contexto común
    ctx = window.AudioAmbiente ? AudioAmbiente.ctx : (ctx || new (window.AudioContext || window.webkitAudioContext)());
    ctx.resume().catch(() => {});
  } catch (e) { return Promise.resolve(false); }
  iniciando = cargarTone().then(() => {
    if (!T.getContext || T.getContext().rawContext !== ctx) T.setContext(ctx, true);   // true: cierra el contexto propio que Tone crea al cargar
    try { T.getContext().lookAhead = 0; } catch (e) {}   // sin retardo: el sonido sale con la pulsación
    construir(); listo = true; return true;
  }).catch(() => { iniciando = null; return false; });
  return iniciando;
}
const pend = [];
function play(nombre, opc) {
  if (!SND[nombre] || mute) return;
  if (window.AudioAmbiente && AudioAmbiente.estado().silenciado) return;
  const ahora = performance.now();
  if (!listo) { if (ctx && ctx.state === 'running') activar(); pend.push([nombre, ahora]); if (pend.length > 3) pend.shift(); return; }
  if (ctx.state !== 'running') { ctx.resume().catch(() => {}); if (ctx.state !== 'running') return; }
  if (ahora - (lastAt[nombre] || 0) < (GAP[nombre] || 50)) return;
  if (UI.has(nombre)) { if (ahora - lastUI < 110 && !(opc && opc.fuerza)) return; lastUI = ahora; }
  lastAt[nombre] = ahora; registro.push(nombre); if (registro.length > 30) registro.shift();
  try { SND[nombre](); } catch (e) { console.warn('[AudioSfx]', nombre, e); }   // un fallo de sonido nunca rompe el juego
  const d = DUCK[nombre]; if (d && window.AudioAmbiente && AudioAmbiente.golpe) AudioAmbiente.golpe(d[0], d[1]);
}
function vaciar() { const ahora = performance.now(); while (pend.length) { const [n, t] = pend.shift(); if (ahora - t < 600) play(n); } }

const GESTOS = ['pointerdown', 'keydown', 'touchend', 'click'];
function gesto() { activar().then(ok => { if (ok) { vaciar(); } }); }
GESTOS.forEach(e => addEventListener(e, gesto, { capture: true, passive: true }));

/* ---------- qué sonido corresponde a cada interacción ---------- */
const SEL = 'button,a[href],[role="button"],[data-sfx],summary,select,input[type="checkbox"],input[type="radio"],input[type="range"],label[for],.btn,.big,.ghost,.tog,.segb,.opcion,.card,[onclick]';
function interactivo(el) {
  for (let i = 0; el && el !== document.body && i < 6; i++, el = el.parentElement) {
    if (el.matches && (el.matches(SEL) || el.tagName === 'CANVAS')) return el;
    if (el.nodeType === 1 && getComputedStyle(el).cursor === 'pointer') return el;
  }
  return null;
}
const RX_SIG = /(next|siguiente|continuar|continue|comenzar|iniciar|start|lanzar|despegar|aterrizar|entrar|jugar)/;
const RX_OK = /(confirm|aceptar|listo|enviar|guardar|ok\b|elegir|equipar|recibir)/;
const RX_ATRAS = /(saltar|skip|cerrar|close|volver|atr[aá]s|back|cancel|reiniciar|replay|ver de nuevo|pausa|pause)/;
function tipoClic(el) {
  const d = el.closest('[data-sfx]'); if (d) return d.dataset.sfx;
  if (el.tagName === 'CANVAS') return 'clic';
  if (el.matches('input[type="checkbox"],input[type="radio"],select,.segb,.tog,.opcion,.card')) return 'seleccion';
  const txt = ((el.id || '') + ' ' + (el.className && el.className.baseVal === undefined ? el.className : '') + ' ' + (el.textContent || '').slice(0, 40)).toLowerCase();
  if (RX_ATRAS.test(txt)) return 'suave';
  if (RX_SIG.test(txt)) return 'salida';
  if (RX_OK.test(txt)) return 'confirmar';
  return 'clic';
}
const apagado = el => el && el.closest && el.closest('[data-sfx="off"]');

if (!has('data-sin-clic')) {
  addEventListener('click', e => {
    const el = interactivo(e.target); if (!el || apagado(el)) return;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return play('error');
    play(tipoClic(el));
  }, true);
  addEventListener('submit', () => play('confirmar'), true);
}
if (!has('data-sin-hover')) {
  addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const el = interactivo(e.target); if (!el || apagado(el) || el.tagName === 'CANVAS') return;
    if (e.relatedTarget && el.contains(e.relatedTarget)) return;
    if (el.disabled) return;
    play('hover');
  }, true);
}
if (!has('data-sin-teclas')) {
  addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Dead', 'Unidentified'].includes(k)) return;
    if (apagado(e.target)) return;
    const tag = (e.target && e.target.tagName) || '';
    if ((k === 'Enter' || k === ' ') && /^(BUTTON|A|SELECT|SUMMARY)$/.test(tag)) return;   // ya suena el clic
    if (k === 'Escape') return play('suave');
    play('tecla');
  }, true);
}

/* ---------- eventos del juego ---------- */
addEventListener('eq:sfx', e => { if (e && typeof e.detail === 'string') play(e.detail); });
addEventListener('equilibria:login', () => play('confirmar'));
// clases que las pantallas ponen cuando algo sale bien / mal / se revela
const CLASES = { elegida: 'seleccion', completa: 'logro', completado: 'logro', revelada: 'revelar', correcto: 'exito', acierto: 'exito',
                 success: 'exito', incorrecto: 'error', fallo: 'error', wrong: 'error', error: 'error', shake: 'error' };
function observarClases() {
  if (!window.MutationObserver) return;
  new MutationObserver(ms => {
    for (const m of ms) {
      const ant = new Set((m.oldValue || '').split(/\s+/)), el = m.target;
      for (const c of el.classList) if (!ant.has(c) && CLASES[c.toLowerCase()] && !apagado(el)) { play(CLASES[c.toLowerCase()]); return; }
    }
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
}
if (document.body) observarClases(); else addEventListener('DOMContentLoaded', observarClases, { once: true });

// Cambio de pantalla: se marca al salir y la pantalla nueva abre con un barrido de entrada
addEventListener('pagehide', () => { try { sessionStorage.setItem(KEY_ENT, String(Date.now())); } catch (e) {} });
try {
  const t0 = parseInt(sessionStorage.getItem(KEY_ENT) || '0', 10);
  sessionStorage.removeItem(KEY_ENT);
  if (t0 && Date.now() - t0 < 15000) {
    // solo suena si el navegador ya permite audio (si no, se omite: un barrido tardío quedaría raro)
    let entro = false;
    const intento = () => { if (entro) return; try { const probe = window.AudioAmbiente ? AudioAmbiente.ctx : null;
      if (probe && probe.state === 'running') { entro = true; activar().then(ok => { if (ok) play('entrada'); }); } } catch (e) {} };
    setTimeout(intento, 900); setTimeout(intento, 2200);
  }
} catch (e) {}

/* ---------- API pública ---------- */
window.AudioSfx = {
  play, activar,
  get Tone() { return T; },
  /** Volumen general de los efectos (0 a 1). Se recuerda. */
  volumen(v) { vol = Math.min(1, Math.max(0, v)); if (I) I.out.gain.rampTo(vol, 0.05);
               try { localStorage.setItem(KEY_VOL, JSON.stringify({ vol })); } catch (e) {} },
  silenciar(si = true) { mute = !!si; },
  nombres: Object.keys(SND),
  /** Últimos sonidos reproducidos (para comprobar qué dispara cada interacción). */
  registro,
  estado() { return { listo, silenciado: mute, volumen: vol, contexto: ctx ? ctx.state : 'sin crear' }; },
  version: '1.0'
};
})();
