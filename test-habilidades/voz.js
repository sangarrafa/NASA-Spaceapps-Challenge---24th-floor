/* Voz de la Comandante Ríos
   1. Si existe un audio pregrabado con una voz neural gratuita de Microsoft Edge
      (generado con herramientas/generar-voces.py), se usa ese.
   2. Si no, se usa la voz del navegador. En Microsoft Edge aparecen las mismas
      voces neurales "Online (Natural)" sin instalar nada.
   El texto se dice frase por frase, con una pausa entre frases, para que cada
   oración cierre con su entonación (baja en afirmaciones, sube en preguntas). */
(function () {
  const PAUSAS = { '.': 420, '!': 380, '?': 520, '…': 650, ':': 320 };
  const EN = window.EqLang && window.EqLang.get() === 'en';
  const PREFERIDAS = EN ? ['Aria', 'Jenny', 'Ana', 'Michelle', 'Samantha', 'Zira'] : ['Salome', 'Dalia', 'Ximena', 'Elena', 'Paloma', 'Larissa', 'Elvira', 'Paulina', 'Sabina', 'Helena', 'Laura'];
  const AJUSTE = { rate: 0.9, pitch: 1.12 }; // un poco más lenta y más aguda: más dulce

  let activa = true;
  let turno = 0;
  let audioActual = null;
  let vozNavegador = null;

  /* Mismo hash en el generador (Python): djb2 sobre unidades UTF-16, texto NFC. */
  function clave(texto) {
    const s = texto.normalize('NFC').trim();
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(16).padStart(8, '0');
  }

  /* Divide en frases y deja cada una con su signo final. "..." cuenta como "…". */
  function frases(texto) {
    return texto.replace(/\.\.\./g, '…')
      .split(/(?<=[.!?…:])\s+/)
      .map((f) => f.trim())
      .filter(Boolean);
  }

  function pausaTras(frase) {
    const ultimo = frase.replace(/[”"»)\s]+$/, '').slice(-1);
    return PAUSAS[ultimo] || 300;
  }

  function elegirVozNavegador() {
    if (!('speechSynthesis' in window)) return;
    const es = speechSynthesis.getVoices().filter((v) => (EN ? /^en/i : /^es/i).test(v.lang));
    const puntaje = (v) => {
      const i = PREFERIDAS.findIndex((n) => v.name.includes(n));
      return (i < 0 ? 50 : i) - (/Natural|Online|Neural/i.test(v.name) ? 100 : 0);
    };
    vozNavegador = es.sort((a, b) => puntaje(a) - puntaje(b))[0] || null;
  }
  if ('speechSynthesis' in window) {
    elegirVozNavegador();
    speechSynthesis.onvoiceschanged = elegirVozNavegador;
  }

  function hayGrabacion(frase) {
    return window.EQ_AUDIO && window.EQ_AUDIO[clave(frase)];
  }

  function reproducir(frase, t) {
    return new Promise((listo) => {
      if (t !== turno) return listo();
      if (!EN && hayGrabacion(frase)) {   // las grabaciones solo existen en español
        const a = new Audio(`audio/${clave(frase)}.mp3`);
        audioActual = a;
        a.onended = a.onerror = () => listo();
        a.play().catch(() => listo());
        return;
      }
      if (!('speechSynthesis' in window)) return listo();
      // Si el navegador nunca avisa que terminó (pasa en Chrome y Edge), se sigue igual después de un
      // tiempo razonable según el largo de la frase. El tiempo se reinicia cuando de verdad empieza a sonar.
      let respaldo = null, terminado = false;
      const fin = () => { if (terminado) return; terminado = true; clearTimeout(respaldo); if (window.__eqFrase === u) window.__eqFrase = null; listo(); };
      const armar = (ms) => { clearTimeout(respaldo); respaldo = setTimeout(fin, ms); };
      const duracion = frase.length * 95 + 1500;
      const u = new SpeechSynthesisUtterance(frase);
      window.__eqFrase = u;   // se guarda mientras suena para que Chrome no la descarte y pierda el aviso de fin
      u.lang = (vozNavegador && vozNavegador.lang) || (EN ? 'en-US' : 'es-MX');
      if (vozNavegador) u.voice = vozNavegador;
      const natural = vozNavegador && /Natural|Online|Neural/i.test(vozNavegador.name);
      u.rate = natural ? 0.95 : AJUSTE.rate;
      u.pitch = natural ? 1.06 : AJUSTE.pitch;
      u.onstart = () => armar(duracion);
      u.onend = u.onerror = fin;
      armar(duracion + 3000);   // margen extra por si la voz tarda en arrancar
      speechSynthesis.speak(u);
    });
  }

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  function callar() {
    turno += 1;
    if (audioActual) { audioActual.pause(); audioActual = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  async function decir(texto) {
    // Chrome y Edge ignoran en silencio lo que se pide decir justo después de cortar una voz que
    // estaba sonando (por ejemplo, la reacción de Ríos cuando aparece la pregunta siguiente).
    // Por eso, si había algo sonando, se espera un momento antes de volver a hablar.
    const ocupado = 'speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending);
    callar();
    if (!activa || !texto) return;
    const t = turno;
    if (ocupado) {
      await esperar(250);
      if (t !== turno) return;
      try { speechSynthesis.resume(); } catch (e) { /* nada */ }
    }
    const lista = frases(texto);
    for (let i = 0; i < lista.length; i++) {
      await reproducir(lista[i], t);
      if (t !== turno) return;
      if (i < lista.length - 1) await esperar(pausaTras(lista[i]));
    }
  }

  window.EqVoz = {
    decir, callar, frases, clave,
    get activa() { return activa; },
    set activa(v) { activa = !!v; if (!activa) callar(); },
    disponible: ('speechSynthesis' in window) || true
  };
})();
