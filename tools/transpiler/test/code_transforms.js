var jstransform = require('jstransform'),
    expect = require('chai').expect,
    visitRegisterExpression = require('../../src/transpiler/visitors/register_expressions'),
    visitSuperCallExpression = require('../../src/transpiler/visitors/super_call_expressions');

describe('Register expressions visitor', function() {
    it('should transform object expressions into a registerElement call', function() {
        var code = [
            '({',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock'
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should transform Bosonic\'s register expressions into a registerElement call', function() {
        var code = [
            'Bosonic.register({',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock'
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('can prepend code to the register expression', function() {
        var code = [
            'Bosonic.register({',
            '})'
        ].join('\n'),
            external = [
            'function fmt(n) {',
            '  return (n < 10 ? \'0\' : \'\') + n;',
            '}'
        ].join('\n'),
            expected = external + '\n' + [
                'var template = document._currentScript.parentNode.querySelector(\'template\');',
                'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
                '})});'
            ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], external + '\n' + code, {
                    name: 'tick-tock-clock',
                    prepend: "var template = document._currentScript.parentNode.querySelector('template');"
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should expand properties into property descriptors', function() {
        var code = [
            'Bosonic.register({',
            '  foo: function(bar) {',
            '    console.log(bar);',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  foo: { enumerable: true, value: function(bar) {',
            '    console.log(bar);',
            '  } }',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock'
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should expand a single getter', function() {
        var code = [
            '({',
            '  get height() {',
            '    return this.style.height;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  height: { enumerable: true, get: function() {',
            '    return this.style.height;',
            '  } }',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock'
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should expand two getters', function() {
        var code = [
            '({',
            '  get height() {',
            '    return this.style.height;',
            '  },',
            '  get width() {',
            '    return this.style.width;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  height: { enumerable: true, get: function() {',
            '    return this.style.height;',
            '  } },',
            '  width: { enumerable: true, get: function() {',
            '    return this.style.width;',
            '  } }',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock'
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should expand a single setter', function() {
        var code = [
            '({',
            '  set height(value) {',
            '    this.style.height = value;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  height: { enumerable: true, set: function(value) {',
            '    this.style.height = value;',
            '  } }',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock'
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should expand a getter/setter', function() {
        var code = [
            '({',
            '  get height() {',
            '    return this.style.height;',
            '  },',
            '  set height(value) {',
            '    this.style.height = value;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  height: { enumerable: true, get: function() {',
            '    return this.style.height;',
            '  }, set: function(value) {',
            '    this.style.height = value;',
            '  } }',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock'
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should expand a setter/getter', function() {
        var code = [
            '({',
            '  set height(value) {',
            '    this.style.height = value;',
            '  },',
            '  get height() {',
            '    return this.style.height;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  height: { enumerable: true, set: function(value) {',
            '    this.style.height = value;',
            '  }, get: function() {',
            '    return this.style.height;',
            '  } }',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock'
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should add the corresponding method when code has to be injected into a method that does not exist', function() {
        var code = [
            'Bosonic.register({',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  createdCallback: { enumerable: true, value: function() {',
            '    console.log("created");',
            '  } },',
            '  attributeChangedCallback: { enumerable: true, value: function(name, oldValue, newValue) {',
            '    console.log("changed");',
            '  } }',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock',
                    inject: {
                        createdCallback: 'console.log("created");',
                        attributeChangedCallback: {
                            args: ['name', 'oldValue', 'newValue'],
                            body: 'console.log("changed");'
                        }
                    }
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should inject code into methods', function() {
        var code = [
            'Bosonic.register({',
            '  createdCallback: function() {',
            '    console.log("created");',
            '  },',
            '  attributeChangedCallback: function(name, old, nu) {',
            '    console.log("attribute changed");',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  createdCallback: { enumerable: true, value: function() {',
            '    this.createShadowRoot();',
            '    console.log("created");',
            '  } },',
            '  attributeChangedCallback: { enumerable: true, value: function(name, old, nu) {',
            '    console.log(name + " changed from " + old + " to " + nu);',
            '    console.log("attribute changed");',
            '  } }',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression], code, {
                    name: 'tick-tock-clock',
                    inject: {
                        createdCallback: 'this.createShadowRoot();',
                        attributeChangedCallback: {
                            args: ['name', 'oldValue', 'newValue'],
                            body: 'console.log(name + " changed from " + oldValue + " to " + newValue);'
                        }
                    }
                }
            );
        expect(transformed.code).to.equal(expected);
    });

    it('should expand a super call into a parent prototype function call', function() {
        var code = [
            '({',
            '  foo: function(bar) {',
            '    super.foo(bar);',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.SuperTickTockClock = document.registerElement(\'super-tick-tock-clock\', { prototype : Object.create(TickTockClock.prototype, {',
            '  foo: { enumerable: true, value: function(bar) {',
            '    TickTockClock.prototype.foo.call(this, bar);',
            '  } }',
            '})});'
        ].join('\n'),
            transformed = jstransform.transform(
                [visitRegisterExpression, visitSuperCallExpression], code, {
                    extendee: 'tick-tock-clock',
                    name: 'super-tick-tock-clock'
                }
            );
        expect(transformed.code).to.equal(expected);
    });

});
