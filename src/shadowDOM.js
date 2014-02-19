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