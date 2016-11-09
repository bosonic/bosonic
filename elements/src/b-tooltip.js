import 'document-register-element'
import 'pepjs'
import BosonicElement from './b-base'

const DEFAULT_SPACING = 5
const DEFAULT_POSITION = 'bottom'

export default class TooltipElement extends BosonicElement {
  
  get spacing() { return this._spacing || DEFAULT_SPACING }
  set spacing(val) { this._spacing = val }

  get position() { return this._position || DEFAULT_POSITION }
  set position(val) { this._position = val }

  get target() {
    return this.hasAttribute('for') 
    ? document.getElementById(this.getAttribute('for'))
    : this.parentNode
  }

  connectedCallback() {
    this.setAttribute('role', 'tooltip')
    this.setAttribute('tabindex', '-1')
    this.reflectAttributes(['spacing', 'position'])
    
    this.enterListener = this.onEnterTarget.bind(this)
    this.leaveListener = this.onLeaveTarget.bind(this)
    this.target.addEventListener('mouseenter', this.enterListener, false)
    this.target.addEventListener('focus', this.enterListener, false)
    this.target.addEventListener('mouseleave', this.leaveListener, false)
    this.target.addEventListener('blur', this.leaveListener, false)
  }

  applyPlacement() {
    var targetOffset = this.getOffset(this.target),
      targetRect = this.target.getBoundingClientRect(),
      tipRect = this.getBoundingClientRect()

    var centeringOffset = {
      width: (targetRect.width - tipRect.width) / 2,
      height: (targetRect.height - tipRect.height) / 2
    }

    switch(this.position) {
      // rounding some of the values are necessary for some browsers (FF, IE) so that there is no spacing between the
      // arrow and the inner div
      case 'left':
        this.style.top = targetOffset.top + centeringOffset.height + 'px'
        this.style.left = Math.round(targetOffset.left - this.offsetWidth - this.spacing) + 'px'
        break
      case 'right':
        this.style.top = targetOffset.top + centeringOffset.height + 'px'
        this.style.left = Math.round(targetOffset.left + this.target.offsetWidth + this.spacing) + 'px'
        break
      case 'top':
        this.style.top = Math.ceil(targetOffset.top - this.offsetHeight - this.spacing) + 'px'
        this.style.left = targetOffset.left + centeringOffset.width + 'px'
        break
      default:
        this.style.top = Math.floor(targetOffset.top + this.target.offsetHeight + this.spacing -1) + 'px' // yes, the -1 is a magic value... for FF
        this.style.left = targetOffset.left + centeringOffset.width + 'px'
    }
  }

  show() {
    this.setAttribute('visible', '')
    this.applyPlacement()
  }

  hide() {
    this.removeAttribute('visible')
  }

  onEnterTarget(evt) {
    this.show()
  }

  onLeaveTarget(evt) {
    this.hide()
  }

  // get the coordinates of the element relative to the document
  getOffset(elt) {
    var elt = elt || this,
    rect = elt.getBoundingClientRect()

    return {
      top: rect.top + window.pageYOffset - document.documentElement.clientTop,
      left: rect.left + window.pageXOffset - document.documentElement.clientLeft
    }
  }

  // get the coordinates of the element relative to the parent element
  getPosition(elt) {
    throw "Not implemented yet."
  }
}

customElements.define('b-tooltip', TooltipElement)