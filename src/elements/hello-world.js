import 'document-register-element'

export default class HelloWorldElement extends HTMLElement {
  set visible(val) {
    this.textContent = val ? 'Hello, world!' : ''
  }

  show() {
    this.visible = true
  }

  hide() {
    this.visible = false
  }
}

customElements.define('hello-world', HelloWorldElement)