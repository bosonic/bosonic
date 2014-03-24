    var Bosonic;

    if (Platform.test) {
        window.DocumentFragmentWrapper = DocumentFragmentWrapper;

        Bosonic = {
            createDocumentFragment: createWrappedDocumentFragment,
            createTemplateElement: createTemplateElement,
            createFragmentFromHTML: createFragmentFromHTML,
            getHTMLFromFragment: getFragmentInnerHTML,
            removeNodeIDs: removeNodeIDs,
            renderComposedDOM: renderComposedDOM,
            registerElement: registerElement,
            registerMixin: registerMixin
        }
    } else {
        Bosonic = {
            registerElement: registerElement
        }
    }
    
    window.Bosonic = Bosonic;
}());