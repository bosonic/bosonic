describe("Custom elements usage", function() {
    
    var declarationsTestSuite = function() {
        it("should be queryable", function() {
            expect(document.body.querySelector('x-bar')).to.not.be.undefined;
        });

        it("should expose its API", function() {
            expect(document.body.querySelector('x-bar')).to.respondTo('hello');
        });
    };

    document.register('x-bar', { // registerElement now ?
        prototype: Object.create(HTMLElement.prototype, {
            hello: {
                value: function() {
                    return 'hello';
                }
            }
        })
    });

    describe("HTML tag", function() {
        before(function() {
            document.body.innerHTML = '<x-bar></x-bar>';
            CustomElements.takeRecords();
        });
        
        declarationsTestSuite();

        after(function() {
            document.body.innerHTML = '';
        });
    });

    describe("document.createElement()", function() {
        before(function() {
            var elt = document.createElement('x-bar');
            document.body.appendChild(elt);
        });
        
        declarationsTestSuite();

        after(function() {
            document.body.innerHTML = '';
        });
    });
});

describe("Web component lifecycle", function() {
    var XFooPrototype = Object.create(HTMLElement.prototype);
    var XFoo = document.registerElement('x-foo', {
      prototype: XFooPrototype
    });

    // TODO: Currently breaks with Chrome 33... No idea why...

    // it("should called createdCallback when created", function(done) {
    //     XFooPrototype.createdCallback = function() {
    //         assert.ok(true);
    //         done();
    //     };
    //     document.createElement('x-foo');
    // });

    it("should called attachedCallback when appended", function(done) {
        XFooPrototype.attachedCallback = function() {
            assert.ok(true);
            done();
        };
        var elt = document.createElement('x-foo');
        document.body.appendChild(elt);
        //document.body.innerHTML = '<x-foo></x-foo>';
    });

    it("should called detachedCallback when removed", function(done) {
        var left = false;
        XFooPrototype.detachedCallback = function() {
            left = true;
        };
        var elt = document.createElement('x-foo');
        document.body.appendChild(elt);
        CustomElements.takeRecords();
        document.body.removeChild(elt);
        CustomElements.takeRecords();
        //window.requestAnimationFrame(function() { // ne marche qu'avec IE >= 10...
            expect(left).to.be.true;
            done();
        //});
    });
});