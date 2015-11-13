function getFragmentFromNode(node) {
    var fragment = document.createDocumentFragment();
    while (child = node.firstChild) {
        fragment.appendChild(child);
    }
    return fragment;
}

function processMutations(mutations) {
    var nodes = {
        added: [],
        removed: []
    };
    mutations.forEach(function(record) {
        nodes.added = nodes.added.concat([].slice.call(record.addedNodes));
        nodes.removed = nodes.removed.concat([].slice.call(record.removedNodes));
    });
    return nodes;
}

Bosonic.Base = {
    createdCallback: function() {
        if (this.__template) {
            this.createShadowRoot();
            var content = this.__template.content ? this.__template.content : getFragmentFromNode(this.__template);
            if (WebComponents.flags.shadow !== false) {
                WebComponents.ShadowCSS.shimStyling(content, this.__elementName);
            }
            this.shadowRoot.appendChild(document.importNode(content, true));
        }
        var childListChanged = this.__lifecycle.childListChanged;
        if (childListChanged) {
            var that = this,
                observer = new MutationObserver(function(mutations) {
                    var diff = processMutations(mutations);
                    childListChanged.call(that, diff.removed, diff.added, mutations);
                });
            observer.observe(this, { childList: true, subtree: true, characterData: true });
        }
        this.__callMixins('created');
        this.classList.add('resolved');
        var created = this.__lifecycle.created;
        return created ? created.apply(this, arguments) : null;
    },

    attachedCallback: function() {
        this.__callMixins('attached');
        var attached = this.__lifecycle.attached;
        return attached ? attached.apply(this, arguments) : null;
    },

    detachedCallback: function() {
        this.__callMixins('detached');
        var detached = this.__lifecycle.detached;
        return detached ? detached.apply(this, arguments) : null;
    },

    attributeChangedCallback: function(name, oldValue, newValue) {
        if (this.__attributes) {
            if (name.indexOf('data-') === 0) {
                name = name.substr(5);
            }
            if (this.__attributes.indexOf(name) !== -1 && this[name + 'Changed']) {
                this[name + 'Changed'].call(this, oldValue, newValue);
            }
        }
        var changed = this.__lifecycle.attributeChanged;
        return changed ? changed.apply(this, arguments) : null;
    },

    __callMixins: function(callbackName, args) {
        this.__mixins.forEach(function(mixin) {
            if (mixin[callbackName]) {
                args ? mixin[callbackName].apply(this, args) : mixin[callbackName].call(this);
            }
        }, this);
    }
};