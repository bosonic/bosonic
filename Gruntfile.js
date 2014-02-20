
'use strict';

module.exports = function(grunt) {

  var polyfillFiles = [
    'lib/bootstrap.js',
    'lib/other/DOMTokenList.js',
    'lib/WeakMap/weakmap.js',
    'lib/MutationObservers/MutationObserver.js',
    'lib/CustomElements/src/CustomElements.js',
    'lib/CustomElements/src/Observer.js',
    'lib/CustomElements/src/Parser.js',
    'lib/CustomElements/src/boot.js'
  ];
  
  grunt.initConfig({

    clean: {
      dist: ['dist'],
    },

    concat: {
      lib: {
        src: [
          'src/head.js',
          'src/wrapper.js',
          'src/fragments.js',
          'src/shadowDOM.js',
          'src/mutations.js',
          'src/register.js',
          'src/tail.js',
        ],
        dest: 'dist/bosonic.js',
      },
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
      lib: {
        files: ['src/*.js'],
        tasks: ['concat:lib']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('default', ['concat:lib', 'watch']);
  grunt.registerTask('dist', ['clean', 'concat']);
  grunt.registerTask('test', ['concat:lib', 'karma']);

};
