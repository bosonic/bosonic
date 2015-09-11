var jsdom = require('jsdom').jsdom,
    expect = require('chai').expect,
    transpileTemplate = require('../../src/transpiler/templates').transpileTemplate;

var document, window;

function transpileAndAppend(template) {
    var transpiled = transpileTemplate(template);
    var tpl = eval(transpiled);
    document.body.appendChild(tpl.content);
    return document.body.innerHTML;
}

function checkTranspilation(template) {
    expect(transpileAndAppend(template)).to.equal(template.trim());
}

describe('Template transpilation', function() {
    beforeEach(function() {
        document = jsdom("<html><body></body></html>");
        window = document.parentWindow;
    });

    it('should generate code that returns a faked HTML template when evalued', function() {
        var transpiled = transpileTemplate('<div />');
        expect(eval(transpiled)).to.have.property('content');
    });

    it('should work with a single node', function() {
        checkTranspilation('<span>Test</span>');
    });

    it('should work with multiple root nodes', function() {
        checkTranspilation('<span>Test</span><div>Foo</div>');
    });

    it('should preserve attributes', function() {
        checkTranspilation('<span id="test" class="foo">Test</span>');
    });

    it('should ignore surrounding whitespace', function() {
        checkTranspilation('    <span>Test</span>    ');
    });
});