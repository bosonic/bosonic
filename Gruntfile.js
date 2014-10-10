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

    watch: {
      platform: {
        files: ['src/*.js'],
        tasks: ['concat']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['concat', 'watch']);

};