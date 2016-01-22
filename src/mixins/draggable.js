function getComputedDimensions(node) {
    var c = window.getComputedStyle(node),
        p = function(v) {
            return parseInt(v.replace('px', ''));
        };
    var width = p(c.width), height = p(c.height),
        mLeft = p(c.marginLeft), mRight = p(c.marginRight), mTop = p(c.marginTop), mBottom = p(c.marginBottom),
        pLeft = p(c.paddingLeft), pRight = p(c.paddingRight), pTop = p(c.paddingTop), pBottom = p(c.paddingBottom),
        bLeft = p(c.borderLeftWidth), bRight = p(c.borderRightWidth), bTop = p(c.borderTopWidth), bBottom = p(c.borderBottomWidth),
        offsetWidth = width + pLeft + pRight + bLeft + bRight,
        offsetHeight = height + pTop + pBottom + bTop + bBottom;

    return {
        offsetWidth: offsetWidth, offsetHeight: offsetHeight,
        borderLeftWidth: bLeft, borderRightWidth: bRight,
        borderTopWidth: bTop, borderBottomWidth: bBottom,
        paddingLeft: pLeft, paddingRight: pRight,
        paddingTop: pTop, paddingBottom: pBottom,
        outerWidth: offsetWidth + mLeft + mRight,
        outerHeight: offsetHeight + mTop + mBottom
    };
}

Bosonic.Draggable = {
    injected: function(options) {
        this.__draggableOptions = options || {};
        var handle = options.handle || this;
        this.listen(handle, 'track', 'handleTrack');
    },

    handleTrack: function(e) {
        e.preventDefault();
        var state = e.detail.state;
        switch(state) {
            case 'start':
                this.dragStart();
                break;
            case 'track':
                this.drag(e.detail);
                break;
            case 'end':
                this.dragStop();
                break;
        }
    },

    dragStart: function(e) {
        // We must defer the constraints calculus to the first drag to be sure the CSS is applied to the container & target
        if (this.isContained() && !this.__draggableOptions.constraints) this.initContainment();
        
        var target = this,
            targetStyle = window.getComputedStyle(target);
        if (!targetStyle.position.match(/^(?:r|a|f)/)) {
            target.style.position = 'relative';
        }
        this._dragTranslation = { left: 0, top: 0 };
        this._startDragPosition = {
            left: this.parseSidePosition(targetStyle.left),
            top: this.parseSidePosition(targetStyle.top)
        };

        document.body.style.cursor = 'move';
    },

    drag: function(detail) {
        var target = this;
        if (!this.isHorizontallyConstrained()) this.updateSidePosition('left', detail.ddx);
        if (!this.isVerticallyConstrained()) this.updateSidePosition('top', detail.ddy);
        this.transform('translate3d(' + this._dragTranslation.left +'px,' + this._dragTranslation.top + 'px,0)', target);
    },

    dragStop: function() {
        var target = this;
        this.fixSidePosition('left');
        this.fixSidePosition('top');
        this.transform('', target);
        document.body.style.cursor = '';
    },

    initContainment: function() {
        var contain = getComputedDimensions(this.getContainer()),
            target = getComputedDimensions(this);
        
        this.__draggableOptions.constraints = {
            left: {
                min: contain.borderLeftWidth + contain.paddingLeft,
                max: contain.offsetWidth - contain.borderRightWidth - contain.paddingRight - target.outerWidth
            },
            top: {
                min: contain.borderTopWidth + contain.paddingTop,
                max: contain.offsetHeight - contain.borderBottomWidth - contain.paddingBottom - target.outerHeight
            }
        }
    },

    parseSidePosition: function(position) {
        return position !== 'auto' ? parseInt(position.replace('px', '')) : 0;
    },

    fixSidePosition: function(side) {
        var target = this,
            value = this._startDragPosition[side] + this._dragTranslation[side];
        
        target.style[side] = value + 'px';
    },

    updateSidePosition: function(side, diff) {
        var constraints = this.__draggableOptions.constraints,
            currentPos = this._startDragPosition[side] + this._dragTranslation[side],
            newPos = currentPos + diff;
        
        if (!this.isContained() || (newPos >= constraints[side].min && constraints[side].max > newPos)) {
            this._dragTranslation[side]+= diff;
        }
    },

    transform: function(transform, node) {
        node = node || this;
        node.style.webkitTransform = transform;
        node.style.transform = transform;
    },

    isContained: function() {
        return !!this.__draggableOptions.containment;
    },

    getContainer: function() {
        var attr = this.__draggableOptions.containment;
        return attr === 'parent' ? this.parentElement : this.querySelector(attr);
    },

    isVerticallyConstrained: function() {
        return this.__draggableOptions.axis === 'x';
    },

    isHorizontallyConstrained: function() {
        return this.__draggableOptions.axis === 'y';
    }
};