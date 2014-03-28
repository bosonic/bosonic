(function() {
    if (logFlags.dom && !console.group) {
        console.group = console.log;
        console.groupCollapsed = console.groupEnd = function() {};
    }
    
    // Browser support differ... So we don't proxify these methods:
    // 'attachEvent', 'detachEvent', 'removeNode', 'replaceNode', 'swapNode' <= IE only
    // 'contains' <= CR & FF only
    // 'hasAttributes' <= FF & IE only
    // 'isSameNode', 'isSupported' <= CR & IE only
    var normalMethods = [
        'addEventListener',
        //'cloneNode', <- implementation provided by Bosonic, don't proxify
        'compareDocumentPosition',
        'dispatchEvent',
        'hasChildNodes',
        'isDefaultNamespace',
        'isEqualNode',
        'lookupNamespaceURI',
        'lookupPrefix',
        'normalize',
        //'querySelector', <- idem
        'querySelectorAll',
        'removeEventListener'
    ];
    var updateMethods = [
        'appendChild',
        'insertBefore',
        'removeChild',
        'replaceChild'
    ];

    // Browser support differ... So we don't proxify these properties:
    // 'baseURI', 'parentElement' <= CR & FF only
    // 'attributes' <= IE only
    // 'childElementCount', 'children', 'firstElementChild', 'lastElementChild' <= CR only
    var getterProperties = [
        'childNodes',
        'firstChild',
        'lastChild',
        'localName',
        'namespaceURI',
        'nextSibling',
        'nodeName',
        'nodeType',
        'nodeValue',
        'ownerDocument',
        'parentNode',
        'prefix',
        'previousSibling',
        'textContent'
    ];

    // We don't proxify these properties either:
    // 'ATTRIBUTE_NODE',
    // 'CDATA_SECTION_NODE',
    // 'COMMENT_NODE',
    // 'DOCUMENT_FRAGMENT_NODE',
    // 'DOCUMENT_NODE',
    // 'DOCUMENT_POSITION_CONTAINED_BY',
    // 'DOCUMENT_POSITION_CONTAINS',
    // 'DOCUMENT_POSITION_DISCONNECTED',
    // 'DOCUMENT_POSITION_FOLLOWING',
    // 'DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC',
    // 'DOCUMENT_POSITION_PRECEDING',
    // 'DOCUMENT_TYPE_NODE',
    // 'ELEMENT_NODE',
    // 'ENTITY_NODE',
    // 'ENTITY_REFERENCE_NODE',
    // 'NOTATION_NODE',
    // 'PROCESSING_INSTRUCTION_NODE',
    // 'TEXT_NODE',

    function DocumentFragmentWrapper(target) {
        identifyNodes(target);
        this.target = target;
        this.registeredListeners = [];
    }

    var descriptors = {
        innerHTML: {
            enumerable: true,
            set: function(html) {
                setFragmentInnerHTML(this.target, html);
                this.onUpdate();
            },
            get: function() {
                return getFragmentInnerHTML(this.target);
            }
        },

        onUpdate: {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function() {
                identifyNodes(this.target);
                this.target.dispatchEvent(new CustomEvent('update'));
            }
        },

        cloneNode: {
            enumerable: true,
            value: function(deep) {
                var clone = this.target.cloneNode(deep);
                return wrap(clone);
            }
        },

        unwrap: {
            enumerable: true,
            value: function() {
                return unwrap(this);
            }
        },

        querySelector: {
            enumerable: true,
            configurable: false,
            writable: false,
            value: function(selector) {
                var elt = this.target.querySelector(selector);
                if (elt) {
                    instrumentElement(elt, this);
                }
                return elt;
            }
        },

        registerListener: {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function(guid, type, listener, useCapture) {
                var detail = {
                    guid: guid,
                    type: type,
                    listener: listener,
                    useCapture: useCapture
                };
                this.registeredListeners.push(detail);
                this.target.dispatchEvent(new CustomEvent('addListener', { detail: detail }));
            }
        },

        unregisterListener: {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function(guid, type, listener, useCapture) {
                var unregistered;
                this.registeredListeners.forEach(function(detail, index) {
                    if (detail.guid === guid && detail.type === type && detail.listener === listener) {
                        unregistered = detail;
                        this.registeredListeners.splice(index, 1);
                    }
                }, this);
                if (unregistered) {
                    this.target.dispatchEvent(new CustomEvent('removeListener', { detail: unregistered }));
                }
            }
        }
    };

    updateMethods.forEach(function(name) {
        descriptors[name] = {
            enumerable: true,
            configurable: false,
            writable: false,
            value: function() {
                var result = this.target[name].apply(this.target, arguments);
                this.onUpdate();
                return result;
            }
        };
    });
    normalMethods.forEach(function(name) {
        descriptors[name] = {
            enumerable: true,
            configurable: false,
            writable: false,
            value: function() {
                return this.target[name].apply(this.target, arguments);
            }
        };
    });
    getterProperties.forEach(function(name) {
        descriptors[name] = {
            enumerable: true,
            configurable: false,
            get: function() {
                return this.target[name];
            }
        };
    });

    Object.defineProperties(DocumentFragmentWrapper.prototype, descriptors);

    function wrap(fragment) {
        return new DocumentFragmentWrapper(fragment);
    }

    function unwrap(wrappedFragment) {
        return removeNodeIDs(wrappedFragment.target);
    }

    function instrumentElement(element, ownerFragment) {
        var addMethod = element.addEventListener,
            removeMethod = element.removeEventListener;
        
        Object.defineProperties(element, {
            addEventListener: {
                enumerable: true,
                value: function(type, listener, useCapture) {
                    ownerFragment.registerListener(this.getAttribute('data-b-guid'), type, listener, useCapture);
                    return;
                }
            },
            removeEventListener: {
                enumerable: true,
                value: function(type, listener, useCapture) {
                    ownerFragment.unregisterListener(this.getAttribute('data-b-guid'), type, listener, useCapture);
                    return;
                }
            },
            __addEventListener__: {
                enumerable: true,
                value: addMethod
            },
            __removeEventListener__: {
                enumerable: true,
                value: removeMethod
            }
        });
    }
    
    //Generate four random hex digits.
    function S4() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }

    // Generate a pseudo-GUID by concatenating random hexadecimal.
    function guid() {
       return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }

    function identifyNodes(fragment) {
        var node, length = fragment.childNodes.length;
        for (var i = 0; i < length; i++) {
            node = fragment.childNodes[i];
            if (node.nodeType === 1 && !node.hasAttribute('data-b-guid')) {
                node.setAttribute('data-b-guid', guid());
            }
            if (node.childNodes.length > 0) {
                identifyNodes(node);
            }
        }
    }

    function removeNodeIDs(fragment) {
        var node, length = fragment.childNodes.length;
        for (var i = 0; i < length; i++) {
            node = fragment.childNodes[i];
            if (node.nodeType === 1 && node.hasAttribute('data-b-guid')) {
                node.removeAttribute('data-b-guid');
            }
            if (node.childNodes.length > 0) {
                removeNodeIDs(node);
            }
        }
        return fragment;
    }

    function setFragmentInnerHTML(fragment, html) {
        while (fragment.childNodes.length > 0) {
            fragment.removeChild(fragment.childNodes[0]);
        }
        var div = fragment.appendChild(document.createElement('div'));
        div.innerHTML = html;
        while (child = div.firstChild) {
            fragment.insertBefore(child, div);
        }
        fragment.removeChild(div);
        return fragment;
    }

    function getFragmentInnerHTML(fragment) {
        var tmp = document.createElement('body');
        tmp.appendChild(fragment.cloneNode(true));
        return tmp.innerHTML;
    }

    function createWrappedDocumentFragment(fromNode) {
        var fragment = document.createDocumentFragment();
        if (fromNode) {
            while (child = fromNode.firstChild) {
                fragment.appendChild(child);
            }
        }
        return wrap(fragment);
    }

    function createFragmentFromHTML(html) {
        var frag = document.createDocumentFragment();
        setFragmentInnerHTML(frag, html);
        return frag;
    }

    function createTemplateElement(html) {
        return {
            content: createFragmentFromHTML(html)
        };
    }

    if (HTMLElement.prototype.webkitCreateShadowRoot) {
        logFlags.dom && console.log('Native Shadow DOM detected');

        var originalCreateShadowRoot = Element.prototype.webkitCreateShadowRoot;
        Element.prototype.webkitCreateShadowRoot = function() {
            var elderRoot = this.webkitShadowRoot;
            var root = originalCreateShadowRoot.call(this);
            root.olderShadowRoot = elderRoot;
            root.host = this;
            //CustomElements.watchShadow(this);
            return root;
        }

        Object.defineProperties(Element.prototype, {
            shadowRoot: {
                get: function() {
                    return this.webkitShadowRoot;
                }
            },
            createShadowRoot: {
                value: function() {
                    return this.webkitCreateShadowRoot();
                }
            }
        });
    } else {
        var ShadowDOMPolyfillMixin = {
            
            createShadowRoot: function() {
                var that = this;
                if (!this.__shadowRoots__) {
                    this.__shadowRoots__ = [];
                }
                if (!this.__lightDOM__) {
                    this.__lightDOM__ = Bosonic.createDocumentFragment(this);
                    this.lightDOM.addEventListener('update', function(e) {
                        logFlags.dom && console.log('lightDOM updated');
                        that.refreshComposedDOM(e);
                    });
                    this.lightDOM.addEventListener('addListener', function(e) {
                        logFlags.dom && console.log('listener attached to a lightDOM node');
                        that.attachListener(e.detail);
                    });
                    if (!Platform.test) {
                        // Disabled for now because of a Safari bug: https://github.com/bosonic/bosonic/issues/1
                        /*Object.defineProperty(this, 'innerHTML', {
                            enumerable: true,
                            configurable: false,
                            get: function() {
                                logFlags.dom && console.log('get innerHTML called on element ; forwarding to lightDOM');
                                return this.lightDOM.innerHTML;
                            },
                            set: function(html) {
                                logFlags.dom && console.log('set innerHTML called on element ; forwarding to lightDOM', html);
                                this.lightDOM.innerHTML = html;
                            }
                        });*/
                    }
                }
                var root = Bosonic.createDocumentFragment();
                root.addEventListener('update', function(e) {
                    logFlags.dom && console.log('shadowDOM updated');
                    that.refreshComposedDOM(e);
                });
                root.addEventListener('addListener', function(e) {
                    logFlags.dom && console.log('listener attached to a shadowDOM node');
                    that.attachListener(e.detail);
                });
                this.__shadowRoots__.push(root);
                return root;
            },

            get lightDOM() {
                return this.__lightDOM__;
            },

            get shadowRoot() {
                if (!this.__shadowRoots__ || this.__shadowRoots__.length === 0) return undefined;
                return this.__shadowRoots__[0];
            },

            refreshComposedDOM: function(event) {
                logFlags.dom && console.log('refreshing composed DOM');
                var composedFragment = renderComposedDOM(this.shadowRoot, this.__lightDOM__);
                while (this.childNodes.length > 0) {
                    this.removeChild(this.childNodes[0]);
                }
                this.appendChild(composedFragment);
                
                if (this.shadowRoot.registeredListeners) {
                    this.shadowRoot.registeredListeners.forEach(function(listener) {
                        this.attachListener(listener);
                    }, this);
                }

                if (this.lightDOM.registeredListeners) {
                    this.lightDOM.registeredListeners.forEach(function(listener) {
                        this.attachListener(listener);
                    }, this);
                }
            },

            attachListener: function(detail) {
                var elt = this.querySelector("[data-b-guid='"+detail.guid+"']");
                elt.addEventListener(detail.type, detail.listener, detail.useCapture);
            }
        };
    }

    function renderComposedDOM(shadowFragment, lightFragment) {
        var composed = shadowFragment.target.cloneNode(true),
            light = lightFragment.target.cloneNode(true),
            insertionPoints = composed.querySelectorAll('content');

        var forEach = Array.prototype.forEach;

        logFlags.dom && console.log('found '+insertionPoints.length+' insertion points');

        forEach.call(insertionPoints, function(node) {
            var selector = node.getAttribute('select') || '*';
            if (selector !== '*') {
                var found = light.querySelectorAll(selector);
                forEach.call(found, function(pt) {
                    node.parentNode.insertBefore(pt, node);
                });
                node.parentNode.removeChild(node);
            } else {
                while (light.childNodes.length > 0) {
                    node.parentNode.insertBefore(light.childNodes[0], node);
                }
                node.parentNode.removeChild(node);
            }
        });
        return composed;
    }
    
    function handleChildListMutations(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                var elt = mutation.target;
                logFlags.dom && console.log('children change', elt);
                if (elt.childListChangedCallback) {
                    elt.childListChangedCallback(mutation.removedNodes, mutation.addedNodes);
                }
            }
        }, this);
    }

    var childListObserver = new MutationObserver(handleChildListMutations.bind(this));

    window.addEventListener('WebComponentsReady', function() {
        childListObserver.observe(document, { childList: true, subtree: true });
    });
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

    function registerElement(name, behavior) {
        var propertiesObject = {};
        addLifecycleCallbacks(propertiesObject, behavior);
        addMixins(propertiesObject, behavior);
        
        // We inject all user-specified methods & properties in the properties object
        mixin(behavior, propertiesObject, excludedConventionalProperties);

        if (!HTMLElement.prototype.createShadowRoot) {
            logFlags.dom && console.log('No native Shadow DOM ; polyfilling '+name+' element');
            mixin(ShadowDOMPolyfillMixin, propertiesObject);
        }

        document.register(name, {
            prototype: Object.create(HTMLElement.prototype, propertiesObject)
        });
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
    var Bosonic;

    if (Platform.test) {
        window.DocumentFragmentWrapper = DocumentFragmentWrapper;

        Bosonic = {
            createDocumentFragment: createWrappedDocumentFragment,
            createTemplateElement: createTemplateElement,
            createFragmentFromHTML: createFragmentFromHTML,
            getHTMLFromFragment: getFragmentInnerHTML,
            removeNodeIDs: removeNodeIDs,
            renderComposedDOM: renderComposedDOM,
            registerElement: registerElement,
            registerMixin: registerMixin
        }
    } else {
        Bosonic = {
            registerElement: registerElement,
            createTemplateElement: createTemplateElement,
            createDocumentFragment: createWrappedDocumentFragment
        }
    }
    
    window.Bosonic = Bosonic;
}());