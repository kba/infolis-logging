'use strict';
var Winston = require('winston'),
    Chalk = require('chalk'),
    Util = require('util');

Winston.emitErrs = true;

function getLabel(callingModule) {
  var parts = callingModule.filename.split('/');
  return parts.pop();
};

function getDate() {
  var tzoffset = (new Date).getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzoffset).toISOString().substring(11, 23);
};

function getMeta(obj) {
  var msg;
  if (!obj || (!obj.name && Object.keys(obj).length === 0)) {
    return '';
  } else {
    msg = Util.inspect(obj, {
      colors: true
    });
    if (/\n/.test(msg)) {
      return ">\n" + msg.replace(/^/mg, "  ");
    }
    return msg;
  }
};

function getFormatter(callingModule) {
  return function(options) {
    var level = Winston.config.colorize(options.level, options.level.toUpperCase()),
        timestamp = Chalk.yellow(getDate()),
        label = Chalk.magenta(getLabel(callingModule)),
        meta = getMeta(options.meta),
        message = options.message;
    return timestamp + " [" + level + "] " + label + ": " + message + " " + meta;
  };
};

module.exports = function(callingModule, config) {
  config = (config || {})
  config.exitOnError = config.exitOnError || false;
  config.transports = config.transports || ['console'];
  config.console = config.console || {};
  config.console.level = config.console.level || 'silly';
  config.file = config.file || {};
  config.file.filename = config.file || 'logs/all-logs.log';
  var transports = [];
  for(var transport of config.transports) {
    if(transport === 'console') {
      transports.push(new Winston.transports.Console({
        level: 'debug',
        handleExceptions: false,
        json: false,
        colorize: true,
        formatter: getFormatter(callingModule)
      }));
    }
  }
  var logger = new Winston.Logger({
    "transports": transports,
    "exitOnError": config.exitOnError
  });
  return logger;
};
