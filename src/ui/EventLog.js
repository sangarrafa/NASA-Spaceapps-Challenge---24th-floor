export class EventLog {
  constructor(bus, containerId = 'event-log') {
    this.container = document.getElementById(containerId);
    this.container.textContent = 'Click a module on the space base...';
    bus.on('log:message', (msg) => this.append(msg));
  }

  append(message) {
    this.container.textContent = message;
  }
}
