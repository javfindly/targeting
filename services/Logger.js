var winston = require('winston');
var configService = require('../conf/ConfigService.js');
var config = configService.config;

var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)( config.log ),
		new (winston.transports.File)( config.log )
	]
});

exports.logger = logger;