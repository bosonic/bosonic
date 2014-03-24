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