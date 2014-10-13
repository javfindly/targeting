var tpService = require('./TPService.js');
var configService = require('../conf/Config.js');
var config = configService.config;
var log = require('./Logger.js').logger;
var githubService = require('./GithubService.js');
var jenkinsapi = require('jenkins-api');
var _ = require('underscore');

var jenkins = jenkinsapi.init(config.jenkins.connectionString,{
	rejectUnauthorized: false
});

var devJobInfo = {
	name: 'keeper',
	number: 1124,
	date: (new Date())
}
var devLastPromotionInfo = {
	result: 'SUCCESS',
	fullDisplayName: 'keeper >> some DEV job',
	timestamp: (new Date().getTime()),
	duration: 15000,
	number: 77,
	url: 'http://fake.promotion.url/77',
	target: {
		number: 122,
		url: 'http://fake.job.url/1124'
	}
}

var service = {
	queryLastKeeperPromotion: function(doneCallback) {
		var jobName = 'keeper';
		var promotionName = 'Keeper QA Release';
		log.debug("Getting Jenkings last Promotion");
		service.queryLastPromotion(jobName,promotionName,function(err,promotion){
			log.debug(promotion);
			if(promotion && promotion.result == 'SUCCESS') {
				service.getJobBuildInfo(jobName,promotion.target.number,function(err,buildInfo) {
					var buildData = {
						promotion: promotion,
						build: buildInfo
					};
					doneCallback(err,buildData);
				});
			} else {
				doneCallback(true,'Last promotion for ' + jobName + ' was not Successful yet.' );
			}
		});
	},
	getTPEntitiesForCurrentPromotion: function(promotion,excludingIdsFromGithub,doneCallback) {
		var promotionBuildTimestamp = promotion.timestamp - promotion.duration;
		var entities = ['UserStories','Bugs'];
		var includes = ['Id','Name','Effort','StartDate','ModifyDate','EntityState','Tags','EntityType','Project','Release','Iteration'];
		var conditions = "(EntityState.Name eq 'Ready to Deploy') and (Project.Name eq 'ATS Skins Scrum')"
		log.debug("Getting tp entitites");
		tpService.query(entities,includes,conditions,function(results){
			log.debug("Processing results from TP query");
			if(results) {
				log.debug("Getting entities before the Promotion deploy timestamp");
				var entitiesToMove = [];
				_.each(results,function(tpEntity){
					if(tpEntity.ModifyDate) {
						var modifyDateString = tpEntity.ModifyDate.substring("/Date(".length,tpEntity.ModifyDate.indexOf('-'));
						var entityModifyTimeStamp = parseInt(modifyDateString);
						if(entityModifyTimeStamp < promotionBuildTimestamp && !_.contains(excludingIdsFromGithub,tpEntity.Id)) {
							entitiesToMove.push(tpEntity);
						}
					}				
				});
				doneCallback(false,entitiesToMove);
			} else {
				doneCallback(true,"No information from TP");		
			}
		})
	},
	queryLastPromotion: function(jobName,promotionName,callback) {
		if(configService.isDevelopment()){
			callback(false,devLastPromotionInfo);
		} else {
			jenkins.last_promotion_report(jobName,promotionName, function(err, data) {
				if (err){
					callback(true,'Error getting jenkins data: ' + data);
				} else {
					callback(false,data);
				}
			});
		}
	},
	getJobBuildInfo: function(jobName,buildNumber,callback) {
		if(configService.isDevelopment){
			callback(false,devJobInfo);
		} else {
			jenkins.build_info(jobName, buildNumber,callback);
		}
	}
}

exports.queryLastKeeperPromotion = service.queryLastKeeperPromotion;
exports.getTPEntitiesForCurrentPromotion = service.getTPEntitiesForCurrentPromotion;
exports.queryLastPromotion = service.queryLastPromotion;
exports.getJobBuildInfo = service.getJobBuildInfo;
//exports.service = service;