/*
 * grunt-htmlstamp
 * https://github.com/helinjiang/grunt-htmlstamp
 *
 * Copyright (c) 2015 helinjiang
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                'lib/*.js',
                '<%= nodeunit.tests %>'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },

        // copy  to tmp
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'test/fixtures/',
                    src: ['**/*.js','**/*.html'],
                    dest: 'tmp/'
                }]
            }
        },

        // Configuration to be run (and then tested).
        htmlstamp: {
            suffix_time: {
                files: {
                    'tmp/suffix_time.html': ['tmp/test1.js']
                }
            },
            suffix_hash: {
                options: {
                    appendType: 'hash'
                },
                files: {
                    'tmp/suffix_hash.html': ['tmp/test1.js']
                }
            }
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        }

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['clean','copy', 'htmlstamp', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);

};
