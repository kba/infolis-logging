var log = require('../lib/logging')(module, {
  "transports": ['file']
});
var silentLog = require('../lib/logging')(module, {
  "transports": ['file'],
  "level": "error"
});

log.debug("YAY");
log.start('foo');
log.error("YAY");
log.error("YAY");
log.error("YAY");
log.error("YAY");
log.debug(log.stop_ms('foo'))
