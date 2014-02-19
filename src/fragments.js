    
    function setFragmentInnerHTML(fragment, html) {
        while (fragment.childNodes.length > 0) {
            fragment.removeChild(fragment.childNodes[0]);
        }
        var tmp = document.createElement('body'), child;
        tmp.innerHTML = html;
        while (child = tmp.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    }

    function getFragmentInnerHTML(fragment) {
        var tmp = document.createElement('body');
        tmp.appendChild(fragment.cloneNode(true));
        return tmp.innerHTML;
    }

    function enhanceFragment(fragment) {
        Object.defineProperty(fragment, 'innerHTML', {
            enumerable: true,
            set: function(html) {
                setFragmentInnerHTML(this, html);
            },
            get: function() {
                return getFragmentInnerHTML(this);
            }
        });
        var cloneNode = fragment.cloneNode;
        Object.defineProperty(fragment, 'cloneNode', {
            enumerable: true,
            value: function(deep) {
                var clone = cloneNode.call(this, deep);
                enhanceFragment(clone);
                return clone;
            }
        });
    }

    function createEnhancedDocumentFragment(fromNode) {
        var fragment = document.createDocumentFragment();
        if (fromNode) {
            while (child = fromNode.firstChild) {
                fragment.appendChild(child);
            }
        }
        enhanceFragment(fragment);
        return fragment;
    }
