import { Module } from '../entities/Module.js';

export class OutpostScene extends Phaser.Scene {
  constructor() {
    super('OutpostScene');
  }

  init(data) {
    this.bus = data.bus;
  }

  create() {
    this.add.text(20, 150, 'Puesto Avanzado - Prototipo', {
      fontSize: '16px',
      fontFamily: 'sans-serif',
      color: '#eaf0ff',
    });

    new Module(this, {
      x: 200,
      y: 260,
      color: 0x33c6ff,
      label: 'Blindaje\n(clic)',
      decisionId: 'reinforceShielding',
      bus: this.bus,
    });

    new Module(this, {
      x: 440,
      y: 260,
      color: 0xffcc33,
      label: 'Energía\n(clic)',
      decisionId: 'boostEnergy',
      bus: this.bus,
    });
  }
}
