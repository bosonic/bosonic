'use strict';

module.exports = function (grunt) {
  var runtimeFiles = [
    'src/runtime/register.js',
    'src/mixins/custom_attributes.js'
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
          port: 8020,
          base: ['.', 'sample'],
          hostname: '*'
        }
      }
    },

    concat: {
      // platform: {
      //   src: platformFiles,
      //   dest: 'dist/bosonic-platform.js'
      // },
      runtime: {
        src: runtimeFiles,
        dest: 'dist/bosonic-runtime.js'
      }
    },

    watch: {
      runtime: {
        files: ['src/runtime/*.js', 'src/mixins/*.js'],
        tasks: ['concat:runtime']
      }
    }

  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', ['concat', 'connect', 'watch']);

};