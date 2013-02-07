(function () {
    require.config({
        baseUrl: "/test/src",
        paths: {
            test: "test/javascript",
            TestData: "test/data"
        },
        map: {
            "*": {
                "bullhorn/Validator": "test/Validator"
            }
        }
    });
}());
