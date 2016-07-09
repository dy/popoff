var ipsum = require('lorem-ipsum');
var Draggable = require('draggy');
var Resizable = require('resizable');
var Overlay = require('./overlay');
var Popup = require('./');
var insertCSS = require('insert-css');
// var test = require('tst');
var test = (a,b) => {b();};
var body = document.body,
	doc = document,
	root = doc.documentElement;


insertCSS(`
	html {
		background-color: rgb(255,254,252);
		background: url(http://subtlepatterns2015.subtlepatterns.netdna-cdn.com/patterns/lightpaperfibers.png), rgb(255,254,252);
		font-family: sans-serif;
		line-height: 1.5;
	}

	body {
		position: relative;
		min-height: 100vh;
		padding: 6rem 2rem 6rem;
		max-width: 660px;
		margin: auto;
	}

	img {
		max-width: 60%;
	}

	h1,h2,h3,h4,h5,h6 {
		margin: 4rem 0rem 2rem 0;
	}

	.popoff-popup h1,
	.popoff-popup h2,
	.popoff-popup h3,
	.popoff-popup h4,
	.popoff-popup h5,
	.popoff-popup h6 {
		margin-top: 1rem;
	}

	.target {
		white-space: nowrap;
		margin-right: .5rem;
		text-transform: uppercase;
		letter-spacing: .25ex;
		font-size: .75rem;
		display: inline-block;
		margin-bottom: .5rem;
	}

	.popoff-dropdown p,
	.popoff-sidebar p,
	.popoff-tooltip p {
		margin: 0;
	}

	.popoff-sidebar h2 {
		margin: 0 0 .66rem;
	}

	.popoff-overlay {
		background-color: rgba(85,85,85,.15);
		background: linear-gradient(160deg, rgba(103, 98, 105, .55), rgba(73, 70, 82, .55));
	}

	.popoff-overlay:before,
	.popoff-overlay:after {
		content: '';
		position: absolute;
		top: -100vw;
		left: -100vw;
		right: -100vw;
		bottom: -100vw;
		background: url(./lines.png);
		transform: rotate(-12.5deg) scale(1.5, 1.51);
		transition: transform 50s ease-in;
		opacity: .05;
	}
	.popoff-overlay:after {
		transform: rotate(-12.4deg) scale(1.51, 1.5);
		transition: transform 50s ease-out;
	}
	.popoff-overlay.popoff-fade-in:before {
		transform: rotate(12.4deg) scale(1.51, 1.5);
	}
	.popoff-overlay.popoff-fade-in:after {
		transform: rotate(12.5deg) scale(1.5, 1.51);
	}
`);


var meta = document.createElement('meta');
meta.setAttribute('name', 'viewport');
meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no');
document.head.appendChild(meta);
body.innerHTML = `<a href="https://en.wikipedia.org/wiki/Alexander_Stepanovich_Popov" style="text-decoration: none"><img id="popoff" src='./popoff.png' alt="Señor Popov. Попов Александр Степанович, портрет гравюра." style="display: block; margin: auto;"/></a>
<h1 style="text-align:center;">Señor Popoff</h1>
<p style="text-align: center">Popoff provides every and each sort of popup: dialog, modal, tooltip, dropdown, confirm, notifier, popover, lightbox, balloon, dialog, alert, overlay, sidebar etc.</p>
<section id="types">
<h2 style="text-align:center;">Cases</h2>
<p>These are available types of popups. Use them as <code>type: 'type-name'</code> option.</p>
<p style="text-align: center"></p>
</section>
<section id="effects">
<h2 style="text-align:center;">Effects</h2>
<p style="text-align: center">Use the following effects as <code>effect: 'effect-name'</code> option.</p>
<p style="text-align: center"></p>
</section>
<a href="https://github.com/dfcreative/popoff" style="display: block; margin-top: 3rem; text-align: center; text-decoration: none; color: black;"><svg style="width: 3rem; height: 3rem;" xmlns="http://www.w3.org/2000/svg" width="784" height="1024" viewBox="0 0 784 1024"><path d="M4.168 480.005q0 107.053 52.114 194.314 52.114 90.085 141.399 141.799t194.314 51.714q105.441 0 195.126-51.714 89.685-52.114 141.199-141.599t51.514-194.514q0-106.652-51.714-195.126-52.114-89.685-141.599-141.199T392.007 92.166q-107.053 0-194.314 52.114-90.085 52.114-141.799 141.399T4.18 479.993zm64.634 0q0-64.634 25.451-124.832t69.482-103.828q44.031-44.031 103.828-69.282t124.432-25.251 124.832 25.251 104.229 69.282q43.631 43.631 68.882 103.828t25.251 124.832q0 69.482-28.487 132.504t-79.989 108.876-117.76 66.458V673.919q0-42.419-34.747-66.257 85.238-7.672 124.632-43.23t39.383-112.712q0-59.786-36.759-100.593 7.272-21.815 7.272-42.018 0-29.899-13.732-54.939-27.063 0-48.478 8.884t-52.515 30.699q-37.571-8.484-77.565-8.484-45.654 0-85.238 9.295-30.299-22.216-52.314-31.311t-49.891-9.084q-13.332 25.451-13.332 54.939 0 21.004 6.871 42.419-36.759 39.594-36.759 100.192 0 77.165 39.183 112.312t125.644 43.23q-23.027 15.355-31.911 44.843-19.792 6.871-41.207 6.871-16.156 0-27.875-7.272-3.636-2.024-6.66-4.236t-6.26-5.448-5.248-5.048-5.248-6.26-4.236-5.659-4.848-6.46-4.236-5.659q-18.991-25.051-45.243-25.051-14.143 0-14.143 6.06 0 2.424 6.871 8.083 12.931 11.308 13.732 12.12 9.696 7.672 10.908 9.696 11.719 14.544 17.779 31.911 22.627 50.502 77.565 50.502 8.884 0 34.747-4.036v85.649q-66.257-20.603-117.76-66.458T97.346 612.533 68.859 480.029z"/></svg></a>
`;

var p = Popup({
	type: 'tooltip',
	target: '#popoff',
	side: 'right',
	content: `Hello my friend!`,
	style: {
		borderRadius: 15,
		marginLeft: -25
	},
	onShow: function () {
		var quote = [
			`I don't dream about actors and actresses; they dream about me. I am reality, they are not.`,
			`I respect everyone. I even respect journalists.`,
			`The emission and reception of signals by Marconi by means of electric oscillations is nothing new. In America, the famous engineer Nikola Tesla carried the same experiments in 1893.`
		][(Math.random()*3)|0];

		this.element.innerHTML = '<p>' + quote + '</p>';
	}
});


// var target = document.createElement('a');
// target.href = '#overlay';
// target.innerHTML = 'Overlay';
// target.className = 'target';
// target.style.textDecoration = 'none';
// target.style.background = 'black';
// target.style.color = 'white';
// target.style.padding = '10px';
// document.querySelector('#types p:last-of-type').appendChild(target);

// var o = Overlay();

// target.addEventListener('click', () => {
// 	o.show();
// });


test('modal', function () {
	var target = document.createElement('a');
	target.href = '#modal';
	target.innerHTML = 'Modal';
	target.className = 'target';
	target.style.textDecoration = 'none';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var p = Popup({
		overlay: true,
		content: `
			<h2>Modal</h2>
			${ipsum({count: 1, units: 'paragraph', format: 'html'})}
		`
	});

	// p.show();
	target.addEventListener('click', e => {
		p.show(target);
	});
});


test('sidebar', function () {
	var target = document.createElement('a');
	target.href = '#sidebar';
	target.style.textDecoration = 'none';
	target.innerHTML = 'Sidebar';
	target.className = 'target';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var p = Popup({
		type: 'sidebar',
		shift: true,
		content: `
			<h2>Sidebar</h2>
			${ipsum({count: 2, units: 'sentences', format: 'html'})}
		`
	});

	target.addEventListener('click', () => {
		p.side = ['top', 'left', 'bottom', 'right'][(Math.random() * 4)| 0]
		p.show();
	})
});


test('dropdown', () => {
	var target = document.createElement('a');
	target.href = '#dropdown';
	target.innerHTML = 'Dropdown';
	target.className = 'target';
	target.style.background = 'black';
	target.style.textDecoration = 'none';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var content = document.createElement('div');
	content.innerHTML = `<p>Dropdown content<p>`;
	document.body.appendChild(content);

	var dropdown = new Popup({
		content: content,
		target: target,
		type: 'dropdown'
	});

	// dropdown.show();
});

test('tooltip', () => {
	var target = document.createElement('a');
	target.href = '#tooltip';
	target.innerHTML = 'Tooltip';
	target.className = 'target';
	target.style.textDecoration = 'none';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var content = document.createElement('div');
	content.innerHTML = `<p>Tooltip content</p>`;

	var tooltip = new Popup({
		content: content,
		target: target,
		type: 'tooltip'
	});
});


test('dialog draggable', () => {
	var target = document.createElement('a');
	target.href = '#drag-resize';
	target.innerHTML = 'Draggable';
	target.className = 'target';
	target.style.textDecoration = 'none';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var p = Popup({
		target: target,
		overlay: false,
		effect: 'fade',
		side: 'bottom',
		wrap: false,
		content: `
			<h2>Draggable</h2>
			<p>Enable draggable behavior with <a href="https://npmjs.org/package/draggy">draggy</a> component as so:</p>
			<code><pre>
var popup = new Popup({
	overlay: false,
	effect: 'fade'
});
Draggable(popup.element);
			</pre></code>
			Don’t forget to remove <code>max-width</code>.
		`
	});

	Draggable(p.element, {
		within: window
	});
	// Resizable(p.element, {
	// 	draggable: true,
	// 	// css3: false,
	// 	within: window
	// });
});


test('tall modal', function () {
	var target = document.createElement('a');
	target.href = '#tall-modal';
	target.innerHTML = 'Tall modal';
	target.className = 'target';
	target.style.textDecoration = 'none';
	target.style.background = 'black';
	target.style.color = 'white';
	target.style.padding = '10px';
	document.querySelector('#types p:last-of-type').appendChild(target);

	var p = Popup({
		overlay: true,
		content: `
			<h2>Tall modal</h2>
			<p>
				When there is too much of content in modal, it is comfortable to have main scroll replaced with the scroll of modal content. That is what you see in this modal - the content of the body is placed into overlay.
			</p>
			${ipsum({count: 15, units: 'paragraph', format: 'html'})}
		`
	});

	// p.show();
	target.addEventListener('click', e => {
		p.show(target);
	});
});


test('Effects', function () {
	var effects = [
		'fade', 'scale',
		'slide-right', 'slide-bottom', 'slide-left', 'slide-top',
		'newspaper','super-scaled',
		// 'just-me'
	];

	effects.forEach((effect) => {
		var target = document.createElement('a');
		target.href = '#'+effect;
		target.innerHTML = effect;
		target.className = 'target';
		target.style.textDecoration = 'none';
		target.style.background = 'black';
		target.style.color = 'white';
		target.style.padding = '10px';
		document.querySelector('#effects p:last-of-type').appendChild(target);

		var p = Popup({
			target: target,
			effect: effect,
			content: `
				<h2 class="modal-effect">effect: ${effect}</h2>
				${ipsum({count: 3, units: 'paragraph', format: 'html'})}
			`
		});
	});
});