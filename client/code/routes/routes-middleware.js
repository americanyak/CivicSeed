var actorRoutes = [
	'/game'
];
var adminRoutes = [
	'/admin',
	'/admin/invitecodes',
	'/admin/monitor'
];
var superadminRoutes = [
	'/admin/startup',
	'/admin/npcs'
];

var self = module.exports = {

	loadMiddleware: function($app) {

		// // check if user experiences/authentic
		$app.before(function(req) {

			var fullPath = req.fullPath;
			var userRole = sessionStorage.getItem('userRole');
			var classSegments;
			var classSegmentsLength;
			var i;

			if(Davis.previousPath && Davis.previousPath === '/game') {
				// do something special here
				// console.log('exit the game!');
				if(sessionStorage.getItem('isPlaying')) {
					$game.exitGame();
				}
			}
			Davis.previousPath = fullPath;

			if(typeof userRole !== 'string') {
				userRole = 'non-user';
			}

			$('.navBar').remove();
			$OUTER_CONTAINER.prepend(JT['partials-navigation']({ fullPath: fullPath }));
			$CONTAINER.empty();
			$BODY.removeAttr('class');

			classSegments = fullPath.split('/');
			classSegmentsLength = classSegments.length;
			for(i = 1; i < classSegmentsLength; i++) {
				if(classSegments[i] === '') {
					$BODY.addClass('page-home');
				} else {
					$BODY.addClass('page-' + classSegments[i]);
				}
			}

			// TODO: apply a more robust, secure system for routing
			// this system is temporary, but sufficient for current needs
			if(actorRoutes.indexOf(fullPath) > -1) {
				if(userRole !== 'actor') {
					req.redirect('/');
					return false;
				}
			} else if(adminRoutes.indexOf(fullPath) > -1) {
				if(userRole !== 'superadmin' && userRole !== 'admin') {
					req.redirect('/');
					return false;
				}
			} else if(superadminRoutes.indexOf(fullPath) > -1) {
				if(userRole !== 'superadmin') {
					req.redirect('/');
					return false;
				}
			}

		});

	}

};