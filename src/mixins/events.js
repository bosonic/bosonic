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
        if (useCapture !== true) useCapture = false;
        node.addEventListener(eventName, this._registerHandler(eventName, methodName), useCapture);
    },

    unlisten: function(node, eventName, methodName, useCapture) {
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
    }
};