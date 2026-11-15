export class GameState {
  constructor() {
    this.day = 1;
    this.resources = {
      energy: 70,
      shield: 50,
    };
    this.history = [];
  }

  adjust(resource, delta) {
    const current = this.resources[resource] ?? 0;
    this.resources[resource] = Math.max(0, Math.min(100, current + delta));
  }

  logDecision(decisionId, effects) {
    this.history.push({ day: this.day, decisionId, effects });
  }

  nextDay() {
    this.day += 1;
  }
}
