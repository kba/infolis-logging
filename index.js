'use strict';
var Winston = require('winston'),
    Chalk   = require('chalk'),
    Cycle   = require('cycle'),
    Util    = require('util'),
    MkdirP  = require('mkdirp');

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
  config.file = config.file || {};
  config.file.logdir = config.file.logdir || './logs';
  config.file.filename = config.file.filename || getLabel(callingModule) + ".log";
  var minLevel = 'debug';
  if (config.level) minLevel = config.level;
  if (process.env.LOGLEVEL) minLevel = process.env.LOGLEVEL;
  var transports = [];
  for(var transport of config.transports) {
    if(transport === 'console') {
      transports.push(new Winston.transports.Console({
        level: minLevel,
        json: false,
        colorize: true,
        formatter: getFormatter(callingModule)
      }));
    } else if(transport === 'file') {
      MkdirP.sync(config.file.logdir);
      transports.push(new Winston.transports.File({
        level: minLevel,
        filename: config.file.logdir + "/" + config.file.filename,
        json: false,
        colorize: false
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
  logger.logstop = function logstop(name) {
    var ms = logger.stop_ms(name);
    if (ms < 10)       ms = Chalk.green.bold(ms)
    else if (ms < 100) ms = Chalk.green(ms)
    else if (ms < 500) ms = Chalk.yellow(ms)
    else if (ms < 999) ms = Chalk.red(ms)
    else               ms = Chalk.red.bold(ms)
    return logger.debug(name, ms + " ms");
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
