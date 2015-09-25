Bosonic.Dom = {
    created: function() {
        if (this.hostAttributes) {
            for (var attrName in this.hostAttributes) {
                this.setAttribute(attrName, this.hostAttributes[attrName]);
            }
        }
    }
};