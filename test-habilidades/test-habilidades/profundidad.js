/* Profundidad con Three.js (r186, lib/three.r186.min.js)
   Capa opcional encima de las escenas SVG: si no hay WebGL, todo sigue
   funcionando igual que antes.

   1. Escenas de las pruebas
      - Fondo 3D (solo exteriores): estrellas a distintas distancias, nebulosas y
        alguna estrella fugaz. La cámara se mece despacio y sigue al puntero, así
        lo lejano se mueve menos que lo cercano (paralaje real).
      - Frente 3D (todas): polvo y destellos flotando delante de la escena, y
        confeti en 3D en el podio.
      - Las capas del dibujo SVG se separan por profundidad (fondo, entorno,
        personajes) y se desplazan con la misma cámara.
   2. La gran revelación: nube volumétrica de bocanadas 3D, chispas doradas en
      cada toque y un estallido dorado al revelar. */
(function () {
  const T = window.THREE;
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let webgl = false;
  try {
    const c = document.createElement('canvas');
    webgl = !!(T && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { webgl = false; }
  if (!webgl) { window.EqProfundidad = { activo: false, escena: { montar() {} }, revela: null }; return; }

  const EXTERIORES = new Set(['cueva', 'companero', 'caminos', 'sentir', 'premio']);
  const PR = Math.min(window.devicePixelRatio || 1, 1.75);

  /* ---------- Texturas generadas (sin archivos) ---------- */
  function texturaRadial(stops, tam = 64) {
    const c = document.createElement('canvas');
    c.width = c.height = tam;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
    stops.forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr; g.fillRect(0, 0, tam, tam);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  const TEX = {};
  function tex(nombre) {
    if (TEX[nombre]) return TEX[nombre];
    if (nombre === 'punto') TEX[nombre] = texturaRadial([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']]);
    if (nombre === 'nebulosa') TEX[nombre] = texturaRadial([[0, 'rgba(255,255,255,.55)'], [0.4, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']], 128);
    if (nombre === 'nube') {
      // Bocanada con textura: varios círculos suaves superpuestos
      const tam = 128, c = document.createElement('canvas');
      c.width = c.height = tam;
      const g = c.getContext('2d');
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2, r = i === 0 ? 0 : 18 + (i % 3) * 6;
        const x = tam / 2 + Math.cos(a) * r, y = tam / 2 + Math.sin(a) * r * 0.8, rad = i === 0 ? 46 : 26 + (i % 4) * 5;
        const gr = g.createRadialGradient(x - rad * 0.2, y - rad * 0.25, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.55, 'rgba(232,234,248,.7)'); gr.addColorStop(1, 'rgba(200,204,228,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      }
      TEX[nombre] = new T.CanvasTexture(c);
      TEX[nombre].colorSpace = T.SRGBColorSpace;
    }
    return TEX[nombre];
  }

  /* ---------- Puntero compartido (paralaje) ---------- */
  const puntero = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    puntero.x = (e.clientX / innerWidth) * 2 - 1;
    puntero.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  function crearRenderer() {
    const r = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    r.setPixelRatio(PR);
    r.setClearColor(0x000000, 0);
    r.domElement.className = 'lienzo-3d';
    r.domElement.setAttribute('aria-hidden', 'true');
    return r;
  }

  /* Partículas suaves con tamaño según distancia */
  function nubeDePuntos(n, generar, opciones = {}) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const c = new T.Color();
    for (let i = 0; i < n; i++) {
      const p = generar(i);
      pos.set([p.x, p.y, p.z], i * 3);
      c.set(p.color || '#ffffff');
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const mat = new T.PointsMaterial({
      size: opciones.tam || 0.12, map: tex('punto'), vertexColors: true, transparent: true,
      depthWrite: false, blending: opciones.aditivo === false ? T.NormalBlending : T.AdditiveBlending,
      opacity: opciones.opacidad ?? 1, sizeAttenuation: true
    });
    return new T.Points(geo, mat);
  }

  /* ================= 1. Escenas ================= */
  const escena = {
    rFondo: null, rFrente: null, cont: null, capas: [], tiempo: 0, suave: { x: 0, y: 0 },
    montar(cont, id) {
      this.desmontar();
      this.cont = cont;
      this.id = id;
      const exterior = EXTERIORES.has(id);
      cont.classList.add('con-3d');
      cont.classList.toggle('exterior-3d', exterior);
      const svg = cont.querySelector('svg');
      if (svg) this.separarCapas(svg, exterior);

      // Frente: polvo flotante (y confeti en el podio)
      this.rFrente = this.rFrente || crearRenderer();
      this.rFrente.domElement.classList.add('lienzo-frente');
      this.rFrente.domElement.classList.remove('lienzo-fondo');
      cont.appendChild(this.rFrente.domElement);
      this.sFrente = new T.Scene();
      this.cFrente = new T.PerspectiveCamera(50, 640 / 230, 0.1, 100);
      this.cFrente.position.set(0, 0, 6);
      const tonos = exterior ? ['#ffffff', '#6FE3E8', '#FFE29A'] : ['#FFE29A', '#ffffff', '#E8418C'];
      this.polvo = nubeDePuntos(70, (i) => ({
        x: (Math.random() - 0.5) * 16, y: (Math.random() - 0.5) * 6, z: -2 + Math.random() * 6.5,
        color: tonos[i % tonos.length]
      }), { tam: 0.09, opacidad: 0.7 });
      this.polvo.userData.vel = Array.from({ length: 70 }, () => 0.05 + Math.random() * 0.12);
      this.sFrente.add(this.polvo);
      if (id === 'premio') this.crearConfeti();

      // Fondo 3D (solo exteriores): estrellas en profundidad, nebulosas y estrellas fugaces
      if (exterior) {
        this.rFondo = this.rFondo || crearRenderer();
        this.rFondo.domElement.classList.add('lienzo-fondo');
        this.rFondo.domElement.classList.remove('lienzo-frente');
        cont.insertBefore(this.rFondo.domElement, cont.firstChild);
        this.sFondo = new T.Scene();
        this.cFondo = new T.PerspectiveCamera(55, 640 / 230, 0.1, 400);
        this.cFondo.position.set(0, 0, 10);
        const colores = ['#ffffff', '#ffffff', '#ffffff', '#CDEFFF', '#FFE6C4', '#E9D8FF'];
        this.estrellas = nubeDePuntos(1400, (i) => ({
          x: (Math.random() - 0.5) * 260, y: (Math.random() - 0.5) * 110, z: -10 - Math.random() * 190,
          color: colores[i % colores.length]
        }), { tam: 0.9 });
        this.sFondo.add(this.estrellas);
        this.nebulosas = [];
        [['#4B2A9E', -40, 12, -120, 120], ['#A0279E', 50, -6, -150, 140], ['#21C1E0', 10, 20, -90, 70]].forEach(([col, x, y, z, s]) => {
          const sp = new T.Sprite(new T.SpriteMaterial({ map: tex('nebulosa'), color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
          sp.position.set(x, y, z); sp.scale.set(s, s * 0.6, 1);
          this.sFondo.add(sp); this.nebulosas.push(sp);
        });
        this.fugaz = new T.Mesh(new T.PlaneGeometry(1, 0.06), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
        this.fugaz.scale.set(10, 1, 1);
        this.sFondo.add(this.fugaz);
        this.proximaFugaz = 1.5 + Math.random() * 3;
      }

      this.ajustar();
      this.obs = new ResizeObserver(() => this.ajustar());
      this.obs.observe(cont);
      this.timer = new T.Timer();
      this.timer.connect(document);
      this.tiempo = 0;
      this.rFrente.setAnimationLoop(() => this.cuadro());
    },
    /* Separa el SVG en capas por profundidad sin tocar sus animaciones. */
    separarCapas(svg, exterior) {
      const encuadre = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      encuadre.setAttribute('class', 'encuadre-3d');
      const hijos = [...svg.children].filter((n) => n.tagName !== 'defs');
      svg.appendChild(encuadre);
      this.capas = [];
      hijos.forEach((n, i) => {
        let z;
        if (n.querySelector && (n.querySelector('.astro') || n.classList.contains('pregunta'))) z = 1;      // personajes
        else if (i === 0 && n.tagName === 'rect') { z = 0; if (exterior) n.classList.add('cielo-svg'); } // cielo / pared
        else if (n.classList && n.classList.contains('titila')) z = 0.06;                                  // estrellas dibujadas
        else {
          let b = null;
          try { b = n.getBBox(); } catch (e) { b = null; }
          if (b && b.y + b.height < 95 && b.width < 140) z = 0.18;  // planetas, ventanas, lejos
          else if (b && b.y > 150) z = 0.75;                        // primer plano bajo
          else z = 0.42;                                             // entorno
        }
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-z', String(z));
        n.replaceWith(g);
        g.appendChild(n);
        encuadre.appendChild(g);
        if (z > 0) this.capas.push({ g, z });
      });
    },
    crearConfeti() {
      const n = 90;
      const geo = new T.PlaneGeometry(0.16, 0.09);
      const mat = new T.MeshBasicMaterial({ side: T.DoubleSide, transparent: true, opacity: 0.95 });
      const im = new T.InstancedMesh(geo, mat, n);
      const cols = ['#E8418C', '#6FE3E8', '#FFB547', '#A78BFA', '#5FC27A', '#ffffff'].map((c) => new T.Color(c));
      this.confeti = { im, datos: [] };
      for (let i = 0; i < n; i++) {
        im.setColorAt(i, cols[i % cols.length]);
        this.confeti.datos.push({
          x: (Math.random() - 0.5) * 14, y: Math.random() * 6 - 1, z: -2 + Math.random() * 6,
          vy: 0.6 + Math.random() * 0.8, rx: Math.random() * 6, ry: Math.random() * 6, vr: 2 + Math.random() * 4, fase: Math.random() * 6
        });
      }
      this.sFrente.add(im);
    },
    ajustar() {
      if (!this.cont) return;
      const w = this.cont.clientWidth, h = this.cont.clientHeight || w * 230 / 640;
      [[this.rFrente, this.cFrente], [this.rFondo, this.cFondo]].forEach(([r, c]) => {
        if (!r || !c) return;
        r.setSize(w, h, false);
        c.aspect = w / h; c.updateProjectionMatrix();
      });
    },
    cuadro() {
      this.timer.update();
      const dt = Math.min(this.timer.getDelta(), 0.05);
      this.tiempo += dt;
      const t = this.tiempo;
      // Cámara: vaivén lento (como flotar) + puntero, suavizado
      const objetivoX = (reducir ? 0 : Math.sin(t * 0.23) * 0.55 + Math.sin(t * 0.61) * 0.15) + puntero.x * 0.5;
      const objetivoY = (reducir ? 0 : Math.sin(t * 0.31 + 1) * 0.35) + puntero.y * 0.35;
      this.suave.x += (objetivoX - this.suave.x) * Math.min(1, dt * 2.2);
      this.suave.y += (objetivoY - this.suave.y) * Math.min(1, dt * 2.2);
      const sx = this.suave.x, sy = this.suave.y;

      // Capas del SVG: lo cercano se mueve más (paralaje)
      this.capas.forEach(({ g, z }) => g.setAttribute('transform', `translate(${(-sx * z * 13).toFixed(2)} ${(-sy * z * 7).toFixed(2)})`));

      // Polvo flotante
      const p = this.polvo.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) + this.polvo.userData.vel[i] * dt;
        if (y > 3.2) y = -3.2;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(t * 0.7 + i) * 0.0025);
      }
      p.needsUpdate = true;
      this.cFrente.position.set(sx * 0.9, -sy * 0.5, 6);
      this.cFrente.lookAt(0, 0, 0);

      if (this.confeti) {
        const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), s = new T.Vector3(1, 1, 1), v = new T.Vector3();
        this.confeti.datos.forEach((d, i) => {
          d.y -= d.vy * dt; d.rx += d.vr * dt; d.ry += d.vr * 0.7 * dt;
          if (d.y < -3.5) { d.y = 3.5; d.x = (Math.random() - 0.5) * 14; }
          v.set(d.x + Math.sin(t * 1.3 + d.fase) * 0.35, d.y, d.z);
          q.setFromEuler(e.set(d.rx, d.ry, 0));
          m.compose(v, q, s);
          this.confeti.im.setMatrixAt(i, m);
        });
        this.confeti.im.instanceMatrix.needsUpdate = true;
      }
      this.rFrente.render(this.sFrente, this.cFrente);

      if (this.rFondo && this.sFondo) {
        this.cFondo.position.set(sx * 6, -sy * 3, 10);
        this.cFondo.lookAt(0, 0, -60);
        this.estrellas.material.size = 0.9 + Math.sin(t * 2.1) * 0.08; // centelleo suave
        this.nebulosas.forEach((n, i) => { n.material.rotation = t * 0.01 * (i % 2 ? 1 : -1); });
        // Estrella fugaz de vez en cuando
        this.proximaFugaz -= dt;
        const f = this.fugaz;
        if (this.proximaFugaz <= 0 && !f.userData.vivo) {
          f.userData = { vivo: true, vida: 0, x: -30 + Math.random() * 40, y: 8 + Math.random() * 10 };
          f.position.set(f.userData.x, f.userData.y, -40);
          f.rotation.z = -0.35;
        }
        if (f.userData.vivo) {
          f.userData.vida += dt;
          const k = f.userData.vida / 0.9;
          f.position.x = f.userData.x + k * 40; f.position.y = f.userData.y - k * 14;
          f.material.opacity = Math.sin(Math.min(1, k) * Math.PI) * 0.9;
          if (k >= 1) { f.userData.vivo = false; f.material.opacity = 0; this.proximaFugaz = 4 + Math.random() * 6; }
        }
        this.rFondo.render(this.sFondo, this.cFondo);
      }
    },
    liberar(scene) {
      if (!scene) return;
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose(); // las texturas compartidas se reutilizan
      });
    },
    desmontar() {
      if (this.rFrente) this.rFrente.setAnimationLoop(null);
      if (this.obs) this.obs.disconnect();
      if (this.timer) this.timer.dispose();
      this.liberar(this.sFrente); this.liberar(this.sFondo);
      this.sFrente = this.sFondo = null; this.confeti = null; this.capas = [];
      if (this.rFondo) this.rFondo.domElement.remove();
      if (this.rFrente) this.rFrente.domElement.remove();
      if (this.cont) this.cont.classList.remove('con-3d', 'exterior-3d');
      this.cont = null;
    }
  };

  /* ================= 2. La gran revelación en 3D ================= */
  const MAX_CHISPAS = 700;
  const revela = {
    r: null, activo: false,
    montar(zona) {
      this.desmontar();
      this.zona = zona;
      this.r = this.r || crearRenderer();
      this.r.domElement.classList.add('lienzo-revela');
      zona.appendChild(this.r.domElement);
      zona.classList.add('con-3d');
      this.s = new T.Scene();
      this.c = new T.PerspectiveCamera(45, 1, 0.1, 100);
      this.c.position.set(0, 0, 7);
      this.d = 0; this.t = 0; this.sacudida = 0;

      // Nube volumétrica: bocanadas a distintas profundidades
      this.bocanadas = [];
      const n = reducir ? 30 : 64;
      for (let i = 0; i < n; i++) {
        const mat = new T.SpriteMaterial({ map: tex('nube'), transparent: true, depthWrite: false, opacity: 0.95,
          color: new T.Color().setHSL(0.68 + Math.random() * 0.06, 0.25, 0.86 + Math.random() * 0.1) });
        const sp = new T.Sprite(mat);
        const a = Math.random() * Math.PI * 2, rad = Math.sqrt(Math.random()) * 1.35;
        const base = new T.Vector3(Math.cos(a) * rad, Math.sin(a) * rad * 0.95 - 0.05, -0.9 + Math.random() * 2.2);
        const dir = new T.Vector3(base.x, base.y, 0.6 + Math.random() * 0.8).normalize();
        const esc = 1.1 + Math.random() * 1.2;
        sp.scale.set(esc, esc, 1);
        sp.position.copy(base);
        sp.userData = { base, dir, esc, v: 0.7 + Math.random() * 0.7, giro: (Math.random() - 0.5) * 0.4, fase: Math.random() * 6, empuje: new T.Vector3() };
        this.s.add(sp); this.bocanadas.push(sp);
      }

      // Chispas doradas (un solo sistema de partículas reutilizable)
      // Color con canal alfa: así las chispas que se apagan no oscurecen el fondo transparente
      const pos = new Float32Array(MAX_CHISPAS * 3), col = new Float32Array(MAX_CHISPAS * 4);
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('color', new T.BufferAttribute(col, 4));
      this.chispas = new T.Points(geo, new T.PointsMaterial({ size: 0.11, map: tex('punto'), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      this.vida = new Float32Array(MAX_CHISPAS);
      this.vel = new Float32Array(MAX_CHISPAS * 3);
      this.siguiente = 0;
      this.s.add(this.chispas);

      // Anillo de la onda expansiva
      this.anillo = new T.Mesh(new T.RingGeometry(0.9, 1.0, 96), new T.MeshBasicMaterial({ color: '#FFD58A', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      this.s.add(this.anillo);

      this.ajustar();
      this.obs = new ResizeObserver(() => this.ajustar());
      this.obs.observe(zona);
      this.timer = new T.Timer();
      this.timer.connect(document);
      this.activo = true;
      this.r.setAnimationLoop(() => this.cuadro());
    },
    ajustar() {
      const el = this.r.domElement, w = el.clientWidth || 400, h = el.clientHeight || 400;
      this.r.setSize(w, h, false);
      this.c.aspect = w / h; this.c.updateProjectionMatrix();
    },
    actualizar(d) { this.d = d; },
    /* nx, ny: posición del toque dentro de la zona, de 0 a 1 */
    toque(nx, ny) {
      if (!this.activo) return;
      const el = this.r.domElement.getBoundingClientRect(), z = this.zona.getBoundingClientRect();
      const px = (z.left + nx * z.width - el.left) / el.width, py = (z.top + ny * z.height - el.top) / el.height;
      const v = new T.Vector3(px * 2 - 1, -(py * 2 - 1), 0.5).unproject(this.c).sub(this.c.position).normalize();
      const punto = this.c.position.clone().add(v.multiplyScalar((this.c.position.z - 0.4) / -v.z));
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI;
        this.emitir(punto, new T.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a) * Math.sin(b), Math.cos(b)).multiplyScalar(1.2 + Math.random() * 1.8), 0.6 + Math.random() * 0.4);
      }
      // Empuja las bocanadas cercanas
      this.bocanadas.forEach((sp) => {
        const dx = sp.position.x - punto.x, dy = sp.position.y - punto.y, dist = Math.hypot(dx, dy);
        if (dist < 1.2) sp.userData.empuje.add(new T.Vector3(dx, dy, 0.4).normalize().multiplyScalar((1.2 - dist) * 0.35));
      });
      this.sacudida = Math.max(this.sacudida, 0.05);
    },
    emitir(origen, velocidad, vida) {
      const i = this.siguiente; this.siguiente = (this.siguiente + 1) % MAX_CHISPAS;
      const p = this.chispas.geometry.attributes.position;
      p.setXYZ(i, origen.x, origen.y, origen.z);
      this.vel[i * 3] = velocidad.x; this.vel[i * 3 + 1] = velocidad.y; this.vel[i * 3 + 2] = velocidad.z;
      this.vida[i] = vida;
    },
    estallido(colorHex) {
      if (!this.activo) return;
      const col = new T.Color(colorHex || '#FFD58A');
      this.colorEstallido = col;
      const centro = new T.Vector3(0, 0.1, 0.3);
      for (let i = 0; i < 420; i++) {
        const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
        const dir = new T.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a) * Math.sin(b), Math.cos(b));
        this.emitir(centro, dir.multiplyScalar(2.5 + Math.random() * 4.5), 1.1 + Math.random() * 0.9);
      }
      this.anillo.userData = { vida: 0 };
      this.anillo.material.color.copy(col);
      this.sacudida = 0.22;
      this.dolly = 1;
    },
    cuadro() {
      this.timer.update();
      const dt = Math.min(this.timer.getDelta(), 0.05);
      this.t += dt;
      const d = this.d;
      // Bocanadas: se abren hacia afuera y hacia la cámara, cada una a su ritmo
      this.bocanadas.forEach((sp, i) => {
        const u = sp.userData;
        u.empuje.multiplyScalar(Math.pow(0.04, dt)); // el empuje del toque se disipa
        const k = d * u.v * 1.9;
        sp.position.set(
          u.base.x + u.dir.x * k + u.empuje.x + Math.sin(this.t * 0.6 + u.fase) * 0.05,
          u.base.y + u.dir.y * k + u.empuje.y + Math.cos(this.t * 0.5 + u.fase) * 0.05,
          u.base.z + u.dir.z * k * 0.8 + u.empuje.z);
        const e = u.esc * (1 + d * 0.35) * (1 + Math.sin(this.t * 0.8 + u.fase) * 0.03);
        sp.scale.set(e, e, 1);
        sp.material.rotation += u.giro * dt;
        sp.material.opacity = Math.max(0, Math.min(0.95, 0.95 - d * u.v * 1.25));
      });
      // Chispas: inercia, roce y un poco de gravedad; se apagan al terminar su vida
      const p = this.chispas.geometry.attributes.position, c = this.chispas.geometry.attributes.color;
      const oro = new T.Color('#FFD58A'), blanco = new T.Color('#FFF6DA');
      for (let i = 0; i < MAX_CHISPAS; i++) {
        if (this.vida[i] <= 0) { c.setW(i, 0); continue; }
        this.vida[i] -= dt;
        const roce = Math.pow(0.18, dt);
        this.vel[i * 3] *= roce; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * roce - 1.2 * dt; this.vel[i * 3 + 2] *= roce;
        p.setXYZ(i, p.getX(i) + this.vel[i * 3] * dt, p.getY(i) + this.vel[i * 3 + 1] * dt, p.getZ(i) + this.vel[i * 3 + 2] * dt);
        const brillo = Math.max(0, Math.min(1, this.vida[i] * 1.4));
        const base = (this.colorEstallido && i % 3 === 0) ? this.colorEstallido : (i % 4 === 0 ? blanco : oro);
        c.setXYZW(i, base.r, base.g, base.b, brillo);
      }
      p.needsUpdate = true; c.needsUpdate = true;
      // Onda expansiva
      if (this.anillo.userData && this.anillo.userData.vida !== undefined) {
        const a = this.anillo.userData; a.vida += dt;
        const k = a.vida / 1.1;
        this.anillo.scale.setScalar(0.3 + k * 4);
        this.anillo.material.opacity = Math.max(0, 0.9 * (1 - k));
        if (k >= 1) this.anillo.userData = {};
      }
      // Cámara: flota un poco, se sacude con los toques y se acerca en el estallido
      this.sacudida *= Math.pow(0.02, dt);
      if (this.dolly) this.dolly *= Math.pow(0.15, dt);
      const s = this.sacudida;
      this.c.position.set(Math.sin(this.t * 0.4) * 0.12 + (Math.random() - 0.5) * s, Math.cos(this.t * 0.33) * 0.08 + (Math.random() - 0.5) * s, 7 - (this.dolly || 0) * 0.8);
      this.c.lookAt(0, 0, 0);
      this.r.render(this.s, this.c);
    },
    desmontar() {
      this.activo = false;
      if (this.r) { this.r.setAnimationLoop(null); this.r.domElement.remove(); }
      if (this.obs) this.obs.disconnect();
      if (this.timer) this.timer.dispose();
      if (this.s) escena.liberar(this.s);
      this.s = null;
      if (this.zona) this.zona.classList.remove('con-3d');
    }
  };

  window.EqProfundidad = { activo: true, escena, revela };
})();
