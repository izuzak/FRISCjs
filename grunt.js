module.exports = function(grunt) {
  grunt.initConfig({
    peg: {
        friscasm : {
            grammar: "src/friscasm.pegjs",
            exportVar: "frisc_asm",
            outputFile: "src/friscasm.js"
        }
    },

    concat: {
        friscasm : {
            src: ['src/friscasm.js',
                  'src/friscasm.export.js'],
            dest: 'src/friscasm.js'
        },
        browser : {
            src: ['src/friscasm.js',
                  'src/friscsim.js',
                  'lib/index.js'],
            dest: 'lib/friscjs-browser.js'
        },
        consoleapp_sim : {
            src: ['src/friscsim.js'],
            dest: 'consoleapp/friscsim.js'
        },
        consoleapp_asm : {
            src: ['src/friscasm.js'],
            dest: 'consoleapp/friscasm.js'
        }
    },

    lint: {
      all: ['src/friscasm.export.js', 'src/friscsim.js', 'consoleapp/frisc-console.js', 'webapp/scripts/*']
    },

    min: {
        dist : {
            src: ['lib/friscjs-browser.js'],
            dest: 'lib/friscjs-browser.min.js'
        }
    },

    jsvalidate: {
      all: ['src/friscasm.export.js', 'src/friscsim.js', 'consoleapp/frisc-console.js', 'webapp/scripts/*']
    }
  });

  grunt.loadNpmTasks('grunt-peg');
  grunt.loadNpmTasks('grunt-jsvalidate');

  grunt.registerTask('default', 'jsvalidate lint peg concat min');
};
