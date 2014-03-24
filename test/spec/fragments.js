describe('Helper methods', function() {
    it('may create a fragment from a HTML string', function() {
        var frag = Bosonic.createFragmentFromHTML('<div id="toto"><a>Titi</a><p>Tata</p></div>');
        expect(frag.childNodes.length).to.equal(1);
        expect(frag.childNodes[0].childNodes.length).to.equal(2);
    });

    it('may get a fragment\'s HTML as a string', function() {
        var frag = document.createDocumentFragment(),
            div = document.createElement('div');
        div.innerHTML = '<a>Titi</a><p>Tata</p>';
        frag.appendChild(div);
        expect(Bosonic.getHTMLFromFragment(frag)).to.equal('<div><a>Titi</a><p>Tata</p></div>');
    });

    it('may create a wrapped fragment from a node', function() {
        document.body.innerHTML = '<div><a>Titi</a><p>Tata</p></div>';
        var div = document.querySelector('div'),
            frag = Bosonic.createDocumentFragment(div);
        expect(frag instanceof DocumentFragmentWrapper).to.be.true;
        expect(frag.childNodes.length).to.equal(2);
        expect(div.childNodes.length).to.equal(0);
    });
});

describe('Wrapped Document Fragments', function() {
    
    describe('innerHTML support', function() {
        it('should work when the provided HTML has only one root node', function() {
            var html = '<div><div><h1>Test</h1></div><button>Go</button></div>',
                frag = Bosonic.createDocumentFragment();
            frag.innerHTML = html;
            expect(frag.childNodes.length).to.equal(1);
            expect(frag.childNodes[0].childNodes.length).to.equal(2);
            expect(Bosonic.getHTMLFromFragment(frag.unwrap())).to.equal(html);
        });

        it('should work when the provided HTML has many root nodes', function() {
            var html = '<div><button>Go</button><a>Toto</a></div><div><h1>Test</h1></div>',
                frag = Bosonic.createDocumentFragment();
            frag.innerHTML = html;
            expect(frag.childNodes.length).to.equal(2);
            expect(frag.childNodes[0].childNodes.length).to.equal(2);
            expect(Bosonic.getHTMLFromFragment(frag.unwrap())).to.equal(html);
        });

        it('should remove all existing children before', function() {
            var html1 = '<div><button>Go</button><a>Toto</a></div><div><h1>Test</h1></div>',
                html2 = '<div><div><h1>Test</h1></div><button>Go</button></div>',
                frag = Bosonic.createDocumentFragment();
            frag.innerHTML = html1;
            frag.innerHTML = html2;
            expect(frag.childNodes.length).to.equal(1);
            expect(Bosonic.getHTMLFromFragment(frag.unwrap())).to.equal(html2);
        });
    });

    it('should return a wrapped fragment when cloned', function() {
        var frag = Bosonic.createDocumentFragment(),
            clone = frag.cloneNode(true);
        expect(clone instanceof DocumentFragmentWrapper).to.be.true;
    });

    it('may be unwrapped', function() {
        document.body.innerHTML = '<div><a>Titi</a><p>Tata</p></div>';
        var div = document.querySelector('div'),
            frag = Bosonic.createDocumentFragment(div);
        expect(frag).to.respondTo('unwrap');
        expect(frag.unwrap() instanceof DocumentFragment).to.be.true;
    });

    describe('Nodes identification', function() {
        it('should give a GUID to all fragment nodes when first wrapped', function() {
            document.body.innerHTML = '<div><div><h1>Test</h1></div><button>Go</button></div>';
            var div = document.querySelector('div'),
                frag = Bosonic.createDocumentFragment(div);
            expect(frag.childNodes[0].hasAttribute('data-b-guid')).to.be.true;
            expect(frag.childNodes[0].childNodes[0].hasAttribute('data-b-guid')).to.be.true;
            expect(frag.childNodes[1].hasAttribute('data-b-guid')).to.be.true;
        });

        it('should give a GUID to all fragment nodes when its innerHTML is set', function() {
            var html = '<div><div><h1>Test</h1></div><button>Go</button></div>',
                frag = Bosonic.createDocumentFragment();
            frag.innerHTML = html;
            expect(frag.childNodes[0].hasAttribute('data-b-guid')).to.be.true;
            expect(frag.childNodes[0].childNodes[1].hasAttribute('data-b-guid')).to.be.true;
        });

        it('should remove GUIDs when unwrapped', function() {
            var html = '<div><div><h1>Test</h1></div><button>Go</button></div>',
                frag = Bosonic.createDocumentFragment();
            frag.innerHTML = html;
            frag = frag.unwrap();
            expect(frag.childNodes[0].hasAttribute('data-b-guid')).to.be.false;
            expect(frag.childNodes[0].childNodes[1].hasAttribute('data-b-guid')).to.be.false;
        });

        it('should give a GUID to a newly appended node', function() {
            var html = '<div><div><h1>Test</h1></div><button>Go</button></div>',
                frag = Bosonic.createDocumentFragment();
            frag.innerHTML = html;
            frag.appendChild(document.createElement('span'));
            expect(frag.childNodes[1].hasAttribute('data-b-guid')).to.be.true;
        });
    });

    describe('DOM updates', function() {
        var frag;

        beforeEach(function() {
            document.body.innerHTML = '<div><div><h1>Test</h1></div><button>Go</button></div>';
            frag = Bosonic.createDocumentFragment(document.querySelector('div'));
        });

        it('should dispatch a "update" event when its innerHTML is set', function(done) {
            frag.addEventListener('update', function(event) {
                expect(event.target).to.equal(frag.target);
                done();
            });
            frag.innerHTML = '<div><a>Titi</a><p>Tata</p></div>';
        });

        describe('when it gets a child', function() {
            it('should dispatch a "update" event', function(done) {
                frag.addEventListener('update', function(event) {
                    expect(event.target).to.equal(frag.target);
                    done();
                });
                frag.appendChild(document.createElement('div'));
            });

            it('should forward the call', function() {
                frag.appendChild(document.createElement('div'));
                expect(frag.childNodes.length).to.equal(3);
                expect(frag.target.childNodes.length).to.equal(3);
            });
        });
    });

    describe('DOM queries', function() {
        var frag;

        beforeEach(function() {
            document.body.innerHTML = '<div><div><h1>Test</h1></div><button>Go</button><button class="cancel">Cancel</button></div>';
            frag = Bosonic.createDocumentFragment(document.querySelector('div'));
        });

        describe('when using querySelector', function() {
            it('should return an instrumented node', function() {
                var button = frag.querySelector('button.cancel');
                expect(button).to.respondTo('__addEventListener__');
                expect(button).to.respondTo('__removeEventListener__');
            });
        });
    });

    describe('Instrumented Nodes', function() {
        var frag, node, listener;

        beforeEach(function() {
            document.body.innerHTML = '<div><div><h1>Test</h1></div><button>Go</button><button class="cancel">Cancel</button></div>';
            frag = Bosonic.createDocumentFragment(document.querySelector('div'));
            node = frag.querySelector('button.cancel');
            listener = function(e) { console.log('hello'); };
        });

        describe('when adding an event listener', function() {
            it('should register the listener with its parent fragment', function() {
                node.addEventListener('click', listener, false);
                expect(frag.registeredListeners.length).to.equal(1);
                var registeredListener = frag.registeredListeners[0];
                expect(registeredListener).to.have.property('guid');
                expect(registeredListener).to.have.property('type', 'click');
                expect(registeredListener).to.have.property('listener', listener);
                expect(registeredListener).to.have.property('useCapture', false);
            });
        });

        describe('when removing an event listener', function() {
            it('should unregister the listener with its parent fragment', function() {
                node.addEventListener('click', listener, false);
                node.removeEventListener('click', listener, false);
                expect(frag.registeredListeners.length).to.equal(0);
            });
        });
    });

    describe('Registered listeners', function() {

        describe('when registering a listener', function() {
            it('should dispatch a "addListener" event', function(done) {
                var frag = Bosonic.createDocumentFragment(),
                    listener = function(e) { console.log('hello'); };
                frag.addEventListener('addListener', function(e) {
                    expect(e.detail).to.have.property('guid', '1234');
                    expect(e.detail).to.have.property('type', 'click');
                    expect(e.detail).to.have.property('listener', listener);
                    expect(e.detail).to.have.property('useCapture', false);
                    done();
                }, false);
                frag.registerListener('1234', 'click', listener, false);
            });
        });

        describe('when unregistering a listener', function() {
            it('should dispatch a "removeListener" event', function(done) {
                var frag = Bosonic.createDocumentFragment(),
                    listener = function(e) { console.log('hello'); };
                frag.addEventListener('removeListener', function(e) {
                    expect(e.detail).to.have.property('guid', '1234');
                    expect(e.detail).to.have.property('type', 'click');
                    expect(e.detail).to.have.property('listener', listener);
                    expect(e.detail).to.have.property('useCapture', false);
                    done();
                }, false);
                frag.registerListener('1234', 'click', listener, false);
                frag.unregisterListener('1234', 'click', listener, false);
            });
        });
    });
});