var TAP_TRESHOLD = 10;

Bosonic.Events = {
    created: function() {
        if (this.shadowRoot) {
            PointerEventsPolyfill.dispatcher.register(this.shadowRoot);
        }
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

    listen: function(node, eventName, methodName) {
        var listener = this._findListener(this, node, eventName, methodName);
        if (!listener) {
            listener = this._registerListener(this, node, eventName, methodName);
        }
        if (listener.deps) {
            Object.keys(listener.deps).forEach(function(dep) {
                this._listen(node, dep, listener.deps[dep]);
            }, this);
        }
        this._listen(node, eventName, listener.handler);
    },

    unlisten: function(node, eventName, methodName) {
        var listener = this._findListener(this, node, eventName, methodName);
        if (listener) {
            if (listener.deps) {
                Object.keys(listener.deps).forEach(function(dep) {
                    this._unlisten(node, dep, listener.deps[dep]);
                }, this);
            }
            this._unlisten(node, eventName, listener.handler);
        }
    },

    _listen: function(node, eventName, handler) {
        node.addEventListener(eventName, handler);
    },

    _unlisten: function(node, eventName, handler) {
        node.removeEventListener(eventName, handler);
    },

    _findListener: function(host, node, eventName, methodName) {
        return this._getListener(host, node, this._getListenerKey(eventName, methodName));
    },

    _getListener: function(host, node, key) {
        if (!host.__listeners || !host.__listeners[key]) return;
        var listeners = host.__listeners[key],
            len = listeners.length;
        if (len === 1) return listeners[0];
        for (var i = 0; i < len; i++) {
            if (listeners[i].node === node) return listeners[i];
        }
    },

    _registerListener: function(host, node, eventName, methodName) {
        var key = this._getListenerKey(eventName, methodName),
            listener = this._prepareListener(host, node, eventName, methodName);
        
        this._setListener(host, node, key, listener);
        return listener;
    },

    _prepareListener: function(host, node, eventName, methodName) {
        if (!host[methodName]) {
            throw 'Event handler method `' + methodName + '` is not defined';
        }
        var listener = {
            node: node,
            handler: function(e) {
                host[methodName](e);
            }
        };
        if (this.customEvents[eventName]) {
            var detail = {},
                customEvent = this.customEvents[eventName];

            listener.deps = {};
            customEvent.deps.forEach(function(dep) {
                var handler = customEvent[dep].bind(this, detail);
                listener.deps[dep] = handler;
            });
        }
        return listener;
    },

    _setListener: function(host, node, key, listener) {
        if (!host.__listeners) host.__listeners = {};
        if (!host.__listeners[key]) host.__listeners[key] = [];
        host.__listeners[key].push(listener);
    },

    _getListenerKey: function(eventName, methodName) {
        return eventName + ':' + methodName;
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

    customEvents: {
        tap: {
            deps: ['pointerdown', 'pointerup'],
            pointerdown: function(detail, e) {
                detail.x = e.clientX;
                detail.y = e.clientY;
            },
            pointerup: function(detail, e) {
                if (e.button === 0 &&
                   Math.abs(detail.x - e.clientX) < TAP_TRESHOLD &&
                   Math.abs(detail.y - e.clientY) < TAP_TRESHOLD) Bosonic.Events.fire('tap', detail, { node: e.currentTarget });
            }
        }
    }
};
