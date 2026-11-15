/* Misión Equilibria · Música y efectos de sonido (la misma pista de la landing)
   Todo el audio se genera en el navegador con la Web Audio API: no hay archivos que cargar.
   La música cambia según el ánimo de LUNIA (0 = frágil, 5 = radiante). */

window.Sonido = (function () {
  "use strict";

  let ctx = null;
  let maestro, musica, efectos, reverb;
  let activo = false;
  let animo = 0;
  let programador = null;
  let proximoAcorde = 0;
  let proximaNota = 0;
  let indiceAcorde = 0;
  let ultimaVoz = 0;

  const nota = (n) => 440 * Math.pow(2, (n - 69) / 12); // número MIDI → frecuencia

  // Progresiones: frágil (menor, lenta), esperanzada y radiante (mayor, con más notas)
  const PROGRESIONES = {
    fragil: [[57, 60, 64], [53, 57, 60, 64], [50, 53, 57], [52, 55, 59]],      // Am · Fmaj7 · Dm · Em
    esperanza: [[57, 60, 64], [53, 57, 60], [48, 52, 55, 60], [55, 59, 62]],   // Am · F · C · G
    radiante: [[48, 52, 55, 60], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]] // C · G · Am · F
  };
  const PENTATONICA = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];

  function progresionActual() {
    if (animo <= 1) return PROGRESIONES.fragil;
    if (animo <= 3) return PROGRESIONES.esperanza;
    return PROGRESIONES.radiante;
  }

  function crearReverb() {
    const duracion = 2.8;
    const largo = ctx.sampleRate * duracion;
    const impulso = ctx.createBuffer(2, largo, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const datos = impulso.getChannelData(c);
      for (let i = 0; i < largo; i++) datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.6);
    }
    const conv = ctx.createConvolver();
    conv.buffer = impulso;
    return conv;
  }

  function iniciarContexto() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    maestro = ctx.createGain();
    maestro.gain.value = 0.9;
    maestro.connect(ctx.destination);

    reverb = crearReverb();
    const retorno = ctx.createGain();
    retorno.gain.value = 0.45;
    reverb.connect(retorno).connect(maestro);

    musica = ctx.createGain();
    musica.gain.value = 0;
    musica.connect(maestro);
    musica.connect(reverb);

    efectos = ctx.createGain();
    efectos.gain.value = 0.55;
    efectos.connect(maestro);
    efectos.connect(reverb);
  }

  /* ---------- Música ---------- */
  function tocarAcorde(t) {
    const acorde = progresionActual()[indiceAcorde % 4];
    indiceAcorde++;
    const dur = animo <= 1 ? 9 : 7;
    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 500 + animo * 260;
    filtro.connect(musica);

    acorde.forEach((n) => {
      [-6, 6].forEach((desafine) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = animo >= 4 ? "triangle" : "sine";
        osc.frequency.value = nota(n);
        osc.detune.value = desafine;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05, t + 2.2);
        g.gain.setValueAtTime(0.05, t + dur - 3);
        g.gain.linearRampToValueAtTime(0, t + dur + 1);
        osc.connect(g).connect(filtro);
        osc.start(t);
        osc.stop(t + dur + 1.2);
      });
    });
    return dur - 1; // los acordes se solapan un poco
  }

  function tocarDestello(t) {
    const base = animo >= 4 ? 12 : 0;
    const n = PENTATONICA[Math.floor(Math.random() * PENTATONICA.length)] + base;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = nota(n);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.035 + animo * 0.006, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.connect(g).connect(musica);
    osc.start(t);
    osc.stop(t + 1.7);
  }

  function programar() {
    if (!ctx || !activo) return;
    const ahora = ctx.currentTime;
    while (proximoAcorde < ahora + 0.5) {
      proximoAcorde += tocarAcorde(Math.max(proximoAcorde, ahora));
    }
    const ritmo = animo <= 1 ? 1.4 : animo <= 3 ? 0.9 : 0.5;
    const probabilidad = 0.15 + animo * 0.12;
    while (proximaNota < ahora + 0.5) {
      if (Math.random() < probabilidad) tocarDestello(Math.max(proximaNota, ahora));
      proximaNota += ritmo;
    }
  }

  /* ---------- Efectos ---------- */
  function tono(frec, inicio, dur, tipo, volumen, destino) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = tipo || "sine";
    osc.frequency.setValueAtTime(frec, inicio);
    g.gain.setValueAtTime(0, inicio);
    g.gain.linearRampToValueAtTime(volumen || 0.2, inicio + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
    osc.connect(g).connect(destino || efectos);
    osc.start(inicio);
    osc.stop(inicio + dur + 0.05);
    return osc;
  }

  function ruido(inicio, dur, frecDesde, frecHasta, volumen) {
    const largo = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, largo, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filtro = ctx.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.Q.value = 0.8;
    filtro.frequency.setValueAtTime(frecDesde, inicio);
    filtro.frequency.exponentialRampToValueAtTime(frecHasta, inicio + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, inicio);
    g.gain.linearRampToValueAtTime(volumen, inicio + dur * 0.3);
    g.gain.linearRampToValueAtTime(0, inicio + dur);
    src.connect(filtro).connect(g).connect(efectos);
    src.start(inicio);
    src.stop(inicio + dur);
  }

  const EFECTOS = {
    siguiente(t) { tono(nota(76), t, 0.35, "sine", 0.18); tono(nota(83), t + 0.08, 0.5, "sine", 0.16); },
    anterior(t) { tono(nota(83), t, 0.35, "sine", 0.16); tono(nota(76), t + 0.08, 0.5, "sine", 0.14); },
    mision(t) { tono(nota(81), t, 0.12, "square", 0.05); tono(nota(88), t + 0.07, 0.25, "square", 0.04); },
    bloqueado(t) { tono(nota(52), t, 0.25, "triangle", 0.15); tono(nota(49), t + 0.12, 0.35, "triangle", 0.12); },
    pestana(t) { tono(nota(84), t, 0.15, "triangle", 0.12); },
    balanza(t) { ruido(t, 0.7, 400, 1800, 0.12); tono(nota(64), t + 0.3, 0.6, "sine", 0.08); },
    arco(t, n) {
      const escala = [57, 60, 64, 67, 72, 76];
      tono(nota(escala[n] + 12), t, 0.6, "sine", 0.15);
      if (n >= 4) tono(nota(escala[n] + 19), t + 0.05, 0.8, "sine", 0.08);
    },
    activar(t) { [72, 76, 79, 84].forEach((n, i) => tono(nota(n), t + i * 0.09, 0.6, "sine", 0.12)); },
    entrar(t) {
      ruido(t, 2.6, 80, 900, 0.35);
      const osc = tono(nota(45), t, 2.6, "sawtooth", 0.05);
      osc.frequency.exponentialRampToValueAtTime(nota(69), t + 2.4);
      [72, 76, 79, 84, 88].forEach((n, i) => tono(nota(n), t + 1.6 + i * 0.1, 0.9, "sine", 0.1));
    }
  };

  let musicaSonando = false;
  function arrancarMusica(conSonidoDeActivar) {
    if (!ctx || !activo) return;
    const t = ctx.currentTime;
    if (conSonidoDeActivar) EFECTOS.activar(t);
    if (musicaSonando) return;
    musicaSonando = true;
    musica.gain.cancelScheduledValues(t);
    musica.gain.setValueAtTime(musica.gain.value, t);
    musica.gain.linearRampToValueAtTime(0.9, t + 2);
    proximoAcorde = t + 0.1;
    proximaNota = t + 1.5;
    programar();
    clearInterval(programador);
    programador = setInterval(programar, 200);
  }

  /* ---------- API pública ---------- */
  return {
    get activo() { return activo; },

    // Deja la música encendida desde el inicio; suena en cuanto el navegador lo permita
    encenderPorDefecto() {
      iniciarContexto();
      if (!ctx) return;
      activo = true;
      musica.gain.value = 0;
      ctx.resume().then(() => { if (activo) arrancarMusica(false); }).catch(() => {});
      if (ctx.state === "running") arrancarMusica(false);
    },

    // Se llama en el primer clic o tecla del usuario
    desbloquear() {
      if (!ctx || !activo) return;
      ctx.resume().then(() => arrancarMusica(false)).catch(() => {});
    },

    alternar() {
      iniciarContexto();
      if (!ctx) return false;
      activo = !activo;
      if (activo) {
        ctx.resume();
        arrancarMusica(true);
      } else {
        const t = ctx.currentTime;
        musica.gain.cancelScheduledValues(t);
        musica.gain.setValueAtTime(musica.gain.value, t);
        musica.gain.linearRampToValueAtTime(0, t + 0.6);
        clearInterval(programador);
        musicaSonando = false;
        setTimeout(() => { if (!activo) ctx.suspend(); }, 800);
      }
      return activo;
    },

    animo(n) { animo = Math.max(0, Math.min(5, n)); },

    // Volumen general (para que la música quede de fondo y baje cuando LUNIA habla)
    volumen(v) {
      if (!ctx) return;
      const t = ctx.currentTime;
      maestro.gain.cancelScheduledValues(t);
      maestro.gain.setTargetAtTime(v, t, 0.3);
    },

    efecto(nombre, valor) {
      if (!activo || !ctx || !EFECTOS[nombre]) return;
      EFECTOS[nombre](ctx.currentTime + 0.01, valor);
    },

    // Pequeños pitidos mientras LUNIA "habla": graves y temblorosos al inicio, agudos y alegres al final
    voz() {
      if (!activo || !ctx) return;
      const ahora = performance.now();
      if (ahora - ultimaVoz < 70) return;
      ultimaVoz = ahora;
      const t = ctx.currentTime + 0.005;
      const base = 380 + animo * 70;
      const osc = tono(base + Math.random() * 160, t, 0.07, "sine", 0.045);
      if (animo <= 1) {
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.frequency.value = 18;
        lfoG.gain.value = 25;
        lfo.connect(lfoG).connect(osc.frequency);
        lfo.start(t);
        lfo.stop(t + 0.08);
      }
    }
  };
})();
