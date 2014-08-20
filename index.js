var Mod = require('mod-constructor');
var extend = require('extend');

module.exports = Mod(Poppy);


var name = 'poppy';

/**
* Poppy is always a link/target to click to show the container
*/
function Poppy(){
	//delegate call to mod constructor
	return this.constructor.apply(this, arguments);
}

extend(Poppy.prototype, {
	extends: 'div',

	selector: '[data-' + name + ']',




	/**
	* -------------- Lifecycle & events
	*/
	init: function(){
		console.log('init')
	},
	created: function(){
		//unhide self if it was hidden
		this.removeAttribute('hidden');
	},





	/**
	* --------------- Elements
	*/
	//keeper of content
	$container: {
		init: function(){
			//create poppy container
			var $container = document.createElement('div');
			$container.classList.add(name + '-container');

			return $container;
		}
	},

	//small arrow to show
	$tip: {
		init: function(){
			//create tip
			var $tipContainer = document.createElement('div');
			$tipContainer.classList.add(name + '-tip-container');

			var $tip = document.createElement('div');
			$tip.classList.add(name + '-tip');

			return $tipContainer;
		}
	},

	//overlay blind
	$blind: {
		init: function(){
			return Poppy.$blind;
		}
	},

	//close button
	$closeButton: {
		init: function(){
			//create button
			var $closeButton = document.createElement('div');
			$closeButton.classList.add(name + '-close');

			return $closeButton;
		}
	},




	/**
	* ------------------ Options
	*/
	//type of popup
	poppy: {
		init: function(value){
			if (!value) return 'tooltip';
		},

		changed: function(value, oldValue){
			//keep proper class
			this.$container.classList.add(name + '-' + value);
			this.$container.classList.remove(name + '-' + oldValue);
		},

		tooltip: {
			tip: true,
			tipAlign: .5,
			align: .5,
			state: {
				hidden: {
					'@target mouseenter:defer(1000)': 'show'
				},
				visible: {
					'@target mouseleave:defer(1000)': 'hide'
				}
			}
		},

		dropdown: {
			tip: true,
			align: 0,
			preventDefault: true,
			state: {
				hidden: {
					'@$container mouseenter': 'show',
					'click': 'show',
				},
				visible: {
					'mouseenter': 'show',
					'@$container mouseenter': 'show',

					// 'document click': 'hide',
					// '@target click': 'hide',
					// 'mouseleave:defer(1500)': 'hide',
					// '@target mouseleave:defer(1500)': 'hide',
					// 'keypress:pass(ESC)': 'hide'
				},
			}
		},

		popup: {
			before: function(){

			},
			closeButton: true,
			placement: 'center',
			state: {
				hidden: {
					'click': 'show'
				},
				visible: {
					'click': 'hide'
				},
			}
		},

		overlay: {
			//TODO
		},

		blind: {
			//TODO
		},

		notification: {
			//TODO
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
		},

		popover: {
			tip: true,
			states: {
			//TODO
			}
		},

		_: {

		}
	},

	//just state of popup
	state: {
		hidden: {
		},
		_: {

		},
		changed: function(newState, oldState){
			//keep class updated
			this.classList.add(newState);
			this.classList.remove(oldState);
		}
	},

	//Where to place popupped content-container
	holder: {
		init: 'body',
		get: function(value){
			if (value === 'body') return document.body;
			else return value;
		},
		set: setElement
	},

	//string selector, Node, or href. Content to show in container
	content: {
		init: function(value){
			//if specified - return it
			if (value) return value;

			//read href, if it is set
			if (this.href) {
				return this.href;
			}

			//read for, if defined
			if (this.for) {
				return this.for
			}
		},

		//FIXME: scope it within contentType states
		//FIXME: simplify this (too unclear)
		set: function(value){
			if (typeof value === 'string'){
				//if pathname is current - shorten selector
				var linkElements = value.split('#');
				if (linkElements[0] === location.origin + location.pathname){
					//try to save queried element
					var res = document.querySelector('#' + linkElements[1]);
					if (res) return res;

					//if not - save query string
					return '#' + linkElements[1];
				}
			}

			return value;
		},

		//FIXME: place it to the scope
		//eval content each time it is going to be get
		get: function(v){
			var content;

			if (v instanceof HTMLElement){
				return v;
			}

			else if (typeof v === 'string'){
				return document.querySelector(v);
			}

			//return absent target stub
			else {
				content = document.createElement('div');
				content.innerHTML = 'No target found for poppy ' + this;
			}

			return content;
		},

		changed: function(content){
			// console.log('target: ' + content)
		}
	},

	//type of content to show
	contentType: {
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
	},

	//show close button
	closeButton: {
		_: {

		},
		true: {
			before: function(){
				this.$container.appendChild(this.$closeButton);
			},
			after: function(){
				this.$container.removeChild(this.$closeButton);
			}
		}
	},

	//show overlay along with popup
	blind: {
		false: {

		},
		true: {

		}
	},

	//whether to react on href change
	handleHref: {
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
	},

	//the way/side to place the popup relative to the target
	placement: {
		top: {

		},
		left: {

		},
		bottom: {

		},
		right: {

		},
		//place to the center of the screen
		center: {

		},
		//overlay target
		target: {

		}
	},

	//the side to align the container relative to the target - only meaningful range
	align: {
		set: setSide
	},

	//whether to show tip
	tip: {
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
	},

	//the side to align tip relative to the target but within the container
	tipAlign: {
		set: setSide
	},

	//restriction area for the popup, viewport by default
	within: {
		set: setElement
	},

	//selector of elements to avoid overlapping with
	avoid: null,

	//instantly close other dropdowns when one shows
	single: false,


	/**
	* ----------------------- Events
	*/
	'@$closeButton click': 'hide',



	/**
	* -------------------------- API
	*/
	show: function(){
		// console.log('show')

		//eval content to show
		this.$container.appendChild(this.content);

		//append container to the holder
		this.holder.appendChild(this.$container);

		//switch state
		this.state = 'visible';

	},
	hide: function(){
		// console.log('hide')

		//remove container from the holder
		this.holder.removeChild(this.$container);

		//remove content from the container
		this.$container.removeChild(this.content);

		//switch state
		this.state = 'hidden';
	}
});


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


//create singleton blind
Poppy.$blind = new Poppy(undefined, {poppy: 'blind'});