import 'document-register-element'
import 'pepjs'

function isChildOf(node, possibleParent) {
  var isChildren = false
  while (node && !isChildren) {
    isChildren = node === possibleParent
    node = node.parentNode
  }
  return isChildren
}

export default class MenuButtonElement extends HTMLElement {
  get open() {
    return this.hasAttribute('open')
  }

  get menu() {
    return this.querySelector('b-listbox')
  }

  get button() {
    return this.querySelector('button')
  }

  connectedCallback() {
    this.tapOutside = this.tapOutside.bind(this)
    this.button.addEventListener('pointerup', this.toggle.bind(this))
  }

  toggle() {console.log(this)
    this.open ? this.hide() : this.show()
  }

  show() {
    this.setAttribute('open', '')
    setTimeout(() => {
      document.addEventListener('pointerup', this.tapOutside)
    }, 1)
  }

  hide() {
    this.removeAttribute('open')
    document.removeEventListener('pointerup', this.tapOutside)
  }

  tapOutside(e) {
    if (!isChildOf(e.target, this)) {
      this.hide()
    }
  }
}

customElements.define('b-menu-button', MenuButtonElement)