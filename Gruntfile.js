"use strict";

module.exports = function (grunt) {

    grunt.initConfig({
        jshint: {
            src: ['src/main/**/*.js', 'src/test/**/*.js', '!node_modules/**/*.*'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        },
        watch: {
            js: {
                files: ['**/*.js', '!**/node_modules/**'],
                tasks: ['lint', 'test']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('test', ['karma']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('default', ['jshint', 'karma']);

};
