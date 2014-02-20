    
    function setFragmentInnerHTML(fragment, html) {
        while (fragment.childNodes.length > 0) {
            fragment.removeChild(fragment.childNodes[0]);
        }
        var div = fragment.appendChild(document.createElement('div'));
        div.innerHTML = html;
        while (child = div.firstChild) {
            fragment.insertBefore(child, div);
        }
        fragment.removeChild(div);
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

    function createFragmentFromHTML(html) {
        var frag = document.createDocumentFragment();
        setFragmentInnerHTML(frag, html);
        return frag;
    }

    function createTemplateElement(html) {
        return {
            content: createFragmentFromHTML(html)
        };
    }
