Bosonic.Selection = {
    get multiple() {
        if (this._multiple === undefined) {
            this._multiple = this.hasAttribute('multiple');
        }
        return this._multiple;
    },

    set multiple(value) {
        this._multiple = !!value;
    },

    get selectedIndex() {
        return this._selected.length === 0 ? -1 : this._selected[0];
    },

    set selectedIndex(value) {
        this._selected.forEach(function(index) {
            this.unselect(index);
        }, this);
        this.select(value);
    },

    get selectedItems() {
        return this._selected;
    },

    created: function() {
        this._selected = [];
        if (this.hasAttribute('selected')) {
            this.selectedIndex = Number(this.getAttribute('selected'));
        }
    },

    select: function(index) {
        if (!this.multiple && this.selectedIndex !== -1) {
            this.unselect(this.selectedIndex);
        }
        this._select(index);
    },

    unselect: function(index) {
        var item = this._getItem(index);
        if (!item) return;
        item.removeAttribute('aria-selected');
        this._selected.splice(this._selected.indexOf(index), 1);
    },

    _select: function(index) {
        var item = this._getItem(index);
        if (!item) return;
        item.setAttribute('aria-selected', 'true');
        this._selected.push(index);
    },

    _getItem: function(index) {
        return this._getItems()[index] || null;
    },

    _getItemCount: function() {
        return this._getItems().length;
    },

    _getItems: function() {
        if (this.items) return this.items;
        var target = this.getAttribute('target');
        var nodes = target ? this.querySelectorAll(target) : this.children;
        return Array.prototype.slice.call(nodes, 0);
    }
};