export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  init(data) {
    this.bus = data.bus;
  }

  preload() {
    // Aquí se cargarán los sprites de Kenney/NASA cuando los tengamos.
  }

  create() {
    this.scene.start('OutpostScene', { bus: this.bus });
  }
}
