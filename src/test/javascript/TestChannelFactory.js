require([
    "bullhorn/ChannelFactory"
], function (
    Factory
) {
    
    var b;
    b = new TestCase("TestChannelFactory", {
        
        setUp: function () {
            this.resolver = function (channel) {
                var ret;
                require(["TestData/" + channel], function (Obj) {
                    ret = Obj;
                });
                return ret;
            };
        },

        // test default basic publish,subscribe,unsubscribe on a given a channel.
        testBasicSubscribePublishCycle: function () {
            var channelfactory = new Factory({resolver: this.resolver}),
                differentScope = {'different': 'scope'},
                channel = channelfactory.get("TestChannel", this),
                channelNewScope = channelfactory.get("TestChannel", differentScope),
                callSucceeded = false,
                receiveFunc = function (message) { callSucceeded = true; },
                message = {data: 'test'};

            // subscribe without specifying optional arguments.
            assertNoException("subcribe failed.", function () { channel.subscribe(receiveFunc); });

            // publishing on the same channel we are subscribed to, should not deliver the message
            // by default.
            channel.publish(message);
            assertFalse("Should not have received the message.", callSucceeded);
            callSucceeded = false;

            // publishing on the same channel created with a different scope should deliver the message.
            channelNewScope.publish(message);
            assertTrue("Should have received the message.", callSucceeded);
            callSucceeded = false;

            assertNoException("unsubscribe failed.", function () { channel.unsubscribe(); });

            // publish another one shouldn't get it.
            channelNewScope.publish(message);
            assertFalse("Should not have receive the message.", callSucceeded);
        },

        // make sure messages are delivered to the publisher if that option is selected
        testCaptureSelfTraffic: function () {
            var channelfactory = new Factory({resolver: this.resolver}),
                channel = channelfactory.get("TestChannel", this),
                callSucceeded = false,
                receiveFunc = function (message) { callSucceeded = true; },
                message = {data: 'test'};

            // subscribe specifying captureSelfPublished
            assertNoException("subcribe failed.", function () { channel.subscribe(receiveFunc, null, true); });

            // publishing on the same channel we are subscribed to, the message should be delivered
            channel.publish(message);
            assertTrue("Should have received the message.", callSucceeded);
        },

        // make sure only messages passing a predicate are delivered if a predicate is provided.
        testFilteredMessages: function () {
            var channelfactory = new Factory({resolver: this.resolver}),
                channel = channelfactory.get("TestChannel", this),
                callSucceeded = false,
                receiveFunc = function (message) { callSucceeded = true; },
                predicate = function (message) { return (message.data === 'allowed'); },
                goodMessage = {data: 'allowed'},
                badMessage = {data: 'notAllowed'};

            // subscribe specifying captureSelfPublished (for simplicity) and a predicate.
            assertNoException("subcribe failed.", function () { channel.subscribe(receiveFunc, predicate, true); });

            // publishing the bad message, it shouldn't be delivered.
            channel.publish(badMessage);
            assertFalse("Should not have received the bad message.", callSucceeded);

            // publishing the good message, it should be delivered.
            channel.publish(goodMessage);
            assertTrue("Should have received the good message.", callSucceeded);
        },

        // test publish completion callback.
        testCompletionCallback: function () {
            var channelfactory = new Factory({resolver: this.resolver}),
                channel = channelfactory.get("TestChannel", this),
                callSucceeded = false,
                publishCompleted = false,
                receiveFunc = function (message) { callSucceeded = true; },
                completionFunc = function () { publishCompleted = true; },
                message = {data: 'test'};

            // subscribe specifying captureSelfPublished (for simplicity).
            assertNoException("subcribe failed.", function () { channel.subscribe(receiveFunc, null, true); });

            // publishing the message, it shouldn't be delivered and completion should be called.
            channel.publish(message, completionFunc);
            assertTrue("Should have received the message.", callSucceeded);
            assertTrue("Should have got completion call.", publishCompleted);
        },

        // make sure channels and buses are isolated.
        testCrossTraffic: function () {
            var channelfactory = new Factory({resolver: this.resolver}),
                differentScope = {'different': 'scope'},
                channel = channelfactory.get("TestChannel", this),
                channelNewBus = channelfactory.get("TestChannel", this, "anotherbus"),
                channelNewScope = channelfactory.get("TestChannel", differentScope),
                callSucceeded = false,
                callSucceeded2 = false,
                receiveFunc = function (message) { callSucceeded = true; },
                receiveFunc2 = function (message) { callSucceeded2 = true; },
                message = {data: 'test'};

            // subscribe to the default bus.
            assertNoException("subcribe failed.", function () { channel.subscribe(receiveFunc); });
            // subscribe to the different bus
            assertNoException("subcribe failed.", function () { channelNewBus.subscribe(receiveFunc2); });

            // publishing on the channel on the default bus created with a different scope should deliver
            // the message only on the default bus.
            channelNewScope.publish(message);
            assertTrue("Should have received the message.", callSucceeded);
            assertFalse("Should have received the message on a different bus.", callSucceeded2);
        },
        
        // Tests that the subscribeOnce function allows you to subscribe for only one message
        testSubscribeOnce: function () {
            var channelfactory = new Factory({resolver: this.resolver}),
                differentScope = {'different': 'scope'},
                channel = channelfactory.get("TestChannel", this),
                channelNewScope = channelfactory.get("TestChannel", differentScope),
                callSucceeded = false,
                receiveFunc = function (message) { callSucceeded = true; },
                message = {data: 'test'};
            
            // Make sure that you can subscribe without an exception
            assertNoException("subscribeOnce failed.", function () { channel.subscribeOnce(receiveFunc); });
            
            // Publish a message which should be received (still subscribed)
            channelNewScope.publish(message);
            assertTrue("Should receive the message.", callSucceeded);
            
            // Publish a message which should not be received (no longer subscribed)
            callSucceeded = false;
            channelNewScope.publish(message);
            assertFalse("Should not receive the message.", callSucceeded);
            
            // Make sure that you can unsubscribe before receiving a message 
            // after subscribeOnce has been called 
            assertNoException("unsubscribe failed.", function () { channel.subscribeOnce(receiveFunc); channel.unsubscribe(); });
        },

        //make sure we can pass messages back and forth from a pair of channels, where one was generated using the recreate method
        //we can assert on the callback scope to ensure the new context was set properly, and the values to ensure message passage
        testChannelRecreate: function () {
            var channelfactory = new Factory({resolver: this.resolver}),
                scope1 = {name: "scope1"},
                scope2 = {name: "scope2"},
                channel1 = channelfactory.get("TestChannel", scope1),
                channel2 = channel1.recreate(scope2),
                value;

            channel1.subscribe(function (msg) {
                jstestdriver.console.log("got message in [" + this.name + "]: " + JSON.stringify(msg));
                value = msg.value;
                assertEquals("scope1", this.name);
            });

            channel2.publish({"value": 24});

            assertEquals(24, value);

            channel2.subscribe(function (msg) {
                jstestdriver.console.log("got message in [" + this.name + "]: " + JSON.stringify(msg));
                value = msg.value;
                assertEquals("scope2", this.name);
            });

            channel1.publish({"value": 98});

            assertEquals(98, value);

        }

    });
});

