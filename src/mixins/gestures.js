var GESTURES_FLAG = '__bosonicGestures',
    TAP_TRESHOLD = 10,
    TRACK_TRESHOLD = 10,
    SAMPLE_INTERVAL = 25;

var STATE_POSSIBLE = 'possible',
    STATE_STARTED = 'start',
    STATE_CHANGED = 'track',
    STATE_ENDED = 'end',
    STATE_RECOGNIZED = STATE_ENDED,
    STATE_FAILED = 'fail',
    STATE_CANCELLED = 'cancel';

var DIRECTION_NONE = 'none',
    DIRECTION_LEFT = 'left',
    DIRECTION_RIGHT = 'right',
    DIRECTION_UP = 'up',
    DIRECTION_DOWN = 'down';

function inherit(base, properties) {
    var child = Object.create(base);
    Object.keys(properties).forEach(function(k) {
        child[k] = properties[k];
    });
    return child;
}

var Recognizer = {
    init: function() {
        this.state = 'possible';
    },
    transitionTo: function(state) {
        this.state = state;
    }
};

var SwipeRecognizer = inherit(Recognizer, {
    maxPointers: 1,
    minDistance: 10,
    minVelocity: 0.3,
    down: function(detail) {
        this.state = detail.pointers === this.maxPointers ? STATE_POSSIBLE : STATE_FAILED;
    },
    move: function(detail) {
        if (detail.pointers !== this.maxPointers) return;
        if (this.state !== STATE_RECOGNIZED && (this.direction && detail.direction === this.direction || detail.direction !== DIRECTION_NONE)
            && detail.distance > this.minDistance && detail.velocity > this.minVelocity) this.state = STATE_RECOGNIZED;
    },
    up: function(detail) {
        if (this.state !== STATE_RECOGNIZED) this.state = STATE_FAILED;
    }
});
var SwipeLeftRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_LEFT }),
    SwipeRightRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_RIGHT }),
    SwipeUpRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_UP }),
    SwipeDownRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_DOWN });

Bosonic.Gestures = {
    recognizers: {
        swipe: SwipeRecognizer,
        swipeLeft: SwipeLeftRecognizer,
        swipeRight: SwipeRightRecognizer,
        swipeUp: SwipeUpRecognizer,
        swipeDown: SwipeDownRecognizer
    },

    // Events mixin method override
    _listen: function(node, eventName, handler) {
        if (this.recognizers[eventName]) {
            this.setupGesture(node, eventName);
        }
        node.addEventListener(eventName, handler);
    },

    // Events mixin method override
    _unlisten: function(node, eventName, handler) {
        if (this.recognizers[eventName]) {
            this.teardownGesture(node, eventName);
        }
        node.removeEventListener(eventName, handler);
    },

    setupGesture: function(node, gestureName) {
        if (!node[GESTURES_FLAG]) {
            node[GESTURES_FLAG] = new GesturesManager(node);
        }
        node[GESTURES_FLAG].listen(gestureName);
    },

    teardownGesture: function(node, gestureName) {
        var manager = node[GESTURES_FLAG];
        manager.unlisten(gestureName);
    }
};

function GesturesManager(node) {
    this.node = node;
    this.recognizers = {};
    this.resetSequence();

    var self = this;
    this.mainHandler = function(e) {
        self.process(e);
    }

    this.setup();
}

GesturesManager.prototype = {
    setup: function() {
        // TODO: handle pointerout & pointercancel
        this.node.addEventListener('pointerdown', this.mainHandler);
        document.addEventListener('pointermove', this.mainHandler);
        document.addEventListener('pointerup', this.mainHandler);
    },

    teardown: function() {
        this.node.removeEventListener('pointerdown', this.mainHandler);
        document.removeEventListener('pointermove', this.mainHandler);
        document.removeEventListener('pointerup', this.mainHandler);
    },

    listen: function(gestureName) {
        var recognizer = Object.create(Bosonic.Gestures.recognizers[gestureName]);
        this.recognizers[gestureName] = recognizer;
    },

    unlisten: function(gestureName) {
        delete this.recognizers[gestureName];
    },

    process: function(e) {
        var isFirst = false,
            isFirstMulti = false, // first event for the second pointer of a multi-touch gesture
            willRemovePointer = false;

        var pointerIndex = this.sequence.pointerIds.indexOf(e.pointerId),
            pointerCount = this.sequence.pointerIds.length;

        if (e.type === 'pointerdown' && (e.button === 0 || e.pointerType !== 'mouse')) {
            if (pointerIndex < 0) {
                if (pointerCount === 0) {
                    // it is the first event of a new sequence...
                    this.resetSequence();
                    isFirst = true;
                } else if (pointerCount === 1) {
                    isFirstMulti = true;
                } else if (pointerCount === 1){
                    // more than 2 pointers is probably a user's mistake, ignore it
                    return;
                }
                // store the pointer
                this.sequence.pointerIds.push(e.pointerId);
                this.sequence.pointers.push(e);
                pointerCount++;
            } else {
                this.sequence.pointers[pointerIndex] = e;
            }
        } else if (e.type === 'pointerup') {
            willRemovePointer = true;
        }

        if (pointerCount === 0) return;

        var detail = this.processEventDetail(e, this.sequence);
        this.processSampleData(e, detail, this.sequence);

        if (isFirst) this.sequence.firstDetail = detail;
        if (isFirstMulti) this.sequence.firstMultiDetail = detail;
        this.sequence.lastDetail = detail;

        if (willRemovePointer) {
            this.sequence.pointerIds.splice(pointerIndex, 1);
            this.sequence.pointers.splice(pointerIndex, 1);
        }

        // 
        document.getElementById('log').innerHTML = 
        'type: '+e.type
        +'<br>dts: '+detail.dts
        +'<br>dx: '+detail.dx+'<br>dy: '+detail.dy
        +'<br>velx: '+detail.velx+'<br>vely: '+detail.vely
        +'<br>dir: '+detail.direction
        +'<br>dist: '+detail.distance
        +'<br>vel: '+detail.velocity;

        this.recognize(e, detail);
    },

    recognize: function(e, detail) {
        Object.keys(this.recognizers).forEach(function(gestureName) {
            var recognizer = this.recognizers[gestureName],
                previousState = recognizer.state;
            
            switch(e.type) {
                case 'pointerdown':
                    recognizer.down(detail);
                    break;
                case 'pointermove':
                    recognizer.move(detail);
                    break;
                case 'pointerup':
                    recognizer.up(detail);
                    break;
            }
            if (previousState !== STATE_RECOGNIZED && recognizer.state === STATE_RECOGNIZED) {
                this.fire(this.node, gestureName, detail, e);
            }
        }, this);
    },

    resetSequence: function(e) {
        this.sequence = {
            pointerIds: [],
            pointers: []
        };
    },

    fire: function(node, gesture, detail, originalEvent) {
        if (originalEvent) {
            detail.originalEvent = originalEvent;
        }
        var ev = Bosonic.Events.fire(gesture, detail, {
            bubbles: true,
            cancelable: true,
            node: node
        });
        // preventDefault() forwarding
        if (ev.defaultPrevented) {
            if (originalEvent && originalEvent.preventDefault) {
                originalEvent.preventDefault();
                originalEvent.stopImmediatePropagation();
            }
        }
    },

    processEventDetail: function(e, sequence) {
        var firstDetail = sequence.firstDetail,
            lastDetail = sequence.lastDetail;

        var detail = {
            pointers: sequence.pointers.length,
            ts: Date.now(),
            dts: 0,
            ddts: 0,
            x: e.clientX,
            y: e.clientY,
            dx: 0,
            dy: 0,
            ddx: 0,
            ddy: 0
        };
        if (firstDetail) {
            detail.dts = detail.ts - firstDetail.ts;
            detail.dx = detail.x - firstDetail.x;
            detail.dy = detail.y - firstDetail.y;
        }
        if (lastDetail) {
            detail.ddts = detail.ts - lastDetail.ts;
            detail.ddx = detail.x - lastDetail.x;
            detail.ddy = detail.y - lastDetail.y;
        }
        return detail;
    },

    processSampleData: function(e, detail, sequence) {
        var last = sequence.lastSample;

        var dx = last ? detail.dx - last.dx : detail.dx,
            dy = last ? detail.dy - last.dy : detail.dy,
            dts = last ? (detail.dts - last.dts) : detail.dts;

        if (!last || dts > SAMPLE_INTERVAL) {
            detail.velx = Math.abs(dx) / dts;
            detail.vely = Math.abs(dy) / dts;
            detail.direction = getDirection(dx, dy);

            sequence.lastSample = detail;
        } else {
            detail.velx = last.velx;
            detail.vely = last.vely;
            detail.direction = last.direction;
        }

        detail.distance = getDistance(dx, dy, detail.direction);
        detail.velocity = getOverallVelocity(detail.velx, detail.vely, detail.direction)
    }
};

function getDirection(x, y) {
    if (x === y) return DIRECTION_NONE;

    if (Math.abs(x) >= Math.abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

function getDistance(dx, dy, direction) {
    return (direction === DIRECTION_LEFT || direction === DIRECTION_RIGHT) ? Math.abs(dx) : Math.abs(dy);
}

function getOverallVelocity(velx, vely, direction) {
    return (direction === DIRECTION_LEFT || direction === DIRECTION_RIGHT) ? velx : vely;
}

