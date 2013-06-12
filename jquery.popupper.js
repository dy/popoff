;(function ($){
	var pluginName = "popupper",
		containerClass = "popuppee",
		$doc = $(document),
		$body = $(document.body),
		$wnd = $(window)


	//Popupper (target) class
	$[pluginName] = function (el, opts){
		this.target = $(el);
		this.create(opts);
	}

	//Popuppee (container) class
	$[containerClass] = function (el, opts){
		this.element = $(el);
		this.create(opts)
	}


	//Target static
	$.extend($[pluginName], {
		nextTargetId: 0,

		types: {
			//some_type: { "event [target|container|close|outside|selector] delay": method [+|-[method]] }
			tooltip: {
				position: "top",
				behavior: {
					"mouseenter target 400": "show", //TODO: handle "show -hide" and "show -"
					"mouseleave target 400": "hide"
				}
			},
			popover: {
				position: "top",
				behavior: {		
					"mouseenter target 50": "show",
					"click target 0": "show",
					"mouseenter container 0": "show",
					"mouseleave target 200": "hide",
					"mouseleave container 200": "hide"
				}				
			},
			overlay: {
				position: "center",
				close: "✕",
				overlay: true,
				behavior: {
					"click target 250": "show",
					"click target 0": "showOverlay +",
					//"click outside 0": "hide",
					//"click outside 250": "hideOverlay +",
					"click close 0": "hide",
					"click close 250": "hideOverlay +"
				}			
			},
			dropdown: {
				position: "bottom",
				behavior: {
					"mouseenter container": "show",
					"click target": "trigger",
					"click outside": "hide",
					"mouseleave container 1500": "hide",
					"mouseleave target 1500": "hide"
				}
			},
			sideMenu: {
				//TODO
			},
			dialog: {
				//TODO
			},
			modal: {
				//TODO
			},
			zoomer: {
				//TODO
			},
			imageZoomer: {
				//TODO
				position: "over",
				behavior: {
					"click target": "show",
					"click container": "hide",
					"mouseleave container 2500": "hide"
				}
			}
		},

		defaults: {
			animDuration: null,
			animInClass: "in",
			animOutClass: "out",
			animClass: "animated",

			overlayInClass: "in",
			overlayOutClass: "out",

			activeClass: "active",
			containerClass: "", //TODO: additional container class

			content: null, //Selector, element, jquery-object, html-string, function atc			
			container: $body, //Where to place in popupped content-container
			targets: null, //selector, array of objects etc. Synonims of current target. Each target shares container
			cloneContent: false, //Whether to clone or replace content element
			lazyContent: false, //defer loading of content

			type: "tooltip", //tooltip, popover, overlay, dropdown, custom
			behavior: null, //custom behaviour could be redefined

			close: false, //false (don’t show close) or string with text
			overlay: false, //Just indicates need to create overlay

			position: "top", //top, left, bottom, right, center (for overlays)
			tip: true,

			avoid: null, //selector of elements to avoid overlapping with
			single: false, //instantly close other dropdowns when one shows

			//Callbacks
			show: null, //before show
			hide: null //after hide
		},

		//Just generates unique id
		getTargetId: function(target){
			return ++$[pluginName].nextTargetId;
		},

		//Cache of targets → id: popupper-controller
		targets: {},

		//Cache of containers → id: popupper-container 
		containers: {},

		//Calls method of target
		//TODO: make arguments support
		targetMethod: function(targetId, methName){
			var target = $[pluginName].targets[targetId];
			target[methName].apply(target, []);
		}
	})


	//Target instance
	$.extend($[pluginName].prototype, {
		create: function (opts) {
			var self = this;

			self.options = $.extend({}, $[pluginName].defaults);
			$.extend(self.options, $[pluginName].types[opts.type || self.options.type]);
			$.extend(self.options, opts);

			var o = self.options;

			if (o.off) return; //TODO: fix to work correctly

			self.timeouts = {};

			self.active = false;

			self.blockEvents = false; //when true, any behavioural events are being ignored

			self.outsideDelays = {}; //for dropdowns

			//Remove title from target
			self.title = self.target.attr("title");
			self.target.removeAttr("title");

			//Hook href as content, if possible
			var href = self.target.attr("href");
			if (!o.content && href){
				if (href[0] === "#") {
					o.content = $(self.target.attr("href"));
				} else {
					//TODO: test if img
					//TODO: test if external document
					//TODO: test if font?
				}
			}

			//Initial content comprehension
			if (!o.content){
				if (self.title) o.content = self.title;				
			} else {
				//Is content a selector?
				if (o.content[0] == '.' || o.content[0] == '#') {
					o.content = $(o.content)
				}
				if (o.cloneContent){
					o.content = o.content.clone(true, true);
				} else if (typeof o.content !== "string") {
					//Shared content?
					if (o.content.parent().hasClass(containerClass)){
						self.containerId = $(o.content[0].parentNode).data("container-id")
						self.container = $[pluginName].containers[containerId];
						self.container.addClass(containerClass+"-shared");
					} else {
						o.content.detach();
					}
					o.content.removeAttr("hidden");
				}
			}

			//Ensure container controller is up
			if (!self.container) {
				self.container = new $[containerClass]({
					content: o.content,
					container: o.container
				})
			}

			//Register itself
			self.target.addClass(pluginName + "-target");
			self.targetId = $[pluginName].getTargetId(self.target);
			self.target.addClass(pluginName + "-target-" + self.targetId); //make unique id for each target
			$[pluginName].targets[self.targetId] = self; //keep cache of created targets

			//Make overlay if needed
			if (o.overlay){
				if (!$[pluginName].overlay) {
					$[pluginName].overlay = $('<div class="' + pluginName + '-overlay-blind" hidden/>').appendTo($body)
				}
				self.overlay = $[pluginName].overlay;
			}

			//Ensure anim duration
			if (o.animDuration || o.animDuration === 0){ //set duration through options
				self.setAnimDuration(o.animDuration);
			} else { //get duration from css
				o.animDuration = self.getAnimDuration();
			}

			self.bindEvents();

			return self;
		},

		bindEvents: function(){
			var self = this, o = self.options;

			var bindings = o.behavior;

			//Prevent <a> clicks
			self.target.click(function(e){
				e.preventDefault();
			})

			for (var bindStr in bindings){
				self.bindString(bindStr, bindings[bindStr])
			}

			return self;
		},

		bindString: function(bindStr, methName){
			var self = this, o = self.options;
			var props = bindStr.split(" "),
				evt = props[0], selector = props[1], delay = parseInt(props[2]), meth;

			//non-blocking methods via "+"
			var blocking = true;
			if (methName[methName.length-1] == '+') { 
				methName = methName.slice(0, -1).trim();
				blocking = false;
			}

			meth = self[methName].bind(self);

			switch (selector) {
				case "outside":
					//only click outside supported
					//special case that blocks any other events while it lasts 
					//e.g. do not return dropdown on hover if clicked outside
					self.outsideDelays[methName] = delay || 0;
					return;
				case "target":
					selector = self.target;
					break;
				case "container":
					//TODO: get rid of double container-events
					selector = self.container.element;
					break;
				case "close":
					selector = $("." + containerClass + "-close", self.container);
					break;
				default:
					selector = $(selector);
			}

			selector.on(evt, function(e){
				if (!self.blockEvents) {
					self.delayedCall( function() {meth(e)}, delay, "events", blocking)
				}
			});
		},

		//Call method after @delay ms. If needed to stop any other delayed calls, pass @blocking true
		delayedCall: function(fn, delay, key, blocking){
			var self = this;

			key == null && (key = 'none');
			if (blocking) self.clearDelayedCalls(key);

			if (delay) {
				self.timeouts[key] = setTimeout(fn, delay)
			} else {
				fn();
			}
		},

		//Clears delayed calls
		clearDelayedCalls: function(key){
			var self = this;
			if (typeof key == "string"){
				clearInterval(self.timeouts[key]);
			} else if (key instanceof Array) {
				for (var i = key.length; i--;){
					clearInterval(self.timeouts[key[i]]);	
				}
			} else {
				for (var k in self.timeouts){
					clearInterval(self.timeouts[k]);
				}
			}
		},

		setAnimDuration: function(dur){
			var self = this, o = self.options;
			dur == null && (dur = o.animDuration);
			dur += "ms";
			self.container.css({
				'-webkit-animation-duration': dur,
				'-khtml-animation-duration': dur,
				'-moz-animation-duration': dur,
				'-o-animation-duration': dur,
				'animation-duration': dur
			})

			return self;
		},

		getAnimDuration: function(){
			var self = this, o = self.options;

			var dur = self.container.css("animation-duration") ||
			self.container.css("-webkit-animation-duration") ||
			self.container.css("-moz-animation-duration") ||
			self.container.css("-o-animation-duration") ||
			self.container.css("-khtml-animation-duration");

			var unit = dur.slice(-2);
			if (unit == "ms"){
				dur = parseInt(dur)
			} else {
				dur = parseFloat(dur) * 1000
			}
			return dur;
		},

		//Intent action: make it next after the current action
		clearIntents: function(){
			this.clearShowIntent();
			this.clearHideIntent();
		},

		clearShowIntent: function(){
			this.container.off("hide." + containerClass);
		},

		clearHideIntent: function(){
			this.container.off("afterShow." + containerClass);
		},

		showAfterHide: function(){
			var self = this, o = self.options;
			console.log("showAfterHide")
			self.clearIntents();

			self.container.one("hide." + containerClass, self.show.bind(self));

			return self;
		},

		hideAfterShow: function(){
			var self = this, o = self.options;
			console.log("hideAfterShow")
			self.clearIntents();

			self.container.one("afterShow." + containerClass, self.hide.bind(self))

			return self;
		},

		//API
		show: function(){
			var self = this, o = self.options;
			console.log("show")
			if (!self.checkShowConditions()) {
				return self;
			}

			if (o.single) {
				self.closeSiblings();
			}


			self.container.removeAttr('hidden');

			self.move();

			//Active class used for styles
			//shows whether element is showing/intending to show or hiding/intending to hide.
			self.target.addClass(o.activeClass);
			
			sefl.container.show(function(){
				self.active = true; //only period of complete visibility
				self.target.trigger("afterShow");
			});

			//Handle outside click
			if (self.outsideDelays.hide || self.outsideDelays.hide === 0){
				$doc.on("click.outside."+pluginName, self.callOnClickOutside(self.hide.bind(self), self.outsideDelays.hide));
			}

			//evts & callbacks
			self.target.trigger("show");
			self.container.trigger("show");
			o.show && o.show();

			return self;
		},

		hide: function(){
			var self = this, o = self.options;
			console.log("hide")
			if (!self.checkHideConditions()){
				return self;
			}

			self.container.addClass(o.animClass + " " + o.animOutClass).removeClass(o.animInClass);	

			self.active = false;

			self.delayedCall(function(){
				self.container.removeClass(o.animClass + " " + o.animOutClass).attr('hidden', true);

				self.blockEvents = false;

				//self.target.removeClass(o.activeClass); //TODO: bad hack to avoid unknown bug on shared contents. (fix later)

				//evts & callbacks
				self.target.trigger("hide");
				self.container.trigger("hide");
				o.hide && o.hide();

			}, o.animDuration, "anim");

			//Remove active class at once
			self.target.removeClass(o.activeClass);

			//Off outside clicks
			$doc.off("click.outside." + pluginName);

			//evts & callbacks
			self.target.trigger("beforeHide");
			self.container.trigger("beforeHide");

			return self;
		},

		//Helping event that detects if click happened outside container and target
		callOnClickOutside: function(method, delay){			
			var self = this;
			console.log("callOnClickOutside")
			return function(e){
				if (e.target === self.container[0]
					|| e.target === self.target[0]
					|| self.isInside(e.clientX, e.clientY, self.container)
					|| self.isInside(e.clientX, e.clientY, self.target)) {
					return;
				}
				//clicked outside — ignore everything till @method finishes
				self.delayedCall(method, delay);
				self.blockEvents = true;
			}.bind(self)
		},

		//Is show possible right now and if not arrange show 
		checkShowConditions: function(){
			var self = this, o = self.options;
			console.log("showConditions")
			//Is fading in on other target - intent hide, move, show
			if (self.container.hasClass(o.animInClass) && self.container.data('target-id') != self.targetId) {
				$[pluginName].targetMethod(self.container.data('target-id'), "hideAfterShow");
				self.container.on("hide." + containerClass, self.show.bind(self));
				return false;
			}

			self.container.data("target-id", self.targetId);

			//Already visible - clear any intents (won’t work in constans state)
			if (self.target.hasClass(o.activeClass)){
				self.clearIntents();
				return false;
			}

			//Is fading out — intent show
			if (self.container.hasClass(o.animOutClass)){
				self.showAfterHide();
				return false;
			}

			return true;
		},

		//Is hide possible right now and if not arrange hide
		checkHideConditions: function(){
			var self = this, o = self.options;
			console.log("hideConditions")
			//Is hiding on other(any) target - clear any intents, let it hide
			if (self.container.hasClass(o.animOutClass)) {
				self.clearIntents();
				$[pluginName].targetMethod(self.container.data('target-id'), "clearIntents");
				return false;
			}

			//Already hidden - clear hide intents
			if (self.container.attr("hidden")){
				self.clearIntents();
				return false;
			}

			//Is fading in — intent show
			if (self.container.hasClass(o.animInClass)){
				self.hideAfterShow();
				return false;
			}

			return true;
		},

		showOverlay: function(){
			var self = this, o = self.options;
			console.log("showOverlay")
			self.overlay.removeAttr('hidden');
			self.overlay.removeClass(o.overlayOutClass).addClass(o.animClass + " " + o.overlayInClass);

			self.delayedCall(function(){
				self.overlay.removeClass(o.animClass + " " + o.overlayInClass);
			}, o.animDuration, "animOverlay");

			//Handle outside click
			if (self.outsideDelays.hideOverlay || self.outsideDelays.hideOverlay === 0){
				$doc.on("click.outside."+pluginName, self.callOnClickOutside(self.hideOverlay.bind(self), self.outsideDelays.hideOverlay));
			}

			return self;
		},

		hideOverlay: function(){
			var self = this, o = self.options;
			console.log("hideOverlay")
			self.overlay.addClass(o.animClass + " " + o.overlayOutClass).removeClass(o.overlayInClass);

			self.delayedCall(function(){
				self.overlay.removeClass(o.animClass + " " + o.overlayOutClass).attr('hidden', true);
			}, o.animDuration, "animOverlay");

			$doc.off("click.outside."+pluginName)

			return self;
		},

		trigger: function(){
			var self = this, o = self.options;

			if (self.target.hasClass(o.activeClass)) {
				self.hide();
			} else {
				self.show();
			}

			return self;
		},

		isInside: function(x, y, el){
			var rect = $(el)[0].getBoundingClientRect();
			return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
		},

		//closes all the popuppers except this one
		closeSiblings: function() {
			var self = this, o = self.options;
			for (var id in $[pluginName].targets){
				if (id == self.targetId) continue;
				var instance = $[pluginName].targets[id];
				instance.hide();
			}
			return self;
		},
	})


	//Container static
	$.extend($[containerClass], {
		defaults: {
			container: $body, //where to place itself
			content: null,

			close: false, //whether to show close
			type: "" //type of container: overlay, dropdown, tooltip, balloon, etc (from popupper)
		}
	});


	//Container instance
	$.extend($[containerClass].prototype, {
		create: function (opts) {
			var self = this, o = self.options;

			self.element = $(self.tpl()).append(o.content).appendTo(o.container);

			return self;
		},

		hide: function(){
			var self = this, o = self.options;

			return self;
		},

		show: function(cb){
			var self = this, o = self.options, el = self.element;

			el.removeClass(o.animOutClass).addClass(o.animClass + " " + o.animInClass);			
			
			delayedCall(function(){
				el.removeClass(o.animClass + " " + o.animInClass);

				//evts
				self.container.trigger("afterShow");
				cb && cb();
			}, o.animDuration, "anim");

			return self;
		},


		move: function(){
			var self = this, o = self.options,
				left = 0, top = 0;

			var pos = self.target.offset(),
				ch = self.container.outerHeight(true),
				cw = self.container.outerWidth(true),
				dw = $doc.width(),
				dh = $doc.height(),
				tw = self.target.outerWidth(true),
				th = self.target.outerHeight(true);
				//TODO: count on tip size: tip = self.tip.

			pos.bottom = pos.top + th;
			pos.right = pos.left + tw;

			if (o.position == "top" || o.position == "bottom"){
				left = Math.max(Math.min(dw - cw, pos.left), 0);				
			} else if (o.position == "left" || o.position == "right") {
				top = Math.max(Math.min(pos.top, dh - ch), 0);
			}

			if (o.position == "top" || (o.position == "bottom" && pos.bottom + ch > dh)){
				top = Math.min(pos.top - ch, dh);
			} else if (o.position == "bottom" || (o.position == "top" && pos.top - ch < 0)) {
				top = Math.max(pos.bottom, 0);
			}

			if (o.position == "left" || (o.position == "right" && pos.right + cw > dw)){
				left = Math.min(pos.left - cw, dw - cw);
			} else if (o.position == "right" || (o.position == "left" && pos.left - cw < 0)) {
				left = Math.max(pos.right, 0);
			}

			if (o.position == "center") {
				if (self.container.css("position") === "fixed"){
					left = $wnd.width()/2 - cw/2
					top = $wnd.height()/2 - ch/2
				} else {					
					left = $wnd.width()/2 - cw/2 + $doc.scrollLeft()
					top = $wnd.height()/2 - ch/2 + $doc.scrollTop()
				}
			}

			//NOTE: ZEPTO fucks up animations if set style through css().
			self.container[0].style.left = left + 'px';
			self.container[0].style.top = top + 'px';
			/*self.container.css({
				left: left,
				top: top
			})*/

			return self;
		},

		//Rendering
		tpl: function () {
			var self = this, o = self.options;
			
			var result = '<div class="' + containerClass + ' ' + containerClass + '-' + o.type + '" hidden>';

			if (o.close) result += '<div class="' + containerClass + '-close">' + o.close + '</div>';

			result += '</div>';

			return result;
		}


	})

	
	//================================ jQuery things
	//Plugin
	$.fn[pluginName] = function (arg, arg2) {
		if (typeof arg == "string") {//Call API method
			return $(this).each(function (i, el) {
				//$(el).data(pluginName)[arg](arg2);
				$[pluginName].targetMethod($(el).data('target-id'), arg2)
			})
		} else {//Init this
			return $(this).each(function (i, el) {
				var instance = new $[pluginName](el, $.extend(arg || {}, $.parseDataAttributes(el)));
				if (!$(el).data(pluginName)) $(el).data(pluginName, instance);
			})			
		}
	}


	//Simple options parser. The same as $.fn.data(), or element.dataset but for zepto	
	if (!$.parseDataAttributes) {		
		$.parseDataAttributes = function(el) {
			var data = {}, v;
			if (el.dataset) {
				for (var prop in el.dataset) {
					if (el.dataset[prop] === "true") {
						data[prop] = true;
					} else if (el.dataset[prop] === "false") {
						data[prop] = false;
					} else if (v = parseInt(el.dataset[prop])) {
						data[prop] = v;
					} else {
						data[prop] = el.dataset[prop];
					}
				}
			} else {
				[].forEach.call(el.attributes, function(attr) {
					if (/^data-/.test(attr.name)) {
						var camelCaseName = attr.name.substr(5).replace(/-(.)/g, function ($0, $1) {
						    return $1.toUpperCase();
						});
						data[camelCaseName] = attr.value;
					}
				});
			}
			return data;
		}
	}


	//Autolaunch
	//Possible options location: preinit [Popover] object of the window, data-attributes, passed options.
	$(function () {
		var name = window[pluginName] && window[pluginName].defaultClass || pluginName;
		$("[class*=" + pluginName + "]").each(function (i, e){
			var type;

			//TODO: parse type from the class
			for (var i = e.classList.length; i--; ){
				var className = e.classList[i];
				var match = className.match(new RegExp("popupper\\-([a-z]+)", "i"));
				if (match && match[1]) {
					type = match[1];
					break;
				}
			}

			var $e = $(e),
				opts = $.extend({}, window[pluginName], {type: type});
			$e[pluginName](opts);
		});
	});


	//Zepto crutches
	var outerH = $.fn.outerHeight;
	$.fn.outerHeight = function(){
		if (outerH) {
			return outerH.apply(this, arguments)
		} else {
			var h = $.fn.height.apply(this),
				pt = parseInt($.fn.css.apply(this, ["padding-top"])),
				pb = parseInt($.fn.css.apply(this, ["padding-bottom"]));
			return (h + pt + pb);
		}
	}
	var outerW = $.fn.outerWidth;
	$.fn.outerWidth = function(){
		if (outerW) {
			return outerW.apply(this, arguments)
		} else {
			var h = $.fn.width.apply(this),
				pl = parseInt($.fn.css.apply(this, ["padding-left"])),
				pr = parseInt($.fn.css.apply(this, ["padding-right"]));
			return (h + pl + pr);
		}
	}

})(window.jQuery || window.Zepto);
