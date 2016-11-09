const TRANSITION_END = (() => {
    var el = document.createElement('div')
    return el.style.WebkitTransition !== undefined // Safari 6 & Android Browser < 4.3
        ? 'webkitTransitionEnd' : 'transitionend'
})()

export default class BosonicElement extends HTMLElement {
  // constructor hack needed by document-register-element
  constructor(_) { return (_ = super(_)).init(), _ }
  init() {}

  toggleClass(name, bool, node) {
    node = node || this
    if (arguments.length == 1) {
      bool = !node.classList.contains(name)
    }
    bool ? node.classList.add(name) : node.classList.remove(name)
  }

  toggleAttribute(name, bool, node) {
    node = node || this
    if (arguments.length == 1) {
      bool = !node.hasAttribute(name)
    }
    bool ? node.setAttribute(name, '') : node.removeAttribute(name)
  }

  // for ARIA state properties
  toggleStateAttribute(name, bool, node) {
    node = node || this
    if (arguments.length == 1) {
      bool = !node.hasAttribute(name) || node.getAttribute(name) == 'false'
    }
    bool ? node.setAttribute(name, 'true') : node.setAttribute(name, 'false')
  }

  reflectAttributes(attrs) {
    attrs.forEach(a => {
      if (this.hasCustomAttribute(a)) this[a] = this.getCustomAttribute(a)
    }, this)
  }

  getCustomAttribute(name) {
    return this.getAttribute(this._getRealAttribute(name))
  }

  hasCustomAttribute(name) {
    return this.hasAttribute(name) || this._hasPrefixedAttribute(name)
  }

  _hasPrefixedAttribute(name) {
    return this.hasAttribute('data-' + name)
  }

  _getRealAttribute(name) {
    return this._hasPrefixedAttribute(name) ? 'data-' + name : name
  }

  async(callback, time) {
    var host = this
    return setTimeout(function() {
      callback.call(host)
    }, time)
  }

  cancelAsync(handle) {
    clearTimeout(handle)
  }

  fire(type, detail, options) {
    detail = detail || {}
    options = options || {}
    var event = new CustomEvent(type, {
      bubbles: options.bubbles === false ? false : true,
      cancelable: options.cancelable === true ? true : false,
      detail: detail
    })
    var node = options.node || this
    node.dispatchEvent(event)
    return event
  }

  listenOnce(node, eventName, fn, args) {
    var host = this,
    handler = () => {
      fn.apply(host, args)
      node.removeEventListener(eventName, handler, false)
    }
    node.addEventListener(eventName, handler, false)
  }

  transition(node, beforeFn, afterFn) {
    var host = this,
    afterHandler = () => { afterFn.call(host, node) }

    this.listenOnce(node, TRANSITION_END, afterHandler)
    beforeFn.call(host, node)
  }
}