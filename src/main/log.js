/**
 * Log configuration for convenient re-mapping.
 */
define([
    "./Logger",
    "module"
], function (
    Logger,
    module
) {

    "use strict";

    var config = module.config(),
        logLevel = config && config.logLevel;

    return new Logger(logLevel || "warn");

});