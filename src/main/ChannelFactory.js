/**
 * @class ChannelFactory
 * Object-Oriented api that supports easier creation of and operations on channels.
 */
define([
    "./Channel",
    "./CoreApi",
    "./uuid",
    "./log"
], function (
    Channel,
    CoreApi,
    uuid,
    log
) {

    "use strict";

    return function (config) {

        //the handle function encapsulates a single subscription, and can be used to unsubscribe
        function Handle(channel, handle) {
            this.unsubscribe = function () {
                channel.unsubscribe(handle);
            };
        }

        var resolvers = [config.resolver],
            setProps = function (myChannel, schema, scope, channelFactory, busName) {

                myChannel.handle = uuid();

                myChannel.schema = schema;

                myChannel.recreate = function (context) {
                    return channelFactory.get(myChannel.channelName, context, busName);
                };

                myChannel.publish = function (msg, callback) {
                    channelFactory.coreapi.publish(busName, myChannel.channelName, msg, callback, scope);
                };

                myChannel.unsubscribe = function (handle) {
                    //we expose this method publicly, but we only give access to the handle function itself
                    //so if the consumer uses this function directly, we need to re-call it via the handle in order to pass in the actual uuid
                    if (typeof handle === "object") {
                        handle.unsubscribe();
                    } else {
                        channelFactory.coreapi.unsubscribe(busName, myChannel.channelName, scope, handle);
                    }
                };

                myChannel.subscribe = function (callback, filterPredicate, captureSelfPublished) {
                    var handle = channelFactory.coreapi.subscribe(busName, myChannel.channelName, callback, scope, filterPredicate, captureSelfPublished);
                    return new Handle(myChannel, handle);
                };

                myChannel.subscribeOnce = function (callback, filterPredicate, captureSelfPublished) {
                    var handle = channelFactory.coreapi.subscribe(busName, myChannel.channelName, callback, scope, filterPredicate, captureSelfPublished, true);
                    return new Handle(myChannel, handle);
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
         * @type {CoreApi}
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
