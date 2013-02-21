/**
 * @class CoreApi
 * The core api module for bullhorn.
 * It supplies the basic methods upon which the object-oriented implementation is based
 * and can be used independently of it.
 */
define([
    "./Logger",
    "./Validator"
], function (
    Logger,
    Validator
) {

    var logger = new Logger("info"),
        validator = new Validator();

    return function (config) {

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

            setCallbacks: function (bus, channel, callbacks) {
                this.getMessageBus(bus)[channel] = callbacks;
            },

            getCallbacks: function (bus, channel) {
                var callbacks = this.getMessageBus(bus)[channel];
                if (!callbacks) {
                    callbacks = [];
                    this.setCallbacks(bus, channel, callbacks);
                }
                return callbacks;
            },

            cropCallbacks: function (bus, channel, predicate) {
                var callbacks = this.getCallbacks(bus, channel);
                callbacks = callbacks.filter(function (item, index, list) {
                    return predicate(item);
                });
                this.setCallbacks(bus, channel, callbacks);
            },

            unsubscribe: function (busName, channelName, scope) {
                this.cropCallbacks(busName, channelName, function (callback) {
                    return callback.cs !== scope;
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
            logger.info("Validating message: " + message + " for channel: " + channelName);
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
            var callbacks = registry.getCallbacks(busName, channelName);

            callbacks.some(function (callback, index, list) {
                var relevent = true, ret;
                logger.info("Checking message: " + message + " for callback with scope: " + callback.cs + "...");
                if (typeof (callback.fp) === 'function') {
                    relevent = callback.fp.call(callback.cs, message);
                }
                if (relevent && (callback.cs !== callbackScope || callback.csp === true)) {
                    logger.info("Message passed filter and scope checks. Publishing now...");
                    ret = callback.fn.call(callback.cs, message);
                    if (typeof (ret) !== 'boolean') {
                        ret = false;
                    }
                    if (callback.uah === true) {
                        logger.info("unsubscribeAfterHandle was true so unsubscribing now...");
                        registry.unsubscribe(busName, channelName, callback.cs);
                    }
                    return ret;
                }
            });

            if (typeof (completionCallback) === 'function') {
                logger.info("Calling completionCallback now...");
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
         * "captureSelfPublished" is specified include message traffic published by "callbackScope". If "unsubscribeAfterHandle" is
         * specified unsubscribe "callbackScope" after the first published message received.
         * @param busName - the name of bus a particular channel is on. Used to isolate message traffic.
         * @param channelName - the name of the channel to subscribe to.
         * @param receiveCallback - the callback to invoke when a relevant message is recieved.
         * @param callBackScope - the scope to use when invoking the callback.
         * @param filterPredicate - a boolean returning function that can be used to filter messages based on content.
         * @param captureSelfPublished - a boolean to indicate that self-published message should trigger.
         * @param unsubscribeAfterHandle - a boolean indicating that callBackScope should be unsubscribed after first handled message.
         */
        this.subscribe = function (busName, channelName, receiveCallback, callBackScope, filterPredicate, captureSelfPublished, unsubscribeAfterHandle) {

            var callbacks = registry.getCallbacks(busName, channelName);
            logger.info("Subscribing a new function to channel: " + channelName + " on bus: " + busName);
            callbacks.push({
                fn: receiveCallback,
                fp: filterPredicate,
                cs: callBackScope,
                csp: captureSelfPublished,
                uah: unsubscribeAfterHandle
            });
        };

        /**
         * Remove all subscriptions for the given scope.
         * @param busName - busName to operate on.
         * @param channelName - channelName to operate on.
         * @param scope - scope being unsubscribed.
         */
        this.unsubscribe = function (busName, channelName, scope) {
            logger.info("Unsubscribing the object with scope: " + scope + " from channel: " + channelName + " on bus: " + busName);
            registry.unsubscribe(busName, channelName, scope);
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
                logger.info("Turning schema validation on");
                this.publish = this.validatingPublish;
            } else {
                logger.info("Turning schema validation off");
                this.publish = this.nonValidatingPublish;
            }
        };

    };
});