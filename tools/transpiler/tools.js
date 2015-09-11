var Syntax = require('esprima-fb').Syntax,
    utils = require('jstransform/src/utils'),
    jstransform = require('jstransform'),
    visitIdentifiersToReplace = require('./visitors/identifiers_to_replace');

function searchProperty(properties, key, kind) {
    var found;
    properties.forEach(function(property) {
        if (property.kind === kind && property.key.name === key) found = property;
    });
    return found;
}

function searchMethod(properties, key) {
    var found;
    properties.forEach(function(property) {
        if (property.kind === 'init' && property.key.name === key 
            && property.value.type === Syntax.FunctionExpression) found = property;
    });
    return found;
}

function stringifyArray(attributes) {
    return attributes.map(function(a) { return "'" + a + "'"; }).join(', ');
}

function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelize(str) {
    var camelized = str.replace(/(\-|_|\.|\s)+(.)?/g, function(match, separator, chr) {
        return chr ? chr.toUpperCase() : '';
    }).replace(/^([A-Z])/, function(match, separator, chr) {
        return match.toLowerCase();
    });
    return ucfirst(camelized);
}

function decamelize(str) {
    str = str.charAt(0).toLowerCase() + str.slice(1);
    return str.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
}

function extendsNativeElement(extendee) {
    if (!extendee) return false;
    return extendee.indexOf('-') === -1;
}

function getExtendeeClass(extendee) {
    if (!extendee) {
        return 'HTMLElement';
    } else if (extendsNativeElement(extendee)) {
        if (['thead', 'tbody', 'tfoot'].indexOf(extendee) !== -1) {
            return 'HTMLTableSectionElement';
        } else if (extendee === 'nav') {
            return 'HTMLElement';
        } else {
            return 'HTML' + camelize(extendee) + 'Element';
        }
    } else {
        return camelize(extendee);
    }
}

function injectCode(method, state, actualArgs) {
    var replacements = {};
    if (actualArgs) {
        actualArgs.forEach(function(a, i) {
            if (method.args[i] && method.args[i] !== a) {
                replacements[method.args[i]] = a;
            }
        });
    }
    if (Object.getOwnPropertyNames(replacements).length === 0) replacements = false;
    
    var body = Array.isArray(method.body) ? method.body : [method.body];
    body.forEach(function(line) {
        if (replacements) {
            line = replaceIdentifiers(line, replacements);
        }
        utils.append('    ' + line + '\n', state);
    });
}

function replaceIdentifiers(code, replacements) {
    return jstransform.transform([visitIdentifiersToReplace], code, { replace: replacements }).code;
}

function expandInjectObject(inject) {
    for (var k in inject) {
        var method = inject[k];
        if (typeof method !== 'object' || Array.isArray(method)) {
            method = {
                args: [],
                body: method
            };
        }
        inject[k] = method;
    }
    return inject;
}

exports = module.exports = {
    searchProperty: searchProperty,
    searchMethod: searchMethod,
    stringifyArray: stringifyArray,
    ucfirst: ucfirst,
    camelize: camelize,
    decamelize: decamelize,
    getExtendeeClass: getExtendeeClass,
    extendsNativeElement: extendsNativeElement,
    injectCode: injectCode,
    expandInjectObject: expandInjectObject
};