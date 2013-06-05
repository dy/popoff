;(function ($){
	var pluginName = "popupper",
		containerClass = "popuppee",
		$doc = $(document),
		$body = $(document.body),
		$wnd = $(window)


	//Popup class
	$[pluginName] = function (el, opts){
		this.target = $(el);
		this.create(opts);
	}


	//Static
	$.extend($[pluginName], {
		defaults: {
			animDuration: null,
			animInClass: "in",
			animOutClass: "out",
			animClass: "animated",

			activeClass: "active",

			content: null, //Selector, element, jquery-object, html-string, function atc			
			container: $body, //Where to place in popupped content-container
			targets: null, //selector, array of objects etc. Synonims of current target. Each target shares container
			cloneContent: false, //Whether to clone or replace content element

			type: "tooltip", //tooltip, popover, overlay, dropdown, custom
			types: {
				//some_type: { "event [target|container|close|outside|selector] delay": show }
				tooltip: {
					position: "top",
					bind: {
						"mouseenter target 200": "show",
						"mouseleave target 200": "hide"
					}
				},
				popover: {
					position: "top",
					bind: {				
						"mouseenter target 50": "show",
						"click target 0": "show",
						"mouseenter container 0": "show",
						"mouseleave target 200": "hide",
						"mouseleave container 200": "hide"
					}				
				},
				overlay: {
					position: "center",
					bind: {
						"click target 0": "show",
						"click outside": "hide",
						"click close 0": "hide"
					}			
				},
				dropdown: {
					position: "bottom",
					bind: {
						"mouseenter container 0": "show",
						"click target 0": "trigger",
						"click outside": "hide",
						"mouseleave container 1500": "hide",
						"mouseleave target 1500": "hide"
					}
				}
			},

			close: false,
			closeText: "x",

			overlay: false,

			position: "top", //top, left, bottom, right, center (for overlays)
			tip: true,

			avoid: null, //selector of elements to avoid overlapping with
			single: true, //instantly close other dropdowns when one shows

			//Callbacks
			show: undefined,
			hide: undefined,
			beforeShow: undefined,
			beforeHide: undefined
		}
	})


	//Instance
	$.extend($[pluginName].prototype, {
		create: function (opts) {
			var self = this;

			self.options = $.extend({}, $[pluginName].defaults);
			var o = self.options = $.extend(self.options, opts);

			self.timeouts = {};

			self.hideOnClickOutside = false; //for dropdowns

			//Remove title from target
			self.title = self.target.attr("title");
			self.target.removeAttr("title");

			//Initial content comprehension
			if (!o.content){
				if (self.title) o.content = self.title;				
			} else {
				o.content = o.content.trim();
				if (o.content[0] == '.' || o.content[0] == '#') {
					if (o.cloneContent){
						o.content = $(o.content).clone(true, true);
					} else {
						o.content = $(o.content);
						if (o.content.parent().hasClass(containerClass)){
							self.container = o.content.parent();
							//o.targets = ;
							//o.single = true;
						} else {
							o.content.detach();
						}
					}
				}
			}

			o.position = opts.position || o.types[o.type] && o.types[o.type].position || o.position;

			self.target.addClass(pluginName + "-target");

			if (!self.container) {
				self.container = $(self.containerTpl())
				.append(o.content)
				.attr('hidden', true)
				.addClass(containerClass + "-" + o.type)
				.appendTo(o.container);
			}

			if (o.animDuration){ //set duration through options
				self.setAnimDuration(o.animDuration);
			} else { //get duration from css
				o.animDuration = self.getAnimDuration();
			}

			self.bindEvents();

			return self;
		},

		bindEvents: function(){
			var self = this, o = self.options;
			if (!o.types[o.type]) return console.log("Not existing type of " + pluginName + ": " + o.type)
			var bindings = o.types[o.type].bind;

			self.target.click(function(e){
				e.preventDefault();
			})

			for (var bindStr in bindings){
				self.bindString(bindStr, self[bindings[bindStr]])
			}

			return self;
		},

		bindString: function(bindStr, meth){
			var self = this, o = self.options;
			var props = bindStr.split(" "),
				evt = props[0], selector = props[1], delay = props[2];

			switch (selector) {
				case "outside": //only click outside supported
					self.hideOnClickOutside = true;
					return;
				case "target":
					selector = self.target;
					break;
				case "container":
					selector = self.container;
					break;
				case "close":
					selector = $("." + pluginName + "-close", self.container);
					break;
				default:
					selector = $(selector);
			}

			if (!delay) {
				selector.on(evt, meth.bind(self) );
			} else {
				selector.on(evt, function(){ self.delayedCall(meth.bind(self), delay) } );
			}
		},

		//Call method after @delay ms.
		delayedCall: function(fn, delay, key){
			var self = this;
			key == null && (key = 'none')
			clearTimeout(self.timeouts[key]);
			self.timeouts[key] = setTimeout(fn, delay)
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

		//API
		show: function(){
			var self = this, o = self.options;

			if (self.target.hasClass(o.activeClass) || self.container.hasClass(o.animClass)){
				return self;
			}

			self.container.removeAttr('hidden');

			if (o.single) {
				//TODO
				//$("." + [pluginName] + "-targte").not(self.target).data([pluginName]).hide();
			}

			self.move();

			self.container.addClass(o.animClass + " " + o.animInClass)
			.removeClass(o.animOutClass);

			self.delayedCall(function(){
				self.container.removeClass(o.animClass + " " + o.animInClass);
			}, o.animDuration, "anim");
			
			self.target.addClass(o.activeClass);

			//Handle outside click
			if (self.hideOnClickOutside){
				$doc.on("click.outside."+pluginName, function(e) {
					if (e.target === self.container[0]
						|| e.target === self.target[0]
						|| self.isInside(e.clientX, e.clientY, self.container)) {
						return;
					}
					self.hide();
				});
			}

			return self;
		},

		isInside: function(x, y, el){
			var rect = $(el)[0].getBoundingClientRect();
			return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
		},

		hide: function(){
			var self = this, o = self.options;

			if (!self.target.hasClass(o.activeClass) && !self.container.hasClass(o.animInClass)){
				return self;
			}

			self.container
			.addClass(o.animClass + " " + o.animOutClass)
			.removeClass(o.animInClass);

			self.delayedCall(function(){
				self.container
				.removeClass(o.animClass + " " + o.animOutClass)
				.attr('hidden', true);

				self.target.removeClass(o.activeClass);
			}, o.animDuration, "anim");

			if (self.hideOnClickOutside) $doc.off("click.outside."+pluginName)

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

			//NOTE: ZEPTO fucks up animations if set style through css.
			self.container[0].style.left = left + 'px';
			self.container[0].style.top = top + 'px';

			return self;
		},

		//Rendering
		containerTpl: function (opts) {
			opts == null && (opts = {"class": containerClass})
			return '<div class="' + opts.class + '"/>'
		}
	})


	//Plugin. 
	$.fn[pluginName] = function (arg, arg2) {
		if (typeof arg == "string") {//Call API method
			return $(this).each(function (i, el) {
				$(el).data(pluginName)[arg](arg2);
			})
		} else {//Init this
			return $(this).each(function (i, el) {
				var po = new $[pluginName](el, arg);
				if (!$(el).data(pluginName)) $(el).data(pluginName, po);
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
		$("." + pluginName).each(function (i, e){
			var $e = $(e),
				opts = $.extend({}, window[pluginName], $.parseDataAttributes(e));
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