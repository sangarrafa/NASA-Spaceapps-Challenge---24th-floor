export class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    (this.listeners[event] ??= []).push(callback);
  }

  emit(event, payload) {
    (this.listeners[event] ?? []).forEach((cb) => cb(payload));
  }
}

export const bus = new EventBus();
