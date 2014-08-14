//jquery-plugin
if ($){
	$['fn'][pluginName] = function (arg) {
		return this['each'](function(i,e){
			var $e = $(e);
			var instance = new Popupper($e[0], arg);
			$e.data(pluginName, instance);
		})
	};
	$(autolaunch)
} else {
	window["Popupper"] = Popupper;
	window.addEventListener("DOMReady", autolaunch);
}


function autolaunch(){
	//Override defaults
	if (window[pluginName]) {
		$.extend(P.defaults, window[pluginName]);
	}
	$("[class*=" + pluginName + "]").each(function (i, e){
		var type, classList = e.classList || e.className.split(" ");

		//TODO: parse type from the class
		for (var i = classList.length; i--; ){
			var className = classList[i];
			var match = className.match(new RegExp("popupper\\-([a-z]+)", "i"));
			if (match && match[1]) {
				type = match[1];
				break;
			}
		}

		var $e = $(e),
			opts = $.extend({}, {type: type});
		$e[pluginName](opts);
	});
}