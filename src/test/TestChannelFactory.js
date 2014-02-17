define([
    "bullhorn/ChannelFactory",
    "./MockChannel"
], function (
    Factory,
    MockChannel
) {

    "use strict";

    describe("Test ChannelFactory, ensuring that it correctly wraps CoreApi methods", function () {

        var resolver = function () {
                return MockChannel;
            },
            callSucceeded = false,
            callSucceeded2 = false,
            receiveFunc = function () { callSucceeded = true; },
            receiveFunc2 = function () { callSucceeded2 = true; },
            testScope1 = {scope: 1, name: "scope1"},
            testScope2 = {scope: 2, name: "scope2"},
            message = {data: 'test'};

        beforeEach(function () {
            callSucceeded = false;
            callSucceeded2 = false;
        });

        describe("Basic subscribe/publish cycle", function () {

            var channelfactory = new Factory({resolver: resolver}),
                channel = channelfactory.get("MockChannel", testScope1),
                channelNewScope = channelfactory.get("MockChannel", testScope2);

            it("subscribe with defaults does not throw", function () {
                assert.doesNotThrow(function () { channel.subscribe(receiveFunc); });
            });

            it("publish on the same channel we are subscribed to does not deliver message by default", function () {
                channel.publish(message);
                assert.isFalse(callSucceeded);
            });

            it("publish on channel with a different scope does execute callback", function () {
                channelNewScope.publish(message);
                assert.isTrue(callSucceeded);
            });

            it("unsubscribe does not throw", function () {
                assert.doesNotThrow(function () {channel.unsubscribe(); });
            });

            it("publishing after unsubscribe does not execute callback", function () {
                channelNewScope.publish(message);
                assert.isFalse(callSucceeded);
            });

        });

        describe("Capture self-published messages", function () {

            var channelfactory = new Factory({resolver: resolver}),
                channel = channelfactory.get("MockChannel", testScope1);

            it("subscribe with self-capture does not throw", function () {
                assert.doesNotThrow(function () { channel.subscribe(receiveFunc, null, true); });
            });

            it("publish on same channel executes callback", function () {
                channel.publish(message);
                assert.isTrue(callSucceeded);
            });

        });

        describe("Filtered messages", function () {

            var channelfactory = new Factory({resolver: resolver}),
                channel = channelfactory.get("MockChannel", testScope1),
                predicate = function (message) { return (message.data === 'allowed'); },
                goodMessage = {data: 'allowed'},
                badMessage = {data: 'notAllowed'};

            it("subscribe with predicate and self-capture does not throw", function () {
                assert.doesNotThrow(function () { channel.subscribe(receiveFunc, predicate, true); });
            });

            it("non-matching message is not delivered", function () {
                channel.publish(badMessage);
                assert.isFalse(callSucceeded);
            });

            it("matching message is delivered", function () {
                channel.publish(goodMessage);
                assert.isTrue(callSucceeded);
            });

        });

        describe("Completion callback", function () {
            var channelfactory = new Factory({resolver: resolver}),
                channel = channelfactory.get("MockChannel", testScope1),
                publishCompleted = false,
                completionFunc = function () { publishCompleted = true; };

            it("subscribe to default bus does not throw", function () {
                assert.doesNotThrow(function () { channel.subscribe(receiveFunc, null, true); });
            });

            it("publishing message results in callback and completion callback", function () {
                channel.publish(message, completionFunc);
                assert.isTrue(callSucceeded);
                assert.isTrue(publishCompleted);
            });

        });

        describe("Cross-traffic", function () {
            var channelfactory = new Factory({resolver: resolver}),
                channel = channelfactory.get("MockChannel", testScope1),
                channelNewBus = channelfactory.get("MockChannel", testScope1, "anotherbus"),
                channelNewScope = channelfactory.get("MockChannel", testScope2);

            it("subscribe to default bus does not throw", function () {
                assert.doesNotThrow(function () { channel.subscribe(receiveFunc); });
            });

            it("subscribe to a different bus does not throw", function () {
                assert.doesNotThrow(function () { channelNewBus.subscribe(receiveFunc2); });
            });

            it("publishing on default bus only delivers to callback on that bus, and not on second bus", function () {
                channelNewScope.publish(message);
                assert.isTrue(callSucceeded);
                assert.isFalse(callSucceeded2);
            });

        });

        describe("Subscribe-once", function () {

            var channelfactory = new Factory({resolver: resolver}),
                channel = channelfactory.get("MockChannel", testScope1),
                channelNewScope = channelfactory.get("MockChannel", testScope2);

            it("subscribe-once does not throw exception", function () {
                assert.doesNotThrow(function () { channel.subscribeOnce(receiveFunc); });
            });

            it("first publish on subscribe-once is received", function () {
                channelNewScope.publish(message);
                assert.isTrue(callSucceeded);
            });

            it("second publish in subscribe-once is not received", function () {
                channelNewScope.publish(message);
                assert.isFalse(callSucceeded);
            });

            it("unsubscribe from subscribe-once does not throw", function () {
                assert.doesNotThrow(function () { channel.subscribeOnce(receiveFunc); channel.unsubscribe(); });
            });

        });

        describe("Subscribe-once with multiple handles", function () {
            var channelfactory = new Factory({resolver: resolver}),
                channel = channelfactory.get("MockChannel", testScope1),
                handle1, handle2;

            it("subscribe-once does not throw exception", function () {
                assert.doesNotThrow(function () { handle1 = channel.subscribe(receiveFunc, null, true); });
                assert.doesNotThrow(function () { handle2 = channel.subscribe(receiveFunc2, null, true); });
            });

            it("first publish results in both callbacks executing", function () {
                channel.publish(message);
                assert.isTrue(callSucceeded);
                assert.isTrue(callSucceeded2);
            });

            it("unsubscribing one instance does not throw", function () {
                channel.unsubscribe(handle1);
            });

            it("second publish only executes one remaining callback", function () {
                channel.publish(message);
                assert.isFalse(callSucceeded);
                assert.isTrue(callSucceeded2);
            });

            it("unsubscribe with handle directly does not throw", function () {
                handle2.unsubscribe();
            });

            it("final publish does not execute any callbacks", function () {
                channel.publish(message);
                assert.isFalse(callSucceeded);
                assert.isFalse(callSucceeded2);
            });

        });

        describe("Unsubscribe with handle", function () {

        });

        describe("Channel re-creation", function () {
            var channelfactory = new Factory({resolver: resolver}),
                channel = channelfactory.get("MockChannel", testScope1),
                channelRecreated = channel.recreate(testScope2),
                value;

            it("publish from recreated channel executes original callback", function () {
                channel.subscribe(function (msg) {
                    value = msg.value;
                    assert.equal("scope1", this.name);
                });

                channelRecreated.publish({"value": 24});

                assert.equal(24, value);
            });

            it("publish on original channel executes on recreated channel callback", function () {
                channelRecreated.subscribe(function (msg) {
                    value = msg.value;
                    assert.equal("scope2", this.name);
                });

                channel.publish({"value": 98});

                assert.equal(98, value);
            });

        });

    });

});