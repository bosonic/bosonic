    var excludedConventionalProperties = [
        'mixins',
        'readyCallback', 
        'createdCallback',
        'insertedCallback',
        'attachedCallback',
        'removedCallback',
        'detachedCallback',
        'attributeChanged',
        'childListChanged'
    ];

    var elementPrototypes = {};

    function registerElement(name, behavior, extendElement) {
        var propertiesObject = {};
        addLifecycleCallbacks(propertiesObject, behavior);
        addMixins(propertiesObject, behavior);
        
        // We inject all user-specified methods & properties in the properties object
        mixin(behavior, propertiesObject, excludedConventionalProperties);

        if (!HTMLElement.prototype.createShadowRoot) {
            logFlags.dom && console.log('No native Shadow DOM ; polyfilling '+name+' element');
            mixin(ShadowDOMPolyfillMixin, propertiesObject);
        }

        if (extendElement) {
            var superPrototype = elementPrototypes[extendElement];
            if (!superPrototype) {
                throw new Error('You tried to extend an element that does not exist', extendElement);
            }
            propertiesObject._super = {
                enumerable: false,
                writable: false,
                configurable: false,
                value: superPrototype
            };
            var elementPrototype = Object.create(superPrototype, propertiesObject);
        } else {
            var elementPrototype = Object.create(HTMLElement.prototype, propertiesObject);
            
        }

        document.register(name, {
            prototype: elementPrototype
        });
        
        elementPrototypes[name] = elementPrototype;
    }

    function addLifecycleCallbacks(propertiesObject, behavior) {
        var created = behavior.createdCallback || behavior.readyCallback;
        if (behavior.template) {
            propertiesObject.createdCallback = {
                enumerable: true,
                value: function () {
                    this.template = Bosonic.createTemplateElement(this.template);
                    var output = created ? created.apply(this, arguments) : null;
                    return output || null;
                }
            };
        } else {
            if (created)
                propertiesObject.createdCallback = { enumerable: true, value: created };
        }
        
        var attached = behavior.insertedCallback || behavior.attachedCallback;
        if (attached) 
            propertiesObject.attachedCallback = { enumerable: true, value: attached };
        
        var detached = behavior.removedCallback || behavior.detachedCallback
        if (detached) 
            propertiesObject.detachedCallback = { enumerable: true, value: detached };

        if (behavior.attributeChanged) {
            propertiesObject.attributeChangedCallback = {
                enumerable: true,
                value: function (name, oldValue, newValue) {
                    return behavior.attributeChanged.call(this, name, oldValue, this.getAttribute(name));
                }
            };
        }

        if (behavior.childListChanged) 
            propertiesObject.childListChangedCallback = { enumerable: true, value: behavior.childListChanged };
        
        return propertiesObject;
    }

    function addMixins(propertiesObject, behavior) {
        if (behavior.mixins) {
            behavior.mixins.forEach(function(mixinName) {
                if (!mixinExists(mixinName)) {
                    throw new Error('Mixin not found: '+mixinName);
                }
                mixin(registeredMixins[mixinName], propertiesObject);
            });
        }
        return propertiesObject;
    }

    var registeredMixins = {};

    function mixinExists(name) {
        return registeredMixins.hasOwnProperty(name);
    }

    function registerMixin(name, mixin) {
        if (mixinExists(name)) {
            throw new Error('Already registered mixin: '+name);
        }
        registeredMixins[name] = mixin;
    }

    function mixin(behavior, propertiesObject, exclude) {
        Object.getOwnPropertyNames(behavior).forEach(function(key) {
            if (exclude && exclude.indexOf(key) !== -1) return;
            var descriptor = Object.getOwnPropertyDescriptor(behavior, key);
            propertiesObject[key] = {
                enumerable: true
            };
            if (descriptor.hasOwnProperty('value')) {
                propertiesObject[key].value = descriptor.value;
                if (typeof descriptor.value !== 'function') {
                    propertiesObject[key].writable = true;
                }
            }
            if (descriptor.hasOwnProperty('get')) {
                propertiesObject[key].get = descriptor.get;
            }
            if (descriptor.hasOwnProperty('set')) {
                propertiesObject[key].set = descriptor.set;
            }
        });
        return propertiesObject;
    }