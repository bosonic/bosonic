var focusableElementsSelector ="a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";

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

Bosonic.A11y = {
    __boundKeyHandlers: [],

    created: function() {
        if (this.keyBindings) {
            this._setupKeyListeners();
        }
    },

    detached: function() {
        if (this.keyBindings) {
            this._removeKeyListeners();
        }
    },

    keyMatchesEvent: function(key, event) {
        return comboMatchesEvent(getKeyCombo(key), event);
    },

    getFocusableElements: function(container) {
        container = container || this;
        return container.querySelectorAll(focusableElementsSelector);
    },

    getFirstFocusableElement: function(container) {
        container = container || this;
        return container.querySelector(focusableElementsSelector);
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