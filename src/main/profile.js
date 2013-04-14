var profile = (function () {
    var copyOnly = function (filename, mid) {
            var list = {
                "bullhorn-js/profile.js": true,
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
