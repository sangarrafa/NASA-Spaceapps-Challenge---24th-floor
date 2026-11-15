import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* -------------------------------------------------------------
   Estación lunar en 3D (three.js, sin assets externos).
   Basado en el patrón de webgl_animation_keyframes: AnimationMixer + clips con keyframes.
   Para reutilizarla en otra pantalla:  const { grupo, clips } = crearEstacionLunar();
   ------------------------------------------------------------- */

const PALETA = { navy: 0x0B0F3A, rosa: 0xE8418C, aqua: 0x6FE3E8, cian: 0x21C1E0, ambar: 0xFFB547, blanco: 0xE8E9F2 };

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .75, metalness: .1, flatShading: true, ...extra });

export function crearEstacionLunar() {
  const grupo = new THREE.Group(); grupo.name = 'estacion';
  const add = (obj, nombre, padre = grupo) => { if (nombre) obj.name = nombre; obj.castShadow = true; obj.receiveShadow = true; padre.add(obj); return obj; };

  // Cúpula principal con anillos
  const cupula = add(new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x6e7090)), 'cupula');
  cupula.position.set(2.2, 0, 0);
  for (const r of [1.65, 1.1]) {   // anillos a la altura donde la cúpula tiene ese radio
    const aro = add(new THREE.Mesh(new THREE.TorusGeometry(r, .035, 6, 40), mat(0x2a2c48)));
    aro.rotation.x = Math.PI / 2; aro.position.set(2.2, Math.sqrt(2.2 ** 2 - r ** 2), 0);
  }

  // Módulo con la puerta
  const modulo = add(new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.5, 2.2), mat(0x55577a)), 'modulo');
  modulo.position.set(-1.1, .75, 0);
  const marco = add(new THREE.Mesh(new THREE.BoxGeometry(.95, 1.3, .1), mat(0x2b2d4c)));
  marco.position.set(-1.1, .65, 1.12);
  const puerta = add(new THREE.Mesh(new THREE.BoxGeometry(.8, 1.2, .08), mat(0x5d5f80)), 'puerta');
  puerta.position.set(-1.1, .65, 1.17);
  const panelPuerta = add(new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0x331111, emissive: 0xff5a50, emissiveIntensity: .4 })), 'ledPuerta');
  panelPuerta.position.set(-.4, .8, 1.16);

  // Ventanas (se encienden con keyframes)
  const centro = new THREE.Vector3(2.2, 0, 0);
  [[-.5, .5], [.5, .5], [0, 1.05]].forEach(([az, el], i) => {   // azimut y elevación sobre la cúpula, mirando al frente (+z)
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const v = add(new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .1, 16), new THREE.MeshStandardMaterial({ color: 0x0d0f2c, emissive: PALETA.aqua, emissiveIntensity: 0 })), `ventana${i + 1}`);
    v.position.copy(centro).addScaledVector(dir, 2.17);
    v.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);   // el cilindro mira hacia afuera de la cúpula
  });

  // Panel solar (se orienta al Sol)
  const mastilP = add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 1.8, 8), mat(0x5d5f7c)));
  mastilP.position.set(6, .9, -1.4);
  const panelSolar = new THREE.Group(); panelSolar.name = 'panelSolar'; panelSolar.position.set(6, 1.95, -1.4); grupo.add(panelSolar);
  const celdas = add(new THREE.Mesh(new THREE.BoxGeometry(2.4, .08, 1.2), mat(0x2c3060, { emissive: 0x0a1030, emissiveIntensity: .6 })), null, panelSolar);
  for (let i = 1; i < 4; i++) { const l = add(new THREE.Mesh(new THREE.BoxGeometry(.02, .09, 1.2), mat(PALETA.aqua)), null, panelSolar); l.position.x = -1.2 + i * .6; }
  panelSolar.rotation.z = -.35;

  // Antena parabólica (gira)
  const mastilA = add(new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 1.2, 8), mat(0x7c7e9c)));
  mastilA.position.set(2.2, 2.2 + .6, 0);
  const antena = new THREE.Group(); antena.name = 'antena'; antena.position.set(2.2, 3.4, 0); grupo.add(antena);
  const plato = add(new THREE.Mesh(new THREE.SphereGeometry(.55, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), mat(PALETA.blanco, { side: THREE.DoubleSide })), null, antena);
  plato.rotation.x = -Math.PI / 2.6; plato.position.y = .15;
  const luzAntena = add(new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshStandardMaterial({ color: PALETA.rosa, emissive: PALETA.rosa, emissiveIntensity: 1 })), 'luzAntena', antena);
  luzAntena.position.set(0, .35, .28);

  /* ---- Animaciones por keyframes ---- */
  const q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
  const aplanar = (...qs) => qs.flatMap(a => a.toArray());
  const clips = [];

  // Antena: una vuelta completa (12 s)
  clips.push(new THREE.AnimationClip('antenaGira', 12, [new THREE.QuaternionKeyframeTrack('antena.quaternion', [0, 3, 6, 9, 12], aplanar(q(0, 0, 0), q(0, Math.PI / 2, 0), q(0, Math.PI, 0), q(0, Math.PI * 1.5, 0), q(0, Math.PI * 2, 0)))]));
  // Panel solar: sigue al Sol de lado a lado (16 s, vuelve al inicio para repetir)
  clips.push(new THREE.AnimationClip('panelSigueSol', 16, [new THREE.QuaternionKeyframeTrack('panelSolar.quaternion', [0, 8, 16], aplanar(q(0, 0, -.7), q(0, 0, .7), q(0, 0, -.7)))]));
  // Luces: ventanas que parpadean escalonadas, LED de la puerta y luz de la antena
  const luces = [];
  [1, 2, 3].forEach((n, i) => luces.push(new THREE.NumberKeyframeTrack(`ventana${n}.material.emissiveIntensity`, [0, 1 + i, 2 + i, 6 + i, 7 + i, 10], [0, 0, 1.6, 1.6, 0, 0])));
  luces.push(new THREE.NumberKeyframeTrack('luzAntena.material.emissiveIntensity', [0, .5, 1, 1.5, 2], [.2, 1.6, .2, 1.6, .2]));
  luces.push(new THREE.ColorKeyframeTrack('ledPuerta.material.emissive', [0, 5, 6, 10], [1, .35, .31, 1, .35, .31, .1, .9, .9, .1, .9, .9]));
  clips.push(new THREE.AnimationClip('luces', 10, luces));

  return { grupo, clips };
}

function crearEscena() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(devicePixelRatio); renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x03041a);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 200); camera.position.set(9, 5, 11);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.target.set(2.5, 1.4, 0); controls.maxPolarAngle = Math.PI / 2.05; controls.minDistance = 5; controls.maxDistance = 30;

  // Luces: Sol rasante + relleno suave
  const sol = new THREE.DirectionalLight(0xFFE9C2, 3); sol.position.set(-12, 8, 6); sol.castShadow = true;
  sol.shadow.camera.left = -14; sol.shadow.camera.right = 14; sol.shadow.camera.top = 14; sol.shadow.camera.bottom = -14; sol.shadow.mapSize.set(2048, 2048);
  scene.add(sol, new THREE.HemisphereLight(0x6f7fd0, 0x25274b, .7));

  // Estrellas
  const pos = []; for (let i = 0; i < 1200; i++) { const r = 80 + Math.random() * 40, a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * .9 + .05); pos.push(r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xE8E9F2, size: .35, sizeAttenuation: true })));
  // Tierra baja en el horizonte
  const tierra = new THREE.Mesh(new THREE.SphereGeometry(3, 24, 16), new THREE.MeshStandardMaterial({ color: 0x2f6fd0, emissive: 0x0a2050, roughness: 1 }));
  tierra.position.set(40, 14, -50); scene.add(tierra);

  // Suelo lunar con cráteres y rocas
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshStandardMaterial({ color: 0x45476f, roughness: 1, flatShading: true }));
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; scene.add(suelo);
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 6; i++) {
    const r = 1 + rnd() * 2, c = new THREE.Mesh(new THREE.RingGeometry(r * .8, r, 28), new THREE.MeshStandardMaterial({ color: 0x2a2c55, roughness: 1, side: THREE.DoubleSide }));
    c.rotation.x = -Math.PI / 2; c.position.set(-8 + rnd() * 18, .01, 3 + rnd() * 10); scene.add(c);
  }
  for (let i = 0; i < 40; i++) {
    const s = .12 + rnd() * .4, roca = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), new THREE.MeshStandardMaterial({ color: 0x5a5c80, roughness: 1, flatShading: true }));
    const a = rnd() * Math.PI * 2, d = 5 + rnd() * 22; roca.position.set(Math.cos(a) * d + 2, s * .4, Math.sin(a) * d); roca.scale.y = .6; roca.castShadow = true; scene.add(roca);
  }

  const { grupo, clips } = crearEstacionLunar(); scene.add(grupo);
  const mixer = new THREE.AnimationMixer(grupo);
  clips.forEach(c => mixer.clipAction(c).play());

  const reloj = new THREE.Clock();
  renderer.setAnimationLoop(() => { mixer.update(reloj.getDelta()); controls.update(); renderer.render(scene, camera); });
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  window.__estacion = { scene, camera, mixer, grupo };
}

if (document.getElementById('info')) crearEscena();
