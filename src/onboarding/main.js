import { AvatarBuilder } from './AvatarBuilder.js';
import { ArchetypeQuiz } from './ArchetypeQuiz.js';
import { BadgeReveal } from './BadgeReveal.js';
import { saveProfile } from '../core/profileStore.js';

const steps = {
  avatar: document.getElementById('step-avatar'),
  quiz: document.getElementById('step-quiz'),
  badge: document.getElementById('step-badge'),
};

function showStep(name) {
  Object.values(steps).forEach((el) => el.classList.remove('active'));
  steps[name].classList.add('active');
}

let profile = {};

new AvatarBuilder({
  onComplete: (avatar) => {
    profile = { ...profile, ...avatar };
    showStep('quiz');
    new ArchetypeQuiz({
      onComplete: (archetype) => {
        profile = { ...profile, archetype };
        saveProfile(profile);
        showStep('badge');
        badgeReveal.show(profile);
      },
    });
  },
});

const badgeReveal = new BadgeReveal({
  onStartMission: () => {
    window.location.href = 'game.html';
  },
});

showStep('avatar');
