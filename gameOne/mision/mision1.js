(() => {
'use strict';
const L = window.EqLang ? window.EqLang.L : (es) => es;
const LOCALE = L('es-CO', 'en-US');

/* =========================================================
   1. DATOS REALES (curados de la NASA, no en vivo)
   ========================================================= */
const DATOS = {
  periodoLunarDias: 27.32,   // NSSDCA Moon Fact Sheet: 27,3217 días (sideral)
  distanciaLunaKm: 384400,   // semieje mayor medio
  radioTierraKm: 6371,
  viajeDias: 3,              // Apolo 11: ~76 h desde la inyección translunar
  zonaAtrapeKm: 66000,       // esfera de influencia lunar (~66.000 km)
  // Mecánica orbital
  muTierra: 398600.4418,     // km³/s², parámetro gravitacional de la Tierra
  orbitaBajaKm: 6571,        // radio de la órbita de espera (200 km de altura)
  muLuna: 4902.8,            // km³/s², parámetro gravitacional de la Luna
  radioLunaKm: 1737.4,
  orbitaLunarAltKm: 110,     // órbita lunar baja (Apolo 11: ~110 km)
  perilunaAltKm: 15          // altura donde empieza el frenado de descenso (Apolo 11: ~15 km)
};

/* =========================================================
   2. CONFIGURACIÓN DEL JUEGO (fácil de ajustar por el equipo)
   ========================================================= */
const SEG_POR_DIA = 2.2;   // segundos de juego por cada día de misión
const NIVELES = [
  // tolGrados: qué tan cerca (en grados de la órbita lunar) hay que llegar.
  // zona: arco verde que muestra dónde debe estar la Luna al despegar.
  // fantasma: muestra dónde estará la Luna dentro de 3 días.
  { nombre: L('Astronauta', 'Astronaut'), tolGrados: 15, fantasma: true,  zona: true  },
  { nombre: L('Piloto', 'Pilot'), tolGrados: 10, fantasma: true,  zona: false },
  { nombre: L('Comandante', 'Commander'), tolGrados: 8,  fantasma: false, zona: false }
];

/* =========================================================
   3. UTILIDADES
   ========================================================= */
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const OMEGA_LUNA = TAU / (DATOS.periodoLunarDias * SEG_POR_DIA); // rad/seg de juego mientras se espera
const OMEGA_DIA = TAU / DATOS.periodoLunarDias;                   // rad que avanza la Luna por día real
const GRADOS_POR_HORA = 360 / (DATOS.periodoLunarDias * 24);      // ≈ 0,55°/h

const envolver = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const aGrados = r => r * 180 / Math.PI;
const suave = t => t * t * (3 - 2 * t);
const fmt = n => Math.round(n).toLocaleString(LOCALE);
const num = (n, d = 1) => n.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtAlt = km => km >= 1 ? `${fmt(km)} km` : `${fmt(km * 1000)} m`;
const fmtVel = kms => kms >= 1 ? `${num(kms)} km/s` : `${fmt(kms * 1000)} m/s`;

/* =========================================================
   3b. MECÁNICA ORBITAL (Kepler)
   El dibujo no está a escala, pero las trayectorias son órbitas reales (cónicas empalmadas):
   - La nave sigue una sola elipse de Kepler desde la órbita baja hasta la Luna: 3 días, ~10,9 km/s al salir.
     El encendido ocurre ~170° antes del punto de encuentro, como en las misiones reales. No hay correcciones.
   - Al acercarse, la gravedad de la Luna la curva en una hipérbola que se calcula con la posición y la velocidad
     reales de la nave respecto a la Luna: si despegas un poco antes o después, la órbita de captura cambia.
   El reloj es uno solo: la Luna se mueve siempre a la misma velocidad.
   ========================================================= */
const T_ASC = 1.0;                                            // seg de juego: subida a la órbita baja
const DIAS_TRANSF = DATOS.viajeDias - T_ASC / SEG_POR_DIA;    // días desde el encendido hacia la Luna (la subida cuenta dentro de los 3 días)
const T_TRANSF = DIAS_TRANSF * SEG_POR_DIA;                   // seg de juego: viaje a la Luna
const T_REAL = DIAS_TRANSF * 86400;                           // segundos reales de ese viaje
const T_IN = 4.0;                                             // seg antes de llegar en que la vista pasa a la Luna
const V_PLAY = 2.2;                                           // velocidad (radios lunares/seg) con la que se reproduce la llegada a la Luna
const K_ATEN = 0.12;                                           // cuánto del error de puntería cambia la órbita (la gravedad "jala" el resto)
const T_GLIDE = 1.5;                                          // seg que tarda en acomodarse esa diferencia
const ASC_RAD = 25 * Math.PI / 180;                           // avance horizontal durante la subida
const V_ORBITA_BAJA = Math.sqrt(DATOS.muTierra / DATOS.orbitaBajaKm);   // ≈ 7,8 km/s
const V_LUNA = TAU * DATOS.distanciaLunaKm / (DATOS.periodoLunarDias * 86400);   // ≈ 1,02 km/s
const VEL_FALLO_DIAS = 1.6;                                   // si la Luna no está, el cohete sigue por la misma elipse (días por seg de juego)
const K_RADIAL = 0.6;                                         // compresión del dibujo: la Tierra y la Luna están agrandadas

// Ecuación de Kepler: M = E - e·sen(E)
function keplerElipse(M, e) {
  M = ((M % TAU) + TAU) % TAU;
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 60; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

// Elipse con perigeo en la órbita baja que llega a la distancia de la Luna en el tiempo del juego.
// Una transferencia de Hohmann pura tardaría ~5 días, así que se busca el semieje mayor "a" correcto.
function resolverTransferencia() {
  const mu = DATOS.muTierra, rp = DATOS.orbitaBajaKm, rm = DATOS.distanciaLunaKm;
  const tiempo = a => {
    const e = 1 - rp / a, p = a * (1 - e * e);
    const nu = Math.acos(clamp((p / rm - 1) / e, -1, 1));
    const E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2));
    return { t: (E - e * Math.sin(E)) * Math.sqrt(a ** 3 / mu), e, p, nu };
  };
  let lo = (rp + rm) / 2 + 1, hi = 5e6;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (tiempo(mid).t > T_REAL) lo = mid; else hi = mid; }
  const a = (lo + hi) / 2, s = tiempo(a);
  return { a, e: s.e, p: s.p, nuLlegada: s.nu, n: Math.sqrt(mu / a ** 3) };
}
const TRANSF = resolverTransferencia();   // a ≈ 400.000 km, e ≈ 0,98, llega a ~170° del punto de encendido
const tiempoDesdeNu = nu => {
  const E = 2 * Math.atan(Math.sqrt((1 - TRANSF.e) / (1 + TRANSF.e)) * Math.tan(nu / 2));
  return (E - TRANSF.e * Math.sin(E)) / TRANSF.n;
};

// Velocidad real con la que la nave pasa por la Luna, vista desde la Luna (v∞): solo para mostrarla en pantalla
const V_INF_REAL = (() => {
  const vc = Math.sqrt(DATOS.muTierra / TRANSF.p);
  const vr = vc * TRANSF.e * Math.sin(TRANSF.nuLlegada), vt = vc * (1 + TRANSF.e * Math.cos(TRANSF.nuLlegada));
  return Math.hypot(vr, vt - V_LUNA);
})();

const AVANCE_LUNA_VIAJE = OMEGA_DIA * DATOS.viajeDias;        // ≈ 39,5°: lo que avanza la Luna desde que despega hasta que llega

// Subida: curva suave que termina tangente a la órbita baja, justo donde se enciende el motor hacia la Luna
const W_ASC_FIN = 3 * ASC_RAD / T_ASC;                        // velocidad angular al llegar a la órbita

// Reproducción de la transferencia: cerca de la Tierra la elipse se recorre en horas y el resto en días.
// Para que se vea, el primer tramo (150° de la elipse) se reproduce más lento; la forma sigue siendo la de Kepler
// y ambos tiempos coinciden al llegar a la Luna.
const NU1 = 150 * Math.PI / 180, T1 = 1.5;
const T1_REAL = tiempoDesdeNu(NU1);
const R1 = TRANSF.p / (1 + TRANSF.e * Math.cos(NU1));
const W1 = Math.sqrt(DATOS.muTierra * TRANSF.p) / (R1 * R1) * (T_REAL - T1_REAL) / (T_TRANSF - T1);
function estadoTransferencia(tau) {
  let nu, tReal, r;
  if (tau < T1) {
    const x = tau / T1, x2 = x * x, x3 = x2 * x;
    nu = Math.max(0, (x3 - 2 * x2 + x) * T1 * W_ASC_FIN + (-2 * x3 + 3 * x2) * NU1 + (x3 - x2) * T1 * W1);
    tReal = tiempoDesdeNu(nu);
    r = TRANSF.p / (1 + TRANSF.e * Math.cos(nu));
  } else {
    tReal = tau <= T_TRANSF ? T1_REAL + (T_REAL - T1_REAL) * (tau - T1) / (T_TRANSF - T1)
                            : T_REAL + (tau - T_TRANSF) * VEL_FALLO_DIAS * 86400;
    const E = keplerElipse(TRANSF.n * tReal, TRANSF.e);
    nu = 2 * Math.atan2(Math.sqrt(1 + TRANSF.e) * Math.sin(E / 2), Math.sqrt(1 - TRANSF.e) * Math.cos(E / 2));
    r = TRANSF.a * (1 - TRANSF.e * Math.cos(E));
  }
  return { nu, r, v: Math.sqrt(DATOS.muTierra * (2 / r - 1 / TRANSF.a)), tReal };   // v: ecuación vis-viva
}

/* =========================================================
   3c. FASE LUNAR
   Distancias en radios lunares. La altura de la órbita está exagerada para que se vea (30% del radio, en la realidad 6%).
   1) Llegada en hipérbola (la gravedad de la Luna curva el camino)  2) Frenado de captura
   3) ~1 vuelta en órbita  4) Encendido de descenso: elipse de Kepler hasta casi tocar la superficie
   5) Frenado en contra del movimiento  6) Giro a vertical y descenso suave
   Los ángulos "a" se miden desde la dirección de la Tierra y en el sentido en que la nave orbita la Luna.
   ========================================================= */
const ESCALA_NAVE_CERCA = 3.2;   // el cohete se dibuja más grande cuando la cámara se acerca al suelo
const RO_NOM = 1.45;             // radio de la órbita lunar si despegas en el momento perfecto
let LUNAR = null;                // se calcula en cada despegue, con la posición real de la nave respecto a la Luna

// Elementos de la hipérbola a partir de la posición r y la velocidad v de la nave respecto a la Luna (ejes de pantalla,
// "y" hacia arriba) y el parámetro gravitacional mu del juego.
function elementosHiperbola(r, v, mu) {
  const rn = Math.hypot(r.x, r.y), v2 = v.x * v.x + v.y * v.y;
  const h = r.x * v.y - r.y * v.x, eps = v2 / 2 - mu / rn;
  const e = Math.sqrt(1 + 2 * eps * h * h / (mu * mu));
  const dot = r.x * v.x + r.y * v.y;
  const ex = ((v2 - mu / rn) * r.x - dot * v.x) / mu, ey = ((v2 - mu / rn) * r.y - dot * v.y) / mu;
  return { rn, h, e, rp: h * h / (mu * (1 + e)), ah: mu / (2 * eps), thetaP: Math.atan2(ey, ex), thetaR: Math.atan2(r.y, r.x) };
}

// phiE: ángulo (en pantalla) de la dirección Moon→Tierra. Devuelve null si la nave no queda capturada de forma segura.
function construirLunar(r, v, mu, phiE) {
  const H = elementosHiperbola(r, v, mu);
  construirLunar.rp = H.rp;
  if (!(H.rp > 1.05 && H.rp < 2.4)) return null;
  const E_H = H.e, sentido = H.h >= 0 ? 1 : -1;
  const RO = clamp(H.rp, 1.12, 1.75);                           // radio de la órbita lunar
  const RPE = 1 + (RO - 1) * 0.47, RB = 1 + (RO - 1) * 0.23;    // perilunio y fin del frenado, en proporción
  const D1 = 55 * Math.PI / 180, D2 = 4 * Math.PI / 180;        // arco del frenado de descenso y último tramo hasta el sitio
  const TL0 = 0.9, TB = 1.8, TPITCH = 0.8, TTERM = 1.6, WF = 0.06;
  const nuInf = Math.acos(-1 / E_H);
  const nuH = envolver(sentido * (H.thetaR - H.thetaP));        // dónde está sobre la hipérbola (antes del periapsis es < 0)
  const alphaP = envolver(sentido * (H.thetaP - phiE));         // ángulo del periapsis respecto a la dirección de la Tierra
  const hq = 2 * Math.atanh(Math.sqrt((E_H - 1) / (E_H + 1)) * Math.tan(nuH / 2));
  const nh = Math.sqrt(mu / H.ah ** 3);
  const tP = -(E_H * Math.sinh(hq) - hq) / nh;                  // seg desde el traspaso hasta el periapsis
  const wh = H.h / (H.rp * H.rp);                               // velocidad angular en el periapsis antes de frenar
  const wc = Math.min(TAU / 3.4, 0.85 * wh), dw = wh - wc;      // velocidad angular en la órbita circular
  const muO = wc * wc * RO ** 3;                                // gravedad "de la órbita": fija el ritmo de la órbita y del descenso
  let th = (((-D1 - Math.PI - alphaP) % TAU) + TAU) % TAU;      // ángulo que recorre en órbita hasta el encendido de descenso
  if (th < 3.2) th += TAU;
  const tDoi = tP + (th - 0.5 * dw * TL0) / wc;
  const ad = (RO + RPE) / 2, ed = (RO - RPE) / (RO + RPE), nd = Math.sqrt(muO / ad ** 3);
  const tPdi = tDoi + Math.PI / nd;                              // media órbita elíptica hasta el perilunio
  const wpe = Math.sqrt(muO * ad * (1 - ed * ed)) / (RPE * RPE);
  const dBrake = D1 - D2;
  const tauB = (dBrake - WF * TB) / (wpe - WF);
  const angB = t => WF * t + (wpe - WF) * tauB * (1 - Math.exp(-t / tauB));
  const kB = dBrake / angB(TB);
  const tFrenadoFin = tPdi + TB, tPitchFin = tFrenadoFin + TPITCH, tToque = tPitchFin + TTERM;
  return { RO, RPE, RB, rp: H.rp, rQ: H.rn, E_H, TL0, D1, D2, TB, TPITCH, TTERM, WF, wc, mu, muO, ah: H.ah, nh, nuInf, alphaP, sentido,
           tP, wh, dw, th, tDoi, ad, ed, nd, tPdi, wpe, tauB, angB, kB, tFrenadoFin, tPitchFin, tToque, tFin: tToque + 1.6 };
}

// Posición relativa a la Luna: radio r (en radios lunares) y ángulo a (ver arriba)
function trayLunar(lt) {
  const L = LUNAR;
  if (lt < L.tP) {                                   // hipérbola: M = e·senh(H) - H
    const M = L.nh * (lt - L.tP);
    let H = Math.asinh(M / L.E_H);
    for (let i = 0; i < 40; i++) {
      const dH = (L.E_H * Math.sinh(H) - H - M) / (L.E_H * Math.cosh(H) - 1);
      H -= dH; if (Math.abs(dH) < 1e-12) break;
    }
    return { r: L.ah * (L.E_H * Math.cosh(H) - 1), a: L.alphaP + 2 * Math.atan(Math.sqrt((L.E_H + 1) / (L.E_H - 1)) * Math.tanh(H / 2)) };
  }
  if (lt < L.tDoi) {                                 // órbita circular (con el frenado de captura al principio)
    const tau = lt - L.tP, x = Math.min(tau / L.TL0, 1);
    return { r: L.rp + (L.RO - L.rp) * suave(x), a: L.alphaP + L.wc * tau + L.dw * L.TL0 * (x < 1 ? x - x ** 3 + x ** 4 / 2 : 0.5) };
  }
  if (lt < L.tPdi) {                                 // elipse de descenso: del apoapsis (órbita) al periapsis (casi el suelo)
    const M = Math.min(Math.PI + L.nd * (lt - L.tDoi), TAU - 1e-9);
    const E = keplerElipse(M, L.ed);
    const nu = 2 * Math.atan2(Math.sqrt(1 + L.ed) * Math.sin(E / 2), Math.sqrt(1 - L.ed) * Math.cos(E / 2));
    return { r: L.ad * (1 - L.ed * Math.cos(E)), a: -L.D1 + nu - TAU };
  }
  if (lt < L.tFrenadoFin) {                          // frenado: la velocidad horizontal baja casi a cero
    const tau = lt - L.tPdi;
    return { r: L.RB + (L.RPE - L.RB) * (1 - suave(tau / L.TB)), a: -L.D1 + L.kB * L.angB(tau) };
  }
  const tau2 = lt - L.tFrenadoFin, u = clamp(tau2 / (L.TPITCH + L.TTERM), 0, 1);   // giro a vertical y descenso
  const r = tau2 < L.TPITCH ? L.RB : 1 + (L.RB - 1) * (1 - suave(clamp((tau2 - L.TPITCH) / L.TTERM, 0, 1)));
  return { r, a: -L.D2 * (1 - suave(u)) };
}

// Altura y velocidad reales que se muestran (valores de la misión Apolo 11, no los del dibujo)
function datosLunar(lt, tr) {
  const L = LUNAR, R = DATOS.radioLunaKm, mu = DATOS.muLuna, vinf = V_INF_REAL;
  const aReal = ((R + DATOS.orbitaLunarAltKm) + (R + DATOS.perilunaAltKm)) / 2;
  const vpe = Math.sqrt(mu * (2 / (R + DATOS.perilunaAltKm) - 1 / aReal));
  if (lt < L.tP) {
    const dReal = (R + DATOS.orbitaLunarAltKm) + (tr.r - L.RO) / (L.rQ - L.RO) * (DATOS.zonaAtrapeKm - R - DATOS.orbitaLunarAltKm);
    return { alt: dReal - R, vel: Math.sqrt(vinf * vinf + 2 * mu / dReal) };
  }
  if (lt < L.tDoi) {
    const dReal = R + DATOS.orbitaLunarAltKm, x = clamp((lt - L.tP) / L.TL0, 0, 1);
    const vc = Math.sqrt(mu / dReal), vh = Math.sqrt(vinf * vinf + 2 * mu / dReal);
    return { alt: DATOS.orbitaLunarAltKm, vel: vc + (vh - vc) * (1 - suave(x)) };
  }
  if (lt < L.tPdi) {
    const alt = DATOS.perilunaAltKm + (tr.r - L.RPE) / (L.RO - L.RPE) * (DATOS.orbitaLunarAltKm - DATOS.perilunaAltKm);
    return { alt, vel: Math.sqrt(mu * (2 / (R + alt) - 1 / aReal)) };
  }
  if (lt < L.tFrenadoFin) {
    const tau = lt - L.tPdi;
    return { alt: 0.15 + (tr.r - L.RB) / (L.RPE - L.RB) * (DATOS.perilunaAltKm - 0.15), vel: vpe * (L.WF + (L.wpe - L.WF) * Math.exp(-tau / L.tauB)) / L.wpe };
  }
  const vfin = vpe * L.WF / L.wpe, u = clamp((lt - L.tFrenadoFin) / (L.TPITCH + L.TTERM), 0, 1);
  return { alt: 0.15 * clamp((tr.r - 1) / (L.RB - 1), 0, 1), vel: 0.001 + (vfin - 0.001) * (1 - u) };
}

/* =========================================================
   4. LIENZO Y ESCALA
   ========================================================= */
const lienzo = document.getElementById('lienzo');
const ctx = lienzo.getContext('2d');
let W = 0, H = 0, cx = 0, cy = 0, Rl = 0, Rt = 0, rLuna = 0, sCohete = 0;
let RsLEO = 0, escalaLuna = 1, dprActual = 1;
const ESCALA_SEGUIR = 2.0;      // acercamiento extra mientras la cámara sigue a la nave en el frenado de descenso
const RADIO_SUELO_PX = 3500;    // radio de la Luna en pantalla al final: el suelo se ve casi plano
let estrellas = [];

function redimensionar() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  dprActual = dpr;
  W = lienzo.clientWidth || window.innerWidth; H = lienzo.clientHeight || window.innerHeight;
  lienzo.width = W * dpr; lienzo.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx = W / 2; cy = H * 0.45;
  Rl = Math.min(W * 0.42, H * 0.33);   // radio órbita lunar (pantalla)
  Rt = Rl * 0.17;                      // radio Tierra
  rLuna = Rl * 0.09;                   // radio Luna
  sCohete = Math.max(9, Rl * 0.05);    // tamaño del cohete
  RsLEO = Rt + sCohete * 1.5;          // radio (pantalla) de la órbita de espera
  escalaLuna = Math.min(W * 0.17, H * 0.22) / rLuna;   // cuánto se agranda la Luna al acercar la cámara
  estrellas = Array.from({ length: Math.round(W * H / 2600) }, () => ({
    x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .2, f: Math.random() * TAU
  }));
}
window.addEventListener('resize', redimensionar);
redimensionar();

const polar = (r, a) => ({ x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) });

// Distancia real al centro de la Tierra (km) → radio en pantalla. Los ángulos del dibujo son los reales;
// solo se comprime el radio (potencia 0,6) porque la Tierra y la Luna están dibujadas mucho más grandes.
function radioPantalla(r) {
  const x = Math.max(0, (r - DATOS.orbitaBajaKm) / (DATOS.distanciaLunaKm - DATOS.orbitaBajaKm));
  return RsLEO + (Rl - RsLEO) * Math.pow(x, K_RADIAL);
}
// Posición de la nave sobre la elipse de Kepler, en pantalla. angT = dónde se enciende el motor hacia la Luna.
const posTransferencia = (tau, angT = angTLI()) => {
  const s = estadoTransferencia(tau);
  return polar(radioPantalla(s.r), angT + s.nu);
};

// Posición y velocidad de la nave respecto a la Luna (radios lunares y radios lunares por segundo, "y" hacia arriba)
// en el instante en que la vista pasa a la Luna. thetaLuna = ángulo de la Luna en ese instante.
function estadoRelativo(angT, thetaLuna) {
  const tau = T_TRANSF - T_IN, d = 0.02;
  const rel = t => {
    const s = posTransferencia(t, angT), m = polar(Rl, thetaLuna + OMEGA_LUNA * (t - tau));
    return { x: (s.x - m.x) / rLuna, y: -(s.y - m.y) / rLuna };
  };
  const r = rel(tau), a = rel(tau - d), b = rel(tau + d);
  return { r, v: { x: (b.x - a.x) / (2 * d), y: (b.y - a.y) / (2 * d) } };
}

// Descompone el estado relativo: dirección de la velocidad (vh), avance a lo largo de ella (along) y desvío lateral (lat,
// con signo: positivo si la nave pasa por el lado desde el que la Luna la hace girar en sentido antihorario).
function descomponer(rel) {
  const vn = Math.hypot(rel.v.x, rel.v.y), vh = { x: rel.v.x / vn, y: rel.v.y / vn }, n = { x: vh.y, y: -vh.x };
  return { vh, n, along: rel.r.x * vh.x + rel.r.y * vh.y, lat: rel.r.x * n.x + rel.r.y * n.y };
}

// Dónde apuntar y cuánta gravedad usar para que, si despegas justo en el momento perfecto, la nave pase de la Luna
// a B_NOM radios lunares y quede en una órbita de radio RO_NOM. Depende solo del tamaño de la pantalla.
const B_NOM = 2.0;
let apuntadoCache = null;
function apuntado() {
  if (apuntadoCache && apuntadoCache.key === Rl) return apuntadoCache;
  const thetaLuna = -OMEGA_LUNA * T_IN;   // con el punto de encuentro en el ángulo 0
  const lateral = dTh => descomponer(estadoRelativo(dTh - TRANSF.nuLlegada, thetaLuna)).lat - B_NOM;
  let x0 = 0, x1 = 0.2, f0 = lateral(x0), f1 = lateral(x1);
  for (let i = 0; i < 30 && Math.abs(f1) > 1e-9; i++) {
    const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
    x0 = x1; f0 = f1; x1 = x2; f1 = lateral(x1);
  }
  const dTheta = x1, d = descomponer(estadoRelativo(dTheta - TRANSF.nuLlegada, thetaLuna));
  const v = { x: d.vh.x * V_PLAY, y: d.vh.y * V_PLAY }, r = { x: d.along * d.vh.x + d.lat * d.n.x, y: d.along * d.vh.y + d.lat * d.n.y };
  let lo = 1e-4, hi = V_PLAY * V_PLAY * Math.hypot(r.x, r.y) / 2 * 0.999;   // gravedad con la que el periapsis queda en RO_NOM
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (elementosHiperbola(r, v, mid).rp > RO_NOM) lo = mid; else hi = mid;
  }
  apuntadoCache = { key: Rl, dTheta, mu: (lo + hi) / 2, along: d.along };
  return apuntadoCache;
}

const angTLI = () => juego.anguloBase + apuntado().dTheta - TRANSF.nuLlegada;   // dónde se enciende el motor hacia la Luna
const anguloPad = () => angTLI() - ASC_RAD;                                      // plataforma: la subida termina justo en ese punto


// Posición en el mundo (en pantalla) de un punto relativo a la Luna: r en radios lunares y ángulo a (ver 3c);
// phi es la dirección Luna→Tierra y el sentido de giro lo da la órbita
const mundoLunar = (r, a, phi) => {
  const L = polar(Rl, juego.anguloLuna), th = phi + (LUNAR ? LUNAR.sentido : 1) * a;
  return { x: L.x + r * rLuna * Math.cos(th), y: L.y - r * rLuna * Math.sin(th) };
};

/* =========================================================
   5. ESTADO
   ========================================================= */
const juego = {
  estado: 'espera',     // espera | viaje | aterrizaje | fallo | resultado | fin
  nivel: 0,
  intento: 1,
  fallosSeguidos: 0,
  ayudaExtra: 0,        // 0 nada, 1 fantasma, 2 + zona, 3 + cámara lenta
  ayudasUsadas: 0,
  t: 0,
  anguloLuna: 0,
  anguloBase: Math.PI * 0.4,   // dónde está el punto de encuentro con la Luna (la plataforma queda al otro lado de la Tierra)
  viaje: null,
  estela: [],
  particulas: []
};

// Cámara: w = acercamiento a la Luna, wa = sigue a la nave en el frenado de descenso, wb = acercamiento final al suelo
// (todos de 0 a 1). pantalla = ancla + s · giro(rot) · (mundo − foco); con todo en 0 es la vista normal.
const cam = { w: 0, wa: 0, wb: 0, rot: 0, s: 1, fx: 0, fy: 0, ax: 0, ay: 0 };
const mundoAPantalla = (x, y) => {
  const dx = x - cam.fx, dy = y - cam.fy, c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  return { x: cam.ax + cam.s * (dx * c - dy * s), y: cam.ay + cam.s * (dx * s + dy * c) };
};

function config() {
  const base = NIVELES[juego.nivel];
  const a = juego.ayudaExtra;
  return {
    ...base,
    fantasma: base.fantasma || a >= 1,
    zona: base.zona || a >= 2,
    lento: a >= 3
  };
}

// Ángulo donde debe estar la Luna en el momento de despegar
const anguloIdealDespegue = () => juego.anguloBase - AVANCE_LUNA_VIAJE;

/* =========================================================
   6. INTERFAZ
   ========================================================= */
const $ = id => document.getElementById(id);
const burbuja = $('burbuja'), btnMotor = $('btnMotor');

function actualizarHUD() {
  $('chipNivel').textContent = `${L('Nivel', 'Level')} ${juego.nivel + 1} · ${NIVELES[juego.nivel].nombre}`;
  $('chipIntento').textContent = `${L('Intento', 'Attempt')} ${juego.intento}`;
  $('chipAyuda').style.display = juego.ayudaExtra > 0 ? '' : 'none';
}
function decir(html) { burbuja.innerHTML = html; }

function mensajeEspera() {
  const c = config();
  if (c.zona) decir(L('Tu cohete subirá a la órbita baja y viajará hasta el <b>punto de encuentro</b>. Espera a que la Luna entre en la <b>zona verde</b>… ¡y despega!', 'Your rocket will climb to low orbit and travel to the <b>meeting point</b>. Wait for the Moon to enter the <b>green zone</b>… and launch!'));
  else if (c.fantasma) decir(L('La <b>Luna fantasma</b> muestra dónde estará la Luna al llegar. Despega cuando la Luna fantasma toque el <b>punto de encuentro</b>.', 'The <b>ghost Moon</b> shows where the Moon will be when you arrive. Launch when the ghost Moon touches the <b>meeting point</b>.'));
  else decir(L('Sin ayudas, Comandante. El viaje dura <b>3 días</b> y en ese tiempo la Luna avanza unos <b>40°</b> de su vuelta.', 'No help this time, Commander. The trip takes <b>3 days</b>, and in that time the Moon moves about <b>40°</b> along its orbit.'));
}

function empezarIntento() {
  juego.estado = 'espera';
  juego.viaje = null; juego.estela = [];
  btnMotor.disabled = false;
  actualizarHUD(); mensajeEspera();
}

/* =========================================================
   7. DESPEGAR
   ========================================================= */
function despegar() {
  if (juego.estado !== 'espera' || cam.w > 0.02) return;
  const c = config();
  const lunaLlegada = juego.anguloLuna + AVANCE_LUNA_VIAJE;
  // dif > 0: la Luna todavía no había llegado al punto (despegó temprano)
  // dif < 0: la Luna ya había pasado (despegó tarde)
  const dif = envolver(juego.anguloBase - lunaLlegada);
  let exito = Math.abs(aGrados(dif)) <= c.tolGrados;
  if (exito) {
    // Dónde estará la nave respecto a la Luna cuando la vista pase a la Luna, y qué órbita de captura resulta
    const thetaLuna = juego.anguloLuna + OMEGA_LUNA * (T_ASC + T_TRANSF - T_IN);
    const d = descomponer(estadoRelativo(angTLI(), thetaLuna));
    // La gravedad "jala" parte del error de puntería: el desvío lateral cambia solo en una fracción (K_ATEN)
    const latEf = B_NOM + K_ATEN * (d.lat - B_NOM);
    const r = { x: d.along * d.vh.x + latEf * d.n.x, y: d.along * d.vh.y + latEf * d.n.y };
    LUNAR = construirLunar(r, { x: d.vh.x * V_PLAY, y: d.vh.y * V_PLAY }, apuntado().mu, thetaLuna + Math.PI);
    if (LUNAR) LUNAR.glide = { x: (d.lat - latEf) * d.n.x, y: (d.lat - latEf) * d.n.y };   // diferencia que se va acomodando
    exito = LUNAR !== null;   // si pasa demasiado cerca o lejos de la Luna no queda capturada
  }
  juego.viaje = { t: 0, dif, exito, extra: 0, toque: null, phiE: null };
  juego.estado = 'viaje';
  btnMotor.disabled = true; btnMotor.classList.remove('ahora');
  decir(L('🔥 ¡Despegue! Rumbo a la Luna…', '🔥 Liftoff! Heading to the Moon…'));
  // humo del despegue
  const p = polar(Rt, anguloPad());
  humo(p.x, p.y, 30, '#d8def5');
}

/* =========================================================
   8. ACTUALIZAR
   ========================================================= */
// La Luna siempre le muestra la misma cara a la Tierra: aterrizamos en esa cara (ángulo 0 = hacia la Tierra)
const faseTierra = () => (juego.viaje && juego.viaje.phiE != null) ? juego.viaje.phiE : juego.anguloLuna + Math.PI;
const sitioLuna = () => mundoLunar(1, 0, faseTierra());

function actualizar(dt) {
  const c = config();
  if (juego.estado === 'espera' && c.lento) dt *= 0.55;   // ayuda: cámara lenta
  juego.t += dt;

  const v = juego.viaje;
  const fin = T_ASC + T_TRANSF, tH = fin - T_IN;   // fin del viaje y momento en que la vista pasa a la Luna
  const lunaQuieta = juego.estado === 'aterrizaje' || ((juego.estado === 'resultado' || juego.estado === 'fin') && v && v.exito);
  if (juego.estado === 'viaje') v.t += dt;
  if (!lunaQuieta) juego.anguloLuna += OMEGA_LUNA * dt;   // un solo reloj: la Luna se mueve siempre igual

  if (juego.estado === 'espera') {
    if (c.zona) {
      const enZona = Math.abs(aGrados(envolver(juego.anguloLuna - anguloIdealDespegue()))) <= c.tolGrados;
      btnMotor.classList.toggle('ahora', enZona);
    }
    btnMotor.disabled = cam.w > 0.02;   // espera a que termine el alejamiento de la cámara
  }

  if (juego.estado === 'viaje') {
    if (v.t < T_ASC) {
      const u = v.t / T_ASC;
      decir(`🚀 ${L('Subiendo · altura', 'Climbing · altitude')} <b>${fmt((DATOS.orbitaBajaKm - DATOS.radioTierraKm) * suave(u))} km</b> · ${L('velocidad', 'speed')} <b>${num(V_ORBITA_BAJA * Math.pow(u, 1.5))} km/s</b>`);
    } else if (v.t < fin) {
      const s = estadoTransferencia(v.t - T_ASC);
      decir(L(`🛰️ Día <b>${num(Math.min(v.t / SEG_POR_DIA, DATOS.viajeDias))}</b> de ${DATOS.viajeDias} · a <b>${fmt(s.r)} km</b> de la Tierra · <b>${num(s.v)} km/s</b>`, `🛰️ Day <b>${num(Math.min(v.t / SEG_POR_DIA, DATOS.viajeDias))}</b> of ${DATOS.viajeDias} · <b>${fmt(s.r)} km</b> from Earth · <b>${num(s.v)} km/s</b>`));
    }
    if (v.exito && v.t >= tH) {
      juego.estado = 'aterrizaje'; v.extra = 0;
      v.phiE = juego.anguloLuna + Math.PI;   // desde aquí la cara que mira a la Tierra queda fija
    } else if (!v.exito && v.t >= fin) {
      juego.estado = 'fallo'; v.extra = 0;
      decir(L('😮 ¡Oh no! La Luna no estaba ahí… el cohete sigue de largo.', '😮 Oh no! The Moon wasn’t there… the rocket keeps going.'));
    }
  } else if (juego.estado === 'aterrizaje') {
    v.extra += dt;
    const Lu = LUNAR, lt = Math.min(v.extra, Lu.tFin), tr = trayLunar(lt), d = datosLunar(lt, tr);
    if (!v.toque) {
      if (lt >= Lu.tToque) {
        v.toque = true; const s = sitioLuna(), ps = mundoAPantalla(s.x, s.y); humo(ps.x, ps.y, 26, '#c9cbd8');
        decir(L('✅ <b>¡Aterrizaje exitoso!</b> El cohete está a salvo sobre la Luna.', '✅ <b>Successful landing!</b> The rocket is safe on the Moon.'));
      } else if (lt < Lu.tP) {
        decir(L(`🌙 ¡La gravedad de la Luna te atrapó! · a <b>${fmtAlt(d.alt)}</b> de la Luna · <b>${fmtVel(d.vel)}</b>`, `🌙 The Moon’s gravity caught you! · <b>${fmtAlt(d.alt)}</b> from the Moon · <b>${fmtVel(d.vel)}</b>`));
      } else if (lt < Lu.tPdi) {
        decir(`🛰️ ${L('Orbitando la Luna · altura', 'Orbiting the Moon · altitude')} <b>${fmtAlt(d.alt)}</b> · ${L('velocidad', 'speed')} <b>${fmtVel(d.vel)}</b>`);
      } else {
        decir(`⬇️ ${L('Bajando a la Luna · altura', 'Descending to the Moon · altitude')} <b>${fmtAlt(d.alt)}</b> · ${L('velocidad', 'speed')} <b>${fmtVel(d.vel)}</b>`);
        if (lt > Lu.tPitchFin + Lu.TTERM * 0.55) {   // el motor levanta polvo cerca del suelo
          const s = sitioLuna(), ps = mundoAPantalla(s.x, s.y); humo(ps.x, ps.y, 1, '#c9cbd8');
        }
      }
    }
    if (v.extra > Lu.tToque + 1.6) mostrarExito();
  } else if (juego.estado === 'fallo') {
    v.extra += dt;
    if (v.extra > 2.6) mostrarFallo();
  }

  actualizarCamara(dt);
  juego.particulas = juego.particulas.filter(p => (p.vida -= dt) > 0);
  juego.particulas.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.vx *= .985; p.vy *= .985; });
}

/* Cámara: se acerca a la Luna al final del viaje, sigue a la nave en el frenado de descenso y al final se acerca
   al suelo girando para que el horizonte quede horizontal, como se vería desde la ventana del módulo. */
function actualizarCamara(dt) {
  const v = juego.viaje, e = juego.estado, Lu = LUNAR;
  const enLuna = v && v.exito && (e === 'viaje' || e === 'aterrizaje' || e === 'resultado' || e === 'fin');
  const lt = enLuna && e !== 'viaje' ? Math.min(v.extra, Lu.tFin) : 0;
  if (enLuna) {
    const tTrans = e === 'viaje' ? v.t - (T_ASC + T_TRANSF - T_IN) : v.extra;   // segundos desde que la vista pasa a la Luna
    cam.w = suave(clamp((tTrans + 1.2) / 2.0, 0, 1));
    cam.wa = suave(clamp((lt - (Lu.tPdi - 0.8)) / 1.0, 0, 1));
    cam.wb = suave(clamp((lt - (Lu.tFrenadoFin - 0.3)) / (Lu.TPITCH + 0.3), 0, 1));
  } else {
    const k = 1 - Math.exp(-dt * 5);   // vuelve suavemente a la vista normal
    cam.w += (0 - cam.w) * k; cam.wa += (0 - cam.wa) * k; cam.wb += (0 - cam.wb) * k;
  }
  const L = polar(Rl, juego.anguloLuna), sitio = sitioLuna();
  let nave = sitio;
  if (cam.wa > 0 && v && v.phiE != null) nave = posLunar(lt, v.phiE);
  const { w, wa, wb } = cam;
  const fa = { x: L.x + (nave.x - L.x) * wa, y: L.y + (nave.y - L.y) * wa };     // Luna → nave
  const f1 = { x: cx + (fa.x - cx) * w, y: cy + (fa.y - cy) * w };               // Tierra → Luna o nave
  const ax1 = cx + (W / 2 - cx) * w, ay1 = cy + (H * 0.5 - cy) * w;
  cam.fx = f1.x + (sitio.x - f1.x) * wb; cam.fy = f1.y + (sitio.y - f1.y) * wb;
  cam.ax = ax1 + (W / 2 - ax1) * wb; cam.ay = ay1 + (H * 0.64 - ay1) * wb;   // el suelo queda sobre el aviso de texto
  const escalaSuelo = RADIO_SUELO_PX / (rLuna * escalaLuna * ESCALA_SEGUIR);
  cam.s = Math.pow(escalaLuna, w) * Math.pow(ESCALA_SEGUIR, wa) * Math.pow(escalaSuelo, wb);
  cam.rot = wb * envolver(faseTierra() - Math.PI / 2);   // la normal del suelo apunta hacia arriba
}

/* Posición y orientación del cohete según el estado */
function rumboDe(pos, t, h) {   // dirección de movimiento (en pantalla) a partir de la posición
  let a = pos(t), b = pos(t + h);
  if (Math.hypot(b.x - a.x, b.y - a.y) < 1e-6) { a = pos(t - h); b = pos(t); }
  return Math.atan2(b.y - a.y, b.x - a.x);
}
const posAscenso = u => {
  const r0 = Rt + sCohete * .62;
  return polar(r0 + (RsLEO - r0) * suave(u), anguloPad() + ASC_RAD * u * u * u);
};
// Posición de la nave en el mundo durante la fase lunar: la hipérbola más la diferencia de puntería, que se va acomodando
const posLunar = (lt, phi) => {
  const tr = trayLunar(lt), p = mundoLunar(tr.r, tr.a, phi), g = LUNAR.glide, k = 1 - suave(clamp(lt / T_GLIDE, 0, 1));
  return g ? { x: p.x + g.x * rLuna * k, y: p.y - g.y * rLuna * k } : p;
};
const rumboLunar = (lt, phi) => rumboDe(t => posLunar(t, phi), lt, 0.02);

// Antes y durante el viaje la nave sigue exactamente la elipse de Kepler: sin correcciones ni desvíos
function coheteTransferencia(tau, fallo) {
  const p = posTransferencia(tau);
  return { x: p.x, y: p.y, rumbo: rumboDe(posTransferencia, tau, 0.02), fuego: !fallo && tau < 0.9, patas: false };
}

function coheteLunar() {
  const v = juego.viaje, Lu = LUNAR, phi = v.phiE;
  const lt = Math.min(v.extra, Lu.tFin), tr = trayLunar(lt), p = posLunar(lt, phi);
  const f = (a, b) => suave(clamp((lt - a) / (b - a), 0, 1));
  // El cohete apunta siempre hacia donde se mueve; solo al final se endereza (de pie, motor al suelo) para aterrizar
  let rumbo;
  if (lt < Lu.tFrenadoFin) rumbo = rumboLunar(lt, phi);
  else {
    // La cámara gira para dejar el horizonte plano. Para que ese giro no se sume al del cohete, el ángulo se maneja
    // en pantalla: se mantiene el que traía y luego se endereza por el camino más corto hasta quedar de pie (-90°).
    if (v.anguloFijo == null) v.anguloFijo = rumboLunar(Lu.tFrenadoFin - .05, phi) + cam.rot;
    const pantalla = v.anguloFijo + envolver(-Math.PI / 2 - v.anguloFijo) * f(Lu.tFrenadoFin + .2, Lu.tPitchFin);
    rumbo = pantalla - cam.rot;
  }
  const fuego = lt >= Lu.tPitchFin - .3 && lt < Lu.tToque - .05;   // el motor solo se ve en el frenado final, ya de pie
  return { x: p.x, y: p.y, rumbo, fuego, retro: lt >= Lu.tFrenadoFin, patas: lt >= Lu.tPitchFin - .2,
           escala: 1 + (ESCALA_NAVE_CERCA - 1) * cam.wb };
}

function cohete() {
  const v = juego.viaje, pad = anguloPad();
  if (juego.estado === 'espera' || !v) {
    const p = polar(Rt + sCohete * .62, pad);
    return { x: p.x, y: p.y, rumbo: -pad, fuego: false, patas: false };   // de pie sobre la plataforma, apuntando hacia afuera
  }
  if (juego.estado === 'viaje') {
    if (v.t < T_ASC) {
      const u = v.t / T_ASC, p = posAscenso(u);
      return { x: p.x, y: p.y, rumbo: rumboDe(posAscenso, Math.min(u, .99), .01), fuego: true, patas: false };
    }
    return coheteTransferencia(v.t - T_ASC, false);
  }
  if (juego.estado === 'aterrizaje' || ((juego.estado === 'resultado' || juego.estado === 'fin') && v.exito)) return coheteLunar();
  // fallo: sigue por la misma elipse de Kepler, más allá de la órbita de la Luna
  return coheteTransferencia(T_TRANSF + (v.extra || 0), true);
}

/* =========================================================
   9. DIBUJAR
   ========================================================= */
// Rocas pequeñas cerca del sitio de aterrizaje (da: separación angular respecto al sitio, r: tamaño en radios lunares)
const ROCAS = Array.from({ length: 36 }, () => ({ da: (Math.random() - .5) * 0.2, r: 0.0003 + Math.random() * 0.0015 }));

function dibujarFondo() {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H));
  g.addColorStop(0, '#111a3a'); g.addColorStop(1, '#05070f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const s of estrellas) {
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(juego.t * 1.5 + s.f);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Los textos siguen a su punto del mundo, pero no se agrandan cuando la cámara se acerca
function texto(t, x, y, tam, color = '#cfd8ff', alin = 'center') {
  const m = ctx.getTransform();
  const px = (m.a * x + m.c * y + m.e) / dprActual, py = (m.b * x + m.d * y + m.f) / dprActual;
  ctx.save(); ctx.setTransform(dprActual, 0, 0, dprActual, 0, 0);
  ctx.font = `bold ${tam}px "Trebuchet MS", system-ui, sans-serif`;
  ctx.textAlign = alin; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillText(t, px + 1, py + 1);
  ctx.fillStyle = color; ctx.fillText(t, px, py);
  ctx.restore();
}

function dibujarTierra() {
  const g = ctx.createRadialGradient(cx - Rt * .35, cy - Rt * .35, Rt * .1, cx, cy, Rt);
  g.addColorStop(0, '#7cc4ff'); g.addColorStop(1, '#1b4fa8');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Rt, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Rt, 0, TAU); ctx.clip();
  ctx.fillStyle = '#3fbf6a';
  [[0, .2, .45], [2.1, -.3, .35], [4, .35, .3]].forEach(([a, dy, s]) => {
    const x = cx + Math.cos(a + .6) * Rt * .55, y = cy + dy * Rt;
    if (Math.cos(a + .6) > -0.3) { ctx.beginPath(); ctx.ellipse(x, y, Rt * s, Rt * s * .6, .4, 0, TAU); ctx.fill(); }
  });
  ctx.restore();
  ctx.strokeStyle = 'rgba(124,196,255,.35)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, Rt + 3, 0, TAU); ctx.stroke();
  // plataforma de lanzamiento
  const ab = anguloPad(), base = polar(Rt, ab);
  ctx.save(); ctx.translate(base.x, base.y); ctx.rotate(-ab + Math.PI / 2);
  ctx.fillStyle = '#5d6488'; ctx.fillRect(-sCohete * .9, -3, sCohete * 1.8, 5);       // base
  ctx.strokeStyle = '#8b93b8'; ctx.lineWidth = 2;                                    // torre
  ctx.beginPath(); ctx.moveTo(sCohete * .7, 0); ctx.lineTo(sCohete * .7, -sCohete * 1.5); ctx.stroke();
  for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(sCohete * .7, -i * sCohete * .45); ctx.lineTo(sCohete * .45, -i * sCohete * .45); ctx.stroke(); }
  ctx.restore();
  const pt = polar(Rt * .45, ab + Math.PI);
  if (cam.w < 0.4) texto(L('Tierra', 'Earth'), pt.x, pt.y, Math.max(12, Rl * .055));
}

function dibujarLuna(x, y, alfa = 1, fantasma = false) {
  ctx.save(); ctx.globalAlpha = alfa;
  if (fantasma) {
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#d8def5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, rLuna, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(216,222,245,.12)'; ctx.fill();
  } else {
    const g = ctx.createRadialGradient(x - rLuna * .3, y - rLuna * .3, rLuna * .1, x, y, rLuna);
    g.addColorStop(0, '#f4f4f4'); g.addColorStop(1, '#8d93a3');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rLuna, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(90,95,110,.45)';
    [[-.3, -.2, .22], [.35, .1, .16], [-.05, .4, .13]].forEach(([dx, dy, s]) => {
      ctx.beginPath(); ctx.arc(x + dx * rLuna, y + dy * rLuna, s * rLuna, 0, TAU); ctx.fill();
    });
  }
  ctx.restore();
}

function dibujarCohete(c) {
  const s = sCohete * (c.escala || 1);
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rumbo);
  if (c.fuego) {
    const l = s * (c.retro ? .6 + Math.random() * .4 : 1.2 + Math.random() * .8);
    ctx.fillStyle = '#ffb547';
    ctx.beginPath(); ctx.moveTo(-s * .6, -s * .3); ctx.lineTo(-s * .6 - l, 0); ctx.lineTo(-s * .6, s * .3); ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.moveTo(-s * .6, -s * .15); ctx.lineTo(-s * .6 - l * .5, 0); ctx.lineTo(-s * .6, s * .15); ctx.fill();
  }
  if (c.patas) {
    ctx.strokeStyle = '#c9cfe6'; ctx.lineWidth = Math.max(1.5, s * .1); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * .35, -s * .3); ctx.lineTo(-s * .62, -s * .62); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * .35, s * .3); ctx.lineTo(-s * .62, s * .62); ctx.stroke();
  }
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.moveTo(-s * .5, -s * .45); ctx.lineTo(-s * .8, -s * .7); ctx.lineTo(-s * .1, -s * .35); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-s * .5, s * .45); ctx.lineTo(-s * .8, s * .7); ctx.lineTo(-s * .1, s * .35); ctx.fill();
  ctx.fillStyle = '#f2f5ff';
  ctx.beginPath(); ctx.moveTo(s, 0); ctx.quadraticCurveTo(s * .3, -s * .45, -s * .6, -s * .35);
  ctx.lineTo(-s * .6, s * .35); ctx.quadraticCurveTo(s * .3, s * .45, s, 0); ctx.fill();
  ctx.fillStyle = '#5aa8ff'; ctx.beginPath(); ctx.arc(s * .2, 0, s * .16, 0, TAU); ctx.fill();
  ctx.restore();
}

function dibujar() {
  dibujarFondo();
  const c = config();
  const tam = Math.max(12, Rl * .055);
  const esperando = juego.estado === 'espera';
  const ab = juego.anguloBase;
  const k = 1 / cam.s;   // grosor de las líneas constante aunque la cámara se acerque

  // Todo lo del mundo (Tierra, Luna, rutas) se dibuja a través de la cámara
  ctx.save();
  ctx.translate(cam.ax, cam.ay); ctx.rotate(cam.rot); ctx.scale(cam.s, cam.s); ctx.translate(-cam.fx, -cam.fy);

  // órbita de la Luna
  ctx.save(); ctx.setLineDash([4 * k, 8 * k]); ctx.lineWidth = 1.5 * k;
  ctx.strokeStyle = 'rgba(169,182,230,.28)'; ctx.beginPath(); ctx.arc(cx, cy, Rl, 0, TAU); ctx.stroke();
  ctx.restore();

  // órbita de espera y punto de encuentro
  const pe = polar(Rl, ab);
  if (esperando || juego.estado === 'viaje') {
    ctx.save(); ctx.setLineDash([2 * k, 6 * k]); ctx.strokeStyle = 'rgba(169,182,230,.35)'; ctx.lineWidth = 1.5 * k;
    ctx.beginPath(); ctx.arc(cx, cy, RsLEO, 0, TAU); ctx.stroke(); ctx.restore();
  }
  if (esperando) {
    ctx.save(); ctx.strokeStyle = '#ffb547'; ctx.lineWidth = 2.5;
    const pulso = 1 + .15 * Math.sin(juego.t * 4);
    ctx.beginPath(); ctx.arc(pe.x, pe.y, rLuna * 1.15 * pulso, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pe.x - 6, pe.y); ctx.lineTo(pe.x + 6, pe.y); ctx.moveTo(pe.x, pe.y - 6); ctx.lineTo(pe.x, pe.y + 6); ctx.stroke();
    ctx.restore();
    const pt = polar(Rl + rLuna + tam * 1.7, ab);
    texto(L('Punto de encuentro', 'Meeting point'), pt.x, pt.y, tam * .85, '#ffb547');
  }

  // zona de despegue: dónde debe estar la Luna al despegar
  if (esperando && c.zona) {
    const centro = anguloIdealDespegue(), tol = c.tolGrados * Math.PI / 180;
    const dentro = btnMotor.classList.contains('ahora');
    ctx.save(); ctx.lineWidth = rLuna * 2.3; ctx.lineCap = 'round';
    ctx.strokeStyle = dentro ? 'rgba(62,230,143,.55)' : 'rgba(62,230,143,.25)';
    ctx.beginPath(); ctx.arc(cx, cy, Rl, -(centro + tol), -(centro - tol)); ctx.stroke(); ctx.restore();
    const pz = polar(Rl - rLuna - tam * 1.6, centro);
    texto(L('Zona de despegue', 'Launch zone'), pz.x, pz.y, tam * .8, '#3ee68f');
  }

  // Luna fantasma (donde estará en 3 días)
  if (esperando && c.fantasma) {
    const af = juego.anguloLuna + AVANCE_LUNA_VIAJE, pf = polar(Rl, af);
    ctx.save(); ctx.strokeStyle = 'rgba(216,222,245,.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, Rl, -af, -juego.anguloLuna); ctx.stroke(); ctx.restore();
    dibujarLuna(pf.x, pf.y, .9, true);
    const pt = polar(Rl - rLuna - tam * 1.4, af);
    texto(L('La Luna en 3 días', 'The Moon in 3 days'), pt.x, pt.y, tam * .8, '#d8def5');
  }

  dibujarTierra();

  // Luna real
  const pl = polar(Rl, juego.anguloLuna);
  dibujarLuna(pl.x, pl.y);
  const plt = polar(Rl + rLuna + tam * 1.1, juego.anguloLuna);
  if (cam.w < 0.4) texto(L('Luna', 'Moon'), plt.x, plt.y, tam);

  // sitio de aterrizaje en la cara que mira a la Tierra
  const sobreLuna = juego.estado === 'aterrizaje' || ((juego.estado === 'resultado' || juego.estado === 'fin') && juego.viaje && juego.viaje.exito);
  if (sobreLuna) {
    const sitio = sitioLuna();
    if (cam.wb > 0.02) {   // rocas del suelo: solo se notan cuando la cámara llega cerca
      ctx.save(); ctx.fillStyle = '#5d6378';
      for (const q of ROCAS) {
        const p = mundoLunar(1, q.da, faseTierra());
        ctx.beginPath(); ctx.arc(p.x, p.y, rLuna * q.r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = '#ffb547'; ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.arc(sitio.x, sitio.y, (14 + 2 * Math.sin(juego.t * 4)) * k, 0, TAU); ctx.stroke(); ctx.restore();
  }

  // cohete y estela
  // La estela del viaje se guarda en el mundo; la de la fase lunar es otro trazo, porque ahí la cámara sigue a la Luna
  const co = cohete();
  const guardar = juego.estado === 'viaje' || juego.estado === 'fallo' || juego.estado === 'aterrizaje';
  if (guardar) {
    const ult = juego.estela[juego.estela.length - 1], lunar = juego.estado === 'aterrizaje';
    juego.estela.push({ x: co.x, y: co.y, lunar, corte: lunar && !(ult && ult.lunar) });
    if (juego.estela.length > 3000) juego.estela.shift();
  }
  const estelaVisible = juego.estado === 'viaje' || juego.estado === 'fallo' || juego.estado === 'aterrizaje' || (juego.estado === 'resultado' && juego.viaje && !juego.viaje.exito);
  if (estelaVisible && juego.estela.length > 1) {
    for (const lunar of [false, true]) {
      const pts = juego.estela.filter(q => q.lunar === lunar);
      if (pts.length < 2) continue;
      // la estela del viaje se ve hasta que la cámara empieza a seguir a la nave
      ctx.save(); ctx.strokeStyle = `rgba(255,181,71,${.6 * (lunar ? 1 - cam.wb : 1 - cam.wa)})`; ctx.lineWidth = 2 * k;
      ctx.beginPath(); pts.forEach((q, i) => (i && !q.corte) ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); ctx.restore();
    }
  }

  // tras un fallo: cuánto faltó
  if ((juego.estado === 'fallo' || (juego.estado === 'resultado' && juego.viaje && !juego.viaje.exito))) {
    ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,107,107,.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pe.x, pe.y); ctx.lineTo(pl.x, pl.y); ctx.stroke(); ctx.restore();
    const km = DATOS.distanciaLunaKm * Math.abs(juego.viaje.dif);
    texto(L(`¡Faltaron ~${fmt(km)} km!`, `Missed by ~${fmt(km)} km!`), (pe.x + pl.x) / 2, (pe.y + pl.y) / 2 - 14, tam * .9, '#ff9b9b');
  }

  ctx.restore();   // fin del mundo; lo que sigue se dibuja directo en pantalla

  let alfa = 1;
  if (juego.estado === 'fallo') alfa = Math.max(0, 1 - juego.viaje.extra / 2.6);
  if (juego.estado === 'resultado' && juego.viaje && !juego.viaje.exito) alfa = 0;
  const pc = mundoAPantalla(co.x, co.y);
  ctx.globalAlpha = alfa; dibujarCohete({ ...co, x: pc.x, y: pc.y, rumbo: co.rumbo + cam.rot }); ctx.globalAlpha = 1;

  // Desde el suelo de la cara visible la Tierra se ve en el cielo, siempre en la misma posición
  if (cam.wb > 0.02) {
    const ex = W * 0.7, ey = H * 0.2, er = Math.max(26, Math.min(W, H) * 0.05);
    ctx.save(); ctx.globalAlpha = cam.wb;
    const g = ctx.createRadialGradient(ex - er * .35, ey - er * .35, er * .1, ex, ey, er);
    g.addColorStop(0, '#7cc4ff'); g.addColorStop(1, '#1b4fa8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3fbf6a'; ctx.beginPath(); ctx.ellipse(ex + er * .15, ey + er * .1, er * .38, er * .24, .4, 0, TAU); ctx.fill();
    ctx.restore();
    texto(L('Tierra', 'Earth'), ex, ey + er + 14, Math.max(12, er * .45));
  }

  for (const q of juego.particulas) {
    ctx.globalAlpha = Math.min(1, q.vida); ctx.fillStyle = q.color;
    ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* =========================================================
   10. RESULTADOS + APRENDIZAJE ADAPTATIVO
   ========================================================= */
function humo(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, v = 20 + Math.random() * 60;
    juego.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 2 + Math.random() * 3, vida: .6 + Math.random() * .6, color });
  }
}
function lanzarConfeti(x, y) {
  const colores = ['#ffd27a', '#3ee68f', '#5aa8ff', '#ff6b6b', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * TAU, v = 60 + Math.random() * 220;
    juego.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 60, r: 2 + Math.random() * 3,
      vida: 1.5 + Math.random(), color: colores[i % colores.length] });
  }
}

function mostrarExito() {
  juego.estado = 'resultado';
  const sitio = sitioLuna(), ps = mundoAPantalla(sitio.x, sitio.y); lanzarConfeti(ps.x, ps.y);
  const n = juego.intento;
  const estrellasTxt = n <= 2 ? '⭐⭐⭐' : n <= 4 ? '⭐⭐' : '⭐';
  const ultimo = juego.nivel === NIVELES.length - 1;
  const horas = Math.abs(aGrados(juego.viaje.dif)) / GRADOS_POR_HORA;

  window.dispatchEvent(new CustomEvent('mision1:nivelSuperado', {
    detail: { nivel: juego.nivel + 1, nombre: NIVELES[juego.nivel].nombre, intentos: n, ayudas: juego.ayudaExtra }
  }));

  $('tarjetaResultado').innerHTML = `
    <div class="grande">🌙✨</div>
    <h2>${L(`¡Aterrizaste en la Luna, ${NIVELES[juego.nivel].nombre}!`, `You landed on the Moon, ${NIVELES[juego.nivel].nombre}!`)}</h2>
    <div class="grande" style="font-size:40px">${estrellasTxt}</div>
    <p>${L(`Lo lograste en <b>${n}</b> ${n === 1 ? 'intento' : 'intentos'}. Despegaste a solo <b>${horas.toFixed(1)} horas</b> del momento perfecto.`, `You did it in <b>${n}</b> ${n === 1 ? 'attempt' : 'attempts'}. You launched just <b>${horas.toFixed(1)} hours</b> from the perfect moment.`)}</p>
    <div class="dato">${L('🚀 <b>Igual que Apolo 11:</b> en 1969 los astronautas salieron hacia la Luna en el momento justo y llegaron a ella unos 3 días después.', '🚀 <b>Just like Apollo 11:</b> in 1969 the astronauts left for the Moon at the right moment and got there about 3 days later.')}</div>
    <div class="botones">
      ${ultimo
        ? `<button class="btn primario" id="btnSeguir">${L('Continuar la misión →', 'Continue the mission →')}</button>`
        : `<button class="btn primario" id="btnSeguir">${L('Siguiente nivel', 'Next level')}: ${NIVELES[juego.nivel + 1].nombre} →</button>`}
      <button class="btn secundario" id="btnRepetir">${L('Jugar este nivel otra vez', 'Play this level again')}</button>
    </div>`;
  $('capaResultado').classList.add('visible');
  $('btnSeguir').onclick = () => {
    $('capaResultado').classList.remove('visible');
    if (ultimo) {
      // Punto de integración con el resto del videojuego
      window.dispatchEvent(new CustomEvent('mision1:completada', { detail: { ayudasUsadas: juego.ayudasUsadas } }));
      decir(L('🏆 ¡Misión 1 completada! Siguiente parada: construir el puesto lunar.', '🏆 Mission 1 complete! Next stop: building the lunar outpost.'));
      juego.estado = 'fin';
      // Continue the flow: the next screen is the arrival at the lunar base
      setTimeout(() => { location.href = '../llegadaBase/index.html'; }, 2200);
      return;
    }
    juego.nivel++; reiniciarNivel();
  };
  $('btnRepetir').onclick = () => { $('capaResultado').classList.remove('visible'); reiniciarNivel(); };
}

function mostrarFallo() {
  juego.estado = 'resultado';
  juego.fallosSeguidos++;

  // Aprendizaje adaptativo: más ayudas tras varios fallos seguidos
  let avisoAyuda = '';
  const c = config();
  if (juego.fallosSeguidos === 2 && !c.fantasma) { juego.ayudaExtra = 1; avisoAyuda = L('🛟 Control de Misión activó la <b>Luna fantasma</b> para ayudarte.', '🛟 Mission Control turned on the <b>ghost Moon</b> to help you.'); }
  else if (juego.fallosSeguidos === 4 && !c.zona) { juego.ayudaExtra = Math.max(juego.ayudaExtra, 2); avisoAyuda = L('🛟 Control de Misión activó la <b>zona de despegue</b>.', '🛟 Mission Control turned on the <b>launch zone</b>.'); }
  else if (juego.fallosSeguidos === 6) { juego.ayudaExtra = 3; avisoAyuda = L('🛟 Activamos la <b>cámara lenta</b> para que encuentres el momento justo.', '🛟 We turned on <b>slow motion</b> so you can find the right moment.'); }
  if (avisoAyuda) juego.ayudasUsadas++;

  $('tarjetaResultado').innerHTML = `
    <div class="grande">🚀💨</div>
    <h2>${L('¡El cohete pasó de largo!', 'The rocket flew right past!')}</h2>
    <p>${L('La Luna estaba muy lejos. Asegúrate de despegar cuando la Luna esté en la posición correcta.', 'The Moon was too far away. Make sure you launch when the Moon is in the right position.')}</p>
    ${avisoAyuda ? `<div class="dato">${avisoAyuda}</div>` : ''}
    <div class="botones"><button class="btn primario" id="btnOtraVez">${L('🔁 Intentar de nuevo', '🔁 Try again')}</button></div>`;
  $('capaResultado').classList.add('visible');
  $('btnOtraVez').onclick = () => {
    $('capaResultado').classList.remove('visible');
    juego.intento++; empezarIntento();
  };
}

function nuevaPosicion() {
  // plataforma en la mitad de arriba de la Tierra (cambia en cada nivel)
  juego.anguloBase = Math.PI * (0.2 + Math.random() * 0.6);
  // la Luna empieza lejos de la zona correcta, para que haya que esperar
  juego.anguloLuna = anguloIdealDespegue() - (Math.PI * (0.35 + Math.random() * 0.5));
}

function reiniciarNivel() {
  juego.intento = 1; juego.fallosSeguidos = 0; juego.ayudaExtra = 0;
  nuevaPosicion();
  empezarIntento();
}

/* =========================================================
   11. CONTROLES Y BUCLE
   ========================================================= */
btnMotor.addEventListener('click', despegar);
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); despegar(); }
});
$('btnDatos').onclick = () => $('capaDatos').classList.add('visible');
$('btnCerrarDatos').onclick = () => $('capaDatos').classList.remove('visible');

let antes = performance.now();
function bucle(ahora) {
  const dt = Math.min((ahora - antes) / 1000, 0.05); antes = ahora;
  if (!$('capaDatos').classList.contains('visible')) actualizar(dt);
  dibujar();
  requestAnimationFrame(bucle);
}
nuevaPosicion();
empezarIntento();   // sin pantalla de inicio: el juego arranca de inmediato
requestAnimationFrame(bucle);

// Solo para pruebas del equipo: window.__mision1.despegarAhora(true) fuerza un despegue perfecto
window.__mision1 = { juego, lunar: () => LUNAR, cohete: () => cohete(), cam, rpUlt: () => construirLunar.rp, apuntado, anguloIdealDespegue, estadoRelativo, elementosHiperbola, rLuna: () => rLuna, Rl: () => Rl, despegarAhora(perfecto) { if (perfecto) juego.anguloLuna = anguloIdealDespegue(); despegar(); } };
})();
