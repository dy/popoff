# Poppy

Poppy is a popups provider. [Demo](http://dfcreative.github.io/poppy).

[![NPM](https://nodei.co/npm/poppy.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/poppy/)


## Getting started

### Install

Grab the [latest version](todo) or [CDN](todo). Insert it on the page:

```html
<script src="cdn_url/poppy.js"></script>
```

Poppy is also available as a component for browserify, component or duo:

`$ npm install poppy`

```js
var Poppy = require('poppy');
var Dropdown = require('poppy/dropdown');
var Tooltip = require('poppy/tooltip');
```

### Use

Create a new instance:

```js
var dropdown = new Dropdown({
	target: document.querySelector('#menu'),
	content: '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>',
	contentType: 'html'
});
```


## Options

| Parameter | Type | Default | Description |
|----|----|----|----|
| `target` | _selector_, _element_, _elements list_ — optional | `undefined` | A target or list of targets which by click show the popup container. Can vary depending on poppy type. |
| `content` | _string_, _element_, _function_ | `undefined` | Content to show within the container. If function defined—it will be invoked and result considered as content. |
| `contentType` | _string_ | `element` | `'element'`—show other element in the container. `'text'`—show content as plain text.`'html'`—show content as inner html. |
| `containerClass` | _string_ | `undefined` | A class to add to the popup container |
| `holder` | _selector_, _element_ | `<body>` | A holder of container |
| `tip` | _string_ — optional | `false` | A little triangle on the edge of the container. Possible values: `'top'`, `'left'`, `'bottom'`, `'right'`, `undefined`. |
| `tipAlign` | _string_, _number_ | `'center'` | Tip alignment relative to the container. |
| `single` | _boolean_ | `false` | Hide other containers when this one becomes visible |


## API

| Property/method | Type | Default | Description |
|----|----|----|----|
| `show(target)` |  |  | Make the container visible. |
| `hide()` |  |  | Make container disappear. |
| `enable()` |  |  | Make container active. |
| `disable()` |  |  | Disable any interactions. |
| `container` |  |  | Visible poppy container. |
| `state` |  |  | Current state of poppy: `closed`, `opened`, `opening`, `closing`, `disabled`. |


## Events

| Name | Description |
|----|----|----|----|
| `beforeShow` | Called when container is going to show |
| `show` |  |
| `beforeHide` |  |
| `hide` |  |
| `enable` |  |
| `disable` |  |


## License

MIT
