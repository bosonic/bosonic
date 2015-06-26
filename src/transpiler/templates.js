var jstransform = require('jstransform'),
    Syntax = require('esprima-fb').Syntax,
    utils = require('jstransform/src/utils');

function visitTag(traverse, object, path, state) {
    //console.log(object);
    var openingElement = object.openingElement,
        closingElement = object.closingElement,
        name = openingElement.name.name,
        attributes = openingElement.attributes,
        children = object.children,
        isWrapper = false;

    if (name === 'stupid-wrapper') {
        isWrapper = true;
    }

    if (!state.eltCount) {
        state = utils.updateState(state, {
            eltCount: state.g.opts.eltCount,
            currentParent: state.g.opts.currentParent
        });
    }

    if (isWrapper) {
        utils.move(openingElement.range[1], state);
    } else {
        var eltVar = 'el' + state.eltCount;
        state = utils.updateState(state, {
            eltCount: state.eltCount + 1
        });

        utils.catchup(openingElement.range[0], state);

        utils.append('var ' + eltVar + ' = document.createElement("' + name + '");\n', state);

        attributes.forEach(function(attr) {
            var attrName = (typeof attr.name.name === 'object') ? attr.name.namespace.name + ':' + attr.name.name.name : attr.name.name,
                attrValue = attr.value.raw;
            
            utils.append(eltVar + '.setAttribute("' + attrName + '", ' + attrValue + ');\n', state);
        });

        if (!openingElement.selfClosing) {
            utils.move(openingElement.range[1], state);
        }
    }

    if (children.length > 0) {
        var prevParent = state.currentParent;

        state = utils.updateState(state, {
            currentParent: eltVar
        });

        children.forEach(function(child) {
            if (child.type === Syntax.Literal) {
                utils.append(state.currentParent + '.appendChild(document.createTextNode("' + child.raw + '"));\n', state);
            } else {
                traverse(child, path, state);
            }

            utils.move(child.range[1], state);
        });

        state = utils.updateState(state, {
            currentParent: prevParent
        });
    }

    if (openingElement.selfClosing) {
        utils.move(openingElement.range[1], state);
    } else {
        utils.move(closingElement.range[1], state);
    }

    if (!isWrapper) {
        utils.append(state.currentParent + '.appendChild(' + eltVar + ');\n', state);
    }

    return false;
}

visitTag.test = function(object, path, state) {
    return object.type === Syntax.XJSElement;
};

function transpileTemplate(html) {
    var template = html.trim().replace(/\n/g, "")
                              .replace(/[\t ]+\</g, "<")
                              .replace(/\>[\t ]+\</g, "><")
                              .replace(/\>[\t ]+$/g, ">"),
        transformed = jstransform.transform(
        [visitTag],
        '<stupid-wrapper>' + template + '</stupid-wrapper>',
        {
            currentParent: 'df0',
            eltCount: 0
        }
    );
    return '(function() {\n'
        + 'var df0 = document.createDocumentFragment();\n' + transformed.code
        + 'return { content: df0 };\n'
        + '})();\n';
}

exports = module.exports = {
    transpileTemplate: transpileTemplate
};