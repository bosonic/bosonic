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
    }
};