/**
 * @class CoreApi
 * The core api module for bullhorn.
 * It supplies the basic methods upon which the object-oriented implementation is based
 * and can be used independently of it.
 */
define([
    "./log",
    "./Validator",
    "./uuid"
], function (
    log,
    Validator,
    uuid
) {

    "use strict";

    var validator = new Validator();

    return function (config) {

        config = config || {};

        /**
         * internal registry for holding subscriptions.
         * @type {Object}
         */
        var registry = {

            busHash: { },

            setMessageBus: function (bus, channels) {
                this.busHash[bus] = channels;
            },

            getMessageBus: function (bus) {
                var localBus = this.busHash[bus];
                if (!localBus) {
                    localBus = {};
                    this.setMessageBus(bus, localBus);
                }
                return localBus;
            },

            setHandlers: function (bus, channel, handlers) {
                this.getMessageBus(bus)[channel] = handlers;
            },

            getHandlers: function (bus, channel) {
                var handlers = this.getMessageBus(bus)[channel];
                if (!handlers) {
                    handlers = [];
                    this.setHandlers(bus, channel, handlers);
                }
                return handlers;
            },

            cropHandlers: function (bus, channel, predicate) {
                var handlers = this.getHandlers(bus, channel);
                handlers = handlers.filter(function (item) {
                    return predicate(item);
                });
                this.setHandlers(bus, channel, handlers);
            },

            unsubscribe: function (busName, channelName, scope, handle) {
                this.cropHandlers(busName, channelName, function (handler) {
                    if (handle) {
                        return handler.h !== handle;
                    } else {
                        return handler.cs !== scope;
                    }
                });
            }
        };

        this.config = config;

        /**
         * A validating form of the publish function that validates and then delegates to
         * the non-validating form.
         *
         * @param busName - the name of bus a particular channel is on. Used to isolate message traffic.
         * @param channelName - the name of the channel to publish to, when validating this is also the name of
         * the schema to validate the message against.
         * @param message - the message contents
         * @param completionCallback - optional function to call when finished publishing.
         * @param callbackScope - optional scope for the completionCallback param.
         */
        this.validatingPublish = function (busName, channelName, message, completionCallback, callbackScope) {
            var channelSchema = this.config.resolve(channelName);
            log.debug("Validating message for channel [" + channelName + "]", message);
            validator.validate(message, channelSchema, false);
            this.nonValidatingPublish(busName, channelName, message, completionCallback, callbackScope);
        };

        /**
         * Primary publishing method that publishes the "message" to the "channelName" on the "busName" and
         * calls the optional "completionCallback" in "callbackScope" when finished. Publishing a message fires
         * all callbacks subscribed to the message.
         * @param busName - the name of bus a particular channel is on. Used to isolate message traffic.
         * @param channelName - the name of the channel to publish to, when validating this is also the name of
         * the schema to validate the message against.
         * @param message - the message contents
         * @param completionCallback - optional function to call when finished publishing.
         * @param callbackScope - optional scope for the completionCallback param.
         */
        this.nonValidatingPublish = function (busName, channelName, message, completionCallback, callbackScope) {
            var handlers = registry.getHandlers(busName, channelName);
            handlers.some(function (handler) {
                var relevant = true, ret;
                log.debug("Checking message for handler in scope [" + handler.cs + "]");
                if (typeof (handler.fp) === 'function') {
                    relevant = handler.fp.call(handler.cs, message);
                }
                if (relevant && (handler.cs !== callbackScope || handler.csp === true)) {
                    log.debug("Message passed filter and scope checks. Publishing now to callback.", message);
                    ret = handler.fn.call(handler.cs, message);
                    if (typeof (ret) !== 'boolean') {
                        ret = false;
                    }
                    if (handler.uah === true) {
                        log.debug("unsubscribeAfterHandle was true so unsubscribing from scope [" + handler.cs + "] and id [" + handler.h + "]");
                        registry.unsubscribe(busName, channelName, handler.cs, handler.h);
                    }
                    return ret;
                }
            });

            if (typeof (completionCallback) === 'function') {
                log.debug("Completion callback present, calling now for message", message);
                completionCallback.call(callbackScope);
            }
        };

        /**
         * Agnostic publish method that can delegate to either a validating or non-validating publish depending
         * on the api is configured.
         * @param busName - the name of bus a particular channel is on. Used to isolate message traffic.
         * @param channelName - the name of the channel to publish to, when validating this is also the name of
         * the schema to validate the message against.
         * @param message - the message contents
         * @param completionCallback - optional function to call when finished publishing.
         * @param callbackScope - optional scope for the completionCallback param.
         */
        this.publish = this.nonValidatingPublish;

        /**
         * Subscribe a "callbackScope" to a "channelName" on a "busName" by having the "receiveCallback" called when a message is
         * published on "channelName" "busName" combination and the message passes the filterPredicate. If
         * "captureSelfPublished" is specified include message traffic published by "callbackScope". If "unsubscribeAfterHandled" is
         * specified unsubscribe "callbackScope" after the first published message received.
         * @param busName - the name of bus a particular channel is on. Used to isolate message traffic.
         * @param channelName - the name of the channel to subscribe to.
         * @param receiveCallback - the callback to invoke when a relevant message is recieved.
         * @param callBackScope - the scope to use when invoking the callback.
         * @param filterPredicate - a boolean returning function that can be used to filter messages based on content.
         * @param captureSelfPublished - a boolean to indicate that self-published message should trigger.
         * @param unsubscribeAfterHandled - a boolean indicating that callBackScope should be unsubscribed after first handled message.
         *
         * @return {String} - a unique uuid for the subscription, which can be used to unsubscribe later.
         */
        this.subscribe = function (busName, channelName, receiveCallback, callbackScope, filterPredicate, captureSelfPublished, unsubscribeAfterHandled) {

            var handle = uuid(),
                handlers = registry.getHandlers(busName, channelName);
            log.debug("Subscribing to channel [" + channelName + "] on bus [" + busName + "] with scope [" + callbackScope + "], subscription id: " + handle);
            handlers.push({
                fn: receiveCallback,
                fp: filterPredicate,
                cs: callbackScope,
                h: handle,
                csp: captureSelfPublished,
                uah: unsubscribeAfterHandled
            });

            return handle;
        };

        /**
         * Remove subscriptions for the given scope or handle.
         * @param busName - busName to operate on.
         * @param channelName - channelName to operate on.
         * @param scope - scope being unsubscribed.
         * @param handle - individual handle to unsubscribe instead of the entire scope.
         */
        this.unsubscribe = function (busName, channelName, scope, handle) {
            log.debug("Unsubscribing from channel [" + channelName + "] on bus [" + busName + "] with scope [" + scope + "], with id: " + handle);
            registry.unsubscribe(busName, channelName, scope, handle);
        };

        /**
         * Is this instance of the core api currently validating.
         * @return {Boolean}
         */
        this.isValidating = function () {
            return this.publish === this.validatingPublish;
        };

        /**
         * Set whether or not this core api instance should validate.
         * @param turnOn
         */
        this.validate = function (turnOn) {
            if (turnOn === true) {
                log.info("Turning schema validation on");
                this.publish = this.validatingPublish;
            } else {
                log.info("Turning schema validation off");
                this.publish = this.nonValidatingPublish;
            }
        };

        this.validate(config.validate);

    };
});