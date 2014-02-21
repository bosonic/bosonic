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
        'cloneNode',
        'compareDocumentPosition',
        'dispatchEvent',
        'hasChildNodes',
        'isDefaultNamespace',
        'isEqualNode',
        'lookupNamespaceURI',
        'lookupPrefix',
        'normalize',
        'querySelector',
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
        'innerHTML',
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
    var setterProperties = [
        'innerHTML',
        //'textContent'
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
        this.target = target;
    }

    var descriptors = {};
    updateMethods.forEach(function(name) {
        descriptors[name] = {
            enumerable: true,
            configurable: false,
            writable: false,
            value: function() {
                var result = this.target[name].apply(this.target, arguments);
                this.target.dispatchEvent(new CustomEvent('update'));
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
        var descriptor = {
            enumerable: true,
            configurable: false,
            get: function() {
                return this.target[name];
            }
        };
        if (setterProperties.indexOf(name) !== -1) {
            descriptor.set = function(value) {
                this.target[name] = value;
                this.target.dispatchEvent(new CustomEvent('update'));
            }
        }
        descriptors[name] = descriptor;
    });

    Object.defineProperties(DocumentFragmentWrapper.prototype, descriptors);

    function wrap(element) {
        return new DocumentFragmentWrapper(element);
    }

    function unwrap(wrappedElement) {
        return wrappedElement.target;
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

    function enhanceFragment(fragment) {
        Object.defineProperty(fragment, 'innerHTML', {
            enumerable: true,
            set: function(html) {
                setFragmentInnerHTML(this, html);
            },
            get: function() {
                return getFragmentInnerHTML(this);
            }
        });
        var cloneNode = fragment.cloneNode;
        Object.defineProperty(fragment, 'cloneNode', {
            enumerable: true,
            value: function(deep) {
                var clone = cloneNode.call(this, deep);
                enhanceFragment(clone);
                return clone;
            }
        });
    }

    function createEnhancedDocumentFragment(fromNode) {
        var fragment = document.createDocumentFragment();
        if (fromNode) {
            while (child = fromNode.firstChild) {
                fragment.appendChild(child);
            }
        }
        enhanceFragment(fragment);
        return fragment;
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
            __shadowRoots__: [],

            createShadowRoot: function() {
                var that = this;
                if (!this.__lightDOM__) {
                    this.__lightDOM__ = Bosonic.createDocumentFragment(this);
                    this.lightDOM.addEventListener('update', function(e) {
                        logFlags.dom && console.log('lightDOM updated');
                        that.refreshComposedDOM(e);
                    });
                    if (!Platform.test) {
                        Object.defineProperty(this, 'innerHTML', {
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
                        });
                    }
                }
                var root = Bosonic.createDocumentFragment();
                root.addEventListener('update', function(e) {
                    that.refreshComposedDOM(e);
                });
                this.__shadowRoots__.push(root);
                return Bosonic.wrap(root);
            },

            get lightDOM() {
                return Bosonic.wrap(this.__lightDOM__);
            },

            get shadowRoot() {
                if (this.__shadowRoots__.length === 0) return undefined;
                return Bosonic.wrap(this.__shadowRoots__[0]);
            },

            refreshComposedDOM: function(event) {
                logFlags.dom && console.log('refreshing composed DOM');
                var composedFragment = renderComposedDOM(this.shadowRoot, this.__lightDOM__);
                while (this.childNodes.length > 0) {
                    this.removeChild(this.childNodes[0]);
                }
                this.appendChild(composedFragment);
            }
        };
    }

    function renderComposedDOM(shadowFragment, lightFragment) {
        var composed = shadowFragment.cloneNode(true),
            light = lightFragment.cloneNode(true),
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
            if (mutation.type === 'childList' && mutation.target.__upgraded__) {
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
    var Bosonic = {
        createDocumentFragment: createEnhancedDocumentFragment,
        createTemplateElement: createTemplateElement,
        createFragmentFromHTML: createFragmentFromHTML,
        renderComposedDOM: renderComposedDOM,
        registerElement: registerElement,
        wrap: wrap,
        unwrap: unwrap
    }

    window.Bosonic = Bosonic;
}());