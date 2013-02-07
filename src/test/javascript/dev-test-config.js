(function () {
    require.config({
        baseUrl: "/test/src",
        paths: {
            bullhorn: "main",
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
