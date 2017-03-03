import 'document-register-element'

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

  connectedCallback() {
    this.clickOutside = this.clickOutside.bind(this)
    this.selectItem = this.selectItem.bind(this)
    this.toggle = this.toggle.bind(this)
    this.button = this.querySelector('button')
    this.menu = this.querySelector('b-listbox')
    this.button.addEventListener('click', this.toggle)
  }

  disconnectedCallback() {
    this.button.removeEventListener('click', this.toggle)
  }

  toggle() {
    this.open ? this.hide() : this.show()
  }

  show() {
    this.setAttribute('open', '')
    setTimeout(() => {
      document.addEventListener('click', this.clickOutside)
      this.menu.addEventListener('b-listbox-select', this.selectItem)
    }, 1)
  }

  hide() {
    this.removeAttribute('open')
    document.removeEventListener('click', this.clickOutside)
    this.menu.removeEventListener('b-listbox-select', this.selectItem)
  }

  clickOutside(e) {
    if (!isChildOf(e.target, this)) {
      this.hide()
    }
  }

  selectItem(e) {
    this.hide()
  }
}

customElements.define('b-menu-button', MenuButtonElement)
