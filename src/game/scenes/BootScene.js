export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  init(data) {
    this.bus = data.bus;
  }

  preload() {
    // Kenney/NASA sprites will be loaded here once we have them.
  }

  create() {
    this.scene.start('OutpostScene', { bus: this.bus });
  }
}
