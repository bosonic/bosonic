'use strict';
/*eslint no-undef:0*/
/*eslint no-unused-expressions:0*/

describe('Web component lifecycle', function() {
    var XFooPrototype = Object.create(HTMLElement.prototype, {
        createdCallback: {
            value: function() {
                this.createdCallbackCalled = true;
            }
        },
        attachedCallback: {
            value: function() {
                this.attachedCallbackCalled = true;
            }
        },
        detachedCallback: {
            value: function() {
                this.detachedCallbackCalled = true;
            }
        }
    });
    var XFoo = document.registerElement('x-foo', {
      prototype: XFooPrototype
    });

    it('should called createdCallback when created', function() {
        var elt = document.createElement('x-foo');
        expect(elt.createdCallbackCalled).to.be.true;
        expect(elt.attachedCallbackCalled).to.be.undefined;
    });

    it('should called attachedCallback when appended', function() {
        return createCustomElement('x-foo').then(function(elt) {
            expect(elt.attachedCallbackCalled).to.be.true;
            expect(elt.detachedCallbackCalled).to.be.undefined;
        });
    });

    it('should called detachedCallback when removed', function() {
        return createCustomElement('x-foo').then(function(elt) {
            document.body.removeChild(elt);
            return elt;
        }).then(function(elt) {
            expect(elt.detachedCallbackCalled).to.be.true;
        });
    });
});
