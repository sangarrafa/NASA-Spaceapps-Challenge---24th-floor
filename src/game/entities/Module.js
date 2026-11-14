export class Module {
  constructor(scene, { x, y, color, label, decisionId, bus }) {
    this.bus = bus;
    this.decisionId = decisionId;

    this.rect = scene.add.rectangle(x, y, 140, 100, color).setInteractive();
    this.text = scene.add.text(x, y, label, {
      fontSize: '14px',
      fontFamily: 'sans-serif',
      color: '#06121f',
      align: 'center',
    }).setOrigin(0.5);

    this.rect.on('pointerdown', () => {
      scene.tweens.add({ targets: this.rect, scale: 0.9, duration: 100, yoyo: true });
      this.bus.emit('decision:made', this.decisionId);
    });
  }
}
