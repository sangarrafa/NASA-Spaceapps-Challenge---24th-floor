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
      const u = new SpeechSynthesisUtterance(frase);
      u.lang = (vozNavegador && vozNavegador.lang) || (EN ? 'en-US' : 'es-MX');
      if (vozNavegador) u.voice = vozNavegador;
      const natural = vozNavegador && /Natural|Online|Neural/i.test(vozNavegador.name);
      u.rate = natural ? 0.95 : AJUSTE.rate;
      u.pitch = natural ? 1.06 : AJUSTE.pitch;
      u.onend = u.onerror = () => listo();
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
    callar();
    if (!activa || !texto) return;
    const t = turno;
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
