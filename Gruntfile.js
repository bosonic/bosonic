
'use strict';

module.exports = function(grunt) {

  var polyfillFiles = [
    'lib/bootstrap.js',
    'lib/other/DOMTokenList.js',
    'lib/other/CustomEvent.js',
    'lib/WeakMap/weakmap.js',
    'lib/MutationObservers/MutationObserver.js',
    'lib/CustomElements/src/CustomElements.js',
    'lib/CustomElements/src/Observer.js',
    'lib/CustomElements/src/Parser.js',
    'lib/CustomElements/src/boot.js',

    'src/head.js',
    'src/wrapper.js',
    'src/fragments.js',
    'src/shadowDOM.js',
    'src/mutations.js',
    'src/tail.js'
  ];
  
  grunt.initConfig({

    clean: {
      dist: ['dist'],
    },

    concat: {
      polyfills: {
        src: polyfillFiles,
        dest: 'dist/bosonic-polyfills.js'
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    watch: {
      src: {
        files: ['src/*.js'],
        tasks: ['concat']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('default', ['concat', 'watch']);
  grunt.registerTask('dist', ['clean', 'concat']);
  grunt.registerTask('test', ['concat', 'karma']);

};
