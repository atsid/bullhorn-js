define([
    "bullhorn/CoreApi",
    "./MockChannel"
], function (
    CoreApi,
    MockChannel
) {

    "use strict";

    describe("Test CoreApi methods directly", function () {

        var messageReceived1 = false,
            messageReceived2 = false,
            publishCompleted = false,
            receiveFunc1 = function () { messageReceived1 = true; },
            receiveFunc2 = function () { messageReceived2 = true; },
            completionFunc = function () { publishCompleted = true; },
            testScope1 = {scope: 1},
            testScope2 = {scope: 2};

        beforeEach(function () {
            messageReceived1 = false;
            messageReceived2 = false;
            publishCompleted = false;
        });

        describe("Basic publish/subscribe cycle", function () {

            var bh = new CoreApi();

            it("subscribe does not throw", function () {
                assert.doesNotThrow(function () { bh.subscribe("testbus", "test", receiveFunc1, testScope1); });
            });

            it("publish with the same scope does not receive message", function () {
                bh.publish("testbus", "test", {'name': 'test message'}, completionFunc, testScope1);
                assert.isFalse(messageReceived1, "Should not have received the message.");
                assert.isTrue(publishCompleted, "Completion function not called");

            });

            it("publish with different scope does receive the message", function () {
                bh.publish("testbus", "test", {'name': 'test message'}, completionFunc, testScope2);
                assert.isTrue(messageReceived1, "Should have received the message.");
                assert.isTrue(publishCompleted, "Completion function not called.");
            });

            it("unsubscribe does not throw", function () {
                assert.doesNotThrow(function () { bh.unsubscribe("testbus", "test", testScope1); });
            });

            it("publish after unsubscribe does not receive the message", function () {
                bh.publish("testbus", "test", {'name': 'test message'}, completionFunc, testScope2);
                assert.isFalse(messageReceived1, "Should not have receive the message.");
                assert.isTrue(publishCompleted, "Should still get completion.");
            });


        });

        describe("Filter messages", function () {

            var bh = new CoreApi(),
                predicate = function (message) { return (message.include === true); };

            it("subscribing with predicate does not throw", function () {
                assert.doesNotThrow(function () { bh.subscribe("testbus", "test", receiveFunc1, testScope1, predicate); });
            });

            it("publish with predicate match does receive message", function () {
                bh.publish("testbus", "test", {'name': 'test message', 'include': true });
                assert.isTrue(messageReceived1);
            });

            it("publish with predicate non-match does not receive message", function () {
                bh.publish("testbus", "test", {'name': 'test message', 'include': false });
                assert.isFalse(messageReceived1);
            });

            it("unsubscribe with predicate does not throw", function () {
                assert.doesNotThrow(function () { bh.unsubscribe("testbus", "test", testScope1); });
            });

        });

        describe("Receive own messages", function () {

            var bh = new CoreApi();

            it("subscribing to yourself does not throw", function () {
                assert.doesNotThrow(function () { bh.subscribe("testbus", "test", receiveFunc1, testScope1, null, true); });
            });

            it("publish to yourself does receive message", function () {
                bh.publish("testbus", "test", {'name': 'test message'}, null, testScope1);
                assert.isTrue(messageReceived1);
            });

            it("unsubscribe from self-publication does not throw", function () {
                assert.doesNotThrow(function () { bh.unsubscribe("testbus", "test", testScope1); });
            });

        });

        describe("Subscribe once", function () {

            var bh = new CoreApi();

            it("subscribing once does not throw", function () {
                assert.doesNotThrow(function () { bh.subscribe("testbus", "test", receiveFunc1, testScope1, null, false, true); });
            });

            it("publish first message does receive message", function () {
                bh.publish("testbus", "test", {'name': 'test message'});
                assert.isTrue(messageReceived1);
            });

            it("publish second message does not receive message", function () {
                bh.publish("testbus", "test", {'name': 'test message'});
                assert.isFalse(messageReceived1);
            });

            it("unsubscribe from subscribe-once does not throw", function () {
                assert.doesNotThrow(function () { bh.unsubscribe("testbus", "test", testScope1); });
            });

        });

        describe("Cross-bus and cross-channel traffic", function () {

            var bh = new CoreApi();

            it("multiple subscribes on different buses with the same channel and scope do not throw", function () {
                assert.doesNotThrow(function () { bh.subscribe("testbus1", "test", receiveFunc1, testScope1); });
                assert.doesNotThrow(function () { bh.subscribe("testbus2", "test", receiveFunc2, testScope1); });
            });

            it("publish in first bus does not trigger callback on second bus", function () {
                bh.publish("testbus1", "test", {'name': 'test message'});
                assert.isTrue(messageReceived1);
                assert.isFalse(messageReceived2);
            });

            it("publish in second bus does not trigger callback on first bus", function () {
                bh.publish("testbus2", "test", {'name': 'test message'});
                assert.isFalse(messageReceived1);
                assert.isTrue(messageReceived2);
            });

            it("unsubscribe from both buses do not throw", function () {
                assert.doesNotThrow(function () { bh.unsubscribe("testbus1", "test", testScope1); });
                assert.doesNotThrow(function () { bh.unsubscribe("testbus2", "test", testScope1); });
            });

        });

        describe("Multiple subscribers on one channel", function () {

            var bh = new CoreApi();

            it("multiple subscribers on the same channel do not throw", function () {
                assert.doesNotThrow(function () { bh.subscribe("testbus", "test", receiveFunc1, testScope1); });
                assert.doesNotThrow(function () { bh.subscribe("testbus", "test", receiveFunc2, testScope2); });
            });

            it("publish triggers callback on both scopes", function () {
                bh.publish("testbus", "test", {'name': 'test message'});
                assert.isTrue(messageReceived1);
                assert.isTrue(messageReceived2);
            });

            it("unsubscribe from both scopes does not throw", function () {
                assert.doesNotThrow(function () { bh.unsubscribe("testbus", "test", testScope1); });
                assert.doesNotThrow(function () { bh.unsubscribe("testbus", "test", testScope2); });
            });

        });

        //TODO: this should allow one unsubscription to leave the second. there is no assert for that.
        describe("Multiple callbacks for one subscriber on the same channel", function () {

            var bh = new CoreApi();

            it("multiple subscriptions for a single scope do not throw", function () {
                assert.doesNotThrow(function () { bh.subscribe("testbus", "test", receiveFunc1, testScope1); });
                assert.doesNotThrow(function () { bh.subscribe("testbus", "test", receiveFunc2, testScope1); });
            });

            it("publish triggers callback on both subscriptions", function () {
                bh.publish("testbus", "test", {'name': 'test message'});
                assert.isTrue(messageReceived1);
                assert.isTrue(messageReceived2);
            });

            it("unsubscribe from both subscriptions does not throw", function () {
                assert.doesNotThrow(function () { bh.unsubscribe("testbus", "test", testScope1); });
                assert.doesNotThrow(function () { bh.unsubscribe("testbus", "test", testScope2); });
            });

        });

        describe("Publish with no subscribers on bus or channel", function () {

            var bh = new CoreApi();

            it("message is not received by any callbacks", function () {
                bh.publish("nosubcribers", "subscribed", {'name': 'test message'});
                assert.isFalse(messageReceived1);
                assert.isFalse(messageReceived2);
            });

        });

        describe("Unsubscribe without subscribing", function () {

            var bh = new CoreApi();

            it("unsubscribe from non-subscriptions does not throw", function () {
                assert.doesNotThrow(function () { bh.unsubscribe("testbus", "subscribed", testScope1); });
                assert.doesNotThrow(function () { bh.unsubscribe("subscribed", "test", testScope1); });
            });

        });

        describe("Subscribe once with other subscriptions", function () {

            var bh = new CoreApi(),
                firstCalled = false,
                lastCalled = false,
                subscribeOnceCalled = false,
                firstFunc = function (message) { firstCalled = true; },
                lastFunc = function (message) { lastCalled = true; },
                subscribeOnceFunc = function (message) { subscribeOnceCalled = true; },
                firstScope = {scope: 1},
                lastScope = {scope: 3},
                subscribeOnceScope = {scope: 2};

            bh.subscribe("testbus", "TestData/MockChannel", firstFunc, firstScope);
            bh.subscribe("testbus", "TestData/MockChannel", subscribeOnceFunc, subscribeOnceScope, null, null, true, true);
            bh.subscribe("testbus", "TestData/MockChannel", lastFunc, lastScope);

            it("all subscribers should still receive message after a subscribe-once has fired", function () {
                bh.publish("testbus", "TestData/MockChannel", {'data': 'test message'});
                assert.isTrue(firstCalled);
                assert.isTrue(subscribeOnceCalled);
                assert.isTrue(lastCalled);
            });

        });

        describe("Validation", function () {

            var bh = new CoreApi({resolve: function (name) {
                return MockChannel;
            }});

            it("validation if off by default", function () {
                assert.isFalse(bh.isValidating());
            });

            it("toggling validation on does not throw", function () {
                assert.doesNotThrow(function () { bh.validate(true); });
            });

            it("validation has been turned on", function () {
                assert.isTrue(bh.isValidating());
            });

            it("subscribing with validation on does not throw", function () {
                assert.doesNotThrow(function () { bh.subscribe("testbus", "TestData/MockChannel", receiveFunc1, testScope1); });
            });

            it("publish with valid message does not throw", function () {
                assert.doesNotThrow(function () { bh.publish("testbus", "TestData/MockChannel", {'data': 'test message'}, null, testScope1); });
            });

            it("publish with valid message results in callback execution", function () {
                bh.publish("testbus", "TestData/MockChannel", {'data': 'test message'}, null, testScope1);
                assert.isTrue(messageReceived1);
            });

            it("publish with invalid message does throw", function () {
                assert.throws(function () { bh.publish("testbus", "TestData/MockChannel", {'nodata': 'test message'}, null, testScope1); });
            });

            it("publish with invalid message does not result in callback execution", function () {
                try
                {
                    bh.publish("testbus", "TestData/MockChannel", {'nodata': 'test message'}, null, testScope1);
                } catch (e) {}
                assert.isFalse(messageReceived1);
            });

        });

    });

});