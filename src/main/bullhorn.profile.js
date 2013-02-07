var profile = (function () {
    var copyOnly = function (filename, mid) {
            var list = {
                "bullhorn-js/bullhorn.profile": true,
                "bullhorn-js/package.json": true
            };
            return list.hasOwnProperty(mid);
        };
 
    return {
        resourceTags: {
            copyOnly: function (filename, mid) {
                return copyOnly(filename, mid);
            }
        }
    };
}());
