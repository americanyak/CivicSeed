var rootDir = process.cwd();
var service = require(rootDir + '/service');
var UserModel = service.useModel('user');
var GameModel = service.useModel('game');

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

	return {

		getProfileInformation: function(random) {
			UserModel.findOne({ profileLink: random} , function(err, user) {
				if(err) {
					console.log(err);
					res({firstName: false});
				}
				else if(user) {
					var profileInfo = {
						firstName: user.firstName,
						lastName: user.lastName,
						school: user.school,
						resume: user.game.resume,
						resumeFeedback: user.game.resumeFeedback,
						gameStarted: user.gameStarted,
						profilePublic: user.profilePublic,
						profileUnlocked: user.profileUnlocked,
						profileSetup: user.profileSetup,
						colorNum: user.game.colorInfo.tilesheet,
						colorMap: user.game.colorMap,
						email: user.email
					};
					if(!profileInfo.colorMap) {
						profileInfo.colorMap = false;
					}
					GameModel
						.where('instanceName').equals(user.game.instanceName)
						.findOne(function(err,game) {
							if(err) {
								res(false);
							} else if(game) {
								profileInfo.active = game.active;
								res(profileInfo);
							}
						});
				}
				else {
					res({firstName: false});
				}
			});
		},

		getAllProfiles: function() {
			UserModel.find({role: 'actor', profilePublic: true}, function(err, users) {
				if(err) {
					console.log(err);
					res(false);
				}
				else if(users){
					var all = [];
					users.forEach(function(u,i) {
						var profile = {
							firstName: u.firstName,
							lastName: u.lastName,
							profileLink: u.profileLink
						};
						all.push(profile);
					});
					res(all);
				}
			});
		},

		updateResume: function(info) {
			UserModel.findById(info.id, function(err,user) {
				if(err) {
					console.log(err);
					res(false);
				}
				else if(user) {
					user.game.resume = info.resume;
					user.save(function(err,okay) {
						if(err) {
							console.log('error saving');
							res(false);
						} else {
							res(true);
						}
					})
				}
			});
		},

		setPublic: function(info) {
			UserModel.findById(info.id, function(err,user) {
				if(err) {
					console.log(err);
					res(false);
				}
				else if(user) {
					user.profilePublic = info.changeTo;
					user.save(function(err,okay) {
						if(err) {
							console.log('error saving');
							res(false);
						} else {
							res(true);
						}
					})
				}
			});
		}

	};

}