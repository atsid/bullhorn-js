define(function () {

    "use strict";

    return {
        "schemaId": "TestData/TestChannel",
        "description": "Simple test schema",
        "type": "object",
        "properties": {
            "data": {
                "type": "string",
                "description": "Source",
                "required": true
            }
        }
    };
});