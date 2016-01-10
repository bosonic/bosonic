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

function parseCombo(combo) {
    var keys = combo.split('+').reverse(),
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

function comboMatchesEvent(combo, event) {
    return KEYS[event.keyCode] && KEYS[event.keyCode] === combo.key && modifiersMatchesEvent(combo, event);
}

function modifiersMatchesEvent(combo, event) {
    return Object.keys(combo.modifiers).every(function(modifier) {
        return !!combo.modifiers[modifier] === !!event[modifier];
    });
}

function findMatchingCombo(binding, event) {
    var combos = binding.split(' ');
    for (var i = 0; i < combos.length; i++) {
        if (comboMatchesEvent(parseCombo(combos[i]), event)) {
            return combos[i];
        }
    }
    return false;
}

Bosonic.A11y = {
    created: function() {
        if (this.keyBindings) {
            this._setupKeyListener(this);
        }
    },

    detached: function() {
        if (this.keyBindings) {
            this._removeKeyListener(this);
        }
    },

    getFocusableElements: function(container) {
        container = container || this;
        return container.querySelectorAll(focusableElementsSelector);
    },

    getFirstFocusableElement: function(container) {
        container = container || this;
        return container.querySelector(focusableElementsSelector);
    },

    _setupKeyListener: function(host) {
        var handler = function(event) {
            for (var binding in host.keyBindings) {
                var combo = findMatchingCombo(binding, event);
                if (combo && !event.defaultPrevented) {
                    var handlerName = host.keyBindings[binding];
                    host[handlerName](event, combo);
                    return;
                }
            }
        };

        host.__keyListener = handler;
        this._listen(host, 'keydown', handler);
    },

    _removeKeyListener: function(host) {
        this._unlisten(host, 'keydown', host.__keyListener);
    }
};