const TRANSITION_END = (() => {
    var el = document.createElement('div')
    return el.style.WebkitTransition !== undefined // Safari 6 & Android Browser < 4.3
        ? 'webkitTransitionEnd' : 'transitionend'
})()

export default class BosonicElement extends HTMLElement {
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