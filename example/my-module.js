var log = require('..')(module);

log.debug("YAY");
log.start('foo');
setTimeout(function() {
  log.debug(log.stop_ms('foo'))
}, 1000);
