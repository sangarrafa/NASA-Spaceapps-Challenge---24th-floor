// Maps each playable decision to its real trade-off: no decision is free.
const DECISIONS = {
  reinforceShielding: {
    effects: { shield: +20, energy: -15 },
    message: '🛡️ You reinforced the shielding. More protection, but you burned energy tonight.',
  },
  boostEnergy: {
    effects: { energy: +20, shield: -10 },
    message: '⚡ You prioritized energy. More power, but your shielding dropped.',
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
