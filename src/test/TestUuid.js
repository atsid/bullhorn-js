define(["bullhorn/uuid"], function (uuid) {

    "use strict";

    describe("Test UUID generator function", function () {

        it("generating 100000 UUIDs rapidly does not result in a duplicate", function () {
            var x, id, hash = {};
            for (x = 0; x < 100000; x += 1) {
                id = uuid();
                if (hash[id]) {
                    assert.fail();
                } else {
                    hash[id] = true;
                }
            }
        });

    });

});