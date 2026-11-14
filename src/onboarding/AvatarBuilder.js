const SUIT_COLORS = ['#33c6ff', '#ffcc33', '#7cf29c', '#ff6b6b', '#c58bff'];
const HELMET_ICONS = ['\u{1F9D1}‍\u{1F680}', '\u{1F916}', '\u{1F47D}', '\u{1F431}'];

export class AvatarBuilder {
  constructor({ onComplete }) {
    this.onComplete = onComplete;
    this.selectedColor = SUIT_COLORS[0];
    this.selectedIcon = HELMET_ICONS[0];

    this.nameInput = document.getElementById('avatar-name');
    this.colorContainer = document.getElementById('avatar-colors');
    this.iconContainer = document.getElementById('avatar-icons');
    this.continueButton = document.getElementById('avatar-continue');

    this.renderColors();
    this.renderIcons();

    this.nameInput.addEventListener('input', () => this.updateContinueState());
    this.continueButton.addEventListener('click', () => this.complete());
    this.updateContinueState();
  }

  renderColors() {
    this.colorContainer.innerHTML = '';
    SUIT_COLORS.forEach((color) => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch' + (color === this.selectedColor ? ' selected' : '');
      swatch.style.background = color;
      swatch.addEventListener('click', () => {
        this.selectedColor = color;
        this.renderColors();
      });
      this.colorContainer.appendChild(swatch);
    });
  }

  renderIcons() {
    this.iconContainer.innerHTML = '';
    HELMET_ICONS.forEach((icon) => {
      const option = document.createElement('div');
      option.className = 'icon-option' + (icon === this.selectedIcon ? ' selected' : '');
      option.textContent = icon;
      option.addEventListener('click', () => {
        this.selectedIcon = icon;
        this.renderIcons();
      });
      this.iconContainer.appendChild(option);
    });
  }

  updateContinueState() {
    this.continueButton.disabled = this.nameInput.value.trim().length === 0;
  }

  complete() {
    this.onComplete({
      name: this.nameInput.value.trim(),
      suitColor: this.selectedColor,
      helmetIcon: this.selectedIcon,
    });
  }
}
