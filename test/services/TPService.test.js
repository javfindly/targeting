var should = require("should");
var sinon = require("sinon");
var rewire = require("rewire");
var tpService = rewire("../../services/TPService.js");

describe('TPService', function(){
  	describe('.createEntityConditions(allEntitiesToUpdate)', function(){
		it('should create a TP query :\'Id in (i..ids)\' for each entity type', function(){
			var mockAllEntitiesToUpdate = {
				'UserStories': [4561,5222,7777,10001,11211],
				'Bugs': [3333,6666,8888,9999]
			}
			var conditionsResult = tpService.__get__('service').createEntityConditions(mockAllEntitiesToUpdate);
			conditionsResult['UserStories'].should.be.equal('Id in ('+mockAllEntitiesToUpdate['UserStories']+')');
			conditionsResult['Bugs'].should.be.equal('Id in ('+mockAllEntitiesToUpdate['Bugs']+')');
		})
	})

	describe('.joinEntityTypes(entitiesUpdate)', function(){
		it('should create an object grouping Ids under the same entity type', function(){
			var mockEntitiesUpdate = [
				{
					type: 'Bug',
					id: 111
				},
				{
					type: 'UserStory',
					id: 222
				},
				{
					type: 'UserStory',
					id: 333
				},
				{
					type: 'Bug',
					id: 444
				},
				{
					type: 'Bug',
					id: 555
				}
			];
			var results = tpService.__get__('service').joinEntityTypes(mockEntitiesUpdate);
			// User stories together
			results['UserStory'].should.containEql(222);
			results['UserStory'].should.containEql(333);

			// Shouldn't be Bug id's in the User Story entry
			results['UserStory'].should.not.containEql(111);
			results['UserStory'].should.not.containEql(444);
			results['UserStory'].should.not.containEql(555);

			// Bugs together
			results['Bug'].should.containEql(111);
			results['Bug'].should.containEql(444);
			results['Bug'].should.containEql(555);

			// Shouldn't be Userstories id's in the Bug entry
			results['Bug'].should.not.containEql(222);
			results['Bug'].should.not.containEql(333);
		})
	})

	describe('.doneCallbackHelper(err,queriesDone,queriesTotal,resultsCallback)', function(){
		it('should call the callback function with the error flag on error', function(done){
			var err = true;
			var queriesDone = 1;
			var queriesTotal = 3;
			var resultsCallback = function(err) {
				err.should.be.true;
				done();
			}

			tpService.__get__('service').doneCallbackHelper(err,queriesDone,queriesTotal,resultsCallback);
		})

		it('should not call the callback function if there are queries incomplete yet', function(done){
			var err = false;
			var queriesDone = 1;
			var queriesTotal = 3;
			var resultsCallback = function(err) {
				fail();
			}
			tpService.__get__('service').doneCallbackHelper(err,queriesDone,queriesTotal,resultsCallback);
			setTimeout(done,1);
		})

		it('should call the callback function when all queries are done', function(done){
			var err = false;
			var queriesDone = 3;
			var queriesTotal = 3;
			var resultsCallback = function(err) {
				should.not.exists(err);
				done();
			}
			tpService.__get__('service').doneCallbackHelper(err,queriesDone,queriesTotal,resultsCallback);
		})
	})

	describe('.query(entities,includes,conditions,resultsCallback)', function(){
		it('should call the TP api and return an error', function(done){
			var entities = ['Bugs','UserStories'],
				includes = ['Id','Name','SomeField'],
				conditions = "Id in (1234)",
				resultsCallback = function(err,message) {
					should.exists(err)
					err.should.containEql('Error processing request: Some error')
					done();
				};
			var tpServiceMock = function(entityType) {
				entities.should.containEql(entityType);
				var methods = {
					take: function(take) {
						take.should.be.equal(10000);
						return methods;
					},
					pluck: function(includes) {
						includes.should.containEql('Id')
						includes.should.containEql('Name')
						includes.should.containEql('SomeField')
						return methods;
					},
					where: function(conditions) {
						conditions.should.be.equal("Id in (1234)")
						return methods;
					},
					then: function(processResults) {
						processResults('Some error');
						return methods;
					}
				}
				return methods;
			}
			tpService.__set__('tp',tpServiceMock);
			tpService.query(entities,includes,conditions,resultsCallback);
		})

		it('should call the TP api with params specified', function(done){
			var entities = ['Bugs','UserStories'],
				includes = ['Id','Name','SomeField'],
				conditions = "Id in (1234)",
				fakeResults = [
					{
						Id: 1
					},
					{
						Id: 2
					},
					{
						Id: 3
					}
				],
				resultsCallback = function(results) {
					results.should.containEql(fakeResults[0])
					results.should.containEql(fakeResults[1])
					results.should.containEql(fakeResults[2])
					done();
				};
			var tpServiceMock = function(entityType) {
				entities.should.containEql(entityType);
				var methods = {
					take: function(take) {
						take.should.be.equal(10000);
						return methods;
					},
					pluck: function(includes) {
						includes.should.containEql('Id')
						includes.should.containEql('Name')
						includes.should.containEql('SomeField')
						return methods;
					},
					where: function(conditions) {
						conditions.should.be.equal("Id in (1234)")
						return methods;
					},
					then: function(processResults) {
						processResults(false,fakeResults);
						return methods;
					}
				}
				return methods;
			}
			tpService.__set__('tp',tpServiceMock);
			tpService.query(entities,includes,conditions,resultsCallback);
		})
	})

	describe('.updateState(entitiesUpdate, newState, resultsCallback)', function(){
		it('should call the TP api and return an error', function(done){
			var mockEntitiesUpdate = [
					{
						type: 'Bug',
						id: 111
					},
					{
						type: 'UserStory',
						id: 222
					},
					{
						type: 'UserStory',
						id: 333
					},
					{
						type: 'Bug',
						id: 444
					},
					{
						type: 'Bug',
						id: 555
					}
				],
				newState = "Ready to Test",
				resultsCallback = function(err,message) {
					//done();
				};
			var tpServiceMock = function(entityType) {
				var methods = {
					take: function(take) {
						take.should.be.equal(10000);
						return methods;
					},
					pluck: function(includes) {
						return methods;
					},
					where: function(conditions) {
						return methods;
					},
					thenEntities: function(processResults) {
						processResults();
						return methods;
					}
				}
				return methods;
			}
			tpService.__set__('tp',tpServiceMock);
			tpService.updateState(mockEntitiesUpdate, newState, resultsCallback);
		})
	})
})