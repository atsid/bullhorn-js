# Topic-based Messaging Specification (bullhorn-js)

##Overview

A topic-based publish/subscribe mechanism allows agents in a system to send messages into a global bus for any other agents to consume. We generally refer to the individual topics as “channels”, using the analogy of “tuning in” to an information stream. Interested agents subscribe to a given channel by providing a callback function that will be executed when any message comes across the specified channel. In this manner, application functionality can be coordinated among agents with no direct dependency on one another, allowing for the construction of ad hoc workflows from independent units. The idea is to abstract unit dependencies by tying their functionality to topics of interest oriented around data rather than interaction specifics from a particular unit.
As an example, a specific agent in the system may provide functionality to read the content of text documents. A separate agent may be responsible for providing a list display of documents available. When a document is selected from the list display agent, this agent publishes a message into the global bus announcing that a document has been selected for viewing, and includes required information for other parties to respond (i.e., the document’s identifier). The text viewing agent would then respond to this message by executing any data requests required to obtain the text content it understands for this document, and then displaying it as designed. The text viewer would therefore be relieved of the responsibility for containing its own document-opening interface. This allows for a number of data viewers or display interfaces related to documents, which can operate purely based on data notifications about the current document.

##Channel Specifications
In order to maintain predictable and orderly use of the pubsub system, all channels must include an accompanying specification. This specification provides a namespaced channel name which must be unique within the system, as well as the details of what data properties any messages coming across the channel must have. Incoming messages can therefore be subject to validation and rejected if non-conformant, reducing the likelihood of communication errors (“misunderstandings”) within the system. Because this is a JavaScript application, messages must be either a JSON string, or a live object that is serializable to JSON. This makes the messaging system scalable to other uses, such as cross-window or client-server.
The specification for channels should be written in JSONSchema, a formal IETF specification (draft) for describing JSON objects using JSON itself (http://tools.ietf.org/html/draft-zyp-json-schema-03).

##Core API

At the core level, a pubsub system is quite simple. Only three functions are required in order to accomplish all major functionality: publish, subscribe, and unsubscribe. This represents the low-level API of the pubsub system – an object-oriented version will be described later that is preferred for general usage.
###Publish

```
publish(String channelName, Object|String message, [Function completionCallback], [Object callbackScope])
```
The publish function allows any unit to send a message into the bus. It takes two required and two optional parameters:
*	The name of the channel the message should be sent on
*	The message itself. As stated earlier, this should be either JSON or an object that is serializable to JSON.
*	(optional) A callback that will be invoked when message propagation to all recipients has completed. This callback mechanism allows publishers to inspect the message contents upon completion, or carry on some additional activity that is dependent on message completion.
*	(optional) A scope object indicating the scope within which the callback should be executed.

###Subscribe

```
subscribe(String channelName, Function callback, Object scope, [Boolean ignoreSelf])
```
The subscribe function allows any unit to indicate interest in messages on a specific channel. The subscribe function takes three required parameters and one optional:
*	The name of the channel
*	A callback function to execute when messages come across on it. The callback function should include one parameter, which is the message object to evaluate. Note that the callbacks are not expected to produce a return value, however, they can optionally return the Boolean value true to indicate that the message has been completely handled and propagation should halt. Note that this functionality (equivalent to the “continue processing” directive with Apache Commons Chains) should only be used in very special circumstances. Normally it is extremely dangerous for any given object to presume that processing should stop once they have received the message, however, there are cases where the nature of the processing produces a condition that should result in a halt to message continuation to other listeners.
*	A scope object indicating the scope within which the callback should be executed. This is required in order to allow for correct unsubscribes later.
*	(optional) A Boolean value indicating whether messages from the same scope object should result in callback invocation. In other words, often a unit needs to both publish and subscribe to the same channel – by default the listener callback will still be invoked when the object publishes on the channel. Passing “true” here will automatically filter so that objects never receive their own messages directly.

###Unsubscribe

```
unsubscribe(String channelName, Object scope)
```
The unsubscribe function allows any unit to unsubscribe from a channel, thereby releasing its interest. This is important to keeping channels and callbacks clear from over activity or potential errors when executing callbacks on destroyed objects. It takes two required parameters:
*	The name of the channel
*	The object which subscribed, so that the correct callback can be found and unregistered

##Object-Oriented API
While the Core API is fairly simple, in an object-oriented architecture it is desirable to approach most functionality from an object-oriented perspective. This makes the components more modular, abstracts low-level functionality, and allows for injection of alternate low-level providers in order to do testing. For messaging, a simple way to do this is to create a Channel object with appropriate methods for publishing and subscribing, along with a mechanism for obtaining instances of these channels that helps reduce boilerplate and enables dependency-free testing. We will obtain Channel instances using a factory, which allows for additional shortcuts and boilerplate reductions.

###ChannelFactory
The ChannelFactory is used for obtaining instances of a Channel. The factory should provide a simple method for obtaining new channels with minimal typing needed, which has the side benefit of allowing greater code minification.

####constructor
```
ChannelFactory(String channelNamespace)
```
The ChannelFactory will be a “single instance” object that is expected to be instantiated by the application using it, with a passed-in string indicating the fully-qualified namespace to use for looking up channel names (e.g., “PTO.schema.channels”). Access to the factory instance should be mapped to a convenient alias for the application (such as “PTO.channels.channelFactory” and/or simply the direct get method such as “PTO.channels.get”);

####get
```
get(String channelName, Object scope, Boolean publishes)
```
The get method returns new Channel instance objects that are tied to both a specific channel and a specific unit. It takes two parameters:
* channelName is the name of the channel to operate on. This should allow for shortened references to channels, rather than fully-qualified (where possible). For example, in the PTO PE2E project, all channels are stored under the namespace “PTO.schema.channels.<ChannelName>”. The get method should not require the prefix namespaces, but simply <ChannelName>.
* scope is the object that will be publishing or subscribing on this channel. Lower-level pubsub methods that require a scope object will have this automatically passed on so it is not required each time.
At this time, each Channel instance is expected to be tied directly to an object based on the scope parameter. Therefore, Channel instance re-use or caching is not planned or necessary.

###Channel
The Channel object is the core element that any units will work with in order to send and receive messages into the pubsub system. The Channel object wraps calls to the pubsub system, with instances holding reference information such as the channel name and the scope it is tied to, allowing for significant boilerplate reduction when pubsub is used.
####constructor
```
Channel(ChannelFactory factory)
```
New channels should receive a reference to the factory that created them, in the event that they need to communicate with the factory for registration, lookups, or other communications that enable greater abstraction in the client API. Note that new Channels should never be instantiated directly by those who wish to publish or subscribe. This can be accomplished by not exposing a public constructor for Channels, rather, the ChannelFactory creates live objects with functions directly attached as needed. This makes the “Channel” object something like a private inlined class on the factory.

####publish
```
publish(String|Object message, [Function callback])
```
Publishes the specified message on the channel, to the global pubsub bus. An optional callback can be passed that is executed when the message has reached all subscribers. The scope used for retrieving the instance will be used for callback execution.
####subscribe
```
subscribe(Function callback, [Boolean ignoreSelf])
```
Subscribes a callback to the channel object. The scope used for retrieving the instance will be used for callback execution. Optional Boolean to ignore messages published by source agent if also subscribed to.
####unsubscribe
```
unsubscribe()
```
Unsubscribes this channel instance and the callbacks associated with it. The scope used for retrieving the instance will be used for unsubscribing.

##OOP API Code Examples
The following code examples illustrate instantiating a ChannelFactory and mapping it to project-specific aliases, as well as retrieving Channel instances and working with them from a gadget. The project example provided is PTO.
```
//instantiate factory and map to aliases for access
//this would happen in some app setup/bootstrap area
(function () {
	var factory = new ChannelFactory(“PTO.schema.channels”);
	PTO.channels.channelFactory = factory;
PTO.channels.get = factory.get;
}());
//create new channels for publish/subscribe
function setupChannels() {
	var documentClosed = PTO.channels.get(“DocumentClosed”, this);
	documentClosed.subscribe(this.handleDocumentClosed);

	var documentOpened = PTO.channels.get(“DocumentOpened”, this);
	documentOpened.publish({documentId: 1});

	//later…
documentClosed.unsubscribe();
}
```
