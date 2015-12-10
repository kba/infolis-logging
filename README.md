# infolis-logging

@infolis' best practices for logging with winston

Usage
-----

Without configuration:

```js

var log = require('infolis-logging')(module);

log.debug("Debugging is the fun part of coding", {"foo":'bar'});
```

This will log to
* STDOUT with color highlighting the log level and dumping any additional arguments using `util.dump` after breaking up circular references.
* a file `logs/#{__filename of the js module}.log` file

With configuration:

Create a module `log.js` (just a convention, can be anything):

```js
var InfolisLogging = require('infolis-logging');
module.exports = function MyLogging(callingModule) {
	return InfolisLogging(callingModule, {
	  level: 'silly',
	  filename: 'foo-bar'
	});
});
```

Then reference that module in your code instead of `infolis-logging`

```js
var log = require('./log')(module)
log.silly('This line of code rints out a line of log');
```

API
---

Since it's just a thin layer atop Winston, the winston API can be used.

In addition, timers can be set up with `logstart` and `logstop` to profile things.

