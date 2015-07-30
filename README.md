Popoff is a base component for building any kind of popups: modal, tooltip, popup, dropdown, confirm, notifier, popover, lightbox, balloon etc. [Demo](http://dfcreative.github.io/popoff).


[![npm install popoff](https://nodei.co/npm/popoff.png?mini=true)](https://npmjs.org/package/popoff/)


```js
var Popoff = require('popoff');

var popup = new Popoff({
	closable: true,
	escapable: true,
	overlay: true
});

popup.show();
```

| Option | Default | Description |
|---|---|---|
| closable | `false` | Show close button within the popup. |
| escapable | `false` | Close popup by Escape. |
| overlay | `false` | Show overlay. |
| tip | `false` | Show tip arrow for a popup, like tooltips usually have. |
| single | `false` | Make popup exclusive, i.e. show only one popup at a time. |
| type | `undefined` | Define popup preset interaction type: `dropdown`, `tooltip`. Leave undefined to define popup interaction manually. |


## Why not component/tip, component/dialog etc?

* They hide element from the content when it’s comfortable to always have access to it via DOM.
* I do something by docs and it doesn’t work, I am forced to read code to understand what happens.
* Community is resistant to PRs which makes difficultier to fix bugs than to write own component.
* It has no centralized reliable placing method/algorithm.
* It has no default styles.
* Dialog has no animation style.
* Dialog container is not possible to make draggable.
* Dialog container has blind click zone of overlay
* Dialog container is weirdly resized, if there is dynamic content within.
* Dialog container has no proper overlay within body, if content is too hight.
* Tip is difficult to be customized: color, position.
* Cannot create multiple dialogs.
* Cannot stack dialogs.