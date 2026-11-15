(() => {
const $ = (id) => document.getElementById(id);
const L = window.EqLang ? window.EqLang.L : (es) => es;
const PREGUNTAS = window.EQ_PREGUNTAS;
const ESP = window.EQ_ESPECIALIDADES;
const REACCIONES = window.EQ_REACCIONES;

/* Adónde va el botón "Ir a la misión". Se puede cambiar con ?siguiente=ruta */
const SIGUIENTE = new URLSearchParams(location.search).get('siguiente') || '../../personalizar-avatar/index.html';
const DEPURAR = new URLSearchParams(location.search).has('debug');
const PAUSA_REACCION = 2000;
const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

let nombre = '';
let indice = 0;
let respuestas = [];
let bolsaReacciones = [];
let ultimaReaccion = '';
let bloqueado = false;
let voz = true;

/* ---------- Pantallas ---------- */
function mostrar(id) {
  document.querySelectorAll('.pantalla').forEach((p) => p.classList.remove('activa'));
  $(id).classList.add('activa');
  const foco = $(id).querySelector('h1, h2');
  if (foco) { foco.tabIndex = -1; foco.focus({ preventScroll: true }); }
}

/* ---------- Voz de la Comandante (voz.js) ---------- */
// Devuelve una promesa que se cumple cuando Ríos termina de hablar (o de inmediato si la voz está apagada)
const decir = (texto) => (voz ? window.EqVoz.decir(texto) : Promise.resolve());
// El punto separa el título del enunciado, salvo que el título ya termine en signo ("¿Cómo te sientes?")
const textoHablado = (p) => `${p.titulo}${/[.!?…]$/.test(p.titulo) ? '' : '.'} ${p.texto}`;

$('bLeer').onclick = () => {
  voz = !voz;
  window.EqVoz.activa = voz;
  $('bLeer').setAttribute('aria-pressed', String(voz));
  if (voz) decir(textoHablado(PREGUNTAS[indice]));
};
$('bEscuchar').onclick = () => decir(`${$('tBienvenida').textContent} ${$('saludo').textContent}`);

/* ---------- Volumen de la música de fondo: de 0 (silencio) a 1 (máximo) ---------- */
const VOLUMEN_MUSICA = 0.05;

/* ---------- Sonido al responder ---------- */
const sonidoRespuesta = new Audio('audio/respuesta.wav');
sonidoRespuesta.preload = 'auto';
sonidoRespuesta.volume = 0.7;
function sonarRespuesta() {
  try { sonidoRespuesta.currentTime = 0; sonidoRespuesta.play().catch(() => {}); } catch (e) {}
}

/* ---------- Sonido ambiental y efecto de revelación ----------
   El ambiente suena al 5 % durante todo el cuestionario, en bucle, y se corta
   cuando suena el efecto final (al empezar a despejarse las nubes). */
const ambiente = new Audio('audio/ambiente.wav');
ambiente.loop = true;
ambiente.volume = VOLUMEN_MUSICA;
ambiente.preload = 'auto';
const efectoFinal = new Audio('audio/revelacion.wav');
efectoFinal.preload = 'auto';
function iniciarAmbiente() {
  try { ambiente.currentTime = 0; ambiente.play().catch(() => {}); } catch (e) {}
}
function detenerAmbiente() { try { ambiente.pause(); } catch (e) {} }
function sonarEfectoFinal() {
  detenerAmbiente();
  try { efectoFinal.currentTime = 0; efectoFinal.play().catch(() => {}); } catch (e) {}
}

/* ---------- Bienvenida ---------- */
// No se pide el nombre: al astronauta siempre se le llama "Astronauta"

$('bEmpezar').onclick = () => {
  iniciarAmbiente();
  nombre = L('Astronauta', 'Astronaut');
  indice = 0; respuestas = [];
  window.EqPersonajes.silueta.montar($('silueta'));
  $('porcentaje').textContent = '0';
  $('pistaSilueta').textContent = L('Cada respuesta revela una parte de tu personaje.', 'Each answer reveals part of your character.');
  mostrar('pPregunta');
  pintarPregunta();
};

/* ---------- Preguntas ---------- */
function pintarProgreso() {
  $('progreso').innerHTML = PREGUNTAS.map((_, i) =>
    `<span class="punto ${i < indice ? 'hecho' : i === indice ? 'actual' : ''}"></span>`).join('');
}

function pintarPregunta() {
  const p = PREGUNTAS[indice];
  pintarProgreso();
  $('numPrueba').textContent = L(`PRUEBA ${p.n} DE ${PREGUNTAS.length}`, `TEST ${p.n} OF ${PREGUNTAS.length}`);
  $('tituloPrueba').textContent = p.titulo;
  proyectar(p);
  const cont = $('opciones');
  cont.innerHTML = '';
  cont.setAttribute('aria-label', p.titulo);
  p.opciones.forEach((o, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opcion';
    b.innerHTML = `<span class="tecla" aria-hidden="true">${i + 1}</span><span class="emoji" aria-hidden="true">${o.e}</span><span class="texto"></span>`;
    b.querySelector('.texto').textContent = o.t;
    b.onclick = () => responder(i, b);
    cont.appendChild(b);
  });
  bloqueado = false;
  decir(textoHablado(p));
}

/* Escena animada (escenas.js) y pregunta "proyectada" letra por letra. */
let temporizadorTexto = null;
function proyectar(p) {
  const hay = window.EqEscenas && window.EqEscenas.tiene(p.id);
  const cont = $('escena');
  cont.hidden = !hay;
  cont.innerHTML = hay ? window.EqEscenas.svg(p.id) : '';
  const P = window.EqProfundidad;
  if (P && P.activo) { if (hay) P.escena.montar(cont, p.id); else P.escena.desmontar(); }
  const el = $('enunciado');
  el.classList.toggle('holograma', hay);
  clearInterval(temporizadorTexto);
  if (!hay || reducirMovimiento) { el.textContent = p.texto; return; }
  el.setAttribute('aria-label', p.texto);
  el.innerHTML = '<span class="escrito"></span><span class="por-escribir"></span>';
  const escrito = el.firstChild, resto = el.lastChild;
  resto.textContent = p.texto; // reserva el espacio para que nada salte
  let n = 0;
  temporizadorTexto = setInterval(() => {
    n += 1;
    escrito.textContent = p.texto.slice(0, n);
    resto.textContent = p.texto.slice(n);
    if (n >= p.texto.length) clearInterval(temporizadorTexto);
  }, 34);
}

/* El personaje secreto se llena 10 % por respuesta. */
const PISTAS = L({ 1: 'Algo empieza a brillar...', 3: '¡Ya se ven sus botas!', 5: '¡Vas por la mitad!',
  7: 'Ya casi se ve quién es...', 9: '¡Falta solo una respuesta!', 10: '¡Listo para la gran revelación!' },
  { 1: 'Something is starting to glow...', 3: 'You can see its boots!', 5: 'You’re halfway there!',
  7: 'You can almost see who it is...', 9: 'Just one answer left!', 10: 'Ready for the big reveal!' });
function llenarSilueta() {
  const n = respuestas.length;
  window.EqPersonajes.silueta.fijar(n / PREGUNTAS.length);
  $('porcentaje').textContent = String(Math.round((n / PREGUNTAS.length) * 100));
  if (PISTAS[n]) $('pistaSilueta').textContent = PISTAS[n];
}

/* Bolsa barajada: no repite una reacción hasta haber usado todas. */
function reaccionAlAzar() {
  if (!bolsaReacciones.length) {
    bolsaReacciones = REACCIONES.slice();
    for (let i = bolsaReacciones.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bolsaReacciones[i], bolsaReacciones[j]] = [bolsaReacciones[j], bolsaReacciones[i]];
    }
    if (bolsaReacciones[bolsaReacciones.length - 1] === ultimaReaccion) bolsaReacciones.unshift(bolsaReacciones.pop());
  }
  ultimaReaccion = bolsaReacciones.pop();
  return ultimaReaccion;
}

function responder(i, boton) {
  if (bloqueado) return;
  bloqueado = true;
  const p = PREGUNTAS[indice];
  const o = p.opciones[i];
  respuestas.push({ n: p.n, capa: p.capa, id: p.id, opcion: i, emoji: o.e, valor: o.v });
  boton.classList.add('elegida');
  sonarRespuesta();
  llenarSilueta();
  $('opciones').querySelectorAll('button').forEach((b) => { b.disabled = true; });

  const ultima = indice === PREGUNTAS.length - 1;
  const texto = ultima ? L('¡Listo! Ya tengo tu expediente completo.', 'Done! Your file is complete.') : reaccionAlAzar();
  const r = $('reaccion');
  r.innerHTML = `<span class="quien">${L('Comandante Ríos', 'Commander Ríos')}</span><span class="txt"></span>`;
  r.querySelector('.txt').textContent = texto;
  r.classList.add('on');

  // La pregunta siguiente espera a que Ríos termine su reacción, para no cortarla a la mitad.
  // Se queda al menos la pausa de siempre y como máximo 8 s, por si la voz del navegador se traba.
  const pausa = reducirMovimiento ? PAUSA_REACCION + 300 : PAUSA_REACCION;
  const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
  Promise.race([Promise.all([decir(texto), esperar(pausa)]), esperar(8000)]).then(() => {
    r.classList.remove('on');
    if (ultima) terminar();
    else { indice += 1; pintarPregunta(); }
  });
}

document.addEventListener('keydown', (e) => {
  if (!$('pPregunta').classList.contains('activa') || bloqueado) return;
  const n = parseInt(e.key, 10);
  const botones = $('opciones').querySelectorAll('button');
  if (n >= 1 && n <= botones.length) botones[n - 1].click();
});

/* ---------- Cálculo, desempate y resultado ---------- */
function terminar() {
  if (window.EqProfundidad && window.EqProfundidad.activo) window.EqProfundidad.escena.desmontar();
  const c = window.EquilibriaPerfil.calcular(respuestas);
  if (c.empatadas.length > 1) mostrarEmpate(c.empatadas);
  else finalizar(null);
}

function mostrarEmpate(letras) {
  const cont = $('empateOpciones');
  cont.innerHTML = '';
  letras.forEach((l) => {
    const e = ESP[l];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'insignia-boton';
    b.style.setProperty('--c', e.color);
    b.innerHTML = `<span class="insignia">${e.icono}</span><span class="nom"></span><span class="lem"></span>`;
    b.querySelector('.nom').textContent = e.nombre;
    b.querySelector('.lem').textContent = e.lema;
    b.onclick = () => finalizar(l);
    cont.appendChild(b);
  });
  const cuantos = letras.length === 2 ? L('dos', 'two') : L('tres', 'three');
  const frase = L(`¡Tienes ${cuantos} súper habilidades! ¿Con cuál quieres empezar?`, `You have ${cuantos} superpowers! Which one do you want to start with?`);
  $('tEmpate').textContent = frase;
  mostrar('pEmpate');
  decir(frase);
}

function finalizar(eleccionEmpate) {
  const perfil = window.EquilibriaPerfil.construir({ nombre, respuestas, eleccionEmpate });
  window.EquilibriaPerfil.guardar(perfil);
  const e = ESP[perfil.especialidad.id];

  // Solo la especialidad: el riesgo y el apoyo nunca se muestran al niño.
  $('insignia').textContent = e.icono;
  $('insignia').style.setProperty('--c', e.color);
  $('lema').textContent = `${e.lema} ${e.descripcion}`;
  $('mensajeLunia').textContent = e.lunia;

  if (DEPURAR) {
    $('depuracion').hidden = false;
    $('depuracion').textContent = 'Perfil (solo para el equipo, ?debug):\n' + JSON.stringify({
      especialidad: perfil.especialidad, oculto: perfil.oculto,
      adaptacion: perfil.adaptacion, declarado: perfil.declarado }, null, 2);
  }

  // La gran revelación: tocar rápido para despejar el vapor.
  $('kickerResultado').textContent = L('LA GRAN REVELACIÓN', 'THE BIG REVEAL');
  $('tResultado').textContent = L('¡Toca la nube muchas veces y muy rápido!', 'Tap the cloud lots of times, really fast!');
  $('tResultado').style.color = '';
  $('infoResultado').hidden = true;
  mostrar('pResultado');
  decir(L('¡Toca la nube muchas veces y muy rápido!', 'Tap the cloud lots of times, really fast!'));
  window.EqPersonajes.revelacion.iniciar({
    zona: $('zonaRevela'), avatar: $('avatarFinal'), vapor: $('vapor'), chispas: $('chispasToque'),
    medidor: $('medidorRevela'), saltar: $('bSaltarRevela'), especialidad: e.id,
    onDespejeInicia: sonarEfectoFinal,
    onRevelado: () => {
      $('kickerResultado').textContent = L('TU PERSONAJE FINAL', 'YOUR FINAL CHARACTER');
      $('tResultado').textContent = L(`${perfil.nombre}, ¡eres ${e.nombre}!`, `${perfil.nombre}, you’re the ${e.nombre}!`);
      $('tResultado').style.color = e.color;
      $('bSaltarRevela').hidden = true;
      $('infoResultado').hidden = false;
      decir(L(`¡Eres ${e.nombre}! ${e.lema}`, `You’re the ${e.nombre}! ${e.lema}`));
    }
  });
  window.dispatchEvent(new CustomEvent('perfil:listo', { detail: perfil }));
  try { if (window.parent !== window) window.parent.postMessage({ type: 'perfil-listo', perfil }, '*'); } catch (err) {}
}

$('bMision').onclick = () => { window.EqVoz.callar(); location.href = SIGUIENTE; };
$('bRepetir').onclick = () => { window.EqPersonajes.revelacion.detener(); try { efectoFinal.pause(); } catch (e) {} mostrar('pBienvenida'); };
})();
