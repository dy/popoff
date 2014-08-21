/**
* Extend poppy with popup behaviour
*/

var Poppy = require('index');
var Mod = require('mod-constructor');
var extend = require('extend');

module.exports = Popup;



/**
* Popup constructor
*/
function Popup(){
	return this.constructor.apply(this, arguments);
}

//take over poppy properties
extend(Popup.prototype, Poppy.fn);

var proto = Popup.prototype;

proto.selector = '[data-popup]';


/**
* Lifecycle
*/
proto.init = function(){
	console.log('init popup')
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
Popup.$blind = new Poppy();



/**
* Options
*/
//show close button
proto.closeButton = {
	false: {

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
	false: {

	},
	true: {

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
	false : {

	}
}




/**
* Behaviour
*/
//FIXME: ? replace with Poppy.state.extend({...});
proto.state = extend({}, Poppy.fn.state, {
	_: {
		'click': 'show'
	},
	visible: {
		'click': 'hide'
	}
});


//handle popup as a mod
Mod(Popup);