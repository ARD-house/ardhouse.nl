(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * FastDom
 *
 * Eliminates layout thrashing
 * by batching DOM read/write
 * interactions.
 *
 * @author Wilson Page <wilsonpage@me.com>
 */

;(function(fastdom){

  'use strict';

  // Normalize rAF
  var raf = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(cb) { return window.setTimeout(cb, 1000 / 60); };

  // Normalize cAF
  var caf = window.cancelAnimationFrame
    || window.cancelRequestAnimationFrame
    || window.mozCancelAnimationFrame
    || window.mozCancelRequestAnimationFrame
    || window.webkitCancelAnimationFrame
    || window.webkitCancelRequestAnimationFrame
    || window.msCancelAnimationFrame
    || window.msCancelRequestAnimationFrame
    || function(id) { window.clearTimeout(id); };

  /**
   * Creates a fresh
   * FastDom instance.
   *
   * @constructor
   */
  function FastDom() {
    this.frames = [];
    this.lastId = 0;

    // Placing the rAF method
    // on the instance allows
    // us to replace it with
    // a stub for testing.
    this.raf = raf;

    this.batch = {
      hash: {},
      read: [],
      write: [],
      mode: null
    };
  }

  /**
   * Adds a job to the
   * write batch and schedules
   * a new frame if need be.
   *
   * @param  {Function} fn
   * @api public
   */
  FastDom.prototype.read = function(fn, ctx) {
    var job = this.add('read', fn, ctx);
    var id = job.id;

    // Add this job to the read queue
    this.batch.read.push(job.id);

    // We should *not* schedule a new frame if:
    // 1. We're 'reading'
    // 2. A frame is already scheduled
    var doesntNeedFrame = this.batch.mode === 'reading'
      || this.batch.scheduled;

    // If a frame isn't needed, return
    if (doesntNeedFrame) return id;

    // Schedule a new
    // frame, then return
    this.scheduleBatch();
    return id;
  };

  /**
   * Adds a job to the
   * write batch and schedules
   * a new frame if need be.
   *
   * @param  {Function} fn
   * @api public
   */
  FastDom.prototype.write = function(fn, ctx) {
    var job = this.add('write', fn, ctx);
    var mode = this.batch.mode;
    var id = job.id;

    // Push the job id into the queue
    this.batch.write.push(job.id);

    // We should *not* schedule a new frame if:
    // 1. We are 'writing'
    // 2. We are 'reading'
    // 3. A frame is already scheduled.
    var doesntNeedFrame = mode === 'writing'
      || mode === 'reading'
      || this.batch.scheduled;

    // If a frame isn't needed, return
    if (doesntNeedFrame) return id;

    // Schedule a new
    // frame, then return
    this.scheduleBatch();
    return id;
  };

  /**
   * Defers the given job
   * by the number of frames
   * specified.
   *
   * If no frames are given
   * then the job is run in
   * the next free frame.
   *
   * @param  {Number}   frame
   * @param  {Function} fn
   * @api public
   */
  FastDom.prototype.defer = function(frame, fn, ctx) {

    // Accepts two arguments
    if (typeof frame === 'function') {
      ctx = fn;
      fn = frame;
      frame = 1;
    }

    var self = this;
    var index = frame - 1;

    return this.schedule(index, function() {
      self.run({
        fn: fn,
        ctx: ctx
      });
    });
  };

  /**
   * Clears a scheduled 'read',
   * 'write' or 'defer' job.
   *
   * @param  {Number} id
   * @api public
   */
  FastDom.prototype.clear = function(id) {

    // Defer jobs are cleared differently
    if (typeof id === 'function') {
      return this.clearFrame(id);
    }

    var job = this.batch.hash[id];
    if (!job) return;

    var list = this.batch[job.type];
    var index = list.indexOf(id);

    // Clear references
    delete this.batch.hash[id];
    if (~index) list.splice(index, 1);
  };

  /**
   * Clears a scheduled frame.
   *
   * @param  {Function} frame
   * @api private
   */
  FastDom.prototype.clearFrame = function(frame) {
    var index = this.frames.indexOf(frame);
    if (~index) this.frames.splice(index, 1);
  };

  /**
   * Schedules a new read/write
   * batch if one isn't pending.
   *
   * @api private
   */
  FastDom.prototype.scheduleBatch = function() {
    var self = this;

    // Schedule batch for next frame
    this.schedule(0, function() {
      self.batch.scheduled = false;
      self.runBatch();
    });

    // Set flag to indicate
    // a frame has been scheduled
    this.batch.scheduled = true;
  };

  /**
   * Generates a unique
   * id for a job.
   *
   * @return {Number}
   * @api private
   */
  FastDom.prototype.uniqueId = function() {
    return ++this.lastId;
  };

  /**
   * Calls each job in
   * the list passed.
   *
   * If a context has been
   * stored on the function
   * then it is used, else the
   * current `this` is used.
   *
   * @param  {Array} list
   * @api private
   */
  FastDom.prototype.flush = function(list) {
    var id;

    while (id = list.shift()) {
      this.run(this.batch.hash[id]);
    }
  };

  /**
   * Runs any 'read' jobs followed
   * by any 'write' jobs.
   *
   * We run this inside a try catch
   * so that if any jobs error, we
   * are able to recover and continue
   * to flush the batch until it's empty.
   *
   * @api private
   */
  FastDom.prototype.runBatch = function() {
    try {

      // Set the mode to 'reading',
      // then empty all read jobs
      this.batch.mode = 'reading';
      this.flush(this.batch.read);

      // Set the mode to 'writing'
      // then empty all write jobs
      this.batch.mode = 'writing';
      this.flush(this.batch.write);

      this.batch.mode = null;

    } catch (e) {
      this.runBatch();
      throw e;
    }
  };

  /**
   * Adds a new job to
   * the given batch.
   *
   * @param {Array}   list
   * @param {Function} fn
   * @param {Object}   ctx
   * @returns {Number} id
   * @api private
   */
  FastDom.prototype.add = function(type, fn, ctx) {
    var id = this.uniqueId();
    return this.batch.hash[id] = {
      id: id,
      fn: fn,
      ctx: ctx,
      type: type
    };
  };

  /**
   * Runs a given job.
   *
   * Applications using FastDom
   * have the options of setting
   * `fastdom.onError`.
   *
   * This will catch any
   * errors that may throw
   * inside callbacks, which
   * is useful as often DOM
   * nodes have been removed
   * since a job was scheduled.
   *
   * Example:
   *
   *   fastdom.onError = function(e) {
   *     // Runs when jobs error
   *   };
   *
   * @param  {Object} job
   * @api private
   */
  FastDom.prototype.run = function(job){
    var ctx = job.ctx || this;
    var fn = job.fn;

    // Clear reference to the job
    delete this.batch.hash[job.id];

    // If no `onError` handler
    // has been registered, just
    // run the job normally.
    if (!this.onError) {
      return fn.call(ctx);
    }

    // If an `onError` handler
    // has been registered, catch
    // errors that throw inside
    // callbacks, and run the
    // handler instead.
    try { fn.call(ctx); } catch (e) {
      this.onError(e);
    }
  };

  /**
   * Starts of a rAF loop
   * to empty the frame queue.
   *
   * @api private
   */
  FastDom.prototype.loop = function() {
    var self = this;
    var raf = this.raf;

    // Don't start more than one loop
    if (this.looping) return;

    raf(function frame() {
      var fn = self.frames.shift();

      // If no more frames,
      // stop looping
      if (!self.frames.length) {
        self.looping = false;

      // Otherwise, schedule the
      // next frame
      } else {
        raf(frame);
      }

      // Run the frame.  Note that
      // this may throw an error
      // in user code, but all
      // fastdom tasks are dealt
      // with already so the code
      // will continue to iterate
      if (fn) fn();
    });

    this.looping = true;
  };

  /**
   * Adds a function to
   * a specified index
   * of the frame queue.
   *
   * @param  {Number}   index
   * @param  {Function} fn
   * @return {Function}
   */
  FastDom.prototype.schedule = function(index, fn) {

    // Make sure this slot
    // hasn't already been
    // taken. If it has, try
    // re-scheduling for the next slot
    if (this.frames[index]) {
      return this.schedule(index + 1, fn);
    }

    // Start the rAF
    // loop to empty
    // the frame queue
    this.loop();

    // Insert this function into
    // the frames queue and return
    return this.frames[index] = fn;
  };

  // We only ever want there to be
  // one instance of FastDom in an app
  fastdom = fastdom || new FastDom();

  /**
   * Expose 'fastdom'
   */

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = fastdom;
  } else if (typeof define === 'function' && define.amd) {
    define(function(){ return fastdom; });
  } else {
    window['fastdom'] = fastdom;
  }

})(window.fastdom);

},{}],2:[function(require,module,exports){
var StickyElement = require('./StickyElement');

var offset = function( obj ) {
    var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return {left:curleft, top: curtop};
};

var Contact = function(element, configuration){
    StickyElement.call(this, element, configuration);
};

Contact.prototype = Object.create(StickyElement.prototype);
Contact.prototype.constructor = Contact;

Object.assign(Contact.prototype, {
    _detectElements: function(){
        this._containerElement = this._element.querySelector('.contact_container');
        StickyElement.prototype._detectElements.call(this);
    },

    _getLogoElement: function(){
        if ( !this._logoElement ) {
            this._logoElement = document.querySelector('.logo');
        }
        return this._logoElement;
    },

    _getLogoHeight: function(){
        return this._getLogoElement().clientHeight;
    },

    _getElementOffset: function(){
        return offset(this._element).top;
    },

    _onViewportChange: function(){
        this._configuration.startOffsetTop = this._getElementOffset() - this._getLogoHeight();
        StickyElement.prototype._onViewportChange.call(this);
    },

    _enableSticky: function(){
        this._containerElement.style.top = this._getLogoHeight() + 'px';
        StickyElement.prototype._enableSticky.call(this);
    }

});

module.exports = Contact;

},{"./StickyElement":3}],3:[function(require,module,exports){
/**
 *
 * @type {fastdom}
 */
var fastdom = require("./..\\..\\..\\..\\bower_components\\fastdom\\index.js");

/**
 *
 * @type {ComponentAbstract}
 */
var ComponentAbstract = require('../util/ComponentAbstract');

/**
 * @type {{activeClass: string, startOffsetTop: number}}
 */
var defaultConfiguration = {
    activeClass: 'sticky',
    startOffsetTop: 124
};

/**
 * @param {HTMLElement} element
 * @param {defaultConfiguration} [configuration]
 * @class
 */
var StickyElement = function (element, configuration) {
    configuration = Object.assign(
        {},
        defaultConfiguration,
        configuration || {}
    );

    ComponentAbstract.call(this, element, configuration);
    fastdom.write(this._onViewportChange.bind(this));
};

StickyElement.prototype = Object.create(ComponentAbstract.prototype);
StickyElement.prototype.constructor = StickyElement;

Object.assign(StickyElement.prototype, {
    /**
     *
     * @protected
     */
    _bindEventHandlers: function(){
        window.addEventListener('scroll', this._onViewportChange.bind(this));
        window.addEventListener('load', this._onViewportChange.bind(this));
        window.addEventListener('orientationchange', this._onViewportChange.bind(this));
        window.addEventListener('resize', this._onViewportChange.bind(this));
    },

    /**
     *
     * @protected
     */
    _onViewportChange: function(){
        this.challengeSticky();
    },

    /**
     *
     * @returns {boolean}
     * @protected
     */
    _shouldBeSticky: function(){
        var scrollPositionY = window.pageYOffset || document.documentElement.scrollTop;
        return scrollPositionY > this._configuration.startOffsetTop;
    },

    /**
     * Test if element should be sticky on next read frame
     */
    challengeSticky: function(){
        // Since challenge is tested on next read frame it is
        // not necessary to execute this again if the challenge has
        // already been queued.
        if ( this._stickyChallenged !== true ){
            this._stickyChallenged = true;

            fastdom.read(function(){
                if ( this._shouldBeSticky() ){
                    this.enableSticky();
                } else {
                    this.disableSticky();
                }

                this._stickyChallenged = false;
            }.bind(this));
        }
    },

    /**
     * Explicitly enable stickyness. This is automatically called
     * when needed on resize, load, rotate, scroll
     */
    enableSticky: function(){
        // only execute if current state is not sticky
        if ( this._isSticky !== true ){
            this._isSticky = true;

            // queue actual stickyness enabling on next write frame
            fastdom.write(this._enableSticky.bind(this));
        }
    },

    /**
     *
     * @protected
     */
    _enableSticky: function () {
        this._element.classList.add(this._configuration.activeClass);
    },

    /**
     * Explicitly disable stickyness. This is automatically called
     * when needed on resize, load, rotate, scroll
     */
    disableSticky: function(){
        // only execute if current state is sticky
        if ( this._isSticky !== false ){
            this._isSticky = false;

            // queue actual stickyness disabling on next write frame
            fastdom.write(this._disableSticky.bind(this));
        }
    },

    /**
     *
     * @protected
     */
    _disableSticky: function () {
        this._element.classList.remove(this._configuration.activeClass);
    }
});

module.exports = StickyElement;

},{"../util/ComponentAbstract":17,"./..\\..\\..\\..\\bower_components\\fastdom\\index.js":1}],4:[function(require,module,exports){
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
    var logoElement = document.querySelector('.logo');
    var logoPlaceholderElement = document.querySelector('.logo_placeholder');

    var positionLogo = function(){
        var scrollPositionY = window.pageYOffset || document.documentElement.scrollTop;

        if ( scrollPositionY > 70 ){
            logoElement.classList.add('small');
            logoPlaceholderElement.classList.add('small');
        } else {
            logoElement.classList.remove('small');
            logoPlaceholderElement.classList.remove('small');
        }
    };

	document.addEventListener('scroll', positionLogo);
    positionLogo();


    var ContactElement = document.querySelector('.contact');
    var Contact = require('./component/Contact');
    new Contact(ContactElement);
});

},{"./component/Contact":2,"./polyfill/Array.forEach":5,"./polyfill/Array.indexOf":6,"./polyfill/Array.map":7,"./polyfill/Element.classList":8,"./polyfill/EventTarget.addEventListener":9,"./polyfill/Function.bind":10,"./polyfill/NodeList.forEach":11,"./polyfill/NodeList.toArray":12,"./polyfill/Object.assign":13,"./polyfill/Object.create":14,"./polyfill/Window.getComputedStyle":15,"./polyfill/input.placeholder":16}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){

},{}],17:[function(require,module,exports){
/**
 * @type {EventEmitter}
 */
var EventEmitter = require('./EventEmitter');

/**
 *
 * @type {fastdom}
 */
var fastdom = require("./..\\..\\..\\..\\bower_components\\fastdom\\index.js");

/**
 *
 * @param element {HTMlElement}
 * @param configuration {Object}
 * @constructor
 */
var ComponentAbstract = function(element, configuration) {
    this._element = element;
    this._configuration = configuration || {};

    fastdom.read(this._detectElements.bind(this));
    fastdom.write(this._bindEventHandlers.bind(this));
};

// extend EventEmitter
ComponentAbstract.prototype = Object.create(EventEmitter.prototype);
ComponentAbstract.prototype.constructor = ComponentAbstract;

Object.assign(ComponentAbstract.prototype, {
    /**
     * Create internal references to Elements during read cycle
     * @protected
     */
    _detectElements: function () {},

    /**
     * Bind event handlers to components during write cycle
     * @protected
     */
    _bindEventHandlers: function () {}
});

/**
 * @type {ComponentAbstract}
 */
module.exports = ComponentAbstract;

},{"./..\\..\\..\\..\\bower_components\\fastdom\\index.js":1,"./EventEmitter":18}],18:[function(require,module,exports){
/**
 * The purpose of this document is providing a reusable event emitter
 * for prototype object. This allows to add, remove and trigger events.
 *
 * @class
 */
var EventEmitter = function () {};

EventEmitter.prototype = {
    /**
     * Add event listener
     *
     * @param event
     * @param callbackFn
     */
    addEventListener: function (event, callbackFn) {
        this._eventListener = this._eventListener || {};
        this._eventListener[event] = this._eventListener[event] || [];
        this._eventListener[event].push(callbackFn);
    },

    /**
     * Remove event listener
     *
     * @param event
     * @param callbackFn
     */
    removeEventListener: function (event, callbackFn) {
        this._eventListener = this._eventListener || {};

        if (event in this._eventListener !== false) {
            this._eventListener[event].splice(this._eventListener[event].indexOf(callbackFn), 1);
        }
    },

    /**
     * Trigger event on object.
     *
     * @param event
     */
    triggerEvent: function(event /* , args... */){
        this._eventListener = this._eventListener || {};

        if (event in this._eventListener !== false  ) {
            for(var i = 0; i < this._eventListener[event].length; i++){
                this._eventListener[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    }
};

module.exports = EventEmitter;

},{}]},{},[4])