define(function () {

    "use strict";

    /**
     * @class Validator
     * Validation stub for integration with a json schema validator.
     */
    return function () {
        /**
         * Validate an instance of an object against the schema definition.
         * @param {Object} instance object to validate
         * @param {Object} schema schema object in JSONSchema format
         * @param {boolean} resolved If false schema will be resolved by this method. If true
         *      this method will assume this schema has its references already resolved.
         * @param {boolean} hideError - (Defaults to false)Error will be ignored if true otherwise
         * an Error will be thrown.  Typically just used with unit tests.
         *
         * @return {Object} Results object containing a valid property and an array of errors.
         * @throws Error
         */
        this.validate = function (instance, schema, resolved, hideError) { return {valid: true}; };
    };
});