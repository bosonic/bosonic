import 'document-register-element'
import BosonicElement from './b-base'

export default class ControlGroupElement extends BosonicElement {

  connectedCallback() {
    this.setAttribute('role', 'group')
    if (this.isWrappingInputs()) {
      this.addEventListener('pointerup', this.onTap.bind(this));
      this.addEventListener('click', this.onClick.bind(this));
      this.activateLabels();
    }
  }

  onTap(event) {
    // the target must be a label. If not, the user probably didn't read the instructions...
    var label = event.target,
    input = label.querySelector('input');
    if (input.type === 'radio' && input.checked !== true) {
      input.checked = true;
      var active = this.querySelector('.active');
      if (active) {
        active.classList.remove('active');
        active.querySelector('input').checked = false;
      }
      label.classList.add('active');
    } else if (input.type === 'checkbox') {
      input.checked = !input.checked;
      this.toggleClass('active', input.checked, label);
    }
    return false;
  }

  // sadly, we must prevent click events. For a reason unknown, calling
  // preventDefault() in the onTap method doesn't work, even with preventDefault forwarding
  // feature added to gestures mixin...
  onClick(event) {
    event.preventDefault();
  }

  activateLabels() {
    [].forEach.call(this.querySelectorAll('label'), function(label) {
      var input = label.querySelector('input');
      if (input && input.checked === true) {
        label.classList.add('active');
      }
    });
  }

  isWrappingInputs() {
    return this.querySelectorAll('input[type=checkbox], input[type=radio]').length !== 0;
  }
}

customElements.define('b-controlgroup', ControlGroupElement)
