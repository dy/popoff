/*
Simple possible calendar.
Rewrite of http://eisabainyo.net/demo/jquery.calendar-widget.php
Depends on moment.js
*/

//TODO: fix autolaunch (launches twice)

(function($, moment) {
	var pluginName = "moment-calendar",
		ln = moment.langData();

	//Class
	$[pluginName] = function (el, opts){
		this.element = $(el);
		this.create(opts);
	}

	//Static
	$.extend($[pluginName], {
		defaults: {
			date: moment(), //date to show
			today: 'Сегодня',
			clear: 'Очистить',
			monthSelector: false,
			yearSelector: false,
			
			prev: '[&larr;] MMMM',
	    	next: 'MMMM [&rarr;]',
	    	current: 'MMMM YYYY',
	    	format: 'format to out',
	    	title: 'LL', //titles format
	    	isLink: true,
	    	href: '[?data=]YYYY-MM-DD',
	    	day: 'D', //day format

	    	//evts
	    	select: null
		}
	});

	//Instance
	$.extend($[pluginName].prototype, {

		create: function (opts) {
			var self = this, el = self.element;

			self.options = $.extend({}, $[pluginName].defaults);
			var o = self.options = $.extend(self.options, opts);

			self.date = moment(o.date);
			if (!self.date.isValid()) self.date = moment();
			self.selected = moment(self.date).startOf("day");

			//Render initial
			self.prev = $('<div class="prev"></div>').appendTo(el);
			self.current = $('<h3 class="current"></h3>').appendTo(el);
			self.next = $('<div class="next"></div>').appendTo(el);
			self.table = $('<table cellspacing="0">').appendTo(el);
			
			self.render();
			self.bindEvents();
		},

		bindEvents: function(){
			var self = this, o = self.options, el = self.element;
			el.on("click", ".prev", function(e){
				self.prevMonth(e);
			}).on("click", ".next", function(e){
				self.nextMonth(e);
			}).on("click", ".day", function(e){
			}).on("selectstart", function(e){
				return false;
			})
		},

		nextMonth: function(){
			var self = this;
			self.date.add("months", 1);
			self.render();
		},

		prevMonth: function(){
			var self = this;
			self.date.subtract("months", 1);
			self.render();
		},

		render: function(){
			var self = this, o = self.options, el = self.element,
				date = moment(self.date), month = self.date.month()
			var table = '';			
			
			table += ('<table cellspacing="0">');	
		
			table += '<tr>';			
			for (d=1; d<=7; d++) {
				table += '<th class="weekday">' + ln._weekdaysShort[d%7] + '</th>';
			}			
			table += '</tr>';

			date.startOf("month");
			date.startOf("week");
			for (var d=0; d < 6; d++){
				table += "<tr>"
				for (var w = 0; w < 7; w++) {
					date.add("days", 1);
					table += self.dayTpl({isOtherMonth: (date.month() == month ? false : true), date: date})
				};
				table += "</tr>";				
				if (date.month() > month || date.daysInMonth() == date.date()) {
					break;
				}
			}
			table += ('</table>');

			var newTable = $(table);
			self.table.replaceWith(newTable);
			self.table = newTable;

			//headers
			self.prev.html(moment(self.date).subtract("months", 1).format(o.prev));
			self.current.html(self.date.format(o.current));
			self.next.html(moment(self.date).add("months", 1).format(o.next));
		},

		dayTpl: function(data){
			var self = this, o = self.options;
			return 	'<td class="' + (data.isOtherMonth ? 'other-month' : 'current-month') + (data.date.isSame(self.selected,"day") ?' today':'') + '" title="' + data.date.format(o.title) + '">' +
						(o.isLink ? ('<a class="day" href="' + data.date.format(o.href) + '">' + data.date.format(o.day) + '</a>') : data.date.format(o.day)) +
					'</td>';
		}
	});
	
	
	$.fn[pluginName] = function (opts) {
		//Init this
		return $(this).each(function (i, el) {
			opts = $.extend({}, $.parseDataAttributes(el), opts);
			var po = new $[pluginName](el, opts);
			if (!$(el).data(pluginName)) $(el).data(pluginName, po);
		})
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

	//TODO: fix multiple launch on one lement
	//Autolaunch
	//Possible options location: preinit [Popover] object of the window, data-attributes, passed options.
	$(function () {
		//var name = window[pluginName] && window[pluginName].defaultClass || pluginName;
		$("." + pluginName).each(function (i, e){
			var $e = $(e),
				opts = $.extend({}, $.parseDataAttributes(e));
			$e[pluginName](opts);
		});
	});



})(window.jQuery || window.Zepto, moment);