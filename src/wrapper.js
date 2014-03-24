    
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