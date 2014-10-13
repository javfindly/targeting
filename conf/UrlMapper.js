var express = require('express');
var router = express.Router();
var tpService = require('../services/TPService');
var deployService = require('../services/DeployService');
var mailService = require('../services/MailService');
var githubService = require('../services/GithubService');
var log = require('../services/Logger.js').logger;
var url = require('url');

var normalRequestProcess = function(req,res) {
	return function(err,data) {
		if(err) {
			res.status(400).send(data);
		} else {
			res.status(200).send(data);
		}
	}
};

router.get('/tp/query', function(req,res) {
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var conditions = req.query.conditions;
	var entities = req.query.entities;
	if(!(entities instanceof Array)) entities = [entities];
	var includes = req.query.includes;
	if(!(includes instanceof Array)) includes = [includes];
	tpService.query(entities,includes,conditions,function(results) {
		res.status(200).send(results);
	});
});

router.get('/tp/last-promotion', function(req,res) {
	deployService.queryLastKeeperPromotion(normalRequestProcess(req,res));
});


router.post('/tp/search-deploy-ready', function(req,res) {
	var promotion = req.body.promotion;
	log.debug('Searching TP entities since promotion')
	log.debug(promotion);
	githubService.extractTPIdsFromPullRequestsSince(promotion,function(err,excludingIdsFromGithub){
		log.debug("(GithubService)Excluding Ids from after the build: " + excludingIdsFromGithub);
		deployService.getTPEntitiesForCurrentPromotion(promotion,excludingIdsFromGithub,normalRequestProcess(req,res));
	});
});

router.post('/tp/deploy-ready' , function(req,res){
	var entitiesUpdate = req.body.update;
	var newState = req.body.newState;
	log.debug('Updating entities to ' + newState);
	log.debug(entitiesUpdate);
	if(newState && newState != '') {
		tpService.updateState(entitiesUpdate, newState, function(err,data){
			if(err) {
				res.status(400).send(err);
			} else {
				res.status(200).send({status:true});
			}	
		});
	} else {
		res.status(400).send("New state field is required");
	}
});

router.post('/tp/notify', function(req,res) {
	mailService.send({
		to: req.body.to,
		text: req.body.text,
		html: req.body.html,
		subject: req.body.subject
	});
	res.status(200).send({status:true});
});

router.get('/tp/github/pulls', function(req,res) {
	//githubService.getPullRequests();
	res.status(200).send({status:true});
});

exports.router = router;