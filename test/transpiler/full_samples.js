var expect = require('chai').expect,
    transpiler = require('../../'),
    fs = require('fs');

describe('Simplified spec sample', function() {
    var fixture = fs.readFileSync(__dirname + '/fixtures/simplified_spec_sample.html', 'utf8');
    
    it('should transpile into a native HTML element', function() {
        var expected = fs.readFileSync(__dirname + '/expected/simplified_spec_sample.native.html', 'utf8'),
            transpiled = transpiler.transpileToNativeElement(fixture);

        expect(transpiled).to.equal(expected);
    });

    it('should transpile into an element for the Polymer platform', function() {
        var expected = fs.readFileSync(__dirname + '/expected/simplified_spec_sample.html', 'utf8'),
            transpiled = transpiler.transpileForPolymerPlatform(fixture);

        expect(transpiled).to.equal(expected);
    });

    it('should transpile into vanilla JS & CSS', function() {
        var expected = fs.readFileSync(__dirname + '/expected/simplified_spec_sample.js', 'utf8'),
            transpiled = transpiler.transpileForBosonicPlatform(fixture);

        expect(transpiled.js).to.equal(expected);
        expect(transpiled.css).to.equal([
            'tick-tock-clock {',
            '  border: 1px solid #ccc;',
            '}'
        ].join('\n'));
    });
});

describe('Extended spec sample', function() {
    var fixture = fs.readFileSync(__dirname + '/fixtures/extended_spec_sample.html', 'utf8');

    it('should transpile into a native HTML element', function() {
        var expected = fs.readFileSync(__dirname + '/expected/extended_spec_sample.html', 'utf8'),
            transpiled = transpiler.transpileToNativeElement(fixture);

        expect(transpiled).to.equal(expected);
    });

    it('should transpile into vanilla JS & CSS', function() {
        var expected = fs.readFileSync(__dirname + '/expected/extended_spec_sample.js', 'utf8'),
            transpiled = transpiler.transpileForBosonicPlatform(fixture);

        expect(transpiled.js).to.equal(expected);
        expect(transpiled.css).to.equal('');
    });
});

describe('Extended native element', function() {
    var fixture = fs.readFileSync(__dirname + '/fixtures/extended_native_element.html', 'utf8');

    it('should transpile into a vanilla JS Web Component', function() {
        var expected = fs.readFileSync(__dirname + '/expected/extended_native_element.html', 'utf8'),
            transpiled = transpiler.transpileToNativeElement(fixture);

        expect(transpiled).to.equal(expected);
    });

    it('should transpile into vanilla JS & CSS', function() {
        var expected = fs.readFileSync(__dirname + '/expected/extended_native_element.js', 'utf8'),
            transpiled = transpiler.transpileForBosonicPlatform(fixture);

        expect(transpiled.js).to.equal(expected);
        expect(transpiled.css).to.equal('');
    });
});