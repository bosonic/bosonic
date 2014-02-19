    
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