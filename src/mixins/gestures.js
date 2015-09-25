var GESTURE_FLAG = '__bosonicGestures';

var GESTURES = {
    tap: {
        condition: function(start, event) {
            return event.type === 'pointerup' &&
                Math.abs(start.startX - event.clientX) < 10 &&
                Math.abs(start.startY - event.clientY) < 10;
        }
    }
};

function isGestureEvent(eventName) {
    return GESTURES.hasOwnProperty(eventName);
}

function addDocumentListeners(handler) {
    document.addEventListener('pointermove', handler);
    document.addEventListener('pointerup', handler);
}

function removeDocumentListeners(handler) {
    document.removeEventListener('pointermove', handler);
    document.removeEventListener('pointerup', handler);
}

Bosonic.Gestures = {
    __documentEventsHandler: null,
    __pointerdownHandler: null,

    // override Bosonic.Events listen()
    listen: function(node, eventName, methodName) {
        if (isGestureEvent(eventName)) {
            this._listenToGesture(node, eventName, methodName);
        } else {
            node.addEventListener(eventName, this._registerHandler(eventName, methodName));
        }
    },

    // override Bosonic.Events unlisten()
    unlisten: function(node, eventName, methodName) {
        if (isGestureEvent(eventName) && node[GESTURE_FLAG] === true && this.__pointerdownHandler) {
            node.addEventListener('pointerdown', this.__pointerdownHandler);
            delete node[GESTURE_FLAG];
        }
        node.removeEventListener(eventName, this._getHandler(eventName, methodName));
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
        var start = {
            startX: event.clientX,
            startY: event.clientY
        };

        this.__documentEventsHandler = this._handleDocumentEvent.bind(this, start);
        addDocumentListeners(this.__documentEventsHandler);
    },

    _handleDocumentEvent: function(startState, event) {
        Object.keys(GESTURES).forEach(function(gesture) {
            var condition = GESTURES[gesture].condition;
            if (condition.call(this, startState, event) === true) {
                this.fire(gesture, startState, {
                    bubbles: true,
                    cancelable: true
                });
            }
        }, this);

        if (event.type === 'pointerup') {
            removeDocumentListeners(this.__documentEventsHandler);
        }
    }
};