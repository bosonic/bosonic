'use strict';

module.exports = function (grunt) {
  var runtimeFiles = [
    'lib/WeakMap/weakmap.js',
    'lib/MutationObservers/MutationObserver.js',
    'lib/HTMLImports/src/base.js',
    'lib/HTMLImports/src/path.js',
    'lib/HTMLImports/src/xhr.js',
    'lib/HTMLImports/src/Loader.js',
    'lib/HTMLImports/src/Observer.js',
    'lib/HTMLImports/src/parser.js',
    'lib/HTMLImports/src/importer.js',
    'lib/HTMLImports/src/dynamic.js',
    'lib/HTMLImports/src/boot.js',
    'src/runtime/register.js'
  ];

  var platformFiles = [
    'src/platform/bootstrap.js',
    'lib/document-register-element/build/document-register-element.max.js',
    'lib/CustomEvent.js',
    'lib/DOMTokenList.js',
    'lib/importNode.js',
    'src/platform/ShadowDOM.js'
  ];

  grunt.initConfig({

    concat: {
      platform: {
        src: platformFiles,
        dest: 'dist/bosonic-platform.js'
      },
      runtime: {
        src: runtimeFiles,
        dest: 'dist/bosonic-runtime.js'
      }
    },

    mochaTest: {
      transpiler: {
        options: {
          reporter: 'spec'
        },
        src: ['test/transpiler/*.js']
      }
    },

    karma: require('bosonic-tools/test/config/grunt-karma')({
      options: {
        sauceLabs: {
          testName: 'Bosonic Platform Unit Tests',
          recordScreenshots: false
        },
        files: [
          'node_modules/bosonic-tools/test/helpers/npo.js',
          'node_modules/bosonic-tools/test/helpers/karma.js',
          'dist/bosonic-platform.js',
          'test/platform/*.js'
        ]
      }
    }),

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        '*.js',
        'dist/{,*/}*.js',
        'lib/{,*/}*.js',
        'src/{,*/}*.js',
        'test/{,*/}*.js'
      ]
    },

    jsonlint: {
      all: {
        src: [
          '*.json',
          'dist/{,*/}*.json',
          'lib/{,*/}*.json',
          'src/{,*/}*.json',
          'test/{,*/}*.json'
        ]
      }
    },

    watch: {
      js: {
        files: [
          '*.js',
          'dist/{,*/}*.js',
          'lib/{,*/}*.js',
          'src/{,*/}*.js',
          'test/{,*/}*.js'
        ],
        tasks: ['jshint']
      },
      json: {
        files: [
          '*.json',
          'dist/{,*/}*.json',
          'lib/{,*/}*.json',
          'src/{,*/}*.json',
          'test/{,*/}*.json'
        ],
        tasks: ['jsonlint']
      },
      platform: {
        files: ['src/platform/*.js'],
        tasks: ['concat:platform']
      },
      runtime: {
        files: ['src/runtime/*.js'],
        tasks: ['concat:runtime']
      }
    }

  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('test:transpiler', ['mochaTest']);
  grunt.registerTask('test:platform', ['karma']);

  grunt.registerTask('default', ['concat', 'watch']);

};