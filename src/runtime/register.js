(function() {

    if (!window.WebComponents) {
        throw 'Bosonic runtime needs the WebComponents polyfills to be loaded first.';
    }

    if (!window.Bosonic) {
        window.Bosonic = {};
    }

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

    function ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function camelize(str) {
        var camelized = str.replace(/(\-|_|\.|\s)+(.)?/g, function(match, separator, chr) {
            return chr ? chr.toUpperCase() : '';
        }).replace(/^([A-Z])/, function(match, separator, chr) {
            return match.toLowerCase();
        });
        return ucfirst(camelized);
    }

    function extendsNativeElement(extendee) {
        if (!extendee) return false;
        return extendee.indexOf('-') === -1;
    }

    function getExtendeeClass(extendee) {
        if (!extendee) {
            return 'HTMLElement'
        } else if (extendsNativeElement(extendee)) {
            if (['thead', 'tbody', 'tfoot'].indexOf(extendee) !== -1) {
                return 'HTMLTableSectionElement';
            } else {
                return 'HTML' + camelize(extendee) + 'Element';
            }
        } else {
            return camelize(extendee);
        }
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
    }

    function extractLifecycleCallbacks(options) {
        var callbacks = {
            created: ['created', 'createdCallback'],
            attached: ['attached', 'attachedCallback'],
            detached: ['detached', 'detachedCallback'],
            attributeChanged: ['attributeChanged', 'attributeChangedCallback'],
            childListChanged: ['childListChanged', 'childListChangedCallback']
        };
        options.__lifecycle = {};
        for (var key in callbacks) {
            callbacks[key].forEach(function(cb) {
                if (options[cb]) {
                    options.__lifecycle[key] = options[cb];
                    delete options[cb];
                }
            });
        }
        return options;
    }

    function extendPrototype(prototype, api, exclude) {
        exclude = exclude || [];
        if (prototype && api) {
            Object.getOwnPropertyNames(api).forEach(function(n) {
                if (exclude.indexOf(n) === -1) {
                    prototype[n] = Object.getOwnPropertyDescriptor(api, n);
                }
            });
        }
        return prototype;
    }

    Bosonic.register = function(options) {
        var script = document._currentScript;
        var element = script && script.parentNode ? script.parentNode : null;
        if (!element || element.tagName.toUpperCase() !== 'ELEMENT') {
            throw 'Surrounding <element> tag could not be found.'
        }
        var name = element.getAttribute('name');
        if (!name) {
            throw 'Element name could not be inferred.';
        }

        var attributes = element.getAttribute('attributes'),
            extendee = element.getAttribute('extends'),
            extendsNativeElt = extendsNativeElement(extendee),
            elementClass = camelize(name),
            extendeeClass = getExtendeeClass(extendee);

        var template = script && script.parentNode ? script.parentNode.querySelector('template') : null;

        options = extractLifecycleCallbacks(options);
        if (template) options.__template = template;
        if (attributes) options.__attributes = attributes.split(' ');

        var prototype = extendPrototype({}, Bosonic.Base);

        if (options.mixins) {
            options.mixins.forEach(function(mixin) {
                prototype = extendPrototype(prototype, mixin, ['created', 'attached', 'detached']);
            });
        }

        prototype = extendPrototype(prototype, options);

        var elementDef = {
            prototype: Object.create(window[extendeeClass].prototype, prototype)
        };
        if (extendee && extendsNativeElt) { 
            elementDef.extends = extendee;
        }

        window[elementClass] = document.registerElement(name, elementDef);
    }
})();