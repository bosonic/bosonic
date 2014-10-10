var fs = require('fs'),
    cheerio = require('cheerio'),
    esprima = require('esprima-fb'),
    escodegen = require('escodegen'),
    shimShadowStyles = require('./src/transpiler/css').shimShadowStyles,
    transpileTemplate = require('./src/transpiler/templates').transpileTemplate,
    tools = require('./src/transpiler/tools'),
    jstransform = require('jstransform'),
    visitRegisterExpression = require('./src/transpiler/visitors/register_expressions'),
    visitSuperCallExpression = require('./src/transpiler/visitors/super_call_expressions');

function getMainScript($) {
    var mainScript;
    $('script').each(function(i, script) {
        if (!$(this).attr('src')) {
            if (mainScript !== undefined) {
                throw new Error('Only one <script> is permitted in a Web Component declaration');
            }
            mainScript = $(this);
        }
    });
    return mainScript;
}

function getDependencies($) {
    var scriptDeps = [],
        cssDeps = [];
    $('script').each(function(i, script) {
        if ($(this).attr('src')) {
            scriptDeps.push($(this).attr('src'));
        }
    });
    $('link[rel=stylesheet]').each(function(i, link) {
        cssDeps.push($(this).attr('href'));
    });
    return {
        stylesheets: cssDeps,
        scripts: scriptDeps
    };
}

function getElementFacets($) {
    var element = $('element');
    return {
        name: element.attr('name'),
        attributes: element.attr('attributes') ? element.attr('attributes').split(' ') : null,
        extendee: element.attr('extends')
    };
}

function getDefaultOptions(element, options) {
    options = options || {};
    options.name = element.name;
    options.attributes = element.attributes;
    options.extendee = element.extendee;
    return options;
}

function includeTemplatingCode(options) {
    options.inject = options.inject || {};
    options.inject.createdCallback = [
        'this.createShadowRoot();',
        'this.shadowRoot.appendChild(document.importNode('+options.templateVar+'.content, true));'
    ]
    return options;
}

function includeAttributeChangedCode(options, attributes) {
    options.inject = options.inject || {};
    options.inject.attributeChangedCallback = {
        args: ['name', 'oldValue', 'newValue'],
        body: [
            'if ([' + tools.stringifyArray(attributes) + '].indexOf(name) !== -1 && this[name + \'Changed\']) {',
            '  this[name + \'Changed\'].call(this, oldValue, newValue);',
            '}'
        ]
    };
    return options;
}

function templateVar(element) {
    return '__bosonic__template__' + element.name.replace(/-/g, '_') + '__';
}

function transpileForBosonicPlatform(htmlString, options) {
    var $ = cheerio.load(htmlString, { xmlMode: true }),
        element = getElementFacets($),
        options = getDefaultOptions(element, options);

    var styles = transpileToCSS(element, $, options);

    var template = $('template');
    if (template.length !== 0) {
        options.prepend = options.prepend || [];
        options.templateVar = templateVar(element);
        options.prepend.push('var ' + options.templateVar + ' = ' + transpileTemplate(template.html()));
        
        includeTemplatingCode(options);
    }

    if (element.attributes) {
        includeAttributeChangedCode(options, element.attributes);
    }

    var mainScript = getMainScript($);

    if (mainScript && mainScript.html() !== null) {
        var transpiled = jstransform.transform(
            [visitRegisterExpression, visitSuperCallExpression], 
            mainScript.html(), 
            options
        );
    }

    return {
        js: transpiled ? reindentScript(transpiled.code) : '',
        css: styles
    };
}

function transpileForPolymerPlatform(htmlString, options) {
    var $ = cheerio.load(htmlString, { xmlMode: true }),
        element = getElementFacets($),
        options = getDefaultOptions(element, options);

    var template = $('template');
    if (template.length !== 0) {
        options.prepend = options.prepend || [];
        options.templateVar = templateVar(element);
        options.prepend.push('var ' + options.templateVar + ' = document._currentScript.parentNode.querySelector(\'template\');');
        
        includeTemplatingCode(options);
    }

    if (element.attributes) {
        includeAttributeChangedCode(options, element.attributes);
    }

    var mainScript = getMainScript($);

    if (mainScript && mainScript.html() !== null) {
        var transpiled = jstransform.transform(
            [visitRegisterExpression, visitSuperCallExpression], 
            mainScript.html(), 
            options
        );
        mainScript.html("\n"+reindentScript(transpiled.code)+"\n");
    }

    $('style').each(function(i, style) {
        if ($(this).parent('template').length !== 0) {
            $(this).closest('element').prepend(
                '\n<style>\n' + 
                shimShadowStyles($(this).html(), element.name) + 
                '\n</style>'
            );
            $(this).remove();
        }
    });
    
    return $.html();
}

function transpileToNativeElement(htmlString, options) {
    var $ = cheerio.load(htmlString, { xmlMode: true }),
        element = getElementFacets($),
        options = getDefaultOptions(element, options);

    var template = $('template');
    if (template.length !== 0) {
        options.prepend = options.prepend || [];
        options.templateVar = templateVar(element);
        options.prepend.push('var ' + options.templateVar + ' = document.currentScript.parentNode.querySelector(\'template\');');
        
        includeTemplatingCode(options);
    }

    if (element.attributes) {
        includeAttributeChangedCode(options, element.attributes);
    }

    var mainScript = getMainScript($);

    if (mainScript && mainScript.html() !== null) {
        var transpiled = jstransform.transform(
            [visitRegisterExpression, visitSuperCallExpression], 
            mainScript.html(), 
            options
        );
        mainScript.html("\n"+reindentScript(transpiled.code)+"\n");
    }
    
    return $.html();
}

function transpileToCSS(element, $, options) {
    var css = [];

    $('style').each(function(i, style) {
        if ($(this).parent('template').length !== 0) {
            css.push(shimShadowStyles($(this).html(), element.name));
        } else {
            css.push($(this).html());
        }
        $(this).remove();
    });

    return css.join('\n');
}

function reindentScript(script) {
    // We do another pass with Esprima in order to indent JS code correctly
    var outputAst = esprima.parse(script);
    return escodegen.generate(outputAst);
}

exports = module.exports = {
    transpileToNativeElement: transpileToNativeElement,
    transpileForBosonicPlatform: transpileForBosonicPlatform,
    transpileForPolymerPlatform: transpileForPolymerPlatform,
    reindentScript: reindentScript,
    shimShadowStyles: shimShadowStyles
}
