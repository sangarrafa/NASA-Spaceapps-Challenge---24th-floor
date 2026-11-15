/* ---------------------------------------------------------------------------
   audio-ambiente.js · Música de fondo continua de Equilibria

   Un solo archivo para todas las pantallas. Incluirlo con:
     <script src="../audio/audio-ambiente.js"></script>      (ajusta los ../ a la profundidad)
   Atributos opcionales en esa etiqueta <script>:
     data-volumen="0.5"   volumen de la música en ESA pantalla (0 a 1; por defecto 0.5)
     data-reiniciar       empieza desde el segundo 0 (úsalo solo en la primera pantalla)
     data-sin-aviso       no muestra el aviso "toca para activar el sonido"

   - Loop sin corte: dos <audio> que se solapan con un fundido cruzado de 4 s al final de cada vuelta.
   - Continuidad entre pantallas: guarda la posición en sessionStorage y la retoma en la página
     siguiente (calculando el tiempo transcurrido), con un fundido de entrada corto.
   - Autoplay: intenta sonar al cargar; si el navegador lo bloquea, arranca con el primer
     clic / toque / tecla.
   - Tone.js: la música NO pasa por Tone. Se expone un AudioContext común (AudioAmbiente.ctx)
     y un bus de efectos (AudioAmbiente.busSfx) para que Tone use el mismo contexto.
     Ver audio/README.md.
   --------------------------------------------------------------------------- */
(() => {
'use strict';
if (window.AudioAmbiente) return;

const SCRIPT = document.currentScript;
const SRC = new URL('../cinematic/resources/ambiente.wav', SCRIPT ? SCRIPT.src : location.href).href;
const XFADE = 4;                       // segundos de solape entre vueltas
const KEY_POS = 'equilibria:ambiente'; // sessionStorage: {t, wall, on, mute}
const KEY_VOL = 'equilibria:audio';    // localStorage: {vol}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const attr = n => SCRIPT && SCRIPT.hasAttribute(n);

/* ---------- estado ---------- */
let pageVol = clamp(parseFloat(SCRIPT && SCRIPT.dataset.volumen) || 0.5);   // volumen propio de la pantalla
let busVol = 1;                          // volumen del bus de música (lo cambia volumen())
let duck = 1, duckTarget = 1, duckStep = 0;
let master = 0, masterTarget = 1, masterStep = 0;   // fundidos de entrada/salida
let muted = false, wanted = true, blocked = false;
try { const v = JSON.parse(localStorage.getItem(KEY_VOL) || 'null'); if (v && typeof v.vol === 'number') busVol = clamp(v.vol); } catch (e) {}

const mk = () => { const a = new Audio(); a.src = SRC; a.preload = 'auto'; a.loop = false; a.volume = 0; return a; };
let cur = mk(), nxt = mk();
let fading = false;                       // ¿hay solape en curso?
let started = false;                      // ¿ya sonó alguna vez en esta página?
let startAt = 0;                          // posición a la que debe arrancar

/* ---------- posición guardada (continuidad entre pantallas) ---------- */
try {
  const s = JSON.parse(sessionStorage.getItem(KEY_POS) || 'null');
  if (s && !attr('data-reiniciar')) {
    if (s.on) startAt = Math.max(0, s.t + (Date.now() - s.wall) / 1000);
    muted = !!s.mute;
    if (s.on === false) wanted = false;
  }
} catch (e) {}
function guardar() {
  try { sessionStorage.setItem(KEY_POS, JSON.stringify({ t: cur.currentTime || 0, wall: Date.now(), on: wanted, mute: muted })); } catch (e) {}
}

/* ---------- volumen efectivo ---------- */
const nivel = () => (muted ? 0 : busVol * pageVol * duck * master);
function rampa(actual, objetivo, paso) { // paso = cambio por tick (50 ms)
  if (actual === objetivo) return actual;
  return actual < objetivo ? Math.min(objetivo, actual + paso) : Math.max(objetivo, actual - paso);
}

/* ---------- motor: bucle con fundido cruzado ---------- */
function tick() {
  master = rampa(master, masterTarget, masterStep || 1);
  duck = rampa(duck, duckTarget, duckStep || 1);
  if (fading && cur.paused) {            // la pista saliente llegó a su fin (el navegador la pausa sola): se intercambian
    try { cur.currentTime = 0; } catch (e) {}
    cur.volume = 0; [cur, nxt] = [nxt, cur]; fading = false;
  }
  const dur = cur.duration;
  const L = nivel();
  if (!cur.paused && isFinite(dur) && dur > XFADE * 2) {
    const restante = dur - cur.currentTime;
    if (!fading && restante <= XFADE) {                  // empieza el solape
      fading = true;
      try { nxt.currentTime = Math.max(0, XFADE - restante); } catch (e) {}
      nxt.volume = 0;
      nxt.play().catch(() => {});
    }
    if (fading) {
      const p = clamp(nxt.currentTime / XFADE);          // progreso del solape según la pista entrante
      cur.volume = clamp(L * Math.cos(p * Math.PI / 2));
      nxt.volume = clamp(L * Math.sin(p * Math.PI / 2));
      if (p >= 1 || cur.ended) {                         // el solape terminó: se intercambian
        cur.pause(); try { cur.currentTime = 0; } catch (e) {}
        [cur, nxt] = [nxt, cur]; fading = false;
      }
    } else {
      cur.volume = clamp(L);
    }
  } else if (!cur.paused) {
    cur.volume = clamp(L);
  }
}
setInterval(tick, 50);
setInterval(() => { if (!cur.paused) guardar(); }, 1000);
addEventListener('pagehide', guardar);
addEventListener('beforeunload', guardar);

/* ---------- arranque y autoplay ---------- */
let aviso = null;
function mostrarAviso(on) {
  if (attr('data-sin-aviso')) return;
  if (!aviso) {
    aviso = document.createElement('div');
    aviso.textContent = '🔊 Toca la pantalla o pulsa una tecla para activar la música';
    aviso.setAttribute('aria-live', 'polite');
    aviso.style.cssText = 'position:fixed;left:16px;bottom:12px;z-index:2147483000;font:700 12px "Space Mono",monospace;letter-spacing:.06em;color:#6FE3E8;opacity:0;pointer-events:none;transition:opacity .4s;text-shadow:0 0 6px #05061a';
    (document.body || document.documentElement).appendChild(aviso);
  }
  requestAnimationFrame(() => { aviso.style.opacity = on ? '.75' : '0'; });
}
function emitir(nombre) { try { window.dispatchEvent(new CustomEvent(nombre)); } catch (e) {} }

function posicionar() {
  const set = () => {
    const d = cur.duration;
    let t = startAt;
    if (isFinite(d) && d > 0) t = t % (d - XFADE > 1 ? d - XFADE : d);   // la vuelta efectiva dura dur - XFADE
    try { cur.currentTime = t; } catch (e) {}
  };
  if (cur.readyState >= 1) set(); else cur.addEventListener('loadedmetadata', set, { once: true });
}
let posicionado = false;

function intentar() {
  if (!wanted) return Promise.resolve(false);
  if (!posicionado) { posicionado = true; posicionar(); }
  masterTarget = 1; masterStep = started ? 0.04 : 0.025;       // entrada de ~1,2 s (0,8 s al reanudar)
  return cur.play().then(() => {
    started = true; blocked = false; mostrarAviso(false);
    desbloquearSegunda();
    emitir('ambiente:sonando'); return true;
  }, () => {
    blocked = true; mostrarAviso(true); emitir('ambiente:bloqueado'); return false;
  });
}
// La segunda pista también necesita permiso de autoplay: se "calienta" una vez en silencio.
let calentada = false;
function desbloquearSegunda() {
  if (calentada) return; calentada = true;
  nxt.volume = 0;
  nxt.play().then(() => { nxt.pause(); try { nxt.currentTime = 0; } catch (e) {} }).catch(() => { calentada = false; });
}

function gesto() {
  if (api._ctx && api._ctx.state === 'suspended') api._ctx.resume().catch(() => {});
  if (wanted && cur.paused) intentar().then(ok => { if (ok) quitarGestos(); });
  else if (!cur.paused) quitarGestos();
}
const EVENTOS = ['pointerdown', 'touchstart', 'click', 'keydown'];
function ponerGestos() { EVENTOS.forEach(e => addEventListener(e, gesto, true)); }
function quitarGestos() { EVENTOS.forEach(e => removeEventListener(e, gesto, true)); }

/* ---------- AudioContext común para Tone.js ---------- */
const api = {
  _ctx: null, _bus: null,
  /** AudioContext único del juego (se crea al pedirlo). Pásaselo a Tone con Tone.setContext(AudioAmbiente.ctx). */
  get ctx() {
    if (!this._ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      this._ctx = new C({ latencyHint: 'interactive' });
      this._bus = this._ctx.createGain(); this._bus.gain.value = 1; this._bus.connect(this._ctx.destination);
    }
    return this._ctx;
  },
  /** GainNode para efectos/Tone: synth.connect(AudioAmbiente.busSfx). Es independiente del volumen de la música. */
  get busSfx() { void this.ctx; return this._bus; },
  /** Atajo: configura Tone con el contexto común y devuelve el bus de efectos. */
  conectarTone(Tone) { Tone.setContext(this.ctx); return this.busSfx; },

  /** Empieza (o retoma) la música. Devuelve una promesa con true si ya suena. */
  iniciar() { wanted = true; guardar(); return intentar().then(ok => { if (!ok) ponerGestos(); return ok; }); },
  /** Pausa con fundido de salida (ms). */
  pausar(ms = 600) {
    wanted = false; masterTarget = 0; masterStep = ms > 0 ? 50 / ms : 1;
    setTimeout(() => { if (!wanted) { cur.pause(); nxt.pause(); fading = false; guardar(); } }, ms + 80);
  },
  reanudar() { return this.iniciar(); },
  /** Volumen del bus de música (0 a 1), se recuerda entre pantallas. ms = duración del cambio. */
  volumen(v, ms = 0) {
    v = clamp(v); const from = busVol, t0 = performance.now();
    const paso = () => { const k = ms > 0 ? clamp((performance.now() - t0) / ms) : 1; busVol = from + (v - from) * k; if (k < 1) requestAnimationFrame(paso); };
    paso();
    try { localStorage.setItem(KEY_VOL, JSON.stringify({ vol: v })); } catch (e) {}
  },
  /** Silencia o activa la música (se recuerda en la pestaña). */
  silenciar(si = true) { muted = !!si; guardar(); },
  alternarSilencio() { this.silenciar(!muted); return muted; },
  /** Baja la música temporalmente (factor 0 a 1) sin tocar su volumen guardado; atenuar(1) la restaura. */
  atenuar(factor = 0.35, ms = 800) { duckTarget = clamp(factor); duckStep = ms > 0 ? Math.abs(duckTarget - duck) * 50 / ms || 1 : 1; },
  estado() {
    return { sonando: !cur.paused && !muted, silenciado: muted, bloqueado: blocked, volumen: busVol, volumenPantalla: pageVol,
             posicion: +(cur.currentTime || 0).toFixed(2), duracion: cur.duration || 0, solape: fading };
  },
  version: '1.0'
};
window.AudioAmbiente = api;

if (wanted) intentar().then(ok => { if (!ok) ponerGestos(); });   // si estaba pausada por código, solo api.iniciar() la reactiva
})();
