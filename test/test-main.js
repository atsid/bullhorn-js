/*globals window, requirejs */
"use strict";

var allTestFiles = [],
    pathToModule = function (path) {
        var fixed = path.replace(/^\/base\//, '').replace(/\.js$/, '');
        return fixed;
    };

Object.keys(window.__karma__.files).forEach(function (file) {
    console.log(file);
    if (/Test.*\.js$/.test(file)) {
        // Normalize paths to RequireJS module names.
        allTestFiles.push(pathToModule(file));
    }
});

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base',

    paths: {
        'bullhorn': 'js',
        'test': 'test'
    },

    map: {
        "*": {
            "bullhorn/Validator": "test/MockValidator"
        }
    },

    // ask Require.js to load these files (all our tests)
    deps: allTestFiles,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});