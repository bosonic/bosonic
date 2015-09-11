var Syntax = require('esprima-fb').Syntax,
    utils = require('jstransform/src/utils'),
    tools = require('../tools');

function visitIdentifiersToReplace(traverse, node, path, state) {
    utils.catchup(node.range[0], state);
    utils.append(state.g.opts.replace[node.name], state);
    utils.move(node.range[1], state);
    
}
visitIdentifiersToReplace.test = function(node, path, state) {
    return node.type === Syntax.Identifier && state.g.opts.replace.hasOwnProperty(node.name);
}

exports = module.exports = visitIdentifiersToReplace;