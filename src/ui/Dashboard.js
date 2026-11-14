export class Dashboard {
  constructor(bus, containerId = 'dashboard') {
    this.container = document.getElementById(containerId);
    this.container.innerHTML = `
      <div class="bar-wrap">⚡ Energía
        <div class="bar-bg"><div id="energy-fill" class="bar-fill" style="background:#ffcc33"></div></div>
      </div>
      <div class="bar-wrap">🛡️ Blindaje contra radiación
        <div class="bar-bg"><div id="shield-fill" class="bar-fill" style="background:#33c6ff"></div></div>
      </div>
    `;
    bus.on('state:updated', (resources) => this.render(resources));
  }

  render(resources) {
    document.getElementById('energy-fill').style.width = `${resources.energy}%`;
    document.getElementById('shield-fill').style.width = `${resources.shield}%`;
  }
}
