    function registerElement(name, behavior) {
        var propertiesObject = {};
        addLifecycleCallbacks(propertiesObject, behavior);
        
        var userlandCallbacks = [
            'readyCallback', 
            'createdCallback',
            'insertedCallback',
            'removedCallback',
            'attributeChanged',
            'childListChanged'
        ];
        // We inject all user-specified methods & properties in the properties object
        mixin(behavior, propertiesObject, userlandCallbacks);

        if (!HTMLElement.prototype.createShadowRoot) {
            console.log('No native Shadow DOM ; polyfilling '+name+' element');
            mixin(ShadowDOMPolyfillMixin, propertiesObject);
        }

        document.register(name, {
            prototype: Object.create(HTMLElement.prototype, propertiesObject)
        });
    }

    function addLifecycleCallbacks(propertiesObject, behavior) {
        var created = behavior.createdCallback || behavior.readyCallback;
        if (behavior.template) {console.log(behavior.template)
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