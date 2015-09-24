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
        for (var k in this.keyBindings) {
            keys = k.split(' ');
            var handlerName = this.keyBindings[k];
            var pressedKey = KEYS[event.keyCode] ? KEYS[event.keyCode] : event.keyCode;
            if (!event.defaultPrevented && keys.indexOf(pressedKey) !== -1) {
                this[handlerName].call(this, event);
            }
        }
    }
};