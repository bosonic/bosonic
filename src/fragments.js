    
    //Generate four random hex digits.
    function S4() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }

    // Generate a pseudo-GUID by concatenating random hexadecimal.
    function guid() {
       return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }

    function identifyNodes(fragment) {
        var node, length = fragment.childNodes.length;
        for (var i = 0; i < length; i++) {
            node = fragment.childNodes[i];
            if (node.nodeType === 1 && !node.hasAttribute('data-b-guid')) {
                node.setAttribute('data-b-guid', guid());
            }
            if (node.childNodes.length > 0) {
                identifyNodes(node);
            }
        }
    }

    function removeNodeIDs(fragment) {
        var node, length = fragment.childNodes.length;
        for (var i = 0; i < length; i++) {
            node = fragment.childNodes[i];
            if (node.nodeType === 1 && node.hasAttribute('data-b-guid')) {
                node.removeAttribute('data-b-guid');
            }
            if (node.childNodes.length > 0) {
                removeNodeIDs(node);
            }
        }
        return fragment;
    }

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

    function createWrappedDocumentFragment(fromNode) {
        var fragment = document.createDocumentFragment();
        if (fromNode) {
            while (child = fromNode.firstChild) {
                fragment.appendChild(child);
            }
        }
        return wrap(fragment);
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
