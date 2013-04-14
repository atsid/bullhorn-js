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
    var config = module.config(),
        logLevel = config && config.logLevel;
    return new Logger(logLevel || "warn");
});