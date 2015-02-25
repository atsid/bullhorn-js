define(function () {

    "use strict";

    return {
        "id": "test/MockChannel",
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