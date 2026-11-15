/* Escenas animadas minimalistas (SVG + CSS, sin imágenes externas).
   Todas usan el mismo astronauta para que el niño lo reconozca de una prueba a otra.
   Cada una de las 10 pruebas tiene su escena (ver ESCENAS al final). */
(function () {
  const C = {
    traje: '#E8E9F2', sombra: '#C4C6DC', mochila: '#9A9CB5', bota: '#6E7090',
    rosa: '#E8418C', aqua: '#6FE3E8', ambar: '#FFB547', coral: '#FF7A5C',
    navy: '#0B0F3A', indigo: '#1E1B6E', violeta: '#4B2A9E', piel: '#B07A55', pelo: '#2B1B14'
  };

  let uid = 0;

  /* Gestos de la cara sin casco. */
  function caraSinCasco(cara) {
    const ojos = (dx = 0) => `<g class="pupilas"><ellipse cx="${-5.5 + dx}" cy="-91" rx="1.9" ry="2.4" fill="${C.navy}"/><ellipse cx="${5.5 + dx}" cy="-91" rx="1.9" ry="2.4" fill="${C.navy}"/></g>`;
    const mejillas = (o = 0.35) => `<circle cx="-9.5" cy="-86" r="2.6" fill="${C.rosa}" opacity="${o}"/><circle cx="9.5" cy="-86" r="2.6" fill="${C.rosa}" opacity="${o}"/>`;
    const L = (d, w = 1.8) => `<path d="${d}" stroke="${C.navy}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    switch (cara) {
      case 'enojado':
        return ojos() + mejillas(0.75) + L('M-9.5 -97.5 L-2.5 -95') + L('M9.5 -97.5 L2.5 -95') + L('M-4.5 -83.5 q4.5 -3.5 9 0');
      case 'dudoso':
        return ojos() + mejillas() + L('M-9 -96 L-3 -97.6', 1.6) + L('M9 -97.6 L3 -96', 1.6) + L('M-3.5 -84.5 q1.75 -1.5 3.5 0 t3.5 0', 1.6);
      case 'juega':
        return ojos(1.6) + mejillas() + L('M-9 -96.5 L-3 -96.5', 1.5) + L('M3 -97.5 L9 -96', 1.5) +
          `<path d="M-4 -85 q4 4 8 0z" fill="${C.navy}"/><ellipse cx="1.2" cy="-83.4" rx="1.8" ry="1.2" fill="${C.rosa}"/>`;
      case 'pregunta':
        return ojos(-0.5) + mejillas() + L('M-9 -97 q3 -2.5 6 -1', 1.6) + L('M3 -98 q3 -1 6 1', 1.6) +
          `<ellipse cx="0" cy="-84.5" rx="2.4" ry="2.8" fill="${C.navy}"/>`;
      default:
        return ojos() + mejillas() + L('M-4.5 -85 q4.5 4.5 9 0');
    }
  }

  /* Astronauta de frente. Origen (0,0) = entre los pies. Mide ~118 de alto.
     opciones: casco (bool), cara: 'feliz' | 'enojado' | 'dudoso' | 'sorpresa',
     clase: clases extra para animar, conMedalla (bool). */
  function astronauta(op = {}) {
    const { casco = true, cara = 'feliz', clase = '', conMedalla = false, herramienta = false, linterna = false, probeta = false, pieza = false,
      acento = C.rosa, luz2 = C.aqua, visor = [C.violeta, C.navy], espalda = '', torsoExtra = '', piernasExtra = '', cabezaExtra = '', mano = '' } = op;
    const v = `visor${++uid}`;
    const ojos = {
      feliz: `<ellipse cx="-6" cy="-93" rx="2.6" ry="3.2" fill="#fff"/><ellipse cx="6" cy="-93" rx="2.6" ry="3.2" fill="#fff"/>
        <path d="M-4 -86 q4 3 8 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
      sorpresa: `<circle cx="-6" cy="-93" r="3.6" fill="#fff"/><circle cx="6" cy="-93" r="3.6" fill="#fff"/>
        <path d="M-10 -100.5 q4 -2.5 7 -.5 M10 -100.5 q-4 -2.5 -7 -.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`,
      enojado: `<ellipse cx="-6" cy="-92" rx="2.6" ry="2.6" fill="#fff"/><ellipse cx="6" cy="-92" rx="2.6" ry="2.6" fill="#fff"/>
        <path d="M-11 -99 L-2 -95.5 M11 -99 L2 -95.5" stroke="${C.coral}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M-5 -84 l2.5 -2 l2.5 2 l2.5 -2 l2.5 2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(-2.5 0)"/>`,
      dudoso: `<g class="pupilas"><ellipse cx="-6" cy="-93" rx="2.6" ry="3.2" fill="#fff"/><ellipse cx="6" cy="-93" rx="2.6" ry="3.2" fill="#fff"/></g>
        <path d="M-10 -100 L-3 -101.5 M10 -101.5 L3 -100" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>
        <path d="M-4 -85 q2 -1.6 4 0 t4 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`
    }[cara];

    const cabeza = casco
      ? `<g class="cabeza">
          <circle cx="0" cy="-94" r="21.5" fill="${C.traje}"/>
          <circle cx="0" cy="-94" r="21.5" fill="none" stroke="${C.sombra}" stroke-width="2"/>
          <rect x="-16.5" y="-106" width="33" height="25" rx="11" fill="url(#${v})"/>
          ${ojos}
          <path d="M-12 -101 q4 -4 9 -4" stroke="${C.aqua}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>
          <circle cx="17" cy="-104" r="3" fill="${acento}"/>
          ${cabezaExtra}
        </g>`
      : `<g class="cabeza">
          <rect x="-7" y="-80" width="14" height="8" fill="${C.piel}"/>
          <ellipse cx="0" cy="-74" rx="15" ry="5" fill="${C.sombra}"/>
          <circle cx="0" cy="-93" r="16" fill="${C.piel}"/>
          <path d="M-16 -94 q-1 -17 16 -17 q17 0 16 17 q-4 -9 -12 -10 q-6 5 -20 10 z" fill="${C.pelo}"/>
          <circle cx="-15.5" cy="-91" r="3.2" fill="${C.piel}"/><circle cx="15.5" cy="-91" r="3.2" fill="${C.piel}"/>
          ${caraSinCasco(cara)}
        </g>`;

    const llave = herramienta
      ? `<g transform="translate(0 6) rotate(20)"><rect x="-2" y="-2" width="4" height="22" rx="2" fill="#8E90A8"/>
         <path d="M-6 20 a6 6 0 1 0 12 0 l-3 0 l0 4 l-6 0 l0 -4 z" fill="#8E90A8"/></g>` : '';
    const luz = linterna
      ? `<g class="linterna"><rect x="-3.5" y="-2" width="7" height="14" rx="2" fill="${C.mochila}"/>
         <rect x="-4.5" y="10" width="9" height="4" rx="1.5" fill="${C.ambar}"/></g>` : '';

    const tubo = probeta
      ? `<g class="probeta" transform="translate(0 -4)"><rect x="-4" y="-22" width="8" height="26" rx="4" fill="#fff" opacity=".35" stroke="#fff" stroke-width="1"/>
         <rect x="-3" y="-8" width="6" height="11" rx="3" fill="#7CF29C"/><circle class="burbuja-tubo" cx="0" cy="-10" r="1.4" fill="#fff"/></g>` : '';
    const brazoRobot = pieza
      ? `<g class="pieza" transform="translate(0 4) rotate(-30)"><rect x="-5" y="-4" width="10" height="26" rx="3" fill="#8E90A8"/>
         <circle cx="0" cy="0" r="5" fill="${C.mochila}" stroke="#6E7090" stroke-width="2"/>
         <path d="M-6 22 l-4 8 M6 22 l4 8" stroke="#8E90A8" stroke-width="3.5" stroke-linecap="round"/></g>` : '';

    return `<g class="astro ${clase}">
      <defs><linearGradient id="${v}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${visor[0]}"/><stop offset="1" stop-color="${visor[1]}"/></linearGradient></defs>
      ${espalda}
      <rect x="-26" y="-75" width="52" height="40" rx="10" fill="${C.mochila}"/>
      <g class="pierna pi"><rect x="-16" y="-38" width="13" height="38" rx="6" fill="${C.traje}"/>
        <rect x="-17.5" y="-9" width="16" height="9" rx="4" fill="${C.bota}"/></g>
      <g class="pierna pd"><rect x="3" y="-38" width="13" height="38" rx="6" fill="${C.traje}"/>
        <rect x="1.5" y="-9" width="16" height="9" rx="4" fill="${C.bota}"/></g>
      ${piernasExtra}
      <g class="respira" style="animation-delay:-${(Math.random() * 3).toFixed(2)}s">
      <g class="brazo bi"><rect x="-30" y="-72" width="11" height="35" rx="5.5" fill="${C.traje}"/>
        <circle cx="-24.5" cy="-37" r="6" fill="${C.sombra}"/></g>
      <rect x="-21" y="-78" width="42" height="46" rx="13" fill="${C.traje}"/>
      <rect x="-21" y="-42" width="42" height="5" fill="${C.sombra}"/>
      <rect x="-9" y="-67" width="18" height="12" rx="3" fill="#2A2C4A"/>
      <circle cx="-3.5" cy="-61" r="2.4" fill="${luz2}" class="luz-pecho"/><circle cx="3.5" cy="-61" r="2.4" fill="${acento}"/>
      ${torsoExtra}
      ${conMedalla ? `<path d="M-7 -78 L0 -60 L7 -78" fill="none" stroke="${C.rosa}" stroke-width="4"/>
        <circle cx="0" cy="-56" r="7.5" fill="${C.ambar}" stroke="#E09A2B" stroke-width="2" class="medalla"/>
        <path d="M0 -60 l1.3 2.7 3 .4 -2.2 2 .5 3 -2.6 -1.4 -2.6 1.4 .5 -3 -2.2 -2 3 -.4z" fill="#fff" opacity=".9"/>` : ''}
      <g class="brazo bd"><rect x="19" y="-72" width="11" height="35" rx="5.5" fill="${C.traje}"/>
        <circle cx="24.5" cy="-37" r="6" fill="${C.sombra}"/>
        <g transform="translate(24.5 -37)">${llave}${luz}${tubo}${brazoRobot}${mano}</g></g>
      ${cabeza}
      </g>
    </g>`;
  }

  const estrellas = (n, ancho, alto, semilla = 7) => {
    let s = semilla, out = '';
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) {
      out += `<circle class="titila" style="animation-delay:${(r() * 3).toFixed(2)}s" cx="${(r() * ancho).toFixed(1)}" cy="${(r() * alto).toFixed(1)}" r="${(0.6 + r() * 1.3).toFixed(1)}" fill="#fff"/>`;
    }
    return out;
  };

  const marco = (contenido, clase) =>
    `<svg class="escena-svg ${clase}" viewBox="0 0 640 230" preserveAspectRatio="xMidYMid slice" role="img">${contenido}</svg>`;

  /* ---------------- Prueba 1: la cueva misteriosa ---------------- */
  function cueva() {
    return marco(`
      <defs>
        <linearGradient id="cielo1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05061a"/><stop offset="1" stop-color="${C.indigo}"/></linearGradient>
        <radialGradient id="boca" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#000"/><stop offset=".7" stop-color="#0a0b20"/><stop offset="1" stop-color="#23254a"/></radialGradient>
        <linearGradient id="haz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.ambar}" stop-opacity=".75"/><stop offset="1" stop-color="${C.ambar}" stop-opacity="0"/></linearGradient>
      </defs>
      <rect width="640" height="230" fill="url(#cielo1)"/>
      ${estrellas(45, 640, 150, 3)}
      <circle cx="96" cy="48" r="17" fill="#3B7DD8"/><path d="M85 40 q8 -6 14 2 q-4 6 -10 4z M98 56 q8 -3 10 -9 q3 6 -4 11z" fill="#5FC27A"/>
      <path d="M380 200 Q420 92 520 78 Q610 74 660 118 V230 H380 Z" fill="#7D7F99"/>
      <path d="M420 120 q30 -30 70 -36" stroke="#9EA0B8" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>
      <path d="M455 200 Q458 124 512 120 Q566 124 570 200 Z" fill="url(#boca)"/>
      <g class="cristales">
        <path d="M498 182 l5 -12 l5 12z" fill="${C.aqua}"/><path d="M528 186 l4 -9 l4 9z" fill="${C.rosa}"/>
        <circle cx="514" cy="160" r="1.8" fill="${C.aqua}"/><circle cx="540" cy="168" r="1.4" fill="#fff"/>
      </g>
      <path d="M0 196 Q160 182 330 194 T640 192 V230 H0 Z" fill="#A6A8BE"/>
      <ellipse cx="140" cy="210" rx="26" ry="5" fill="#8C8EA6"/><ellipse cx="290" cy="216" rx="16" ry="3.5" fill="#8C8EA6"/>
      <g class="huellas">${[0,1,2,3,4,5,6].map((i) => `<ellipse class="huella" style="animation-delay:${(0.45 + i * 0.5).toFixed(2)}s" cx="${70 + i * 46}" cy="${203 + (i % 2) * 4}" rx="6" ry="2" fill="#8C8EA6"/>`).join('')}</g>
      <g transform="translate(0 200)"><g class="camina-cueva">
        <g class="haz-luz"><path d="M26 -46 L150 -86 L150 -6 Z" fill="url(#haz)"/></g>
        <g class="exclama"><circle cx="0" cy="-138" r="13" fill="${C.ambar}"/><text x="0" y="-132" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="18" fill="${C.navy}">!</text></g>
        <g transform="scale(.82)">${astronauta({ casco: true, cara: 'sorpresa', clase: 'caminante', linterna: true })}</g>
      </g></g>
    `, 'e-cueva');
  }

  /* ---------------- Prueba 2: un día libre (oficina isométrica) ---------------- */
  const iso = (ox, oy, a, b, h = 0) => [ox + a - b, oy + 0.5 * (a + b) - h];
  const poli = (pts, fill, extra = '') => `<polygon points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="${fill}" ${extra}/>`;
  function caja(ox, oy, a0, b0, a1, b1, h0, h1, colTop, colIzq, colDer) {
    const P = (a, b, h) => iso(ox, oy, a, b, h);
    return poli([P(a0, b1, h0), P(a1, b1, h0), P(a1, b1, h1), P(a0, b1, h1)], colIzq) + // cara frontal izquierda (b = b1)
      poli([P(a1, b0, h0), P(a1, b1, h0), P(a1, b1, h1), P(a1, b0, h1)], colDer) + // cara frontal derecha (a = a1)
      poli([P(a0, b0, h1), P(a1, b0, h1), P(a1, b1, h1), P(a0, b1, h1)], colTop);
  }

  function diaLibre() {
    const ox = 320, oy = 40; // vértice superior del piso
    const P = (a, b, h) => iso(ox, oy, a, b, h);
    // Piso y paredes
    const piso = poli([P(0, 0), P(240, 0), P(240, 240), P(0, 240)], '#2A2C4A');
    const paredIzq = poli([P(0, 240, 0), P(0, 0, 0), P(0, 0, 110), P(0, 240, 110)], '#33356A');
    const paredDer = poli([P(0, 0, 0), P(240, 0, 0), P(240, 0, 110), P(0, 0, 110)], '#3D3F7A');
    let lineas = '';
    for (let i = 40; i < 240; i += 40) {
      const [x1, y1] = P(i, 0), [x2, y2] = P(i, 240), [x3, y3] = P(0, i), [x4, y4] = P(240, i);
      lineas += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line x1="${x3}" y1="${y3}" x2="${x4}" y2="${y4}"/>`;
    }
    // Ventana redonda en la pared derecha (plano a,h con b=0)
    const ventana = `<g transform="matrix(1 0.5 0 1 ${ox} ${oy})">
        <ellipse cx="150" cy="-62" rx="34" ry="30" fill="#05061a" stroke="#9EA0B8" stroke-width="5"/>
        <g clip-path="url(#vidrio)">${estrellas(14, 300, 140, 11).replace(/cy="([\d.]+)"/g, (m, y) => `cy="${(+y * 0.4 - 90).toFixed(1)}"`).replace(/cx="([\d.]+)"/g, (m, x) => `cx="${(+x * 0.25 + 115).toFixed(1)}"`)}
          <circle cx="164" cy="-52" r="12" fill="#3B7DD8"/><path d="M156 -56 q6 -4 10 1 q-3 4 -8 3z" fill="#5FC27A"/></g>
      </g>
      <defs><clipPath id="vidrio"><ellipse cx="150" cy="-62" rx="31" ry="27"/></clipPath></defs>`;
    // Póster en la pared izquierda (plano b,h con a=0)
    const poster = `<g transform="matrix(-1 0.5 0 1 ${ox} ${oy})">
        <rect x="120" y="-92" width="54" height="40" rx="4" fill="${C.navy}" stroke="${C.aqua}" stroke-width="2"/>
        <circle cx="147" cy="-76" r="9" fill="none" stroke="${C.ambar}" stroke-width="2.5"/>
        <path d="M134 -60 l26 0" stroke="${C.rosa}" stroke-width="3" stroke-linecap="round"/>
      </g>`;
    // Alfombra
    const [ax, ay] = P(95, 150);
    const alfombra = `<ellipse cx="${ax}" cy="${ay}" rx="78" ry="39" fill="${C.violeta}" opacity=".55"/>`;
    // Diván (chaise) a lo largo del eje a
    const divan =
      caja(ox, oy, 84, 98, 215, 110, 0, 50, '#F06AA6', '#A0279E', '#C33888') + // respaldo
      caja(ox, oy, 84, 110, 215, 160, 0, 22, '#E8418C', '#A0279E', '#B8307F') + // asiento
      caja(ox, oy, 84, 110, 104, 160, 0, 38, '#F06AA6', '#A0279E', '#C33888');  // apoyabrazos (cabecera)
    // Planta
    const [px, py] = P(215, 20);
    const planta = `<g transform="translate(${px} ${py})">
        <path d="M-10 0 l3 -18 h14 l3 18z" fill="${C.coral}"/>
        <path d="M0 -18 q-14 -14 -8 -32 q6 14 8 32 q2 -22 14 -28 q0 18 -14 28" fill="#5FC27A"/></g>`;
    // Casco en el piso
    const [cx, cy] = P(150, 200);
    const casco = `<g transform="translate(${cx} ${cy})">
        <ellipse cx="0" cy="2" rx="18" ry="6" fill="#000" opacity=".25"/>
        <circle cx="0" cy="-14" r="16" fill="${C.traje}"/><rect x="-12" y="-24" width="24" height="17" rx="8" fill="${C.violeta}"/>
        <path d="M-8 -20 q3 -3 7 -3" stroke="${C.aqua}" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
    // Astronauta acostado: cuerpo alineado con el eje a (rotate -63.4°), pies en a=200.
    // El brazo derecho gira -116.6° para quedar vertical; la mano queda 33 px sobre el hombro.
    const [fx, fy] = P(200, 135, 24);
    const acostado = `<g transform="translate(${fx.toFixed(1)} ${fy.toFixed(1)}) rotate(-63.4)">
        ${astronauta({ casco: false, clase: 'recostado' })}</g>`;
    const mano = [fx - 51.7, fy - 86.2 - 8];
    const pelota = `<g transform="translate(${mano[0].toFixed(1)} ${mano[1].toFixed(1)})"><g class="pelota">
        <circle r="9" fill="${C.ambar}"/><path d="M-9 0 q9 -6 18 0 M-5 -7.5 q6 7.5 0 15" stroke="#E07F2B" stroke-width="1.6" fill="none"/></g></g>`;
    return marco(`
      <rect width="640" height="230" fill="#0E1238"/>
      ${paredIzq}${paredDer}${ventana}${poster}${piso}
      <g stroke="#3A3D66" stroke-width="1">${lineas}</g>
      ${alfombra}${planta}${divan}${acostado}${casco}${pelota}
    `, 'e-oficina');
  }

  /* ---------------- Prueba 3: el premio (podio) ---------------- */
  function podio() {
    const colores = [C.rosa, C.aqua, C.ambar, '#A78BFA', '#5FC27A', '#fff'];
    let confeti = '';
    for (let i = 0; i < 34; i++) {
      const x = 40 + ((i * 97) % 560), d = ((i * 0.37) % 3).toFixed(2), dur = (2.6 + (i % 5) * 0.35).toFixed(2);
      confeti += `<rect class="confeti" style="animation-delay:-${d}s;animation-duration:${dur}s" x="${x}" y="-12" width="${5 + (i % 3) * 2}" height="${9 - (i % 3) * 2}" rx="1.5" fill="${colores[i % colores.length]}"/>`;
    }
    const bloque = (x, w, h, n, col) => `<rect x="${x}" y="${222 - h}" width="${w}" height="${h}" rx="6" fill="${col}"/>
      <rect x="${x}" y="${222 - h}" width="${w}" height="8" rx="4" fill="#fff" opacity=".18"/>
      <text x="${x + w / 2}" y="${222 - h / 2 + 12}" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="34" fill="#fff" opacity=".9">${n}</text>`;
    return marco(`
      <defs>
        <radialGradient id="foco" cx=".5" cy="0" r="1"><stop offset="0" stop-color="${C.ambar}" stop-opacity=".45"/><stop offset="1" stop-color="${C.ambar}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="640" height="230" fill="#0E1238"/>
      ${estrellas(30, 640, 120, 5)}
      <path class="foco" d="M290 0 L350 0 L420 222 L220 222 Z" fill="url(#foco)"/>
      <rect x="0" y="220" width="640" height="10" fill="#2A2C4A"/>
      ${bloque(214, 74, 56, 2, C.violeta)}${bloque(288, 74, 86, 1, C.rosa)}${bloque(362, 74, 40, 3, C.indigo)}
      <g class="destellos">
        <path d="M268 72 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="${C.ambar}"/>
        <path d="M392 58 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4z" fill="${C.aqua}"/>
        <path d="M410 112 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff"/>
      </g>
      <g transform="translate(325 136)"><g class="festeja">
        <g transform="scale(.9)">${astronauta({ casco: false, conMedalla: true, clase: 'ganador' })}</g></g></g>
      <g>${confeti}</g>
    `, 'e-podio');
  }

  /* ---------------- Prueba 4: un compañero en problemas ---------------- */
  function panel() {
    let celdas = '';
    for (let f = 0; f < 3; f++) for (let c = 0; c < 5; c++) {
      const roto = f === 1 && c === 3;
      celdas += `<rect ${roto ? 'class="celda-rota"' : ''} x="${c * 26 + 3}" y="${f * 22 + 3}" width="23" height="19" rx="2" fill="${roto ? '#3a1530' : '#1B6F9A'}"/>`;
    }
    return marco(`
      <defs><linearGradient id="cielo4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05061a"/><stop offset="1" stop-color="${C.indigo}"/></linearGradient></defs>
      <rect width="640" height="230" fill="url(#cielo4)"/>
      ${estrellas(40, 640, 140, 9)}
      <circle cx="560" cy="44" r="14" fill="#3B7DD8"/><path d="M552 38 q6 -4 11 1 q-3 5 -8 4z" fill="#5FC27A"/>
      <path d="M0 196 Q200 186 360 194 T640 190 V230 H0 Z" fill="#A6A8BE"/>
      <g transform="translate(300 96)">
        <rect x="62" y="70" width="8" height="40" fill="#8E90A8"/><rect x="46" y="104" width="40" height="7" rx="3" fill="#6E7090"/>
        <g transform="skewY(-8)">
          <rect x="0" y="0" width="134" height="72" rx="5" fill="#0F2C49" stroke="#9EA0B8" stroke-width="3"/>
          ${celdas}
        </g>
        <g class="chispas"><path d="M90 26 l10 -10 M96 32 l14 -2 M88 34 l4 12" stroke="${C.ambar}" stroke-width="2.4" stroke-linecap="round"/></g>
        <circle class="alarma" cx="128" cy="-12" r="5" fill="${C.coral}"/>
      </g>
      <g transform="translate(262 204)"><g class="frustrado">
        <g transform="scale(.86)">${astronauta({ casco: true, cara: 'enojado', clase: 'repara', herramienta: true })}</g>
        <g class="vapor"><circle cx="-10" cy="-104" r="5" fill="#fff" opacity=".7"/><circle cx="10" cy="-108" r="4" fill="#fff" opacity=".6"/></g>
        <g class="garabato" transform="translate(-34 -128)">
          <path d="M0 0 q-14 -2 -10 -14 q4 -12 18 -8 q8 -10 20 -2 q14 -2 14 10 q8 10 -4 16 q-6 8 -18 4 q-12 4 -20 -6z" fill="${C.coral}"/>
          <text x="13" y="-1" text-anchor="middle" font-family="Space Mono,monospace" font-weight="700" font-size="12" fill="#fff">#@!</text>
        </g>
      </g></g>
      <g transform="translate(110 204)"><g class="indeciso">
        <g transform="scale(.86)">${astronauta({ casco: true, cara: 'dudoso', clase: 'duda' })}</g>
        <g class="pregunta"><circle cx="30" cy="-120" r="13" fill="${C.aqua}"/>
          <text x="30" y="-114" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="17" fill="${C.navy}">?</text></g>
      </g></g>
    `, 'e-panel');
  }

  /* Fondo de interior compartido: pared, piso y ventana con estrellas. */
  const interior = (semilla) => `
      <rect width="640" height="230" fill="#141842"/>
      <rect y="186" width="640" height="44" fill="#22264F"/><rect y="186" width="640" height="3" fill="#33376A"/>
      <g opacity=".5">${[60, 150, 240, 330, 420, 510, 600].map((x) => `<line x1="${x}" y1="189" x2="${x - 30}" y2="230" stroke="#2E3262"/>`).join('')}</g>`;

  /* ---------------- Prueba 5: jugando con un joystick ---------------- */
  function jugar() {
    let rocas = '';
    [[0, 64, 9], [70, 104, 7], [140, 80, 11], [200, 118, 6]].forEach(([d, y, r], i) => {
      rocas += `<circle class="roca-juego" style="animation-delay:-${(i * 0.75).toFixed(2)}s" cx="${600 + d * 0}" cy="${y}" r="${r}" fill="#A8A9B8"/>`;
    });
    let puntos = '';
    for (let i = 0; i < 12; i++) puntos += `<circle class="estrella-juego" style="animation-delay:-${(i * 0.3).toFixed(1)}s" cx="600" cy="${46 + ((i * 37) % 96)}" r="1.3" fill="#fff"/>`;
    return marco(`
      ${interior(5)}
      <defs><clipPath id="pantallaJuego"><rect x="352" y="38" width="236" height="124" rx="6"/></clipPath></defs>
      <rect x="340" y="26" width="260" height="148" rx="14" fill="#2A2C4A" stroke="#9EA0B8" stroke-width="3"/>
      <rect x="352" y="38" width="236" height="124" rx="6" fill="#05061a"/>
      <g clip-path="url(#pantallaJuego)">
        ${puntos}${rocas}
        <g class="nave-juego"><path d="M392 100 l-16 -9 l0 18 z" fill="${C.aqua}"/><path d="M376 95 l-8 5 l8 5 z" fill="${C.ambar}" class="fuego"/></g>
        <text x="362" y="56" font-family="Space Mono,monospace" font-weight="700" font-size="11" fill="${C.ambar}">PUNTOS</text>
        <text class="marcador" x="414" y="56" font-family="Space Mono,monospace" font-weight="700" font-size="11" fill="#fff">0420</text>
        <text x="540" y="56" font-family="Space Mono,monospace" font-weight="700" font-size="11" fill="${C.rosa}">♥♥♥</text>
      </g>
      <rect x="462" y="174" width="16" height="14" fill="#6E7090"/><rect x="430" y="186" width="80" height="6" rx="3" fill="#6E7090"/>
      <path d="M232 160 q60 30 130 -12" stroke="#33376A" stroke-width="3" fill="none"/>
      <ellipse cx="200" cy="198" rx="64" ry="14" fill="${C.violeta}"/>
      <g transform="translate(200 204)"><g class="jugador">
        <g transform="scale(.92)">${astronauta({ casco: false, cara: 'juega', clase: 'gamer' })}</g>
        <g class="control" transform="translate(0 -32)">
          <rect x="-17" y="-2" width="34" height="13" rx="5" fill="#2A2C4A"/>
          <g class="palanca"><rect x="-2" y="-16" width="4" height="16" rx="2" fill="#6E7090"/><circle cx="0" cy="-17" r="5.5" fill="${C.rosa}"/></g>
          <circle cx="11" cy="4" r="2.6" fill="${C.ambar}" class="boton-juego"/>
        </g>
      </g></g>
    `, 'e-jugar');
  }

  /* ---------------- Prueba 6: mensaje de la Tierra en la terminal ---------------- */
  function mensaje() {
    let lineas = '';
    for (let y = 46; y < 158; y += 4) lineas += `<line x1="214" y1="${y}" x2="426" y2="${y}" stroke="#fff" stroke-opacity=".03"/>`;
    return marco(`
      ${interior(6)}
      <circle cx="96" cy="74" r="42" fill="#05061a" stroke="#9EA0B8" stroke-width="5"/>
      <circle cx="104" cy="82" r="18" fill="#3B7DD8"/><path d="M94 76 q8 -6 14 2 q-4 6 -10 4z M108 92 q7 -3 9 -8 q3 5 -4 10z" fill="#5FC27A"/>
      <g class="ondas" transform="translate(104 62)" fill="none" stroke="${C.aqua}" stroke-width="2" stroke-linecap="round">
        <path class="onda" d="M14 -8 q8 8 0 16"/><path class="onda" style="animation-delay:.3s" d="M20 -13 q13 13 0 26"/></g>
      <rect x="318" y="6" width="4" height="20" fill="#8E90A8"/><circle cx="320" cy="6" r="4" fill="${C.rosa}" class="antena"/>
      <rect x="200" y="26" width="240" height="146" rx="14" fill="#2A2C4A" stroke="#9EA0B8" stroke-width="3"/>
      <rect x="214" y="40" width="212" height="118" rx="6" fill="#05061a"/>
      ${lineas}
      <text x="224" y="56" font-family="Space Mono,monospace" font-size="9" fill="${C.aqua}" opacity=".7">CANAL TIERRA · LUNA</text>
      <g class="sobre">
        <rect x="285" y="72" width="70" height="46" rx="6" fill="${C.traje}"/>
        <path d="M287 75 L320 99 L353 75" fill="none" stroke="${C.rosa}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M287 116 L311 94 M353 116 L329 94" stroke="${C.sombra}" stroke-width="2"/>
      </g>
      <circle class="anillo" cx="355" cy="72" r="12" fill="none" stroke="${C.rosa}" stroke-width="3"/>
      <g class="insignia-nuevo"><circle cx="355" cy="72" r="12" fill="${C.rosa}"/>
        <text x="355" y="77" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="14" fill="#fff">1</text></g>
      <text class="aviso" x="320" y="142" text-anchor="middle" font-family="Space Mono,monospace" font-weight="700" font-size="11" fill="${C.ambar}">MENSAJE NUEVO</text>
      <path d="M184 186 L456 186 L470 204 L170 204 Z" fill="#33376A"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${200 + i * 27}" y="190" width="21" height="5" rx="1.5" fill="#4A4E86"/>`).join('')}
      <g class="leds">${[0, 1, 2].map((i) => `<circle style="animation-delay:${i * 0.35}s" cx="${456 + i * 14}" cy="40" r="3.5" fill="${[C.aqua, C.ambar, C.rosa][i]}"/>`).join('')}</g>
      <g fill="#2A2C4A" stroke="#4A4E86" stroke-width="2"><rect x="456" y="56" width="120" height="90" rx="10"/></g>
      ${[0, 1, 2, 3].map((i) => `<rect class="barra-dato" style="animation-delay:-${i * 0.4}s" x="${470 + i * 26}" y="${76 + i * 6}" width="16" height="${56 - i * 6}" rx="3" fill="${[C.aqua, C.violeta, C.rosa, C.ambar][i]}"/>`).join('')}
    `, 'e-mensaje');
  }

  /* ---------------- Prueba 7: dos caminos ---------------- */
  function caminos() {
    const piedras = [[190, 182, 7], [236, 172, 9], [282, 167, 6], [330, 160, 10], [372, 152, 7], [420, 146, 9], [462, 138, 6]]
      .map(([x, y, r], i) => `<g class="piedra" style="animation-delay:-${(i * 0.23).toFixed(2)}s"><path d="M${x - r} ${y} l${r * 0.6} ${-r} l${r} ${r * 0.2} l${r * 0.5} ${r * 0.8} z" fill="#7D7F99"/></g>`).join('');
    const banderas = [[150, 120], [230, 82], [330, 66], [430, 74]]
      .map(([x, y]) => `<g><rect x="${x}" y="${y - 18}" width="2.5" height="18" fill="#C4C6DC"/><path class="bandera" d="M${x + 2.5} ${y - 18} l12 4 l-12 4 z" fill="#5FC27A"/></g>`).join('');
    return marco(`
      <rect width="640" height="230" fill="#05061a"/>${estrellas(26, 640, 40, 13)}
      <path d="M0 42 Q320 30 640 44 V230 H0 Z" fill="#9C9EB6"/>
      <ellipse cx="300" cy="118" rx="40" ry="8" fill="#8A8CA4"/><ellipse cx="510" cy="200" rx="30" ry="6" fill="#8A8CA4"/>
      <g transform="translate(560 128)">
        <path d="M-44 0 a44 40 0 0 1 88 0 z" fill="${C.traje}"/><rect x="-50" y="-2" width="100" height="8" rx="3" fill="${C.sombra}"/>
        <rect x="-10" y="-22" width="20" height="22" rx="6" fill="${C.violeta}"/><circle cx="0" cy="-48" r="4" fill="${C.rosa}" class="antena"/>
        <rect x="-1.5" y="-46" width="3" height="10" fill="#8E90A8"/>
      </g>
      <path class="ruta-larga" d="M110 200 C 110 70, 420 40, 520 122" fill="none" stroke="${C.aqua}" stroke-width="12" stroke-linecap="round" opacity=".35"/>
      <path class="hormigas" d="M110 200 C 110 70, 420 40, 520 122" fill="none" stroke="${C.aqua}" stroke-width="3" stroke-dasharray="8 10" stroke-linecap="round"/>
      ${banderas}
      <path d="M110 200 L520 130" stroke="#6E7090" stroke-width="16" stroke-linecap="round"/>
      <path class="hormigas" d="M110 200 L520 130" stroke="${C.coral}" stroke-width="3" stroke-dasharray="8 10" stroke-linecap="round"/>
      ${piedras}
      <g class="guijarros"><circle class="guijarro" cx="300" cy="166" r="3" fill="#7D7F99"/><circle class="guijarro" style="animation-delay:.7s" cx="400" cy="150" r="2.5" fill="#7D7F99"/></g>
      <g transform="translate(330 186)"><path d="M0 -26 l14 24 h-28z" fill="${C.ambar}"/><text x="0" y="-6" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="15" fill="${C.navy}">!</text></g>
      <g font-family="Space Mono,monospace" font-weight="700" font-size="11">
        <rect x="228" y="200" width="78" height="20" rx="10" fill="${C.coral}"/><text x="267" y="214" text-anchor="middle" fill="${C.navy}">CORTO</text>
        <rect x="220" y="26" width="140" height="20" rx="10" fill="${C.aqua}"/><text x="290" y="40" text-anchor="middle" fill="${C.navy}">LARGO Y SEGURO</text>
      </g>
      <g transform="translate(78 214)"><g transform="scale(.7)">${astronauta({ casco: true, cara: 'dudoso', clase: 'duda decide' })}</g></g>
    `, 'e-caminos');
  }

  /* ---------------- Prueba 8: el experimento y el oxígeno ---------------- */
  function experimento() {
    let burbujas = '';
    for (let i = 0; i < 6; i++) burbujas += `<circle class="burbuja-matraz" style="animation-delay:-${(i * 0.35).toFixed(2)}s" cx="${514 + (i % 3) * 7}" cy="150" r="${2 + (i % 2)}" fill="#C8F7D5"/>`;
    return marco(`
      ${interior(8)}
      <g transform="translate(130 40)">
        <rect x="0" y="22" width="64" height="126" rx="28" fill="#D7DBEF"/>
        <rect x="6" y="30" width="10" height="110" rx="5" fill="#fff" opacity=".45"/>
        <rect x="22" y="0" width="20" height="26" rx="4" fill="#8E90A8"/>
        <text x="32" y="92" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="22" fill="${C.navy}">O₂</text>
        <rect x="74" y="34" width="16" height="108" rx="8" fill="#2A2C4A" stroke="#4A4E86" stroke-width="2"/>
        <rect class="nivel-bajo" x="77" y="122" width="10" height="17" rx="5" fill="${C.coral}"/>
        <text class="alerta-o2" x="82" y="28" text-anchor="middle" font-family="Space Mono,monospace" font-weight="700" font-size="10" fill="${C.coral}">BAJO</text>
      </g>
      <g transform="translate(162 34)">
        <circle r="20" fill="#2A2C4A" stroke="#C4C6DC" stroke-width="3"/>
        <path d="M-14 6 A15 15 0 0 1 -10 -11" stroke="${C.coral}" stroke-width="4" fill="none"/>
        <path d="M-10 -11 A15 15 0 0 1 14 6" stroke="#5FC27A" stroke-width="4" fill="none"/>
        <g class="aguja"><path d="M0 0 L-12 6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g><circle r="3" fill="#fff"/>
      </g>
      <rect x="430" y="150" width="190" height="10" rx="3" fill="#6E7090"/><rect x="446" y="160" width="8" height="30" fill="#4A4E86"/><rect x="596" y="160" width="8" height="30" fill="#4A4E86"/>
      <g transform="translate(456 150)">
        <rect x="0" y="-8" width="40" height="8" rx="2" fill="#8E90A8"/>
        ${[0, 1, 2].map((i) => `<rect x="${4 + i * 12}" y="-34" width="8" height="30" rx="4" fill="#fff" opacity=".3"/><rect x="${5 + i * 12}" y="${-18 + i * 3}" width="6" height="${14 - i * 3}" rx="3" fill="${[C.rosa, C.aqua, C.ambar][i]}"/>`).join('')}
      </g>
      <path d="M512 150 l-16 0 l12 -26 l0 -18 l12 0 l0 18 l12 26 z" fill="#fff" opacity=".3" stroke="#fff" stroke-width="1.2"/>
      <path d="M500 150 l9 -18 l14 0 l9 18 z" fill="#7CF29C" opacity=".9"/>
      ${burbujas}
      <g transform="translate(350 206)"><g class="investiga">
        <g transform="scale(.92)">${astronauta({ casco: false, cara: 'dudoso', clase: 'cientifico', probeta: true })}</g>
        <g class="pregunta"><circle cx="-34" cy="-124" r="13" fill="${C.aqua}"/>
          <text x="-34" y="-118" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="17" fill="${C.navy}">?</text></g>
      </g></g>
    `, 'e-experimento');
  }

  /* ---------------- Prueba 9: el robot que no funciona ---------------- */
  function robot() {
    return marco(`
      ${interior(9)}
      <rect x="30" y="40" width="150" height="96" rx="6" fill="#1B3A6B" opacity=".75"/>
      <g stroke="${C.aqua}" stroke-width="1.5" fill="none" opacity=".6">
        <rect x="80" y="56" width="40" height="30" rx="5"/><rect x="74" y="88" width="52" height="34" rx="5"/><circle cx="100" cy="71" r="5"/>
        <path d="M74 96 l-16 10 M126 96 l16 10"/></g>
      <text x="40" y="54" font-family="Space Mono,monospace" font-size="9" fill="${C.aqua}" opacity=".8">PLANO · ROBOT</text>
      <g transform="translate(410 190)">
        <g class="robot-cabeza"><rect x="-20" y="-34" width="40" height="30" rx="8" fill="#B6B9D3"/>
          <circle class="ojo-robot" cx="-7" cy="-20" r="5" fill="${C.aqua}"/><circle cx="7" cy="-20" r="5" fill="#2A2C4A"/>
          <rect x="-1.5" y="-46" width="3" height="12" fill="#8E90A8"/><circle cx="0" cy="-47" r="3.5" fill="${C.rosa}"/></g>
      </g>
      <g transform="translate(500 190)">
        <rect x="-28" y="-44" width="56" height="44" rx="8" fill="#9EA2C2"/>
        <rect x="-16" y="-34" width="32" height="22" rx="3" fill="#2A2C4A"/>
        <path d="M-12 -24 l6 0 l3 -6 l4 12 l3 -6 l8 0" stroke="${C.coral}" stroke-width="1.8" fill="none" class="pulso-robot"/>
        <g class="chispas"><path d="M28 -40 l10 -8 M30 -32 l12 0 M26 -46 l2 -10" stroke="${C.ambar}" stroke-width="2.2" stroke-linecap="round"/></g>
      </g>
      <g transform="translate(572 194)"><circle r="12" fill="#2A2C4A"/><circle r="5" fill="#8E90A8"/></g>
      <g transform="translate(456 202)" fill="#8E90A8"><rect x="0" y="-4" width="8" height="4" rx="1"/><rect x="14" y="-3" width="6" height="3" rx="1"/><rect x="-26" y="-4" width="7" height="4" rx="1"/></g>
      <path d="M594 160 q6 -6 0 -12 q-6 -6 0 -12 q6 -6 0 -12" stroke="#8E90A8" stroke-width="2.5" fill="none" transform="translate(-10 34)"/>
      <g transform="translate(270 206)"><g class="frustrado">
        <g transform="scale(.92)">${astronauta({ casco: false, cara: 'enojado', clase: 'armando', pieza: true })}</g>
        <g class="vapor"><circle cx="-10" cy="-112" r="5" fill="#fff" opacity=".7"/><circle cx="10" cy="-116" r="4" fill="#fff" opacity=".6"/></g>
        <g class="garabato" transform="translate(-34 -128)">
          <path d="M0 0 q-14 -2 -10 -14 q4 -12 18 -8 q8 -10 20 -2 q14 -2 14 10 q8 10 -4 16 q-6 8 -18 4 q-12 4 -20 -6z" fill="${C.coral}"/>
          <text x="13" y="-1" text-anchor="middle" font-family="Space Mono,monospace" font-weight="700" font-size="12" fill="#fff">#@!</text>
        </g>
      </g></g>
    `, 'e-robot');
  }

  /* ---------------- Prueba 10: el astronauta pregunta ---------------- */
  function sentir() {
    return marco(`
      <rect width="640" height="230" fill="#0E1238"/>${estrellas(40, 640, 230, 21)}
      <circle cx="540" cy="58" r="24" fill="#3B7DD8"/><path d="M526 50 q10 -8 18 2 q-5 8 -13 5z M544 68 q10 -4 12 -12 q4 8 -5 14z" fill="#5FC27A"/>
      <ellipse cx="320" cy="214" rx="120" ry="16" fill="${C.violeta}" opacity=".7"/>
      <ellipse cx="320" cy="210" rx="96" ry="10" fill="${C.aqua}" opacity=".18" class="plataforma"/>
      <g transform="translate(320 208)"><g class="preguntando">
        <g transform="scale(.95)">${astronauta({ casco: false, cara: 'pregunta', clase: 'levanta-mano' })}</g>
      </g></g>
      <g class="globo-pregunta" transform="translate(400 70)">
        <path d="M-30 -24 h60 a12 12 0 0 1 12 12 v24 a12 12 0 0 1 -12 12 h-38 l-14 12 l2 -12 h-10 a12 12 0 0 1 -12 -12 v-24 a12 12 0 0 1 12 -12z" fill="${C.traje}"/>
        <g class="puntos-escribe">${[-14, 0, 14].map((x, i) => `<circle style="animation-delay:${i * 0.18}s" cx="${x}" cy="0" r="4" fill="${C.violeta}"/>`).join('')}</g>
        <text class="signo" x="0" y="9" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="28" fill="${C.rosa}">?</text>
      </g>
      ${[[230, 120, 0], [190, 80, 0.9], [262, 60, 1.8]].map(([x, y, d]) => `<text class="signo-flota" style="animation-delay:${d}s" x="${x}" y="${y}" font-family="Nunito,sans-serif" font-weight="900" font-size="20" fill="${C.aqua}">?</text>`).join('')}
    `, 'e-sentir');
  }

  const ESCENAS = { cueva, 'dia-libre': diaLibre, premio: podio, companero: panel,
    jugar, mensaje, caminos, experimento, robot, sentir };

  window.EqEscenas = {
    astronauta, colores: C,
    tiene: (id) => id in ESCENAS,
    svg: (id) => ESCENAS[id]()
  };
})();
