function buildShadowRegexes(elementName) {
    return [
        [/:host\(([^:]+)\)/g, elementName+'$1'],
        [/:host(:hover|:active|:focus)/g, elementName+'$1'],
        [/:host(\[[^:]+\])/g, elementName+'$1'],
        [/:host/g, elementName],
        [/:ancestor\(([^:]+)\)/g, '$1 '+elementName], // deprecated; replaced by :host-context
        [/:host-context\(([^:]+)\)/g, '$1 '+elementName],
        [/::content/g, elementName],
    ];
}

function shimStyles(styles, elementName) {
    var selectorRegexes = buildShadowRegexes(elementName);
    for (var i = 0; i < selectorRegexes.length; i++) {
        var re = selectorRegexes[i];
        styles = styles.replace(re[0], re[1]);
    }
    return styles;
}

function parseCSS(str) {
    var doc = document.implementation.createHTMLDocument(''),
        styleElt = document.createElement("style");
    
    styleElt.textContent = str;
    doc.body.appendChild(styleElt);
    
    return styleElt.sheet.cssRules;
}

function scopeShadowStyles(root, name) {
    var styles = root.querySelectorAll('style');
    Array.prototype.forEach.call(styles, function(style) {
        var rules = parseCSS(shimStyles(style.textContent, name));
        var css = '';
        Array.prototype.forEach.call(rules, function(rule) {
            if (!rule.selectorText.match(new RegExp(name))) {
                css += name + ' ' + rule.cssText + '\n';
                css += name + '::shadow ' + rule.cssText + '\n';
            } else {
                css += rule.cssText + '\n';
            }
        });
        var s = document.createElement('style');
        s.textContent = css;
        document.head.appendChild(s);
        // if we have a prefixed (and therefore flaky) native impl., we keep the <style> in the shadow root, just in case
        if (WebComponents.flags.shadow !== 'prefixed') {
            style.parentNode.removeChild(style);
        }
    });
}

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
            this.shadowRoot.appendChild(document.importNode(content, true));
            if (WebComponents.flags.shadow !== false) {
                scopeShadowStyles(this.shadowRoot, name);
            }
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
        if (!this.mixins) return;
        this.mixins.forEach(function(mixin) {
            if (mixin[callbackName]) {
                args ? mixin[callbackName].apply(this, args) : mixin[callbackName].call(this);
            }
        }, this);
    }
};