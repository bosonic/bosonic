var GESTURE_FLAG = '__bosonicGestures';

var TRACK_DISTANCE = 10;

var GESTURES = {
    tap: {
        condition: function(state, event) {
            return event.type === 'pointerup' &&
                Math.abs(state.startX - event.clientX) < TRACK_DISTANCE &&
                Math.abs(state.startY - event.clientY) < TRACK_DISTANCE;
        }
    },

    hold: {
        setup: function(state) {
            var that = this;
            state.__timer = setTimeout(function() {
                that.fireCustomEvent('hold', state);
                that._removeDocumentListeners(state);
            }, 1000);
        },
        condition: function(state, event) {
            if (Math.abs(state.startX - event.clientX) >= TRACK_DISTANCE
                || Math.abs(state.startY - event.clientY) >= TRACK_DISTANCE) {
                clearTimeout(state.__timer);
            }
        },
        teardown: function(state) {
            clearTimeout(state.__timer);
        }
    },

    track: {
        condition: function(state, event) {
            var hasMovedEnough = Math.abs(state.startX - event.clientX) >= TRACK_DISTANCE
                              || Math.abs(state.startY - event.clientY) >= TRACK_DISTANCE;
            if (!hasMovedEnough) return;
            
            if (event.type === 'pointermove') {
                var x = event.clientX,
                    y = event.clientY;
                state.dx = x - state.startX;
                state.dy = y - state.startY;
                state.ddx = state.lastX ? x - state.lastX : 0;
                state.ddy = state.lastY ? y - state.lastY : 0;
                state.lastX = x;
                state.lastY = y;
                this.fireCustomEvent('track', state, event);
            } else if (event.type === 'pointerup') return true;
        }
    }
};

function isGestureEvent(eventName) {
    return GESTURES.hasOwnProperty(eventName);
}

Bosonic.Events = {
    __boundHandlers: {},

    created: function() {
        for (var eventName in this.listeners) {
            this.listen(this, eventName, this.listeners[eventName]);
        }
    },

    detached: function() {
        for (var eventName in this.listeners) {
            this.unlisten(this, eventName, this.listeners[eventName]);
        }
    },

    fire: function(type, detail, options) {
        detail = detail || {};
        options = options || {};
        var event = new CustomEvent(type, {
            bubbles: options.bubbles === false ? false : true,
            cancelable: options.cancelable === true ? true : false,
            detail: detail
        });
        var node = options.node || this;
        node.dispatchEvent(event);
        return event;
    },

    listen: function(node, eventName, methodName, useCapture) {
        if (isGestureEvent(eventName)) {
            this._listenToGesture(node, eventName, methodName);
        } else {
            if (useCapture !== true) useCapture = false;
            node.addEventListener(eventName, this._registerHandler(eventName, methodName), useCapture);
        }
    },

    unlisten: function(node, eventName, methodName, useCapture) {
        if (isGestureEvent(eventName) && node[GESTURE_FLAG] === true && this.__pointerdownHandler) {
            node.removeEventListener('pointerdown', this.__pointerdownHandler);
            delete node[GESTURE_FLAG];
        }
        if (useCapture !== true) useCapture = false;
        node.removeEventListener(eventName, this._getHandler(eventName, methodName), useCapture);
    },

    trackPointer: function(initialEvent, callbackName, stopCallbackName) {
        if (!this[callbackName]) {
            throw 'Event handler method `' + callbackName + '` is not defined';
        }
        if (stopCallbackName !== undefined && !this[stopCallbackName]) {
            throw 'Event handler method `' + stopCallbackName + '` is not defined';
        }
        var state = {
            startX: initialEvent.clientX,
            startY: initialEvent.clientY
        };
        this.__boundTrackingHandler = this._onTrackingPointerMove.bind(this, state, callbackName);
        this.__boundStopTrackingHandler = this._onTrackingPointerUp.bind(this, state, stopCallbackName);
        document.addEventListener('pointermove', this.__boundTrackingHandler);
        document.addEventListener('pointerup', this.__boundStopTrackingHandler);
    },

    _onTrackingPointerMove: function(state, callbackName, event) {
        var x = event.clientX,
            y = event.clientY;
        state.dx = x - state.startX;
        state.dy = y - state.startY;
        state.ddx = state.lastX ? x - state.lastX : 0;
        state.ddy = state.lastY ? y - state.lastY : 0;
        state.lastX = x;
        state.lastY = y;

        this[callbackName].call(this, state);
    },

    _onTrackingPointerUp: function(state, callbackName, event) {
        document.removeEventListener('pointermove', this.__boundTrackingHandler);
        document.removeEventListener('pointerup', this.__boundStopTrackingHandler);
        delete this.__boundTrackingHandler;
        delete this.__boundStopTrackingHandler;

        if (callbackName !== undefined) {
            this[callbackName].call(this, state);
        }
    },

    _registerHandler: function(eventName, methodName) {
        if (!this[methodName]) {
            throw 'Event handler method `' + methodName + '` is not defined';
        }
        var handler = this[methodName].bind(this);
        this.__boundHandlers[this._getHandlerKey(eventName, methodName)] = handler;
        return handler;
    },

    _getHandler: function(eventName, methodName) {
        return this.__boundHandlers[this._getHandlerKey(eventName, methodName)];
    },

    _getHandlerKey: function(eventName, methodName) {
        return eventName + ':' + methodName;
    },

    // GESTURES
    __documentEventsHandler: null,
    __pointerdownHandler: null,

    fireCustomEvent: function(gesture, state, originalEvent) {
        if (originalEvent) {
            state.originalEvent = originalEvent;
        }
        var ev = this.fire(gesture, state, {
            bubbles: true,
            cancelable: true,
            node: state.target
        });
        // preventDefault() forwarding
        if (ev.defaultPrevented) {
            if (originalEvent && originalEvent.preventDefault) {
                originalEvent.preventDefault();
                originalEvent.stopImmediatePropagation();
            }
        }
    },

    _listenToGesture: function(node, eventName, methodName) {
        if (node[GESTURE_FLAG] === undefined) {
            if (!this.__pointerdownHandler) {
                this.__pointerdownHandler = this._handlePointerdown.bind(this);
            }
            node.addEventListener('pointerdown', this.__pointerdownHandler);
            node[GESTURE_FLAG] = true;
        }

        node.addEventListener(eventName, this._registerHandler(eventName, methodName));
    },

    _handlePointerdown: function(event) {
        var state = {
            target: event.target,
            startX: event.clientX,
            startY: event.clientY
        };

        Object.keys(GESTURES).forEach(function(gesture) {
            var setup = GESTURES[gesture].setup;
            if (setup) {
                setup.call(this, state);
            }
        }, this);
        
        this._addDocumentListeners(state);
    },

    _handleDocumentEvent: function(state, event) {
        for (var gesture in GESTURES) {
            var condition = GESTURES[gesture].condition;
            if (condition && condition.call(this, state, event) === true) {
                this.fireCustomEvent(gesture, state, event);
                this._removeDocumentListeners(state);
                break;
            }
        }
    },

    _addDocumentListeners: function(state) {
        this.__documentEventsHandler = this._handleDocumentEvent.bind(this, state);
        document.addEventListener('pointermove', this.__documentEventsHandler);
        document.addEventListener('pointerup', this.__documentEventsHandler);
    },

    _removeDocumentListeners: function(state) {
        Object.keys(GESTURES).forEach(function(gesture) {
            var teardown = GESTURES[gesture].teardown;
            if (teardown) {
                teardown.call(this, state);
            }
        }, this);
        document.removeEventListener('pointermove', this.__documentEventsHandler);
        document.removeEventListener('pointerup', this.__documentEventsHandler);
    }
};