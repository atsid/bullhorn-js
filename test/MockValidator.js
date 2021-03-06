define(function () {

    "use strict";

    /**
     * @class Validator
     * Unit Test validator
     */
    return function () {
        this.validate = function (instance, schema, resolved, hideError) {
            if (instance.nodata) {
                throw new Error();
            }
            return {valid: true};
        };
    };
});