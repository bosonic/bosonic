var KEYS = {
    9: 'tab',
    13: 'enter',
    27: 'esc',
    33: 'pageup',
    34: 'pagedown',
    35: 'end',
    36: 'home',
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    46: 'del',
    106: '*'
};

var MODIFIER_KEYS = {
    'shift': 'shiftKey',
    'ctrl': 'ctrlKey',
    'alt': 'altKey',
    'meta': 'metaKey'
};

function getKeyCombos(bindings) {
    return bindings.split(' ').map(function(binding) {
        return getKeyCombo(binding);
    });
}

function getKeyCombo(binding) {
    var keys = binding.split('+').reverse(),
        key = keys[0],
        modifierKeys = {};
        modifiers = keys.slice(1);

    Object.keys(MODIFIER_KEYS).forEach(function(k) {
        modifierKeys[MODIFIER_KEYS[k]] = (modifiers.indexOf(k) !== -1)
    });
    return {
        key: key,
        modifiers: modifierKeys
    };
}

function combosMatchesEvent(combos, event) {
    return combos.some(function(combo) {
        return comboMatchesEvent(combo, event);
    });
}

function comboMatchesEvent(combo, event) {
    return KEYS[event.keyCode] && KEYS[event.keyCode] === combo.key && modifiersMatchesEvent(combo, event);
}

function modifiersMatchesEvent(combo, event) {
    return Object.keys(combo.modifiers).every(function(modifier) {
        return !!combo.modifiers[modifier] === !!event[modifier];
    });
}

Bosonic.Events = {
    __boundHandlers: {},
    __boundKeyHandlers: [],

    created: function() {
        for (var eventName in this.listeners) {
            this.listen(this, eventName, this.listeners[eventName]);
        }
        if (this.keyBindings) {
            this._setupKeyListeners();
        }
    },

    detached: function() {
        for (var eventName in this.listeners) {
            this.unlisten(this, eventName, this.listeners[eventName]);
        }
        if (this.keyBindings) {
            this._removeKeyListeners();
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

    listen: function(node, eventName, methodName) {
        node.addEventListener(eventName, this._registerHandler(eventName, methodName));
    },

    unlisten: function(node, eventName, methodName) {
        node.removeEventListener(eventName, this._getHandler(eventName, methodName));
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

    keyMatchesEvent: function(key, event) {
        return comboMatchesEvent(getKeyCombo(key), event);
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

    _setupKeyListeners: function() {
        for (var binding in this.keyBindings) {
            var handlerName = this.keyBindings[binding],
                combos = getKeyCombos(binding),
                boundHandler = this._keydownHandler.bind(this, combos, handlerName);

            this.__boundKeyHandlers.push(boundHandler);
            this.addEventListener('keydown', boundHandler);
        }
    },

    _removeKeyListeners: function() {
        this.__boundKeyHandlers.forEach(function(handler) {
            this.removeEventListener('keydown', handler);
        }, this);
    },
    
    _keydownHandler: function(keyCombos, handlerName, event) {
        if (!event.defaultPrevented && combosMatchesEvent(keyCombos, event)) {
            this[handlerName].call(this, event);
        }
    }
};