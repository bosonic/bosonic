var TAP_TRESHOLD = 10;

var TRANSITION_END = (function() {
    var el = document.createElement('div');
    return el.style.WebkitTransition !== undefined // Safari 6 & Android Browser < 4.3
        ? 'webkitTransitionEnd' : 'transitionend';
})();

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

    listenOnce: function(node, eventName, fn, args) {
        var host = this,
            handler = function() {
                fn.apply(host, args);
                node.removeEventListener(eventName, handler, false);
            };
        node.addEventListener(eventName, handler, false);
    },

    transition: function(node, beforeFn, afterFn) {
        var host = this,
            afterHandler = function() { afterFn.call(host, node); };

        this.listenOnce(node, TRANSITION_END, afterHandler);
        beforeFn.call(host, node);
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
                   Math.abs(detail.y - e.clientY) < TAP_TRESHOLD) Bosonic.Events.fire('tap', detail, { node: e.target });
            }
        }
    }
};
