    
    function handleChildListMutations(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.__upgraded__) {
                var elt = mutation.target;
                logFlags.dom && console.log('children change', elt);
                if (elt.childListChangedCallback) {
                    elt.childListChangedCallback(mutation.removedNodes, mutation.addedNodes);
                }
            }
        }, this);
    }

    var childListObserver = new MutationObserver(handleChildListMutations.bind(this));

    window.addEventListener('WebComponentsReady', function() {
        childListObserver.observe(document, { childList: true, subtree: true });
    });