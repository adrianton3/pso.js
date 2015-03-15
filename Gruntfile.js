module.exports = function (grunt) {
	'use strict';

	grunt.initConfig({
		docco: {
			dev: {
				src: ['src/pso.js'],
				options: {
					output: 'docs/',
					css: 'tools/docco-small-tab.css'
				}
			}
		},

		eslint: {
			options: {
				configFile: '.eslintrc'
			},
			target: ['Gruntfile.js', 'src/**/*.js', 'examples/**/*.js']
		}
	});

	grunt.loadNpmTasks('grunt-docco');
	grunt.loadNpmTasks('grunt-eslint');

	grunt.registerTask('default', ['eslint']);
};
