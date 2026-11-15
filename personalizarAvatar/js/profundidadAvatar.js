/* Efecto de partículas Three.js en el escenario del taller de trajes.
   Requiere que THREE esté en el scope global (lib/three.r186.min.js). */
(function () {
  if (!window.THREE) return;

  const escenario = document.querySelector('.escenario');
  if (!escenario) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;border-radius:inherit';
  escenario.insertBefore(canvas, escenario.firstChild);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setClearColor(0x000000, 0);

  let W = escenario.clientWidth  || 380;
  let H = escenario.clientHeight || 540;

  function resize() {
    W = escenario.clientWidth  || 380;
    H = escenario.clientHeight || 540;
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cam.left   = -W / 2; cam.right  =  W / 2;
    cam.top    =  H / 2; cam.bottom = -H / 2;
    cam.updateProjectionMatrix();
  }

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-W/2, W/2, H/2, -H/2, 0.1, 100);
  cam.position.z = 10;
  resize();

  /* ---- Partículas ambientales (siempre flotan hacia arriba) ---- */
  const N_IDLE = 55;
  const idlePos = new Float32Array(N_IDLE * 3);
  const idleVel = [];
  for (let i = 0; i < N_IDLE; i++) {
    idlePos[i*3]   = (Math.random() - 0.5) * W;
    idlePos[i*3+1] = (Math.random() - 0.5) * H;
    idlePos[i*3+2] = 0;
    idleVel.push({ vx: (Math.random() - 0.5) * 10, vy: 6 + Math.random() * 14 });
  }
  const idleGeo = new THREE.BufferGeometry();
  idleGeo.setAttribute('position', new THREE.BufferAttribute(idlePos, 3));
  const idleMat = new THREE.PointsMaterial({
    size: 2.8, color: 0x6FE3E8, transparent: true, opacity: 0.45, sizeAttenuation: false
  });
  scene.add(new THREE.Points(idleGeo, idleMat));

  /* ---- Partículas de impacto al saltar ---- */
  const N_BURST = 50;
  const burstPos = new Float32Array(N_BURST * 3);
  const burstVelArr = Array.from({ length: N_BURST }, () => ({ vx: 0, vy: 0 }));
  const burstLife  = new Float32Array(N_BURST);
  const burstGeo   = new THREE.BufferGeometry();
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
  const burstMat   = new THREE.PointsMaterial({
    size: 6, color: 0xFFB547, transparent: true, opacity: 0, sizeAttenuation: false
  });
  scene.add(new THREE.Points(burstGeo, burstMat));

  let burstActive = false;
  let burstTimer  = 0;

  /* ---- API pública ---- */
  window.EqAvatarFisicas = {
    saltar: function (colorHex) {
      burstActive = true;
      burstTimer  = 0;
      burstMat.color.set(colorHex || '#6FE3E8');
      burstMat.opacity = 0.9;
      const groundY = -H * 0.42;
      for (let i = 0; i < N_BURST; i++) {
        const ang = Math.PI * (0.08 + 0.84 * Math.random());
        const spd = 90 + Math.random() * 170;
        burstPos[i*3]   = (Math.random() - 0.5) * W * 0.28;
        burstPos[i*3+1] = groundY;
        burstPos[i*3+2] = 0;
        burstVelArr[i].vx = Math.cos(ang) * spd * (Math.random() < 0.5 ? 1 : -1);
        burstVelArr[i].vy = Math.sin(ang) * spd;
        burstLife[i] = 1.0;
      }
      burstGeo.attributes.position.needsUpdate = true;
    }
  };

  /* ---- Loop ---- */
  const timer = new THREE.Timer();
  timer.connect(document);

  renderer.setAnimationLoop(function () {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);

    // Idle: float up and wrap
    for (let i = 0; i < N_IDLE; i++) {
      idlePos[i*3]   += idleVel[i].vx * dt;
      idlePos[i*3+1] += idleVel[i].vy * dt;
      if (idlePos[i*3+1] > H / 2 + 20) {
        idlePos[i*3+1]  = -H / 2 - 20;
        idlePos[i*3]    = (Math.random() - 0.5) * W;
        idleVel[i].vx   = (Math.random() - 0.5) * 10;
        idleVel[i].vy   = 6 + Math.random() * 14;
      }
    }
    idleGeo.attributes.position.needsUpdate = true;

    // Burst: physics + fade
    if (burstActive) {
      burstTimer += dt;
      let any = false;
      for (let i = 0; i < N_BURST; i++) {
        if (burstLife[i] <= 0) continue;
        burstLife[i] -= dt * 1.5;
        if (burstLife[i] <= 0) { burstLife[i] = 0; continue; }
        any = true;
        burstPos[i*3]   += burstVelArr[i].vx * dt;
        burstPos[i*3+1] += burstVelArr[i].vy * dt;
        burstVelArr[i].vy -= 340 * dt; // gravity
      }
      burstGeo.attributes.position.needsUpdate = true;
      burstMat.opacity = Math.max(0, 0.9 - burstTimer * 1.4);
      if (!any) { burstActive = false; burstMat.opacity = 0; }
    }

    renderer.render(scene, cam);
  });

  const ro = new ResizeObserver(resize);
  ro.observe(escenario);
})();
