/**
 * Poppy is always a link/target to click to show the container
 */

//FIXME: include Mod as a dependency
var Mod = window.Mod || require('mod-constructor');

module.exports = Mod(Poppy);


//prefix for classes
var name = 'poppy';


/**
 * ------------- Constructor
 */

function Poppy(){
	return this.constructor.apply(this, arguments);
}

Poppy.displayName = name;

var proto = Poppy.prototype;

proto['extends'] = 'div';




/**
 * -------------- Lifecycle & events
 */

proto.init = function(){
	// console.log('poppy init')
}

proto.created = function(){
	// console.log('poppy created')
}





/**
 * --------------- Elements
 */

//keeper of content
proto.$container = {
	init: function(){
		//create poppy container
		var $container = document.createElement('div');
		$container.classList.add(name + '-container');

		return $container;
	}
};




/**
 * ------------------ Options
 */
//just state of popup
proto.state = {
	_: undefined,
	visible: undefined,
	changed: function(newState, oldState){
		//keep class updated
		this.classList.add(newState);
		this.classList.remove(oldState);
	}
};

//Where to place popupped content-container
proto.holder = {
	init: 'body',
	get: function(value){
		if (value === 'body') return document.body;
		else return value;
	},
	set: setElement
};

//string selector, Node, or href. Content to show in container
proto.content = {
	init: function(value){
		//if specified - return it
		if (value) return value;

		//read href, if it is set
		if (this.href) {
			return this.href;
		}

		//read for, if defined
		if (this['for']) {
			return this['for'];
		}
	},

	//FIXME: scope it within contentType states
	//FIXME: simplify this (too unclear)
	set: function(value){
		var res;

		if (typeof value === 'string'){
			//if pathname is current - shorten selector
			var linkElements = value.split('#');
			if (linkElements[0] === location.origin + location.pathname){
				//try to save queried element
				res = document.querySelector('#' + linkElements[1]);
				if (res) return res;

				//if not - save query string
				return '#' + linkElements[1];
			}

			//try to query element
			res = document.querySelector(value);
			if (res) return res;

			//if not - return value as is
			return value;
		}

		return value;
	},

	//FIXME: place it to the contentType scope
	//eval content each time it is going to be get
	get: function(v){
		var content;

		if (v instanceof HTMLElement){
			return v;
		}

		else if (typeof v === 'string'){
			content = document.querySelector(v);
		}

		//return absent target stub
		else {
			// content = document.createElement('div');
			// content.innerHTML = 'No target found for poppy ' + this;
		}

		return content;
	},

	changed: function(content){
		//unhide content if it is hidden
		if (content instanceof HTMLElement) {
			if (content.parentNode) content.parentNode.removeChild(content);
			content.removeAttribute('hidden');
		}
	}
};


/**
 * Type of content to show
 *
 * null		Other element on the page
 * 'image'	An external image will be loaded
 * 'ajax'	Request an URL, insert as an HTML
 * 'iframe'	Insert an iframe with URL passed
 * 'swf'
 * 'text'	Insert content as a plain test
 */
proto.contentType = {
	//target selector
	_:{

	},
	//image href
	image: {

	},
	//remote href
	ajax: {

	},
	//iframe href
	iframe: {

	},
	swf: {

	},
	//inline content
	text: {

	}
};


/* Replace with external modules
//the side to align the container relative to the target - only meaningful range
proto.align = {
	set: setSide
}

//whether to show tip
proto.tip = {
	true: {
		before: function(){
			//append tip to the container
			this.$container.appendChild(this.$tip);
		}
	},
	_: {
		before: function(){
			//remove tip from the container
			if (this.$container.contains(this.$tip))
				this.$container.removeChild(this.$tip);
		}
	}
}

//the side to align tip relative to the target but within the container
proto.tipAlign = {
	set: setSide
}
*/


//instantly close other dropdowns when the one shows
proto.single = false;



/**
 * -------------------------- API
 */


/**
 * Show the container
 * @return {Poppy} Chaining
 */

proto.show = function(){
	console.log("show")

	//eval content to show
	if (this.content) {
		this.$container.appendChild(this.content);
	}
	//append container to the holder
	this.holder.appendChild(this.$container);

	//place
	this.place();

	//switch state
	this.state = 'visible';

	return this;
};


/**
 * Close the container
 * @return {Poppy} Chaining
 */

proto.hide = function(){
	console.log('hide', this.$container.parentNode)

	//remove container from the holder
	this.holder.removeChild(this.$container);

	//remove content from the container
	if (this.content) {
		this.$container.removeChild(this.content);
	}

	//switch state
	this.state = 'hidden';

	return this;
};


/**
 * Automatically called after show.
 * Implement this behaviour in instances
 * Place container properly.
 */

proto.place = function(){};



/**
 * ---------------------- Helpers
 */

//alignment setter
function setSide(value){
	if (typeof value === 'string') {
		switch (value) {
			case 'left':
			case 'top':
				return 0;
			case 'right':
			case 'bottom':
				return 1;
			default:
				return 0.5;
		}
	}

	return value;
}

//element setter
function setElement(value, oldValue){
	return value;
}