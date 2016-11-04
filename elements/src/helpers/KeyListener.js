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
        modifierKeys = {},
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

export default class KeyListener {
  constructor(host, keyBindings) {
    this.handler = event => {
      for (var binding in keyBindings) {
        var combo = findMatchingCombo(binding, event)
        if (combo && !event.defaultPrevented) {
            var handlerName = keyBindings[binding]
            host[handlerName](event, combo)
            return
        }
      }
    }
    host.addEventListener('keydown', this.handler)
  }

  dispose(host) {
    host.removeEventListener('keydown', this.handler)
    this.handler = null
  }
}