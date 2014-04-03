
    if (Platform.test) {
        window.DocumentFragmentWrapper = DocumentFragmentWrapper;

        window.Bosonic = {
            createDocumentFragment: createWrappedDocumentFragment,
            createTemplateElement: createTemplateElement,
            createFragmentFromHTML: createFragmentFromHTML,
            getHTMLFromFragment: getFragmentInnerHTML,
            removeNodeIDs: removeNodeIDs,
            renderComposedDOM: renderComposedDOM
        }
    }
}());