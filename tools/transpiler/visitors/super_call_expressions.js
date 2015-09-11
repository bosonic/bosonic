var Syntax = require('esprima-fb').Syntax,
    utils = require('jstransform/src/utils'),
    tools = require('../tools');

function visitSuperCallExpression(traverse, node, path, state) {
    var superClassName = tools.getExtendeeClass(state.g.opts.extendee);

    if (node.callee.type === Syntax.MemberExpression) {
        utils.move(node.callee.range[0], state);
        utils.append(superClassName + '.prototype', state);
        utils.move(node.callee.object.range[1], state);
        utils.catchup(node.callee.property.range[1], state);
        utils.append('.call(this', state);
        if (node.arguments.length > 0) {
            utils.append(', ', state);
            utils.catchupWhiteSpace(node.arguments[0].range[0], state);
            traverse(node.arguments, path, state);
        }
        utils.append(')', state);
        utils.move(node.range[1], state);
    }
    return false;
}
visitSuperCallExpression.test = function(node, path, state) {
    if (node.type === Syntax.CallExpression) {
        var callee = node.callee;
        if (callee.type === Syntax.Identifier && callee.name === 'super'
            || callee.type == Syntax.MemberExpression
            && callee.object.name === 'super') {
            return true;
        }
    }
    return false;
};

exports = module.exports = visitSuperCallExpression;