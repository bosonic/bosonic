describe('renderComposedDOM', function() {
    var light, shadow, composed,
        getCleanHTML = function(frag) {
            return Bosonic.getHTMLFromFragment(Bosonic.removeNodeIDs(frag));
        };

    beforeEach(function() {
        light = Bosonic.createDocumentFragment();
        shadow = Bosonic.createDocumentFragment();
    });

    it('should distribute lightDOM nodes into the shadowDOM', function() {
        light.innerHTML = '<div class="light">Test</div>';
        shadow.innerHTML = '<div class="shadow"><content></content></div>';
        composed = Bosonic.renderComposedDOM(shadow, light);
        expect(getCleanHTML(composed))
            .to.equal('<div class="shadow"><div class="light">Test</div></div>');
    });

    it('should handle selectors in <content>', function() {
        light.innerHTML = '<h3>Test</h3><p>Hello world</p><div>toto</div><p>Foo bar</p><div>titi</div>';
        shadow.innerHTML = 
            '<div class="title"><content select="h3"></content></div><div class="content"><content select="p"></content><content select="span"></content></div><div class="other"><content></content></div>';
        composed = Bosonic.renderComposedDOM(shadow, light);
        expect(getCleanHTML(composed))
            .to.equal('<div class="title"><h3>Test</h3></div><div class="content"><p>Hello world</p><p>Foo bar</p></div><div class="other"><div>toto</div><div>titi</div></div>');
    });
});

describe('shadowDOM usage', function() {
    
    describe('When creating a custom element with a template', function() {
        
        before(function() {
            Bosonic.registerElement('vr-foo', {
                template: '<div class="shadow"><content></content></div>',
                createdCallback: function() {
                    var root = this.createShadowRoot();
                    root.appendChild(this.template.content.cloneNode(true));
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
                expect(Bosonic.removeNodeIDs(this.elt).innerHTML).to.equal('<div class="shadow"><div class="light">toto</div></div>');
            });

            it('should update the composed DOM when appending a child to the element', function() {
                this.elt.lightDOM.innerHTML = '<div class="light">toto</div>';
                this.elt.lightDOM.appendChild(document.createElement('button'));
                expect(Bosonic.removeNodeIDs(this.elt).innerHTML).to.equal('<div class="shadow"><div class="light">toto</div><button></button></div>');
            });
        }
    });

    if (!HTMLElement.prototype.createShadowRoot) {
        
        describe('When adding an event listener to a shadowDOM or lightDOM node', function() {
            
            var elt;

            before(function() {
                Bosonic.registerElement('b-shadow-dom-events', {
                    template: '<div><button class="close">x</button><content></content></div>',
                    readyCallback: function() {
                        var root = this.createShadowRoot();
                        root.appendChild(this.template.content.cloneNode(true));
                    }
                });
            });

            beforeEach(function() {
                elt = document.createElement('b-shadow-dom-events');
                elt.lightDOM.innerHTML = '<p>toto</p>';
                document.body.appendChild(elt);
            });

            afterEach(function() {
                document.body.removeChild(elt);
            });

            describe('When adding an event listener to a shadowDOM node', function() {

                it('should add a listener to the corresponding composed DOM node', function(done) {
                    elt.shadowRoot.querySelector('button.close').addEventListener('click', function() {
                        expect(true).to.be.true;
                        done();
                    }, false);
                    
                    effroi.mouse.click(document.querySelector('button.close'));
                });

                it('should maintain the listener attached to the corresponding composed DOM node when the shadowDOM is updated', function(done) {
                    elt.shadowRoot.querySelector('button.close').addEventListener('click', function() {
                        expect(true).to.be.true;
                        done();
                    }, false);

                    elt.shadowRoot.appendChild(document.createElement('span'));
                    effroi.mouse.click(document.querySelector('button.close'));
                });
            });

            describe('When adding an event listener to a lightDOM node', function() {

                it('should add a listener to the corresponding composed DOM node', function(done) {
                    elt.lightDOM.querySelector('p').addEventListener('click', function() {
                        expect(true).to.be.true;
                        done();
                    }, false);
                    
                    effroi.mouse.click(document.querySelector('p'));
                });

                it('should maintain the listener attached to the corresponding composed DOM node when the shadowDOM is updated', function(done) {
                    elt.lightDOM.querySelector('p').addEventListener('click', function() {
                        expect(true).to.be.true;
                        done();
                    }, false);

                    elt.shadowRoot.appendChild(document.createElement('span'));
                    effroi.mouse.click(document.querySelector('p'));
                });
            });
        });
    }
});