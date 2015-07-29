var Poppy = require('poppy');
var ipsum = require('lorem-ipsum');

var body = document.body,
	doc = document,
	root = doc.documentElement,
	p = doc.querySelector('#playground');


/** Simple visual section creator */
function createSection(name){
	var h = document.createElement('h1');
	h.innerHTML = name;
	h.className = 'section-title';
	p.appendChild(h);
}



describe('content', function(){
	var content;

	before(function(){
		createSection('Content');

		//create shareable content
		content = document.createElement('div');
		content.id = "content";
		content.textContent = "Hi. I’m dynamically created element.";
		content.setAttribute('hidden', true);

		body.appendChild(content);
	});

	it('html', function(){
		var target = document.createElement('div');
		target.innerHTML = this.test.title;
		target.className = 'target';
		p.appendChild(target);

		var dd = new Poppy(ipsum({count: 3, units: 'paragraph', format: 'html'}), {
			target: target,
			type: 'dropdown'
		});
	});

	it('selector', function(){
		var target = document.createElement('div');
		target.innerHTML = this.test.title;
		target.className = 'target';
		p.appendChild(target);

		var dd = new Dropdown({
			target: target,
			content: '#content'
		});
	});

	it('element', function(){
		var target = document.createElement('div');
		target.innerHTML = this.test.title;
		target.className = 'target';
		p.appendChild(target);

		var dd = new Dropdown({
			target: target,
			content: content
		});
	});
});


describe('options', function(){
	before(function(){
		createSection('Options');
	});

	it('close-button', function(){

	});

	it('no-close-button', function(){

	});
});


describe('dropdown', function(){
	before(function(){
		createSection('Dropdown');
	});

	it('', function(){

	});
});