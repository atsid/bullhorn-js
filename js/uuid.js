/**
 * Simple unique ID generator using a timestamp and random numbers.
 */
define(function () {

    "use strict";

    return function () {
        return new Date().valueOf() + "-" + Math.random();
    };

});