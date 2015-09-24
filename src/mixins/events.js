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
    });
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
    __boundKeyListener: null,

    created: function() {
        for (var eventName in this.listeners) {
            this.listen(this, eventName, this.listeners[eventName]);
        }
        if (this.keyBindings) {
            this._setupKeyListener();
        }
    },

    detached: function() {
        for (var eventName in this.listeners) {
            this.unlisten(this, eventName, this.listeners[eventName]);
        }
        if (this.keyBindings) {
            this._removeKeyListener();
        }
    },

    listen: function(node, eventName, methodName) {
        node.addEventListener(eventName, this._registerHandler(eventName, methodName));
    },

    unlisten: function(node, eventName, methodName) {
        node.removeEventListener(eventName, this._getHandler(eventName, methodName));
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

    _setupKeyListener: function() {
        this.__boundKeyListener = this._keyListener.bind(this);
        this.addEventListener('keydown', this.__boundKeyListener);
    },

    _removeKeyListener: function() {
        this.removeEventListener('keydown', this.__boundKeyListener);
    },

    _keyListener: function(event) {
        for (var binding in this.keyBindings) {
            var handlerName = this.keyBindings[binding];
            var combos = getKeyCombos(binding);

            if (!event.defaultPrevented && combosMatchesEvent(combos, event)) {
                this[handlerName].call(this, event);
            }
        }
    }
};