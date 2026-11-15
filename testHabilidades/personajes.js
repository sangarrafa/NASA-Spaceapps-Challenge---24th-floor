/* Personaje secreto
   1. Silueta oscura de un astronauta que se llena 10 % por respuesta, con un
      líquido vibrante y destellos dorados (tercio derecho de la pantalla).
   2. Los 4 astronautas finales, uno por especialidad.
   3. La gran revelación: tocar rápido para despejar el vapor. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const E = () => window.EqEscenas;
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 1. Silueta ================= */
  const FORMAS = `
    <circle cx="100" cy="74" r="54"/>
    <rect x="40" y="114" width="120" height="80" rx="26"/>
    <rect x="50" y="116" width="100" height="126" rx="32"/>
    <rect x="15" y="128" width="35" height="104" rx="17.5"/>
    <rect x="150" y="128" width="35" height="104" rx="17.5"/>
    <rect x="56" y="226" width="46" height="104" rx="18"/>
    <rect x="98" y="226" width="46" height="104" rx="18"/>
    <rect x="46" y="312" width="58" height="34" rx="13"/>
    <rect x="96" y="312" width="58" height="34" rx="13"/>
    <rect x="96" y="6" width="8" height="18" rx="3"/>
    <circle cx="100" cy="8" r="7"/>`;
  const ARRIBA = 0, ABAJO = 348; // límites verticales de la silueta

  function ola(ancho = 600, amp = 7) {
    let d = `M-200 0`;
    for (let x = -200; x < ancho - 200; x += 100) d += ` q25 ${-amp} 50 0 t50 0`;
    return d;
  }

  const silueta = {
    el: null, nivel: 0, objetivo: 0, anim: null,
    montar(cont) {
      this.el = cont;
      let destellos = '';
      for (let i = 0; i < 26; i++) {
        const x = 18 + ((i * 53) % 166), y = 8 + ((i * 97) % 380), r = 2 + (i % 3);
        destellos += `<path class="destello-oro" style="animation-delay:-${((i * 0.29) % 2.4).toFixed(2)}s" transform="translate(${x} ${y})" d="M0 ${-r * 2} L${r * 0.5} ${-r * 0.5} L${r * 2} 0 L${r * 0.5} ${r * 0.5} L0 ${r * 2} L${-r * 0.5} ${r * 0.5} L${-r * 2} 0 L${-r * 0.5} ${-r * 0.5}Z" fill="#FFE29A"/>`;
      }
      let burbujas = '';
      for (let i = 0; i < 12; i++) {
        burbujas += `<circle class="chispa-sube" style="animation-delay:-${(i * 0.37).toFixed(2)}s;animation-duration:${(2.4 + (i % 4) * 0.5).toFixed(1)}s" cx="${26 + ((i * 41) % 150)}" cy="${120 + (i % 5) * 50}" r="${1.4 + (i % 3) * 0.8}" fill="#FFD58A"/>`;
      }
      cont.innerHTML = `<svg viewBox="0 0 200 356" class="silueta-svg" role="img" aria-label="${window.EqLang ? window.EqLang.L('Silueta de tu personaje secreto', 'Silhouette of your secret character') : 'Silueta de tu personaje secreto'}">
        <defs>
          <clipPath id="clipSil">${FORMAS}</clipPath>
          <clipPath id="clipNivel"><rect id="rectNivel" x="-20" y="${ABAJO + 8}" width="240" height="420"/></clipPath>
          <linearGradient id="gradLleno" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="360">
            <stop offset="0" stop-color="#FFD58A"/><stop offset=".12" stop-color="#FF7A5C"/>
            <stop offset=".45" stop-color="#E8418C"/><stop offset=".8" stop-color="#A0279E"/><stop offset="1" stop-color="#4B2A9E"/>
          </linearGradient>
          <filter id="brilloOro" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5"/></filter>
        </defs>
        <g fill="none" stroke="rgba(111,227,232,.28)" stroke-width="3">${FORMAS}</g>
        <g clip-path="url(#clipNivel)">
          <g fill="none" stroke="#FFC94D" stroke-width="10" filter="url(#brilloOro)" class="aura-oro">${FORMAS}</g>
          <g fill="none" stroke="#FFE29A" stroke-width="4">${FORMAS}</g>
        </g>
        <g fill="#0A0D2A">${FORMAS}</g>
        <g clip-path="url(#clipSil)">
          <g id="lleno" transform="translate(0 ${ABAJO + 12})">
            <rect x="-10" y="0" width="220" height="420" fill="url(#gradLleno)"/>
            <path class="ola ola-2" d="${ola(600, 6)} L400 30 L-200 30Z" fill="#FF7A5C" opacity=".55" transform="translate(0 -3)"/>
            <path class="ola" d="${ola(600, 7)} L400 30 L-200 30Z" fill="#FFD58A"/>
            <path class="ola" d="${ola(600, 7)}" fill="none" stroke="#FFF3C4" stroke-width="3" filter="url(#brilloOro)"/>
            <g class="destellos-oro">${destellos}</g>
            <g>${burbujas}</g>
          </g>
          <g class="reflejo"><rect x="-60" y="-20" width="34" height="420" fill="#fff" opacity=".12" transform="rotate(18)"/></g>
        </g>
        <g id="rafaga"></g>
        <text class="incognita" x="100" y="86" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="54" fill="rgba(111,227,232,.35)">?</text>
      </svg>`;
      this.nivel = 0; this.objetivo = 0;
      this.pintar(0);
    },
    y(p) { return ABAJO + 12 - p * (ABAJO + 12 - ARRIBA); },
    pintar(p) {
      const y = this.y(p);
      const lleno = this.el.querySelector('#lleno');
      if (lleno) lleno.setAttribute('transform', `translate(0 ${y.toFixed(1)})`);
      const r = this.el.querySelector('#rectNivel');
      if (r) r.setAttribute('y', (y - 4).toFixed(1));
      const inc = this.el.querySelector('.incognita');
      if (inc) inc.style.opacity = String(Math.max(0, 1 - p * 1.6));
    },
    fijar(p) {
      if (!this.el) return;
      const desde = this.nivel; this.objetivo = p;
      cancelAnimationFrame(this.anim);
      const t0 = performance.now(), dur = reducir ? 1 : 1200;
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        this.nivel = desde + (p - desde) * e;
        this.pintar(this.nivel);
        if (k < 1) this.anim = requestAnimationFrame(paso);
      };
      this.anim = requestAnimationFrame(paso);
      this.rafaga(this.y(p));
      this.el.classList.remove('pulso'); void this.el.offsetWidth; this.el.classList.add('pulso');
      if (p >= 1) this.el.classList.add('completa'); else this.el.classList.remove('completa');
    },
    rafaga(y) {
      if (reducir) return;
      const g = this.el.querySelector('#rafaga');
      for (let i = 0; i < 16; i++) {
        const c = document.createElementNS(NS, 'circle');
        const x = 30 + Math.random() * 140;
        c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
        c.setAttribute('r', (1.5 + Math.random() * 2.5).toFixed(1));
        c.setAttribute('fill', Math.random() < 0.7 ? '#FFD58A' : '#fff');
        c.setAttribute('class', 'chispa-rafaga');
        c.style.setProperty('--dx', `${((Math.random() - 0.5) * 70).toFixed(0)}px`);
        c.style.setProperty('--dy', `${(-20 - Math.random() * 60).toFixed(0)}px`);
        c.style.animationDelay = `${(Math.random() * 0.25).toFixed(2)}s`;
        g.appendChild(c);
        setTimeout(() => c.remove(), 1500);
      }
    }
  };

  /* ================= 2. Los 4 astronautas finales ================= */
  const C = () => E().colores;
  const HEROES = {
    // Explorador de Cráteres: linterna de casco, antena y telescopio
    E: () => ({
      color: '#6FE3E8', pose: 'heroe-e',
      op: {
        casco: true, cara: 'feliz', acento: '#6FE3E8', luz2: '#fff', visor: ['#21C1E0', '#0B0F3A'],
        espalda: `<rect x="-25" y="-118" width="3" height="44" fill="#9A9CB5"/><circle class="antena-heroe" cx="-23.5" cy="-120" r="4.5" fill="#6FE3E8"/>`,
        cabezaExtra: `<path class="haz-casco" d="M-3 -116 L-46 -150 L-20 -162 Z" fill="#FFE29A" opacity=".45"/>
          <rect x="-8" y="-122" width="16" height="9" rx="3" fill="#9A9CB5"/><circle cx="0" cy="-117.5" r="3.8" fill="#FFF6B0"/>`,
        torsoExtra: `<circle cx="-13" cy="-48" r="5" fill="#0B0F3A" stroke="#6FE3E8" stroke-width="1.6"/><circle cx="-14.5" cy="-49" r="1.3" fill="#6FE3E8"/><circle cx="-11.5" cy="-46.5" r="1" fill="#6FE3E8"/>`,
        piernasExtra: `<rect x="5" y="-30" width="9" height="8" rx="2" fill="#6FE3E8"/>`,
        mano: `<g transform="rotate(105) translate(0 8)"><rect x="-2.5" y="-6" width="5" height="10" rx="1.5" fill="#2A2C4A"/>
          <path d="M-4 -4 L-7 -38 L7 -38 L4 -4 Z" fill="#6FE3E8"/><rect x="-7.5" y="-26" width="15" height="4" fill="#21C1E0"/>
          <rect x="-9" y="-44" width="18" height="8" rx="2" fill="#2A2C4A"/><ellipse cx="0" cy="-44" rx="7" ry="2" fill="#FFF6B0" opacity=".9"/></g>`
      }
    }),
    // Piloto de Récords: franjas de carreras, alas en el casco y trofeo en alto
    T: () => ({
      color: '#FFB547', pose: 'heroe-t',
      op: {
        casco: true, cara: 'feliz', acento: '#FFB547', luz2: '#FFE29A', visor: ['#FFB547', '#A0279E'],
        cabezaExtra: `<path d="M-21 -98 l-16 -9 l5 11 l-6 3 z" fill="#FFB547"/><path d="M21 -98 l16 -9 l-5 11 l6 3 z" fill="#FFB547"/>`,
        torsoExtra: `<rect x="-17" y="-78" width="4" height="38" fill="#FFB547"/><rect x="13" y="-78" width="4" height="38" fill="#FFB547"/>
          <path d="M0 -51 l2 4 4.5 .6 -3.3 3 .8 4.5 -4 -2.2 -4 2.2 .8 -4.5 -3.3 -3 4.5 -.6z" fill="#FFB547"/>`,
        piernasExtra: `<rect x="-12" y="-36" width="4" height="26" fill="#FFB547"/><rect x="8" y="-36" width="4" height="26" fill="#FFB547"/>`,
        mano: `<g transform="rotate(160) translate(0 -8)"><path d="M-10 -20 h20 v7 a10 10 0 0 1 -20 0z" fill="#FFB547"/>
          <path d="M-10 -17 q-7 0 -6 6 q1 4 7 4 M10 -17 q7 0 6 6 q-1 4 -7 4" stroke="#FFB547" stroke-width="2.4" fill="none"/>
          <rect x="-2.5" y="-4" width="5" height="7" fill="#E09A2B"/><rect x="-8" y="3" width="16" height="5" rx="1.5" fill="#E09A2B"/></g>`
      }
    }),
    // Guardián de la Tripulación: escudo con corazón, audífonos y botiquín
    G: () => ({
      color: '#E8418C', pose: 'heroe-g',
      op: {
        casco: true, cara: 'feliz', acento: '#E8418C', luz2: '#FFD1E3', visor: ['#E8418C', '#4B2A9E'],
        cabezaExtra: `<path d="M-22 -100 q0 -27 22 -27 q22 0 22 27" fill="none" stroke="#E8418C" stroke-width="4"/>
          <rect x="-27" y="-102" width="9" height="15" rx="4" fill="#E8418C"/><rect x="18" y="-102" width="9" height="15" rx="4" fill="#E8418C"/>
          <path d="M-23 -88 q2 10 13 10" stroke="#E8418C" stroke-width="2.4" fill="none"/><circle cx="-9" cy="-78" r="2.4" fill="#E8418C"/>`,
        torsoExtra: `<path d="M-9 -53 h18 v7 q0 9 -9 12 q-9 -3 -9 -12z" fill="#E8418C"/>
          <path d="M0 -40 l-4.5 -4.5 a2.6 2.6 0 0 1 4.5 -2.8 a2.6 2.6 0 0 1 4.5 2.8z" fill="#fff"/>`,
        mano: `<g transform="translate(0 4)"><rect x="-11" y="0" width="22" height="16" rx="3" fill="#fff"/><rect x="-4" y="-4" width="8" height="5" rx="2" fill="none" stroke="#fff" stroke-width="2"/>
          <path d="M-2 3 h4 v3.5 h3.5 v4 h-3.5 v3.5 h-4 v-3.5 h-3.5 v-4 h3.5z" fill="#E8418C"/></g>`
      }
    }),
    // Estratega Solar: capa violeta, emblema del Sol y tableta holográfica
    S: () => ({
      color: '#A78BFA', pose: 'heroe-s',
      op: {
        casco: true, cara: 'feliz', acento: '#A78BFA', luz2: '#FFB547', visor: ['#A78BFA', '#0B0F3A'],
        espalda: `<path class="capa" d="M-24 -76 Q-46 -26 -38 4 L38 4 Q46 -26 24 -76 Z" fill="#4B2A9E"/><path d="M-24 -76 Q-46 -26 -38 4 L-28 4 Q-36 -30 -16 -76Z" fill="#6B45C2"/>`,
        cabezaExtra: `<path d="M-13 -99 h10 M-13 -95 h6 M5 -86 h8" stroke="#6FE3E8" stroke-width="1.3" stroke-linecap="round"/>`,
        torsoExtra: `<g transform="translate(0 -47)"><circle r="5" fill="#FFB547"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-1" y="-10" width="2" height="4" rx="1" fill="#FFB547" transform="rotate(${a})"/>`).join('')}</g>`,
        mano: `<g transform="rotate(115) translate(0 -2)"><g class="holograma-tableta">
          <path d="M-4 -6 L-22 -34 L22 -34 L4 -6Z" fill="#6FE3E8" opacity=".18"/>
          <rect x="-24" y="-58" width="48" height="26" rx="4" fill="#6FE3E8" opacity=".25" stroke="#6FE3E8" stroke-width="1.5"/>
          <path d="M-18 -40 l10 -8 l8 5 l12 -10" stroke="#FFB547" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle cx="12" cy="-53" r="2.5" fill="#FFB547"/></g>
          <rect x="-8" y="-6" width="16" height="6" rx="2" fill="#2A2C4A"/></g>`
      }
    })
  };

  function heroe(id, conFondo = true) {
    const h = HEROES[id]();
    const fondo = conFondo ? `
      <defs><radialGradient id="aura-${id}"><stop offset="0" stop-color="${h.color}" stop-opacity=".55"/><stop offset="1" stop-color="${h.color}" stop-opacity="0"/></radialGradient></defs>
      <circle cx="0" cy="-70" r="96" fill="url(#aura-${id})"/>
      <circle cx="0" cy="-70" r="78" fill="none" stroke="${h.color}" stroke-width="2" stroke-dasharray="4 8" class="orbita-heroe"/>
      <ellipse cx="0" cy="6" rx="58" ry="10" fill="${h.color}" opacity=".25"/>` : '';
    return `<svg viewBox="-110 -180 220 200" class="heroe-svg" style="--c:${h.color}">${fondo}
      <g class="heroe-flota"><g transform="scale(1.25)">${E().astronauta(Object.assign({ clase: `heroe ${h.pose}` }, h.op))}</g></g></svg>`;
  }

  /* ================= 3. La gran revelación ================= */
  const TOQUES = 29;          // toques necesarios si no se deja de tocar
  const ESPERA_DECAE = 500;   // ms sin tocar antes de que el vapor vuelva
  const DECAE = 0.0045;       // cuánto vuelve el vapor por cuadro (60 fps)
  const revelacion = {
    d: 0, visto: 0, ultimo: 0, raf: null, listo: false, onRevelado: null,
    iniciar({ zona, avatar, vapor, chispas, medidor, saltar, especialidad, onRevelado, onDespejeInicia }) {
      this.zona = zona; this.vapor = vapor; this.chispas = chispas; this.medidor = medidor; this.avatar = avatar;
      this.d = 0; this.visto = 0; this.listo = false; this.onRevelado = onRevelado;
      this.empezo = false; this.onDespejeInicia = onDespejeInicia;
      avatar.innerHTML = heroe(especialidad);
      zona.style.setProperty('--c', HEROES[especialidad]().color);
      zona.classList.remove('revelada', 'despejando');
      // Nube de vapor: bocanadas de distintos tamaños, en capas, sin bordes duros.
      let nubes = '';
      const N = 26;
      for (let i = 0; i < N; i++) {
        const ang = i * 2.399963; // ángulo áureo: reparte las bocanadas de forma natural
        const rad = 4 + Math.sqrt(i / N) * 34;
        const x = 50 + Math.cos(ang) * rad, y = 50 + Math.sin(ang) * rad * 0.85;
        const tam = 30 + ((i * 17) % 28) + (i < 8 ? 14 : 0);
        const vel = (0.8 + ((i * 7) % 10) / 10).toFixed(2); // unas bocanadas se van más rápido que otras
        nubes += `<span class="nube" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--t:${tam}%;--dx:${Math.cos(ang).toFixed(2)};--dy:${Math.sin(ang).toFixed(2)};--v:${vel}">
          <i style="animation-delay:-${(i * 0.37).toFixed(2)}s;animation-duration:${(4 + (i % 5) * 0.7).toFixed(1)}s"></i></span>`;
      }
      vapor.innerHTML = `<span class="niebla"></span>${nubes}`;
      this.p3d = window.EqProfundidad && window.EqProfundidad.activo ? window.EqProfundidad.revela : null;
      if (this.p3d) { try { this.p3d.montar(zona); } catch (e) { this.p3d = null; zona.classList.remove('con-3d'); } }
      this.especialidad = especialidad;
      const tocar = (ev) => {
        if (this.listo) return;
        if (ev.type === 'keydown' && ev.key !== ' ' && ev.key !== 'Enter') return;
        ev.preventDefault();
        this.avisarInicio();
        this.d = Math.min(1, this.d + 1 / TOQUES);
        this.ultimo = performance.now();
        const r = zona.getBoundingClientRect();
        const x = ev.clientX ? ev.clientX - r.left : r.width / 2, y = ev.clientY ? ev.clientY - r.top : r.height / 2;
        this.chispa(x, y);
        this.soplo(x / r.width, y / r.height);
        if (this.p3d) this.p3d.toque(x / r.width, y / r.height);
        if (this.d >= 1) this.revelar();
      };
      zona.onpointerdown = tocar;
      zona.onkeydown = tocar;
      cancelAnimationFrame(this.raf);
      const bucle = () => {
        if (!this.listo && performance.now() - this.ultimo > ESPERA_DECAE && this.d > 0) this.d = Math.max(0, this.d - DECAE);
        // El valor que se ve persigue al real con suavidad: así la nube se mueve fluida, sin saltos.
        this.visto += (this.d - this.visto) * 0.12;
        this.pintar();
        this.raf = requestAnimationFrame(bucle);
      };
      this.raf = requestAnimationFrame(bucle);
      saltar.hidden = true;
      clearTimeout(this.tSaltar);
      this.tSaltar = setTimeout(() => { if (!this.listo) saltar.hidden = false; }, 10000);
      saltar.onclick = () => { this.avisarInicio(); this.d = 1; this.revelar(); };
    },
    /* Primer momento en que las nubes empiezan a despejarse (primer toque). */
    avisarInicio() {
      if (this.empezo) return;
      this.empezo = true;
      if (this.onDespejeInicia) this.onDespejeInicia();
    },
    pintar() {
      const v = this.visto.toFixed(4);
      this.vapor.style.setProperty('--d', v);
      this.zona.style.setProperty('--d', v);
      if (this.p3d) this.p3d.actualizar(this.visto);
      this.medidor.style.width = `${(Math.min(1, this.visto) * 100).toFixed(1)}%`;
    },
    /* Cada toque empuja un poco las bocanadas cercanas, como si soplara. */
    soplo(px, py) {
      this.vapor.querySelectorAll('.nube').forEach((n) => {
        const nx = parseFloat(n.style.left) / 100, ny = parseFloat(n.style.top) / 100;
        const dist = Math.hypot(nx - px, ny - py);
        if (dist > 0.35) return;
        const f = (0.35 - dist) / 0.35;
        n.style.setProperty('--px', `${((nx - px) * f * 60).toFixed(1)}px`);
        n.style.setProperty('--py', `${((ny - py) * f * 60).toFixed(1)}px`);
        clearTimeout(n._t);
        n._t = setTimeout(() => { n.style.setProperty('--px', '0px'); n.style.setProperty('--py', '0px'); }, 160);
      });
    },
    chispa(x, y) {
      for (let i = 0; i < 8; i++) {
        const s = document.createElement('span');
        s.className = 'chispa-toque';
        const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 50;
        s.style.left = `${x}px`; s.style.top = `${y}px`;
        s.style.setProperty('--x', `${(Math.cos(a) * r).toFixed(0)}px`);
        s.style.setProperty('--y', `${(Math.sin(a) * r).toFixed(0)}px`);
        this.chispas.appendChild(s);
        setTimeout(() => s.remove(), 800);
      }
    },
    revelar() {
      if (this.listo) return;
      this.listo = true;
      clearTimeout(this.tSaltar);
      this.d = 1.6; // las bocanadas terminan de salir volando, suavemente
      this.zona.classList.add('revelada');
      if (this.p3d) this.p3d.estallido(HEROES[this.especialidad]().color);
      setTimeout(() => { cancelAnimationFrame(this.raf); if (this.p3d && this.p3d.r) this.p3d.r.setAnimationLoop(null); }, 4000);
      setTimeout(() => this.onRevelado && this.onRevelado(), 1100);
    },
    detener() { this.listo = true; cancelAnimationFrame(this.raf); clearTimeout(this.tSaltar); if (this.p3d) this.p3d.desmontar(); }
  };

  window.EqPersonajes = { silueta, heroe, revelacion, colores: { E: '#6FE3E8', T: '#FFB547', G: '#E8418C', S: '#A78BFA' } };
})();
