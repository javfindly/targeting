var environment = process.env.NODE_ENV;
var appArguments = process.argv;
var appPath = appArguments[1];

if(!environment) {
	if(appPath.indexOf('mocha') != -1) {
		environment = 'test'
	} else {
		environment = 'development';
	}
}
var config = require('../conf/Config.json');

function isDevelopment() { return environment == 'development' }
function isProduction() { return environment == 'production' }
function isTest() { return environment == 'test' }

console.log("environment " + environment);

exports.config = config[environment];
exports.selectConfiguration = config;
exports.environment = environment;
exports.isTest = isTest;
exports.isDevelopment = isDevelopment;
exports.isProduction = isProduction;