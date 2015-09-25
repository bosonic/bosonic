Bosonic.Dom = {
    created: function() {
        if (this.hostAttributes) {
            for (var attrName in this.hostAttributes) {
                this.setAttribute(attrName, this.hostAttributes[attrName]);
            }
        }
    },

    toggleClass: function(name, bool, node) {
        node = node || this;
        if (arguments.length == 1) {
            bool = !node.classList.contains(name);
        }
        bool ? node.classList.add(name) : node.classList.remove(name);
    }
};