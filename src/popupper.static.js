//Static
$.extend(P, {
	nextTargetId: 0,

	types: {
		//some_type: { "event [target|container|close|outside|selector] delay": "method" | ["method", ..] | function(){return methName} }
		//TODO: handle list of methods
		tooltip: {
			position: "top",
			tip: true,
			tipalign: .5,
			align: "center",
			states: {
				"inactive":{
					"mouseenter target 1000": "show"
				},
				"active":{
					"mouseleave target 1000": "hide"
				}
			}
		},
		popover: {
			position: "top",
			tip: true,
			states: {//TODO
				/*"mouseenter target 50": "show",
				"click target 0": "show",
				"mouseenter container 0": "show",
				"mouseleave target 200": "hide",
				"mouseleave container 200": "hide"*/
			}			
		},
		overlay: {
			position: "center",
			close: "✕",
			overlay: true,
			tip: false,
			autolaunch: true,
			preventDefault: true,
			states: {
				"inactive": {
					"click target 50": "show",
					"click target 0": "showOverlay"
				},
				"active": {
					"click outside 0": "hide",
					"click outside 50": "hideOverlay",
					"click close 0": "hide",
					"click close 50": "hideOverlay",
					"keyup escape 0": "hide",
					"keyup escape 50": "hideOverlay"
				}
			}			
		},
		dropdown: {
			position: "bottom",
			tip: true,
			align: 0,
			preventDefault: true,
			states: {
				"inactive": {
					"mouseenter container": "show",
					"click target": "show",
				},
				"active": {
					"mouseenter container": "show",
					"mouseenter target": "show",
					"click outside": "hide",
					"click target": "hide",
					"mouseleave container 1500": "hide",
					"mouseleave target 1500": "hide",
					"keyup escape": "hide"
				},
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
			states: {
				/*"click target": "show",
				"click container": "hide",
				"mouseleave container 2500": "hide"*/
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

		autolaunch: false, //whether to start on init

		type: "tooltip", //tooltip, popover, overlay, dropdown, custom
		states: null, //custom behaviour could be redefined

		close: false, //false (don’t show close) or string with text
		overlay: false, //Just indicates need to create overlay
		preventDefault: false,

		position: "top", //top, left, bottom, right, center (for overlays), over (hiding element)
		align: "center", //0 - by left, 1 - by right, .5 - by center, "left", "top", "right", "bottom", "center"
		tip: true,
		tipAlign: "center",

		avoid: null, //selector of elements to avoid overlapping with
		single: false, //instantly close other dropdowns when one shows

		//Callbacks
		show: null, //before show
		hide: null //after hide
	},

	CENTER: 0,
	TOP: 1,
	RIGHT: 2,
	BOTTOM: 3,
	LEFT: 4,
	OVER: 5,

	//Just generates unique id
	getTargetId: function(target){
		return ++P.nextTargetId;
	},

	//Cache of targets: id ~ popupper-controller
	targets: {},

	//Calls method of target
	//TODO: make arguments support
	targetMethod: function(targetId, methName){
		var target = P.targets[targetId];
		target[methName].apply(target, []);
	},

	//Should automatically be shown?
	isAutolaunchPlanned: false,

	//Key aliases
	keyMap: {
		"esc": 27,
		"escape": 27,
		"up": 38,
		"down": 40,
		"left": 37,
		"right": 39,
		"enter": 13
		//TODO: make full keymap
	}
})
