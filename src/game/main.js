import { bus } from '../core/EventBus.js';
import { GameState } from '../core/GameState.js';
import { RulesEngine } from '../core/RulesEngine.js';
import { fetchSpaceWeather } from '../data/nasaClient.js';
import { Dashboard } from '../ui/Dashboard.js';
import { EventLog } from '../ui/EventLog.js';
import { DataBadge } from '../ui/DataBadge.js';
import { BootScene } from './scenes/BootScene.js';
import { OutpostScene } from './scenes/OutpostScene.js';

const gameState = new GameState();
const rulesEngine = new RulesEngine(gameState, bus);

new Dashboard(bus);
new EventLog(bus);
const dataBadge = new DataBadge();

bus.emit('state:updated', gameState.resources);

bus.on('decision:made', (decisionId) => rulesEngine.applyDecision(decisionId));

fetchSpaceWeather().then((weather) => dataBadge.show(weather));

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 640,
  height: 400,
  backgroundColor: '#11162b',
  parent: 'game-container',
  scene: [BootScene, OutpostScene],
});

game.scene.start('BootScene', { bus });
