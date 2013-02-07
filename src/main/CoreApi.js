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

        this.validatingPublish = function (busName, channelName, message, completionCallback, callbackScope) {
            var channelSchema = this.config.resolve(channelName);
            logger.info("Validating message: " + message + " for channel: " + channelName);
            validator.validate(message, channelSchema, false);
            this.nonValidatingPublish(busName, channelName, message, completionCallback, callbackScope);
        };

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

        this.publish = this.nonValidatingPublish;

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

        this.unsubscribe = function (busName, channelName, scope) {
            logger.info("Unsubscribing the object with scope: " + scope + " from channel: " + channelName + " on bus: " + busName);
            registry.unsubscribe(busName, channelName, scope);
        };

        this.isValidating = function () {
            return this.publish === this.validatingPublish;
        };

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