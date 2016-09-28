import 'document-register-element'

class HelloWorld extends HTMLElement {
  show() {
    alert('Hello, world!');
  }
}

customElements.define('hello-world', HelloWorld);