Bosonic.Selection = {
    get selectedItemIndex() {
        return this.hasAttribute('selected') ? Number(this.getAttribute('selected')) : null;
    },

    get selectedItem() {
        return this.getItem(this.selectedItemIndex);
    },

    select: function(index) {
        if (index !== this.selectedItemIndex) {
            this.setAttribute('selected', index);
        }
    },

    unselect: function() {
        if (this.hasAttribute('selected')) {
            this.removeAttribute('selected');
        }
    },

    selectFirst: function() {
        if (this.getItemCount() > 0) {
            this.select(0);
        }
    },

    selectLast: function() {
        if (this.getItemCount() > 0) {
            this.select(this.getItemCount() - 1);
        }
    },

    selectNextItem: function() {
        if (this.selectedItemIndex === null) {
            this.selectFirst();
            return;
        }
        if (this.selectedItemIndex < this.getItemCount() - 1) {
            this.select(this.selectedItemIndex + 1);
        }
    },

    selectPreviousItem: function() {
        if (this.selectedItemIndex === null) {
            this.selectLast();
            return;
        }
        if (this.selectedItemIndex > 0) {
            this.select(this.selectedItemIndex - 1);
        }
    },

    getItem: function(pos) {
        return this.getItems()[pos] || null;
    },

    getItemCount: function() {
        return this.getItems().length;
    },

    getItems: function() {
        var target = this.getAttribute('target');
        var nodes = target ? this.querySelectorAll(target) : this.children;
        return Array.prototype.slice.call(nodes, 0);
    }
};