// COMPARE ACCOUNT.ACTIONS JS FILE
// var rootDir = process.cwd();
// var service = require(rootDir + '/service');
// var UserModel = service.useModel('user').UserModel;

var intervalId = {};
var numActivePlayers = 0;
// var numPlayers = 0;
var players = [];

var service, db, userModel,tileModel;

var self = module.exports = {

	// userModel: null,

	actions: function(req, res, ss) {
		req.use('session');
		// req.use('account.user.authenticated');

		console.log('CS:'.blue + ' player RPC request ---->'.magenta);
		console.log(JSON.stringify(req).slice(0, 100).magenta + '...'.magenta);
		// Russ, it's all hooked up. Access the db via ss.db
		//console.log(ss.db);
		return {

			//MUST MAKE IT SO YOU CAN ONLY INIT ONCE PER SESSION
			init: function() {

				// req.session.myTempVar = 1234;
				// var myTempVar = req.session.myTempVar;
				// console.log(' ************* ');
				// console.log(' ************* ');
				// console.log(' ************* ');
				// console.log(myTempVar);
				// console.log(' ************* ');
				// console.log(' ************* ');
				// console.log(' ************* ');

				// load models and database service only once
				service = ss.service;
				userModel = service.useModel('user', 'ss');
				tileModel = service.useModel('tile', 'ss');
				numActivePlayers++;
				console.log("player "+req.session.id+" joined.");
				//send the number of active players to angular
				ss.publish.all('ss-numActivePlayers',numActivePlayers);
				console.log("active players" +numActivePlayers);
				res(req.session.id);
			},
			// checkIn: function(player) {
			// 	players.push(player);
			// 	ss.publish.all('ss-numPlayers', numActivePlayers);
			// 	// it's working now!
			// 	userModel.find({ name: 'admin' }, function(err,result) {
			// 		console.log(result);
			// 	});
			// 	userModel.find({ name: 'Robert Hall' }, function(err,result) {
			// 		console.log(result);
			// 	});
			// },

			// checkIn: function(){
			// 	numPlayers++;
			// 	ss.publish.all('ss-count',numPlayers);
			// },
			// addMe: function(player){
			// 	players.push(player);
			// 	ss.publish.all('ss-allPlayers',players);
			// },

			// ------> this should be moved into our map rpc handler???
			getMapData: function(x1,y1,x2,y2) {
				// tileModel.findOne(function(err,query){
				// 	res(query);
				// });				
				//tileModel.find().gte('x', x1).gte('y',y1).lt('x',x2).lt('y',y2);
				tileModel
				.where('x').gte(x1).lt(x2)
				.where('y').gte(y1).lt(y2)
				.sort('mapIndex')
				.find(function (err, allTiles) {
 			 		if (err){
 			 			res(false);
 			 		}
					if (allTiles) {
						res(allTiles);
					}
				});
				// quadrants.find({ quadrantNumber: quadNumber }, function(err, quad) {
				// 	res(err, quad, index);
				// });
				//return set of tiles based no bounds
			},
			playerLeft: function(id) {
				numActivePlayers--;
				ss.publish.all('ss-numActivePlayers', numActivePlayers);
				console.log("player "+id+" left.");
			},

			movePlayer: function(player, id) {
				console.log("move "+id);
				// for(var p=0; p<players.length;p++){
				// 	console.log(players[p].id);
				// 		//ridic stupid way to check if it's the right one (id isn't working)
				// 		if(players[p].r ==player.r && players[p].g ==player.g) {
				// 			players[p].x = player.x;
				// 			players[p].y = player.y;
				// 			continue;
				// 		}
				// }
				// console.log(player);
				ss.publish.all('ss-playerMoved', player);
			},
			dropSeed: function(bombed) {
				// for(var p=0; p<players.length;p++){
				// 	console.log(players[p].id);
				// 		//ridic stupid way to check if it's the right one (id isn't working)
				// 		if(players[p].r ==player.r && players[p].g ==player.g) {
				// 			players[p].x = player.x;
				// 			players[p].y = player.y;
				// 			continue;
				// 		}
				// }
				// console.log(player);
				ss.publish.all('ss-seedDropped', bombed);
			},
		}
	}
}