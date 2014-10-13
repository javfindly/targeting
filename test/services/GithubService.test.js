var should = require("should");
var sinon = require("sinon");
var rewire = require("rewire");
var githubService = rewire("../../services/GithubService.js");

describe('GithubService', function(){
  	describe('.extractTPIdsFromPullRequestsSince(callback)', function(){
		
		it('should ignore pull requests higher than promotion time', function(done){
			var now = new Date().getTime();
			var promotion = {
				timestamp: now,
				duration: 15000
			};
			var fakeData = [
				{
					head: { ref:'feature/11211-somebranch'},
					closed_at: (new Date(now - 10000)).toString()
				},
				{
					head: { ref:'feature/11233-someotherbranch'},
					closed_at: (new Date(now - 12001)).toString()
				},
				{
					head: { ref:'feature/14255-abranch'},
					closed_at: (new Date(now - 16000)).toString()
				}
			];

			var doneCallback = function(error, results) {
				(error === null).should.be.true;
				// Shouldn't be there because its getting pull request FROM determined date
				// In this case, the date is from now - 14 seconds. I should get all pull request
				// closed in the last 15 secondes
				results.should.containEql(11211);
				results.should.containEql(11233);
				// The next one is closed 1 seconds before the build, so it should be ignored
				results.should.not.containEql(14255);
				githubService.__get__('ghrepo').prs.restore();
				done();
			}

			sinon.stub(githubService.__get__('ghrepo'), "prs", function(options,cb){
				cb(false,fakeData);
			});

			githubService.extractTPIdsFromPullRequestsSince(promotion,doneCallback)
		})


		
		it('should ignore pull requests higher than promotion time', function(done){
			var now = new Date().getTime();
			var promotion = {
				timestamp: now,
				duration: 15000
			};
			var fakeData = [
				{
					head: { ref:'feature/112A11-somebranch'},
					closed_at: (new Date(now - 10000)).toString()
				},
				{
					head: { ref:'feature/someotherbranch'},
					closed_at: (new Date(now - 12001)).toString()
				},
				{
					head: { ref:'feature/14255-abranch'},
					closed_at: (new Date(now - 13000)).toString()
				},
				{
					head: { ref:'feature/15555abranch'},
					closed_at: (new Date(now - 13000)).toString()
				}
			];

			var doneCallback = function(error, results) {
				(error === null).should.be.true;

				//It contain letters, but they should be removed by service
				results.should.containEql(11211);
				
				//This is a normal feature branch name
				results.should.containEql(14255);

				//doesn't have a dash sepparator
				results.should.not.containEql(15555);
				githubService.__get__('ghrepo').prs.restore();
				done();
			}

			sinon.stub(githubService.__get__('ghrepo'), "prs", function(options,cb){
				cb(false,fakeData);
			});

			githubService.extractTPIdsFromPullRequestsSince(promotion,doneCallback)
		})

	})
})