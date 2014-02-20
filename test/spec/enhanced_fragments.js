describe('Enhanced Document Fragments', function() {
    describe('creation from node', function() {
        document.body.innerHTML = '<div id="toto"><a>Titi</a><p>Tata</p></div>';
        var div = document.querySelector('#toto'),
            frag = Bosonic.createDocumentFragment(div);

        it('should transfer the node children to the fragment', function() {
            expect(frag.childNodes.length).to.equal(2);
            expect(div.childNodes.length).to.equal(0);
        });
    });

    describe('creation from HTML', function() {
        var frag = Bosonic.createFragmentFromHTML('<div id="toto"><a>Titi</a><p>Tata</p></div>');

        it('should work ;)', function() {
            expect(frag.childNodes.length).to.equal(1);
            expect(frag.childNodes[0].childNodes.length).to.equal(2);
        });
    });

    describe('innerHTML support', function() {
        it('should work when the provided HTML has only one root node', function() {
            var html = '<div><div><h1>Test</h1></div><button>Go</button></div>',
                frag = Bosonic.createDocumentFragment();
            frag.innerHTML = html;
            expect(frag.childNodes.length).to.equal(1);
            expect(frag.childNodes[0].childNodes.length).to.equal(2);
            expect(frag.innerHTML).to.equal(html);
        });

        it('should work when the provided HTML has many root nodes', function() {
            var html = '<div><button>Go</button><a>Toto</a></div><div><h1>Test</h1></div>',
                frag = Bosonic.createDocumentFragment();
            frag.innerHTML = html;
            expect(frag.childNodes.length).to.equal(2);
            expect(frag.childNodes[0].childNodes.length).to.equal(2);
            expect(frag.innerHTML).to.equal(html);
        });

        it('should remove all existing children before', function() {
            var html1 = '<div><button>Go</button><a>Toto</a></div><div><h1>Test</h1></div>',
                html2 = '<div><div><h1>Test</h1></div><button>Go</button></div>',
                frag = Bosonic.createDocumentFragment();
            frag.innerHTML = html1;
            frag.innerHTML = html2;
            expect(frag.childNodes.length).to.equal(1);
            expect(frag.innerHTML).to.equal(html2);
        });
    });

    describe('when cloned', function() {
        it('should be enhanced too', function() {
            var frag = Bosonic.createDocumentFragment(),
                clone = frag.cloneNode(true);
            expect(clone.innerHTML).to.not.be.undefined;
        });
    });
});