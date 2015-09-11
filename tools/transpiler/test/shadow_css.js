var expect = require('chai').expect,
    css = require('../../src/transpiler/css');

describe('Shadow CSS shiming', function() {
    it('should rewrite selectors that contain shadow DOM pseudo selectors', function() {
        var tests = [
            [':host', 'b-dummy'],
            [':host:hover', 'b-dummy:hover'],
            [':host[visible]', 'b-dummy[visible]'],
            [':host(.cssClass)', 'b-dummy.cssClass'],
            [':ancestor(.cssClass)', '.cssClass b-dummy'],
            [':host-context(.cssClass)', '.cssClass b-dummy'],
            ['::content p', 'b-dummy p']
        ];
        tests.forEach(function(rule) {
            expect(css.shimShadowSelector(rule[0], 'b-dummy')).to.equal(rule[1]);
        });
    });

    it('should not modify some selectors', function() {
        var tests = [
            ['p', 'p'],
            ['b-dummy', 'b-dummy'],
            ['b-dummy p', 'b-dummy p'],
        ];
        tests.forEach(function(rule) {
            expect(css.shimShadowSelector(rule[0], 'b-dummy')).to.equal(rule[1]);
        });
    });

    it('should rewrite a full stylesheet', function() {
        var styles = [
            ':host {',
            '  display: block;',
            '}',
            ':host:hover {',
            '  color: blue;',
            '}',
            ':host(.active) {',
            '  color: red;',
            '}',
            'p {',
            '  color: black;',
            '}'
        ].join('\n'),
            shimed = [
            'b-dummy {',
            '  display: block;',
            '}\n',
            'b-dummy:hover {',
            '  color: blue;',
            '}\n',
            'b-dummy.active {',
            '  color: red;',
            '}\n',
            'b-dummy p {',
            '  color: black;',
            '}\n',
            'b-dummy::shadow p {',
            '  color: black;',
            '}'
        ].join('\n');

        expect(css.shimShadowStyles(styles, 'b-dummy')).to.equal(shimed);
    });
});
