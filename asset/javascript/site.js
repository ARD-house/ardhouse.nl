(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * This document bootstraps the use of interactive components
 * on the entire website. It loads the necessary generic
 * dependencies and detects elements on a page which can be enriched
 * with functionality.
 *
 * All dependencies are managed via browserify, npm and bower thus
 * included during a build. There are no external dependencies
 * which should be added via html.
 */


// This website uses pollyfills to apply the forward compatiblity
// development principle. These should be loaded before all libraries
// in order to enable features before using them.
require('./polyfill/Array.forEach');
require('./polyfill/Array.indexOf');
require('./polyfill/Array.map');
require('./polyfill/Element.classList');
require('./polyfill/EventTarget.addEventListener');
require('./polyfill/Function.bind');
require('./polyfill/input.placeholder');
require('./polyfill/NodeList.toArray');
require('./polyfill/NodeList.forEach');
require('./polyfill/Object.assign');
require('./polyfill/Object.create');
require('./polyfill/Window.getComputedStyle');


// detect elements on the page and apply components onto them in needed
// this can only be done when the dom is ready for manipulation
document.addEventListener('DOMContentLoaded', function(){
	document.addEventListener('scroll', function(){
		var scrollPositionY = window.pageYOffset || document.documentElement.scrollTop;
		var logoElement = document.querySelector('.logo');
		var logoPlaceholderElement = document.querySelector('.logo_placeholder');

		if ( scrollPositionY > 70 ){
			logoElement.classList.add('small');
			logoPlaceholderElement.classList.add('small');
		} else {
			logoElement.classList.remove('small');
			logoPlaceholderElement.classList.remove('small');
		}
	});
});

},{"./polyfill/Array.forEach":2,"./polyfill/Array.indexOf":3,"./polyfill/Array.map":4,"./polyfill/Element.classList":5,"./polyfill/EventTarget.addEventListener":6,"./polyfill/Function.bind":7,"./polyfill/NodeList.forEach":8,"./polyfill/NodeList.toArray":9,"./polyfill/Object.assign":10,"./polyfill/Object.create":11,"./polyfill/Window.getComputedStyle":12,"./polyfill/input.placeholder":13}],2:[function(require,module,exports){
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {

    Array.prototype.forEach = function(callback, thisArg) {

        var T, k;

        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }

        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== "function") {
            throw new TypeError(callback + ' is not a function');
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 1) {
            T = thisArg;
        }

        // 6. Let k be 0
        k = 0;

        // 7. Repeat, while k < len
        while (k < len) {

            var kValue;

            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {

                // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                kValue = O[k];

                // ii. Call the Call internal method of callback with T as the this value and
                // argument list containing kValue, k, and O.
                callback.call(T, kValue, k, O);
            }
            // d. Increase k by 1.
            k++;
        }
        // 8. return undefined
    };
}

},{}],3:[function(require,module,exports){
// Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(searchElement, fromIndex) {

		var k;

		// 1. Let O be the result of calling ToObject passing
		//    the this value as the argument.
		if (this == null) {
			throw new TypeError('"this" is null or not defined');
		}

		var O = Object(this);

		// 2. Let lenValue be the result of calling the Get
		//    internal method of O with the argument "length".
		// 3. Let len be ToUint32(lenValue).
		var len = O.length >>> 0;

		// 4. If len is 0, return -1.
		if (len === 0) {
			return -1;
		}

		// 5. If argument fromIndex was passed let n be
		//    ToInteger(fromIndex); else let n be 0.
		var n = +fromIndex || 0;

		if (Math.abs(n) === Infinity) {
			n = 0;
		}

		// 6. If n >= len, return -1.
		if (n >= len) {
			return -1;
		}

		// 7. If n >= 0, then Let k be n.
		// 8. Else, n<0, Let k be len - abs(n).
		//    If k is less than 0, then let k be 0.
		k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

		// 9. Repeat, while k < len
		while (k < len) {
			var kValue;
			// a. Let Pk be ToString(k).
			//   This is implicit for LHS operands of the in operator
			// b. Let kPresent be the result of calling the
			//    HasProperty internal method of O with argument Pk.
			//   This step can be combined with c
			// c. If kPresent is true, then
			//    i.  Let elementK be the result of calling the Get
			//        internal method of O with the argument ToString(k).
			//   ii.  Let same be the result of applying the
			//        Strict Equality Comparison Algorithm to
			//        searchElement and elementK.
			//  iii.  If same is true, return k.
			if (k in O && O[k] === searchElement) {
				return k;
			}
			k++;
		}
		return -1;
	};
}

},{}],4:[function(require,module,exports){
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
if (!Array.prototype.map) {

    Array.prototype.map = function(callback, thisArg) {

        var T, A, k;

        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }

        // 1. Let O be the result of calling ToObject passing the |this|
        //    value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal
        //    method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 1) {
            T = thisArg;
        }

        // 6. Let A be a new array created as if by the expression new Array(len)
        //    where Array is the standard built-in constructor with that name and
        //    len is the value of len.
        A = new Array(len);

        // 7. Let k be 0
        k = 0;

        // 8. Repeat, while k < len
        while (k < len) {

            var kValue, mappedValue;

            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal
            //    method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {

                // i. Let kValue be the result of calling the Get internal
                //    method of O with argument Pk.
                kValue = O[k];

                // ii. Let mappedValue be the result of calling the Call internal
                //     method of callback with T as the this value and argument
                //     list containing kValue, k, and O.
                mappedValue = callback.call(T, kValue, k, O);

                // iii. Call the DefineOwnProperty internal method of A with arguments
                // Pk, Property Descriptor
                // { Value: mappedValue,
                //   Writable: true,
                //   Enumerable: true,
                //   Configurable: true },
                // and false.

                // In browsers that support Object.defineProperty, use the following:
                // Object.defineProperty(A, k, {
                //   value: mappedValue,
                //   writable: true,
                //   enumerable: true,
                //   configurable: true
                // });

                // For best browser support, use the following:
                A[k] = mappedValue;
            }
            // d. Increase k by 1.
            k++;
        }

        // 9. return A
        return A;
    };
}

},{}],5:[function(require,module,exports){
/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-07-23
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

if ("document" in self) {

    // Full polyfill for browsers with no classList support
    if (!("classList" in document.createElement("_"))) {

        (function(view) {

            "use strict";

            if (!('Element' in view)) return;

            var
                classListProp = "classList",
                protoProp = "prototype",
                elemCtrProto = view.Element[protoProp],
                objCtr = Object,
                strTrim = String[protoProp].trim ||
                    function() {
                        return this.replace(/^\s+|\s+$/g, "");
                    },
                arrIndexOf = Array[protoProp].indexOf ||
                    function(item) {
                        var
                            i = 0,
                            len = this.length;
                        for (; i < len; i++) {
                            if (i in this && this[i] === item) {
                                return i;
                            }
                        }
                        return -1;
                    }

            // Vendors: please allow content code to instantiate DOMExceptions
                ,
                DOMEx = function(type, message) {
                    this.name = type;
                    this.code = DOMException[type];
                    this.message = message;
                },
                checkTokenAndGetIndex = function(classList, token) {
                    if (token === "") {
                        throw new DOMEx("SYNTAX_ERR", "An invalid or illegal string was specified");
                    }
                    if (/\s/.test(token)) {
                        throw new DOMEx("INVALID_CHARACTER_ERR", "String contains an invalid character");
                    }
                    return arrIndexOf.call(classList, token);
                },
                ClassList = function(elem) {
                    var
                        trimmedClasses = strTrim.call(elem.getAttribute("class") || ""),
                        classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
                        i = 0,
                        len = classes.length;
                    for (; i < len; i++) {
                        this.push(classes[i]);
                    }
                    this._updateClassName = function() {
                        elem.setAttribute("class", this.toString());
                    };
                },
                classListProto = ClassList[protoProp] = [],
                classListGetter = function() {
                    return new ClassList(this);
                };
            // Most DOMException implementations don't allow calling DOMException's toString()
            // on non-DOMExceptions. Error's toString() is sufficient here.
            DOMEx[protoProp] = Error[protoProp];
            classListProto.item = function(i) {
                return this[i] || null;
            };
            classListProto.contains = function(token) {
                token += "";
                return checkTokenAndGetIndex(this, token) !== -1;
            };
            classListProto.add = function() {
                var
                    tokens = arguments,
                    i = 0,
                    l = tokens.length,
                    token, updated = false;
                do {
                    token = tokens[i] + "";
                    if (checkTokenAndGetIndex(this, token) === -1) {
                        this.push(token);
                        updated = true;
                    }
                }
                while (++i < l);

                if (updated) {
                    this._updateClassName();
                }
            };
            classListProto.remove = function() {
                var
                    tokens = arguments,
                    i = 0,
                    l = tokens.length,
                    token, updated = false,
                    index;
                do {
                    token = tokens[i] + "";
                    index = checkTokenAndGetIndex(this, token);
                    while (index !== -1) {
                        this.splice(index, 1);
                        updated = true;
                        index = checkTokenAndGetIndex(this, token);
                    }
                }
                while (++i < l);

                if (updated) {
                    this._updateClassName();
                }
            };
            classListProto.toggle = function(token, force) {
                token += "";

                var
                    result = this.contains(token),
                    method = result ? force !== true && "remove" : force !== false && "add";

                if (method) {
                    this[method](token);
                }

                if (force === true || force === false) {
                    return force;
                } else {
                    return !result;
                }
            };
            classListProto.toString = function() {
                return this.join(" ");
            };

            if (objCtr.defineProperty) {
                var classListPropDesc = {
                    get: classListGetter,
                    enumerable: true,
                    configurable: true
                };
                try {
                    objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                } catch (ex) { // IE 8 doesn't support enumerable:true
                    if (ex.number === -0x7FF5EC54) {
                        classListPropDesc.enumerable = false;
                        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                    }
                }
            } else if (objCtr[protoProp].__defineGetter__) {
                elemCtrProto.__defineGetter__(classListProp, classListGetter);
            }

        }(self));

    } else {
        // There is full or partial native classList support, so just check if we need
        // to normalize the add/remove and toggle APIs.
        (function() {
            "use strict";

            var testElement = document.createElement("_");

            testElement.classList.add("c1", "c2");

            // Polyfill for IE 10/11 and Firefox <26, where classList.add and
            // classList.remove exist but support only one argument at a time.
            if (!testElement.classList.contains("c2")) {
                var createMethod = function(method) {
                    var original = DOMTokenList.prototype[method];

                    DOMTokenList.prototype[method] = function(token) {
                        var i, len = arguments.length;

                        for (i = 0; i < len; i++) {
                            token = arguments[i];
                            original.call(this, token);
                        }
                    };
                };
                createMethod('add');
                createMethod('remove');
            }

            testElement.classList.toggle("c3", false);

            // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
            // support the second argument.
            if (testElement.classList.contains("c3")) {
                var _toggle = DOMTokenList.prototype.toggle;

                DOMTokenList.prototype.toggle = function(token, force) {
                    if (1 in arguments && !this.contains(token) === !force) {
                        return force;
                    } else {
                        return _toggle.call(this, token);
                    }
                };

            }

            testElement = null;
        }());

    }

}

},{}],6:[function(require,module,exports){
// based on https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener
if (!Event.prototype.preventDefault) {
    Event.prototype.preventDefault=function() {
        this.returnValue=false;
    };
}
if (!Event.prototype.stopPropagation) {
    Event.prototype.stopPropagation=function() {
        this.cancelBubble=true;
    };
}
if (!Element.prototype.addEventListener) {
    var eventListeners=[];

    var addEventListener=function(type,listener /*, useCapture (will be ignored) */) {
        var self=this;
        var wrapper=function(e) {
            e.target=e.srcElement;
            e.currentTarget=self;
            if (listener.handleEvent) {
                listener.handleEvent(e);
            } else {
                listener.call(self,e);
            }
        };
        if (type=="DOMContentLoaded") {
            var wrapper2=function(e) {
                if (document.readyState=="complete") {
                    wrapper(e);
                }
            };
            document.attachEvent("onreadystatechange",wrapper2);
            eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper2});

            if (document.readyState=="complete") {
                var e=new Event();
                e.srcElement=window;
                wrapper2(e);
            }
        } else {
            this.attachEvent("on"+type,wrapper);
            eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper});
        }
    };
    var removeEventListener=function(type,listener /*, useCapture (will be ignored) */) {
        var counter=0;
        while (counter<eventListeners.length) {
            var eventListener=eventListeners[counter];
            if (eventListener.object==this && eventListener.type==type && eventListener.listener==listener) {
                if (type=="DOMContentLoaded") {
                    this.detachEvent("onreadystatechange",eventListener.wrapper);
                } else {
                    this.detachEvent("on"+type,eventListener.wrapper);
                }
                break;
            }
            ++counter;
        }
    };
    Element.prototype.addEventListener=addEventListener;
    Element.prototype.removeEventListener=removeEventListener;
    if (HTMLDocument) {
        HTMLDocument.prototype.addEventListener=addEventListener;
        HTMLDocument.prototype.removeEventListener=removeEventListener;
    }
    if (Window) {
        Window.prototype.addEventListener=addEventListener;
        Window.prototype.removeEventListener=removeEventListener;
    }
}

},{}],7:[function(require,module,exports){
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                        ? this
                        : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}

},{}],8:[function(require,module,exports){
var nodeListForEach = function(){
    var items = this.toArray();
    return items.forEach.apply(items, arguments);
};

if ( window.NodeList && NodeList.prototype && !NodeList.prototype.forEach ){
    NodeList.prototype.forEach = nodeListForEach;
}

if ( window.StaticNodeList && StaticNodeList.prototype && !StaticNodeList.prototype.forEach ){
    StaticNodeList.prototype.forEach = nodeListForEach;
}

},{}],9:[function(require,module,exports){
var arraySlice = Array.prototype.slice;

var nodeListToArray = function(){
    var result = [];

    try {
        result = slice.call(this);
    } catch (c) {
        for (var resultIndex = 0, resultLength = this.length; resultIndex < resultLength; resultIndex++) {
            result.push(this[resultIndex])
        }
    }

    return result;
};

if ( window.NodeList && NodeList.prototype && !NodeList.prototype.toArray ){
    NodeList.prototype.toArray = nodeListToArray;
}

if ( window.StaticNodeList && StaticNodeList.prototype && !StaticNodeList.prototype.toArray ){
    StaticNodeList.prototype.toArray = nodeListToArray;
}

},{}],10:[function(require,module,exports){
if (!Object.assign) {
    Object.assign = function(target, sources) {
        if (target == null) {
            throw new TypeError('Object.assign target cannot be null or undefined');
        }

        var to = Object(target);
        var hasOwnProperty = Object.prototype.hasOwnProperty;

        for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
            var nextSource = arguments[nextIndex];
            if (nextSource == null) {
                continue;
            }

            var from = Object(nextSource);

            // We don't currently support accessors nor proxies. Therefore this
            // copy cannot throw. If we ever supported this then we must handle
            // exceptions and side-effects.

            for (var key in from) {
                if (hasOwnProperty.call(from, key)) {
                    to[key] = from[key];
                }
            }
        }

        return to;
    };
}

},{}],11:[function(require,module,exports){
// @source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
if (typeof Object.create != 'function') {
    Object.create = (function() {
        var Object = function() {};
        return function (prototype) {
            if (arguments.length > 1) {
                throw Error('Second argument not supported');
            }
            if (typeof prototype != 'object') {
                throw TypeError('Argument must be an object');
            }
            Object.prototype = prototype;
            var result = new Object();
            Object.prototype = null;
            return result;
        };
    })();
}

},{}],12:[function(require,module,exports){
if (!window.getComputedStyle) {
    window.getComputedStyle = function(el, pseudo) {
        this.el = el;
        this.getPropertyValue = function(prop) {
            var re = /(\-([a-z]){1})/g;
            if (prop == 'float') prop = 'styleFloat';
            if (re.test(prop)) {
                prop = prop.replace(re, function () {
                    return arguments[2].toUpperCase();
                });
            }
            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
        }
        return this;
    }
}

},{}],13:[function(require,module,exports){

},{}]},{},[1])