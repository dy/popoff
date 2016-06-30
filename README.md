[![Popov](https://raw.githubusercontent.com/dfcreative/popoff/master/popoff.png "Popov")](http://dfcreative.github.io/popoff/)

# popoff [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Popoff runs modals, tooltips, popups, dropdowns, confirms, notifiers, popovers, lightboxes, balloons, dialogs, alerts, overlays, sidebars etc. But some of it may not work yet.

## Usage


[![npm install popoff](https://nodei.co/npm/popoff.png?mini=true)](https://npmjs.org/package/popoff/)


```js
var createPopup = require('popoff');

//create and show modal
var modal = createPopup({
	type: 'modal',
	content: `
		<h2>Blah</h2>
		<p>blah</p>
	`
});
modal.show();

//create and show dropdown
var dropdown = createPopup({
	target: '#menu',
	type: 'dopdown',
	content: document.querySelector('#content')
});
document.querySelector('#menu').click();
```

## API

```js
var popup = new Popup({
	// modal, dropdown, tooltip, sidebar work out of the box. Otherwise define custom options below.
	type: 'modal',

	// target element that enables the popup, e.g. button.
	target: null,

	// an element to place popup into
	container: document.body || document.documentElement,

	// show overlay, will be detected based off type
	overlay: true,

	// show close button
	closable: true,

	// close by escape
	escapable: true,

	// show tip
	tip: false,

	// exclusive mode
	single: true,

	// animation effect, can be a list or a single
	effect: ['fade', 'zoom', 'slide'],

	// placing settings relative to the target
	side: 'center',
	align: 'center',
});

//show popup relative to the target
popup.show(target?);

//hide popup
popup.hide();

//update popup position, in case of resize etc.
popup.update();
```

## Credits

Popoff reimplements practices of old [overlay-component](https://github.com/component/ovelay) and [dialog-component](https://github.com/component/dialog), refined and mixed with modern ES6 and browserify component approaches.
