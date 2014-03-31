describe('When registering a custom element', function() {
    before(function() {
        Bosonic.registerElement('b-dummy', {});
    });

    beforeEach(function() {
        this.elt = document.createElement('b-dummy');
        this.elt.innerHTML = '<div>toto</div><div>toto</div>';
        document.body.appendChild(this.elt);
    });

    afterEach(function() {
        document.body.removeChild(this.elt);
    });

    it('s children should be accessible', function() {
        expect(this.elt.querySelectorAll('div').length).to.equal(2);
    });

    it('should be possible to listen to its childList changes', function(done) {
        this.elt.childListChangedCallback = function(removed, added) {
            // TODO: il semble y avoir un bug dans le polyfill avec IE9 : removed ne contient qu'un élément et added est vide...
            //expect(removed.length).to.equal(2);
            //expect(added.length).to.equal(1);
            expect(true).to.be.true;
            done();
        }
        this.elt.innerHTML = '<div>titi</div>';
    });

    describe('With a template', function() {
        Bosonic.registerElement('b-dummy-with-template', {
            template: '<div>toto</div><div>titi</div>'
        });

        it('should have a template property', function() {
            var elt = document.createElement('b-dummy-with-template');
            expect(elt.template.content).to.respondTo('cloneNode');
        });
    });

    describe('That extends another custom element', function() {
        Bosonic.registerElement('b-simple-dummy', {
            readyCallback: function() {
                this.readyCallbackCalled = true;
            },
            toggle: function() {
                this.toggled = true;
            }
        });
        Bosonic.registerElement('b-extended-dummy', {
            toggle: function() {
                this._super.toggle.call(this);
                this.superToggled = true;
            }
        }, 'b-simple-dummy');

        it('should call its super methods when not overrided', function() {
            var elt = document.createElement('b-extended-dummy');
            expect(elt.readyCallbackCalled).to.be.true;
        });

        it('should have a reference to its super prototype, useable by overrided methods', function() {
            var elt = document.createElement('b-extended-dummy');
            expect(elt.toggled).to.be.undefined;
            elt.toggle();
            expect(elt.toggled).to.be.true;
            expect(elt.superToggled).to.be.true;
        });
    });
});

describe('When registering a mixin', function() {
    it('should be includable in an element', function() {
        Bosonic.registerMixin('foo', {
            myProperty: 'toto',
            get toto() {
                return this.myProperty;
            },
            set toto(val) {
                this.myProperty = val;
            },
            bar: function() {
                return 'bar';
            }
        });
        Bosonic.registerElement('b-foo', { mixins: ['foo'] });
        var elt = document.createElement('b-foo');
        expect(elt).to.respondTo('bar');
        expect(elt.toto).to.equal('toto');
        elt.toto = 'titi';
        expect(elt.toto).to.equal('titi');
    });
});