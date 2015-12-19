(function() {
/*!
 * PEP v0.4.1-pre | https://github.com/jquery/PEP
 * Copyright jQuery Foundation and other contributors | http://jquery.org/license
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.PointerEventsPolyfill = factory()
}(this, function () { 'use strict';

  /**
   * This is the constructor for new PointerEvents.
   *
   * New Pointer Events must be given a type, and an optional dictionary of
   * initialization properties.
   *
   * Due to certain platform requirements, events returned from the constructor
   * identify as MouseEvents.
   *
   * @constructor
   * @param {String} inType The type of the event to create.
   * @param {Object} [inDict] An optional dictionary of initial event properties.
   * @return {Event} A new PointerEvent of type `inType`, initialized with properties from `inDict`.
   */
  var MOUSE_PROPS = [
    'bubbles',
    'cancelable',
    'view',
    'detail',
    'screenX',
    'screenY',
    'clientX',
    'clientY',
    'ctrlKey',
    'altKey',
    'shiftKey',
    'metaKey',
    'button',
    'relatedTarget',
    'pageX',
    'pageY'
  ];

  var MOUSE_DEFAULTS = [
    false,
    false,
    null,
    null,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null,
    0,
    0
  ];

  function PointerEvent(inType, inDict) {
    inDict = inDict || Object.create(null);

    var e = document.createEvent('Event');
    e.initEvent(inType, inDict.bubbles || false, inDict.cancelable || false);

    // define inherited MouseEvent properties
    // skip bubbles and cancelable since they're set above in initEvent()
    for (var i = 2, p; i < MOUSE_PROPS.length; i++) {
      p = MOUSE_PROPS[i];
      e[p] = inDict[p] || MOUSE_DEFAULTS[i];
    }
    e.buttons = inDict.buttons || 0;

    // Spec requires that pointers without pressure specified use 0.5 for down
    // state and 0 for up state.
    var pressure = 0;
    if (inDict.pressure) {
      pressure = inDict.pressure;
    } else {
      pressure = e.buttons ? 0.5 : 0;
    }

    // add x/y properties aliased to clientX/Y
    e.x = e.clientX;
    e.y = e.clientY;

    // define the properties of the PointerEvent interface
    e.pointerId = inDict.pointerId || 0;
    e.width = inDict.width || 0;
    e.height = inDict.height || 0;
    e.pressure = pressure;
    e.tiltX = inDict.tiltX || 0;
    e.tiltY = inDict.tiltY || 0;
    e.pointerType = inDict.pointerType || '';
    e.hwTimestamp = inDict.hwTimestamp || 0;
    e.isPrimary = inDict.isPrimary || false;
    return e;
  }

  var _PointerEvent = PointerEvent;

  /**
   * This module implements a map of pointer states
   */
  var USE_MAP = window.Map && window.Map.prototype.forEach;
  var PointerMap = USE_MAP ? Map : SparseArrayMap;

  function SparseArrayMap() {
    this.array = [];
    this.size = 0;
  }

  SparseArrayMap.prototype = {
    set: function(k, v) {
      if (v === undefined) {
        return this.delete(k);
      }
      if (!this.has(k)) {
        this.size++;
      }
      this.array[k] = v;
    },
    has: function(k) {
      return this.array[k] !== undefined;
    },
    delete: function(k) {
      if (this.has(k)) {
        delete this.array[k];
        this.size--;
      }
    },
    get: function(k) {
      return this.array[k];
    },
    clear: function() {
      this.array.length = 0;
      this.size = 0;
    },

    // return value, key, map
    forEach: function(callback, thisArg) {
      return this.array.forEach(function(v, k) {
        callback.call(thisArg, v, k, this);
      }, this);
    }
  };

  var _pointermap = PointerMap;

  var CLONE_PROPS = [

    // MouseEvent
    'bubbles',
    'cancelable',
    'view',
    'detail',
    'screenX',
    'screenY',
    'clientX',
    'clientY',
    'ctrlKey',
    'altKey',
    'shiftKey',
    'metaKey',
    'button',
    'relatedTarget',

    // DOM Level 3
    'buttons',

    // PointerEvent
    'pointerId',
    'width',
    'height',
    'pressure',
    'tiltX',
    'tiltY',
    'pointerType',
    'hwTimestamp',
    'isPrimary',

    // event instance
    'type',
    'target',
    'currentTarget',
    'which',
    'pageX',
    'pageY',
    'timeStamp'
  ];

  var CLONE_DEFAULTS = [

    // MouseEvent
    false,
    false,
    null,
    null,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null,

    // DOM Level 3
    0,

    // PointerEvent
    0,
    0,
    0,
    0,
    0,
    0,
    '',
    0,
    false,

    // event instance
    '',
    null,
    null,
    0,
    0,
    0,
    0
  ];

  var HAS_SVG_INSTANCE = (typeof SVGElementInstance !== 'undefined');

  /**
   * This module is for normalizing events. Mouse and Touch events will be
   * collected here, and fire PointerEvents that have the same semantics, no
   * matter the source.
   * Events fired:
   *   - pointerdown: a pointing is added
   *   - pointerup: a pointer is removed
   *   - pointermove: a pointer is moved
   *   - pointerover: a pointer crosses into an element
   *   - pointerout: a pointer leaves an element
   *   - pointercancel: a pointer will no longer generate events
   */
  var dispatcher = {
    pointermap: new _pointermap(),
    eventMap: Object.create(null),
    captureInfo: Object.create(null),

    // Scope objects for native events.
    // This exists for ease of testing.
    eventSources: Object.create(null),
    eventSourceList: [],
    /**
     * Add a new event source that will generate pointer events.
     *
     * `inSource` must contain an array of event names named `events`, and
     * functions with the names specified in the `events` array.
     * @param {string} name A name for the event source
     * @param {Object} source A new source of platform events.
     */
    registerSource: function(name, source) {
      var s = source;
      var newEvents = s.events;
      if (newEvents) {
        newEvents.forEach(function(e) {
          if (s[e]) {
            this.eventMap[e] = s[e].bind(s);
          }
        }, this);
        this.eventSources[name] = s;
        this.eventSourceList.push(s);
      }
    },
    register: function(element) {
      var l = this.eventSourceList.length;
      for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {

        // call eventsource register
        es.register.call(es, element);
      }
    },
    unregister: function(element) {
      var l = this.eventSourceList.length;
      for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {

        // call eventsource register
        es.unregister.call(es, element);
      }
    },
    contains: /*scope.external.contains || */function(container, contained) {
      try {
        return container.contains(contained);
      } catch (ex) {

        // most likely: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
        return false;
      }
    },

    // EVENTS
    down: function(inEvent) {
      inEvent.bubbles = true;
      this.fireEvent('pointerdown', inEvent);
    },
    move: function(inEvent) {
      inEvent.bubbles = true;
      this.fireEvent('pointermove', inEvent);
    },
    up: function(inEvent) {
      inEvent.bubbles = true;
      this.fireEvent('pointerup', inEvent);
    },
    enter: function(inEvent) {
      inEvent.bubbles = false;
      this.fireEvent('pointerenter', inEvent);
    },
    leave: function(inEvent) {
      inEvent.bubbles = false;
      this.fireEvent('pointerleave', inEvent);
    },
    over: function(inEvent) {
      inEvent.bubbles = true;
      this.fireEvent('pointerover', inEvent);
    },
    out: function(inEvent) {
      inEvent.bubbles = true;
      this.fireEvent('pointerout', inEvent);
    },
    cancel: function(inEvent) {
      inEvent.bubbles = true;
      this.fireEvent('pointercancel', inEvent);
    },
    leaveOut: function(event) {
      this.out(event);
      if (!this.contains(event.target, event.relatedTarget)) {
        this.leave(event);
      }
    },
    enterOver: function(event) {
      this.over(event);
      if (!this.contains(event.target, event.relatedTarget)) {
        this.enter(event);
      }
    },

    // LISTENER LOGIC
    eventHandler: function(inEvent) {

      // This is used to prevent multiple dispatch of pointerevents from
      // platform events. This can happen when two elements in different scopes
      // are set up to create pointer events, which is relevant to Shadow DOM.
      if (inEvent._handledByPE) {
        return;
      }
      var type = inEvent.type;
      var fn = this.eventMap && this.eventMap[type];
      if (fn) {
        fn(inEvent);
      }
      inEvent._handledByPE = true;
    },

    // set up event listeners
    listen: function(target, events) {
      events.forEach(function(e) {
        this.addEvent(target, e);
      }, this);
    },

    // remove event listeners
    unlisten: function(target, events) {
      events.forEach(function(e) {
        this.removeEvent(target, e);
      }, this);
    },
    addEvent: /*scope.external.addEvent || */function(target, eventName) {
      target.addEventListener(eventName, this.boundHandler);
    },
    removeEvent: /*scope.external.removeEvent || */function(target, eventName) {
      target.removeEventListener(eventName, this.boundHandler);
    },

    // EVENT CREATION AND TRACKING
    /**
     * Creates a new Event of type `inType`, based on the information in
     * `inEvent`.
     *
     * @param {string} inType A string representing the type of event to create
     * @param {Event} inEvent A platform event with a target
     * @return {Event} A PointerEvent of type `inType`
     */
    makeEvent: function(inType, inEvent) {

      // relatedTarget must be null if pointer is captured
      if (this.captureInfo[inEvent.pointerId]) {
        inEvent.relatedTarget = null;
      }
      var e = new _PointerEvent(inType, inEvent);
      if (inEvent.preventDefault) {
        e.preventDefault = inEvent.preventDefault;
      }
      e._target = e._target || inEvent.target;
      return e;
    },

    // make and dispatch an event in one call
    fireEvent: function(inType, inEvent) {
      var e = this.makeEvent(inType, inEvent);
      return this.dispatchEvent(e);
    },
    /**
     * Returns a snapshot of inEvent, with writable properties.
     *
     * @param {Event} inEvent An event that contains properties to copy.
     * @return {Object} An object containing shallow copies of `inEvent`'s
     *    properties.
     */
    cloneEvent: function(inEvent) {
      var eventCopy = Object.create(null);
      var p;
      for (var i = 0; i < CLONE_PROPS.length; i++) {
        p = CLONE_PROPS[i];
        eventCopy[p] = inEvent[p] || CLONE_DEFAULTS[i];

        // Work around SVGInstanceElement shadow tree
        // Return the <use> element that is represented by the instance for Safari, Chrome, IE.
        // This is the behavior implemented by Firefox.
        if (HAS_SVG_INSTANCE && (p === 'target' || p === 'relatedTarget')) {
          if (eventCopy[p] instanceof SVGElementInstance) {
            eventCopy[p] = eventCopy[p].correspondingUseElement;
          }
        }
      }

      // keep the semantics of preventDefault
      if (inEvent.preventDefault) {
        eventCopy.preventDefault = function() {
          inEvent.preventDefault();
        };
      }
      return eventCopy;
    },
    getTarget: function(inEvent) {

      // if pointer capture is set, route all events for the specified pointerId
      // to the capture target
      return this.captureInfo[inEvent.pointerId] || inEvent._target;
    },
    setCapture: function(inPointerId, inTarget) {
      if (this.captureInfo[inPointerId]) {
        this.releaseCapture(inPointerId);
      }
      this.captureInfo[inPointerId] = inTarget;
      var e = document.createEvent('Event');
      e.initEvent('gotpointercapture', true, false);
      e.pointerId = inPointerId;
      this.implicitRelease = this.releaseCapture.bind(this, inPointerId);
      document.addEventListener('pointerup', this.implicitRelease);
      document.addEventListener('pointercancel', this.implicitRelease);
      e._target = inTarget;
      this.asyncDispatchEvent(e);
    },
    releaseCapture: function(inPointerId) {
      var t = this.captureInfo[inPointerId];
      if (t) {
        var e = document.createEvent('Event');
        e.initEvent('lostpointercapture', true, false);
        e.pointerId = inPointerId;
        this.captureInfo[inPointerId] = undefined;
        document.removeEventListener('pointerup', this.implicitRelease);
        document.removeEventListener('pointercancel', this.implicitRelease);
        e._target = t;
        this.asyncDispatchEvent(e);
      }
    },
    /**
     * Dispatches the event to its target.
     *
     * @param {Event} inEvent The event to be dispatched.
     * @return {Boolean} True if an event handler returns true, false otherwise.
     */
    dispatchEvent: /*scope.external.dispatchEvent || */function(inEvent) {
      var t = this.getTarget(inEvent);
      if (t) {
        return t.dispatchEvent(inEvent);
      }
    },
    asyncDispatchEvent: function(inEvent) {
      requestAnimationFrame(this.dispatchEvent.bind(this, inEvent));
    }
  };
  dispatcher.boundHandler = dispatcher.eventHandler.bind(dispatcher);

  var _dispatcher = dispatcher;

  var targeting = {
    shadow: function(inEl) {
      if (inEl) {
        return inEl.shadowRoot || inEl.webkitShadowRoot;
      }
    },
    canTarget: function(shadow) {
      return shadow && Boolean(shadow.elementFromPoint);
    },
    targetingShadow: function(inEl) {
      var s = this.shadow(inEl);
      if (this.canTarget(s)) {
        return s;
      }
    },
    olderShadow: function(shadow) {
      var os = shadow.olderShadowRoot;
      if (!os) {
        var se = shadow.querySelector('shadow');
        if (se) {
          os = se.olderShadowRoot;
        }
      }
      return os;
    },
    allShadows: function(element) {
      var shadows = [];
      var s = this.shadow(element);
      while (s) {
        shadows.push(s);
        s = this.olderShadow(s);
      }
      return shadows;
    },
    searchRoot: function(inRoot, x, y) {
      if (inRoot) {
        var t = inRoot.elementFromPoint(x, y);
        var st, sr;

        // is element a shadow host?
        sr = this.targetingShadow(t);
        while (sr) {

          // find the the element inside the shadow root
          st = sr.elementFromPoint(x, y);
          if (!st) {

            // check for older shadows
            sr = this.olderShadow(sr);
          } else {

            // shadowed element may contain a shadow root
            var ssr = this.targetingShadow(st);
            return this.searchRoot(ssr, x, y) || st;
          }
        }

        // light dom element is the target
        return t;
      }
    },
    owner: function(element) {
      var s = element;

      // walk up until you hit the shadow root or document
      while (s.parentNode) {
        s = s.parentNode;
      }

      // the owner element is expected to be a Document or ShadowRoot
      if (s.nodeType !== Node.DOCUMENT_NODE && s.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
        s = document;
      }
      return s;
    },
    findTarget: function(inEvent) {
      var x = inEvent.clientX;
      var y = inEvent.clientY;

      // if the listener is in the shadow root, it is much faster to start there
      var s = this.owner(inEvent.target);

      // if x, y is not in this root, fall back to document search
      if (!s.elementFromPoint(x, y)) {
        s = document;
      }
      return this.searchRoot(s, x, y);
    }
  };

  /**
   * This module uses Mutation Observers to dynamically adjust which nodes will
   * generate Pointer Events.
   *
   * All nodes that wish to generate Pointer Events must have the attribute
   * `touch-action` set to `none`.
   */
  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
  var map = Array.prototype.map.call.bind(Array.prototype.map);
  var toArray = Array.prototype.slice.call.bind(Array.prototype.slice);
  var filter = Array.prototype.filter.call.bind(Array.prototype.filter);
  var MO = window.MutationObserver || window.WebKitMutationObserver;
  var SELECTOR = '[touch-action]';
  var OBSERVER_INIT = {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['touch-action']
  };

  function Installer(add, remove, changed, binder) {
    this.addCallback = add.bind(binder);
    this.removeCallback = remove.bind(binder);
    this.changedCallback = changed.bind(binder);
    if (MO) {
      this.observer = new MO(this.mutationWatcher.bind(this));
    }
  }

  Installer.prototype = {
    watchSubtree: function(target) {

      // Only watch scopes that can target find, as these are top-level.
      // Otherwise we can see duplicate additions and removals that add noise.
      //
      // TODO(dfreedman): For some instances with ShadowDOMPolyfill, we can see
      // a removal without an insertion when a node is redistributed among
      // shadows. Since it all ends up correct in the document, watching only
      // the document will yield the correct mutations to watch.
      if (this.observer && targeting.canTarget(target)) {
        this.observer.observe(target, OBSERVER_INIT);
      }
    },
    enableOnSubtree: function(target) {
      this.watchSubtree(target);
      if (target === document && document.readyState !== 'complete') {
        this.installOnLoad();
      } else {
        this.installNewSubtree(target);
      }
    },
    installNewSubtree: function(target) {
      forEach(this.findElements(target), this.addElement, this);
    },
    findElements: function(target) {
      if (target.querySelectorAll) {
        return target.querySelectorAll(SELECTOR);
      }
      return [];
    },
    removeElement: function(el) {
      this.removeCallback(el);
    },
    addElement: function(el) {
      this.addCallback(el);
    },
    elementChanged: function(el, oldValue) {
      this.changedCallback(el, oldValue);
    },
    concatLists: function(accum, list) {
      return accum.concat(toArray(list));
    },

    // register all touch-action = none nodes on document load
    installOnLoad: function() {
      document.addEventListener('readystatechange', function() {
        if (document.readyState === 'complete') {
          this.installNewSubtree(document);
        }
      }.bind(this));
    },
    isElement: function(n) {
      return n.nodeType === Node.ELEMENT_NODE;
    },
    flattenMutationTree: function(inNodes) {

      // find children with touch-action
      var tree = map(inNodes, this.findElements, this);

      // make sure the added nodes are accounted for
      tree.push(filter(inNodes, this.isElement));

      // flatten the list
      return tree.reduce(this.concatLists, []);
    },
    mutationWatcher: function(mutations) {
      mutations.forEach(this.mutationHandler, this);
    },
    mutationHandler: function(m) {
      if (m.type === 'childList') {
        var added = this.flattenMutationTree(m.addedNodes);
        added.forEach(this.addElement, this);
        var removed = this.flattenMutationTree(m.removedNodes);
        removed.forEach(this.removeElement, this);
      } else if (m.type === 'attributes') {
        this.elementChanged(m.target, m.oldValue);
      }
    }
  };

  var installer = Installer;

  function shadowSelector(v) {
    return 'body /shadow-deep/ ' + selector(v);
  }
  function selector(v) {
    return '[touch-action="' + v + '"]';
  }
  function rule(v) {
    return '{ -ms-touch-action: ' + v + '; touch-action: ' + v + '; touch-action-delay: none; }';
  }
  var attrib2css = [
    'none',
    'auto',
    'pan-x',
    'pan-y',
    {
      rule: 'pan-x pan-y',
      selectors: [
        'pan-x pan-y',
        'pan-y pan-x'
      ]
    }
  ];
  var styles = '';

  // only install stylesheet if the browser has touch action support
  var hasNativePE = window.PointerEvent || window.MSPointerEvent;

  // only add shadow selectors if shadowdom is supported
  var hasShadowRoot = !window.ShadowDOMPolyfill && document.head.createShadowRoot;

  function applyAttributeStyles() {
    if (hasNativePE) {
      attrib2css.forEach(function(r) {
        if (String(r) === r) {
          styles += selector(r) + rule(r) + '\n';
          if (hasShadowRoot) {
            styles += shadowSelector(r) + rule(r) + '\n';
          }
        } else {
          styles += r.selectors.map(selector) + rule(r.rule) + '\n';
          if (hasShadowRoot) {
            styles += r.selectors.map(shadowSelector) + rule(r.rule) + '\n';
          }
        }
      });

      var el = document.createElement('style');
      el.textContent = styles;
      document.head.appendChild(el);
    }
  }

  var mouse__pointermap = _dispatcher.pointermap;

  // radius around touchend that swallows mouse events
  var DEDUP_DIST = 25;

  // left, middle, right, back, forward
  var BUTTON_TO_BUTTONS = [1, 4, 2, 8, 16];

  var HAS_BUTTONS = false;
  try {
    HAS_BUTTONS = new MouseEvent('test', { buttons: 1 }).buttons === 1;
  } catch (e) {}

  // handler block for native mouse events
  var mouseEvents = {
    POINTER_ID: 1,
    POINTER_TYPE: 'mouse',
    events: [
      'mousedown',
      'mousemove',
      'mouseup',
      'mouseover',
      'mouseout'
    ],
    register: function(target) {
      _dispatcher.listen(target, this.events);
    },
    unregister: function(target) {
      _dispatcher.unlisten(target, this.events);
    },
    lastTouches: [],

    // collide with the global mouse listener
    isEventSimulatedFromTouch: function(inEvent) {
      var lts = this.lastTouches;
      var x = inEvent.clientX;
      var y = inEvent.clientY;
      for (var i = 0, l = lts.length, t; i < l && (t = lts[i]); i++) {

        // simulated mouse events will be swallowed near a primary touchend
        var dx = Math.abs(x - t.x);
        var dy = Math.abs(y - t.y);
        if (dx <= DEDUP_DIST && dy <= DEDUP_DIST) {
          return true;
        }
      }
    },
    prepareEvent: function(inEvent) {
      var e = _dispatcher.cloneEvent(inEvent);

      // forward mouse preventDefault
      var pd = e.preventDefault;
      e.preventDefault = function() {
        inEvent.preventDefault();
        pd();
      };
      e.pointerId = this.POINTER_ID;
      e.isPrimary = true;
      e.pointerType = this.POINTER_TYPE;
      return e;
    },
    prepareButtonsForMove: function(e, inEvent) {
      var p = mouse__pointermap.get(this.POINTER_ID);
      e.buttons = p ? p.buttons : 0;
      inEvent.buttons = e.buttons;
    },
    mousedown: function(inEvent) {
      if (!this.isEventSimulatedFromTouch(inEvent)) {
        var p = mouse__pointermap.get(this.POINTER_ID);
        var e = this.prepareEvent(inEvent);
        if (!HAS_BUTTONS) {
          e.buttons = BUTTON_TO_BUTTONS[e.button];
          if (p) { e.buttons |= p.buttons; }
          inEvent.buttons = e.buttons;
        }
        mouse__pointermap.set(this.POINTER_ID, inEvent);
        if (!p) {
          _dispatcher.down(e);
        } else {
          _dispatcher.move(e);
        }
      }
    },
    mousemove: function(inEvent) {
      if (!this.isEventSimulatedFromTouch(inEvent)) {
        var e = this.prepareEvent(inEvent);
        if (!HAS_BUTTONS) { this.prepareButtonsForMove(e, inEvent); }
        _dispatcher.move(e);
      }
    },
    mouseup: function(inEvent) {
      if (!this.isEventSimulatedFromTouch(inEvent)) {
        var p = mouse__pointermap.get(this.POINTER_ID);
        var e = this.prepareEvent(inEvent);
        if (!HAS_BUTTONS) {
          var up = BUTTON_TO_BUTTONS[e.button];

          // Produces wrong state of buttons in Browsers without `buttons` support
          // when a mouse button that was pressed outside the document is released
          // inside and other buttons are still pressed down.
          e.buttons = p ? p.buttons & ~up : 0;
          inEvent.buttons = e.buttons;
        }
        mouse__pointermap.set(this.POINTER_ID, inEvent);

        // Support: Firefox <=44 only
        // FF Ubuntu includes the lifted button in the `buttons` property on
        // mouseup.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1223366
        if (e.buttons === 0 || e.buttons === BUTTON_TO_BUTTONS[e.button]) {
          this.cleanupMouse();
          _dispatcher.up(e);
        } else {
          _dispatcher.move(e);
        }
      }
    },
    mouseover: function(inEvent) {
      if (!this.isEventSimulatedFromTouch(inEvent)) {
        var e = this.prepareEvent(inEvent);
        if (!HAS_BUTTONS) { this.prepareButtonsForMove(e, inEvent); }
        _dispatcher.enterOver(e);
      }
    },
    mouseout: function(inEvent) {
      if (!this.isEventSimulatedFromTouch(inEvent)) {
        var e = this.prepareEvent(inEvent);
        if (!HAS_BUTTONS) { this.prepareButtonsForMove(e, inEvent); }
        _dispatcher.leaveOut(e);
      }
    },
    cancel: function(inEvent) {
      var e = this.prepareEvent(inEvent);
      _dispatcher.cancel(e);
      this.cleanupMouse();
    },
    cleanupMouse: function() {
      mouse__pointermap.delete(this.POINTER_ID);
    }
  };

  var mouse = mouseEvents;

  var captureInfo = _dispatcher.captureInfo;
  var findTarget = targeting.findTarget.bind(targeting);
  var allShadows = targeting.allShadows.bind(targeting);
  var touch__pointermap = _dispatcher.pointermap;

  // This should be long enough to ignore compat mouse events made by touch
  var DEDUP_TIMEOUT = 2500;
  var CLICK_COUNT_TIMEOUT = 200;
  var ATTRIB = 'touch-action';
  var INSTALLER;

  // The presence of touch event handlers blocks scrolling, and so we must be careful to
  // avoid adding handlers unnecessarily.  Chrome plans to add a touch-action-delay property
  // (crbug.com/329559) to address this, and once we have that we can opt-in to a simpler
  // handler registration mechanism.  Rather than try to predict how exactly to opt-in to
  // that we'll just leave this disabled until there is a build of Chrome to test.
  var HAS_TOUCH_ACTION_DELAY = false;

  // handler block for native touch events
  var touchEvents = {
    events: [
      'touchstart',
      'touchmove',
      'touchend',
      'touchcancel'
    ],
    register: function(target) {
      if (HAS_TOUCH_ACTION_DELAY) {
        _dispatcher.listen(target, this.events);
      } else {
        INSTALLER.enableOnSubtree(target);
      }
    },
    unregister: function(target) {
      if (HAS_TOUCH_ACTION_DELAY) {
        _dispatcher.unlisten(target, this.events);
      } else {

        // TODO(dfreedman): is it worth it to disconnect the MO?
      }
    },
    elementAdded: function(el) {
      var a = el.getAttribute(ATTRIB);
      var st = this.touchActionToScrollType(a);
      if (st) {
        el._scrollType = st;
        _dispatcher.listen(el, this.events);

        // set touch-action on shadows as well
        allShadows(el).forEach(function(s) {
          s._scrollType = st;
          _dispatcher.listen(s, this.events);
        }, this);
      }
    },
    elementRemoved: function(el) {
      el._scrollType = undefined;
      _dispatcher.unlisten(el, this.events);

      // remove touch-action from shadow
      allShadows(el).forEach(function(s) {
        s._scrollType = undefined;
        _dispatcher.unlisten(s, this.events);
      }, this);
    },
    elementChanged: function(el, oldValue) {
      var a = el.getAttribute(ATTRIB);
      var st = this.touchActionToScrollType(a);
      var oldSt = this.touchActionToScrollType(oldValue);

      // simply update scrollType if listeners are already established
      if (st && oldSt) {
        el._scrollType = st;
        allShadows(el).forEach(function(s) {
          s._scrollType = st;
        }, this);
      } else if (oldSt) {
        this.elementRemoved(el);
      } else if (st) {
        this.elementAdded(el);
      }
    },
    scrollTypes: {
      EMITTER: 'none',
      XSCROLLER: 'pan-x',
      YSCROLLER: 'pan-y',
      SCROLLER: /^(?:pan-x pan-y)|(?:pan-y pan-x)|auto$/
    },
    touchActionToScrollType: function(touchAction) {
      var t = touchAction;
      var st = this.scrollTypes;
      if (t === 'none') {
        return 'none';
      } else if (t === st.XSCROLLER) {
        return 'X';
      } else if (t === st.YSCROLLER) {
        return 'Y';
      } else if (st.SCROLLER.exec(t)) {
        return 'XY';
      }
    },
    POINTER_TYPE: 'touch',
    firstTouch: null,
    isPrimaryTouch: function(inTouch) {
      return this.firstTouch === inTouch.identifier;
    },
    setPrimaryTouch: function(inTouch) {

      // set primary touch if there no pointers, or the only pointer is the mouse
      if (touch__pointermap.size === 0 || (touch__pointermap.size === 1 && touch__pointermap.has(1))) {
        this.firstTouch = inTouch.identifier;
        this.firstXY = { X: inTouch.clientX, Y: inTouch.clientY };
        this.scrolling = false;
        this.cancelResetClickCount();
      }
    },
    removePrimaryPointer: function(inPointer) {
      if (inPointer.isPrimary) {
        this.firstTouch = null;
        this.firstXY = null;
        this.resetClickCount();
      }
    },
    clickCount: 0,
    resetId: null,
    resetClickCount: function() {
      var fn = function() {
        this.clickCount = 0;
        this.resetId = null;
      }.bind(this);
      this.resetId = setTimeout(fn, CLICK_COUNT_TIMEOUT);
    },
    cancelResetClickCount: function() {
      if (this.resetId) {
        clearTimeout(this.resetId);
      }
    },
    typeToButtons: function(type) {
      var ret = 0;
      if (type === 'touchstart' || type === 'touchmove') {
        ret = 1;
      }
      return ret;
    },
    touchToPointer: function(inTouch) {
      var cte = this.currentTouchEvent;
      var e = _dispatcher.cloneEvent(inTouch);

      // We reserve pointerId 1 for Mouse.
      // Touch identifiers can start at 0.
      // Add 2 to the touch identifier for compatibility.
      var id = e.pointerId = inTouch.identifier + 2;
      e.target = captureInfo[id] || findTarget(e);
      e.bubbles = true;
      e.cancelable = true;
      e.detail = this.clickCount;
      e.button = 0;
      e.buttons = this.typeToButtons(cte.type);
      e.width = inTouch.radiusX || inTouch.webkitRadiusX || 0;
      e.height = inTouch.radiusY || inTouch.webkitRadiusY || 0;
      e.pressure = inTouch.force || inTouch.webkitForce || 0.5;
      e.isPrimary = this.isPrimaryTouch(inTouch);
      e.pointerType = this.POINTER_TYPE;

      // forward touch preventDefaults
      var self = this;
      e.preventDefault = function() {
        self.scrolling = false;
        self.firstXY = null;
        cte.preventDefault();
      };
      return e;
    },
    processTouches: function(inEvent, inFunction) {
      var tl = inEvent.changedTouches;
      this.currentTouchEvent = inEvent;
      for (var i = 0, t; i < tl.length; i++) {
        t = tl[i];
        inFunction.call(this, this.touchToPointer(t));
      }
    },

    // For single axis scrollers, determines whether the element should emit
    // pointer events or behave as a scroller
    shouldScroll: function(inEvent) {
      if (this.firstXY) {
        var ret;
        var scrollAxis = inEvent.currentTarget._scrollType;
        if (scrollAxis === 'none') {

          // this element is a touch-action: none, should never scroll
          ret = false;
        } else if (scrollAxis === 'XY') {

          // this element should always scroll
          ret = true;
        } else {
          var t = inEvent.changedTouches[0];

          // check the intended scroll axis, and other axis
          var a = scrollAxis;
          var oa = scrollAxis === 'Y' ? 'X' : 'Y';
          var da = Math.abs(t['client' + a] - this.firstXY[a]);
          var doa = Math.abs(t['client' + oa] - this.firstXY[oa]);

          // if delta in the scroll axis > delta other axis, scroll instead of
          // making events
          ret = da >= doa;
        }
        this.firstXY = null;
        return ret;
      }
    },
    findTouch: function(inTL, inId) {
      for (var i = 0, l = inTL.length, t; i < l && (t = inTL[i]); i++) {
        if (t.identifier === inId) {
          return true;
        }
      }
    },

    // In some instances, a touchstart can happen without a touchend. This
    // leaves the pointermap in a broken state.
    // Therefore, on every touchstart, we remove the touches that did not fire a
    // touchend event.
    // To keep state globally consistent, we fire a
    // pointercancel for this "abandoned" touch
    vacuumTouches: function(inEvent) {
      var tl = inEvent.touches;

      // pointermap.size should be < tl.length here, as the touchstart has not
      // been processed yet.
      if (touch__pointermap.size >= tl.length) {
        var d = [];
        touch__pointermap.forEach(function(value, key) {

          // Never remove pointerId == 1, which is mouse.
          // Touch identifiers are 2 smaller than their pointerId, which is the
          // index in pointermap.
          if (key !== 1 && !this.findTouch(tl, key - 2)) {
            var p = value.out;
            d.push(p);
          }
        }, this);
        d.forEach(this.cancelOut, this);
      }
    },
    touchstart: function(inEvent) {
      this.vacuumTouches(inEvent);
      this.setPrimaryTouch(inEvent.changedTouches[0]);
      this.dedupSynthMouse(inEvent);
      if (!this.scrolling) {
        this.clickCount++;
        this.processTouches(inEvent, this.overDown);
      }
    },
    overDown: function(inPointer) {
      touch__pointermap.set(inPointer.pointerId, {
        target: inPointer.target,
        out: inPointer,
        outTarget: inPointer.target
      });
      _dispatcher.over(inPointer);
      _dispatcher.enter(inPointer);
      _dispatcher.down(inPointer);
    },
    touchmove: function(inEvent) {
      if (!this.scrolling) {
        if (this.shouldScroll(inEvent)) {
          this.scrolling = true;
          this.touchcancel(inEvent);
        } else {
          inEvent.preventDefault();
          this.processTouches(inEvent, this.moveOverOut);
        }
      }
    },
    moveOverOut: function(inPointer) {
      var event = inPointer;
      var pointer = touch__pointermap.get(event.pointerId);

      // a finger drifted off the screen, ignore it
      if (!pointer) {
        return;
      }
      var outEvent = pointer.out;
      var outTarget = pointer.outTarget;
      _dispatcher.move(event);
      if (outEvent && outTarget !== event.target) {
        outEvent.relatedTarget = event.target;
        event.relatedTarget = outTarget;

        // recover from retargeting by shadow
        outEvent.target = outTarget;
        if (event.target) {
          _dispatcher.leaveOut(outEvent);
          _dispatcher.enterOver(event);
        } else {

          // clean up case when finger leaves the screen
          event.target = outTarget;
          event.relatedTarget = null;
          this.cancelOut(event);
        }
      }
      pointer.out = event;
      pointer.outTarget = event.target;
    },
    touchend: function(inEvent) {
      this.dedupSynthMouse(inEvent);
      this.processTouches(inEvent, this.upOut);
    },
    upOut: function(inPointer) {
      if (!this.scrolling) {
        _dispatcher.up(inPointer);
        _dispatcher.out(inPointer);
        _dispatcher.leave(inPointer);
      }
      this.cleanUpPointer(inPointer);
    },
    touchcancel: function(inEvent) {
      this.processTouches(inEvent, this.cancelOut);
    },
    cancelOut: function(inPointer) {
      _dispatcher.cancel(inPointer);
      _dispatcher.out(inPointer);
      _dispatcher.leave(inPointer);
      this.cleanUpPointer(inPointer);
    },
    cleanUpPointer: function(inPointer) {
      touch__pointermap.delete(inPointer.pointerId);
      this.removePrimaryPointer(inPointer);
    },

    // prevent synth mouse events from creating pointer events
    dedupSynthMouse: function(inEvent) {
      var lts = mouse.lastTouches;
      var t = inEvent.changedTouches[0];

      // only the primary finger will synth mouse events
      if (this.isPrimaryTouch(t)) {

        // remember x/y of last touch
        var lt = { x: t.clientX, y: t.clientY };
        lts.push(lt);
        var fn = (function(lts, lt) {
          var i = lts.indexOf(lt);
          if (i > -1) {
            lts.splice(i, 1);
          }
        }).bind(null, lts, lt);
        setTimeout(fn, DEDUP_TIMEOUT);
      }
    }
  };

  if (!HAS_TOUCH_ACTION_DELAY) {
    INSTALLER = new installer(touchEvents.elementAdded, touchEvents.elementRemoved,
      touchEvents.elementChanged, touchEvents);
  }

  var touch = touchEvents;

  var ms__pointermap = _dispatcher.pointermap;
  var HAS_BITMAP_TYPE = window.MSPointerEvent &&
    typeof window.MSPointerEvent.MSPOINTER_TYPE_MOUSE === 'number';
  var msEvents = {
    events: [
      'MSPointerDown',
      'MSPointerMove',
      'MSPointerUp',
      'MSPointerOut',
      'MSPointerOver',
      'MSPointerCancel',
      'MSGotPointerCapture',
      'MSLostPointerCapture'
    ],
    register: function(target) {
      _dispatcher.listen(target, this.events);
    },
    unregister: function(target) {
      _dispatcher.unlisten(target, this.events);
    },
    POINTER_TYPES: [
      '',
      'unavailable',
      'touch',
      'pen',
      'mouse'
    ],
    prepareEvent: function(inEvent) {
      var e = inEvent;
      if (HAS_BITMAP_TYPE) {
        e = _dispatcher.cloneEvent(inEvent);
        e.pointerType = this.POINTER_TYPES[inEvent.pointerType];
      }
      return e;
    },
    cleanup: function(id) {
      ms__pointermap.delete(id);
    },
    MSPointerDown: function(inEvent) {
      ms__pointermap.set(inEvent.pointerId, inEvent);
      var e = this.prepareEvent(inEvent);
      _dispatcher.down(e);
    },
    MSPointerMove: function(inEvent) {
      var e = this.prepareEvent(inEvent);
      _dispatcher.move(e);
    },
    MSPointerUp: function(inEvent) {
      var e = this.prepareEvent(inEvent);
      _dispatcher.up(e);
      this.cleanup(inEvent.pointerId);
    },
    MSPointerOut: function(inEvent) {
      var e = this.prepareEvent(inEvent);
      _dispatcher.leaveOut(e);
    },
    MSPointerOver: function(inEvent) {
      var e = this.prepareEvent(inEvent);
      _dispatcher.enterOver(e);
    },
    MSPointerCancel: function(inEvent) {
      var e = this.prepareEvent(inEvent);
      _dispatcher.cancel(e);
      this.cleanup(inEvent.pointerId);
    },
    MSLostPointerCapture: function(inEvent) {
      var e = _dispatcher.makeEvent('lostpointercapture', inEvent);
      _dispatcher.dispatchEvent(e);
    },
    MSGotPointerCapture: function(inEvent) {
      var e = _dispatcher.makeEvent('gotpointercapture', inEvent);
      _dispatcher.dispatchEvent(e);
    }
  };

  var ms = msEvents;

  function platform_events__applyPolyfill() {

    // only activate if this platform does not have pointer events
    if (!window.PointerEvent) {
      window.PointerEvent = _PointerEvent;

      if (window.navigator.msPointerEnabled) {
        var tp = window.navigator.msMaxTouchPoints;
        Object.defineProperty(window.navigator, 'maxTouchPoints', {
          value: tp,
          enumerable: true
        });
        _dispatcher.registerSource('ms', ms);
      } else {
        _dispatcher.registerSource('mouse', mouse);
        if (window.ontouchstart !== undefined) {
          _dispatcher.registerSource('touch', touch);
        }
      }

      _dispatcher.register(document);
    }
  }

  var n = window.navigator;
  var s, r;
  function assertDown(id) {
    if (!_dispatcher.pointermap.has(id)) {
      throw new Error('InvalidPointerId');
    }
  }
  if (n.msPointerEnabled) {
    s = function(pointerId) {
      assertDown(pointerId);
      this.msSetPointerCapture(pointerId);
    };
    r = function(pointerId) {
      assertDown(pointerId);
      this.msReleasePointerCapture(pointerId);
    };
  } else {
    s = function setPointerCapture(pointerId) {
      assertDown(pointerId);
      _dispatcher.setCapture(pointerId, this);
    };
    r = function releasePointerCapture(pointerId) {
      assertDown(pointerId);
      _dispatcher.releaseCapture(pointerId, this);
    };
  }

  function capture__applyPolyfill() {
    if (window.Element && !Element.prototype.setPointerCapture) {
      Object.defineProperties(Element.prototype, {
        'setPointerCapture': {
          value: s
        },
        'releasePointerCapture': {
          value: r
        }
      });
    }
  }

  applyAttributeStyles();
  platform_events__applyPolyfill();
  capture__applyPolyfill();

  var pointerevents = {
    dispatcher: _dispatcher,
    Installer: installer,
    PointerEvent: _PointerEvent,
    PointerMap: _pointermap,
    targetFinding: targeting
  };

  return pointerevents;

}));
if (!window.WebComponents) {
    throw 'Bosonic runtime needs the WebComponents polyfills to be loaded first.';
}

if (!window.Bosonic) {
    window.Bosonic = {};
}
function getFragmentFromNode(node) {
    var fragment = document.createDocumentFragment();
    while (child = node.firstChild) {
        fragment.appendChild(child);
    }
    return fragment;
}

function processMutations(mutations) {
    var nodes = {
        added: [],
        removed: []
    };
    mutations.forEach(function(record) {
        nodes.added = nodes.added.concat([].slice.call(record.addedNodes));
        nodes.removed = nodes.removed.concat([].slice.call(record.removedNodes));
    });
    return nodes;
}

Bosonic.Base = {
    createdCallback: function() {
        if (this.__template) {
            this.createShadowRoot();
            var content = this.__template.content ? this.__template.content : getFragmentFromNode(this.__template);
            if (WebComponents.flags.shadow !== false) {
                WebComponents.ShadowCSS.shimStyling(content, this.__elementName);
            }
            this.shadowRoot.appendChild(document.importNode(content, true));
        }
        var childListChanged = this.__lifecycle.childListChanged;
        if (childListChanged) {
            var that = this,
                observer = new MutationObserver(function(mutations) {
                    var diff = processMutations(mutations);
                    childListChanged.call(that, diff.removed, diff.added, mutations);
                });
            observer.observe(this, { childList: true, subtree: true, characterData: true });
        }
        this.__callMixins('created');
        this.classList.add('resolved');
        var created = this.__lifecycle.created;
        return created ? created.apply(this, arguments) : null;
    },

    attachedCallback: function() {
        this.__callMixins('attached');
        var attached = this.__lifecycle.attached;
        return attached ? attached.apply(this, arguments) : null;
    },

    detachedCallback: function() {
        this.__callMixins('detached');
        var detached = this.__lifecycle.detached;
        return detached ? detached.apply(this, arguments) : null;
    },

    attributeChangedCallback: function(name, oldValue, newValue) {
        if (this.__attributes) {
            if (name.indexOf('data-') === 0) {
                name = name.substr(5);
            }
            if (this.__attributes.indexOf(name) !== -1 && this[name + 'Changed']) {
                this[name + 'Changed'].call(this, oldValue, newValue);
            }
        }
        var changed = this.__lifecycle.attributeChanged;
        return changed ? changed.apply(this, arguments) : null;
    },

    __callMixins: function(callbackName, args) {
        this.__mixins.forEach(function(mixin) {
            if (mixin[callbackName]) {
                args ? mixin[callbackName].apply(this, args) : mixin[callbackName].call(this);
            }
        }, this);
    }
};
function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelize(str) {
    var camelized = str.replace(/(\-|_|\.|\s)+(.)?/g, function(match, separator, chr) {
        return chr ? chr.toUpperCase() : '';
    }).replace(/^([A-Z])/, function(match, separator, chr) {
        return match.toLowerCase();
    });
    return ucfirst(camelized);
}

function extendsNativeElement(extendee) {
    if (!extendee) return false;
    return extendee.indexOf('-') === -1;
}

function getExtendeeClass(extendee) {
    if (!extendee) {
        return 'HTMLElement'
    } else if (extendsNativeElement(extendee)) {
        if (['thead', 'tbody', 'tfoot'].indexOf(extendee) !== -1) {
            return 'HTMLTableSectionElement';
        } else {
            return 'HTML' + camelize(extendee) + 'Element';
        }
    } else {
        return camelize(extendee);
    }
}

function extractLifecycleCallbacks(options) {
    var callbacks = {
        created: ['created', 'createdCallback'],
        attached: ['attached', 'attachedCallback'],
        detached: ['detached', 'detachedCallback'],
        attributeChanged: ['attributeChanged', 'attributeChangedCallback'],
        childListChanged: ['childListChanged', 'childListChangedCallback']
    };
    options.__lifecycle = {};
    for (var key in callbacks) {
        callbacks[key].forEach(function(cb) {
            if (options[cb]) {
                options.__lifecycle[key] = options[cb];
                delete options[cb];
            }
        });
    }
    return options;
}

function extendPrototype(prototype, api, exclude) {
    exclude = exclude || [];
    if (prototype && api) {
        Object.getOwnPropertyNames(api).forEach(function(n) {
            if (exclude.indexOf(n) === -1) {
                prototype[n] = Object.getOwnPropertyDescriptor(api, n);
            }
        });
    }
    return prototype;
}

Bosonic.register = function(options) {
    var script = document._currentScript;
    var element = script && script.parentNode ? script.parentNode : null;
    if (!element || element.tagName.toUpperCase() !== 'ELEMENT') {
        throw 'Surrounding <element> tag could not be found.'
    }
    var name = element.getAttribute('name');
    if (!name) {
        throw 'Element name could not be inferred.';
    }

    var attributes = element.getAttribute('attributes'),
        extendee = element.getAttribute('extends'),
        extendsNativeElt = extendsNativeElement(extendee),
        elementClass = camelize(name),
        extendeeClass = getExtendeeClass(extendee);

    var template = script && script.parentNode ? script.parentNode.querySelector('template') : null;

    options = extractLifecycleCallbacks(options);
    options.__elementName = name;
    if (template) options.__template = template;
    if (attributes) options.__attributes = attributes.split(' ');

    var prototype = extendPrototype({}, Bosonic.Base);

    var features = [Bosonic.Dom, Bosonic.Events, Bosonic.Gestures, Bosonic.A11y, Bosonic.CustomAttributes],
        mixins = features;

    if (options.mixins) {
        mixins = mixins.concat(options.mixins);
    }

    mixins.forEach(function(mixin) {
        prototype = extendPrototype(prototype, mixin, ['created', 'attached', 'detached']);
    });
    options.__mixins = mixins;

    prototype = extendPrototype(prototype, options);

    var elementDef = {
        prototype: Object.create(window[extendeeClass].prototype, prototype)
    };
    if (extendee && extendsNativeElt) { 
        elementDef.extends = extendee;
    }

    window[elementClass] = document.registerElement(name, elementDef);
}
var focusableElementsSelector ="a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";

var KEYS = {
    9: 'tab',
    13: 'enter',
    27: 'esc',
    33: 'pageup',
    34: 'pagedown',
    35: 'end',
    36: 'home',
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    46: 'del',
    106: '*'
};

var MODIFIER_KEYS = {
    'shift': 'shiftKey',
    'ctrl': 'ctrlKey',
    'alt': 'altKey',
    'meta': 'metaKey'
};

function getKeyCombos(bindings) {
    return bindings.split(' ').map(function(binding) {
        return getKeyCombo(binding);
    });
}

function getKeyCombo(binding) {
    var keys = binding.split('+').reverse(),
        key = keys[0],
        modifierKeys = {};
        modifiers = keys.slice(1);

    Object.keys(MODIFIER_KEYS).forEach(function(k) {
        modifierKeys[MODIFIER_KEYS[k]] = (modifiers.indexOf(k) !== -1)
    });
    return {
        key: key,
        modifiers: modifierKeys
    };
}

function combosMatchesEvent(combos, event) {
    return combos.some(function(combo) {
        return comboMatchesEvent(combo, event);
    });
}

function comboMatchesEvent(combo, event) {
    return KEYS[event.keyCode] && KEYS[event.keyCode] === combo.key && modifiersMatchesEvent(combo, event);
}

function modifiersMatchesEvent(combo, event) {
    return Object.keys(combo.modifiers).every(function(modifier) {
        return !!combo.modifiers[modifier] === !!event[modifier];
    });
}

Bosonic.A11y = {
    __boundKeyHandlers: [],

    created: function() {
        if (this.keyBindings) {
            this._setupKeyListeners();
        }
    },

    detached: function() {
        if (this.keyBindings) {
            this._removeKeyListeners();
        }
    },

    keyMatchesEvent: function(key, event) {
        return comboMatchesEvent(getKeyCombo(key), event);
    },

    getFocusableElements: function(container) {
        container = container || this;
        return container.querySelectorAll(focusableElementsSelector);
    },

    getFirstFocusableElement: function(container) {
        container = container || this;
        return container.querySelector(focusableElementsSelector);
    },

    _setupKeyListeners: function() {
        for (var binding in this.keyBindings) {
            var handlerName = this.keyBindings[binding],
                combos = getKeyCombos(binding),
                boundHandler = this._keydownHandler.bind(this, combos, handlerName);

            this.__boundKeyHandlers.push(boundHandler);
            this.addEventListener('keydown', boundHandler);
        }
    },

    _removeKeyListeners: function() {
        this.__boundKeyHandlers.forEach(function(handler) {
            this.removeEventListener('keydown', handler);
        }, this);
    },
    
    _keydownHandler: function(keyCombos, handlerName, event) {
        if (!event.defaultPrevented && combosMatchesEvent(keyCombos, event)) {
            this[handlerName].call(this, event);
        }
    }
};
Bosonic.CustomAttributes = {
    hasCustomAttribute: function(name) {
        return this.hasAttribute(name) || this._hasPrefixedAttribute(name);
    },

    getCustomAttribute: function(name) {
        return this.getAttribute(this._getRealAttribute(name));
    },

    setCustomAttribute: function(name, value) {
        this.setAttribute(this._getRealAttribute(name), value);
    },

    removeCustomAttribute: function(name) {
        this.removeAttribute(this._getRealAttribute(name));
    },

    toggleCustomAttribute: function(name, bool) {
        if (arguments.length == 1) {
            bool = !this.hasCustomAttribute(name);
        }
        bool ? this.setCustomAttribute(name, '') : this.removeCustomAttribute(name);
    },

    _hasPrefixedAttribute: function(name) {
        return this.hasAttribute('data-' + name);
    },

    _getRealAttribute: function(name) {
        return this._hasPrefixedAttribute(name) ? 'data-' + name : name;
    }
};
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
    },

    toggleAttribute: function(name, bool, node) {
        node = node || this;
        if (arguments.length == 1) {
            bool = !node.hasAttribute(name);
        }
        bool ? node.setAttribute(name, '') : node.removeAttribute(name);
    },

    // for ARIA state properties
    toggleStateAttribute: function(name, bool, node) {
        node = node || this;
        if (arguments.length == 1) {
            bool = !node.hasAttribute(name) || node.getAttribute(name) == 'false';
        }
        bool ? node.setAttribute(name, 'true') : node.setAttribute(name, 'false');
    }
};
var TAP_TRESHOLD = 10;

var TRANSITION_END = (function() {
    var el = document.createElement('div');
    return el.style.WebkitTransition !== undefined // Safari 6 & Android Browser < 4.3
        ? 'webkitTransitionEnd' : 'transitionend';
})();

Bosonic.Events = {
    created: function() {
        if (this.shadowRoot) {
            PointerEventsPolyfill.dispatcher.register(this.shadowRoot);
        }
        for (var eventName in this.listeners) {
            this.listen(this, eventName, this.listeners[eventName]);
        }
    },

    detached: function() {
        for (var eventName in this.listeners) {
            this.unlisten(this, eventName, this.listeners[eventName]);
        }
    },

    fire: function(type, detail, options) {
        detail = detail || {};
        options = options || {};
        var event = new CustomEvent(type, {
            bubbles: options.bubbles === false ? false : true,
            cancelable: options.cancelable === true ? true : false,
            detail: detail
        });
        var node = options.node || this;
        node.dispatchEvent(event);
        return event;
    },

    listenOnce: function(node, eventName, fn, args) {
        var host = this,
            handler = function() {
                fn.apply(host, args);
                node.removeEventListener(eventName, handler, false);
            };
        node.addEventListener(eventName, handler, false);
    },

    transition: function(node, beforeFn, afterFn) {
        var host = this,
            afterHandler = function() { afterFn.call(host, node); };

        this.listenOnce(node, TRANSITION_END, afterHandler);
        beforeFn.call(host, node);
    },

    listen: function(node, eventName, methodName) {
        var listener = this._findListener(this, node, eventName, methodName);
        if (!listener) {
            listener = this._registerListener(this, node, eventName, methodName);
        }
        if (listener.deps) {
            Object.keys(listener.deps).forEach(function(dep) {
                this._listen(node, dep, listener.deps[dep]);
            }, this);
        }
        this._listen(node, eventName, listener.handler);
    },

    unlisten: function(node, eventName, methodName) {
        var listener = this._findListener(this, node, eventName, methodName);
        if (listener) {
            if (listener.deps) {
                Object.keys(listener.deps).forEach(function(dep) {
                    this._unlisten(node, dep, listener.deps[dep]);
                }, this);
            }
            this._unlisten(node, eventName, listener.handler);
        }
    },

    _listen: function(node, eventName, handler) {
        node.addEventListener(eventName, handler);
    },

    _unlisten: function(node, eventName, handler) {
        node.removeEventListener(eventName, handler);
    },

    _findListener: function(host, node, eventName, methodName) {
        return this._getListener(host, node, this._getListenerKey(eventName, methodName));
    },

    _getListener: function(host, node, key) {
        if (!host.__listeners || !host.__listeners[key]) return;
        var listeners = host.__listeners[key],
            len = listeners.length;
        if (len === 1) return listeners[0];
        for (var i = 0; i < len; i++) {
            if (listeners[i].node === node) return listeners[i];
        }
    },

    _registerListener: function(host, node, eventName, methodName) {
        var key = this._getListenerKey(eventName, methodName),
            listener = this._prepareListener(host, node, eventName, methodName);
        
        this._setListener(host, node, key, listener);
        return listener;
    },

    _prepareListener: function(host, node, eventName, methodName) {
        if (!host[methodName]) {
            throw 'Event handler method `' + methodName + '` is not defined';
        }
        var listener = {
            node: node,
            handler: function(e) {
                host[methodName](e);
            }
        };
        if (this.customEvents[eventName]) {
            var detail = {},
                customEvent = this.customEvents[eventName];

            listener.deps = {};
            customEvent.deps.forEach(function(dep) {
                var handler = customEvent[dep].bind(this, detail);
                listener.deps[dep] = handler;
            });
        }
        return listener;
    },

    _setListener: function(host, node, key, listener) {
        if (!host.__listeners) host.__listeners = {};
        if (!host.__listeners[key]) host.__listeners[key] = [];
        host.__listeners[key].push(listener);
    },

    _getListenerKey: function(eventName, methodName) {
        return eventName + ':' + methodName;
    },

    customEvents: {
        tap: {
            deps: ['pointerdown', 'pointerup'],
            pointerdown: function(detail, e) {
                detail.x = e.clientX;
                detail.y = e.clientY;
            },
            pointerup: function(detail, e) {
                if (e.button === 0 &&
                   Math.abs(detail.x - e.clientX) < TAP_TRESHOLD &&
                   Math.abs(detail.y - e.clientY) < TAP_TRESHOLD) Bosonic.Events.fire('tap', detail, { node: e.currentTarget });
            }
        }
    }
};

var GESTURES_FLAG = '__bosonicGestures',
    TAP_TRESHOLD = 10,
    TRACK_TRESHOLD = 10,
    SAMPLE_INTERVAL = 25;

var STATE_POSSIBLE = 'possible',
    STATE_STARTED = 'start',
    STATE_CHANGED = 'track',
    STATE_ENDED = 'end',
    STATE_RECOGNIZED = STATE_ENDED,
    STATE_FAILED = 'fail',
    STATE_CANCELLED = 'cancel';

var DIRECTION_NONE = 'none',
    DIRECTION_LEFT = 'left',
    DIRECTION_RIGHT = 'right',
    DIRECTION_UP = 'up',
    DIRECTION_DOWN = 'down';

function inherit(base, properties) {
    var child = Object.create(base);
    Object.keys(properties).forEach(function(k) {
        child[k] = properties[k];
    });
    return child;
}

var Recognizer = {
    init: function(name, manager) {
        this.state = 'possible';
        this.name = name;
        this.manager = manager;
    },
    transitionTo: function(newState, optionalDetail) {
        this.state = newState;
        optionalDetail = optionalDetail || {};
        optionalDetail.state = newState;
        if (this.shouldFire(newState)) this.manager.tryFire(this.name, optionalDetail);
    },
    shouldFire: function(newState) {
        return [STATE_RECOGNIZED, STATE_STARTED, STATE_CHANGED, STATE_ENDED].indexOf(newState) !== -1;
    }
};

var TrackRecognizer = inherit(Recognizer, {
    maxPointers: 1,
    down: function(pointers) {
        pointers.ids.length === this.maxPointers ? this.transitionTo(STATE_STARTED) : this.transitionTo(STATE_FAILED);
    },
    move: function(pointers) {
        if (this.state === STATE_STARTED || this.state === STATE_CHANGED) this.transitionTo(STATE_CHANGED, processDelta(pointers));
    },
    up: function(pointers) {
        if (this.state === STATE_CHANGED) {
            var detail = processDisplacement(pointers);
            this.transitionTo(STATE_ENDED, detail);
        } else this.transitionTo(STATE_FAILED);
    }
});

var SwipeRecognizer = inherit(Recognizer, {
    maxPointers: 1,
    minDistance: 10,
    minVelocity: 0.3,
    down: function(pointers) {
        pointers.ids.length === this.maxPointers ? this.transitionTo(STATE_POSSIBLE) : this.transitionTo(STATE_FAILED);
    },
    move: function(pointers) {},
    up: function(pointers) {
        var detail = processDisplacement(pointers);
        if (this.state !== STATE_FAILED && (this.direction && detail.direction === this.direction || detail.direction !== DIRECTION_NONE)
            && detail.distance > this.minDistance && detail.velocity > this.minVelocity) this.transitionTo(STATE_RECOGNIZED, detail);
        else this.transitionTo(STATE_FAILED);
    }
});
var SwipeLeftRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_LEFT }),
    SwipeRightRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_RIGHT }),
    SwipeUpRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_UP }),
    SwipeDownRecognizer = inherit(SwipeRecognizer, { direction: DIRECTION_DOWN });

var PanRecognizer = inherit(Recognizer, {
    maxPointers: 1,
    minDistance: 10,
    down: function(pointers) {
        pointers.ids.length === this.maxPointers ? this.transitionTo(STATE_POSSIBLE) : this.transitionTo(STATE_FAILED);
    },
    move: function(pointers) {
        var detail = processDisplacement(pointers);
        if (this.state === STATE_POSSIBLE && detail.distance > this.minDistance) this.transitionTo(STATE_STARTED, detail);
        else if (this.state === STATE_STARTED || this.state === STATE_CHANGED) this.transitionTo(STATE_CHANGED, detail);
    },
    up: function(pointers) {
        if (this.state === STATE_CHANGED) {
            var detail = processDisplacement(pointers);
            this.transitionTo(STATE_ENDED, detail);
        } else this.transitionTo(STATE_FAILED);
    }
});
var PanLeftRecognizer = inherit(PanRecognizer, { direction: DIRECTION_LEFT }),
    PanRightRecognizer = inherit(PanRecognizer, { direction: DIRECTION_RIGHT }),
    PanUpRecognizer = inherit(PanRecognizer, { direction: DIRECTION_UP }),
    PanDownRecognizer = inherit(PanRecognizer, { direction: DIRECTION_DOWN });

Bosonic.Gestures = {
    recognizers: {
        track: TrackRecognizer,
        pan: PanRecognizer,
        panLeft: PanLeftRecognizer,
        panRight: PanRightRecognizer,
        panUp: PanUpRecognizer,
        panDown: PanDownRecognizer,
        swipe: SwipeRecognizer,
        swipeLeft: SwipeLeftRecognizer,
        swipeRight: SwipeRightRecognizer,
        swipeUp: SwipeUpRecognizer,
        swipeDown: SwipeDownRecognizer
    },

    // Events mixin method override
    _listen: function(node, eventName, handler) {
        if (this.recognizers[eventName]) {
            this.setupGesture(node, eventName);
        }
        node.addEventListener(eventName, handler);
    },

    // Events mixin method override
    _unlisten: function(node, eventName, handler) {
        if (this.recognizers[eventName]) {
            this.teardownGesture(node, eventName);
        }
        node.removeEventListener(eventName, handler);
    },

    setupGesture: function(node, gestureName) {
        if (!node[GESTURES_FLAG]) {
            node[GESTURES_FLAG] = new GesturesManager(node);
        }
        node[GESTURES_FLAG].listen(gestureName);
    },

    teardownGesture: function(node, gestureName) {
        var manager = node[GESTURES_FLAG];
        manager.unlisten(gestureName);
    }
};

function GesturesManager(node) {
    this.node = node;
    this.recognizers = {};
    this.resetPointers();

    var self = this;
    this.mainHandler = function(e) {
        self.handleEvent(e);
    }

    this.setup();
}

GesturesManager.prototype = {
    setup: function() {
        // TODO: handle pointerout & pointercancel
        this.node.setAttribute('touch-action', 'none'); // this is needed by the PE polyfill
        this.node.addEventListener('pointerdown', this.mainHandler);
        document.addEventListener('pointermove', this.mainHandler);
        document.addEventListener('pointerup', this.mainHandler);
    },

    teardown: function() {
        this.node.removeAttribute('touch-action', 'none');
        this.node.removeEventListener('pointerdown', this.mainHandler);
        document.removeEventListener('pointermove', this.mainHandler);
        document.removeEventListener('pointerup', this.mainHandler);
    },

    listen: function(gestureName) {
        var recognizer = Object.create(Bosonic.Gestures.recognizers[gestureName]);
        recognizer.init(gestureName, this);
        this.recognizers[gestureName] = recognizer;
    },

    unlisten: function(gestureName) {
        delete this.recognizers[gestureName];
    },

    handleEvent: function(e) {
        this.updatePointers(e);

        // This is either a hover or the user uses more than 2 fingers
        if (!this.pointers.changed) return;

        this.recognize();
        this.persistLastEvent();
    },

    persistLastEvent: function() {
        this.pointers.lastEvents[this.pointers.changedIndex] = this.pointers.changed;

        this.pointers.changed = null;
        this.pointers.changedIndex = null;
    },

    updatePointers: function(e) {
        var pointerIndex;

        e.ts = Date.now();

        if (e.type === 'pointerdown' && (e.button === 0 || e.pointerType !== 'mouse')) {
            var pointerCount = this.pointers.ids.length;
            if (pointerCount === 0) {
                // it is the first event of a new sequence...
                this.resetPointers();
            } else if (pointerCount === 2) {
                // more than 2 pointers is probably a user's mistake, ignore it
                return;
            }
            // store the new pointer
            var pointerIndex = this.pointers.ids.push(e.pointerId) - 1;
            this.pointers.firstEvents.push(e);
        } else if (e.type === 'pointerup' || e.type === 'pointermove') {
            var pointerIndex = this.pointers.ids.indexOf(e.pointerId);
            if (pointerIndex < 0) {
                // it's a pointer we don't track
                return;
            }
            if (e.type === 'pointerup') this.pointers.ids.splice(pointerIndex, 1);
        }

        this.pointers.changed = e;
        this.pointers.changedIndex = pointerIndex;
    },

    recognize: function() {
        Object.keys(this.recognizers).forEach(function(gestureName) {
            var recognizer = this.recognizers[gestureName];
            
            switch(this.pointers.changed.type) {
                case 'pointerdown':
                    recognizer.down(this.pointers);
                    break;
                case 'pointermove':
                    recognizer.move(this.pointers);
                    break;
                case 'pointerup':
                    recognizer.up(this.pointers);
                    break;
            }
        }, this);
    },

    resetPointers: function() {
        this.pointers = {
            ids: [],
            firstEvents: [],
            lastEvents: []
        };
    },

    tryFire: function(gesture, optionalDetail) {
        var detail = optionalDetail || {};
        this.fire(this.node, gesture, detail, this.pointers.changed);
    },

    fire: function(node, gesture, detail, originalEvent) {
        if (originalEvent) {
            detail.originalEvent = originalEvent;
        }
        var ev = Bosonic.Events.fire(gesture, detail, {
            bubbles: true,
            cancelable: true,
            node: node
        });
        // preventDefault() forwarding
        if (ev.defaultPrevented) {
            if (originalEvent && originalEvent.preventDefault) {
                originalEvent.preventDefault();
                originalEvent.stopImmediatePropagation();
            }
        }
    }
};

function processDelta(pointers) {
    var changed = pointers.changed,
        first = pointers.firstEvents[pointers.changedIndex],
        last = pointers.lastEvents[pointers.changedIndex];
        
    return {
        dx: changed.clientX - first.clientX,
        dy: changed.clientY - first.clientY,
        dts: changed.ts - first.ts,
        ddx: changed.clientX - last.clientX,
        ddy: changed.clientY - last.clientY,
        ddts: changed.ts - last.ts
    };
}

// TODO: processInstantDisplacement (with SAMPLE_INTERVAL) so that we return "instant" velocity for pan gesture
function processDisplacement(pointers) {
    var delta = processDelta(pointers),
        dx = delta.dx,
        dy = delta.dy,
        velx = delta.velx = Math.abs(dx) / delta.dts,
        vely = delta.vely = Math.abs(dy) / delta.dts,
        direction = delta.direction = getDirection(dx, dy);

    delta.distance = getDistance(dx, dy, direction);
    delta.velocity = getOverallVelocity(velx, vely, direction);
        
    return delta;
}

function getDirection(dx, dy) {
    if (dx === dy) return DIRECTION_NONE;

    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return dy < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

function getDistance(dx, dy, direction) {
    return (direction === DIRECTION_LEFT || direction === DIRECTION_RIGHT) ? Math.abs(dx) : Math.abs(dy);
}

function getOverallVelocity(velx, vely, direction) {
    return (direction === DIRECTION_LEFT || direction === DIRECTION_RIGHT) ? velx : vely;
}


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
})();