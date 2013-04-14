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
    return new Logger(module.config().logLevel || "warn");
});