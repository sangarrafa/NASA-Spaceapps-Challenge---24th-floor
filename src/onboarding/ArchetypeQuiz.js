import { QUIZ_QUESTIONS } from './quizQuestions.js';

const PRIORITY = ['achiever', 'explorer', 'socializer', 'challenger'];

export class ArchetypeQuiz {
  constructor({ onComplete }) {
    this.onComplete = onComplete;
    this.currentIndex = 0;
    this.scores = { achiever: 0, explorer: 0, socializer: 0, challenger: 0 };

    this.progressEl = document.getElementById('quiz-progress');
    this.promptEl = document.getElementById('quiz-prompt');
    this.optionsEl = document.getElementById('quiz-options');

    this.renderQuestion();
  }

  renderQuestion() {
    const question = QUIZ_QUESTIONS[this.currentIndex];
    this.progressEl.textContent = `Question ${this.currentIndex + 1} of ${QUIZ_QUESTIONS.length}`;
    this.promptEl.textContent = question.prompt;
    this.optionsEl.innerHTML = '';

    question.options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-option';
      button.textContent = option.text;
      button.addEventListener('click', () => this.answer(option.archetype));
      this.optionsEl.appendChild(button);
    });
  }

  answer(archetype) {
    this.scores[archetype] += 1;

    if (this.currentIndex < QUIZ_QUESTIONS.length - 1) {
      this.currentIndex += 1;
      this.renderQuestion();
    } else {
      this.onComplete(this.pickArchetype());
    }
  }

  pickArchetype() {
    return PRIORITY.reduce((best, id) =>
      this.scores[id] > this.scores[best] ? id : best, PRIORITY[0]);
  }
}
