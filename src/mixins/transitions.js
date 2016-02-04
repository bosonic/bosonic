Bosonic.TransitionsRegistry = {};

Bosonic.Transitions = {
    playTransition: function(stateChange, node) {
        node = node || this;
        var host = this,
            config = this.getTransitionConfig(stateChange, host),
            transitioner = new Transitioner(node);

        if (!config) {
            return transitioner;
        }
        return config.play.call(transitioner, node, config);
    },

    registerTransition: function(transitionName, config) {
        Bosonic.TransitionsRegistry[transitionName] = config;
    },

    getTransitionConfig: function(stateChange, host) {
        var attr = stateChange + '-transition';
        if (!host.hasAttribute(attr)) return;
        var transitionName = host.getAttribute(attr),
            config = Bosonic.TransitionsRegistry[transitionName];
        if (!config) {
            console.warn(transitionName + ' transition not found');
        }
        return config;
    }
};

Bosonic.Transitions.TRANSITION_CLASS = 'b-transitioning';

Bosonic.Transitions.TRANSITION_END = (function() {
    var el = document.createElement('div');
    return el.style.WebkitTransition !== undefined // Safari 6 & Android Browser < 4.3
        ? 'webkitTransitionEnd' : 'transitionend';
})();

Bosonic.Transitions.registerTransition('collapse-height', {
    play: function(node, config) {
        // fix height
        node.style.height = window.getComputedStyle(node).height;
        
        return this.set('height', 0)
                   .duration(config.duration || 300);
    }
});

Bosonic.Transitions.registerTransition('expand-height', {
    play: function(node, config) {
        // process node height
        node.style.height = 'auto';
        var s = window.getComputedStyle(node).height;
        node.style.height = '0px';
        
        return this.set('height', s)
                   .duration(config.duration || 300);
    }
});

Bosonic.Transitions.registerTransition('fade-in', {
    play: function(node, config) {
        node.style.opacity = 0;
        return this.duration(config.duration || 150)
                   .set('opacity', 1);
    }
});

Bosonic.Transitions.registerTransition('fade-out', {
    play: function(node, config) {
        node.style.opacity = 1;
        return this.duration(config.duration || 150)
                   .set('opacity', 0);
    }
});

// Code heavily inspired by Move.js (https://github.com/visionmedia/move.js)
function Transitioner(node, host) {
    node.classList.add(Bosonic.Transitions.TRANSITION_CLASS);
    this.node = node;
    this.host = host;
    this.properties = {};
    this.transitionProps = [];
    this.transforms = [];
};

Transitioner.prototype.set = function(prop, val) {
    this.transition(prop);
    this.properties[prop] = val;
    return this;
};

Transitioner.prototype.setProperty = function(prop, val) {
    this.properties[prop] = val;
    return this;
};

Transitioner.prototype.transition = function(prop) {
    if (!this.transitionProps.indexOf(prop)) return this;
    this.transitionProps.push(prop);
    return this;
};

Transitioner.prototype.duration = function(duration) {
    return this.setVendorProperty('transition-duration', duration + 'ms');
};

Transitioner.prototype.setVendorProperty = function(prop, val) {
    var mapping = {
        'transition-duration': ['transitionDuration', 'webkitTransitionDuration']
    };
    if (!mapping[prop]) return this.setProperty(prop, val);
    mapping[prop].forEach(function(vendorProp) {
        this.setProperty(vendorProp, val);
    }, this);
    return this;
};

Transitioner.prototype.end = function(fn) {
    // if the user specified a non-existing animation
    if (Object.keys(this.properties).length === 0 && this.transitionProps.length === 0) {
        if (fn) fn();
        return;
    }
    if (this.transforms.length > 0) {
        this.setVendorProperty('transform', this.transforms.join(' '));
    }
    this.setVendorProperty('transition-properties', this.transitionProps.join(', '));


    var self = this,
        node = this.node,
        eventName = Bosonic.Transitions.TRANSITION_END,
        endHandler = function() {
            self.reset();
            node.classList.remove(Bosonic.Transitions.TRANSITION_CLASS);
            if (fn) fn();
            node.removeEventListener(eventName, endHandler, false);
        };
    node.addEventListener(eventName, endHandler, false);

    window.requestAnimationFrame(function() {
        this.applyProperties();
    }.bind(this));
    return this;
};

Transitioner.prototype.applyProperties = function() {
    for (var prop in this.properties) {
        this.node.style[prop] = this.properties[prop];
    }
    return this;
};

Transitioner.prototype.reset = function() {
    this.node.style.transitionDuration = 
    this.node.style.webkitTransitionDuration = '';
    return this;
};
