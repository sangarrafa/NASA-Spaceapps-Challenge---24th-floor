export class DataBadge {
  constructor(containerId = 'data-badge') {
    this.container = document.getElementById(containerId);
  }

  show({ source, live, retrievedAt }) {
    const tag = live ? 'live' : `curated dataset (${retrievedAt})`;
    this.container.textContent = `NASA data: ${source} — ${tag}`;
  }
}
