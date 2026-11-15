/* ==========================================================
   Misión Equilibria · Misión 1: Soporte vital ("Ciclo cerrado") · versión 2
   ----------------------------------------------------------
   Mecánica: equilibrio en tiempo real. Los tanques (oxígeno, agua y CO₂)
   cambian solos. El jugador enciende y apaga máquinas, pero la energía
   no alcanza para todas. Las muestras de roca solo se pueden recoger
   cuando todos los tanques están bien.

   Integración con el resto del juego:
   - Nivel inicial: URL (?nivel=1|2|3) o localStorage "equilibria.perfil"
     → {"nivelInicial": 1|2|3}, escrito por el test de perfil. Por defecto, 1.
   - Resultado: localStorage "equilibria.mision.soporteVital".
   - "Volver al mapa" apunta a ../index.html (cambiar en el HTML).

   Rigor: los datos reales están en FICHAS, cada uno con su fuente.
   Velocidades, energía, escala de tiempo y eventos son simplificaciones
   de juego y así se rotulan para el jugador.
   ========================================================== */
(() => {
  "use strict";
  const EN = !!(window.EqLang && window.EqLang.get() === "en");
  const L = (es, en) => (EN ? en : es);

  // ---------------------------------------------------------
  // 1. CONFIGURACIÓN
  // ---------------------------------------------------------
  const DURACION_DIA = 60;   // segundos de juego por día (simplificación)
  const DIAS = 3;

  const NIVELES = {
    1: { nombre: L("Explorador", "Explorer"), tanques: ["o2", "agua"], maquinas: ["gen", "rec"], energiaMax: 1, velocidad: 0.8, pistas: true, voz: true },
    2: { nombre: L("Ingeniero", "Engineer"), tanques: ["o2", "agua", "co2"], maquinas: ["gen", "rec", "limp"], energiaMax: 2, velocidad: 1.0, pistas: true, voz: false },
    3: { nombre: L("Comandante", "Commander"), tanques: ["o2", "agua", "co2"], maquinas: ["gen", "rec", "limp"], energiaMax: 2, velocidad: 1.2, pistas: false, voz: false }
  };

  // Consumo de la tripulación (unidades de tanque por segundo).
  const CONSUMO = {
    dosTanques: { o2: 0.9, agua: 0.5, co2: 0 },
    tresTanques: { o2: 1.2, agua: 0.6, co2: 1.0 },
    practica: { o2: 0.6, agua: 0, co2: 0 }
  };

  const TANQUES = {
    o2:   { nombre: L("oxígeno", "oxygen"), malo: "bajo" },
    agua: { nombre: L("agua", "water"), malo: "bajo" },
    co2:  { nombre: "CO₂", malo: "alto" }
  };

  // Efecto de cada máquina a máxima potencia y segundos que tarda en arrancar.
  const MAQUINAS = {
    gen:  { nombre: "generador de oxígeno", arranque: 3, efecto: { o2: +2.3, agua: -0.6 }, tanque: "o2", tubos: ["tubo-agua-gen", "tubo-gen-o2"] },
    rec:  { nombre: "reciclador de agua", arranque: 2, efecto: { agua: +1.8 }, tanque: "agua", tubos: ["tubo-rec-agua"] },
    limp: { nombre: "limpiador de aire", arranque: 2, efecto: { co2: -2.3, agua: +0.2 }, tanque: "co2", tubos: ["tubo-co2-limp"] }
  };

  const EVENTOS = {
    filtro: {
      aviso: L("⚠️ El filtro de aire se llenó. Por un rato, el limpiador funciona a medias.", "⚠️ The air filter is full. For a while, the air cleaner only works halfway."),
      lunia: L("Vigila el CO₂. Mientras cambian el filtro, sube más rápido.", "Watch the CO₂. While they change the filter, it rises faster."),
      duracion: 15, requiere: "limp", factor: { limp: 0.4 }
    },
    mantenimiento: {
      aviso: L("🔧 El reciclador está en reparación. Por un rato, recupera menos agua.", "🔧 The recycler is being repaired. For a while, it recovers less water."),
      lunia: L("El agua va a bajar más rápido. Usa el generador solo cuando haga falta.", "The water will drop faster. Only use the generator when you need it."),
      duracion: 15, requiere: "rec", factor: { rec: 0.4 }
    },
    pocaLuz: {
      aviso: L("🌑 Llega poca luz a los paneles solares. Las máquinas van más lento.", "🌑 Little light is reaching the solar panels. The machines run slower."),
      lunia: L("Sin luz hay menos electricidad. Las máquinas tardan más en llenar los tanques.", "Without light there’s less electricity. The machines take longer to fill the tanks."),
      duracion: 12, factor: { gen: 0.6, rec: 0.6, limp: 0.6 }
    },
    fuga: {
      aviso: L("💨 Hubo una pequeña fuga de aire. Ya está arreglada, pero se perdió oxígeno.", "💨 There was a small air leak. It’s fixed now, but some oxygen was lost."),
      lunia: L("Se perdió oxígeno. Hay que fabricar más.", "Oxygen was lost. We need to make more."),
      duracion: 0, instantaneo: { o2: -12 }
    }
  };

  // Datos reales con fuente (verificados en los documentos originales).
  const FICHAS = [
    { tipo: "real", icono: "⚗️", titulo: L("El oxígeno se hace con agua", "Oxygen is made from water"),
      texto: L("Una máquina usa electricidad para separar el agua. Así sale el oxígeno. Por eso el generador gasta agua.", "A machine uses electricity to split water. That’s how oxygen comes out. That’s why the generator uses up water."),
      fuente: "NASA Marshall Space Flight Center. Environmental Control and Life Support System (ECLSS).",
      url: "https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf" },
    { tipo: "real", icono: "🫧", titulo: L("Oxígeno para un día", "Oxygen for one day"),
      texto: L("Cada astronauta respira unos 0,84 kg de oxígeno al día.", "Each astronaut breathes about 0.84 kg of oxygen a day."),
      fuente: "Jones, H. W. y Kliss, M. H. Developing an Advanced Life Support System for the Flexible Path into Deep Space. NASA Ames / AIAA (c. 2010). Valor confirmado en NASA ICES 2025 (0,85 kg).",
      url: "https://ntrs.nasa.gov/api/citations/20100036823/downloads/20100036823.pdf" },
    { tipo: "real", icono: "♻️", titulo: L("Casi toda el agua se recicla", "Almost all the water is recycled"),
      texto: L("Se recuperan 98 de cada 100 partes de agua. También la del sudor y la orina.", "98 out of every 100 parts of water are recovered. Even from sweat and urine."),
      fuente: "NASA (2023). NASA Achieves Water Recovery Milestone on International Space Station.",
      url: "https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station" },
    { tipo: "real", icono: "💧", titulo: L("Agua para un día", "Water for one day"),
      texto: L("Cada astronauta usa unos 3 litros de agua al día. Unos 2 litros son para beber.", "Each astronaut uses about 3 liters of water a day. About 2 liters are for drinking."),
      fuente: "NASA Marshall Space Flight Center, ECLSS; y Jones y Kliss (NASA Ames).",
      url: "https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf" },
    { tipo: "real", icono: "🏃", titulo: L("El esfuerzo gasta oxígeno", "Effort uses oxygen"),
      texto: L("Con ejercicio se respira unas 11 veces más oxígeno que durmiendo.", "During exercise you breathe about 11 times more oxygen than when sleeping."),
      fuente: "NASA (2017). TFAWS Life Support Short Course, sección de J. Perry (NASA Marshall): 0,24 frente a 0,022 kg por hora.",
      url: "https://ntrs.nasa.gov/api/citations/20180002051/downloads/20180002051.pdf" },
    { tipo: "real", icono: "🌀", titulo: L("Del CO₂ sale un poco de agua", "A little water comes from CO₂"),
      texto: L("Una máquina quita el CO₂ del aire y lo mezcla con hidrógeno. De esa mezcla sale agua.", "A machine removes CO₂ from the air and mixes it with hydrogen. Water comes out of that mix."),
      fuente: "NASA Marshall Space Flight Center. ECLSS (reactor Sabatier).",
      url: "https://www.nasa.gov/wp-content/uploads/2025/08/g-657270-59-hp-environmental-control-and-life-support-system-eclss.pdf" },
    { tipo: "real", icono: "🌫️", titulo: L("Demasiado CO₂ hace daño", "Too much CO₂ is harmful"),
      texto: L("En la Estación Espacial, cuando sube el CO₂, los astronautas reportan dolor de cabeza y cansancio.", "On the Space Station, when CO₂ rises, astronauts report headaches and tiredness."),
      fuente: "Law, J. y Alexander, D. (2016). CO2 on the International Space Station: An Operations Update. NASA Johnson Space Center; y Law, J. et al. (2014), J Occup Environ Med, 56(5), 477-483.",
      url: "https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20150019624.pdf" },
    { tipo: "simple", icono: "🎮", titulo: L("Lo que ajustamos para jugar", "What we adjusted for the game"),
      texto: L("Un día dura 60 segundos. La energía alcanza para 1 o 2 máquinas. La velocidad de los tanques, los eventos, la reserva de emergencia y el esfuerzo (2,5 veces más oxígeno) están ajustados para poder jugar.", "A day lasts 60 seconds. There’s enough energy for 1 or 2 machines. Tank speed, events, the emergency reserve and effort (2.5 times more oxygen) are adjusted so the game is playable."),
      fuente: L("Decisiones de diseño del equipo Misión Equilibria.", "Design decisions by the Equilibria Mission team."), url: "" }
  ];

  const REFLEXION = [
    { texto: L("Porque el oxígeno se fabrica separando el agua con electricidad.", "Because oxygen is made by splitting water with electricity."), correcta: true,
      respuesta: L("¡Correcto! La electricidad separa el agua en hidrógeno y oxígeno. Fabricar aire gasta agua y energía.", "Correct! Electricity splits water into hydrogen and oxygen. Making air uses water and energy.") },
    { texto: L("Porque los astronautas toman más agua cuando respiran.", "Because astronauts drink more water when they breathe."), correcta: false,
      respuesta: L("No es eso. Respirar no gasta el agua del tanque. Mira el tubo que va del agua al generador.", "That’s not it. Breathing doesn’t use the tank’s water. Look at the pipe that goes from the water to the generator.") },
    { texto: L("Porque la máquina se calienta y el agua se evapora.", "Because the machine heats up and the water evaporates."), correcta: false,
      respuesta: L("No es eso. El agua no se pierde por calor. La máquina la separa en hidrógeno y oxígeno.", "That’s not it. The water isn’t lost to heat. The machine splits it into hydrogen and oxygen.") }
  ];

  // ---------------------------------------------------------
  // 2. ALMACENAMIENTO, SONIDO Y VOZ
  // ---------------------------------------------------------
  const almacen = {
    leer(c) { try { return JSON.parse(localStorage.getItem(c)); } catch (e) { return null; } },
    guardar(c, v) { try { localStorage.setItem(c, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  const prefs = Object.assign({ sonido: true, voz: null }, almacen.leer("equilibria.preferencias") || {});

  const Sonido = {
    ctx: null,
    iniciar() {
      if (this.ctx) return;
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
    },
    tono(freq, dur = 0.12, tipo = "sine", vol = 0.08, retraso = 0) {
      if (!prefs.sonido || !this.ctx) return;
      try {
        const t = this.ctx.currentTime + retraso;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = tipo; o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t); o.stop(t + dur + 0.02);
      } catch (e) { /* sin audio */ }
    },
    encender() { this.tono(440, 0.08, "triangle"); this.tono(660, 0.1, "triangle", 0.08, 0.07); },
    apagar() { this.tono(520, 0.08, "triangle"); this.tono(330, 0.1, "triangle", 0.08, 0.07); },
    error() { this.tono(180, 0.18, "square", 0.05); },
    alerta() { this.tono(880, 0.1, "sine", 0.07); this.tono(880, 0.1, "sine", 0.07, 0.16); },
    muestra() { this.tono(660, 0.1, "sine", 0.08); this.tono(990, 0.16, "sine", 0.08, 0.09); },
    exito() { [523, 659, 784, 1046].forEach((f, i) => this.tono(f, 0.18, "triangle", 0.08, i * 0.12)); },
    fallo() { this.tono(300, 0.2, "sine", 0.07); this.tono(220, 0.3, "sine", 0.07, 0.18); }
  };

  function elegirVoz() {
    const voces = window.speechSynthesis.getVoices();
    if (EN) return voces.find((x) => /^en[-_]US/i.test(x.lang)) || voces.find((x) => /^en/i.test(x.lang));
    return voces.find((x) => /^es[-_](MX|CO|US|419)/i.test(x.lang)) || voces.find((x) => /^es/i.test(x.lang));
  }

  const Voz = {
    activa: false,
    hablar(texto) {
      if (!this.activa || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto.replace(/[^\p{L}\p{N}\s.,;:¿?¡!%()+-]/gu, " "));
        u.lang = L("es-ES", "en-US"); u.rate = 0.95;
        const v = elegirVoz();
        if (v) u.voice = v;
        window.speechSynthesis.speak(u);
      } catch (e) { /* sin voz */ }
    },
    callar() { try { window.speechSynthesis.cancel(); } catch (e) { /* nada */ } },
    hablando() { try { return this.activa && window.speechSynthesis.speaking; } catch (e) { return false; } },
    // Lee varias frases en orden y avisa al empezar cada una (para sincronizar animaciones).
    secuencia(frases, alEmpezar, respaldoMs = 2800) {
      if (!this.activa || !("speechSynthesis" in window)) {
        frases.forEach((_, i) => setTimeout(() => alEmpezar(i), i * respaldoMs));
        return;
      }
      try {
        window.speechSynthesis.cancel();
        frases.forEach((f, i) => {
          const u = new SpeechSynthesisUtterance(f);
          u.lang = L("es-ES", "en-US"); u.rate = 0.95;
          const v = elegirVoz();
          if (v) u.voice = v;
          u.onstart = () => alEmpezar(i);
          window.speechSynthesis.speak(u);
        });
        // Respaldo por si el navegador no dispara onstart
        setTimeout(() => alEmpezar(frases.length - 1), frases.length * respaldoMs + 1500);
      } catch (e) { frases.forEach((_, i) => setTimeout(() => alEmpezar(i), i * respaldoMs)); }
    }
  };

  // Animaciones cortas (caminatas, gotas). Se cancelan por grupo.
  let tweens = [];
  function tween(dur, alActualizar, alTerminar, grupo = "general") {
    tweens.push({ inicio: performance.now(), dur, alActualizar, alTerminar, grupo });
  }
  function cancelarTweens(grupo) { tweens = tweens.filter((t) => t.grupo !== grupo); }
  (function cicloTweens(ahora) {
    const lista = tweens.slice();
    lista.forEach((t) => {
      const p = Math.min(1, (ahora - t.inicio) / t.dur);
      try { t.alActualizar(p); } catch (e) { /* elemento ya no existe */ }
      if (p >= 1) {
        tweens = tweens.filter((x) => x !== t);
        if (t.alTerminar) t.alTerminar();
      }
    });
    requestAnimationFrame(cicloTweens);
  })(performance.now());

  // ---------------------------------------------------------
  // 3. ESTADO
  // ---------------------------------------------------------
  function nivelDesdePerfil() {
    const url = new URLSearchParams(location.search).get("nivel");
    if (["1", "2", "3"].includes(url)) return Number(url);
    const perfil = almacen.leer("equilibria.perfil");
    if (perfil && [1, 2, 3].includes(Number(perfil.nivelInicial))) return Number(perfil.nivelInicial);
    return 1;
  }

  let nivelInicial = nivelDesdePerfil();
  let S = null;
  let ultimoCuadro = 0;

  function nuevaPartida() {
    S = {
      modo: "inicio",            // inicio | practica | dia | pausa | fin
      nivel: nivelInicial,
      dia: 0, t: 0,
      velocidad: NIVELES[nivelInicial].velocidad,
      pistas: NIVELES[nivelInicial].pistas,
      tanques: { o2: 35, agua: 70, co2: 30 },
      tendencia: { o2: 0, agua: 0, co2: 0 },
      maquinas: { gen: { on: false, potencia: 0 }, rec: { on: false, potencia: 0 }, limp: { on: false, potencia: 0 } },
      ciencia: 0, acumCiencia: 0,
      estrellasDias: [],
      efectos: [], agenda: [],
      historial: [], historialIntento: [], eventosDia: [],
      segVerde: 0, intentos: 0,
      metricas: { anticipa: 0, reacciona: 0 },
      ultimaCuenta: { gen: -99, rec: -99, limp: -99 },
      avisos: {},
      registroAdaptacion: [],
      dilemaAceptado: null,
      muestras: [], proximaMuestra: 6, muestrasDia: 0, muestrasTotal: 0,
      salidaEnCurso: false, pistaMuestra: false, rocaEspecial: null,
      caraForzada: null, demoFlujo: false, resumenDias: [],
      guia: null, practicaLista: false
    };
  }

  // ---------------------------------------------------------
  // 4. UTILIDADES
  // ---------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const svg = (tag, attrs = {}, padre = null) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (padre) padre.appendChild(el);
    return el;
  };

  function mostrarPantalla(id) {
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.toggle("activa", p.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let ultimoMensaje = "";
  function lunia(texto, { sonar = false } = {}) {
    if (texto === ultimoMensaje) return;
    ultimoMensaje = texto;
    $("mensaje-lunia").textContent = texto;
    const caja = document.querySelector(".lunia-mensaje");
    caja.classList.remove("nuevo"); void caja.offsetWidth; caja.classList.add("nuevo");
    if (sonar) Sonido.alerta();
    Voz.hablar(texto);
  }

  const enPractica = () => S.modo === "practica" || (S.modo === "pausa" && S.modoPrevio === "practica");
  function tanquesActivos() { return enPractica() ? ["o2"] : NIVELES[S.nivel].tanques; }
  function maquinasActivas() { return enPractica() ? ["gen"] : NIVELES[S.nivel].maquinas; }
  function energiaMax() { return enPractica() ? 1 : NIVELES[S.nivel].energiaMax; }
  function consumoActual() {
    if (enPractica()) return CONSUMO.practica;
    return NIVELES[S.nivel].tanques.includes("co2") ? CONSUMO.tresTanques : CONSUMO.dosTanques;
  }

  function estadoTanque(clave, v) {
    if (TANQUES[clave].malo === "bajo") return v < 20 ? "peligro" : v < 40 ? "atencion" : "bien";
    return v > 80 ? "peligro" : v > 60 ? "atencion" : "bien";
  }
  const TEXTO_ESTADO = L({ bien: "✔ Bien", atencion: "! Atención", peligro: "✖ Peligro" }, { bien: "✔ OK", atencion: "! Careful", peligro: "✖ Danger" });

  // ---------------------------------------------------------
  // 5. ESCENA (estrellas, tripulación, batería)
  // ---------------------------------------------------------
  function construirCielo() {
    const g = $("estrellas-cielo");
    g.innerHTML = "";
    for (let i = 0; i < 60; i++) {
      const y = 26 + Math.random() * 76;
      const c = svg("circle", { cx: 50 + Math.random() * 900, cy: y, r: Math.random() * 1.4 + 0.4, class: "estrella" + (i % 4 === 0 ? " titila" : "") }, g);
      c.style.animationDelay = (Math.random() * 3) + "s";
    }
  }

  function construirTripulacion() {
    const g = $("tripulacion");
    g.querySelectorAll(".pos-astronauta").forEach((n) => n.remove());
    [640, 692, 744, 796].forEach((x, i) => {
      const pos = svg("g", { transform: `translate(${x},398)`, class: "pos-astronauta" }, g);
      const a = svg("g", { class: "astronauta" }, pos);
      svg("rect", { x: -15, y: 14, width: 30, height: 30, rx: 10, class: "cuerpo" }, a);
      svg("circle", { cx: 0, cy: 0, r: 20, class: "casco" }, a);
      svg("ellipse", { cx: 0, cy: 0, rx: 14, ry: 11, class: "visor" }, a);
      svg("circle", { cx: -5, cy: -2, r: 2.2, class: "ojo" }, a);
      svg("circle", { cx: 5, cy: -2, r: 2.2, class: "ojo" }, a);
      svg("path", { d: "M-5 4 Q0 8 5 4", class: "boca" }, a);
      const b = svg("circle", { cx: 12, cy: -18, r: 3, class: "burbuja-aire" }, pos);
      b.style.animationDelay = (i * 0.6) + "s";
    });
  }

  function construirParticulas() {
    document.querySelectorAll("#escena .particulas").forEach((g) => {
      g.innerHTML = "";
      const tipo = g.dataset.tipo;
      if (tipo === "agua") {
        for (let i = 0; i < 9; i++) {
          const b = svg("circle", { cx: 12 + Math.random() * 76, cy: 150 + Math.random() * 28, r: 1.5 + Math.random() * 2.5, class: "burbuja-agua" }, g);
          b.style.animationDelay = (Math.random() * 4) + "s";
          b.style.animationDuration = (3 + Math.random() * 2.5) + "s";
        }
      } else {
        for (let i = 0; i < 16; i++) {
          const m = svg("circle", { cx: 8 + Math.random() * 84, cy: 6 + Math.random() * 170, r: 2 + Math.random() * 2.2, class: "molecula-" + tipo }, g);
          m.style.animationDelay = (-Math.random() * 5) + "s";
          m.style.animationDuration = (4 + Math.random() * 3) + "s";
        }
      }
    });
  }

  function construirBateria() {
    const g = $("bateria-celdas");
    g.innerHTML = "";
    const n = energiaMax();
    const ancho = (180 - 8 - (n - 1) * 6) / n;
    for (let i = 0; i < n; i++) svg("rect", { x: 4 + i * (ancho + 6), y: 4, width: ancho, height: 28, rx: 6, class: "celda libre" }, g);
  }

  function configurarEscena() {
    const escena = $("escena");
    const conCO2 = tanquesActivos().includes("co2");
    escena.classList.toggle("nivel-sin-co2", !conCO2);
    // En la práctica solo se ven el oxígeno y el generador.
    const pr = enPractica();
    ["tq-agua", "mq-rec", "tubo-agua-gen", "tubo-rec-agua", "cable-rec"].forEach((id) => { $(id).style.display = pr ? "none" : ""; });
    document.querySelectorAll("#escena .etiqueta-tubo").forEach((t) => { if (t.textContent === "agua usada") t.style.display = pr ? "none" : ""; });
    construirBateria();
    limpiarExterior();
    pintar();
  }

  // ---------------------------------------------------------
  // 6. PINTAR
  // ---------------------------------------------------------
  function pintar() {
    // Tanques
    tanquesActivos().forEach((clave) => {
      const el = $("tq-" + clave);
      const v = S.tanques[clave];
      const est = estadoTanque(clave, v);
      const alto = 180 * v / 100;
      const nivel = $("nivel-" + clave);
      nivel.setAttribute("y", 180 - alto);
      nivel.setAttribute("height", alto);
      const ola = el.querySelector(".ola");
      if (ola) ola.setAttribute("transform", `translate(0,${(180 - alto - 7).toFixed(1)})`);
      const bruma = el.querySelector(".bruma");
      if (bruma) bruma.setAttribute("y", (180 - alto - 18).toFixed(1));
      el.querySelector(".tq-valor").textContent = Math.round(v) + "%";
      el.querySelector(".tq-estado text").textContent = TEXTO_ESTADO[est];
      el.classList.remove("bien", "atencion", "peligro");
      el.classList.add(est);
      const tend = S.tendencia[clave];
      const flecha = el.querySelector(".tq-tendencia");
      flecha.textContent = tend > 1.0 ? "▲▲" : tend > 0.15 ? "▲" : tend < -1.0 ? "▼▼" : tend < -0.15 ? "▼" : "•";
      flecha.classList.toggle("sube", tend > 0.15);
      flecha.classList.toggle("baja", tend < -0.15);
    });

    // Máquinas, tubos y cables
    let enUso = 0;
    Object.keys(MAQUINAS).forEach((clave) => {
      const m = S.maquinas[clave];
      const el = $("mq-" + clave);
      const activa = maquinasActivas().includes(clave);
      if (activa && m.on) enUso++;
      const calentando = m.on && m.potencia < 1;
      const demo = S.demoFlujo && clave === "gen";
      el.classList.toggle("encendida", m.on || demo);
      el.classList.toggle("calentando", calentando);
      el.classList.toggle("debil", factorEvento(clave) < 1);
      el.setAttribute("aria-pressed", String(m.on));
      el.querySelector(".mq-estado").textContent = demo ? L("Encendida", "On") : !m.on ? L("Apagada", "Off") : calentando ? L("Arrancando", "Starting") : L("Encendida", "On");
      el.querySelector(".mq-anillo").style.strokeDashoffset = String(169.6 * (1 - m.potencia));
      MAQUINAS[clave].tubos.forEach((id) => $(id).classList.toggle("activo", demo || (m.on && m.potencia > 0.3)));
      $("cable-" + clave).classList.toggle("activo", m.on);
    });
    const celdas = $("bateria-celdas").querySelectorAll(".celda");
    celdas.forEach((c, i) => c.classList.toggle("libre", i < celdas.length - enUso));

    // Tripulación: la cara muestra el peor tanque
    const peor = S.caraForzada || tanquesActivos().map((k) => estadoTanque(k, S.tanques[k]))
      .reduce((a, b) => (b === "peligro" || (b === "atencion" && a === "bien") ? b : a), "bien");
    const boca = { bien: "M-5 4 Q0 8 5 4", atencion: "M-5 5 L5 5", peligro: "M-5 7 Q0 2 5 7" }[peor];
    document.querySelectorAll(".astronauta").forEach((a) => {
      a.classList.remove("bien", "atencion", "peligro");
      a.classList.add(peor);
      a.querySelector(".boca").setAttribute("d", boca);
    });

    // Reloj del día
    if (S.modo === "dia" || (S.modo === "pausa" && S.modoPrevio === "dia")) {
      const p = Math.min(1, S.t / DURACION_DIA);
      $("reloj-relleno").style.width = (p * 100) + "%";
      $("reloj-sol").style.left = (p * 100) + "%";
      $("reloj-sol").textContent = p < 0.8 ? "☀️" : "🌙";
    }
    pintarHud();
  }

  function pintarHud() {
    const hechos = S.estrellasDias.length;
    document.querySelectorAll(".dia-punto").forEach((d, i) => {
      d.classList.toggle("hecho", i < hechos);
      d.classList.toggle("actual", S.modo !== "fin" && i === hechos && S.dia === i + 1);
    });
    const diaMostrado = S.dia ? Math.min(Math.max(S.dia, hechos), DIAS) : 0;
    $("progreso-texto").textContent = diaMostrado ? L(`Día ${diaMostrado} de ${DIAS}`, `Day ${diaMostrado} of ${DIAS}`) : L("Práctica", "Practice");
    $("puntos").textContent = Math.floor(S.ciencia);
    const total = S.estrellasDias.reduce((a, b) => a + b, 0);
    const media = hechos ? Math.round(total / hechos) : 0;
    $("estrellas").textContent = "★".repeat(media) + "☆".repeat(3 - media);
    $("estrellas").title = L(`${total} de ${DIAS * 3} estrellas`, `${total} of ${DIAS * 3} stars`);
  }

  // ---------------------------------------------------------
  // 7. MÁQUINAS Y MEDICIÓN DE ANTICIPACIÓN (evaluación invisible)
  // ---------------------------------------------------------
  function alternarMaquina(clave) {
    Sonido.iniciar();
    if (!["practica", "dia"].includes(S.modo)) return;
    if (!maquinasActivas().includes(clave)) return;
    if (S.guia && S.guia.bloquea && S.guia.objetivo !== "mq-" + clave) return;
    const m = S.maquinas[clave];
    if (!m.on) {
      const enUso = maquinasActivas().filter((k) => S.maquinas[k].on).length;
      if (enUso >= energiaMax()) {
        Sonido.error();
        const el = $("mq-" + clave);
        el.classList.remove("sacudir"); void el.getBBox(); el.classList.add("sacudir");
        const bat = $("bateria");
        bat.classList.remove("bateria-sacudir"); void bat.getBBox(); bat.classList.add("bateria-sacudir");
        lunia(energiaMax() === 1
          ? L("No hay energía para dos máquinas. Primero apaga la otra.", "There’s not enough energy for two machines. Turn the other one off first.")
          : L("La energía solo alcanza para dos máquinas. Primero apaga una.", "There’s only enough energy for two machines. Turn one off first."));
        return;
      }
      m.on = true;   // arranca desde la potencia que le quede (se enfría poco a poco)
      Sonido.encender();
      if (S.modo === "dia") medirDecision(clave);
    } else {
      m.on = false;
      Sonido.apagar();
    }
    if (S.guia && S.guia.alAccionar) S.guia.alAccionar(clave);
    pintar();
  }

  function medirDecision(clave) {
    if (S.t - S.ultimaCuenta[clave] < 6) return;
    S.ultimaCuenta[clave] = S.t;
    const tq = MAQUINAS[clave].tanque;
    if (!tanquesActivos().includes(tq)) return;
    const v = S.tanques[tq];
    const bajo = TANQUES[tq].malo === "bajo";
    const anticipa = bajo ? (v >= 40 && v <= 70) : (v >= 30 && v <= 60);
    const reacciona = bajo ? v < 30 : v > 70;
    if (anticipa) S.metricas.anticipa++;
    else if (reacciona) S.metricas.reacciona++;
  }

  function factorEvento(clave) {
    let f = 1;
    S.efectos.forEach((ef) => {
      const fac = EVENTOS[ef.tipo] && EVENTOS[ef.tipo].factor;
      if (fac && fac[clave] !== undefined) f *= fac[clave];
    });
    return f;
  }
  const multiplicadorEsfuerzo = () => (S.efectos.some((ef) => ef.tipo === "esfuerzo") ? 2.5 : 1);

  // ---------------------------------------------------------
  // 8. SIMULACIÓN
  // ---------------------------------------------------------
  function paso(dt) {
    const v = enPractica() ? 1.25 : S.velocidad;
    const c = consumoActual();
    const esf = multiplicadorEsfuerzo();
    const d = { o2: -c.o2 * esf, agua: -c.agua, co2: c.co2 * esf };

    Object.keys(MAQUINAS).forEach((clave) => {
      const m = S.maquinas[clave];
      if (m.on) m.potencia = Math.min(1, m.potencia + dt / MAQUINAS[clave].arranque);
      else m.potencia = Math.max(0, m.potencia - dt / MAQUINAS[clave].arranque);
      if (!maquinasActivas().includes(clave)) return;
      const p = m.on ? m.potencia * factorEvento(clave) : 0;
      Object.entries(MAQUINAS[clave].efecto).forEach(([tq, val]) => {
        if (enPractica() && tq !== "o2") return;
        d[tq] += val * p;
      });
    });

    tanquesActivos().forEach((tq) => {
      const nuevo = limitar(S.tanques[tq] + d[tq] * v * dt, 0, 100);
      // Tendencia suavizada (unidades por segundo) para las flechas
      S.tendencia[tq] = S.tendencia[tq] * 0.9 + ((nuevo - S.tanques[tq]) / Math.max(dt, 0.001)) * 0.1;
      S.tanques[tq] = nuevo;
    });

    S.efectos = S.efectos.filter((ef) => {
      if (S.t < ef.fin) return true;
      if (ef.tipo === "esfuerzo") {
        S.ciencia += 40;
        Sonido.exito();
        terminarSalidaEspecial();
        lunia(L("¡Trajeron la roca especial! Ganaste 40 puntos de ciencia.", "They brought back the special rock! You earned 40 science points."));
      } else {
        lunia(L("Todo volvió a la normalidad.", "Everything is back to normal."));
      }
      $("aviso-evento").hidden = true;
      return false;
    });
  }

  const todoEnVerde = () => tanquesActivos().every((tq) => estadoTanque(tq, S.tanques[tq]) === "bien");

  function consejo(tq) {
    return {
      o2: L("Enciende el generador de oxígeno.", "Turn on the oxygen generator."),
      agua: L("Enciende el reciclador de agua.", "Turn on the water recycler."),
      co2: L("Enciende el limpiador de aire.", "Turn on the air cleaner.")
    }[tq];
  }

  function revisarAvisos() {
    tanquesActivos().forEach((tq) => {
      const v = S.tanques[tq];
      const bajo = TANQUES[tq].malo === "bajo";
      const temprano = bajo ? v < 50 : v > 50;
      const peligro = estadoTanque(tq, v) === "peligro";
      const nombre = TANQUES[tq].nombre;
      if (peligro && !S.avisos[tq + "-p"]) {
        S.avisos[tq + "-p"] = true;
        lunia(L(`¡Peligro! El ${nombre} está muy ${bajo ? "bajo" : "alto"}. ${consejo(tq)}`, `Danger! The ${nombre} is very ${bajo ? "low" : "high"}. ${consejo(tq)}`), { sonar: true });
      } else if (temprano && S.pistas && !S.avisos[tq + "-t"] && !S.avisos[tq + "-p"]) {
        S.avisos[tq + "-t"] = true;
        lunia(L(`El ${nombre} está ${bajo ? "bajando" : "subiendo"}. ${consejo(tq)} Hazlo ya: la máquina tarda en arrancar.`, `The ${nombre} is ${bajo ? "dropping" : "rising"}. ${consejo(tq)} Do it now: the machine takes a while to start.`));
      }
      const recuperado = bajo ? v > 60 : v < 40;
      if (recuperado) { S.avisos[tq + "-t"] = false; S.avisos[tq + "-p"] = false; }
    });
  }

  function falloDelSistema() {
    if (S.tanques.o2 <= 0) return "o2";
    if (tanquesActivos().includes("agua") && S.tanques.agua <= 0) return "agua";
    if (tanquesActivos().includes("co2") && S.tanques.co2 >= 100) return "co2";
    return null;
  }

  function bucle(ahora) {
    const dt = Math.min(0.1, (ahora - ultimoCuadro) / 1000 || 0);
    ultimoCuadro = ahora;

    if (S.modo === "practica") {
      S.t += dt;
      if (!(S.guia && S.guia.congela)) paso(dt);
      S.tanques.o2 = Math.max(S.tanques.o2, 10);
      if (S.guia && S.guia.alActualizar) S.guia.alActualizar();
      pintar();
    } else if (S.modo === "dia") {
      if (S.guia && S.guia.congela) { pintar(); requestAnimationFrame(bucle); return; }
      const antes = Math.floor(S.t);
      S.t += dt;
      paso(dt);
      ejecutarAgenda();
      revisarAvisos();
      actualizarMuestras(dt);
      if (todoEnVerde()) {
        S.segVerde += dt;
        S.acumCiencia += dt;
        if (S.acumCiencia >= 3) { S.ciencia += 1; S.acumCiencia -= 3; }
      }
      if (Math.floor(S.t) !== antes) registrarMuestra();
      pintar();
      const fallo = falloDelSistema();
      if (fallo) modoAhorro(fallo);
      else if (S.t >= DURACION_DIA) terminarDia();
    }
    requestAnimationFrame(bucle);
  }

  function registrarMuestra() {
    S.historialIntento.push({
      dia: S.dia, t: Math.floor(S.t),
      o2: S.tanques.o2,
      agua: tanquesActivos().includes("agua") ? S.tanques.agua : undefined,
      co2: tanquesActivos().includes("co2") ? S.tanques.co2 : undefined
    });
  }

  // ---------------------------------------------------------
  // 9. MUESTRAS EN EL EXTERIOR (solo se sale con todo en verde)
  // ---------------------------------------------------------
  const ESCLUSA = { x: 72, y: 124 };   // puerta de salida dentro del ventanal

  function limpiarExterior() {
    cancelarTweens("exterior");
    $("exterior").innerHTML = "";
    document.querySelectorAll(".astronauta").forEach((a) => a.classList.remove("ausente"));
    if (S) { S.muestras = []; S.salidaEnCurso = false; S.rocaEspecial = null; }
  }
  const limpiarMuestras = limpiarExterior;

  function crearMuestra({ especial = false, x = null } = {}) {
    const mx = x !== null ? x : 140 + Math.random() * 780;
    const my = 124 + Math.random() * 22;
    const pos = svg("g", { transform: `translate(${mx.toFixed(0)},${my.toFixed(0)})` }, $("exterior"));
    const g = svg("g", { class: "muestra" + (especial ? " especial" : ""), role: "button", tabindex: "0", "aria-label": especial ? L("Roca especial", "Special rock") : L("Muestra de roca", "Rock sample") }, pos);
    const esc = especial ? 1.5 : 1;
    svg("circle", { r: 15 * esc, class: "brillo" }, g);
    svg("path", { d: "M-12 6 L-8 -6 L2 -10 L11 -3 L12 7 L0 10 Z", class: "roca", transform: `scale(${esc})` }, g);
    svg("circle", { r: 24, fill: "transparent" }, g);
    const m = { el: pos, x: mx, y: my, fin: especial ? Infinity : S.t + 9, especial };
    if (!especial) {
      const recoger = (e) => { e.preventDefault(); recogerMuestra(m); };
      g.addEventListener("click", recoger);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") recoger(e); });
    } else g.classList.add("reservada");
    S.muestras.push(m);
    return m;
  }

  function crearAstronautaFuera(x, y) {
    const pos = svg("g", { transform: `translate(${x},${y}) scale(1.3)` }, $("exterior"));
    const a = svg("g", { class: "astronauta-fuera" }, pos);
    const c = svg("g", { class: "cuerpo-fuera" }, a);
    svg("line", { x1: -4, y1: 8, x2: -4, y2: 20, class: "pierna pierna-a" }, c);
    svg("line", { x1: 4, y1: 8, x2: 4, y2: 20, class: "pierna pierna-b" }, c);
    svg("rect", { x: -12, y: -10, width: 8, height: 16, rx: 3, class: "mochila" }, c);
    svg("rect", { x: -8, y: -10, width: 16, height: 20, rx: 6, class: "traje" }, c);
    svg("circle", { cx: 0, cy: -17, r: 9, class: "traje" }, c);
    svg("ellipse", { cx: 2, cy: -17, rx: 6, ry: 5, class: "visor-oro" }, c);
    return { pos, a, x, y };
  }

  function caminar(ast, xDestino, alLlegar) {
    const x0 = ast.x;
    const dur = Math.max(600, Math.abs(xDestino - x0) * 3.2);
    ast.a.classList.add("caminando");
    ast.a.setAttribute("transform", xDestino < x0 ? "scale(-1,1)" : "");
    tween(dur, (p) => {
      ast.x = x0 + (xDestino - x0) * p;
      ast.pos.setAttribute("transform", `translate(${ast.x.toFixed(1)},${ast.y}) scale(1.3)`);
    }, () => { ast.a.classList.remove("caminando"); if (alLlegar) alLlegar(); }, "exterior");
  }

  function recogerMuestra(m) {
    Sonido.iniciar();
    if (S.modo !== "dia" || !S.muestras.includes(m) || m.reservada) return;
    if (!todoEnVerde()) {
      Sonido.error();
      lunia(L("La tripulación solo puede salir si todos los tanques están bien. Primero arregla los tanques.", "The crew can only go out if all the tanks are OK. Fix the tanks first."));
      return;
    }
    if (S.salidaEnCurso) {
      lunia(L("Espera: ya hay un astronauta afuera.", "Wait: there’s already an astronaut outside."));
      return;
    }
    S.salidaEnCurso = true;
    m.reservada = true;
    m.el.firstChild.classList.add("reservada");
    const dentro = document.querySelectorAll(".astronauta")[3];
    if (dentro) dentro.classList.add("ausente");
    Sonido.encender();
    lunia(L("¡Un astronauta sale a buscar la muestra!", "An astronaut is going out to get the sample!"));
    const ast = crearAstronautaFuera(ESCLUSA.x, ESCLUSA.y);
    caminar(ast, m.x - 14, () => {
      S.ciencia += 5;
      S.muestrasDia++;
      S.muestrasTotal++;
      Sonido.muestra();
      textoFlotante(m.x, m.y - 26, "+5 🔬");
      quitarMuestra(m);
      pintarHud();
      caminar(ast, ESCLUSA.x, () => {
        ast.pos.remove();
        if (dentro) dentro.classList.remove("ausente");
        S.salidaEnCurso = false;
      });
    });
  }

  function quitarMuestra(m) {
    S.muestras = S.muestras.filter((x) => x !== m);
    if (m.el.firstChild) m.el.firstChild.classList.add("desaparece");
    setTimeout(() => m.el.remove(), 400);
  }

  function actualizarMuestras() {
    if (S.t >= S.proximaMuestra && S.t < DURACION_DIA - 6) {
      crearMuestra();
      S.proximaMuestra = S.t + 8 + Math.random() * 6;
      if (!S.pistaMuestra) {
        S.pistaMuestra = true;
        lunia(L("Mira por la ventana: hay una roca. Tócala y un astronauta saldrá a buscarla. Solo pueden salir si todos los tanques están bien.", "Look out the window: there’s a rock. Tap it and an astronaut will go out to get it. They can only go out if all the tanks are OK."));
      }
    }
    S.muestras.slice().forEach((m) => { if (S.t >= m.fin && !m.reservada) quitarMuestra(m); });
  }

  // Roca especial del día 2 (dilema)
  function aparecerRocaEspecial() {
    S.rocaEspecial = crearMuestra({ especial: true, x: 560 });
    Sonido.alerta();
    lunia(L("¡Mira por la ventana! Apareció una roca especial.", "Look out the window! A special rock appeared."));
  }

  function salidaEspecial() {
    const roca = S.rocaEspecial;
    if (!roca) return;
    const dentro = document.querySelectorAll(".astronauta");
    [2, 3].forEach((i) => dentro[i] && dentro[i].classList.add("ausente"));
    S.equipoFuera = [crearAstronautaFuera(ESCLUSA.x, ESCLUSA.y), crearAstronautaFuera(ESCLUSA.x, ESCLUSA.y)];
    S.equipoFuera.forEach((ast, i) => {
      setTimeout(() => caminar(ast, roca.x + (i ? 26 : -30), () => ast.a.classList.add("trabajando")), i * 500);
    });
  }

  function terminarSalidaEspecial() {
    const roca = S.rocaEspecial;
    if (roca) { textoFlotante(roca.x, roca.y - 30, "+40 🔬"); quitarMuestra(roca); S.rocaEspecial = null; }
    (S.equipoFuera || []).forEach((ast) => {
      ast.a.classList.remove("trabajando");
      caminar(ast, ESCLUSA.x, () => {
        ast.pos.remove();
        if (!(S.equipoFuera || []).some((a) => a.pos.isConnected)) {
          document.querySelectorAll(".astronauta").forEach((a) => a.classList.remove("ausente"));
        }
      });
    });
  }

  function textoFlotante(x, y, texto) {
    const t = svg("text", { x, y, class: "texto-flotante" }, $("escena"));
    t.textContent = texto;
    setTimeout(() => t.remove(), 1300);
  }

  // ---------------------------------------------------------
  // 10. EVENTOS DEL DÍA (cambian en cada partida)
  // ---------------------------------------------------------
  const eventosPosibles = () => Object.keys(EVENTOS).filter((k) => !EVENTOS[k].requiere || maquinasActivas().includes(EVENTOS[k].requiere));

  function planearDia() {
    const posibles = eventosPosibles();
    const agenda = [];
    if (S.dia === 1) agenda.push({ t: 25, tipo: azar(posibles.filter((k) => k !== "fuga")) });
    else if (S.dia === 2) { agenda.push({ t: 13, tipo: "rocaEspecial" }); agenda.push({ t: 17, tipo: "dilema" }); agenda.push({ t: 42, tipo: azar(posibles) }); }
    else { agenda.push({ t: 15, tipo: azar(posibles) }); if (S.nivel >= 2) agenda.push({ t: 40, tipo: azar(posibles) }); }
    S.agenda = agenda;
  }

  function ejecutarAgenda() {
    while (S.agenda.length && S.t >= S.agenda[0].t) {
      const ev = S.agenda.shift();
      S.eventosDia.push({ t: Math.floor(S.t), tipo: ev.tipo });
      if (ev.tipo === "rocaEspecial") { aparecerRocaEspecial(); continue; }
      if (ev.tipo === "dilema") { abrirDilema(); return; }
      const def = EVENTOS[ev.tipo];
      if (def.instantaneo) Object.entries(def.instantaneo).forEach(([tq, val]) => { S.tanques[tq] = limitar(S.tanques[tq] + val, 0, 100); });
      if (def.duracion) S.efectos.push({ tipo: ev.tipo, fin: S.t + def.duracion });
      $("aviso-evento").textContent = def.aviso;
      $("aviso-evento").hidden = false;
      if (!def.duracion) setTimeout(() => { if (S.modo !== "pausa") $("aviso-evento").hidden = true; }, 5000);
      Sonido.alerta();
      lunia(def.lunia);
    }
  }

  function abrirDilema() {
    S.modoPrevio = "dia";
    S.modo = "pausa";
    $("modal-dilema").hidden = false;
    Voz.hablar(L("Por la ventana se ve una roca especial. ¿Salimos a buscarla? Ganas cuarenta puntos de ciencia. Pero con esfuerzo se respira más, y el oxígeno bajará rápido durante quince segundos.", "There’s a special rock out the window. Shall we go get it? You earn forty science points. But with effort you breathe more, and the oxygen will drop fast for fifteen seconds."));
    $("btn-dilema-si").focus();
  }

  function cerrarDilema(acepta) {
    Sonido.iniciar();
    $("modal-dilema").hidden = true;
    S.dilemaAceptado = acepta;
    if (acepta) {
      S.efectos.push({ tipo: "esfuerzo", fin: S.t + 15 });
      salidaEspecial();
      $("aviso-evento").textContent = L("🔬 Dos astronautas están afuera trabajando con mucho esfuerzo. El oxígeno baja más rápido durante 15 segundos.", "🔬 Two astronauts are outside working very hard. The oxygen drops faster for 15 seconds.");
      $("aviso-evento").hidden = false;
      lunia(L("Mantén el generador encendido. Ahora se gasta mucho más oxígeno.", "Keep the generator on. A lot more oxygen is being used now."));
    } else {
      if (S.rocaEspecial) { quitarMuestra(S.rocaEspecial); S.rocaEspecial = null; }
      lunia(L("Hoy no saldremos. La tripulación sigue segura.", "We won’t go out today. The crew stays safe."));
    }
    S.modo = "dia";
    ultimoCuadro = performance.now();
  }

  // ---------------------------------------------------------
  // 11. GUÍA PASO A PASO
  // ---------------------------------------------------------
  function enfocar(idObjetivo, texto, { boton = true, textoBoton = L("Siguiente", "Next"), hablar = true } = {}) {
    const guia = $("guia");
    guia.hidden = false;
    $("guia-texto").textContent = texto;
    $("guia-siguiente").textContent = textoBoton;
    $("guia-burbuja").classList.toggle("sin-boton", !boton);
    if (hablar) Voz.hablar(texto);
    requestAnimationFrame(() => colocarGuia(idObjetivo));
    setTimeout(() => colocarGuia(idObjetivo), 350);
  }

  function colocarGuia(idObjetivo) {
    const objetivo = $(idObjetivo);
    if (!objetivo || $("guia").hidden) return;
    const r = objetivo.getBoundingClientRect();
    const m = 10;
    const foco = $("guia-foco");
    Object.assign(foco.style, { left: (r.left - m) + "px", top: (r.top - m) + "px", width: (r.width + 2 * m) + "px", height: (r.height + 2 * m) + "px" });
    const b = $("guia-burbuja");
    const bw = Math.min(360, window.innerWidth - 24);
    let x = r.right + 24;
    if (x + bw > window.innerWidth - 12) x = Math.max(12, r.left - bw - 24);
    let y = r.top;
    const bh = b.offsetHeight || 120;
    if (x < 12 || (x + bw > r.left && x < r.right)) {
      x = Math.max(12, Math.min(window.innerWidth - bw - 12, r.left));
      y = r.bottom + 20;
      if (y + bh > window.innerHeight - 12) y = r.top - bh - 20;
    }
    y = Math.max(80, Math.min(window.innerHeight - bh - 12, y));
    Object.assign(b.style, { left: x + "px", top: y + "px", width: bw + "px" });
  }

  function cerrarGuia() {
    if (S.guia && S.guia.alSalir) S.guia.alSalir();
    $("guia").hidden = true;
    S.guia = null;
  }

  // Avanza solo cuando se cumple la condición, terminó la voz y pasó un tiempo mínimo.
  // Chrome y Edge a veces se quedan creyendo que siguen hablando (speechSynthesis.speaking no vuelve a
  // false): por eso, cumplida la condición, se espera a la voz como máximo unos segundos y se sigue igual.
  // Sin ese límite la guía se quedaba trabada (por ejemplo en "Mira el anillo…") y bloqueaba la pantalla.
  const ESPERA_MAX_VOZ = 6000;
  function avanzarCuandoListo(g, sig, minMs = 2500) {
    const inicio = performance.now();
    let listo = false, listoDesde = 0;
    g.marcarListo = () => { if (!listo) { listo = true; listoDesde = performance.now(); } };
    const revisar = setInterval(() => {
      if (S.guia !== g) { clearInterval(revisar); return; }
      const ahora = performance.now();
      const vozLibre = !Voz.hablando() || ahora - listoDesde >= ESPERA_MAX_VOZ;
      if (listo && vozLibre && ahora - inicio >= minMs) { clearInterval(revisar); sig(); }
    }, 200);
  }

  function ejecutarGuia(pasos, alTerminar) {
    let i = 0;
    const siguiente = () => {
      if (S.guia && S.guia.alSalir) { S.guia.alSalir(); S.guia.alSalir = null; }
      if (i >= pasos.length) { cerrarGuia(); if (alTerminar) alTerminar(); return; }
      const p = pasos[i++];
      S.guia = { objetivo: p.objetivo, congela: !!p.congela, bloquea: !!p.bloquea, alAccionar: null, alActualizar: null, alSalir: p.alSalir || null, avanzar: siguiente };
      enfocar(p.objetivo, p.texto, { boton: !p.espera, textoBoton: p.textoBoton || L("Siguiente", "Next"), hablar: !p.vozPropia });
      if (p.alIniciar) p.alIniciar(S.guia);
      if (p.espera) p.espera(S.guia, siguiente);
    };
    $("guia-siguiente").onclick = () => { Sonido.iniciar(); if (S.guia && S.guia.avanzar) S.guia.avanzar(); };
    siguiente();
  }

  window.addEventListener("resize", () => { if (S && S.guia) colocarGuia(S.guia.objetivo); });
  window.addEventListener("scroll", () => { if (S && S.guia) colocarGuia(S.guia.objetivo); }, { passive: true });

  // Animación del tubo: el agua va al generador y sale oxígeno hacia su tanque.
  function iniciarDemoFlujo() {
    S.demoFlujo = true;
    S.demoGuardado = { ...S.tanques };
    const g = $("demo-flujo");
    g.innerHTML = "";
    const eAgua = svg("text", { x: 220, y: 196, class: "etiqueta-demo" }, g); eAgua.textContent = L("agua", "water");
    const eO2 = svg("text", { x: 460, y: 196, class: "etiqueta-demo" }, g); eO2.textContent = L("oxígeno", "oxygen");
    const tramo = (puntos, clase, r) => {
      const c = svg("circle", { r, class: clase, cx: puntos[0][0], cy: puntos[0][1] }, g);
      const largo = puntos.length - 1;
      tween(1500, (p) => {
        const pos = p * largo, k = Math.min(largo - 1, Math.floor(pos)), f = pos - k;
        const [x0, y0] = puntos[k], [x1, y1] = puntos[k + 1];
        c.setAttribute("cx", x0 + (x1 - x0) * f);
        c.setAttribute("cy", y0 + (y1 - y0) * f);
      }, () => c.remove(), "demo");
    };
    let n = 0;
    S.demoIntervalo = setInterval(() => {
      if (!S.demoFlujo) return;
      tramo([[140, 300], [140, 215], [190, 215], [250, 215], [300, 215]], "gota-demo", 6);
      setTimeout(() => { if (S.demoFlujo) tramo([[380, 215], [430, 215], [490, 215], [540, 215], [540, 270]], "burbuja-demo", 6); }, 900);
      // El agua baja un poco y el oxígeno sube un poco (se restaura al terminar)
      n++;
      S.tanques.agua = Math.max(30, S.demoGuardado.agua - (n % 8) * 1.5);
      S.tanques.o2 = Math.min(95, S.demoGuardado.o2 + (n % 8) * 1.5);
    }, 600);
  }
  function detenerDemoFlujo() {
    S.demoFlujo = false;
    clearInterval(S.demoIntervalo);
    cancelarTweens("demo");
    $("demo-flujo").innerHTML = "";
    if (S.demoGuardado) { S.tanques.agua = S.demoGuardado.agua; S.tanques.o2 = S.demoGuardado.o2; S.demoGuardado = null; }
  }

  // Paso de la guía con la tripulación: preocupada y luego sonriente, al ritmo de la voz.
  const pasoTripulacion = (textoBoton) => ({
    objetivo: "tripulacion", congela: true, vozPropia: true, textoBoton,
    texto: L("Mira a la tripulación. Si los tanques están mal, se preocupan. Si todo está bien, sonríen.", "Look at the crew. If the tanks are bad, they worry. If everything is OK, they smile."),
    alIniciar: () => {
      S.caraForzada = "peligro";
      Voz.secuencia(L(["Mira a la tripulación. Si los tanques están mal, se preocupan.", "Si todo está bien, sonríen."], ["Look at the crew. If the tanks are bad, they worry.", "If everything is OK, they smile."]),
        (i) => { if (S.caraForzada) S.caraForzada = i === 0 ? "peligro" : "bien"; });
    },
    alSalir: () => { S.caraForzada = null; }
  });

  const TEXTO_CO2 = L("Nuevo tanque: el CO₂. Es el gas que sale cuando respiramos. Si se acumula mucho, da dolor de cabeza y cansancio. Por eso este tanque no debe llenarse.", "New tank: CO₂. It’s the gas that comes out when we breathe. If too much builds up, it causes headaches and tiredness. That’s why this tank must not fill up.");
  const TEXTO_CO2_INICIO = [L("Nuevo tanque: el CO₂. ", "New tank: CO₂. "), L("Este es el CO₂. ", "This is CO₂. ")];

  // ---------------------------------------------------------
  // 12. FLUJO DE LA MISIÓN
  // ---------------------------------------------------------
  function iniciarPractica() {
    Sonido.iniciar();
    nuevaPartida();
    activarVozPorNivel();
    S.modo = "practica";
    $("titulo-dia").textContent = L("Práctica", "Practice");
    $("reloj-relleno").style.width = "0%";
    $("reloj-sol").style.left = "0%";
    $("btn-continuar-practica").hidden = true;
    $("aviso-evento").hidden = true;
    $("btn-pausa").hidden = false;
    Object.values(S.maquinas).forEach((m) => { m.on = false; m.potencia = 0; });
    mostrarPantalla("pantalla-juego");
    configurarEscena();
    lunia(L("Hola, soy LUNIA, la inteligencia artificial de la base. Vamos a practicar.", "Hi, I’m LUNIA, the base’s artificial intelligence. Let’s practice."));

    setTimeout(() => ejecutarGuia([
      { objetivo: "tq-o2", congela: true, texto: L("Este tanque guarda el oxígeno. La tripulación lo respira todo el tiempo. Ahora está bajo.", "This tank stores the oxygen. The crew breathes it all the time. Right now it’s low.") },
      { objetivo: "mq-gen", bloquea: true, texto: L("Toca el generador para fabricar oxígeno. También puedes pulsar la tecla 1.", "Tap the generator to make oxygen. You can also press the 1 key."),
        espera: (g, sig) => { g.alAccionar = (clave) => { if (clave === "gen" && S.maquinas.gen.on) sig(); }; } },
      { objetivo: "mq-gen", texto: L("Mira el anillo: la máquina tarda unos segundos en arrancar. Cuando se llena, ya funciona.", "Look at the ring: the machine takes a few seconds to start. When it fills up, it’s working."),
        espera: (g, sig) => { avanzarCuandoListo(g, sig, 3500); g.alActualizar = () => { if (S.maquinas.gen.potencia >= 1) g.marcarListo(); }; } },
      { objetivo: "tq-o2", texto: L("Ahora el oxígeno sube. Llénalo hasta el 60 %.", "Now the oxygen is rising. Fill it up to 60%."),
        espera: (g, sig) => { avanzarCuandoListo(g, sig, 1500); g.alActualizar = () => { if (S.tanques.o2 >= 60) g.marcarListo(); }; } }
    ], () => {
      S.practicaLista = true;
      Sonido.exito();
      lunia(L("¡Muy bien! Ya sabes encender una máquina.", "Very good! Now you know how to turn on a machine."));
      const btn = $("btn-continuar-practica");
      btn.hidden = false;
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
      S.guia = { objetivo: "btn-continuar-practica", congela: false, bloquea: true, avanzar: null };
      setTimeout(() => { if (S.guia && S.guia.objetivo === "btn-continuar-practica") enfocar("btn-continuar-practica", L("¡Comencemos con el día 1! Toca el botón que brilla.", "Let’s start day 1! Tap the glowing button."), { boton: false }); }, 450);
    }), 400);
  }

  function iniciarDia(numero, { guiar = false } = {}) {
    S.dia = numero;
    S.modo = "dia";
    S.t = 0; S.segVerde = 0; S.acumCiencia = 0;
    S.efectos = []; S.avisos = {}; S.eventosDia = []; S.historialIntento = [];
    S.ultimaCuenta = { gen: -99, rec: -99, limp: -99 };
    S.metricasDia = { ...S.metricas };
    S.muestrasDia = 0;
    S.proximaMuestra = 6;
    S.equipoFuera = [];
    Object.values(S.maquinas).forEach((m) => { m.on = false; m.potencia = 0; });

    if (numero === 1 && !S.reintentando) S.tanques = { o2: 70, agua: 70, co2: 30 };
    S.reintentando = false;
    // Las decisiones se acumulan: el día empieza como terminó el anterior (mínimo 35).
    S.tanques.o2 = Math.max(S.tanques.o2, 35);
    S.tanques.agua = Math.max(S.tanques.agua, 35);
    S.tanques.co2 = Math.min(S.tanques.co2, 65);
    S.tendencia = { o2: 0, agua: 0, co2: 0 };
    S.inicioDia = { ...S.tanques };
    S.cienciaInicioDia = S.ciencia;

    planearDia();
    $("titulo-dia").textContent = L(`Día ${numero}`, `Day ${numero}`);
    $("aviso-evento").hidden = true;
    $("btn-continuar-practica").hidden = true;
    $("reloj-relleno").style.width = "0%";
    $("reloj-sol").style.left = "0%";
    mostrarPantalla("pantalla-juego");
    configurarEscena();
    ultimoCuadro = performance.now();

    const conCO2 = NIVELES[S.nivel].tanques.includes("co2");
    if (guiar) {
      const pasos = [
        { objetivo: "tq-agua", congela: true, texto: L("Ahora también cuidas el agua. La tripulación la usa para beber, cocinar y asearse.", "Now you also look after the water. The crew uses it to drink, cook and wash.") },
        { objetivo: "zona-agua-o2", congela: true, texto: L("Mira este tubo: el generador usa agua para fabricar oxígeno. Si fabricas mucho oxígeno, se gasta el agua.", "Look at this pipe: the generator uses water to make oxygen. If you make a lot of oxygen, the water runs out."),
          alIniciar: iniciarDemoFlujo, alSalir: detenerDemoFlujo },
        { objetivo: "mq-rec", congela: true, texto: L("El reciclador limpia el agua usada para volver a usarla.", "The recycler cleans used water so it can be used again.") },
        { objetivo: "bateria", congela: true, texto: conCO2
          ? L("La energía alcanza para dos máquinas a la vez. Tendrás que elegir cuáles encender.", "There’s enough energy for two machines at once. You’ll have to choose which ones to turn on.")
          : L("La energía alcanza para una sola máquina. Ve turnando el generador y el reciclador.", "There’s only enough energy for one machine. Take turns between the generator and the recycler.") }
      ];
      if (conCO2) pasos.splice(3, 0,
        { objetivo: "tq-co2", congela: true, texto: TEXTO_CO2.replace(TEXTO_CO2_INICIO[0], TEXTO_CO2_INICIO[1]) },
        { objetivo: "mq-limp", congela: true, texto: L("El limpiador quita el CO₂ del aire.", "The air cleaner removes CO₂ from the air.") });
      pasos.push({ objetivo: "ventana", congela: true, texto: L("Por esta ventana se ve el exterior de la base. A veces aparecen rocas. Si todos los tanques están bien, la tripulación puede salir a buscarlas.", "Through this window you can see outside the base. Sometimes rocks appear. If all the tanks are OK, the crew can go out to get them.") });
      pasos.push(pasoTripulacion(L("¡Empezar!", "Start!")));
      ejecutarGuia(pasos, () => { ultimoCuadro = performance.now(); lunia(L("¡Empieza el día 1! Mantén todos los tanques en verde.", "Day 1 begins! Keep all the tanks green.")); });
    } else {
      lunia(numero === 1 ? L("¡Empieza el día 1! Mantén todos los tanques en verde.", "Day 1 begins! Keep all the tanks green.")
        : L(`Día ${numero}. Los tanques siguen como quedaron ayer.`, `Day ${numero}. The tanks are just as they were yesterday.`));
    }
    pintar();
  }

  function modoAhorro(tq) {
    S.modo = "fin";
    S.intentos++;
    Sonido.fallo();
    limpiarMuestras();
    S.registroAdaptacion.push({ dia: S.dia, nota: L(`Se agotó el ${TANQUES[tq].nombre}. Se repite el día con más ayuda.`, `The ${TANQUES[tq].nombre} ran out. The day is repeated with more help.`) });
    const bajo = TANQUES[tq].malo === "bajo";
    const nombre = TANQUES[tq].nombre;
    const inicio = S.historialIntento.find((m) => typeof m[tq] === "number" && (bajo ? m[tq] < 40 : m[tq] > 60));
    $("ahorro-texto").textContent = bajo
      ? L(`Se acabó el ${nombre}. Activé el modo ahorro: la tripulación está a salvo.`, `The ${nombre} ran out. I turned on saving mode: the crew is safe.`)
      : L(`El ${nombre} llenó su tanque. Activé el modo ahorro: la tripulación está a salvo.`, `The ${nombre} filled its tank. I turned on saving mode: the crew is safe.`);
    $("ahorro-cuando").textContent = inicio && inicio.t <= 1
      ? L(`El día empezó con poco ${nombre}. Lo que pasa un día se nota al día siguiente.`, `The day started with little ${nombre}. What happens one day shows up the next.`)
      : inicio ? L(`El problema empezó en el segundo ${inicio.t} del día.`, `The problem started at second ${inicio.t} of the day.`) : "";
    $("ahorro-consejo").textContent = L(`${consejo(tq)} Hazlo antes de que el tanque se ponga amarillo, porque la máquina tarda en arrancar.`, `${consejo(tq)} Do it before the tank turns yellow, because the machine takes a while to start.`);
    Voz.hablar($("ahorro-texto").textContent + " " + $("ahorro-consejo").textContent);
    S.velocidad = Math.max(0.7, S.velocidad * 0.9);
    S.pistas = true;
    mostrarPantalla("pantalla-ahorro");
  }

  function reintentarDia() {
    Sonido.iniciar();
    S.ciencia = S.cienciaInicioDia;
    // Reserva de emergencia: el reintento empieza con al menos 50 % (simplificación para no castigar).
    S.tanques = { o2: Math.max(S.inicioDia.o2, 50), agua: Math.max(S.inicioDia.agua, 50), co2: Math.min(S.inicioDia.co2, 50) };
    S.reintentando = true;
    iniciarDia(S.dia);
    lunia(L("Usé la reserva de emergencia de la base. ¡Inténtalo otra vez!", "I used the base’s emergency reserve. Try again!"));
  }

  const calcularEstrellas = (verde) => 1 + (verde >= 0.6 ? 1 : 0) + (verde >= 0.85 ? 1 : 0);

  function terminarDia() {
    S.modo = "fin";
    limpiarMuestras();
    const verde = S.segVerde / DURACION_DIA;
    const estrellas = calcularEstrellas(verde);
    S.estrellasDias.push(estrellas);
    S.resumenDias.push({ dia: S.dia, estrellas, verde, muestras: S.muestrasDia });
    S.historial.push(...S.historialIntento);
    const ant = S.metricas.anticipa - S.metricasDia.anticipa;
    const rea = S.metricas.reacciona - S.metricasDia.reacciona;
    const decision = adaptar(verde, ant, rea);

    $("fin-dia-titulo").textContent = L(`¡Día ${S.dia} completado!`, `Day ${S.dia} complete!`);
    $("fin-dia-estrellas").innerHTML = [0, 1, 2].map((i) =>
      `<span class="estrella-pop" style="animation-delay:${0.2 + i * 0.25}s">${i < estrellas ? "★" : "☆"}</span>`).join("");
    $("fin-verde").textContent = Math.round(verde * 100) + "%";
    $("fin-muestras").textContent = S.muestrasDia;
    $("fin-ciencia").textContent = Math.floor(S.ciencia);
    $("fin-dia-texto").textContent = decision.mensaje;
    $("btn-siguiente-dia").textContent = S.dia < DIAS ? L(`Ir al día ${S.dia + 1}`, `Go to day ${S.dia + 1}`) : L("Ver cómo te fue", "See how you did");
    pintarHud();
    mostrarPantalla("pantalla-fin-dia");
    Sonido.exito();
    confeti();
    Voz.hablar(L(`Día ${S.dia} completado. Ganaste ${estrellas} estrellas. ${decision.mensaje}`, `Day ${S.dia} complete. You earned ${estrellas} stars. ${decision.mensaje}`));
  }

  // Aprendizaje adaptativo: ajusta el día siguiente según cómo jugó este.
  function adaptar(verde, anticipa, reacciona) {
    const total = anticipa + reacciona;
    const ratio = total ? anticipa / total : 0.5;
    let mensaje, nota;
    if (S.dia >= DIAS) {
      nota = L("Último día: sin ajuste.", "Last day: no adjustment.");
      mensaje = L("¡Terminaste los tres días!", "You finished all three days!");
    } else if (ratio >= 0.6 && verde >= 0.7) {
      if (S.nivel === 1) {
        S.nivel = 2;
        S.tanques.co2 = 30;
        S.necesitaGuiaCO2 = true;
        nota = L("Anticipa y mantiene el equilibrio → sube a 3 tanques y 2 máquinas (nivel Ingeniero).", "Anticipates and keeps the balance → moves up to 3 tanks and 2 machines (Engineer level).");
        mensaje = L("Lo hiciste muy bien. Mañana también vas a cuidar el CO₂.", "You did really well. Tomorrow you’ll also look after the CO₂.");
      } else {
        S.velocidad = Math.min(1.5, S.velocidad * 1.15);
        S.pistas = false;
        nota = L("Anticipa y mantiene el equilibrio → más velocidad y sin avisos tempranos.", "Anticipates and keeps the balance → faster pace and no early warnings.");
        mensaje = L("Lo hiciste muy bien. Mañana todo irá un poco más rápido y te avisaré menos.", "You did really well. Tomorrow everything will go a bit faster and I’ll warn you less.");
      }
    } else if (ratio < 0.4 || verde < 0.5) {
      S.velocidad = Math.max(0.7, S.velocidad * 0.85);
      S.pistas = true;
      nota = L("Reacciona tarde o pasa poco tiempo en verde → ritmo más lento y avisos tempranos.", "Reacts late or spends little time in green → slower pace and early warnings.");
      mensaje = L("Consejo para mañana: enciende las máquinas antes de que el tanque se ponga amarillo. Te avisaré antes.", "Tip for tomorrow: turn on the machines before the tank turns yellow. I’ll warn you earlier.");
    } else {
      nota = L("Desempeño intermedio → mismo ritmo.", "Average performance → same pace.");
      mensaje = L("¡Buen trabajo! Mañana seguimos al mismo ritmo.", "Good job! Tomorrow we’ll keep the same pace.");
    }
    S.registroAdaptacion.push({ dia: S.dia, nota: L(`Verde ${Math.round(verde * 100)} %, anticipó ${anticipa}, reaccionó tarde ${reacciona}. ${nota}`, `Green ${Math.round(verde * 100)}%, anticipated ${anticipa}, reacted late ${reacciona}. ${nota}`) });
    return { mensaje };
  }

  function siguiente() {
    Sonido.iniciar();
    if (S.dia < DIAS) {
      const n = S.dia + 1;
      if (S.necesitaGuiaCO2) {
        S.necesitaGuiaCO2 = false;
        iniciarDia(n);
        ejecutarGuia([
          { objetivo: "tq-co2", congela: true, texto: TEXTO_CO2 },
          { objetivo: "mq-limp", congela: true, texto: L("El limpiador quita el CO₂ del aire.", "The air cleaner removes CO₂ from the air.") },
          { objetivo: "bateria", congela: true, texto: L("Ahora la energía alcanza para dos máquinas a la vez.", "Now there’s enough energy for two machines at once."), textoBoton: L("¡Empezar!", "Start!") }
        ], () => { ultimoCuadro = performance.now(); });
      } else iniciarDia(n);
    } else mostrarRepaso();
  }

  // ---------------------------------------------------------
  // 13. REPASO FINAL
  // ---------------------------------------------------------
  function mostrarRepaso() {
    S.modo = "fin";
    $("btn-pausa").hidden = true;
    const total = S.estrellasDias.reduce((a, b) => a + b, 0);
    $("repaso-resumen").textContent =
      L(`La tripulación pasó 3 días más en LUNIA, sana y salva. Ganaste ${Math.floor(S.ciencia)} puntos de ciencia y ${total} de ${DIAS * 3} estrellas.`, `The crew spent 3 more days at LUNIA, safe and sound. You earned ${Math.floor(S.ciencia)} science points and ${total} of ${DIAS * 3} stars.`) +
      (S.dilemaAceptado === true ? L(" También saliste a buscar la roca especial.", " You also went out to get the special rock.") :
       S.dilemaAceptado === false ? L(" Decidiste cuidar el oxígeno en vez de salir: también es una buena decisión.", " You chose to save oxygen instead of going out: that’s a good decision too.") : "");
    construirTusDias();
    construirReflexion();
    construirAdaptacion();
    guardarResultado();
    mostrarPantalla("pantalla-repaso");
    Voz.hablar(L("¡Misión cumplida! ", "Mission accomplished! ") + $("repaso-resumen").textContent);
  }

  // Resumen visual por día: estrellas, cara de la tripulación, tiempo en verde y rocas.
  function construirTusDias() {
    const cont = $("tus-dias");
    cont.innerHTML = "";
    S.resumenDias.forEach((r) => {
      const animo = r.verde >= 0.6 ? "bien" : r.verde >= 0.3 ? "atencion" : "peligro";
      const boca = { bien: "M30 44 Q40 52 50 44", atencion: "M30 46 L50 46", peligro: "M30 50 Q40 42 50 50" }[animo];
      const borde = { bien: "#3ddc97", atencion: "#ffb020", peligro: "#ff5c6c" }[animo];
      const frase = L({ bien: "La tripulación estuvo tranquila.", atencion: "Hubo algunos sustos.", peligro: "Fue un día difícil." }, { bien: "The crew was calm.", atencion: "There were a few scares.", peligro: "It was a tough day." })[animo];
      const rocas = r.muestras ? "🪨".repeat(Math.min(r.muestras, 8)) : "—";
      const div = document.createElement("div");
      div.className = "dia-card";
      div.innerHTML = `
        <h4>${L("Día", "Day")} ${r.dia}</h4>
        <div class="estrellas-dia" aria-label="${r.estrellas} ${L("estrellas", "stars")}">${"★".repeat(r.estrellas)}${"☆".repeat(3 - r.estrellas)}</div>
        <svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="38" r="30" fill="#f6f8ff" stroke="${borde}" stroke-width="5"/>
          <ellipse cx="40" cy="38" rx="21" ry="17" fill="#26306a"/><circle cx="33" cy="34" r="3" fill="#fff"/><circle cx="47" cy="34" r="3" fill="#fff"/>
          <path d="${boca}" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>
        <span>${frase}</span>
        <div class="barra-verde" role="img" aria-label="${L(`Todo en verde el ${Math.round(r.verde * 100)} % del día`, `All green ${Math.round(r.verde * 100)}% of the day`)}"><i style="width:${Math.round(r.verde * 100)}%"></i></div>
        <span class="etiqueta-chica">${L("Todo en verde", "All green")}: ${Math.round(r.verde * 100)} %</span>
        <div class="rocas" aria-label="${r.muestras} ${L("rocas recogidas", "rocks collected")}">${rocas}</div>
        <span class="etiqueta-chica">${r.muestras} ${r.muestras === 1 ? L("roca recogida", "rock collected") : L("rocas recogidas", "rocks collected")}</span>`;
      cont.appendChild(div);
    });
  }

  function construirReflexion() {
    const cont = $("reflexion");
    cont.innerHTML = "";
    $("reflexion-respuesta").textContent = "";
    REFLEXION.slice().sort(() => Math.random() - 0.5).forEach((op) => {
      const b = document.createElement("button");
      b.className = "opcion";
      b.textContent = op.texto;
      b.addEventListener("click", () => {
        Sonido.iniciar();
        b.classList.add(op.correcta ? "correcta" : "incorrecta");
        $("reflexion-respuesta").textContent = op.respuesta;
        Voz.hablar(op.respuesta);
        if (op.correcta) { Sonido.exito(); if (!S.reflexionHecha) { S.reflexionHecha = true; S.ciencia += 10; pintarHud(); } }
        else Sonido.error();
      });
      cont.appendChild(b);
    });
  }

  function construirAdaptacion() {
    const filas = S.registroAdaptacion.map((r) => `<tr><td>${L("Día", "Day")} ${r.dia}</td><td>${r.nota}</td></tr>`).join("");
    $("adaptacion-detalle").innerHTML = EN ? `
      <p>Starting level: <strong>${NIVELES[nivelInicial].nombre}</strong> (from the profile test). Final level: <strong>${NIVELES[S.nivel].nombre}</strong>.</p>
      <p>The mission quietly measures whether the player <em>anticipates</em> (turns on a machine while the tank is still OK)
      or <em>reacts late</em> (when it’s already in danger), and how long they keep the tanks green. With that it adjusts
      the next day: number of systems, speed and LUNIA’s warnings (stealth assessment, Shute; scaffolding that is
      removed, Wood, Bruner and Ross, 1976). The guided practice, the voice and the icons follow Universal Design for
      Learning (CAST, 2024).</p>
      <table><thead><tr><th>Day</th><th>What happened and what was adjusted</th></tr></thead><tbody>${filas}</tbody></table>
      <p class="nota">Total: anticipated ${S.metricas.anticipa} times, reacted late ${S.metricas.reacciona} times, ${S.intentos} retries, ${S.muestrasTotal} samples.</p>
      <h4>Real data used in the mission</h4>
      <ul class="fuentes-lista">${FICHAS.map((f) => `<li><strong>${f.titulo}.</strong> ${f.texto} <em>${f.url ? `<a href="${f.url}" target="_blank" rel="noopener">${f.fuente}</a>` : f.fuente}</em></li>`).join("")}</ul>` : `
      <p>Nivel inicial: <strong>${NIVELES[nivelInicial].nombre}</strong> (del test de perfil). Nivel final: <strong>${NIVELES[S.nivel].nombre}</strong>.</p>
      <p>La misión mide en silencio si el jugador <em>anticipa</em> (enciende una máquina cuando el tanque aún está bien)
      o <em>reacciona tarde</em> (cuando ya está en peligro), y cuánto tiempo mantiene los tanques en verde. Con eso ajusta
      el día siguiente: número de sistemas, velocidad y avisos de LUNIA (evaluación invisible, Shute; andamiaje que se
      retira, Wood, Bruner y Ross, 1976). La práctica guiada, la voz y los íconos siguen el Diseño Universal para el
      Aprendizaje (CAST, 2024).</p>
      <table><thead><tr><th>Día</th><th>Qué pasó y qué se ajustó</th></tr></thead><tbody>${filas}</tbody></table>
      <p class="nota">Total: anticipó ${S.metricas.anticipa} veces, reaccionó tarde ${S.metricas.reacciona} veces, ${S.intentos} reintentos, ${S.muestrasTotal} muestras.</p>
      <h4>Datos reales usados en la misión</h4>
      <ul class="fuentes-lista">${FICHAS.map((f) => `<li><strong>${f.titulo}.</strong> ${f.texto} <em>${f.url ? `<a href="${f.url}" target="_blank" rel="noopener">${f.fuente}</a>` : f.fuente}</em></li>`).join("")}</ul>`;
  }

  function guardarResultado() {
    almacen.guardar("equilibria.mision.soporteVital", {
      completada: true, fecha: new Date().toISOString(),
      ciencia: Math.floor(S.ciencia), estrellas: S.estrellasDias,
      nivelInicial, nivelFinal: S.nivel,
      anticipa: S.metricas.anticipa, reacciona: S.metricas.reacciona,
      reintentos: S.intentos, muestras: S.muestrasTotal, dilema: S.dilemaAceptado
    });
  }

  // ---------------------------------------------------------
  // 14. CONFETI
  // ---------------------------------------------------------
  function confeti() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = $("confeti");
    const ctx = cv.getContext("2d");
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const colores = ["#4fd1ff", "#ffc94d", "#3ddc97", "#c59bff", "#ff8a3d"];
    const piezas = Array.from({ length: 120 }, () => ({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.4,
      vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
      r: 4 + Math.random() * 5, c: azar(colores), a: Math.random() * Math.PI
    }));
    const inicio = performance.now();
    (function cuadro(ahora) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      piezas.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.a += 0.1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore();
      });
      if (ahora - inicio < 2600) requestAnimationFrame(cuadro);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    })(inicio);
  }

  // ---------------------------------------------------------
  // 15. CONTROLES
  // ---------------------------------------------------------
  function pausar() {
    if (!["practica", "dia"].includes(S.modo)) return;
    S.modoPrevio = S.modo;
    S.modo = "pausa";
    $("modal-pausa").hidden = false;
    $("btn-reanudar").focus();
  }
  function reanudar() {
    if (S.modo !== "pausa" || !$("modal-dilema").hidden) return;
    $("modal-pausa").hidden = true;
    S.modo = S.modoPrevio;
    ultimoCuadro = performance.now();
  }

  function activarVozPorNivel() {
    const quiere = prefs.voz === null ? NIVELES[nivelInicial].voz : prefs.voz;
    ponerVoz(quiere && "speechSynthesis" in window);
  }
  function ponerVoz(on) {
    Voz.activa = on;
    if (!on) Voz.callar();
    $("btn-voz").setAttribute("aria-pressed", String(on));
    $("btn-voz").firstChild.textContent = on ? "🗣️" : "🔇";
    $("btn-voz").title = on ? L("Voz activada", "Voice on") : L("Leer en voz alta", "Read aloud");
  }
  function ponerSonido(on) {
    prefs.sonido = on;
    $("btn-sonido").setAttribute("aria-pressed", String(on));
    $("btn-sonido").firstChild.textContent = on ? "🔊" : "🔈";
  }

  document.querySelectorAll(".maquina").forEach((el) => {
    const clave = el.dataset.maquina;
    el.addEventListener("click", () => alternarMaquina(clave));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternarMaquina(clave); } });
  });

  document.addEventListener("keydown", (e) => {
    if (!S) return;
    const enMaquina = e.target.classList && e.target.classList.contains("maquina");
    if (e.key === " " && !enMaquina && e.target.tagName !== "BUTTON" && ["practica", "dia", "pausa"].includes(S.modo) && !S.guia) {
      e.preventDefault();
      S.modo === "pausa" ? reanudar() : pausar();
      return;
    }
    const idx = { "1": 0, "2": 1, "3": 2 }[e.key];
    if (idx !== undefined) {
      const clave = maquinasActivas()[idx];
      if (clave) alternarMaquina(clave);
    }
  });

  function marcarNivel() {
    document.querySelectorAll("[data-nivel]").forEach((b) => {
      const sel = Number(b.dataset.nivel) === nivelInicial;
      b.classList.toggle("elegido", sel);
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(sel));
    });
  }
  document.querySelectorAll("[data-nivel]").forEach((b) => b.addEventListener("click", () => { nivelInicial = Number(b.dataset.nivel); marcarNivel(); }));

  $("btn-empezar-practica").addEventListener("click", iniciarPractica);
  $("btn-continuar-practica").addEventListener("click", () => { Sonido.iniciar(); cerrarGuia(); iniciarDia(1, { guiar: true }); });
  $("btn-siguiente-dia").addEventListener("click", siguiente);
  $("btn-reintentar").addEventListener("click", reintentarDia);
  $("btn-dilema-si").addEventListener("click", () => cerrarDilema(true));
  $("btn-dilema-no").addEventListener("click", () => cerrarDilema(false));
  $("btn-pausa").addEventListener("click", pausar);
  $("btn-reanudar").addEventListener("click", reanudar);
  $("btn-repetir").addEventListener("click", () => { const v = Voz.activa; Voz.activa = true; Voz.hablar($("mensaje-lunia").textContent); Voz.activa = v; });
  $("btn-voz").addEventListener("click", () => { Sonido.iniciar(); prefs.voz = !Voz.activa; almacen.guardar("equilibria.preferencias", prefs); ponerVoz(prefs.voz); if (prefs.voz) Voz.hablar(L("Voz activada.", "Voice on.")); });
  $("btn-sonido").addEventListener("click", () => { Sonido.iniciar(); ponerSonido(!prefs.sonido); almacen.guardar("equilibria.preferencias", prefs); Sonido.encender(); });
  $("btn-jugar-otra").addEventListener("click", () => {
    nuevaPartida();
    $("btn-pausa").hidden = true;
    pintarHud();
    mostrarPantalla("pantalla-encargo");
  });

  // Arranque
  nuevaPartida();
  construirCielo();
  construirTripulacion();
  construirParticulas();
  marcarNivel();
  ponerSonido(prefs.sonido);
  activarVozPorNivel();
  if (!("speechSynthesis" in window)) $("btn-voz").hidden = true;
  pintarHud();
  ultimoCuadro = performance.now();
  requestAnimationFrame(bucle);

  // Solo para pruebas automáticas
  window.__mision1 = { estado: () => S, NIVELES, MAQUINAS };
})();
