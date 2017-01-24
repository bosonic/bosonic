import 'document-register-element'
import BosonicElement from './b-base'

var KEY = {
  ENTER: 13,
  ESC: 27,
  TAB: 9
}

var focusableElementsSelector ="a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]"

export default class DialogElement extends BosonicElement {
  set opened(val) {
    val === true ? this.show() : this.hide()
  }

  connectedCallback() {
    this.tabIndex = -1
    this.setAttribute('role', 'dialog')
    this.setAttribute('aria-hidden', 'true')
    if (this.hasAttribute('opened')) this.opened = true
  }

  show() {
    this.setAttribute('visible', '')
    this.setAttribute('aria-hidden', 'false')
    this.keydownListener = this.onKeydown.bind(this)
    document.addEventListener('keydown', this.keydownListener, false)
    this.clickListener = this.onDialogClick.bind(this)
    this.addEventListener('click', this.clickListener)
    this.grabFocus()
    this.preventBackgroundScrolling()
    if (this.overlay) {
      this.overlay.setAttribute('opened', '')
    }
  }

  showModal() {
    this.appendOverlay()
    this.show()
  }

  appendOverlay() {
    this.overlay = document.createElement('div')
    this.overlay.classList.add('b-overlay')
    this.parentNode.appendChild(this.overlay)
  }

  grabFocus() {
    this.previouslyFocusedElement = document.querySelector(':focus')
    var autofocusable = this.querySelector('[autofocus]'),
        firstFocusableElement = this.getFirstFocusableElement()
    if (autofocusable) {
      autofocusable.focus()
    } else if (firstFocusableElement) {
      firstFocusableElement.focus()
    } else {
      this.focus()
    }
  }

  releaseFocus() {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
  }

  trapFocus(e) {
    var focusableElements = this.getFocusableElements(),
    currentlyFocused = this.querySelector(':focus'),
    currentlyFocusedIndex = Array.prototype.indexOf.call(focusableElements, currentlyFocused),
    lastFocusableElementIndex = focusableElements.length - 1

    if (e.shiftKey && currentlyFocusedIndex === 0) {
      focusableElements.item(lastFocusableElementIndex).focus()
      e.preventDefault()
    } else if (!e.shiftKey && currentlyFocusedIndex === lastFocusableElementIndex) {
      focusableElements.item(0).focus()
      e.preventDefault()
    }
  }

  getFocusableElements(container) {
    container = container || this
    return container.querySelectorAll(focusableElementsSelector)
  }

  getFirstFocusableElement(container) {
    container = container || this
    return container.querySelector(focusableElementsSelector)
  }

  onKeydown(e) {
    switch(e.which) {
      case KEY.ESC: {
        this.cancel()
        break
      }
      case KEY.TAB: {
        this.trapFocus(e)
        break
      }
      default:
      return
    }
  }

  onDialogClick(e) {
    var target = e.target
    while (target && target !== this) {
      if (target.hasAttribute && (target.hasAttribute('data-dialog-dismiss') || target.hasAttribute('dialog-dismiss'))) {
        this.close()
      }
      target = target.parentNode
    }
  }

  hide() {
    this.releaseFocus()
    this.removeAttribute('visible')
    this.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = 'auto'
    if (this.overlay) {
      this.transition(this.overlay, function(overlay) {
        overlay.removeAttribute('opened')
      }, function(overlay) {
        overlay.parentNode.removeChild(overlay)
      })
      this.overlay = null
    }
    this.restoreBackgroundScrolling()
    document.removeEventListener('keydown', this.keydownListener, false)
    this.removeEventListener('click', this.clickListener)
    this.dispatchEvent(new CustomEvent('b-dialog-close'))
  }

  close() {
    this.hide()
  }

  open() {
    this.show()
  }

  cancel() {
    var doCancel = this.dispatchEvent(new CustomEvent('b-dialog-cancel', { cancelable: true }))
    if (doCancel) {
      this.hide()
    }
  }

  preventBackgroundScrolling() {
    this._originalBodyPad = parseInt(document.body.style.paddingRight.replace('px', '') || 0)
    var isBodyOverflowing = document.body.clientWidth < window.innerWidth
    if (isBodyOverflowing) {
      this._scrollbarWidth = this.measureScrollbar()
      document.body.style.paddingRight = (this._originalBodyPad + this._scrollbarWidth) + 'px'
      document.body.style.overflow = 'hidden'
    }
  }

  restoreBackgroundScrolling() {
    document.body.style.paddingRight = this._originalBodyPad + 'px'
    document.body.style.overflow = 'auto'
  }

  // Credits to David Walsh: https://davidwalsh.name/detect-scrollbar-width
  measureScrollbar() {
    var scrollDiv = document.createElement("div")
    scrollDiv.className = "b-scrollbar-measure"
    document.body.appendChild(scrollDiv)
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    document.body.removeChild(scrollDiv)
    return scrollbarWidth
  }
}

customElements.define('b-dialog', DialogElement)
