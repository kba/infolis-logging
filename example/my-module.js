var log = require('..')(module, {"transports": ['file']});

log.debug("YAY");
log.start('foo');
log.error("YAY");
log.error("YAY");
log.error("YAY");
log.error("YAY");
log.debug(log.stop_ms('foo'))
