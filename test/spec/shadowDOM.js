describe('renderComposedDOM', function() {
    var light, shadow, composed;

    beforeEach(function() {
        light = Bosonic.createDocumentFragment();
        shadow = Bosonic.createDocumentFragment();
    });

    it('should distribute lightDOM nodes into the shadowDOM', function() {
        light.innerHTML = '<div class="light">Test</div>';
        shadow.innerHTML = '<div class="shadow"><content></content></div>';
        composed = Bosonic.renderComposedDOM(shadow, light);
        expect(composed.innerHTML)
            .to.equal('<div class="shadow"><div class="light">Test</div></div>');
    });

    it('should handle selectors in <content>', function() {
        light.innerHTML = '<h3>Test</h3><p>Hello world</p><div>toto</div><p>Foo bar</p><div>titi</div>';
        shadow.innerHTML = 
            '<div class="title"><content select="h3"></content></div><div class="content"><content select="p"></content><content select="span"></content></div><div class="other"><content></content></div>';
        composed = Bosonic.renderComposedDOM(shadow, light);
        expect(composed.innerHTML)
            .to.equal('<div class="title"><h3>Test</h3></div><div class="content"><p>Hello world</p><p>Foo bar</p></div><div class="other"><div>toto</div><div>titi</div></div>');
    });
});

describe('shadowDOM usage', function() {
    Platform.test = true;

    describe('When creating a custom element with a template', function() {
        before(function() {
            Bosonic.registerElement('vr-foo', {
                template: '<div class="shadow"><content></content></div>',
                createdCallback: function() {
                    this._root = this.createShadowRoot();
                    this._root.appendChild(document.importNode(this.template.content));
                }
            });
        });

        beforeEach(function() {
            this.elt = document.createElement('vr-foo');
            document.body.appendChild(this.elt);
        });

        it('should create a shadowRoot', function() {
            expect(this.elt.shadowRoot).to.exist;
        });

        if (!HTMLElement.prototype.createShadowRoot) {
            it('should distribute the lightDOM into the shadowDOM', function() {
                this.elt.lightDOM.innerHTML = '<div class="light">toto</div>';
                expect(this.elt.innerHTML).to.equal('<div class="shadow"><div class="light">toto</div></div>');
            });

            it('should update the composed DOM when appending a child to the element', function() {
                this.elt.lightDOM.innerHTML = '<div class="light">toto</div>';
                this.elt.lightDOM.appendChild(document.createElement('button'));
                expect(this.elt.innerHTML).to.equal('<div class="shadow"><div class="light">toto</div><button></button></div>');
            });
        }
    });
});