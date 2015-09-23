var HANDJS = HANDJS || {};

(function () {
    // If the user agent already supports Pointer Events, do nothing
    if (window.PointerEvent)
        return;

    // Polyfilling indexOf for old browsers
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement) {
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n !== n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }
    //Polyfilling forEach for old browsers
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (method, thisArg) {
            if (!this || !(method instanceof Function))
                throw new TypeError();
            for (var i = 0; i < this.length; i++)
                method.call(thisArg, this[i], i, this);
        };
    }
	// Polyfilling trim for old browsers
	if (!String.prototype.trim) {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/, '');
		};
	}

    // Installing Hand.js
    var supportedEventsNames = ["pointerdown", "pointerup", "pointermove", "pointerover", "pointerout", "pointercancel", "pointerenter", "pointerleave"];
    var upperCaseEventsNames = ["PointerDown", "PointerUp", "PointerMove", "PointerOver", "PointerOut", "PointerCancel", "PointerEnter", "PointerLeave"];

    var POINTER_TYPE_TOUCH = "touch";
    var POINTER_TYPE_PEN = "pen";
    var POINTER_TYPE_MOUSE = "mouse";

    var previousTargets = {};

    var checkPreventDefault = function (node) {
        while (node && !node.handjs_forcePreventDefault) {
            node = node.parentNode;
        }
        return !!node || window.handjs_forcePreventDefault;
    };

    // Touch events
    var generateTouchClonedEvent = function (sourceEvent, newName, canBubble, target, relatedTarget) {
        // Considering touch events are almost like super mouse events
        var evObj;
        
        if (document.createEvent) {
            evObj = document.createEvent('MouseEvents');
            evObj.initMouseEvent(newName, canBubble, true, window, 1, sourceEvent.screenX, sourceEvent.screenY,
                sourceEvent.clientX, sourceEvent.clientY, sourceEvent.ctrlKey, sourceEvent.altKey,
                sourceEvent.shiftKey, sourceEvent.metaKey, sourceEvent.button, relatedTarget || sourceEvent.relatedTarget);
        }
        else {
            evObj = document.createEventObject();
            evObj.screenX = sourceEvent.screenX;
            evObj.screenY = sourceEvent.screenY;
            evObj.clientX = sourceEvent.clientX;
            evObj.clientY = sourceEvent.clientY;
            evObj.ctrlKey = sourceEvent.ctrlKey;
            evObj.altKey = sourceEvent.altKey;
            evObj.shiftKey = sourceEvent.shiftKey;
            evObj.metaKey = sourceEvent.metaKey;
            evObj.button = sourceEvent.button;
            evObj.relatedTarget = relatedTarget || sourceEvent.relatedTarget;
        }
        // offsets
        if (evObj.offsetX === undefined) {
            if (sourceEvent.offsetX !== undefined) {

                // For Opera which creates readonly properties
                if (Object && Object.defineProperty !== undefined) {
                    Object.defineProperty(evObj, "offsetX", {
                        writable: true
                    });
                    Object.defineProperty(evObj, "offsetY", {
                        writable: true
                    });
                }

                evObj.offsetX = sourceEvent.offsetX;
                evObj.offsetY = sourceEvent.offsetY;
            } else if (Object && Object.defineProperty !== undefined) {
                Object.defineProperty(evObj, "offsetX", {
                    get: function () {
                        if (this.currentTarget && this.currentTarget.offsetLeft) {
                            return sourceEvent.clientX - this.currentTarget.offsetLeft;
                        }
                        return sourceEvent.clientX;
                    }
                });
                Object.defineProperty(evObj, "offsetY", {
                    get: function () {
                        if (this.currentTarget && this.currentTarget.offsetTop) {
                            return sourceEvent.clientY - this.currentTarget.offsetTop;
                        }
                        return sourceEvent.clientY;
                    }
                });
            }
            else if (sourceEvent.layerX !== undefined) {
                evObj.offsetX = sourceEvent.layerX - sourceEvent.currentTarget.offsetLeft;
                evObj.offsetY = sourceEvent.layerY - sourceEvent.currentTarget.offsetTop;
            }
        }

        // adding missing properties

        if (sourceEvent.isPrimary !== undefined)
            evObj.isPrimary = sourceEvent.isPrimary;
        else
            evObj.isPrimary = true;

        if (sourceEvent.pressure)
            evObj.pressure = sourceEvent.pressure;
        else {
            var button = 0;

            if (sourceEvent.which !== undefined)
                button = sourceEvent.which;
            else if (sourceEvent.button !== undefined) {
                button = sourceEvent.button;
            }
            evObj.pressure = (button === 0) ? 0 : 0.5;
        }


        if (sourceEvent.rotation)
            evObj.rotation = sourceEvent.rotation;
        else
            evObj.rotation = 0;

        // Timestamp
        if (sourceEvent.hwTimestamp)
            evObj.hwTimestamp = sourceEvent.hwTimestamp;
        else
            evObj.hwTimestamp = 0;

        // Tilts
        if (sourceEvent.tiltX)
            evObj.tiltX = sourceEvent.tiltX;
        else
            evObj.tiltX = 0;

        if (sourceEvent.tiltY)
            evObj.tiltY = sourceEvent.tiltY;
        else
            evObj.tiltY = 0;

        // Width and Height
        if (sourceEvent.height)
            evObj.height = sourceEvent.height;
        else
            evObj.height = 0;

        if (sourceEvent.width)
            evObj.width = sourceEvent.width;
        else
            evObj.width = 0;

        // preventDefault
        evObj.preventDefault = function () {
            if (sourceEvent.preventDefault !== undefined)
                sourceEvent.preventDefault();
        };

        // stopPropagation
        if (evObj.stopPropagation !== undefined) {
            var current = evObj.stopPropagation;
            evObj.stopPropagation = function () {
                if (sourceEvent.stopPropagation !== undefined)
                    sourceEvent.stopPropagation();
                current.call(this);
            };
        }

        // Pointer values
        evObj.pointerId = sourceEvent.pointerId;
        evObj.pointerType = sourceEvent.pointerType;

        switch (evObj.pointerType) {// Old spec version check
            case 2:
                evObj.pointerType = POINTER_TYPE_TOUCH;
                break;
            case 3:
                evObj.pointerType = POINTER_TYPE_PEN;
                break;
            case 4:
                evObj.pointerType = POINTER_TYPE_MOUSE;
                break;
        }

        // Fire event
        if (target)
            target.dispatchEvent(evObj);
        else if (sourceEvent.target) {
            sourceEvent.target.dispatchEvent(evObj);
        } else {
            sourceEvent.srcElement.fireEvent("on" + getMouseEquivalentEventName(newName), evObj); // We must fallback to mouse event for very old browsers
        }
    };

    var generateMouseProxy = function (evt, eventName, canBubble, target, relatedTarget) {
        evt.pointerId = 1;
        evt.pointerType = POINTER_TYPE_MOUSE;
        generateTouchClonedEvent(evt, eventName, canBubble, target, relatedTarget);
    };

    var generateTouchEventProxy = function (name, touchPoint, target, eventObject, canBubble, relatedTarget) {
        var touchPointId = touchPoint.identifier + 2; // Just to not override mouse id

        touchPoint.pointerId = touchPointId;
        touchPoint.pointerType = POINTER_TYPE_TOUCH;
        touchPoint.currentTarget = target;

        if (eventObject.preventDefault !== undefined) {
            touchPoint.preventDefault = function () {
                eventObject.preventDefault();
            };
        }

        generateTouchClonedEvent(touchPoint, name, canBubble, target, relatedTarget);
    };

    var checkEventRegistration = function (node, eventName) {
        return node.__handjsGlobalRegisteredEvents && node.__handjsGlobalRegisteredEvents[eventName];
    };
    var findEventRegisteredNode = function (node, eventName) {
        while (node && !checkEventRegistration(node, eventName))
            node = node.parentNode;
        if (node)
            return node;
        else if (checkEventRegistration(window, eventName))
            return window;
    };

    var generateTouchEventProxyIfRegistered = function (eventName, touchPoint, target, eventObject, canBubble, relatedTarget) { // Check if user registered this event
        if (findEventRegisteredNode(target, eventName)) {
            generateTouchEventProxy(eventName, touchPoint, target, eventObject, canBubble, relatedTarget);
        }
    };

    //var handleOtherEvent = function (eventObject, name, useLocalTarget, checkRegistration) {
    //    if (eventObject.preventManipulation)
    //        eventObject.preventManipulation();

    //    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
    //        var touchPoint = eventObject.changedTouches[i];

    //        if (useLocalTarget) {
    //            previousTargets[touchPoint.identifier] = touchPoint.target;
    //        }

    //        if (checkRegistration) {
    //            generateTouchEventProxyIfRegistered(name, touchPoint, previousTargets[touchPoint.identifier], eventObject, true);
    //        } else {
    //            generateTouchEventProxy(name, touchPoint, previousTargets[touchPoint.identifier], eventObject, true);
    //        }
    //    }
    //};

    var getMouseEquivalentEventName = function (eventName) {
        return eventName.toLowerCase().replace("pointer", "mouse");
    };

    var getPrefixEventName = function (prefix, eventName) {
        var upperCaseIndex = supportedEventsNames.indexOf(eventName);
        var newEventName = prefix + upperCaseEventsNames[upperCaseIndex];

        return newEventName;
    };

    var registerOrUnregisterEvent = function (item, name, func, enable) {
        if (item.__handjsRegisteredEvents === undefined) {
            item.__handjsRegisteredEvents = [];
        }

        if (enable) {
            if (item.__handjsRegisteredEvents[name] !== undefined) {
                item.__handjsRegisteredEvents[name]++;
                return;
            }

            item.__handjsRegisteredEvents[name] = 1;
            item.addEventListener(name, func, false);
        } else {

            if (item.__handjsRegisteredEvents.indexOf(name) !== -1) {
                item.__handjsRegisteredEvents[name]--;

                if (item.__handjsRegisteredEvents[name] !== 0) {
                    return;
                }
            }
            item.removeEventListener(name, func);
            item.__handjsRegisteredEvents[name] = 0;
        }
    };

    var setTouchAware = function (item, eventName, enable) {
        // Leaving tokens
        if (!item.__handjsGlobalRegisteredEvents) {
            item.__handjsGlobalRegisteredEvents = [];
        }
        if (enable) {
            if (item.__handjsGlobalRegisteredEvents[eventName] !== undefined) {
                item.__handjsGlobalRegisteredEvents[eventName]++;
                return;
            }
            item.__handjsGlobalRegisteredEvents[eventName] = 1;
        } else {
            if (item.__handjsGlobalRegisteredEvents[eventName] !== undefined) {
                item.__handjsGlobalRegisteredEvents[eventName]--;
                if (item.__handjsGlobalRegisteredEvents[eventName] < 0) {
                    item.__handjsGlobalRegisteredEvents[eventName] = 0;
                }
            }
        }

        var nameGenerator;
        var eventGenerator;
        if (window.MSPointerEvent) {
            nameGenerator = function (name) { return getPrefixEventName("MS", name); };
            eventGenerator = generateTouchClonedEvent;
        }
        else {
            nameGenerator = getMouseEquivalentEventName;
            eventGenerator = generateMouseProxy;
        }
        switch (eventName) {
            case "pointerenter":
            case "pointerleave":
                var targetEvent = nameGenerator(eventName);
                if (item['on' + targetEvent.toLowerCase()] !== undefined) {
                    registerOrUnregisterEvent(item, targetEvent, function (evt) { eventGenerator(evt, eventName); }, enable);
                }
                break;
        }
    };

    // Intercept addEventListener calls by changing the prototype
    var interceptAddEventListener = function (root) {
        var current = root.prototype ? root.prototype.addEventListener : root.addEventListener;

        var customAddEventListener = function (name, func, capture) {
            // Branch when a PointerXXX is used
            if (supportedEventsNames.indexOf(name) !== -1) {
                setTouchAware(this, name, true);
            }

            if (current === undefined) {
                this.attachEvent("on" + getMouseEquivalentEventName(name), func);
            } else {
                current.call(this, name, func, capture);
            }
        };

        if (root.prototype) {
            root.prototype.addEventListener = customAddEventListener;
        } else {
            root.addEventListener = customAddEventListener;
        }
    };

    // Intercept removeEventListener calls by changing the prototype
    var interceptRemoveEventListener = function (root) {
        var current = root.prototype ? root.prototype.removeEventListener : root.removeEventListener;

        var customRemoveEventListener = function (name, func, capture) {
            // Release when a PointerXXX is used
            if (supportedEventsNames.indexOf(name) !== -1) {
                setTouchAware(this, name, false);
            }

            if (current === undefined) {
                this.detachEvent(getMouseEquivalentEventName(name), func);
            } else {
                current.call(this, name, func, capture);
            }
        };
        if (root.prototype) {
            root.prototype.removeEventListener = customRemoveEventListener;
        } else {
            root.removeEventListener = customRemoveEventListener;
        }
    };

    // Hooks
    interceptAddEventListener(window);
    interceptAddEventListener(window.HTMLElement || window.Element);
    interceptAddEventListener(document);
    if (!navigator.isCocoonJS){
        interceptAddEventListener(HTMLBodyElement);
        interceptAddEventListener(HTMLDivElement);
        interceptAddEventListener(HTMLImageElement);
        interceptAddEventListener(HTMLUListElement);
        interceptAddEventListener(HTMLAnchorElement);
        interceptAddEventListener(HTMLLIElement);
        interceptAddEventListener(HTMLTableElement);
        if (window.HTMLSpanElement) {
            interceptAddEventListener(HTMLSpanElement);
        }
    }
    if (window.HTMLCanvasElement) {
        interceptAddEventListener(HTMLCanvasElement);
    }
    if (!navigator.isCocoonJS && window.SVGElement) {
        interceptAddEventListener(SVGElement);
    }

    interceptRemoveEventListener(window);
    interceptRemoveEventListener(window.HTMLElement || window.Element);
    interceptRemoveEventListener(document);
    if (!navigator.isCocoonJS){
        interceptRemoveEventListener(HTMLBodyElement);
        interceptRemoveEventListener(HTMLDivElement);
        interceptRemoveEventListener(HTMLImageElement);
        interceptRemoveEventListener(HTMLUListElement);
        interceptRemoveEventListener(HTMLAnchorElement);
        interceptRemoveEventListener(HTMLLIElement);
        interceptRemoveEventListener(HTMLTableElement);
        if (window.HTMLSpanElement) {
            interceptRemoveEventListener(HTMLSpanElement);
        }
    }
    if (window.HTMLCanvasElement) {
        interceptRemoveEventListener(HTMLCanvasElement);
    }
    if (!navigator.isCocoonJS && window.SVGElement) {
        interceptRemoveEventListener(SVGElement);
    }

    // Prevent mouse event from being dispatched after Touch Events action
    var touching = false;
    var touchTimer = -1;

    function setTouchTimer() {
        touching = true;
        clearTimeout(touchTimer);
        touchTimer = setTimeout(function () {
            touching = false;
        }, 700);
        // 1. Mobile browsers dispatch mouse events 300ms after touchend
        // 2. Chrome for Android dispatch mousedown for long-touch about 650ms
        // Result: Blocking Mouse Events for 700ms.
    }

    function getFirstCommonNode(x, y) {
        while (x) {
            if (x.contains(y))
                return x;
            x = x.parentNode;
        }
        return null;
    }

    //generateProxy receives a node to dispatch the event
    function dispatchPointerEnter(currentTarget, relatedTarget, generateProxy) {
        var commonParent = getFirstCommonNode(currentTarget, relatedTarget);
        var node = currentTarget;
        var nodelist = [];
        while (node && node !== commonParent) {//target range: this to the direct child of parent relatedTarget
            if (checkEventRegistration(node, "pointerenter")) //check if any parent node has pointerenter
                nodelist.push(node);
            node = node.parentNode;
        }
        while (nodelist.length > 0)
            generateProxy(nodelist.pop());
    }

    //generateProxy receives a node to dispatch the event
    function dispatchPointerLeave(currentTarget, relatedTarget, generateProxy) {
        var commonParent = getFirstCommonNode(currentTarget, relatedTarget);
        var node = currentTarget;
        while (node && node !== commonParent) {//target range: this to the direct child of parent relatedTarget
            if (checkEventRegistration(node, "pointerleave"))//check if any parent node has pointerleave
                generateProxy(node);
            node = node.parentNode;
        }
    }
    
    // Handling events on window to prevent unwanted super-bubbling
    // All mouse events are affected by touch fallback
    function applySimpleEventTunnels(nameGenerator, eventGenerator) {
        ["pointerdown", "pointermove", "pointerup", "pointerover", "pointerout"].forEach(function (eventName) {
            window.addEventListener(nameGenerator(eventName), function (evt) {
                if (!touching && findEventRegisteredNode(evt.target, eventName))
                    eventGenerator(evt, eventName, true);
            });
        });
        if (window['on' + nameGenerator("pointerenter").toLowerCase()] === undefined)
            window.addEventListener(nameGenerator("pointerover"), function (evt) {
                if (touching)
                    return;
                var foundNode = findEventRegisteredNode(evt.target, "pointerenter");
                if (!foundNode || foundNode === window)
                    return;
                else if (!foundNode.contains(evt.relatedTarget)) {
                    dispatchPointerEnter(foundNode, evt.relatedTarget, function (targetNode) {
                        eventGenerator(evt, "pointerenter", false, targetNode, evt.relatedTarget);
                    });
                }
            });
        if (window['on' + nameGenerator("pointerleave").toLowerCase()] === undefined)
            window.addEventListener(nameGenerator("pointerout"), function (evt) {
                if (touching)
                    return;
                var foundNode = findEventRegisteredNode(evt.target, "pointerleave");
                if (!foundNode || foundNode === window)
                    return;
                else if (!foundNode.contains(evt.relatedTarget)) {
                    dispatchPointerLeave(foundNode, evt.relatedTarget, function (targetNode) {
                        eventGenerator(evt, "pointerleave", false, targetNode, evt.relatedTarget);
                    });
                }
            });
    }

    (function () {
        if (window.MSPointerEvent) {
            //IE 10
            applySimpleEventTunnels(
                function (name) { return getPrefixEventName("MS", name); },
                generateTouchClonedEvent);
        }
        else {
            applySimpleEventTunnels(getMouseEquivalentEventName, generateMouseProxy);

            // Handling move on window to detect pointerleave/out/over
            if (window.ontouchstart !== undefined) {
                window.addEventListener('touchstart', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];
                        previousTargets[touchPoint.identifier] = touchPoint.target;

                        generateTouchEventProxyIfRegistered("pointerover", touchPoint, touchPoint.target, eventObject, true);

                        //pointerenter should not be bubbled
                        dispatchPointerEnter(touchPoint.target, null, function (targetNode) {
                            generateTouchEventProxy("pointerenter", touchPoint, targetNode, eventObject, false);
                        });

                        generateTouchEventProxyIfRegistered("pointerdown", touchPoint, touchPoint.target, eventObject, true);
                    }
                    setTouchTimer();
                });

                window.addEventListener('touchend', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];
                        var currentTarget = previousTargets[touchPoint.identifier];

                        generateTouchEventProxyIfRegistered("pointerup", touchPoint, currentTarget, eventObject, true);
                        generateTouchEventProxyIfRegistered("pointerout", touchPoint, currentTarget, eventObject, true);

                        //pointerleave should not be bubbled
                        dispatchPointerLeave(currentTarget, null, function (targetNode) {
                            generateTouchEventProxy("pointerleave", touchPoint, targetNode, eventObject, false);
                        });
                    }
                    setTouchTimer();
                });

                window.addEventListener('touchmove', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];
                        var newTarget = document.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
                        var currentTarget = previousTargets[touchPoint.identifier];

                        // If force preventDefault
                        if (currentTarget && checkPreventDefault(currentTarget) === true)
                            eventObject.preventDefault();

                        generateTouchEventProxyIfRegistered("pointermove", touchPoint, currentTarget, eventObject, true);
                        if (!navigator.isCocoonJS){
                            var newTarget = document.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
                            if (currentTarget === newTarget) {
                                continue; // We can skip this as the pointer is effectively over the current target
                            }

                            if (currentTarget) {
                                // Raise out
                                generateTouchEventProxyIfRegistered("pointerout", touchPoint, currentTarget, eventObject, true, newTarget);

                                // Raise leave
                                if (!currentTarget.contains(newTarget)) { // Leave must be called if the new target is not a child of the current
                                    dispatchPointerLeave(currentTarget, newTarget, function (targetNode) {
                                        generateTouchEventProxy("pointerleave", touchPoint, targetNode, eventObject, false, newTarget);
                                    });
                                }
                            }

                            if (newTarget) {
                                // Raise over
                                generateTouchEventProxyIfRegistered("pointerover", touchPoint, newTarget, eventObject, true, currentTarget);

                                // Raise enter
                                if (!newTarget.contains(currentTarget)) { // Leave must be called if the new target is not the parent of the current
                                    dispatchPointerEnter(newTarget, currentTarget, function (targetNode) {
                                        generateTouchEventProxy("pointerenter", touchPoint, targetNode, eventObject, false, currentTarget);
                                    })
                                }
                            }
                            previousTargets[touchPoint.identifier] = newTarget;
                        }
                    }
                    setTouchTimer();
                });

                window.addEventListener('touchcancel', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];

                        generateTouchEventProxyIfRegistered("pointercancel", touchPoint, previousTargets[touchPoint.identifier], eventObject, true);
                    }
                });
            }
        }
    })();
    

    // Extension to navigator
    if (navigator.pointerEnabled === undefined) {

        // Indicates if the browser will fire pointer events for pointing input
        navigator.pointerEnabled = true;

        // IE
        if (navigator.msPointerEnabled) {
            navigator.maxTouchPoints = navigator.msMaxTouchPoints;
        }
    }
})();
(function () {
    if (window.PointerEvent)
        return;
        
    // Handling touch-action css rule
    if (document.styleSheets && document.addEventListener) {
        document.addEventListener("DOMContentLoaded", function () {
            if (document.body.style.touchAction !== undefined)
                return;

            var globalRegex = new RegExp(".+?{.*?}", "m");
            var selectorRegex = new RegExp(".+?{", "m");
            var filterStylesheet = function (unfilteredSheet) {
                var filter = globalRegex.exec(unfilteredSheet);
                if (!filter) {
                    return;
                }
                var block = filter[0];
                unfilteredSheet = unfilteredSheet.replace(block, "").trim();
                var selectorText = selectorRegex.exec(block)[0].replace("{", "").trim();

                // Checking if the user wanted to deactivate the default behavior
                if (block.replace(/\s/g, "").indexOf("touch-action:none") !== -1) {
                    var elements = document.querySelectorAll(selectorText);

                    for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                        var element = elements[elementIndex];

                        if (element.style.msTouchAction !== undefined) {
                            element.style.msTouchAction = "none";
                        }
                        else {
                            element.handjs_forcePreventDefault = true;
                        }
                    }
                }
                return unfilteredSheet;
            };
            var processStylesheet = function (unfilteredSheet) {
                if (window.setImmediate) {//not blocking UI interaction for a long time
                    if (unfilteredSheet)
                        setImmediate(processStylesheet, filterStylesheet(unfilteredSheet));
                }
                else {
                    while (unfilteredSheet) {
                        unfilteredSheet = filterStylesheet(unfilteredSheet);
                    }
                }
            }; // Looking for touch-action in referenced stylesheets
            try {
                for (var index = 0; index < document.styleSheets.length; index++) {
                    var sheet = document.styleSheets[index];

                    if (sheet.href == null /* undefined or null */) { // it is an inline style
                        continue;
                    }

                    // Loading the original stylesheet
                    var xhr = new XMLHttpRequest();
                    xhr.open("get", sheet.href);
                    xhr.send();

                    var unfilteredSheet = xhr.responseText.replace(/(\n|\r)/g, "");

                    processStylesheet(unfilteredSheet);
                }
            } catch (e) {
                // Silently fail...
            }

            // Looking for touch-action in inline styles
            var styles = document.getElementsByTagName("style");
            for (var index = 0; index < styles.length; index++) {
                var inlineSheet = styles[index];

                var inlineUnfilteredSheet = inlineSheet.innerHTML.replace(/(\n|\r)/g, "").trim();

                processStylesheet(inlineUnfilteredSheet);
            }
        }, false);
    }
})();

(function() {

    if (!window.WebComponents) {
        throw 'Bosonic runtime needs the WebComponents polyfills to be loaded first.';
    }

    if (!window.Bosonic) {
        window.Bosonic = {};
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
            if (WebComponents.flags.shadow !== 'prefixed') {
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
                this.shadowRoot.appendChild(document.importNode(content, true));
                if (WebComponents.flags.shadow !== false) {
                    scopeShadowStyles(this.shadowRoot, name);
                }
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
            var created = this.__lifecycle.created;
            return created ? created.apply(this, arguments) : null;
        },

        attachedCallback: function() {
            var attached = this.__lifecycle.attached;
            return attached ? attached.apply(this, arguments) : null;
        },

        detachedCallback: function() {
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

    Bosonic.extend = function(prototype, api) {
        if (prototype && api) {
            Object.getOwnPropertyNames(api).forEach(function(n) {
                prototype[n] = Object.getOwnPropertyDescriptor(api, n);
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
        if (template) options.__template = template;
        if (attributes) options.__attributes = attributes.split(' ');

        var prototype = Bosonic.extend({}, Bosonic.Base);

        if (options.mixins) {
            options.mixins.forEach(function(mixin) {
                prototype = Bosonic.extend(prototype, mixin);
            });
            delete options.mixins;
        }

        prototype = Bosonic.extend(prototype, options);

        var elementDef = {
            prototype: Object.create(window[extendeeClass].prototype, prototype)
        };
        if (extendee && extendsNativeElt) { 
            elementDef.extends = extendee;
        }

        window[elementClass] = document.registerElement(name, elementDef);
    }
})();
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

    toggleCustomAttribute: function(name) {
        this.hasCustomAttribute(name) ? this.removeCustomAttribute(name) : this.setCustomAttribute(name, '');
    },

    _hasPrefixedAttribute: function(name) {
        return this.hasAttribute('data-' + name);
    },

    _getRealAttribute: function(name) {
        return this._hasPrefixedAttribute(name) ? 'data-' + name : name;
    }
};
Bosonic.Selection = {
    get selectedItemIndex() {
        return this.hasAttribute('selected') ? Number(this.getAttribute('selected')) : null;
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