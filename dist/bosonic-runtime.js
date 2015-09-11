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

        var prototype = {};

        if (template) {
            var created = options.createdCallback;
            if (created) delete options.createdCallback;
            prototype.createdCallback = {
                enumerable: true,
                writable: true,
                value: function() {
                    this.createShadowRoot();
                    var content = template.content ? template.content : getFragmentFromNode(template);
                    this.shadowRoot.appendChild(document.importNode(content, true));
                    if (WebComponents.flags.shadow !== false) {
                        scopeShadowStyles(this.shadowRoot, name);
                    }
                    return created ? created.apply(this, arguments) : null;
                }
            };
        }

        if (attributes) {
            var changed = options.attributeChangedCallback,
                attrs = attributes.split(' ');

            if (changed) delete options.attributeChangedCallback;
            prototype.attributeChangedCallback = {
                enumerable: true,
                writable: true,
                value: function(name, oldValue, newValue) {
                    if (attrs.indexOf(name) !== -1 && this[name + 'Changed']) {
                        this[name + 'Changed'].call(this, oldValue, newValue);
                    }
                    return changed ? changed.apply(this, arguments) : null;
                }
            };
        }

        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                prototype[key] = Object.getOwnPropertyDescriptor(options, key);
            }
        }

        var elementDef = {
            prototype: Object.create(window[extendeeClass].prototype, prototype)
        };
        if (extendee && extendsNativeElt) { 
            elementDef.extends = extendee;
        }

        window[elementClass] = document.registerElement(name, elementDef);
    }
})();