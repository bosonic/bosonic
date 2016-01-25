Bosonic.Collapsible = {
    injected: function(target) {
        this.__collapsible = target || this;
        this.__dimension = 'height';
        this.__duration = 300;
    },

    expand: function(noTransition) {
        if (!this.dispatchEvent(new CustomEvent(this.__elementName + '-expand', { cancelable: true }))) return;

        this.toggleOpenAttribute(false);
        if (!noTransition) {
            this.setSize('auto');
            var s = this.computeSize();
            this.setSize(0);
            this.transition(this.__collapsible, function(collapsible) {
                window.requestAnimationFrame(function() {
                    this.setTransitionDuration(this.__duration);
                    this.setSize(s);
                }.bind(this));
            }, function(collapsible) {
                this.setTransitionDuration(null);
            });
        }
    },

    collapse: function(noTransition) {
        if (!this.dispatchEvent(new CustomEvent(this.__elementName + '-collapse', { cancelable: true }))) return;

        if (noTransition) {
            this.toggleOpenAttribute(true);
            return;
        }
        this.setSize(this.computeSize());
        this.transition(this.__collapsible, function(collapsible) {
            window.requestAnimationFrame(function() {
                this.setTransitionDuration(this.__duration);
                this.setSize(0);
            }.bind(this));
        }, function(collapsible) {
            this.setTransitionDuration(null);
            this.toggleOpenAttribute(true);
        });
    },

    computeSize: function() {
        // if we want to remove the content wrapper, we'd need to subtract the padding here
        return window.getComputedStyle(this.__collapsible)[this.__dimension];
    },

    setSize: function(size) {
        this.__collapsible.style[this.__dimension] = size;
    },

    setTransitionDuration: function(duration) {
        this.__collapsible.style.webkitTransition = this.__collapsible.style.transition = duration ? (this.__dimension + ' ' + duration + 'ms') : null;
    },

    toggleOpenAttribute: function(collapsed) {
        collapsed ? this.removeAttribute('open') : this.setAttribute('open', '');
    }
};