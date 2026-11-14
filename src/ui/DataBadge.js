export class DataBadge {
  constructor(containerId = 'data-badge') {
    this.container = document.getElementById(containerId);
  }

  show({ source, live, retrievedAt }) {
    const tag = live ? 'en vivo' : `dataset curado (${retrievedAt})`;
    this.container.textContent = `Datos de NASA: ${source} — ${tag}`;
  }
}
