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

        config = config || {};

        //the handle function encapsulates a single subscription, and can be used to unsubscribe
        function Handle(channel, handle) {
            this.unsubscribe = function () {
                channel.unsubscribe(handle);
            };
        }

        var setProps = function (myChannel, schema, scope, channelFactory, busName) {

            myChannel.handle = uuid();

            myChannel.schema = schema;

            myChannel.channelName = schema.id;

            myChannel.recreate = function (context) {
                return channelFactory.get(schema, context, busName);
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
        },
        //setup the resolvers with (1) a default that returns schema objects directly (first check),
        //and (2) any configured resolver that does other lookup such as by name
        resolvers = [function (schema) {
            if (typeof schema === "object") {
                return schema;
            }
        }];

        if (config.resolver) {
            resolvers.push(config.resolver);
        }

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
            
          //The case we don't want to lookup and utilize a schema
            //*
            if (schema === undefined) {
                return { "id": "default/DefaultChannel" };
            }
            //*/
            return schema;
        };

        /**
         * CoreApi instance used by this factory exposed.
         * @type {CoreApi}
         */
        this.coreapi = new CoreApi({resolve: this.resolveSchema, validate: config.validate});

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
         * @param channelOrName - Either a direct channel schema instance, or a path to one that can be used to look it up with the resolver function.
         * @param scope - the scope identifying the subscriber and used as the callback
         * scope for subscriptions.
         * @param busName - the optional bus to associate the channel with.
         * @return {*}
         */
        this.get = function (channelOrName, scope, busName) {
            var schema,
                channel;

            if (typeof (busName) === 'undefined') {
                busName = 'global';
            }

            schema = this.resolveSchema(channelOrName);

            log.debug("Getting channel " + schema.id + " on bus " + busName + " with scope " + scope);

            channel = new Channel();
            setProps(channel, schema, scope, this, busName);
            return channel;
        };
        

        /**
         * Turn validation on or off for this factory, delegates to core api.
         * @param turnOn - boolean
         */
        this.validate = function (turnOn) {
            log.info("Turning validation on: " + turnOn);
            this.coreapi.validate(turnOn);
        };
    };
});
