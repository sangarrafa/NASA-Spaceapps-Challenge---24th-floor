/* Perfil del astronauta · cálculo y almacenamiento
   Script clásico (sin módulos) para que funcione también abriendo el archivo
   directo con file://, igual que la cinemática.

   Uso desde el juego o una misión:
     <script src="../test-habilidades/perfil-astronauta.js"></script>
     const perfil = EquilibriaPerfil.cargar();          // null si no hay test
     perfil.especialidad.id                             // 'E' | 'T' | 'G' | 'S'
     perfil.oculto.riesgo.estilo                        // 'cauteloso' | 'equilibrado' | 'audaz'
     perfil.oculto.apoyo.nivel                          // 'ligero' | 'medio' | 'alto'
     perfil.adaptacion                                  // ajustes listos para LUNA
     EquilibriaPerfil.registrarConducta('experimento', 2, { mision: 'mision-04' });
     EquilibriaPerfil.compararDeclaradoVsReal()          // dijo vs. hizo (para el pitch)
*/
(function () {
  const CLAVE = 'equilibria:perfil';
  const CLAVE_LEGADO = 'outpost:profile'; // la leen game.html y src/game/main.js

  function estiloRiesgo(p) {
    if (p <= 1) return { estilo: 'cauteloso', icono: '🐢', etiqueta: 'Cauteloso' };
    if (p === 2) return { estilo: 'equilibrado', icono: '⚖️', etiqueta: 'Equilibrado' };
    return { estilo: 'audaz', icono: '🏃', etiqueta: 'Audaz' };
  }

  function nivelApoyo(p) {
    if (p <= 1) return { nivel: 'ligero', etiqueta: 'Apoyo ligero' };
    if (p === 2) return { nivel: 'medio', etiqueta: 'Apoyo medio' };
    return { nivel: 'alto', etiqueta: 'Apoyo alto' };
  }

  /* Ajustes concretos que el juego puede leer sin volver a interpretar el perfil. */
  function adaptacion(especialidad, riesgo, apoyo) {
    const temaLuna = { E: 'secretos y datos escondidos', T: 'metas, estrellas y récords personales',
      G: 'la tripulación y los mensajes de la Tierra', S: 'planes y la tormenta solar' }[especialidad];
    const porApoyo = {
      ligero: { pistaTrasFallosSeguidos: 3, pistasPorMision: 1, curvaDificultad: 'rapida',
                solesSuaves: 0, narracionFallos: 'directa' },
      medio:  { pistaTrasFallosSeguidos: 2, pistasPorMision: 2, curvaDificultad: 'normal',
                solesSuaves: 2, narracionFallos: 'amable' },
      alto:   { pistaTrasFallosSeguidos: 1, pistasPorMision: 4, curvaDificultad: 'suave',
                solesSuaves: 5, narracionFallos: 'muy cuidadosa' }
    }[apoyo];
    const porRiesgo = {
      cauteloso:   { avisarSiArriesgaDeMas: false, animarAProbar: true },
      equilibrado: { avisarSiArriesgaDeMas: false, animarAProbar: false },
      audaz:       { avisarSiArriesgaDeMas: true,  animarAProbar: false }
    }[riesgo];
    return Object.assign({ temaLuna }, porApoyo, porRiesgo);
  }

  /* respuestas: [{ n, capa, id, opcion, valor }] en orden.
     eleccionEmpate: letra que eligió el niño si hubo empate. */
  function calcular(respuestas, eleccionEmpate) {
    const puntos = { E: 0, T: 0, G: 0, S: 0 };
    let riesgo = 0, apoyo = 0;
    respuestas.forEach((r) => {
      if (r.capa === 1) puntos[r.valor] += 1;
      else if (r.capa === 2) riesgo += r.valor;
      else if (r.capa === 3) apoyo += r.valor;
    });
    const max = Math.max(...Object.values(puntos));
    const empatadas = Object.keys(puntos).filter((k) => puntos[k] === max);
    return { puntos, empatadas, riesgo, apoyo,
      especialidad: empatadas.length === 1 ? empatadas[0] : (eleccionEmpate || null) };
  }

  function construir({ nombre, respuestas, eleccionEmpate }) {
    const c = calcular(respuestas, eleccionEmpate);
    const esp = window.EQ_ESPECIALIDADES[c.especialidad];
    const r = estiloRiesgo(c.riesgo);
    const a = nivelApoyo(c.apoyo);
    const declarado = {};
    respuestas.filter((x) => x.capa === 2).forEach((x) => { declarado[x.id] = x.valor; });
    return {
      version: 1,
      nombre: nombre || 'Astronauta',
      creado: new Date().toISOString(),
      // Lo único que ve el niño:
      especialidad: {
        id: esp.id, clave: esp.clave, nombre: esp.nombre, icono: esp.icono,
        bartle: esp.bartle, puntos: c.puntos,
        empate: c.empatadas.length > 1 ? c.empatadas : null,
        elegidaPorElNino: c.empatadas.length > 1
      },
      // Oculto: ajusta el juego en segundo plano, nunca se muestra como etiqueta.
      oculto: {
        riesgo: { puntos: c.riesgo, estilo: r.estilo, icono: r.icono, etiqueta: r.etiqueta },
        apoyo: { puntos: c.apoyo, nivel: a.nivel, etiqueta: a.etiqueta }
      },
      adaptacion: adaptacion(esp.id, r.estilo, a.nivel),
      // Capa 2 tal como la declaró: 0 = seguro, 1 = lo piensa, 2 = arriesga.
      declarado,
      // Lo que realmente hace en la partida (lo va llenando el juego).
      conducta: [],
      respuestas
    };
  }

  function guardar(perfil) {
    try { localStorage.setItem(CLAVE, JSON.stringify(perfil)); } catch (e) { return; }
    // Compatibilidad con el prototipo actual (game.html / src/onboarding).
    const legado = { name: perfil.nombre,
      archetype: window.EQ_ESPECIALIDADES[perfil.especialidad.id].arquetipoJuego };
    try { localStorage.setItem(CLAVE_LEGADO, JSON.stringify(legado)); } catch (e) {}
  }

  function cargar() {
    try { return JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { return null; }
  }

  function borrar() {
    try { localStorage.removeItem(CLAVE); localStorage.removeItem(CLAVE_LEGADO); } catch (e) {}
  }

  /* dilema: 'caminos' | 'experimento' (u otro). valor: 0 seguro · 1 medido · 2 arriesgado */
  function registrarConducta(dilema, valor, extra) {
    const p = cargar();
    if (!p) return null;
    p.conducta.push(Object.assign({ dilema, valor, cuando: new Date().toISOString() }, extra || {}));
    try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch (e) {}
    return p;
  }

  /* Compara lo que dijo en el test con lo que hizo en la partida. */
  function compararDeclaradoVsReal() {
    const p = cargar();
    if (!p) return [];
    return Object.keys(p.declarado).map((dilema) => {
      const actos = p.conducta.filter((c) => c.dilema === dilema);
      if (!actos.length) return { dilema, dijo: p.declarado[dilema], hizo: null, coincide: null };
      const hizo = actos[actos.length - 1].valor;
      const dijo = p.declarado[dilema];
      return { dilema, dijo, hizo, coincide: dijo === hizo,
        tendencia: hizo > dijo ? 'arriesgó más de lo que dijo' : hizo < dijo ? 'fue más prudente de lo que dijo' : 'hizo lo que dijo' };
    });
  }

  window.EquilibriaPerfil = { calcular, construir, guardar, cargar, borrar,
    registrarConducta, compararDeclaradoVsReal, estiloRiesgo, nivelApoyo };
})();
