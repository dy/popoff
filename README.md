# popoff

Popoff runs modals, tooltips, popups, dropdowns, confirms, notifiers, popovers, lightboxes, balloons, dialogs, alerts, overlays etc.


[![npm install popoff](https://nodei.co/npm/popoff.png?mini=true)](https://npmjs.org/package/popoff/)


```js
var createPopup = require('popoff');

var popup = createPopup({
	closable: true,
	escapable: true,
	overlay: true,
	single: true,
	type: 'modal', 'dropdown', 'tooltip',
	content: `
		<h2>Blah</h2>
		<p>blah</p>
	`
});

popup.show();
popup.hide();
```
