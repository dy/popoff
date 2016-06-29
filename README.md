# popoff

Popoff runs modals, tooltips, popups, dropdowns, confirms, notifiers, popovers, lightboxes, balloons, dialogs, alerts, overlays, sidebars etc.


[![npm install popoff](https://nodei.co/npm/popoff.png?mini=true)](https://npmjs.org/package/popoff/)


```js
var createPopup = require('popoff');

var modal = createPopup({
	closable: true,
	escapable: true,
	overlay: true,
	single: true,
	type: 'modal',
	tip: false,
	effect: 'fade',
	content: `
		<h2>Blah</h2>
		<p>blah</p>
	`
});

modal.show();
modal.hide();
modal.update();


var dropdown = createPopup({
	type: 'dopdown',
	content: document.querySelector('#content')
});

dropdown.show(document.querySelector('#menu'));
```
