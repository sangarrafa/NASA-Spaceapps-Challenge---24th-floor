export class AvatarBuilder {
  constructor({ onComplete }) {
    this.onComplete = onComplete;

    this.nameInput = document.getElementById('avatar-name');
    this.continueButton = document.getElementById('avatar-continue');

    this.nameInput.addEventListener('input', () => this.updateContinueState());
    this.continueButton.addEventListener('click', () => this.complete());
    this.updateContinueState();
  }

  updateContinueState() {
    this.continueButton.disabled = this.nameInput.value.trim().length === 0;
  }

  complete() {
    this.onComplete({ name: this.nameInput.value.trim() });
  }
}
