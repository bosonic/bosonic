describe("Web component lifecycle", function() {
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

    it("should called createdCallback when created", function() {
        var elt = document.createElement('x-foo');
        expect(elt.createdCallbackCalled).to.be.true;
        expect(elt.attachedCallbackCalled).to.be.undefined;
    });

    // it("should called attachedCallback when appended", function(done) {
    //     var elt = document.createElement('x-foo');
    //     document.body.appendChild(elt);
    //     wait(function() {
    //         expect(elt.attachedCallbackCalled).to.be.true;
    //         expect(elt.detachedCallbackCalled).to.be.undefined;
    //         done();
    //     });
    // });

    // it("should called detachedCallback when removed", function(done) {
    //     var elt = document.createElement('x-foo');
    //     document.body.appendChild(elt);
    //     wait(function() {
    //         document.body.removeChild(elt);
    //         wait(function() {
    //             expect(elt.detachedCallbackCalled).to.be.true;
    //             done();
    //         });
    //     });
    // });
});