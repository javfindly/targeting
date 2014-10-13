var config = require('../conf/ConfigService.js').config;
var utils = require('./Utils.js');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var transporter = nodemailer.createTransport(smtpTransport({
    host: config.mail.host,
    port: config.mail.port,
    service: config.mail.serviceProvider,
    auth: {
        user: config.mail.user,
        pass: config.mail.password
    }
}));

var service = {
	send: function(options) {
		var defaultOptions = {
			from: config.mail.from
		};
		var extendedOptions = utils.extend(defaultOptions,options);
		transporter.sendMail(extendedOptions);
	}
}

exports.send = service.send;