'use strict'
Winston      = require('winston')
Chalk        = require('chalk')
Cycle        = require('cycle')
Util         = require('util')
MkdirP       = require('mkdirp')
WinstonTimer = require('winston-timer')

Winston.emitErrs = true

DEFAULT_CONFIG = {
	transports: ['console', 'file']
	level: 'debug'
	exitOnError: false
	console: {}
	file:
		logdir: './logs'
	winston_timer: {}
	colors:
		label: Chalk.magenta
		timestamp: Chalk.yellow
}

loadConfig = (callingModule, config) ->
	for k,v of DEFAULT_CONFIG
		if k not of config
			config[k] = v
	console.log config
	config.file.filename or= config.formatter.label(callingModule) + '.log'
	minLevel = DEFAULT_CONFIG.level
	if config.level
		minLevel = config.level
	if process.env.LOGLEVEL
		minLevel = process.env.LOGLEVEL
	config.level = minLevel
	return config

setupTransports = (callingModule, config) ->
	transports = []
	for transport in config.transports
		if transport == 'console'
			transports.push new Winston.transports.Console(
				level: config.level
				json: false
				colorize: true
				formatter: config.formatter.logEntry(callingModule, config))
		else if transport == 'file'
			MkdirP.sync config.file.logdir
			transports.push new Winston.transports.File(
				level: config.level
				filename: [config.file.logdir, config.file.filename].join('/')
				json: false
				colorize: false)
	return transports

_decycleLogger = (logger) ->
	if not config.decycle
		return
	originalLog = logger.log
	logger.log = ->
		fwdArgs = [ arguments[0] ]
		firstObjectArg = 2
		if typeof arguments[1] == 'string'
			fwdArgs.push arguments[1]
		else
			firstObjectArg = 1
		i = firstObjectArg
		while i < arguments.length
			fwdArgs.push Cycle.decycle(arguments[i])
			i++
		originalLog.apply logger, fwdArgs

setupLogger = (callingModule, config) ->
	# setup transports
	transports = setupTransports callingModule, config
	# 
	logger = new (Winston.Logger)(
		'transports': transports
		'exitOnError': config.exitOnError)
	# Profiling
	WinstonTimer logger, config.winston_timer
	# Decycle references
	_decycleLogger logger, config

module.exports = (callingModule, config={}) ->
	loadConfig callingModule, config
	return setupLogger callingModule, config
