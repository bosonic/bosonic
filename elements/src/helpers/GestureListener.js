const GESTURES_FLAG = '__bosonicGestures'
const TAP_TRESHOLD = 10
const TRACK_TRESHOLD = 10
const SAMPLE_INTERVAL = 25

const STATE_POSSIBLE = 'possible'
const STATE_STARTED = 'start'
const STATE_CHANGED = 'track'
const STATE_ENDED = 'end'
const STATE_RECOGNIZED = STATE_ENDED
const STATE_FAILED = 'fail'
const STATE_CANCELLED = 'cancel'

const DIRECTION_NONE = 'none'
const DIRECTION_LEFT = 'left'
const DIRECTION_RIGHT = 'right'
const DIRECTION_UP = 'up'
const DIRECTION_DOWN = 'down'

const inherit = (base, properties) => {
  var child = Object.create(base)
  Object.keys(properties).forEach(function(k) {
    child[k] = properties[k]
  })
  return child
}

const Recognizer = {
  init(name, manager) {
    this.state = 'possible'
    this.name = name
    this.manager = manager
  },
  transitionTo(newState, optionalDetail) {
    this.state = newState
    optionalDetail = optionalDetail || {}
    optionalDetail.state = newState
    if (this.shouldFire(newState)) this.manager.tryFire(this.name, optionalDetail)
  },
  shouldFire(newState) {
    return [STATE_RECOGNIZED, STATE_STARTED, STATE_CHANGED, STATE_ENDED].indexOf(newState) !== -1
  }
}

const TrackRecognizer = inherit(Recognizer, {
  maxPointers: 1,
  down(pointers) {
    pointers.ids.length === this.maxPointers ? this.transitionTo(STATE_STARTED) : this.transitionTo(STATE_FAILED)
  },
  move(pointers) {
    if (this.state === STATE_STARTED || this.state === STATE_CHANGED) this.transitionTo(STATE_CHANGED, processDelta(pointers))
  },
  up(pointers) {
    if (this.state === STATE_CHANGED) {
      var detail = processDisplacement(pointers)
      this.transitionTo(STATE_ENDED, detail)
    } else this.transitionTo(STATE_FAILED)
  }
})

const SwipeRecognizer = inherit(Recognizer, {
  maxPointers: 1,
  minDistance: 10,
  minVelocity: 0.3,
  down(pointers) {
    pointers.ids.length === this.maxPointers ? this.transitionTo(STATE_POSSIBLE) : this.transitionTo(STATE_FAILED)
  },
  move(pointers) {},
  up(pointers) {
    var detail = processDisplacement(pointers)
    if (this.state !== STATE_FAILED && (this.direction && detail.direction === this.direction || detail.direction !== DIRECTION_NONE)
    && detail.distance > this.minDistance && detail.velocity > this.minVelocity) this.transitionTo(STATE_RECOGNIZED, detail)
    else this.transitionTo(STATE_FAILED)
  }
})
const SwipeLeftRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_LEFT })
const SwipeRightRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_RIGHT })
const SwipeUpRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_UP })
const SwipeDownRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_DOWN })

const PanRecognizer = inherit(Recognizer, {
  maxPointers: 1,
  minDistance: 10,
  down(pointers) {
    pointers.ids.length === this.maxPointers ? this.transitionTo(STATE_POSSIBLE) : this.transitionTo(STATE_FAILED)
  },
  move(pointers) {
    var detail = processDisplacement(pointers)
    if (this.state === STATE_POSSIBLE && detail.distance > this.minDistance) this.transitionTo(STATE_STARTED, detail)
    else if (this.state === STATE_STARTED || this.state === STATE_CHANGED) this.transitionTo(STATE_CHANGED, detail)
  },
  up(pointers) {
    if (this.state === STATE_CHANGED) {
      var detail = processDisplacement(pointers)
      this.transitionTo(STATE_ENDED, detail)
    } else this.transitionTo(STATE_FAILED)
  }
})
const PanLeftRecognizer = inherit(PanRecognizer, { direction: DIRECTION_LEFT })
const PanRightRecognizer = inherit(PanRecognizer, { direction: DIRECTION_RIGHT })
const PanUpRecognizer = inherit(PanRecognizer, { direction: DIRECTION_UP })
const PanDownRecognizer = inherit(PanRecognizer, { direction: DIRECTION_DOWN })

const RECOGNIZERS = {
  track: TrackRecognizer,
  pan: PanRecognizer,
  panLeft: PanLeftRecognizer,
  panRight: PanRightRecognizer,
  panUp: PanUpRecognizer,
  panDown: PanDownRecognizer,
  swipe: SwipeRecognizer,
  swipeLeft: SwipeLeftRecognizer,
  swipeRight: SwipeRightRecognizer,
  swipeUp: SwipeUpRecognizer,
  swipeDown: SwipeDownRecognizer
}

export default class GestureListener {
  constructor(node, handlers) {
    this.node = node
    this.recognizers = {}
    this.handlers = handlers
    this.resetPointers()

    var self = this
    this.mainHandler = function(e) {
        self.handleEvent(e)
    }

    for (var gesture in handlers) {
      if (!RECOGNIZERS[gesture]) return
      node.addEventListener(gesture, handlers[gesture])
      this.listen(gesture)
    }

    this.setup()
  }

  dispose() {
    for (var gesture in this.handlers) {
      if (!RECOGNIZERS[gesture]) return
      this.node.removeEventListener(gesture, this.handlers[gesture])
      this.unlisten(gesture)
    }

    this.teardown()
  }

  setup() {
    // TODO: handle pointerout & pointercancel
    this.node.setAttribute('touch-action', 'none') // this is needed by the PE polyfill
    this.node.addEventListener('pointerdown', this.mainHandler)
    document.addEventListener('pointermove', this.mainHandler)
    document.addEventListener('pointerup', this.mainHandler)
  }

  teardown() {
    this.node.removeAttribute('touch-action', 'none')
    this.node.removeEventListener('pointerdown', this.mainHandler)
    document.removeEventListener('pointermove', this.mainHandler)
    document.removeEventListener('pointerup', this.mainHandler)
  }

  listen(gestureName) {
    var recognizer = Object.create(RECOGNIZERS[gestureName])
    recognizer.init(gestureName, this)
    this.recognizers[gestureName] = recognizer
  }

  unlisten(gestureName) {
    delete this.recognizers[gestureName]
  }

  handleEvent(e) {
    this.updatePointers(e)

    // This is either a hover or the user uses more than 2 fingers
    if (!this.pointers.changed) return

    this.recognize()
    this.persistLastEvent()
  }

  persistLastEvent() {
    this.pointers.lastEvents[this.pointers.changedIndex] = this.pointers.changed

    this.pointers.changed = null
    this.pointers.changedIndex = null
  }

  updatePointers(e) {
    var pointerIndex

    e.ts = Date.now()

    if (e.type === 'pointerdown' && (e.button === 0 || e.pointerType !== 'mouse')) {
      var pointerCount = this.pointers.ids.length
      if (pointerCount === 0) {
        // it is the first event of a new sequence...
        this.resetPointers()
      } else if (pointerCount === 2) {
        // more than 2 pointers is probably a user's mistake, ignore it
        return
      }
      // store the new pointer
      var pointerIndex = this.pointers.ids.push(e.pointerId) - 1
      this.pointers.firstEvents.push(e)
    } else if (e.type === 'pointerup' || e.type === 'pointermove') {
      var pointerIndex = this.pointers.ids.indexOf(e.pointerId)
      if (pointerIndex < 0) {
        // it's a pointer we don't track
        return
      }
      if (e.type === 'pointerup') this.pointers.ids.splice(pointerIndex, 1)
    }

    this.pointers.changed = e
    this.pointers.changedIndex = pointerIndex
  }

  recognize() {
    Object.keys(this.recognizers).forEach(function(gestureName) {
      var recognizer = this.recognizers[gestureName]

      switch(this.pointers.changed.type) {
        case 'pointerdown':
        recognizer.down(this.pointers)
        break
        case 'pointermove':
        recognizer.move(this.pointers)
        break
        case 'pointerup':
        recognizer.up(this.pointers)
        break
      }
    }, this)
  }

  resetPointers() {
    this.pointers = {
      ids: [],
      firstEvents: [],
      lastEvents: []
    }
  }

  tryFire(gesture, optionalDetail) {
    var detail = optionalDetail || {}
    this.fire(this.node, gesture, detail, this.pointers.changed)
  }

  fire(node, gesture, detail, originalEvent) {
    if (originalEvent) {
      detail.originalEvent = originalEvent
    }
    var ev = new CustomEvent(gesture, {
      bubbles: true,
      cancelable: true,
      node: node,
      detail: detail
    })
    node.dispatchEvent(ev)
    // preventDefault() forwarding
    if (ev.defaultPrevented) {
      if (originalEvent && originalEvent.preventDefault) {
        originalEvent.preventDefault()
        originalEvent.stopImmediatePropagation()
      }
    }
  }
}

function processDelta(pointers) {
    var changed = pointers.changed,
        first = pointers.firstEvents[pointers.changedIndex],
        last = pointers.lastEvents[pointers.changedIndex]

    return {
        dx: changed.clientX - first.clientX,
        dy: changed.clientY - first.clientY,
        dts: changed.ts - first.ts,
        ddx: changed.clientX - last.clientX,
        ddy: changed.clientY - last.clientY,
        ddts: changed.ts - last.ts
    }
}

// TODO: processInstantDisplacement (with SAMPLE_INTERVAL) so that we return "instant" velocity for pan gesture
function processDisplacement(pointers) {
    var delta = processDelta(pointers),
        dx = delta.dx,
        dy = delta.dy,
        velx = delta.velx = Math.abs(dx) / delta.dts,
        vely = delta.vely = Math.abs(dy) / delta.dts,
        direction = delta.direction = getDirection(dx, dy)

    delta.distance = getDistance(dx, dy, direction)
    delta.velocity = getOverallVelocity(velx, vely, direction)

    return delta
}

function getDirection(dx, dy) {
    if (dx === dy) return DIRECTION_NONE

    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT
    }
    return dy < 0 ? DIRECTION_UP : DIRECTION_DOWN
}

function getDistance(dx, dy, direction) {
    return (direction === DIRECTION_LEFT || direction === DIRECTION_RIGHT) ? Math.abs(dx) : Math.abs(dy)
}

function getOverallVelocity(velx, vely, direction) {
    return (direction === DIRECTION_LEFT || direction === DIRECTION_RIGHT) ? velx : vely
}
