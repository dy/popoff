var Poppy = require('poppy');
var Dropdown = Poppy.Dropdown;


var ipsum = 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Donec non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus. Pellentesque habitant morbi tristique senectus et netus et malesuada <strong>fames</strong> ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Donec non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus';

var body = document.body, doc = document, root = doc.documentElement, p = doc.querySelector('#playground');



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

		var dd = new Dropdown({
			target: target,
			contentType: 'html',
			content: ipsum,
			containerClass: 'container-lorem'
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