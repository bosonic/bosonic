describe('A wrapped DocumentFragment', function() {
    var frag, wrapped;

    beforeEach(function() {
        frag = Bosonic.createDocumentFragment(),
        wrapped = Bosonic.wrap(frag);
    });

    describe('when it gets a child', function() {
        it('should dispatch a "update" event when it gets a child', function(done) {
            wrapped.addEventListener('update', function(event) {
                expect(event.target).to.equal(frag);
                done();
            });
            wrapped.appendChild(document.createElement('div'));
        });

        it('should forward the call', function() {
            wrapped.appendChild(document.createElement('div'));
            expect(frag.childNodes.length).to.equal(1);
            expect(wrapped.childNodes.length).to.equal(1);
        });
    });
});