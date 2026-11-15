/* Avatar del astronauta: dibujo y guardado.
   Este archivo lo puede cargar cualquier pantalla del juego para mostrar el
   avatar que diseñó el niño:

     <script src="../avatar/avatar.js"></script>
     EqAvatar.montar(document.querySelector('#miAvatar'));   // lo dibuja con lo guardado
     EqAvatar.svg(EqAvatar.cargar(), { recorte: 'cabeza' }); // solo la cabeza (para retratos)

   Se guarda en localStorage con la clave 'equilibria:avatar' y también dentro
   de 'equilibria:perfil' (campo avatar) y 'outpost:profile' (campo avatar). */
(function () {
  const CLAVE = 'equilibria:avatar';
  const C = { traje: '#E8E9F2', sombra: '#C4C6DC', mochila: '#9A9CB5', bota: '#6E7090', navy: '#0B0F3A', panel: '#2A2C4A', aqua: '#6FE3E8', rosa: '#E8418C' };

  /* ---------- Opciones del menú ---------- */
  const OPCIONES = {
    traje: [
      { id: 'clasico', nombre: 'Explorador', desc: 'Clásico, con franjas' },
      { id: 'ligero', nombre: 'Ágil', desc: 'Delgado y veloz' },
      { id: 'blindado', nombre: 'Blindado', desc: 'Hombreras y rodilleras' },
      { id: 'piloto', nombre: 'Piloto', desc: 'Mono con cuello y cremallera' }
    ],
    contorno: [
      { id: 'suave', nombre: 'Suave' }
    ],
    acento: [
      { id: '#6FE3E8', nombre: 'Aqua' }, { id: '#E8418C', nombre: 'Rosa' }, { id: '#FFB547', nombre: 'Ámbar' },
      { id: '#A78BFA', nombre: 'Violeta' }, { id: '#FF7A5C', nombre: 'Coral' }, { id: '#5FD08A', nombre: 'Verde' },
      { id: '#4C8DFF', nombre: 'Azul' }, { id: '#F4F1E8', nombre: 'Blanco' }
    ],
    insignias: [
      { id: 'estrella', nombre: 'Estrella' }, { id: 'cohete', nombre: 'Cohete' }, { id: 'luna', nombre: 'Luna' },
      { id: 'planeta', nombre: 'Planeta' }, { id: 'sol', nombre: 'Sol' }, { id: 'corazon', nombre: 'Corazón' },
      { id: 'rayo', nombre: 'Rayo' }, { id: 'telescopio', nombre: 'Telescopio' }, { id: 'trofeo', nombre: 'Trofeo' },
      { id: 'escudo', nombre: 'Escudo' }
    ],
    gesto: [
      { id: 'alegre', nombre: 'Alegre' }, { id: 'serio', nombre: 'Serio' },
      { id: 'decidido', nombre: 'Decidido' }, { id: 'rabioso', nombre: 'Rabioso' }
    ],
    genero: [
      { id: 'femenino', nombre: 'Femenino' }, { id: 'masculino', nombre: 'Masculino' }, { id: 'neutro', nombre: 'Neutro' }
    ],
    piel: [
      { id: '#F2CBA8', nombre: 'Clara' }, { id: '#D9A27A', nombre: 'Media clara' }, { id: '#B07A55', nombre: 'Media' },
      { id: '#8A5A3B', nombre: 'Morena' }, { id: '#5E3A26', nombre: 'Oscura' }
    ],
    cabello: [
      { id: 'corto', nombre: 'Corto' }, { id: 'corto-liso', nombre: 'Corto liso' }, { id: 'corto-afro', nombre: 'Corto afro' },
      { id: 'largo-liso', nombre: 'Largo liso' }, { id: 'largo-rizado', nombre: 'Largo rizado' }, { id: 'largo-afro', nombre: 'Largo afro' }
    ],
    colorCabello: [
      { id: '#2B1B14', nombre: 'Negro' }, { id: '#5A3520', nombre: 'Castaño' }, { id: '#A8642E', nombre: 'Cobrizo' },
      { id: '#E0B45A', nombre: 'Rubio' }, { id: '#C9473E', nombre: 'Rojo' }, { id: '#7A5CE0', nombre: 'Galaxia' }, { id: '#E8E9F2', nombre: 'Plata' }
    ]
  };
  // En inglés se cambian solo los nombres que ve el jugador (los ids no cambian)
  if (window.EqLang && window.EqLang.get() === 'en') {
    const EN = {
      clasico: ['Explorer', 'Classic, with stripes'], ligero: ['Agile', 'Slim and fast'], blindado: ['Armored', 'Shoulder and knee pads'], piloto: ['Pilot', 'Jumpsuit with collar and zipper'],
      suave: ['Soft'],
      '#6FE3E8': ['Aqua'], '#E8418C': ['Pink'], '#FFB547': ['Amber'], '#A78BFA': ['Violet'], '#FF7A5C': ['Coral'], '#5FD08A': ['Green'], '#4C8DFF': ['Blue'], '#F4F1E8': ['White'],
      estrella: ['Star'], cohete: ['Rocket'], luna: ['Moon'], planeta: ['Planet'], sol: ['Sun'], corazon: ['Heart'], rayo: ['Lightning'], telescopio: ['Telescope'], trofeo: ['Trophy'], escudo: ['Shield'],
      alegre: ['Cheerful'], serio: ['Serious'], decidido: ['Determined'], rabioso: ['Fierce'],
      femenino: ['Female'], masculino: ['Male'], neutro: ['Neutral'],
      '#F2CBA8': ['Light'], '#D9A27A': ['Medium light'], '#B07A55': ['Medium'], '#8A5A3B': ['Tan'], '#5E3A26': ['Dark'],
      corto: ['Short'], 'corto-liso': ['Short straight'], 'corto-afro': ['Short afro'], 'largo-liso': ['Long straight'], 'largo-rizado': ['Long curly'], 'largo-afro': ['Long afro'],
      '#2B1B14': ['Black'], '#5A3520': ['Brown'], '#A8642E': ['Copper'], '#E0B45A': ['Blond'], '#C9473E': ['Red'], '#7A5CE0': ['Galaxy'], '#E8E9F2': ['Silver']
    };
    Object.keys(OPCIONES).forEach((g) => OPCIONES[g].forEach((o) => {
      const t = (g === 'colorCabello' || g === 'piel' || g === 'acento') ? EN[o.id] : EN[o.id];
      if (t) { o.nombre = t[0]; if (t[1]) o.desc = t[1]; }
    }));
  }
  const MAX_INSIGNIAS = 3;
  // Insignia y color sugeridos según la especialidad del test
  const POR_ESPECIALIDAD = {
    E: { insignia: 'telescopio', acento: '#6FE3E8' }, T: { insignia: 'trofeo', acento: '#FFB547' },
    G: { insignia: 'escudo', acento: '#E8418C' }, S: { insignia: 'sol', acento: '#A78BFA' }
  };

  const PREDETERMINADO = {
    traje: 'clasico', contorno: 'suave', acento: '#6FE3E8', insignias: ['estrella'],
    gesto: 'alegre', genero: 'neutro', piel: '#B07A55', cabello: 'corto', colorCabello: '#2B1B14', casco: true
  };

  /* ---------- Utilidades de color ---------- */
  function mezclar(hex, otro, k) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(otro.slice(1), 16);
    const c = [16, 8, 0].map((s) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  const oscuro = (h, k = 0.28) => mezclar(h, '#000000', k);

  /* ---------- Insignias (dibujadas en una caja de 20 x 20 centrada) ---------- */
  function icono(id, col) {
    const f = `fill="${col}"`;
    switch (id) {
      case 'estrella': return `<path d="M0 -8 L2.4 -2.6 L8 -2.4 L3.6 1.2 L5 7 L0 3.8 L-5 7 L-3.6 1.2 L-8 -2.4 L-2.4 -2.6Z" ${f}/>`;
      case 'cohete': return `<path d="M0 -9 Q5 -4 4 4 L-4 4 Q-5 -4 0 -9Z" ${f}/><path d="M-4 1 L-7 6 L-4 5Z M4 1 L7 6 L4 5Z" ${f}/><circle cx="0" cy="-2" r="1.6" fill="#fff"/><path d="M-2 5 L0 9 L2 5Z" fill="#FFB547"/>`;
      case 'luna': return `<path d="M3 -8 A8.5 8.5 0 1 0 7 5 A7 7 0 1 1 3 -8Z" ${f}/>`;
      case 'planeta': return `<circle r="5.5" ${f}/><ellipse rx="9.5" ry="3" fill="none" stroke="${col}" stroke-width="1.8" transform="rotate(-20)"/>`;
      case 'sol': return `<circle r="4.5" ${f}/>` + Array.from({ length: 8 }, (_, i) => `<rect x="-1" y="-9" width="2" height="3" rx="1" ${f} transform="rotate(${i * 45})"/>`).join('');
      case 'corazon': return `<path d="M0 7 L-6.5 0.5 A3.8 3.8 0 0 1 0 -4.5 A3.8 3.8 0 0 1 6.5 0.5Z" ${f}/>`;
      case 'rayo': return `<path d="M2 -9 L-5 1 L-0.5 1 L-2 9 L5 -1.5 L0.5 -1.5Z" ${f}/>`;
      case 'telescopio': return `<rect x="-8" y="-3" width="14" height="5" rx="2" ${f} transform="rotate(-25)"/><path d="M-1 1 L-4 8 M-1 1 L2 8" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`;
      case 'trofeo': return `<path d="M-5 -7 H5 V-2 A5 5 0 0 1 -5 -2Z" ${f}/><path d="M-5 -5 H-8 Q-8 0 -4 0 M5 -5 H8 Q8 0 4 0" fill="none" stroke="${col}" stroke-width="1.5"/><rect x="-1.2" y="2" width="2.4" height="3" ${f}/><rect x="-4" y="5" width="8" height="2.5" rx="1" ${f}/>`;
      case 'escudo': return `<path d="M0 -8 L7 -5 Q7 4 0 8 Q-7 4 -7 -5Z" ${f}/><path d="M0 4 L-3 1 A1.7 1.7 0 0 1 0 -1.5 A1.7 1.7 0 0 1 3 1Z" fill="#fff"/>`;
      default: return '';
    }
  }
  function insignia(id, x, y, r, acento) {
    return `<g class="av-insignia" transform="translate(${x} ${y})">
      <circle r="${r}" fill="${C.navy}" stroke="${acento}" stroke-width="2"/>
      <g transform="scale(${(r / 11).toFixed(2)})">${icono(id, acento === '#F4F1E8' ? '#FFD58A' : acento)}</g></g>`;
  }

  /* ---------- Cabello: parte de atrás (detrás de la cabeza) y de adelante ---------- */
  function rizos(cx, cy, rx, ry, desde, hasta, n, r, col) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = ((desde + (hasta - desde) * (i / (n - 1))) * Math.PI) / 180;
      s += `<circle cx="${(cx + Math.cos(a) * rx).toFixed(1)}" cy="${(cy + Math.sin(a) * ry).toFixed(1)}" r="${(r + (i % 3) * 1.2).toFixed(1)}" fill="${col}"/>`;
    }
    return s;
  }
  function cabello(estilo, col) {
    const os = oscuro(col, 0.22);
    switch (estilo) {
      case 'corto-liso':
        return { atras: '', frente: `<path d="M-28 -180 Q-31 -214 2 -214 Q31 -212 28 -180 L26 -189 Q14 -201 -6 -198 Q-18 -195 -24 -185Z" fill="${col}"/>
          <path d="M-4 -206 Q8 -203 16 -196" stroke="${os}" stroke-width="2" fill="none" stroke-linecap="round"/>` };
      case 'corto-afro':
        return { atras: `<ellipse cx="0" cy="-192" rx="35" ry="29" fill="${col}"/>`,
          frente: rizos(0, -190, 30, 23, 190, 350, 11, 9, col) + `<ellipse cx="0" cy="-205" rx="24" ry="12" fill="${col}"/>` };
      case 'largo-afro':
        return { atras: `<ellipse cx="0" cy="-182" rx="46" ry="44" fill="${col}"/>` + rizos(0, -182, 44, 42, 0, 360, 22, 11, col),
          frente: rizos(0, -192, 26, 20, 200, 340, 9, 8.5, col) };
      case 'largo-liso':
        return { atras: `<path d="M-30 -184 Q-33 -217 0 -217 Q33 -217 30 -184 L33 -128 Q16 -122 0 -125 Q-16 -122 -33 -128Z" fill="${os}"/>`,
          frente: `<path d="M-28 -178 Q-31 -214 0 -214 Q31 -214 28 -178 Q26 -194 14 -197 L12 -192 L4 -198 Q-14 -199 -24 -190Z" fill="${col}"/>
            <path d="M-29 -182 L-30 -140 M29 -182 L30 -140" stroke="${col}" stroke-width="5" stroke-linecap="round"/>` };
      case 'largo-rizado':
        return { atras: `<path d="M-30 -184 Q-33 -217 0 -217 Q33 -217 30 -184 L32 -132 Q0 -122 -32 -132Z" fill="${os}"/>` +
            [-1, 1].map((l) => Array.from({ length: 7 }, (_, i) => `<circle cx="${l * (31 + (i % 2) * 3)}" cy="${-196 + i * 11}" r="${8 + (i % 2)}" fill="${os}"/>`).join('')).join(''),
          frente: rizos(0, -191, 27, 21, 195, 345, 10, 7.5, col) + `<ellipse cx="0" cy="-206" rx="22" ry="9" fill="${col}"/>` };
      default: // corto
        return { atras: '', frente: `<path d="M-28 -181 Q-30 -213 0 -213 Q30 -213 28 -181 Q24 -196 12 -198 Q0 -193 -14 -198 Q-24 -196 -28 -181Z" fill="${col}"/>` };
    }
  }

  /* ---------- Cara: gestos según el género ---------- */
  function cara(gesto, genero, piel) {
    const N = C.navy, L = (d, w = 2.4, c = N) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const grosorCeja = genero === 'masculino' ? 3.4 : genero === 'femenino' ? 2.2 : 2.7;
    const labio = genero === 'femenino' ? '#B63A63' : N;
    const ojo = (x, ry = 4.3) => `<ellipse cx="${x}" cy="-182" rx="3.4" ry="${ry}" fill="${N}"/><circle cx="${x + 1.2}" cy="-183.6" r="1.2" fill="#fff"/>`;
    let ojos, cejas, boca, mejilla = 0.35;
    switch (gesto) {
      case 'serio':
        ojos = ojo(-10) + ojo(10); cejas = L('M-15 -192 L-5 -192', grosorCeja) + L('M5 -192 L15 -192', grosorCeja);
        boca = L('M-6 -168 L6 -168', 2.4, labio); mejilla = 0.15; break;
      case 'decidido':
        ojos = ojo(-10, 3.4) + ojo(10, 3.4) + L('M-14 -185.5 L-6 -184.5', 2, N) + L('M14 -185.5 L6 -184.5', 2, N);
        cejas = L('M-15.5 -194 L-5 -190.5', grosorCeja) + L('M15.5 -194 L5 -190.5', grosorCeja);
        boca = L('M-6 -168.5 Q1 -165 8 -170', 2.4, labio); mejilla = 0.25; break;
      case 'rabioso':
        ojos = ojo(-10, 3.4) + ojo(10, 3.4);
        cejas = L('M-16 -196 L-4 -189', grosorCeja + 0.8) + L('M16 -196 L4 -189', grosorCeja + 0.8);
        boca = `<rect x="-8" y="-173" width="16" height="7" rx="2.5" fill="#fff" stroke="${N}" stroke-width="2"/>` + L('M-8 -169.5 H8', 1.2) + L('M-2.5 -173 V-166 M2.5 -173 V-166', 1);
        mejilla = 0.7; break;
      default: // alegre
        ojos = ojo(-10) + ojo(10); cejas = L('M-15 -193 Q-10 -197 -5 -193', grosorCeja) + L('M5 -193 Q10 -197 15 -193', grosorCeja);
        boca = `<path d="M-8 -170 Q0 -160 8 -170Z" fill="${N}" stroke="${N}" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="0" cy="-165.6" rx="3.2" ry="1.6" fill="${C.rosa}"/>`;
    }
    const pestanas = genero === 'femenino' ? L('M-13.2 -184.5 L-16.5 -187', 1.6) + L('M-12 -186 L-14 -189.5', 1.4) + L('M13.2 -184.5 L16.5 -187', 1.6) + L('M12 -186 L14 -189.5', 1.4) : '';
    const mejillas = `<circle cx="-17" cy="-173" r="4.2" fill="${C.rosa}" opacity="${mejilla}"/><circle cx="17" cy="-173" r="4.2" fill="${C.rosa}" opacity="${mejilla}"/>`;
    const nariz = `<path d="M0 -180 Q-2.5 -175 0 -174" stroke="${oscuro(piel, 0.25)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    return `<g class="av-cara">${mejillas}<g class="av-ojos">${ojos}</g>${pestanas}${cejas}${nariz}${boca}</g>`;
  }

  /* ---------- Avatar completo ---------- */
  let uid = 0;
  function svg(cfg, op = {}) {
    const c = Object.assign({}, PREDETERMINADO, cfg || {});
    const A = c.acento, Ao = oscuro(A, 0.25);
    const id = `av${++uid}`;
    const w = c.traje === 'ligero' ? 31 : c.traje === 'blindado' ? 37 : 35;   // media anchura del torso
    const ci = c.genero === 'femenino' ? 5 : 0;                                  // cintura
    const brazo = c.traje === 'ligero' ? 14 : 17;
    const trajeColor = c.traje === 'piloto' ? '#DCE0F2' : C.traje;

    const torso = `<path d="M${-w} -136 Q${-w} -150 ${-w + 14} -150 H${w - 14} Q${w} -150 ${w} -136 L${w - ci} -106 L${w} -86 Q${w} -76 ${w - 8} -76 H${-w + 8} Q${-w} -76 ${-w} -86 L${-w + ci} -106Z" fill="${trajeColor}"/>`;
    const mochila = c.traje === 'ligero'
      ? `<rect x="-26" y="-148" width="52" height="44" rx="12" fill="${C.mochila}"/>`
      : `<rect x="${-w - 9}" y="-152" width="${2 * w + 18}" height="62" rx="15" fill="${C.mochila}"/><rect x="${-w - 9}" y="-116" width="${2 * w + 18}" height="5" fill="${A}" opacity=".8"/>`;
    const pierna = (l) => {
      const x = l < 0 ? -25 : 4;
      return `<g class="av-pierna">
        <rect x="${x}" y="-84" width="21" height="74" rx="9" fill="${trajeColor}"/>
        ${c.traje === 'clasico' ? `<rect x="${x}" y="-48" width="21" height="5" fill="${A}"/>` : ''}
        ${c.traje === 'ligero' ? `<path d="M${l < 0 ? x + 2 : x + 19} -80 V-20" stroke="${A}" stroke-width="2.5" stroke-linecap="round"/>` : ''}
        ${c.traje === 'blindado' ? `<rect x="${x - 1}" y="-54" width="23" height="14" rx="6" fill="${A}"/><rect x="${x + 3}" y="-50" width="15" height="3" rx="1.5" fill="${Ao}"/>` : ''}
        ${c.traje === 'piloto' ? `<rect x="${x + 3}" y="-66" width="15" height="13" rx="3" fill="${C.sombra}"/><rect x="${x + 3}" y="-66" width="15" height="4" rx="2" fill="${A}"/>` : ''}
        <rect x="${x - 2}" y="-20" width="25" height="20" rx="7" fill="${C.bota}"/>
        <rect x="${x - 2}" y="-5" width="25" height="5" rx="2.5" fill="${A}"/></g>`;
    };
    const brazoSvg = (l) => {
      const x = l < 0 ? -w - brazo + 1 : w - 1;
      const cx = x + brazo / 2;
      return `<g class="av-brazo ${l < 0 ? 'av-bi' : 'av-bd'}">
        <rect x="${x}" y="-146" width="${brazo}" height="60" rx="${brazo / 2}" fill="${trajeColor}"/>
        ${c.traje === 'clasico' ? `<rect x="${x}" y="-120" width="${brazo}" height="5" fill="${A}"/>` : ''}
        ${c.traje === 'ligero' ? `<path d="M${cx} -140 V-96" stroke="${A}" stroke-width="2.5" stroke-linecap="round"/>` : ''}
        <rect x="${x - 1}" y="-94" width="${brazo + 2}" height="7" rx="3" fill="${A}"/>
        <circle cx="${cx}" cy="-82" r="${brazo / 2 + 1.5}" fill="${C.sombra}"/>
        ${c.traje === 'blindado' ? `<ellipse cx="${cx + l * 2}" cy="-144" rx="${brazo / 2 + 7}" ry="11" fill="${A}"/><ellipse cx="${cx + l * 2}" cy="-147" rx="${brazo / 2 + 2}" ry="4" fill="#fff" opacity=".3"/>` : ''}
      </g>`;
    };
    // Detalles del pecho según el tipo de traje
    let pecho = `<rect x="-${w}" y="-90" width="${2 * w}" height="8" fill="${C.sombra}"/><rect x="-7" y="-91" width="14" height="10" rx="3" fill="${A}"/>`;
    if (c.traje === 'piloto') {
      pecho += `<path d="M0 -134 V-92" stroke="${C.sombra}" stroke-width="3"/><path d="M-15 -150 L0 -132 L15 -150" fill="none" stroke="${A}" stroke-width="5" stroke-linejoin="round"/>
        <rect x="-${w - 6}" y="-128" width="16" height="11" rx="3" fill="${C.sombra}"/>`;
    } else {
      pecho += `<rect x="-20" y="-136" width="24" height="17" rx="4" fill="${C.panel}"/>
        <circle class="av-luz" cx="-14" cy="-127.5" r="3" fill="${C.aqua}"/><circle cx="-6" cy="-127.5" r="3" fill="${A}"/>`;
    }
    if (c.traje === 'blindado') pecho += `<path d="M${-w + 4} -112 Q0 -100 ${w - 4} -112" fill="none" stroke="${A}" stroke-width="4" stroke-linecap="round"/>`;
    if (c.traje === 'ligero') pecho += `<path d="M${-w + 4} -140 L${-w + ci + 3} -106 L${-w + 4} -88 M${w - 4} -140 L${w - ci - 3} -106 L${w - 4} -88" fill="none" stroke="${A}" stroke-width="2.5" stroke-linecap="round"/>`;

    // Insignias: pecho, hombro izquierdo y hombro derecho
    const lugares = [[16, -126, 10], [-w - brazo / 2 + 1, -126, 7.5], [w + brazo / 2 - 1, -126, 7.5]];
    const ins = (c.insignias || []).slice(0, MAX_INSIGNIAS).map((n, i) => insignia(n, lugares[i][0], lugares[i][1], lugares[i][2], A)).join('');

    const pelo = cabello(c.cabello, c.colorCabello);
    const cabezaForma = c.genero === 'masculino' ? `<path d="M-27 -186 Q-27 -210 0 -210 Q27 -210 27 -186 L26 -172 Q22 -156 0 -155 Q-22 -156 -26 -172Z" fill="${c.piel}"/>`
      : c.genero === 'femenino' ? `<ellipse cx="0" cy="-182" rx="26" ry="28" fill="${c.piel}"/>` : `<circle cx="0" cy="-182" r="27" fill="${c.piel}"/>`;
    const contorno = '';
    const radioCasco = c.cabello === 'largo-afro' ? 62 : c.cabello === 'corto-afro' ? 54 : 51;
    const casco = c.casco ? `<g class="av-casco">
        <circle cx="0" cy="-180" r="${radioCasco}" fill="url(#${id}-vidrio)" stroke="rgba(232,233,242,.85)" stroke-width="3"/>
        <path d="M${-radioCasco * 0.72} ${-180 - radioCasco * 0.38} A${radioCasco * 0.82} ${radioCasco * 0.82} 0 0 1 ${-radioCasco * 0.18} ${-180 - radioCasco * 0.8}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>
        <circle cx="${radioCasco * 0.62}" cy="${-180 - radioCasco * 0.55}" r="4" fill="#fff" opacity=".5"/></g>` : '';
    const anillo = `<ellipse cx="0" cy="-150" rx="${c.casco ? 30 : 22}" ry="8" fill="${c.casco ? C.sombra : oscuro(c.piel, 0.15)}"/>${c.casco ? `<ellipse cx="0" cy="-151" rx="30" ry="4" fill="${A}" opacity=".9"/>` : ''}`;

    const vb = op.recorte === 'cabeza' ? '-56 -240 112 112' : '-82 -250 164 260';
    const fondo = op.fondo === false ? '' : `<ellipse class="av-sombra" cx="0" cy="2" rx="46" ry="7" fill="#000" opacity=".35"/>`;
    return `<svg class="avatar-svg ${op.clase || ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${op.etiqueta || (window.EqLang ? window.EqLang.L('Tu astronauta', 'Your astronaut') : 'Tu astronauta')}">
      <defs><radialGradient id="${id}-vidrio" cx=".35" cy=".3" r=".8">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".6" stop-color="${C.aqua}" stop-opacity=".08"/><stop offset="1" stop-color="${C.aqua}" stop-opacity=".22"/></radialGradient></defs>
      ${fondo}
      <g class="av-cuerpo">
        <g ${contorno}>
          ${mochila}
          ${pelo.atras}
          ${pierna(-1)}${pierna(1)}
          ${brazoSvg(-1)}${brazoSvg(1)}
          ${torso}
          ${pecho}
          <rect x="-8" y="-162" width="16" height="12" fill="${oscuro(c.piel, 0.12)}"/>
          ${anillo}
          <g class="av-cabeza">
            <circle cx="-27" cy="-180" r="5.5" fill="${c.piel}"/><circle cx="27" cy="-180" r="5.5" fill="${c.piel}"/>
            ${cabezaForma}
            ${pelo.frente}
          </g>
        </g>
        ${ins}
        <g class="av-cabeza">${cara(c.gesto, c.genero, c.piel)}</g>
        ${casco}
      </g>
    </svg>`;
  }

  /* ---------- Guardado ---------- */
  function leer(clave) { try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; } }
  function escribir(clave, valor) { try { localStorage.setItem(clave, JSON.stringify(valor)); return true; } catch (e) { return false; } }

  function limpiar(cfg) {
    const c = Object.assign({}, PREDETERMINADO);
    if (!cfg) return c;
    const vale = (lista, v) => OPCIONES[lista].some((o) => o.id === v);
    ['traje', 'contorno', 'acento', 'gesto', 'genero', 'piel', 'cabello', 'colorCabello'].forEach((k) => {
      const lista = k === 'colorCabello' ? 'colorCabello' : k;
      if (vale(lista, cfg[k])) c[k] = cfg[k];
    });
    if (Array.isArray(cfg.insignias)) c.insignias = cfg.insignias.filter((i) => vale('insignias', i)).slice(0, MAX_INSIGNIAS);
    if (typeof cfg.casco === 'boolean') c.casco = cfg.casco;
    return c;
  }

  /* Avatar guardado, o null si el niño todavía no lo diseñó. */
  function cargar() {
    const g = leer(CLAVE);
    return g ? limpiar(g) : null;
  }

  /* Sugerencia inicial a partir del perfil del test (color e insignia de su especialidad). */
  function sugerido() {
    const c = Object.assign({}, PREDETERMINADO);
    const p = leer('equilibria:perfil');
    const e = p && p.especialidad && POR_ESPECIALIDAD[p.especialidad.id];
    if (e) { c.acento = e.acento; c.insignias = [e.insignia]; }
    return c;
  }

  function guardar(cfg) {
    const c = limpiar(cfg);
    const ok = escribir(CLAVE, Object.assign({ version: 1, actualizado: new Date().toISOString() }, c));
    // Copia dentro del perfil del test y del perfil que lee el prototipo actual
    const perfil = leer('equilibria:perfil');
    if (perfil) { perfil.avatar = c; escribir('equilibria:perfil', perfil); }
    const legado = leer('outpost:profile') || {};
    legado.avatar = c; escribir('outpost:profile', legado);
    return ok;
  }

  /* Dibuja el avatar guardado (o el sugerido) dentro de un elemento. */
  function montar(el, op = {}) {
    if (!el) return;
    el.innerHTML = svg(cargar() || sugerido(), op);
  }

  function nombre() {
    const p = leer('equilibria:perfil');
    return (p && p.nombre) || (window.EqLang ? window.EqLang.L('Astronauta', 'Astronaut') : 'Astronauta');
  }

  window.EqAvatar = { OPCIONES, PREDETERMINADO, MAX_INSIGNIAS, POR_ESPECIALIDAD, svg, cargar, guardar, sugerido, montar, nombre, limpiar };
})();
