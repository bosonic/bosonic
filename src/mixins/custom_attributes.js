Bosonic.CustomAttributes = {
    hasCustomAttribute: function(name) {
        return this.hasAttribute(name) || this._hasPrefixedAttribute(name);
    },

    getCustomAttribute: function(name) {
        return this.getAttribute(this._getRealAttribute(name));
    },

    setCustomAttribute: function(name, value) {
        this.setAttribute(this._getRealAttribute(name), value);
    },

    removeCustomAttribute: function(name) {
        this.removeAttribute(this._getRealAttribute(name));
    },

    toggleCustomAttribute: function(name) {
        this.hasCustomAttribute(name) ? this.removeCustomAttribute(name) : this.setCustomAttribute(name, '');
    },

    _hasPrefixedAttribute: function(name) {
        return this.hasAttribute('data-' + name);
    },

    _getRealAttribute: function(name) {
        return this._hasPrefixedAttribute(name) ? 'data-' + name : name;
    }
};