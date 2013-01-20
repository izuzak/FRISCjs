module.exports = function(grunt) {
  grunt.initConfig({
    peg: {
        friscasm : {
            grammar: "src/friscasm.pegjs",
            exportVar: "frisc_asm",
            outputFile: "lib/friscasm.js"
        }
    },

    concat: {
        friscasm : {
            src: ['lib/friscasm.js',
                  'src/friscasm.export.js'],
            dest: 'lib/friscasm.js'
        },
        browser : {
            src: ['lib/friscasm.js',
                  'lib/friscjs.js'],
            dest: 'lib/friscjs-browser.js'
        }
    },

    lint: {
      all: ['src/src/friscasm.export.js', 'lib/friscjs.js', 'consoleapp/frisc-console.js', 'webapp/scripts/*']
    },

    min: {
        dist : {
            src: ['lib/friscjs-browser.js'],
            dest: 'lib/friscjs-browser.min.js'
        }
    }
  });

  grunt.loadNpmTasks('grunt-peg');

  grunt.registerTask('default', 'lint peg concat min');
};
