/**
* Extend poppy with popup behaviour
*/

var Poppy = require('../index');
var Mod = window.Mod || require('mod-constructor');
var place = require('placer');
var extend = require('extend');




var name = Poppy.displayName;


/**
* Popup constructor
*/
var proto = Popup = {};

//FIXME: that shit with prototypes
var parent = Poppy.extend({}).fn;
parent = parent.prototype || parent;

for (var propName in parent){
	proto[propName] = parent[propName];
}


proto.selector = '[data-popup]';


/**
* Lifecycle
*/
proto.init = function(){
	// console.log('init popup')
}
proto.created = function(){
}



/**
* Elements
*/
//close button
proto.$closeButton = {
	init: function(){
		//create button
		var $closeButton = document.createElement('div');
		$closeButton.classList.add(name + '-close');

		return $closeButton;
	}
}

//static overlay blind
Popup.$blind = new Poppy({
	created: function(){
		this.$container.classList.add(name + '-blind')
	}
});
proto.$blind = {
	init: Popup.$blind
}
proto.$blindContainer = {
	init: Popup.$blind.$container
}

//add proper class to the container
proto.$container.changed = function($container){
	$container.classList.add(name + '-popup');
}


/**
* Options
*/
//show close button
proto.closeButton = {
	'false': {

	},
	_: {
		before: function(){
			this.$container.appendChild(this.$closeButton);
		},
		after: function(){
			this.$container.removeChild(this.$closeButton);
		}
	}
}

//show overlay along with popup
proto.blind = {
	'false': {

	},
	'true': {

	}
}

//react on href change
proto.handleHref = {
	_: {
		'before, window hashchange': function(){
			//detect link in href
			if (document.location.hash === this.hash) {
				this.show();
			}
		}
	},
	'false' : {

	}
}




/**
* Behaviour
*/
//FIXME: ? replace with Poppy.prototype.state
proto.state = extend({}, Poppy.fn.state, {
	_: {
		'click': 'show'
	},
	visible: {
		'click, this.$closeButton click, this.$blindContainer click': 'hide'
	}
});

proto.show = function(){
	//show blind
	this.$blind.show();

	//show container
	Poppy.fn.show.call(this);
}

proto.hide = function(){
	//show container
	Poppy.fn.hide.call(this);

	//show blind
	this.$blind.hide();
}

proto.place = function(){
	//place properly (align by center)
	place(this.$container, {
		relativeTo: window,
		align: 'center'
	})
}


//handle popup as a mod
module.exports = Mod(Popup);