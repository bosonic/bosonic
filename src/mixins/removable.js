Bosonic.Removable = {
    injected: function() {
        var btn = document.createElement('button');
        btn.classList.add(this.__elementName + '-remove');
        btn.textContent = '×';
        var container = this.shadowRoot || this;
        container.insertBefore(btn, container.firstChild);
        this.listenOnce(btn, 'pointerup', this.__onRemoveButtonTap);
    },

    __onRemoveButtonTap: function() {
        this.parentNode.removeChild(this);
    }
};