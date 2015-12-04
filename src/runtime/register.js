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
    options.__elementName = name;
    if (template) options.__template = template;
    if (attributes) options.__attributes = attributes.split(' ');

    var prototype = extendPrototype({}, Bosonic.Base);

    var features = [Bosonic.Dom, Bosonic.Events, Bosonic.Gestures, Bosonic.A11y, Bosonic.CustomAttributes],
        mixins = features;

    if (options.mixins) {
        mixins = mixins.concat(options.mixins);
    }

    mixins.forEach(function(mixin) {
        prototype = extendPrototype(prototype, mixin, ['created', 'attached', 'detached']);
    });
    options.__mixins = mixins;

    prototype = extendPrototype(prototype, options);

    var elementDef = {
        prototype: Object.create(window[extendeeClass].prototype, prototype)
    };
    if (extendee && extendsNativeElt) { 
        elementDef.extends = extendee;
    }

    window[elementClass] = document.registerElement(name, elementDef);
}