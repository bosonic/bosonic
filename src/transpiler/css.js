function buildShadowRegexes(elementName) {
    return [
        [/^:host\(([^:]+)\)$/, elementName+'$1'],
        [/^:host(:hover|:active|:focus)$/, elementName+'$1'],
        [/^:host(\[[^:]+\])$/, elementName+'$1'],
        [/^:host$/, elementName],
        [/^:ancestor\(([^:]+)\)$/, '$1 '+elementName], // deprecated; replaced by :host-context
        [/^:host-context\(([^:]+)\)$/, '$1 '+elementName],
        [/^::content/, elementName],
    ];
}

function shimSelector(selector, elementName, selectorRegexes) {
    for (var i = 0; i < selectorRegexes.length; i++) {
        var re = selectorRegexes[i];
        if (selector.match(re[0])) {
            selector = selector.replace(re[0], re[1]);
            break;
        }
    }
    return selector;
}

function shimShadowSelector(selector, elementName) {
    return shimSelector(selector, elementName, buildShadowRegexes(elementName));
}

function shimRule(rule, elementName, regexes, rules) {
    rule.selectors.forEach(function(selector, i, selectors) {
        var shimed = shimSelector(selector, elementName, regexes);
        if (shimed === selector && !selector.match(new RegExp(elementName))) {
            shimed = elementName + ' ' + selector;
            rules.push({
                type: 'rule',
                selectors: [elementName + '::shadow ' + selector],
                declarations: rule.declarations
            });
        }
        selectors[i] = shimed;
    });
    return rule;
}

function shimStyles(styles, elementName, regexes) {
    var css = require('css'),
        parseTree = css.parse(styles);

    parseTree.stylesheet.rules.forEach(function(rule, i, rules) {
        rules[i] = shimRule(rule, elementName, regexes, rules);
    });

    return css.stringify(parseTree);
}

function shimShadowStyles(styles, elementName) {
    return shimStyles(styles, elementName, buildShadowRegexes(elementName));
}

exports = module.exports = {
    shimShadowSelector: shimShadowSelector,
    shimShadowStyles: shimShadowStyles
};