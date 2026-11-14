export class EventLog {
  constructor(bus, containerId = 'event-log') {
    this.container = document.getElementById(containerId);
    this.container.textContent = 'Haz clic en un módulo del puesto avanzado...';
    bus.on('log:message', (msg) => this.append(msg));
  }

  append(message) {
    this.container.textContent = message;
  }
}
