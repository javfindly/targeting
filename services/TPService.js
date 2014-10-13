var config = require('../conf/Config.js').config;
var log = require('./Logger.js').logger;
var _ = require('underscore');

var tp = require('tp-api')({
  domain: config.targetProcess.domain,
  token: config.targetProcess.token
})

var UpdatePluck = ['Id','EntityType','Name','EntityState']

var EntityTypeMapping = {
	'UserStory':'UserStories',
	'Bug':'Bugs',
}

var service = {
	query: function(entities,includes,conditions,resultsCallback) {
		var results = [];
		var totalEntities = entities.length;
		var processedEntities = 0;
		var processResults = function(err,entityList) {
			log.debug('Response from Tp ');
			log.debug(entityList);
			if(err) {
				results.push("Error processing request: " + err);
			} else {
				if(entityList) {
					entityList.forEach(function(entity){
						results.push(entity);
					})
				}
			}
			processedEntities++;
			if(processedEntities >= totalEntities) {
				resultsCallback(results);
			}
		}
		entities.forEach(function(entity){
			log.debug('query TP: ' + entity + ' -> ' + conditions);
			tp(entity).take(10000).pluck(includes).where(conditions).then(processResults)
		})
	},
	updateState: function(entitiesUpdate, newState, resultsCallback){
		var allEntitiesToUpdate = service.joinEntityTypes(entitiesUpdate);
		var allConditions = service.createEntityConditions(allEntitiesToUpdate);

		var queriesDone = 0;
		var queriesTotal = 0;
		_.each(allConditions,function(entityType){
			queriesTotal++;
			var conditions = allConditions[entityType];
			var queryType = EntityTypeMapping[entityType];
			log.debug('('+queryType+')conditions for ' + entityType + ' : ' + conditions + ', moving to ' + newState);
			tp(queryType).take(10000).pluck(UpdatePluck).where(conditions).thenEntities(function(err,entities){
				if(entities) {
					entities.forEach(function(entity){
						entity.setState(newState);
					})
				}
				service.doneCallbackHelper(err,++queriesDone,queriesTotal,resultsCallback);
			});
		})
	},
	joinEntityTypes: function(entitiesUpdate) {
		var allEntitiesToUpdate = {};
		_.each(entitiesUpdate,function(singleEntity){
			var sameTypeEntities = allEntitiesToUpdate[singleEntity.type];
			if(sameTypeEntities) {
				sameTypeEntities.push(singleEntity.id)
			} else {
				sameTypeEntities = [singleEntity.id];
			}
			allEntitiesToUpdate[singleEntity.type] = sameTypeEntities;
		})
		return allEntitiesToUpdate;
	},
	createEntityConditions: function(allEntitiesToUpdate){
		var allConditions = {};
		_.each(allEntitiesToUpdate,function(idsArray,entityType){
			var entityConditions = 'Id in (' + idsArray + ')';
			allConditions[entityType] = entityConditions;
		})
		return allConditions;
	},
	doneCallbackHelper: function(err,queriesDone,queriesTotal,resultsCallback) {
		if(err) resultsCallback(err);
		if(queriesDone >= queriesTotal){
			resultsCallback();
		}
	}
}

exports.query = service.query;
exports.updateState = service.updateState;