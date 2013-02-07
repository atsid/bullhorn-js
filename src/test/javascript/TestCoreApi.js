require(["bullhorn/CoreApi", "TestData/TestChannel"], function (CoreApi, TestChannel) {
    var b;
    b = new TestCase("TestCoreApi", {

        setUp: function () {
        },

        // Test that subscribe, publish, unsubscribe, works with defaulted optional arguments.
        testBasicSubscribePublishCycle: function () {
            var bh = new CoreApi(),
                callSucceeded = false,
                publishCompleted = false,
                receiveFunc = function (message) { callSucceeded = true; },
                completionFunc = function () { publishCompleted = true; },
                testScope = {scope: 1},
                differentScope = {'different': 'scope'};

            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "test", receiveFunc, testScope); });

            // publish with same scope, shouldn't receive message, should receive completion.
            bh.publish("testbus", "test", {'name': 'test message'}, completionFunc, testScope);
            assertFalse("Should not have received the message.", callSucceeded);
            assertTrue("Completion function not called", publishCompleted);
            callSucceeded = false;
            publishCompleted = false;

            // publish with a different scope (should receive message and completion).
            bh.publish("testbus", "test", {'name': 'test message'}, completionFunc, differentScope);
            assertTrue("Should have received the message.", callSucceeded);
            assertTrue("Completion function not called.", publishCompleted);
            callSucceeded = false;
            publishCompleted = false;

            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "test", testScope); });

            // publish another one shouldn't get it.
            bh.publish("testbus", "test", {'name': 'test message'}, completionFunc, differentScope);
            assertFalse("Should not have receive the message.", callSucceeded);
            assertTrue("Should still get completion.", publishCompleted);
        },

        // Test that messages are filtered by the predicate.
        testFilterMessage: function () {
            var bh = new CoreApi(),
                callSucceeded = false,
                receiveFunc = function (message) { callSucceeded = true; },
                predicate = function (message) { return message.include === true; },
                testScope = {scope: 1};

            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "test", receiveFunc, testScope, predicate); });

            // publish a message that matches
            bh.publish("testbus", "test", {'name': 'test message', 'include': true });
            assertTrue("Should have receive the message.", callSucceeded);
            callSucceeded = false;

            // publish a message that doesn't match.
            bh.publish("testbus", "test", {'name': 'test message', 'include': false });
            assertFalse("Should not have received the message.", callSucceeded);

            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "test", testScope); });
        },

        // Test that you can elect to get messages you send.
        testReceiveOwnMessage: function () {
            var bh = new CoreApi(),
                callSucceeded = false,
                receiveFunc = function (message) { callSucceeded = true; },
                testScope = {scope: 1};

            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "test", receiveFunc, testScope, null, true); });

            // publish a message
            bh.publish("testbus", "test", {'name': 'test message'}, null, testScope);
            assertTrue("Should have receive the message.", callSucceeded);

            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "test", testScope); });
        },

        // Test that you can subscribe for only one message.
        testSubscribeOnce: function () {
            var bh = new CoreApi(), callSucceeded = false,
                receiveFunc = function (message) { callSucceeded = true; },
                testScope = {scope: 1};

            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "test", receiveFunc, testScope, null, false, true); });

            // publish a message.
            bh.publish("testbus", "test", {'name': 'test message'});
            assertTrue("Should have receive the message.", callSucceeded);
            callSucceeded = false;

            // publish another one.
            bh.publish("testbus", "test", {'name': 'test message'});
            assertFalse("Should not have receive the message.", callSucceeded);

            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "test", testScope); });
        },

        // Test that you don't get cross bus traffic or cross channel traffic.
        testCrossTraffic: function () {
            var bh = new CoreApi(),
                callSucceeded1 = false,
                callSucceeded2 = false,
                receiveFunc1 = function (message) { callSucceeded1 = true; },
                receiveFunc2 = function (message) { callSucceeded2 = true; },
                testScope = {scope: 1};

            assertNoException("subscribe failed.", function () { bh.subscribe("testbus1", "test", receiveFunc1, testScope); });
            assertNoException("subscribe failed.", function () { bh.subscribe("testbus2", "test", receiveFunc2, testScope); });

            // publish a message on bus 1.
            bh.publish("testbus1", "test", {'name': 'test message'});
            assertTrue("Should have receive the message on bus 1.", callSucceeded1);
            assertFalse("Should not have receive the message on bus 2.", callSucceeded2);
            callSucceeded1 = false;
            callSucceeded2 = false;

            // publish a message on bus 2
            bh.publish("testbus2", "test", {'name': 'test message'});
            assertFalse("Should not have receive the message on bus 1.", callSucceeded1);
            assertTrue("Should have receive the message on bus 2.", callSucceeded2);

            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus1", "test", testScope); });
            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus2", "test", testScope); });
        },

        // Test publishing a message to multiple subscribers.
        testMultipleDifferentSubscribers: function () {
            var bh = new CoreApi(),
                callSucceeded1 = false,
                callSucceeded2 = false,
                receiveFunc1 = function (message) { callSucceeded1 = true; },
                receiveFunc2 = function (message) { callSucceeded2 = true; },
                testScope1 = {scope: 1},
                testScope2 = {scope: 2};

            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "test", receiveFunc1, testScope1); });
            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "test", receiveFunc2, testScope2); });

            // publish a message on bus.
            bh.publish("testbus", "test", {'name': 'test message'});
            assertTrue("Should have receive the message on subcription 1.", callSucceeded1);
            assertTrue("Should have receive the message on subscription 2.", callSucceeded2);

            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "test", testScope1); });
            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "test", testScope2); });
        },

        // Test publishing a message where the same subscriber is subscribed multiple times.
        testMultipleSubscriptionsSameSubscriber: function () {
            var bh = new CoreApi(),
                callSucceeded1 = false,
                callSucceeded2 = false,
                receiveFunc1 = function (message) { callSucceeded1 = true; },
                receiveFunc2 = function (message) { callSucceeded2 = true; },
                testScope1 = {scope: 1};

            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "test", receiveFunc1, testScope1); });
            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "test", receiveFunc2, testScope1); });

            // publish a message on a bus.
            bh.publish("testbus", "test", {'name': 'test message'});
            assertTrue("Should have receive the message on sub 1.", callSucceeded1);
            assertTrue("Should have receive the message on sub 2.", callSucceeded2);

            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "test", testScope1); });
            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "test", testScope1); });
        },

        // Test publishing to a bus and channel with no subscribers
        testNoSubscribers: function () {
            var bh = new CoreApi(),
                callSucceeded = false,
                receiveFunc =  function (message) { callSucceeded = true; },
                testScope = {scope: 1};

            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "subscribed", receiveFunc, testScope); });
            assertNoException("subscribe failed.", function () { bh.subscribe("subscribed", "test", receiveFunc, testScope); });

            // test no-subscribers on bus.
            bh.publish("nosubcribers", "subscribed", {'name': 'test message'});
            assertFalse("Should not have receive the message.", callSucceeded);

            // test no subscribers on channel
            bh.publish("nosubcribers", "subscribed", {'name': 'test message'});
            assertFalse("Should not have receive the message.", callSucceeded);

            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "subscribed", testScope); });
            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("subscribed", "test", testScope); });
        },

        // Test unsubscribing without subscribing.
        testUnSubscribeWithoutSubscribe: function () {
            var bh = new CoreApi(),
                testScope = {scope: 1};

            assertNoException("unsubscribe failed.", function () { bh.unsubscribe("testbus", "test", testScope); });
        },

        // Test validation
        testValidation: function () {
            var bh = new CoreApi({resolve: function (name) {
                    return TestChannel;
                }}),
                callSucceeded = false,
                receiveFunc = function (message) { callSucceeded = true; },
                testScope = {scope: 1},
                differentScope = {'different': 'scope'};

            bh.validate(true);

            assertNoException("subscribe failed.", function () { bh.subscribe("testbus", "TestData/TestChannel", receiveFunc, testScope); });

            // publish valid message shouldn't throw exception
            assertNoException("publish failed.", function () { bh.publish("testbus", "TestData/TestChannel", {'data': 'test message'}, null, differentScope); });
            assertTrue("Should have received the message.", callSucceeded);
            callSucceeded = false;

            // publish invalid message should throw exception
            assertException("subscribe failed.", function () { bh.publish("testbus", "TestData/TestChannel", {'nodata': 'test message'}, null, differentScope); });
            assertFalse("Should NOT have received the message.", callSucceeded);
            callSucceeded = false;
        },

        // Test subscribeOnce mixed with multiple other subscriptions
        testSubscribeOnceWithOtherSubscriptions: function () {
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

            bh.subscribe("testbus", "TestData/TestChannel", firstFunc, firstScope);
            bh.subscribe("testbus", "TestData/TestChannel", subscribeOnceFunc, subscribeOnceScope, null, null, true, true);
            bh.subscribe("testbus", "TestData/TestChannel", lastFunc, lastScope);

            // publish valid message shouldn't throw exception
            bh.publish("testbus", "TestData/TestChannel", {'data': 'test message'});
            assertTrue("First should have received the message.", firstCalled);
            assertTrue("SubscribeOnce should have received the message.", subscribeOnceCalled);
            assertTrue("Last should have received the message.", lastCalled);
        }
        
    });
});
