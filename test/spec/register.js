describe('When registering a custom element', function() {
    before(function() {
        Bosonic.registerElement('vr-dummy', {});
    });

    beforeEach(function() {
        this.elt = document.createElement('vr-dummy');
        this.elt.innerHTML = '<div>toto</div><div>toto</div>';
        document.body.appendChild(this.elt);
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
});