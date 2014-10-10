/*
 * Copyright 2012 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

if (typeof WeakMap === 'undefined') {
  (function() {
    var defineProperty = Object.defineProperty;
    var counter = Date.now() % 1e9;

    var WeakMap = function() {
      this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
    };

    WeakMap.prototype = {
      set: function(key, value) {
        var entry = key[this.name];
        if (entry && entry[0] === key)
          entry[1] = value;
        else
          defineProperty(key, this.name, {value: [key, value], writable: true});
        return this;
      },
      get: function(key) {
        var entry;
        return (entry = key[this.name]) && entry[0] === key ?
            entry[1] : undefined;
      },
      delete: function(key) {
        var entry = key[this.name];
        if (!entry) return false;
        var hasValue = entry[0] === key;
        entry[0] = entry[1] = undefined;
        return hasValue;
      },
      has: function(key) {
        var entry = key[this.name];
        if (!entry) return false;
        return entry[0] === key;
      }
    };

    window.WeakMap = WeakMap;
  })();
}

/*
 * Copyright 2012 The Polymer Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(global) {

  var registrationsTable = new WeakMap();

  // We use setImmediate or postMessage for our future callback.
  var setImmediate = window.msSetImmediate;

  // Use post message to emulate setImmediate.
  if (!setImmediate) {
    var setImmediateQueue = [];
    var sentinel = String(Math.random());
    window.addEventListener('message', function(e) {
      if (e.data === sentinel) {
        var queue = setImmediateQueue;
        setImmediateQueue = [];
        queue.forEach(function(func) {
          func();
        });
      }
    });
    setImmediate = function(func) {
      setImmediateQueue.push(func);
      window.postMessage(sentinel, '*');
    };
  }

  // This is used to ensure that we never schedule 2 callas to setImmediate
  var isScheduled = false;

  // Keep track of observers that needs to be notified next time.
  var scheduledObservers = [];

  /**
   * Schedules |dispatchCallback| to be called in the future.
   * @param {MutationObserver} observer
   */
  function scheduleCallback(observer) {
    scheduledObservers.push(observer);
    if (!isScheduled) {
      isScheduled = true;
      setImmediate(dispatchCallbacks);
    }
  }

  function wrapIfNeeded(node) {
    return window.ShadowDOMPolyfill &&
        window.ShadowDOMPolyfill.wrapIfNeeded(node) ||
        node;
  }

  function dispatchCallbacks() {
    // http://dom.spec.whatwg.org/#mutation-observers

    isScheduled = false; // Used to allow a new setImmediate call above.

    var observers = scheduledObservers;
    scheduledObservers = [];
    // Sort observers based on their creation UID (incremental).
    observers.sort(function(o1, o2) {
      return o1.uid_ - o2.uid_;
    });

    var anyNonEmpty = false;
    observers.forEach(function(observer) {

      // 2.1, 2.2
      var queue = observer.takeRecords();
      // 2.3. Remove all transient registered observers whose observer is mo.
      removeTransientObserversFor(observer);

      // 2.4
      if (queue.length) {
        observer.callback_(queue, observer);
        anyNonEmpty = true;
      }
    });

    // 3.
    if (anyNonEmpty)
      dispatchCallbacks();
  }

  function removeTransientObserversFor(observer) {
    observer.nodes_.forEach(function(node) {
      var registrations = registrationsTable.get(node);
      if (!registrations)
        return;
      registrations.forEach(function(registration) {
        if (registration.observer === observer)
          registration.removeTransientObservers();
      });
    });
  }

  /**
   * This function is used for the "For each registered observer observer (with
   * observer's options as options) in target's list of registered observers,
   * run these substeps:" and the "For each ancestor ancestor of target, and for
   * each registered observer observer (with options options) in ancestor's list
   * of registered observers, run these substeps:" part of the algorithms. The
   * |options.subtree| is checked to ensure that the callback is called
   * correctly.
   *
   * @param {Node} target
   * @param {function(MutationObserverInit):MutationRecord} callback
   */
  function forEachAncestorAndObserverEnqueueRecord(target, callback) {
    for (var node = target; node; node = node.parentNode) {
      var registrations = registrationsTable.get(node);

      if (registrations) {
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          var options = registration.options;

          // Only target ignores subtree.
          if (node !== target && !options.subtree)
            continue;

          var record = callback(options);
          if (record)
            registration.enqueue(record);
        }
      }
    }
  }

  var uidCounter = 0;

  /**
   * The class that maps to the DOM MutationObserver interface.
   * @param {Function} callback.
   * @constructor
   */
  function JsMutationObserver(callback) {
    this.callback_ = callback;
    this.nodes_ = [];
    this.records_ = [];
    this.uid_ = ++uidCounter;
  }

  JsMutationObserver.prototype = {
    observe: function(target, options) {
      target = wrapIfNeeded(target);

      // 1.1
      if (!options.childList && !options.attributes && !options.characterData ||

          // 1.2
          options.attributeOldValue && !options.attributes ||

          // 1.3
          options.attributeFilter && options.attributeFilter.length &&
              !options.attributes ||

          // 1.4
          options.characterDataOldValue && !options.characterData) {

        throw new SyntaxError();
      }

      var registrations = registrationsTable.get(target);
      if (!registrations)
        registrationsTable.set(target, registrations = []);

      // 2
      // If target's list of registered observers already includes a registered
      // observer associated with the context object, replace that registered
      // observer's options with options.
      var registration;
      for (var i = 0; i < registrations.length; i++) {
        if (registrations[i].observer === this) {
          registration = registrations[i];
          registration.removeListeners();
          registration.options = options;
          break;
        }
      }

      // 3.
      // Otherwise, add a new registered observer to target's list of registered
      // observers with the context object as the observer and options as the
      // options, and add target to context object's list of nodes on which it
      // is registered.
      if (!registration) {
        registration = new Registration(this, target, options);
        registrations.push(registration);
        this.nodes_.push(target);
      }

      registration.addListeners();
    },

    disconnect: function() {
      this.nodes_.forEach(function(node) {
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          var registration = registrations[i];
          if (registration.observer === this) {
            registration.removeListeners();
            registrations.splice(i, 1);
            // Each node can only have one registered observer associated with
            // this observer.
            break;
          }
        }
      }, this);
      this.records_ = [];
    },

    takeRecords: function() {
      var copyOfRecords = this.records_;
      this.records_ = [];
      return copyOfRecords;
    }
  };

  /**
   * @param {string} type
   * @param {Node} target
   * @constructor
   */
  function MutationRecord(type, target) {
    this.type = type;
    this.target = target;
    this.addedNodes = [];
    this.removedNodes = [];
    this.previousSibling = null;
    this.nextSibling = null;
    this.attributeName = null;
    this.attributeNamespace = null;
    this.oldValue = null;
  }

  function copyMutationRecord(original) {
    var record = new MutationRecord(original.type, original.target);
    record.addedNodes = original.addedNodes.slice();
    record.removedNodes = original.removedNodes.slice();
    record.previousSibling = original.previousSibling;
    record.nextSibling = original.nextSibling;
    record.attributeName = original.attributeName;
    record.attributeNamespace = original.attributeNamespace;
    record.oldValue = original.oldValue;
    return record;
  };

  // We keep track of the two (possibly one) records used in a single mutation.
  var currentRecord, recordWithOldValue;

  /**
   * Creates a record without |oldValue| and caches it as |currentRecord| for
   * later use.
   * @param {string} oldValue
   * @return {MutationRecord}
   */
  function getRecord(type, target) {
    return currentRecord = new MutationRecord(type, target);
  }

  /**
   * Gets or creates a record with |oldValue| based in the |currentRecord|
   * @param {string} oldValue
   * @return {MutationRecord}
   */
  function getRecordWithOldValue(oldValue) {
    if (recordWithOldValue)
      return recordWithOldValue;
    recordWithOldValue = copyMutationRecord(currentRecord);
    recordWithOldValue.oldValue = oldValue;
    return recordWithOldValue;
  }

  function clearRecords() {
    currentRecord = recordWithOldValue = undefined;
  }

  /**
   * @param {MutationRecord} record
   * @return {boolean} Whether the record represents a record from the current
   * mutation event.
   */
  function recordRepresentsCurrentMutation(record) {
    return record === recordWithOldValue || record === currentRecord;
  }

  /**
   * Selects which record, if any, to replace the last record in the queue.
   * This returns |null| if no record should be replaced.
   *
   * @param {MutationRecord} lastRecord
   * @param {MutationRecord} newRecord
   * @param {MutationRecord}
   */
  function selectRecord(lastRecord, newRecord) {
    if (lastRecord === newRecord)
      return lastRecord;

    // Check if the the record we are adding represents the same record. If
    // so, we keep the one with the oldValue in it.
    if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord))
      return recordWithOldValue;

    return null;
  }

  /**
   * Class used to represent a registered observer.
   * @param {MutationObserver} observer
   * @param {Node} target
   * @param {MutationObserverInit} options
   * @constructor
   */
  function Registration(observer, target, options) {
    this.observer = observer;
    this.target = target;
    this.options = options;
    this.transientObservedNodes = [];
  }

  Registration.prototype = {
    enqueue: function(record) {
      var records = this.observer.records_;
      var length = records.length;

      // There are cases where we replace the last record with the new record.
      // For example if the record represents the same mutation we need to use
      // the one with the oldValue. If we get same record (this can happen as we
      // walk up the tree) we ignore the new record.
      if (records.length > 0) {
        var lastRecord = records[length - 1];
        var recordToReplaceLast = selectRecord(lastRecord, record);
        if (recordToReplaceLast) {
          records[length - 1] = recordToReplaceLast;
          return;
        }
      } else {
        scheduleCallback(this.observer);
      }

      records[length] = record;
    },

    addListeners: function() {
      this.addListeners_(this.target);
    },

    addListeners_: function(node) {
      var options = this.options;
      if (options.attributes)
        node.addEventListener('DOMAttrModified', this, true);

      if (options.characterData)
        node.addEventListener('DOMCharacterDataModified', this, true);

      if (options.childList)
        node.addEventListener('DOMNodeInserted', this, true);

      if (options.childList || options.subtree)
        node.addEventListener('DOMNodeRemoved', this, true);
    },

    removeListeners: function() {
      this.removeListeners_(this.target);
    },

    removeListeners_: function(node) {
      var options = this.options;
      if (options.attributes)
        node.removeEventListener('DOMAttrModified', this, true);

      if (options.characterData)
        node.removeEventListener('DOMCharacterDataModified', this, true);

      if (options.childList)
        node.removeEventListener('DOMNodeInserted', this, true);

      if (options.childList || options.subtree)
        node.removeEventListener('DOMNodeRemoved', this, true);
    },

    /**
     * Adds a transient observer on node. The transient observer gets removed
     * next time we deliver the change records.
     * @param {Node} node
     */
    addTransientObserver: function(node) {
      // Don't add transient observers on the target itself. We already have all
      // the required listeners set up on the target.
      if (node === this.target)
        return;

      this.addListeners_(node);
      this.transientObservedNodes.push(node);
      var registrations = registrationsTable.get(node);
      if (!registrations)
        registrationsTable.set(node, registrations = []);

      // We know that registrations does not contain this because we already
      // checked if node === this.target.
      registrations.push(this);
    },

    removeTransientObservers: function() {
      var transientObservedNodes = this.transientObservedNodes;
      this.transientObservedNodes = [];

      transientObservedNodes.forEach(function(node) {
        // Transient observers are never added to the target.
        this.removeListeners_(node);

        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          if (registrations[i] === this) {
            registrations.splice(i, 1);
            // Each node can only have one registered observer associated with
            // this observer.
            break;
          }
        }
      }, this);
    },

    handleEvent: function(e) {
      // Stop propagation since we are managing the propagation manually.
      // This means that other mutation events on the page will not work
      // correctly but that is by design.
      e.stopImmediatePropagation();

      switch (e.type) {
        case 'DOMAttrModified':
          // http://dom.spec.whatwg.org/#concept-mo-queue-attributes

          var name = e.attrName;
          var namespace = e.relatedNode.namespaceURI;
          var target = e.target;

          // 1.
          var record = new getRecord('attributes', target);
          record.attributeName = name;
          record.attributeNamespace = namespace;

          // 2.
          var oldValue =
              e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;

          forEachAncestorAndObserverEnqueueRecord(target, function(options) {
            // 3.1, 4.2
            if (!options.attributes)
              return;

            // 3.2, 4.3
            if (options.attributeFilter && options.attributeFilter.length &&
                options.attributeFilter.indexOf(name) === -1 &&
                options.attributeFilter.indexOf(namespace) === -1) {
              return;
            }
            // 3.3, 4.4
            if (options.attributeOldValue)
              return getRecordWithOldValue(oldValue);

            // 3.4, 4.5
            return record;
          });

          break;

        case 'DOMCharacterDataModified':
          // http://dom.spec.whatwg.org/#concept-mo-queue-characterdata
          var target = e.target;

          // 1.
          var record = getRecord('characterData', target);

          // 2.
          var oldValue = e.prevValue;


          forEachAncestorAndObserverEnqueueRecord(target, function(options) {
            // 3.1, 4.2
            if (!options.characterData)
              return;

            // 3.2, 4.3
            if (options.characterDataOldValue)
              return getRecordWithOldValue(oldValue);

            // 3.3, 4.4
            return record;
          });

          break;

        case 'DOMNodeRemoved':
          this.addTransientObserver(e.target);
          // Fall through.
        case 'DOMNodeInserted':
          // http://dom.spec.whatwg.org/#concept-mo-queue-childlist
          var target = e.relatedNode;
          var changedNode = e.target;
          var addedNodes, removedNodes;
          if (e.type === 'DOMNodeInserted') {
            addedNodes = [changedNode];
            removedNodes = [];
          } else {

            addedNodes = [];
            removedNodes = [changedNode];
          }
          var previousSibling = changedNode.previousSibling;
          var nextSibling = changedNode.nextSibling;

          // 1.
          var record = getRecord('childList', target);
          record.addedNodes = addedNodes;
          record.removedNodes = removedNodes;
          record.previousSibling = previousSibling;
          record.nextSibling = nextSibling;

          forEachAncestorAndObserverEnqueueRecord(target, function(options) {
            // 2.1, 3.2
            if (!options.childList)
              return;

            // 2.2, 3.3
            return record;
          });

      }

      clearRecords();
    }
  };

  global.JsMutationObserver = JsMutationObserver;

  if (!global.MutationObserver)
    global.MutationObserver = JsMutationObserver;


})(this);

/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
/*
	Create polyfill scope and feature detect native support.
*/
window.HTMLImports = window.HTMLImports || {flags:{}};

(function(scope) {

/**
	Basic setup and simple module executer. We collect modules and then execute
  the code later, only if it's necessary for polyfilling.
*/
var IMPORT_LINK_TYPE = 'import';
var useNative = Boolean(IMPORT_LINK_TYPE in document.createElement('link'));

// world's simplest module initializer
var modules = [];
var addModule = function(module) {
	modules.push(module);
};

var initializeModules = function() {
	modules.forEach(function(module) {
		module(scope);
	});
};

/**
  Support `currentScript` on all browsers as `document._currentScript.`

  NOTE: We cannot polyfill `document.currentScript` because it's not possible
  both to override and maintain the ability to capture the native value.
  Therefore we choose to expose `_currentScript` both when native imports
  and the polyfill are in use.
*/
// NOTE: ShadowDOMPolyfill intrusion.
var hasShadowDOMPolyfill = Boolean(window.ShadowDOMPolyfill);
var wrap = function(node) {
  return hasShadowDOMPolyfill ? ShadowDOMPolyfill.wrapIfNeeded(node) : node;
};
var rootDocument = wrap(document);

var currentScriptDescriptor = {
  get: function() {
    var script = HTMLImports.currentScript || document.currentScript ||
        // NOTE: only works when called in synchronously executing code.
        // readyState should check if `loading` but IE10 is 
        // interactive when scripts run so we cheat.
        (document.readyState !== 'complete' ? 
        document.scripts[document.scripts.length - 1] : null);
    return wrap(script);
  },
  configurable: true
};

Object.defineProperty(document, '_currentScript', currentScriptDescriptor);
Object.defineProperty(rootDocument, '_currentScript', currentScriptDescriptor);

/**
  Add support for the `HTMLImportsLoaded` event and the `HTMLImports.whenReady`
  method. This api is necessary because unlike the native implementation,
  script elements do not force imports to resolve. Instead, users should wrap
  code in either an `HTMLImportsLoaded` hander or after load time in an
  `HTMLImports.whenReady(callback)` call.

  NOTE: This module also supports these apis under the native implementation. 
  Therefore, if this file is loaded, the same code can be used under both 
  the polyfill and native implementation.
 */

var isIE = /Trident/.test(navigator.userAgent);

// call a callback when all HTMLImports in the document at call time 
// (or at least document ready) have loaded.
// 1. ensure the document is in a ready state (has dom), then 
// 2. watch for loading of imports and call callback when done
function whenReady(callback, doc) {
  doc = doc || rootDocument;
  // if document is loading, wait and try again
  whenDocumentReady(function() {
    watchImportsLoad(callback, doc);
  }, doc);
}

// call the callback when the document is in a ready state (has dom)
var requiredReadyState = isIE ? 'complete' : 'interactive';
var READY_EVENT = 'readystatechange';
function isDocumentReady(doc) {
  return (doc.readyState === 'complete' ||
      doc.readyState === requiredReadyState);
}

// call <callback> when we ensure the document is in a ready state
function whenDocumentReady(callback, doc) {
  if (!isDocumentReady(doc)) {
    var checkReady = function() {
      if (doc.readyState === 'complete' || 
          doc.readyState === requiredReadyState) {
        doc.removeEventListener(READY_EVENT, checkReady);
        whenDocumentReady(callback, doc);
      }
    };
    doc.addEventListener(READY_EVENT, checkReady);
  } else if (callback) {
    callback();
  }
}

function markTargetLoaded(event) {
  event.target.__loaded = true;
}

// call <callback> when we ensure all imports have loaded
function watchImportsLoad(callback, doc) {
  var imports = doc.querySelectorAll('link[rel=import]');
  var loaded = 0, l = imports.length;
  function checkDone(d) { 
    if ((loaded == l) && callback) {
       callback();
    }
  }
  function loadedImport(e) {
    markTargetLoaded(e);
    loaded++;
    checkDone();
  }
  if (l) {
    for (var i=0, imp; (i<l) && (imp=imports[i]); i++) {
      if (isImportLoaded(imp)) {
        loadedImport.call(imp, {target: imp});
      } else {
        imp.addEventListener('load', loadedImport);
        imp.addEventListener('error', loadedImport);
      }
    }
  } else {
    checkDone();
  }
}

// NOTE: test for native imports loading is based on explicitly watching
// all imports (see below).
// However, we cannot rely on this entirely without watching the entire document
// for import links. For perf reasons, currently only head is watched.
// Instead, we fallback to checking if the import property is available 
// and the document is not itself loading. 
function isImportLoaded(link) {
  return useNative ? link.__loaded || 
      (link.import && link.import.readyState !== 'loading') :
      link.__importParsed;
}

// TODO(sorvell): Workaround for 
// https://www.w3.org/Bugs/Public/show_bug.cgi?id=25007, should be removed when
// this bug is addressed.
// (1) Install a mutation observer to see when HTMLImports have loaded
// (2) if this script is run during document load it will watch any existing
// imports for loading.
//
// NOTE: The workaround has restricted functionality: (1) it's only compatible
// with imports that are added to document.head since the mutation observer 
// watches only head for perf reasons, (2) it requires this script
// to run before any imports have completed loading.
if (useNative) {
  new MutationObserver(function(mxns) {
    for (var i=0, l=mxns.length, m; (i < l) && (m=mxns[i]); i++) {
      if (m.addedNodes) {
        handleImports(m.addedNodes);
      }
    }
  }).observe(document.head, {childList: true});

  function handleImports(nodes) {
    for (var i=0, l=nodes.length, n; (i<l) && (n=nodes[i]); i++) {
      if (isImport(n)) {
        handleImport(n);  
      }
    }
  }

  function isImport(element) {
    return element.localName === 'link' && element.rel === 'import';
  }

  function handleImport(element) {
    var loaded = element.import;
    if (loaded) {
      markTargetLoaded({target: element});
    } else {
      element.addEventListener('load', markTargetLoaded);
      element.addEventListener('error', markTargetLoaded);
    }
  }

  // make sure to catch any imports that are in the process of loading
  // when this script is run.
  (function() {
    if (document.readyState === 'loading') {
      var imports = document.querySelectorAll('link[rel=import]');
      for (var i=0, l=imports.length, imp; (i<l) && (imp=imports[i]); i++) {
        handleImport(imp);
      }
    }
  })();

}

// IE shim for CustomEvent
if (typeof window.CustomEvent !== 'function') {
  window.CustomEvent = function(inType, dictionary) {
     var e = document.createEvent('HTMLEvents');
     e.initEvent(inType,
        dictionary.bubbles === false ? false : true,
        dictionary.cancelable === false ? false : true,
        dictionary.detail);
     return e;
  };
}

// Fire the 'HTMLImportsLoaded' event when imports in document at load time 
// have loaded. This event is required to simulate the script blocking 
// behavior of native imports. A main document script that needs to be sure
// imports have loaded should wait for this event.
whenReady(function() {
  HTMLImports.ready = true;
  HTMLImports.readyTime = new Date().getTime();
  rootDocument.dispatchEvent(
    new CustomEvent('HTMLImportsLoaded', {bubbles: true})
  );
});

// exports
scope.IMPORT_LINK_TYPE = IMPORT_LINK_TYPE;
scope.useNative = useNative;
scope.addModule = addModule;
scope.initializeModules = initializeModules;
scope.rootDocument = rootDocument;
scope.whenReady = whenReady;
scope.isIE = isIE;

})(window.HTMLImports);


/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
HTMLImports.addModule(function(scope) {

var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;

// path fixup: style elements in imports must be made relative to the main 
// document. We fixup url's in url() and @import.
var path = {

  resolveUrlsInStyle: function(style) {
    var doc = style.ownerDocument;
    var resolver = doc.createElement('a');
    style.textContent = this.resolveUrlsInCssText(style.textContent, resolver);
    return style;  
  },

  resolveUrlsInCssText: function(cssText, urlObj) {
    var r = this.replaceUrls(cssText, urlObj, CSS_URL_REGEXP);
    r = this.replaceUrls(r, urlObj, CSS_IMPORT_REGEXP);
    return r;
  },

  replaceUrls: function(text, urlObj, regexp) {
    return text.replace(regexp, function(m, pre, url, post) {
      var urlPath = url.replace(/["']/g, '');
      urlObj.href = urlPath;
      urlPath = urlObj.href;
      return pre + '\'' + urlPath + '\'' + post;
    });    
  }

};

// exports
scope.path = path;

});

/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
HTMLImports.addModule(function(scope) {

/*
  xhr processor.
*/
xhr = {
  async: true,

  ok: function(request) {
    return (request.status >= 200 && request.status < 300)
        || (request.status === 304)
        || (request.status === 0);
  },

  load: function(url, next, nextContext) {
    var request = new XMLHttpRequest();
    if (scope.flags.debug || scope.flags.bust) {
      url += '?' + Math.random();
    }
    request.open('GET', url, xhr.async);
    request.addEventListener('readystatechange', function(e) {
      if (request.readyState === 4) {
        // Servers redirecting an import can add a Location header to help us
        // polyfill correctly.
        var locationHeader = request.getResponseHeader("Location");
        var redirectedUrl = null;
        if (locationHeader) {
          var redirectedUrl = (locationHeader.substr( 0, 1 ) === "/")
            ? location.origin + locationHeader  // Location is a relative path
            : locationHeader;                    // Full path
        }
        next.call(nextContext, !xhr.ok(request) && request,
            request.response || request.responseText, redirectedUrl);
      }
    });
    request.send();
    return request;
  },

  loadDocument: function(url, next, nextContext) {
    this.load(url, next, nextContext).responseType = 'document';
  }
  
};

// exports
scope.xhr = xhr;

});

/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
HTMLImports.addModule(function(scope) {

// imports
var xhr = scope.xhr;
var flags = scope.flags;

// This loader supports a dynamic list of urls
// and an oncomplete callback that is called when the loader is done.
// NOTE: The polyfill currently does *not* need this dynamism or the 
// onComplete concept. Because of this, the loader could be simplified 
// quite a bit.
var Loader = function(onLoad, onComplete) {
  this.cache = {};
  this.onload = onLoad;
  this.oncomplete = onComplete;
  this.inflight = 0;
  this.pending = {};
};

Loader.prototype = {

  addNodes: function(nodes) {
    // number of transactions to complete
    this.inflight += nodes.length;
    // commence transactions
    for (var i=0, l=nodes.length, n; (i<l) && (n=nodes[i]); i++) {
      this.require(n);
    }
    // anything to do?
    this.checkDone();
  },

  addNode: function(node) {
    // number of transactions to complete
    this.inflight++;
    // commence transactions
    this.require(node);
    // anything to do?
    this.checkDone();
  },

  require: function(elt) {
    var url = elt.src || elt.href;
    // ensure we have a standard url that can be used
    // reliably for deduping.
    // TODO(sjmiles): ad-hoc
    elt.__nodeUrl = url;
    // deduplication
    if (!this.dedupe(url, elt)) {
      // fetch this resource
      this.fetch(url, elt);
    }
  },

  dedupe: function(url, elt) {
    if (this.pending[url]) {
      // add to list of nodes waiting for inUrl
      this.pending[url].push(elt);
      // don't need fetch
      return true;
    }
    var resource;
    if (this.cache[url]) {
      this.onload(url, elt, this.cache[url]);
      // finished this transaction
      this.tail();
      // don't need fetch
      return true;
    }
    // first node waiting for inUrl
    this.pending[url] = [elt];
    // need fetch (not a dupe)
    return false;
  },

  fetch: function(url, elt) {
    flags.load && console.log('fetch', url, elt);
    if (url.match(/^data:/)) {
      // Handle Data URI Scheme
      var pieces = url.split(',');
      var header = pieces[0];
      var body = pieces[1];
      if(header.indexOf(';base64') > -1) {
        body = atob(body);
      } else {
        body = decodeURIComponent(body);
      }
      setTimeout(function() {
          this.receive(url, elt, null, body);
      }.bind(this), 0);
    } else {
      var receiveXhr = function(err, resource, redirectedUrl) {
        this.receive(url, elt, err, resource, redirectedUrl);
      }.bind(this);
      xhr.load(url, receiveXhr);
    }
  },

  receive: function(url, elt, err, resource, redirectedUrl) {
    this.cache[url] = resource;
    var $p = this.pending[url];
    for (var i=0, l=$p.length, p; (i<l) && (p=$p[i]); i++) {
      // If url was redirected, use the redirected location so paths are
      // calculated relative to that.
      this.onload(url, p, resource, err, redirectedUrl);
      this.tail();
    }
    this.pending[url] = null;
  },

  tail: function() {
    --this.inflight;
    this.checkDone();
  },

  checkDone: function() {
    if (!this.inflight) {
      this.oncomplete();
    }
  }

};

// exports
scope.Loader = Loader;

});
/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
HTMLImports.addModule(function(scope) {

/*
  Use a mutation observer to call a callback for all added nodes.
*/
var Observer = function(addCallback) {
  this.addCallback = addCallback;
  this.mo = new MutationObserver(this.handler.bind(this));
};

Observer.prototype = {

  // we track mutations for addedNodes, looking for imports
  handler: function(mutations) {
    for (var i=0, l=mutations.length, m; (i<l) && (m=mutations[i]); i++) {
      if (m.type === 'childList' && m.addedNodes.length) {
        this.addedNodes(m.addedNodes);
      }
    }
  },

  addedNodes: function(nodes) {
    if (this.addCallback) {
      this.addCallback(nodes);
    }
    for (var i=0, l=nodes.length, n, loading; (i<l) && (n=nodes[i]); i++) {
      if (n.children && n.children.length) {
        this.addedNodes(n.children);
      }
    }
  },

  observe: function(root) {
    this.mo.observe(root, {childList: true, subtree: true});
  }

};

// exports
scope.Observer = Observer;

});

/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
HTMLImports.addModule(function(scope) {

// imports
var path = scope.path;
var rootDocument = scope.rootDocument;
var flags = scope.flags;
var isIE = scope.isIE;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = 'link[rel=' + IMPORT_LINK_TYPE + ']';

// importParser
// highlander object to manage parsing of imports
// parses import related elements and ensures proper parse order
// parse order is enforced by crawling the tree and monitoring which elements
// have been parsed;
// elements can be dynamically added to imports. These are maintained in a 
// separate queue and parsed after all other elements.
var importParser = {

  // parse selectors for main document elements
  documentSelectors: IMPORT_SELECTOR,

  // parse selectors for import document elements
  importsSelectors: [
    IMPORT_SELECTOR,
    'link[rel=stylesheet]',
    'style',
    'script:not([type])',
    'script[type="text/javascript"]'
  ].join(','),

  map: {
    link: 'parseLink',
    script: 'parseScript',
    style: 'parseStyle'
  },

  dynamicElements: [],

  // try to parse the next import in the tree
  parseNext: function() {
    var next = this.nextToParse();
    if (next) {
      this.parse(next);
    }
  },

  parse: function(elt) {
    if (this.isParsed(elt)) {
      flags.parse && console.log('[%s] is already parsed', elt.localName);
      return;
    }
    var fn = this[this.map[elt.localName]];
    if (fn) {
      this.markParsing(elt);
      fn.call(this, elt);
    }
  },

  // marks an element for dynamic parsing and attempts to parse the next element
  parseDynamic: function(elt, quiet) {
    this.dynamicElements.push(elt);
    if (!quiet) {
      this.parseNext();
    }
  },

  // only 1 element may be parsed at a time; parsing is async so each
  // parsing implementation must inform the system that parsing is complete
  // via markParsingComplete.
  // To prompt the system to parse the next element, parseNext should then be
  // called.
  // Note, parseNext used to be included at the end of markParsingComplete, but
  // we must not do this so that, for example, we can (1) mark parsing complete 
  // then (2) fire an import load event, and then (3) parse the next resource.
  markParsing: function(elt) {
    flags.parse && console.log('parsing', elt);
    this.parsingElement = elt;
  },

  markParsingComplete: function(elt) {
    elt.__importParsed = true;
    this.markDynamicParsingComplete(elt);
    if (elt.__importElement) {
      elt.__importElement.__importParsed = true;
      this.markDynamicParsingComplete(elt.__importElement);
    }
    this.parsingElement = null;
    flags.parse && console.log('completed', elt);
  },

  markDynamicParsingComplete: function(elt) {
    var i = this.dynamicElements.indexOf(elt);
    if (i >= 0) {
      this.dynamicElements.splice(i, 1);
    }
  },

  parseImport: function(elt) {
    // TODO(sorvell): consider if there's a better way to do this;
    // expose an imports parsing hook; this is needed, for example, by the
    // CustomElements polyfill.
    if (HTMLImports.__importsParsingHook) {
      HTMLImports.__importsParsingHook(elt);
    }
    if (elt.import) {
      elt.import.__importParsed = true;
    }
    this.markParsingComplete(elt);
    // fire load event
    if (elt.__resource && !elt.__error) {
      elt.dispatchEvent(new CustomEvent('load', {bubbles: false}));    
    } else {
      elt.dispatchEvent(new CustomEvent('error', {bubbles: false}));
    }
    // TODO(sorvell): workaround for Safari addEventListener not working
    // for elements not in the main document.
    if (elt.__pending) {
      var fn;
      while (elt.__pending.length) {
        fn = elt.__pending.shift();
        if (fn) {
          fn({target: elt});
        }
      }
    }
    this.parseNext();
  },

  parseLink: function(linkElt) {
    if (nodeIsImport(linkElt)) {
      this.parseImport(linkElt);
    } else {
      // make href absolute
      linkElt.href = linkElt.href;
      this.parseGeneric(linkElt);
    }
  },

  parseStyle: function(elt) {
    // TODO(sorvell): style element load event can just not fire so clone styles
    var src = elt;
    elt = cloneStyle(elt);
    elt.__importElement = src;
    this.parseGeneric(elt);
  },

  parseGeneric: function(elt) {
    this.trackElement(elt);
    this.addElementToDocument(elt);
  },

  rootImportForElement: function(elt) {
    var n = elt;
    while (n.ownerDocument.__importLink) {
      n = n.ownerDocument.__importLink;
    }
    return n;
  },

  addElementToDocument: function(elt) {
    var port = this.rootImportForElement(elt.__importElement || elt);
    var l = port.__insertedElements = port.__insertedElements || 0;
    var refNode = port.nextElementSibling;
    for (var i=0; i < l; i++) {
      refNode = refNode && refNode.nextElementSibling;
    }
    port.parentNode.insertBefore(elt, refNode);
  },

  // tracks when a loadable element has loaded
  trackElement: function(elt, callback) {
    var self = this;
    var done = function(e) {
      if (callback) {
        callback(e);
      }
      self.markParsingComplete(elt);
      self.parseNext();
    };
    elt.addEventListener('load', done);
    elt.addEventListener('error', done);

    // NOTE: IE does not fire "load" event for styles that have already loaded
    // This is in violation of the spec, so we try our hardest to work around it
    if (isIE && elt.localName === 'style') {
      var fakeLoad = false;
      // If there's not @import in the textContent, assume it has loaded
      if (elt.textContent.indexOf('@import') == -1) {
        fakeLoad = true;
      // if we have a sheet, we have been parsed
      } else if (elt.sheet) {
        fakeLoad = true;
        var csr = elt.sheet.cssRules;
        var len = csr ? csr.length : 0;
        // search the rules for @import's
        for (var i = 0, r; (i < len) && (r = csr[i]); i++) {
          if (r.type === CSSRule.IMPORT_RULE) {
            // if every @import has resolved, fake the load
            fakeLoad = fakeLoad && Boolean(r.styleSheet);
          }
        }
      }
      // dispatch a fake load event and continue parsing
      if (fakeLoad) {
        elt.dispatchEvent(new CustomEvent('load', {bubbles: false}));
      }
    }
  },

  // NOTE: execute scripts by injecting them and watching for the load/error
  // event. Inline scripts are handled via dataURL's because browsers tend to
  // provide correct parsing errors in this case. If this has any compatibility
  // issues, we can switch to injecting the inline script with textContent.
  parseScript: function(scriptElt) {
    var script = document.createElement('script');
    script.__importElement = scriptElt;
    script.src = scriptElt.src ? scriptElt.src : 
        generateScriptDataUrl(scriptElt);
    // keep track of executing script to help polyfill `document.currentScript`
    scope.currentScript = scriptElt;
    this.trackElement(script, function(e) {
      script.parentNode.removeChild(script);
      scope.currentScript = null;  
    });
    this.addElementToDocument(script);
  },

  // determine the next element in the tree which should be parsed
  // crawl the document tree to find the next unparsed element
  // then process any dynamically added elements (these should process in 'add'
  // order.
  nextToParse: function() {
    this._mayParse = [];
    return !this.parsingElement && (this.nextToParseInDoc(rootDocument) || 
        this.nextToParseDynamic());
  },

  nextToParseInDoc: function(doc, link) {
    // use `marParse` list to avoid looping into the same document again
    // since it could cause an iloop.
    if (doc && this._mayParse.indexOf(doc) < 0) {
      this._mayParse.push(doc);
      var nodes = doc.querySelectorAll(this.parseSelectorsForNode(doc));
      for (var i=0, l=nodes.length, p=0, n; (i<l) && (n=nodes[i]); i++) {
        if (!this.isParsed(n)) {
          if (this.hasResource(n)) {
            return nodeIsImport(n) ? this.nextToParseInDoc(n.import, n) : n;
          } else {
            return;
          }
        }
      }
    }
    // all nodes have been parsed, ready to parse import, if any
    return link;
  },

  // note dynamically added elements are stored in a separate queue
  nextToParseDynamic: function() {
    return this.dynamicElements[0];
  },

  // return the set of parse selectors relevant for this node.
  parseSelectorsForNode: function(node) {
    var doc = node.ownerDocument || node;
    return doc === rootDocument ? this.documentSelectors :
        this.importsSelectors;
  },

  isParsed: function(node) {
    return node.__importParsed;
  },

  needsDynamicParsing: function(elt) {
    return (this.dynamicElements.indexOf(elt) >= 0);
  },

  hasResource: function(node) {
    if (nodeIsImport(node) && (node.import === undefined)) {
      return false;
    }
    return true;
  }

};

function nodeIsImport(elt) {
  return (elt.localName === 'link') && (elt.rel === IMPORT_LINK_TYPE);
}

function generateScriptDataUrl(script) {
  var scriptContent = generateScriptContent(script);
  return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(scriptContent);
}

function generateScriptContent(script) {
  return script.textContent + generateSourceMapHint(script);
}

// calculate source map hint
function generateSourceMapHint(script) {
  var owner = script.ownerDocument;
  owner.__importedScripts = owner.__importedScripts || 0;
  var moniker = script.ownerDocument.baseURI;
  var num = owner.__importedScripts ? '-' + owner.__importedScripts : '';
  owner.__importedScripts++;
  return '\n//# sourceURL=' + moniker + num + '.js\n';
}

// style/stylesheet handling

// clone style with proper path resolution for main document
// NOTE: styles are the only elements that require direct path fixup.
function cloneStyle(style) {
  var clone = style.ownerDocument.createElement('style');
  clone.textContent = style.textContent;
  path.resolveUrlsInStyle(clone);
  return clone;
}

// exports
scope.parser = importParser;
scope.IMPORT_SELECTOR = IMPORT_SELECTOR;

});

/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
HTMLImports.addModule(function(scope) {

// imports
var flags = scope.flags;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = scope.IMPORT_SELECTOR;
var rootDocument = scope.rootDocument;
var Loader = scope.Loader;
var Observer = scope.Observer;
var parser = scope.parser;

// importer
// highlander object to manage loading of imports
// for any document, importer:
// - loads any linked import documents (with deduping)
// - whenever an import is loaded, prompts the parser to try to parse
// - observes imported documents for new elements (these are handled via the 
// dynamic importer)
var importer = {

  documents: {},
  
  // nodes to load in the mian document
  documentPreloadSelectors: IMPORT_SELECTOR,
  
  // nodes to load in imports
  importsPreloadSelectors: [
    IMPORT_SELECTOR
  ].join(','),
  
  loadNode: function(node) {
    importLoader.addNode(node);
  },
  
  // load all loadable elements within the parent element
  loadSubtree: function(parent) {
    var nodes = this.marshalNodes(parent);
    // add these nodes to loader's queue
    importLoader.addNodes(nodes);
  },
  
  marshalNodes: function(parent) {
    // all preloadable nodes in inDocument
    return parent.querySelectorAll(this.loadSelectorsForNode(parent));
  },
  
  // find the proper set of load selectors for a given node
  loadSelectorsForNode: function(node) {
    var doc = node.ownerDocument || node;
    return doc === rootDocument ? this.documentPreloadSelectors :
        this.importsPreloadSelectors;
  },
  
  loaded: function(url, elt, resource, err, redirectedUrl) {
    flags.load && console.log('loaded', url, elt);
    // store generic resource
    // TODO(sorvell): fails for nodes inside <template>.content
    // see https://code.google.com/p/chromium/issues/detail?id=249381.
    elt.__resource = resource;
    elt.__error = err;
    if (isImportLink(elt)) {
      var doc = this.documents[url];
      // if we've never seen a document at this url
      if (doc === undefined) {
        // generate an HTMLDocument from data
        doc = err ? null : makeDocument(resource, redirectedUrl || url);
        if (doc) {
          doc.__importLink = elt;
          // note, we cannot use MO to detect parsed nodes because
          // SD polyfill does not report these as mutations.
          this.bootDocument(doc);
        }
        // cache document
        this.documents[url] = doc;
      }
      // don't store import record until we're actually loaded
      // store document resource
      elt.import = doc;
    }
    parser.parseNext();
  },
  
  bootDocument: function(doc) {
    this.loadSubtree(doc);
    // observe documents for new elements being added
    this.observer.observe(doc);
    parser.parseNext();
  },

  loadedAll: function() {
    parser.parseNext();
  }

};

// loader singleton to handle loading imports
var importLoader = new Loader(importer.loaded.bind(importer), 
    importer.loadedAll.bind(importer));

// observer singleton to handle observing elements in imports
// NOTE: the observer has a node added callback and this is set 
// by the dynamic importer module.
importer.observer = new Observer();

function isImportLink(elt) {
  return isLinkRel(elt, IMPORT_LINK_TYPE);
}

function isLinkRel(elt, rel) {
  return elt.localName === 'link' && elt.getAttribute('rel') === rel;
}

function makeDocument(resource, url) {
  // create a new HTML document
  var doc = document.implementation.createHTMLDocument(IMPORT_LINK_TYPE);
  // cache the new document's source url
  doc._URL = url;
  // establish a relative path via <base>
  var base = doc.createElement('base');
  base.setAttribute('href', url);
  // add baseURI support to browsers (IE) that lack it.
  if (!doc.baseURI) {
    doc.baseURI = url;
  }
  // ensure UTF-8 charset
  var meta = doc.createElement('meta');
  meta.setAttribute('charset', 'utf-8');

  doc.head.appendChild(meta);
  doc.head.appendChild(base);
  // install html
  doc.body.innerHTML = resource;
  // TODO(sorvell): ideally this code is not aware of Template polyfill,
  // but for now the polyfill needs help to bootstrap these templates
  if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
    HTMLTemplateElement.bootstrap(doc);
  }
  return doc;
}

// Polyfill document.baseURI for browsers without it.
if (!document.baseURI) {
  var baseURIDescriptor = {
    get: function() {
      var base = document.querySelector('base');
      return base ? base.href : window.location.href;
    },
    configurable: true
  };

  Object.defineProperty(document, 'baseURI', baseURIDescriptor);
  Object.defineProperty(rootDocument, 'baseURI', baseURIDescriptor);
}

// exports
scope.importer = importer;
scope.importLoader = importLoader;

});
/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
HTMLImports.addModule(function(scope) {

// imports
var parser = scope.parser;
var importer = scope.importer;

// dynamic
// highlander object to manage elements dynamically added to imports
// for any observed document, dynamic:
// - tells the importer to load any imports that are added.
// - tells the parser to parse any added elements that need to be parsed.
// dynamic importer)
var dynamic = {
  // process (load/parse) any nodes added to imported documents.
  added: function(nodes) {
    var owner, parsed;
    for (var i=0, l=nodes.length, n; (i<l) && (n=nodes[i]); i++) {
      if (!owner) {
        owner = n.ownerDocument;
        parsed = parser.isParsed(owner);
      }
      // note: the act of loading kicks the parser, so we use parseDynamic's
      // 2nd argument to control if this added node needs to kick the parser.
      loading = this.shouldLoadNode(n);
      if (loading) {
        importer.loadNode(n);
      }
      if (this.shouldParseNode(n) && parsed) {
        parser.parseDynamic(n, loading);
      }
    }
  },

  shouldLoadNode: function(node) {
    return (node.nodeType === 1) && matches.call(node,
        importer.loadSelectorsForNode(node));
  },

  shouldParseNode: function(node) {
    return (node.nodeType === 1) && matches.call(node,
        parser.parseSelectorsForNode(node));  
  }
  
};

// let the dynamic element helper tie into the import observer.
importer.observer.addCallback = dynamic.added.bind(dynamic);

// x-plat matches
var matches = HTMLElement.prototype.matches || 
    HTMLElement.prototype.matchesSelector || 
    HTMLElement.prototype.webkitMatchesSelector ||
    HTMLElement.prototype.mozMatchesSelector ||
    HTMLElement.prototype.msMatchesSelector;

});

/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
(function(scope){

// imports
initializeModules = scope.initializeModules;

/*
NOTE: Even when native HTMLImports exists, the following api is available by
loading the polyfill. This provides api compabitility where the polyfill
cannot be "correct":

  * `document._currentScript`
  * `HTMLImportsLoaded` event
  * `HTMLImports.whenReady(callback)
*/
if (scope.useNative) {
  return;
}

// Initialize polyfill modules. Note, polyfill modules are loaded but not 
// executed; this is a convenient way to control which modules run when 
// the polyfill is required and allows the polyfill to load even when it's
// not needed.
initializeModules();

// imports
var rootDocument = scope.rootDocument;

/*
  Bootstrap the imports machine.
*/
function bootstrap() {
  HTMLImports.importer.bootDocument(rootDocument);
}
  
// TODO(sorvell): SD polyfill does *not* generate mutations for nodes added
// by the parser. For this reason, we must wait until the dom exists to 
// bootstrap.
if (document.readyState === 'complete' ||
    (document.readyState === 'interactive' && !window.attachEvent)) {
  bootstrap();
} else {
  document.addEventListener('DOMContentLoaded', bootstrap);
}

})(HTMLImports);

(function() {

    if (!window.Platform || !window.Platform.name) {
        throw 'Bosonic runtime needs the Bosonic platform to be loaded first.';
    }

    function buildShadowRegexes(elementName) {
        return [
            [/:host\(([^:]+)\)/g, elementName+'$1'],
            [/:host(:hover|:active|:focus)/g, elementName+'$1'],
            [/:host(\[[^:]+\])/g, elementName+'$1'],
            [/:host/g, elementName],
            [/:ancestor\(([^:]+)\)/g, '$1 '+elementName], // deprecated; replaced by :host-context
            [/:host-context\(([^:]+)\)/g, '$1 '+elementName],
            [/::content/g, elementName],
        ];
    }

    function shimStyles(styles, elementName) {
        var selectorRegexes = buildShadowRegexes(elementName);
        for (var i = 0; i < selectorRegexes.length; i++) {
            var re = selectorRegexes[i];
            styles = styles.replace(re[0], re[1]);
        }
        return styles;
    }

    function parseCSS(str) {
        var doc = document.implementation.createHTMLDocument(''),
            styleElt = document.createElement("style");
        
        styleElt.textContent = str;
        doc.body.appendChild(styleElt);
        
        return styleElt.sheet.cssRules;
    }

    if (!window.Bosonic) {
        window.Bosonic = {};
    }

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

    function scopeShadowStyles(root, name) {
        var styles = root.querySelectorAll('style');
        Array.prototype.forEach.call(styles, function(style) {
            var rules = parseCSS(shimStyles(style.textContent, name));
            var css = '';
            Array.prototype.forEach.call(rules, function(rule) {
                if (!rule.selectorText.match(new RegExp(name))) {
                    css += name + ' ' + rule.cssText + '\n';
                    css += name + '::shadow ' + rule.cssText + '\n';
                } else {
                    css += rule.cssText + '\n';
                }
            });
            var s = document.createElement('style');
            s.textContent = css;
            document.head.appendChild(s);
            // if we have a prefixed (and therefore flaky) native impl., we keep the <style> in the shadow root, just in case
            if (Platform.shadowDOM !== 'prefixed') {
                style.parentNode.removeChild(style);
            }
        });
    }

    function getFragmentFromNode(node) {
        var fragment = document.createDocumentFragment();
        while (child = node.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
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

        var prototype = {};

        if (template) {
            var created = options.createdCallback;
            if (created) delete options.createdCallback;
            prototype.createdCallback = {
                enumerable: true,
                writable: true,
                value: function() {
                    this.createShadowRoot();
                    var content = template.content ? template.content : getFragmentFromNode(template);
                    this.shadowRoot.appendChild(document.importNode(content, true));
                    if (Platform.shadowDOM !== 'native') {
                        scopeShadowStyles(this.shadowRoot, name);
                    }
                    return created ? created.apply(this, arguments) : null;
                }
            };
        }

        if (attributes) {
            var changed = options.attributeChangedCallback,
                attrs = attributes.split(' ');

            if (changed) delete options.attributeChangedCallback;
            prototype.attributeChangedCallback = {
                enumerable: true,
                writable: true,
                value: function(name, oldValue, newValue) {
                    if (attrs.indexOf(name) !== -1 && this[name + 'Changed']) {
                        this[name + 'Changed'].call(this, oldValue, newValue);
                    }
                    return changed ? changed.apply(this, arguments) : null;
                }
            };
        }

        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                prototype[key] = Object.getOwnPropertyDescriptor(options, key);
            }
        }

        var elementDef = {
            prototype: Object.create(window[extendeeClass].prototype, prototype)
        };
        if (extendee && extendsNativeElt) { 
            elementDef.extends = extendee;
        }

        window[elementClass] = document.registerElement(name, elementDef);
    }
})();