/**
* Extend poppy with popup behaviour
*/

var Poppy = require('index');

var Tooltip = Poppy.extend({

});



//small arrow to show
proto.$tip = {
	init: function(){
		//create tip
		var $tipContainer = document.createElement('div');
		$tipContainer.classList.add(name + '-tip-container');

		var $tip = document.createElement('div');
		$tip.classList.add(name + '-tip');

		return $tipContainer;
	}
}


//overlay blind
Tooltip.$blind = {
	init: function(){
		return Poppy.$blind;
	}
}

module.exports = Tooltip;