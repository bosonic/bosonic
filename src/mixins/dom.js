Bosonic.Dom = {
    created: function() {
        if (this.hostAttributes) {
            for (var attrName in this.hostAttributes) {
                this.setAttribute(attrName, this.hostAttributes[attrName]);
            }
        }
    },

    toggleClass: function(name, bool, node) {
        node = node || this;
        if (arguments.length == 1) {
            bool = !node.classList.contains(name);
        }
        bool ? node.classList.add(name) : node.classList.remove(name);
    },

    toggleAttribute: function(name, bool, node) {
        node = node || this;
        if (arguments.length == 1) {
            bool = !node.hasAttribute(name);
        }
        bool ? node.setAttribute(name, '') : node.removeAttribute(name);
    },

    // for ARIA state properties
    toggleStateAttribute: function(name, bool, node) {
        node = node || this;
        if (arguments.length == 1) {
            bool = !node.hasAttribute(name) || node.getAttribute(name) == 'false';
        }
        bool ? node.setAttribute(name, 'true') : node.setAttribute(name, 'false');
    },

    async: function(callback, time) {
        var host = this;
        return setTimeout(function() {
            callback.call(host);
        }, time);
    },

    cancelAsync: function(handle) {
        clearTimeout(handle);
    }
};