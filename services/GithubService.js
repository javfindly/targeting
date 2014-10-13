var config = require('../conf/Config.js').config;
var github = require('octonode');
var log = require('./Logger.js').logger;
var client = github.client(config.github.token);
var ghrepo = client.repo(config.github.user + '/' + config.github.repo);
var _ = require('underscore');

var service = {
	extractTPIdsFromPullRequestsSince: function(promotion,cb) {
		var promotionBuildTimestamp = promotion.timestamp - promotion.duration;
		service.getPullRequests({
			state: 'closed',
			per_page: 50,
			sort: 'closed_at',
			direction: 'desc',
			from: promotionBuildTimestamp
		},function(err,data){
			if(err) cb(err);
			log.debug('Git pull requests');
			log.debug(data);
			cb(null,service.extractTPIds(data));
		});
	},
	getPullRequests: function(options,cb) {
		log.debug('getPullRequests:');
		log.debug(options);
		ghrepo.prs({
			state: options.state,
			per_page: options.per_page,
			sort: options.sort,
			direction: options.direction
		},
		function(err,data){
			if(err) cb(err,null);
			log.debug('Data from git pull requests');
			var results = [];
			log.debug('from ' + options.from);
			_.each(data,function(pull){
				if(options.from) {
					var pullRequestCloseDate = Date.parse(pull.closed_at);
					if(pullRequestCloseDate > options.from){
						results.push(pull);
					}
				} else {
					results.push(pull);
				}
			});
			cb(null,results);
		});
	},
	extractTPIds: function(data) {
		var idSet = [];
		_.each(data,function(pull){
			if(pull.head) {
				var branch = pull.head.ref;
				
				if(branch.indexOf('feature/') == 0) {
					var idSeparator = branch.indexOf('-','feature/'.length);
					if(idSeparator != -1){
						var id = branch.substring('feature/'.length,idSeparator);
						if(id.indexOf('/') != -1) {
							id = id.substring(id.indexOf('/'));
						}
						id = id.replace(/\D/g,'');//Leave only numbers
						if(!_.contains(idSet,id) && !_.isEmpty(id)) {
							idSet.push(id);
						}
					}
				}
			}
		});
		return _.sortBy(idSet,function(n){return n});
	}
}

exports.extractTPIdsFromPullRequestsSince = service.extractTPIdsFromPullRequestsSince;