var should = require("should");
var sinon = require("sinon");
var rewire = require("rewire");
var deployService = rewire("../../services/DeployService.js");

describe('DeployService', function(){
  	describe('.queryLastKeeperPromotion(callback)', function(){
		
		it('should call queryLastPromotion with \'SUCCESS\' status and get the BuildInfo', function(done){
			var jobName = 'keeper';
		 	var promotionName = 'Keeper QA Release';
		 	
			var doneCallback = function(error, results) {
				error.should.equal(false);
				deployService.__get__('service').queryLastPromotion.restore();
				deployService.__get__('service').getJobBuildInfo.restore();
				done();
			}
			var fakePromotionInfo = {
				result: 'SUCCESS',
				target: {
					number: 122
				}
			};
			var fakeBuildInfo = {
				date: new Date()
			}

			sinon.stub(deployService.__get__('service'), "queryLastPromotion", function(arg1,arg2,arg3){
				arg1.should.be.equal(jobName);
				arg2.should.be.equal(promotionName);
				should.exists(arg3);
				arg3(false,fakePromotionInfo);
			});
			sinon.stub(deployService.__get__('service'), "getJobBuildInfo", function(arg1,arg2,arg3){
				arg1.should.be.equal(jobName);
				arg2.should.be.equal(fakePromotionInfo.target.number);
				should.exists(arg3);
				arg3(false,fakeBuildInfo);
			});
			deployService.queryLastKeeperPromotion(doneCallback);
		})

		it('should call queryLastKeeperPromotion -> queryLastPromotion(FAILED) -> return error', function(done){
		 	var jobName = 'keeper';
		 	var promotionName = 'Keeper QA Release';

			var doneCallback = function(error, results) {
				error.should.equal(true);
				results.should.equal('Last promotion for ' + jobName + ' was not Successful yet.');
				deployService.__get__('service').queryLastPromotion.restore();
				done();
			}
			var fakePromotionInfo = {
				result: 'FAILED',
				target: {
					number: 122
				}
			};

			sinon.stub(deployService.__get__('service'), "queryLastPromotion", function(arg1,arg2,arg3){
				arg1.should.be.equal(jobName);
				arg2.should.be.equal(promotionName);
				should.exists(arg3);
				arg3(false,fakePromotionInfo);
			});
			deployService.queryLastKeeperPromotion(doneCallback);
		})
	});

	describe('.getTPEntitiesForCurrentPromotion(promotion,excludingIdsFromGithub,doneCallback)', function(){
		it('should query UserStories and Bugs, and include default fields and query',function(done){
			var now = new Date().getTime();
			var promotion = {
				timestamp: now,
				duration: 15000
			}
			var mockResults = [
				{
					Id: 12,
					ModifyDate: ("/Date("+now+"-0000)")
				},
				{
					Id: 22,
					ModifyDate: ("/Date("+(now-10000)+"-0000)")
				},
				{
					Id: 33,
					ModifyDate: ("/Date("+(now-21000)+"-0000)")
				},
				{
					Id: 45,
					ModifyDate: ("/Date("+(now-25000)+"-0000)")
				},
				{
					Id: 67,
					ModifyDate: ("/Date("+(now-30000)+"-0000)")
				}
			];
			var excludingIdsFromGithub = [mockResults[3].Id,mockResults[4].Id];

			var currentTPService = deployService.__get__('tpService');
			var doneCallback = function(error, results) {
				error.should.equal(false);
				//The next ids's are newer than promotion timestamp
				results.should.not.containEql(mockResults[0]);
				results.should.not.containEql(mockResults[1]);
				//The next id is a valid TP id
				results.should.containEql(mockResults[2]);
				//The next id's are excluded by github
				results.should.not.containEql(mockResults[3]);
				results.should.not.containEql(mockResults[4]);
				deployService.__set__('tpService', currentTPService);
				done();
			}
			var mockTPService = {
				query: function(entities,includes,conditions,resultsCallback) {
					entities.should.eql(['UserStories','Bugs']);
					includes.should.eql(['Id','Name','Effort','StartDate','ModifyDate','EntityState','Tags','EntityType','Project','Release','Iteration']);
					conditions.should.be.equal("(EntityState.Name eq 'Ready to Deploy') and (Project.Name eq 'ATS Skins Scrum')");
					resultsCallback(mockResults);
				}
			}
			deployService.__set__('tpService',mockTPService);
			deployService.getTPEntitiesForCurrentPromotion(promotion,excludingIdsFromGithub,doneCallback);
		})
	});
})
