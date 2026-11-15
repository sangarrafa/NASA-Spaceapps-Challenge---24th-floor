/* -------------------------------------------------------------
   Cohete de "Llegada a la base" — versión independiente (Canvas 2D, sin librerías).

   Uso:
     <canvas id="c" width="1280" height="720"></canvas>
     <script src="cohete.js"></script>
     <script>
       const ctx = document.getElementById('c').getContext('2d');
       // x = centro del cohete, y = nivel del suelo (donde apoyan las patas)
       dibujarCohete(ctx, 430, 600);                          // tamaño original (alto ~300 px)
       dibujarCohete(ctx, 900, 600, { escala: .6, escotilla: 1 });
     </script>

   Opciones (todas opcionales):
     escala     1       tamaño relativo
     escotilla  0..1    0 = cerrada, 1 = abierta con luz interior
     sombra     true    sombra larga en el suelo (hacia la derecha)
     escalera   true    escalera bajo la escotilla
     colores    {…}     sobrescribe la paleta (ver PALETA_COHETE)

   Referencia de medidas (escala 1, origen en el suelo): punta a 300 px
   sobre el suelo, patas abiertas ±80 px, escotilla de 50×72 px.
   ------------------------------------------------------------- */
(() => {
const PALETA_COHETE = {
  rosa: '#E8418C', aqua: '#6FE3E8', cian: '#21C1E0', ambar: '#FFB547',
  cuerpoLuz: '#FFFFFF', cuerpoMedio: '#E3E6F5', cuerpoSombra: '#A8ADCB',
  patas: '#C9CFE6', pies: '#8b8fae', tobera: '#4a4d72',
  marco: '#2b2d4c', escotillaCerrada: '#DADDF0', escotillaAbierta: '#C3C8E0',
  escalera: '#9aa0c4', picaporte: '#6b6f93'
};

const GY = 600, RX = 0;                          // geometría original: suelo en y=600, cohete centrado en x=0
const DOOR = { x: RX - 25, y: 468, w: 50, h: 72 };

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(.1, r), 0, Math.PI * 2); }
function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2); }

function dibujarCohete(ctx, x, sueloY, opc = {}) {
  const o = Object.assign({ escala: 1, escotilla: 0, sombra: true, escalera: true }, opc);
  const P = Object.assign({}, PALETA_COHETE, opc.colores);
  const hatch = Math.max(0, Math.min(1, o.escotilla));

  ctx.save();
  ctx.translate(x, sueloY - GY * o.escala);
  ctx.scale(o.escala, o.escala);
  ctx.lineCap = 'round';

  // sombra larga
  if (o.sombra) {
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath();
    ctx.moveTo(RX - 60, GY - 2); ctx.lineTo(RX + 60 + 300, GY - 4); ctx.lineTo(RX + 60 + 310, GY + 10); ctx.lineTo(RX - 60, GY + 8);
    ctx.closePath(); ctx.fill();
  }
  // patas
  ctx.strokeStyle = P.patas; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(RX - 40, 540); ctx.lineTo(RX - 80, GY - 2); ctx.moveTo(RX + 40, 540); ctx.lineTo(RX + 80, GY - 2); ctx.stroke();
  ctx.fillStyle = P.pies; ell(ctx, RX - 82, GY, 14, 4); ctx.fill(); ell(ctx, RX + 82, GY, 14, 4); ctx.fill();
  // aletas
  ctx.fillStyle = P.rosa;
  ctx.beginPath(); ctx.moveTo(RX - 52, 470); ctx.lineTo(RX - 96, 560); ctx.lineTo(RX - 52, 548); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(RX + 52, 470); ctx.lineTo(RX + 96, 560); ctx.lineTo(RX + 52, 548); ctx.closePath(); ctx.fill();
  // tobera
  ctx.fillStyle = P.tobera; ctx.beginPath();
  ctx.moveTo(RX - 26, 556); ctx.lineTo(RX + 26, 556); ctx.lineTo(RX + 34, 576); ctx.lineTo(RX - 34, 576); ctx.closePath(); ctx.fill();
  // cuerpo
  const bg = ctx.createLinearGradient(RX - 56, 0, RX + 56, 0);
  bg.addColorStop(0, P.cuerpoLuz); bg.addColorStop(.55, P.cuerpoMedio); bg.addColorStop(1, P.cuerpoSombra);
  ctx.beginPath(); ctx.moveTo(RX, 300);
  ctx.bezierCurveTo(RX + 50, 340, RX + 58, 400, RX + 56, 470); ctx.lineTo(RX + 52, 558); ctx.lineTo(RX - 52, 558); ctx.lineTo(RX - 56, 470);
  ctx.bezierCurveTo(RX - 58, 400, RX - 50, 340, RX, 300); ctx.closePath();
  ctx.fillStyle = bg; ctx.fill();
  // punta rosada + franja
  ctx.save(); ctx.clip(); ctx.fillStyle = P.rosa; ctx.fillRect(RX - 60, 290, 120, 48); ctx.fillStyle = P.aqua; ctx.fillRect(RX - 60, 338, 120, 6); ctx.restore();
  // ventanita
  circle(ctx, RX, 392, 17); ctx.fillStyle = P.marco; ctx.fill();
  circle(ctx, RX, 392, 12);
  const wg = ctx.createRadialGradient(RX - 4, 388, 1, RX, 392, 12); wg.addColorStop(0, '#BFF7FA'); wg.addColorStop(1, P.cian);
  ctx.fillStyle = wg; ctx.fill();
  // polvo en la base
  ctx.fillStyle = 'rgba(150,150,175,.35)'; ctx.fillRect(RX - 52, 540, 104, 18);
  // escotilla
  const d = DOOR;
  rr(ctx, d.x - 3, d.y - 3, d.w + 6, d.h + 6, 12); ctx.fillStyle = P.pies; ctx.fill();
  if (hatch > 0) {
    rr(ctx, d.x, d.y, d.w, d.h, 10);
    const ig = ctx.createLinearGradient(0, d.y, 0, d.y + d.h); ig.addColorStop(0, '#FFE7B8'); ig.addColorStop(1, P.ambar);
    ctx.fillStyle = ig; ctx.fill();
    const lg = ctx.createRadialGradient(d.x + d.w / 2, d.y + d.h, 5, d.x + d.w / 2, d.y + d.h, 150);
    lg.addColorStop(0, `rgba(255,214,150,${.35 * hatch})`); lg.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = lg; ctx.beginPath();
    ctx.moveTo(d.x, d.y + d.h * .2); ctx.lineTo(d.x + d.w, d.y + d.h * .2); ctx.lineTo(d.x + d.w + 120, GY + 40); ctx.lineTo(d.x - 80, GY + 40);
    ctx.closePath(); ctx.fill();
  }
  const dw = d.w * (1 - hatch * .92);                       // la puerta "gira" sobre su bisagra izquierda
  rr(ctx, d.x, d.y, dw, d.h, 10); ctx.fillStyle = hatch > 0 ? P.escotillaAbierta : P.escotillaCerrada; ctx.fill();
  ctx.strokeStyle = P.pies; ctx.lineWidth = 2; ctx.stroke();
  if (dw > 14) { circle(ctx, d.x + dw - 9, d.y + d.h / 2, 3); ctx.fillStyle = P.picaporte; ctx.fill(); }
  // escalera
  if (o.escalera) {
    ctx.strokeStyle = P.escalera; ctx.lineWidth = 3;
    const lx1 = d.x + 12, lx2 = d.x + d.w - 12;
    ctx.beginPath(); ctx.moveTo(lx1, d.y + d.h); ctx.lineTo(lx1 - 4, GY); ctx.moveTo(lx2, d.y + d.h); ctx.lineTo(lx2 + 4, GY); ctx.stroke();
    ctx.lineWidth = 2;
    for (let y = d.y + d.h + 12; y < GY; y += 13) {
      const k = (y - d.y - d.h) / (GY - d.y - d.h);
      ctx.beginPath(); ctx.moveTo(lx1 - 4 * k, y); ctx.lineTo(lx2 + 4 * k, y); ctx.stroke();
    }
  }
  ctx.restore();
}

window.dibujarCohete = dibujarCohete;
window.PALETA_COHETE = PALETA_COHETE;
})();
