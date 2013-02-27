define([
    "example/validate"
], function (
    validate
) {

    /**
     * @class Validator
     * Integrates Kris Zyp's reference validator.
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
        this.validate = function (instance, schema, resolved, hideError) {
            var ret = validate.validate(instance, schema);
            if (ret && !ret.valid) {
                throw Error("message failed validation.")
            }
            return true;
        };
    };
});