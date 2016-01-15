Bosonic.Removable = {
    injected: function() {
        var btn = document.createElement('button');
        btn.classList.add(this.__elementName + '-remove');
        btn.textContent = '×';
        this.insertBefore(btn, this.firstChild);
        this.listenOnce(btn, 'pointerup', this.__onRemoveButtonTap);
    },

    __onRemoveButtonTap: function() {
        this.parentNode.removeChild(this);
    }
};