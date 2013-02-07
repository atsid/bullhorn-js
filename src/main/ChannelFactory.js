define([
    "./Channel",
    "./CoreApi",
    "./Logger"
], function (
    Channel,
    CoreApi,
    OreLogger
) {

    var logger = new OreLogger("info");

    return function (config) {

        var resolvers = [config.resolver],
            setProps = function (myChannel, schema, scope, channelFactory, busName) {
                myChannel.schema = schema;

                myChannel.publish = function (msg, callback) {
                    channelFactory.coreapi.publish(busName, myChannel.channelName, msg, callback, scope);
                };

                myChannel.unsubscribe = function () {
                    channelFactory.coreapi.unsubscribe(busName, myChannel.channelName, scope);
                };

                myChannel.subscribe = function (callback, filterPredicate, captureSelfPublished) {
                    channelFactory.coreapi.subscribe(busName, myChannel.channelName, callback, scope, filterPredicate, captureSelfPublished);
                };

                myChannel.subscribeOnce = function (callback, filterPredicate, captureSelfPublished) {
                    channelFactory.coreapi.subscribe(busName, myChannel.channelName, callback, scope, filterPredicate, captureSelfPublished, true);
                };
            };

        this.resolveSchema = function (name) {
            var schema;
            resolvers.some(function (res) {
                schema = res(name);
                return schema;
            }, this);
            return schema;
        };

        this.coreapi = new CoreApi({resolve: this.resolveSchema});

        this.addResolver = function (newResolver) {
            resolvers.push(newResolver);
        };

        this.get = function (channelName, scope, busName) {
            var schema,
                channel;
            if (typeof (busName) === 'undefined') {
                busName = 'global';
            }
            logger.info("Getting channel " + channelName + " on bus " + busName + " with scope " + scope);
            schema = this.resolveSchema(channelName);
            channel = new Channel();
            channel.channelName = channelName;
            setProps(channel, schema, scope, this, busName);
            return channel;
        };

        this.validate = function (turnOn) {
            var pos = "off";
            if (turnOn) {
                pos = "on";
            }
            logger.info("Turning validation " + pos);
            this.coreapi.validate(turnOn);
        };
    };
});
