import { bus } from '../core/EventBus.js';
import { GameState } from '../core/GameState.js';
import { RulesEngine } from '../core/RulesEngine.js';
import { fetchCMEs } from '../data/nasaClient.js';
import { loadProfile } from '../core/profileStore.js';
import { ARCHETYPES } from '../onboarding/archetypes.js';
import { Dashboard } from '../ui/Dashboard.js';
import { EventLog } from '../ui/EventLog.js';
import { DataBadge } from '../ui/DataBadge.js';
import { BootScene } from './scenes/BootScene.js';
import { OutpostScene } from './scenes/OutpostScene.js';

const profile = loadProfile();
if (!profile) {
  window.location.href = 'index.html';
}

const crewBadge = document.getElementById('crew-badge');
const archetype = ARCHETYPES[profile.archetype];
crewBadge.textContent = `${profile.helmetIcon} ${profile.name} the ${archetype.title} ${archetype.icon}`;
crewBadge.style.color = profile.suitColor;

const gameState = new GameState();
const rulesEngine = new RulesEngine(gameState, bus);

new Dashboard(bus);
new EventLog(bus);
const dataBadge = new DataBadge();

bus.emit('state:updated', gameState.resources);

bus.on('decision:made', (decisionId) => rulesEngine.applyDecision(decisionId));

fetchCMEs().then((weather) => {
  dataBadge.show(weather);

  const latest = weather.events[weather.events.length - 1];
  if (latest) {
    bus.emit('event:spaceWeather', latest);
    bus.emit(
      'log:message',
      `☀️ Real NASA data: a coronal mass ejection (CME) was detected on ${latest.startTime.slice(0, 10)}. Reinforce shielding, or risk it for the energy?`
    );
  }
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 640,
  height: 400,
  backgroundColor: '#11162b',
  parent: 'game-container',
  scene: [BootScene, OutpostScene],
});

game.scene.start('BootScene', { bus });
