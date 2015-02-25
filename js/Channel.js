/**
 * Channel interface
 * This interface describes the methods that are/must be implemented on a channel returned by ChannelFactory.
 */
define(function () {

    "use strict";

    return function () {

        /**
         * Recreates a new instance of this channel with the specified publish/subscribe context.
         * @param context
         */
        this.recreate = function (context) {throw new Error("Channel.recreate Not Implemented"); };

        /**
         * Publish the given message on this channel.
         * @param message - message to publish
         * @param callback - optional callback when publish is complete.
         */
        this.publish = function (message, callback) { throw new Error("Channel.publish Not Implemented"); };

        /**
         * Subscribe to messages on this channel that pass the optional filter predicated. Include messages
         * published by this channel instance if captureSelfPublished is defined.
         * @param receiveCallback - called when applicable messages are received on this channel.
         * @param filterPredicate - a function returning a boolean used to filter message based on content.
         * @param captureSelfPublished - a boolean indicating that self-published messages should also trigger
         * receiveCallback if they pass the filter predicate.
         *
         * @return {Object} a subscription handle encapsulation object that allows you to unsubscribe the single instance using .unsubscribe();
         */
        this.subscribe = function (receiveCallback, filterPredicate, captureSelfPublished) { throw new Error("Channel.subscribe Not Implemented"); };

        /**
         * Identical to subscribe but immediately unsubscribes once the first message is handled.
         * @param receiveCallback - called when applicable messages are received on this channel.
         * @param filterPredicate - a function returning a boolean used to filter message based on content.
         * @param captureSelfPublished - a boolean indicating that self-published messages should also trigger
         * receiveCallback if they pass the filter predicate.
         */
        this.subscribeOnce = function (receiveCallback, filterPredicate, captureSelfPublished) { throw new Error("Channel.subscribeOnce Not Implemented"); };

        /**
         * Unsubscribe from this channel.
         *
         * If no handle is supplied, all subscriptions from this channel instance will be unsubscribed.
         * Otherwise, just the single instance of the handle will be.
         */
        this.unsubscribe = function (handle) { throw new Error("Channel.unsubscribe Not Implemented"); };

    };
});