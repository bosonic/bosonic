'use strict';

module.exports = function(grunt) {

  grunt.initConfig({

    concat: {
      platform: {
        src: [
          'src/platform/bootstrap.js',
          'lib/document-register-element/build/document-register-element.max.js',
          'lib/CustomEvent.js',
          'lib/DOMTokenList.js',
          'src/platform/ShadowDOM.js'
        ],
        dest: 'dist/bosonic-platform.js'
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

    watch: {
      platform: {
        files: ['src/platform*.js'],
        tasks: ['concat:platform']
      }
    }

  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('test:transpiler', ['mochaTest']);

  grunt.registerTask('default', ['concat', 'watch']);

};