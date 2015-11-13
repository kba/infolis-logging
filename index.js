'use strict';
var Winston = require('winston'),
    Chalk = require('chalk'),
    Cycle = require('cycle'),
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
  var msg = '';
  if (obj && typeof obj === 'object' && (obj.name || Object.keys(obj).length > 0)) {
    msg = Util.inspect(Cycle.decycle(obj), {
      colors: true
    });
    if (/\n/.test(msg)) {
      return ">\n" + msg.replace(/^/mg, "  ");
    }
  }
  return msg;
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
  config.file.filename = config.file.filename || 'logs/all-logs.log';
  var minLevel = 'debug';
  if (config.level) minLevel = config.level;
  if (process.env.LOGLEVEL) minLevel = process.env.LOGLEVEL;
  var transports = [];
  for(var transport of config.transports) {
    // TODO file
    if(transport === 'console') {
      transports.push(new Winston.transports.Console({
        level: minLevel,
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
  logger._timers = {}
  logger.start = function start(name) {
    if (logger._timers[name])
      throw new Error("Timer already started: '" + name + "'");
    logger._timers[name] = process.hrtime();
  }
  logger.stop = function end(name) {
    if (!logger._timers[name])
      throw new Error("Timer not started: '" + name + "'");
    var diff = process.hrtime(logger._timers[name]);
    delete logger._timers[name];
    return diff;
  }
  logger.stop_ms = function end(name) {
    var diff = logger.stop(name);
    return (diff[0] * 1000000000 + diff[1]) / 1000000
  }
  var originalLog = logger.log;
  logger.log = function() {
    var fwdArgs = [arguments[0]];
    var firstObjectArg = 2;
    if (typeof arguments[1] === 'string') {
      fwdArgs.push(arguments[1]);
    } else {
      firstObjectArg = 1;
    }
    for (var i = firstObjectArg ; i < arguments.length ; i++) {
      fwdArgs.push(Cycle.decycle(arguments[i]));
    }
    return originalLog.apply(logger, fwdArgs);
  }
  return logger;
};
