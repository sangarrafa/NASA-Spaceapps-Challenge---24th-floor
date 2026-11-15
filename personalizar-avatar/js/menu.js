/* Menú del taller de trajes: arma el avatar y lo guarda para el resto del juego. */
(function () {
  const A = window.EqAvatar;
  const $ = (id) => document.getElementById(id);
  let cfg = A.cargar() || A.sugerido();

  /* ---------- Audio ---------- */
  const sndAmbiente = new Audio('audio/ambiente.wav');
  sndAmbiente.loop = true;
  sndAmbiente.volume = 0.35;
  const sndCambio = new Audio('audio/cambio.wav');
  sndCambio.volume = 0.05;

  function iniciarAudio() {
    sndAmbiente.play().catch(() => {});
    document.removeEventListener('pointerdown', iniciarAudio);
    document.removeEventListener('keydown', iniciarAudio);
  }
  // El audio ambiental inicia con la primera interacción del usuario (política de navegadores)
  document.addEventListener('pointerdown', iniciarAudio, { once: true });
  document.addEventListener('keydown', iniciarAudio, { once: true });

  function reproducirCambio() {
    sndCambio.currentTime = 0;
    sndCambio.play().catch(() => {});
  }

  function triggerSalto() {
    const v = $('vista');
    v.classList.remove('salta', 'pop');
    void v.offsetWidth; // reflow para reiniciar la animación
    v.classList.add('salta');
    v.addEventListener('animationend', () => v.classList.remove('salta'), { once: true });
    if (window.EqAvatarFisicas) window.EqAvatarFisicas.saltar(cfg.acento);
  }

  const MENSAJES = {
    traje: { clasico: 'El traje Clásico: resistente y probado en campo.', ligero: 'El traje Ágil: ideal para moverse rápido.', blindado: 'El Blindado aguanta cualquier impacto.', piloto: 'El traje Piloto, perfecto para la cabina.' },
    gesto: { alegre: 'Esa sonrisa levanta la moral de toda la tripulación.', serio: 'Concentración total. Así se hacen las misiones.', decidido: 'Esa mirada dice: objetivo cumplido.', rabioso: 'Energía al máximo. Nada nos detiene.' },
    cabello: '¡Perfecto para el casco, Astronauta!', acento: '¡Ese color te identifica en toda la base!', insignias: '¡Insignia asignada!'
  };

  /* ---------- Vista previa ---------- */
  function pintar(animar) {
    const v = $('vista');
    v.innerHTML = A.svg(cfg, { clase: 'grande', etiqueta: 'Vista previa de tu astronauta' });
    if (animar) { v.classList.remove('pop'); void v.offsetWidth; v.classList.add('pop'); }
    document.documentElement.style.setProperty('--acento', cfg.acento);
    $('bCasco').setAttribute('aria-pressed', String(cfg.casco));
    $('contador').textContent = `${cfg.insignias.length} de ${A.MAX_INSIGNIAS}`;
    actualizarBotones();
    refrescarMiniaturas();
  }

  /* ---------- Botones de cada grupo ---------- */
  function contenidoBoton(grupo, op, vista) {
    if (grupo === 'acento' || grupo === 'piel' || grupo === 'colorCabello') return `<span class="muestra" style="--m:${op.id}"></span><span class="nom">${op.nombre}</span>`;
    if (grupo === 'insignias') {
      const tmp = A.svg(Object.assign({}, cfg, { insignias: [op.id] }), { fondo: false });
      // Solo la insignia: se recorta con un viewBox alrededor del pecho
      return `<span class="mini-insignia">${tmp.replace(/viewBox="[^"]+"/, 'viewBox="4 -138 24 24"')}</span><span class="nom">${op.nombre}</span>`;
    }
    if (vista) return `<span class="mini" data-mini="${op.id}"></span><span class="nom">${op.nombre}</span>${op.desc ? `<span class="desc">${op.desc}</span>` : ''}`;
    return `<span class="nom">${op.nombre}</span>`;
  }

  function construir() {
    document.querySelectorAll('[data-grupo]').forEach((cont) => {
      const grupo = cont.dataset.grupo, vista = cont.dataset.vista;
      cont.innerHTML = '';
      cont.setAttribute('role', 'group');
      A.OPCIONES[grupo].forEach((op) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'eleccion';
        b.dataset.valor = op.id;
        b.setAttribute('aria-label', op.nombre);
        b.innerHTML = contenidoBoton(grupo, op, vista);
        b.onclick = () => elegir(grupo, op.id);
        cont.appendChild(b);
      });
    });
  }

  function actualizarBotones() {
    document.querySelectorAll('[data-grupo]').forEach((cont) => {
      const grupo = cont.dataset.grupo;
      cont.querySelectorAll('.eleccion').forEach((b) => {
        const activo = grupo === 'insignias' ? cfg.insignias.includes(b.dataset.valor) : cfg[grupo] === b.dataset.valor;
        b.setAttribute('aria-pressed', String(activo));
        if (grupo === 'insignias') {
          const pos = cfg.insignias.indexOf(b.dataset.valor);
          b.dataset.orden = pos >= 0 ? String(pos + 1) : '';
        }
      });
    });
  }

  /* Las miniaturas muestran cada opción con el resto del avatar actual. */
  function refrescarMiniaturas() {
    document.querySelectorAll('[data-vista]').forEach((cont) => {
      const grupo = cont.dataset.grupo, recorte = cont.dataset.vista === 'cabeza' ? 'cabeza' : null;
      cont.querySelectorAll('[data-mini]').forEach((m) => {
        const c = Object.assign({}, cfg, { [grupo]: m.dataset.mini, casco: false });
        if (grupo === 'traje') c.casco = cfg.casco;
        m.innerHTML = A.svg(c, { recorte, fondo: false });
      });
    });
    // Las insignias usan el color de énfasis actual
    document.querySelectorAll('[data-grupo="insignias"] .eleccion').forEach((b) => {
      const op = A.OPCIONES.insignias.find((o) => o.id === b.dataset.valor);
      b.innerHTML = contenidoBoton('insignias', op);
    });
  }

  function decir(texto) { if (texto) $('mensaje').textContent = texto; }

  function elegir(grupo, valor) {
    if (grupo === 'insignias') {
      const i = cfg.insignias.indexOf(valor);
      if (i >= 0) cfg.insignias = cfg.insignias.filter((x) => x !== valor);
      else if (cfg.insignias.length < A.MAX_INSIGNIAS) cfg.insignias = cfg.insignias.concat(valor);
      else { decir(`Ya tienes ${A.MAX_INSIGNIAS} insignias. Toca una de las tuyas para quitarla.`); return; }
      decir(i >= 0 ? 'Insignia guardada en el cajón.' : MENSAJES.insignias);
    } else {
      cfg[grupo] = valor;
      const m = MENSAJES[grupo];
      decir(typeof m === 'string' ? m : m && m[valor]);
    }
    reproducirCambio();
    pintar(false);
    triggerSalto();
  }

  /* ---------- Pestañas ---------- */
  const pestanas = [...document.querySelectorAll('[role="tab"]')];
  function abrir(tab) {
    pestanas.forEach((t) => {
      const sel = t === tab;
      t.setAttribute('aria-selected', String(sel));
      t.tabIndex = sel ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !sel;
    });
  }
  pestanas.forEach((t, i) => {
    t.onclick = () => abrir(t);
    t.onkeydown = (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const sig = pestanas[(i + d + pestanas.length) % pestanas.length];
      abrir(sig); sig.focus();
    };
  });

  /* ---------- Pantalla 2: elección de traje ---------- */
  function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach((s) => s.hidden = s.id !== id);
    if (id === 'pantalla-traje') refrescarTraje();
  }

  function refrescarTraje() {
    document.querySelectorAll('#pantalla-traje [data-grupo="traje"] .eleccion').forEach((b) => {
      b.setAttribute('aria-pressed', String(cfg.traje === b.dataset.valor));
    });
  }

  $('bSiguiente').onclick = () => { mostrarPantalla('pantalla-traje'); window.scrollTo(0,0); };

  /* ---------- Botones generales ---------- */
  const azar = (lista) => lista[Math.floor(Math.random() * lista.length)].id;
  $('bAzar').onclick = () => {
    const O = A.OPCIONES;
    const ins = O.insignias.map((o) => o.id).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
    cfg = Object.assign({}, cfg, { traje: azar(O.traje), acento: azar(O.acento), insignias: ins,
      gesto: azar(O.gesto), genero: azar(O.genero), piel: azar(O.piel), cabello: azar(O.cabello), colorCabello: azar(O.colorCabello) });
    decir('¡Sorpresa! ¿Qué tal este astronauta?');
    reproducirCambio();
    pintar(false);
    triggerSalto();
  };
  $('bCasco').onclick = () => { cfg.casco = !cfg.casco; decir(cfg.casco ? 'Casco puesto: listo para salir.' : 'Sin casco, solo dentro de la base.'); reproducirCambio(); pintar(false); triggerSalto(); };

  // Botón "¡Listo, a la misión!" (#bGuardar): por ahora sin acción enlazada.
  // Cuando se defina a dónde lleva, conectar aquí, p. ej.: $('bGuardar').onclick = () => { A.guardar(cfg); … };

  // Nombre del astronauta (del test) y una pista según su especialidad
  $('placaNombre').textContent = A.nombre().toUpperCase();
  try {
    const p = JSON.parse(localStorage.getItem('equilibria:perfil'));
    if (p && p.especialidad) $('notaColor').textContent = `Sugerencia: el color de tu especialidad, ${p.especialidad.nombre}.`;
  } catch (e) {}

  construir();
  // Conectar los botones de traje de la segunda pantalla para actualizar el mensaje de Ríos
  document.querySelectorAll('#pantalla-traje [data-grupo="traje"] .eleccion').forEach((b) => {
    const orig = b.onclick;
    b.onclick = () => { orig && orig(); $('mensaje-traje').textContent = MENSAJES.traje[b.dataset.valor] || ''; refrescarTraje(); };
  });
  abrir(pestanas[0]);
  pintar(false);
})();
