/**
 * @class ChannelFactory
 * Object-Oriented api that supports easier creation of and operations on channels.
 */
define([
    "./Channel",
    "./CoreApi",
    "./log"
], function (
    Channel,
    CoreApi,
    log
) {

    return function (config) {

        var resolvers = [config.resolver],
            setProps = function (myChannel, schema, scope, channelFactory, busName) {
                myChannel.schema = schema;

                myChannel.recreate = function (context) {
                    return channelFactory.get(myChannel.channelName, context, busName);
                };

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

        /**
         * Given a name of a schema iterate over the resolver array until you find a match.
         * @param name
         * @return {*}
         */
        this.resolveSchema = function (name) {
            var schema;
            resolvers.some(function (res) {
                schema = res(name);
                return schema;
            }, this);
            return schema;
        };

        /**
         * CoreApi instance used by this factory exposed.
         * @type {main.CoreApi}
         */
        this.coreapi = new CoreApi({resolve: this.resolveSchema});

        /**
         * Add a resolver method to the internal array used to resolve schemas.
         * @param newResolver - a function accepting (schemaName) that attempts to map that
         * name to a schema object.
         */
        this.addResolver = function (newResolver) {
            resolvers.push(newResolver);
        };

        /**
         * Retrieve a Channel object based on the passed name, scope and bus.
         * @param channelName - The name of the channel to retrieve.
         * @param scope - the scope identifying the subscriber and used as the callback
         * scope for subscriptions.
         * @param busName - the optional bus to associate the channel with.
         * @return {*}
         */
        this.get = function (channelName, scope, busName) {
            var schema,
                channel;
            if (typeof (busName) === 'undefined') {
                busName = 'global';
            }
            log.debug("Getting channel " + channelName + " on bus " + busName + " with scope " + scope);
            schema = this.resolveSchema(channelName);
            channel = new Channel();
            channel.channelName = channelName;
            setProps(channel, schema, scope, this, busName);
            return channel;
        };

        /**
         * Turn validation on or off for this factory, delegates to core api.
         * @param turnOn - boolean
         */
        this.validate = function (turnOn) {
            var pos = "off";
            if (turnOn) {
                pos = "on";
            }
            log.info("Turning validation " + pos);
            this.coreapi.validate(turnOn);
        };
    };
});
