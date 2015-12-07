'use strict';

module.exports = function (grunt) {
  var runtimeFiles = [
    'lib/pep-0.4.1-pre.js',
    'src/runtime/bootstrap.js',
    'src/runtime/base.js',
    'src/runtime/register.js',
    'src/mixins/*.js'
  ];

  // var platformFiles = [
  //   'src/platform/bootstrap.js',
  //   'lib/document-register-element/build/document-register-element.max.js',
  //   'lib/CustomEvent.js',
  //   'lib/DOMTokenList.js',
  //   'lib/importNode.js',
  //   'src/platform/ShadowDOM.js'
  // ];

  grunt.initConfig({

    connect: {
      sample: {
        options: {
          port: 8021,
          base: ['.', 'sample'],
          hostname: '*'
        }
      }
    },

    concat: {
      options: {
        banner: '(function() {\n',
        //separator: '})(); (function() {',
        footer: '\n})();'
      },
      // platform: {
      //   src: platformFiles,
      //   dest: 'dist/bosonic-platform.js'
      // },
      runtime: {
        src: runtimeFiles,
        dest: 'dist/bosonic-runtime.js'
      }
    },

    uglify: {
      runtime: {
        files: {
          'dist/bosonic-runtime.min.js': ['dist/bosonic-runtime.js']
        }
      }
    },

    watch: {
      runtime: {
        files: ['src/runtime/*.js', 'src/mixins/*.js'],
        tasks: ['build']
      }
    }

  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('build', ['concat', 'uglify']);
  grunt.registerTask('default', ['build', 'connect', 'watch']);

};