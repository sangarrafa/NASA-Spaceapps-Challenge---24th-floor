import { ARCHETYPES } from './archetypes.js';

export class BadgeReveal {
  constructor({ onStartMission }) {
    this.onStartMission = onStartMission;

    this.avatarImg = document.getElementById('avatar-preview-img');
    this.badgeIcon = document.querySelector('#badge-reveal .badge-icon');
    this.badgeTitle = document.querySelector('#badge-reveal .badge-title');
    this.badgeTagline = document.querySelector('#badge-reveal .badge-tagline');
    this.badgeDescription = document.querySelector('#badge-reveal .badge-description');
    this.startButton = document.getElementById('start-mission');

    this.startButton.addEventListener('click', () => this.onStartMission());
  }

  show(profile) {
    const archetype = ARCHETYPES[profile.archetype];

    this.avatarImg.src = archetype.portrait;

    this.badgeIcon.textContent = archetype.icon;
    this.badgeTitle.textContent = `${profile.name} the ${archetype.title}`;
    this.badgeTitle.style.color = archetype.color;
    this.badgeTagline.textContent = archetype.tagline;
    this.badgeDescription.textContent = archetype.description;
  }
}
