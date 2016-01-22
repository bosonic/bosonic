Bosonic.Resizable = {
    injected: function() {
        var btn = document.createElement('button');
        btn.classList.add(this.__elementName + '-resize');
        btn.textContent = '×';
        var container = this.shadowRoot || this;
        container.appendChild(btn);
        this.listen(btn, 'track', '__trackResizeButton');
    },

    __trackResizeButton: function(e) {
        var state = e.detail.state;
        switch(state) {
            case 'start':
                this.__resizeButtonDragStart(e);
                break;
            case 'track':
                this.__resizeContainer(e.detail);
                break;
            case 'end':
                this.__resizeButtonDragStop(e.detail);
                break;
        }
    },
    
    __resizeButtonDragStart: function(e) {
        e.preventDefault();
        
        //this.classList.toggle('dragging');
        document.body.style.cursor = 'se-resize';

        var computed = getComputedStyle(this);
        this.__dimensions = {
            width: parseInt(computed.width),
            height: parseInt(computed.height)
        };
        this.__minDimensions = {
            width: parseInt(computed.minWidth) || 0,
            height: parseInt(computed.minHeight) || 0
        };
    },

    __resizeContainer: function(pointerState) {
        var newWidth = this.__dimensions.width + pointerState.dx,
            newHeight = this.__dimensions.height + pointerState.dy;

        if (newWidth > this.__minDimensions.width) {
            this.style.width = newWidth + 'px';
        }
        if (newHeight > this.__minDimensions.height) {
            this.style.height = newHeight + 'px';
        }
    },

    __resizeButtonDragStop: function(pointerState) {
        //this.classList.toggle('dragging');
        document.body.style.cursor = '';
    }
};