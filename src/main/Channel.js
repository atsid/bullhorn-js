/**
 * Channel interface
 * This interface describes the methods that are/must be implemented on a channel returned by ChannelFactory.
 */
define([
], function (
) {

    return function () {

        this.publish = function (message, callback) { throw new Error("Not Implemented"); };

        this.subscribe = function (receiveCallback, filterPredicate, captureSelfPublished) { throw new Error("Not Implemented"); };

        this.subscribeOnce = function (receiveCallback, filterPredicate, captureSelfPublished) { throw new Error("Not Implemented"); };

        this.unsubscribe = function () { throw new Error("Not Implemented"); };

    };
});