// Mapea cada decisión jugable a su compensación real: ninguna decisión es gratis.
const DECISIONS = {
  reinforceShielding: {
    effects: { shield: +20, energy: -15 },
    message: '🛡️ Reforzaste el blindaje. Ganaste protección, pero gastaste energía esta noche.',
  },
  boostEnergy: {
    effects: { energy: +20, shield: -10 },
    message: '⚡ Priorizaste energía. Subiste potencia, pero bajó el blindaje disponible.',
  },
};

export class RulesEngine {
  constructor(gameState, bus) {
    this.gameState = gameState;
    this.bus = bus;
  }

  applyDecision(decisionId) {
    const decision = DECISIONS[decisionId];
    if (!decision) return;

    for (const [resource, delta] of Object.entries(decision.effects)) {
      this.gameState.adjust(resource, delta);
    }
    this.gameState.logDecision(decisionId, decision.effects);

    this.bus.emit('state:updated', this.gameState.resources);
    this.bus.emit('log:message', decision.message);
  }
}
