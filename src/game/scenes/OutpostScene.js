import { Module } from '../entities/Module.js';

export class OutpostScene extends Phaser.Scene {
  constructor() {
    super('OutpostScene');
  }

  init(data) {
    this.bus = data.bus;
  }

  create() {
    this.add.text(20, 150, 'Space Base - Prototype', {
      fontSize: '16px',
      fontFamily: 'sans-serif',
      color: '#eaf0ff',
    });

    const shieldModule = new Module(this, {
      x: 200,
      y: 260,
      color: 0x33c6ff,
      label: 'Shielding\n(click)',
      decisionId: 'reinforceShielding',
      bus: this.bus,
    });

    this.bus.on('event:spaceWeather', () => shieldModule.flagAlert(this));

    new Module(this, {
      x: 440,
      y: 260,
      color: 0xffcc33,
      label: 'Energy\n(click)',
      decisionId: 'boostEnergy',
      bus: this.bus,
    });
  }
}
