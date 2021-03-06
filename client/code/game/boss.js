var _currentSlide,
	_resumes,
	_charger = {},
	_grid,
	$BODY,
	$bossArea,
	$bossAreaContent,
	$buttons,
	$seedButton,
	$seedButtonCount,
	$clock,
	$score,

	_numChargers = 4,
	_currentCharger,
	_numDrawSeeds,
	_numRegularSeeds,
	_seedMode = 0,
	_rgbString,

	//clock stuff
	_start,
	_time,
	_elapsed,
	_target,
	_pause,
	_totalTime,
	_clockRate,
	_clockTimeout,

	_videoPath = CivicSeed.CLOUD_PATH + '/audio/cutScenes/',
	_numVideos = 4,
	_cutSceneVids = [],
	_score,
	_bossScore,

	_hackTimeout,
	_canPlace;


$game.$boss = {
	isShowing: false,
	//place player on map
	init: function(callback) {
		_setDomSelectors();
		_createGrid();
		$('.regularGameHud').fadeOut('fast');
		_setupHud();
		$bossArea.show();
		_rgbString = $game.$player.getColorString();
		_currentSlide = 0;
		_addContent();
		//for testing
		// _currentSlide = 1;
		// $game.$boss.nextSlide();
		_loadVideo(0);
		$('#background').addClass('labBackground');
		callback();
	},

	resetInit: function() {
		_currentSlide = null;
		_resumes = null;
		_charger = {};
		_grid = null;
		_currentCharger = null;
		_numDrawSeeds = null;
		_numRegularSeeds = null;
		_seedMode = 0;
		_rgbString = null;

		//clock stuff
		_start = null;
		_time = null;
		_elapsed = null;
		_target = null;
		_pause = null;
		_totalTime = null;
		_clockRate = null;
		_clockTimeout = null;
		
		_cutSceneVids = [];
		_score = null;
		_bossScore = null;

		$game.$boss.isShowing= false;
	},

	//advance to the resumes
	nextSlide: function() {
		if(_currentSlide === 4) {
			//unlock profile
		} else {
			_currentSlide++;
			if(_currentSlide === 2) {
				//TODO: uncomment this
				// _saveFeedback();
				$('.bossHud').show();
			} else if(_currentSlide > 2) {
				$bossArea.fadeOut('fast',function() {
					$game.$boss.isShowing = false;
					_beginGame();
				});
			}
			_addContent();
		}
	},

	//drop a seed to reveal clues
	dropSeed: function(pos) {
		//update hud
		if(!_pause) {
			if(_seedMode === 1) {
				_numRegularSeeds--;
				$game.$audio.playTriggerFx('seedDrop');
				$('.bossHud .regularSeedButton .hudCount').text(_numRegularSeeds);
				_renderTiles(pos);
				if(_numRegularSeeds <= 0) {
					//TODO: out of regular seeds display
					_seedMode = 0;
					$game.$player.seedMode = false;
					$game.$player.resetRenderColor();
					$('.bossHud .regularSeedButton').removeClass('currentButton');
					//check if they fail
					_checkFail();
				}
			} else if(_seedMode === 2) {
				_numDrawSeeds--;
				$('.bossHud .drawSeedButton .hudCount').text(_numDrawSeeds);
				if(_numDrawSeeds <= 0) {
					//TODO: out of regular seeds display
					_seedMode = 0;
					$game.$player.seedMode = false;
					$game.$player.resetRenderColor();
				}
			}
		}

		//update score
	},

	//finish walking, determine if we crushed charger or got item
	endMove: function(x,y) {
		//check for charger first
		//charger = means it has a revealed charger
		if(!_pause) {
			if(_grid[x][y].charger === 1) {
				_checkWin();
				$game.$renderer.clearBossLevel();
			} else if(_grid[x][y].item > -1) {
				//pick up good item
				_activateItem({x: x, y:y, item: _grid[x][y].item});
			}
		}
	}
};

/****** PRIVATE FUNCTIONS ******/

function _setDomSelectors() {
	$BODY = $('body');
	$bossArea = $('.bossArea');
	$bossAreaContent = $('.bossArea .content');
	$buttons = $('.bossArea .buttons');
	$seedButton = $('.bossHud .seedButton');
	$seedButtonCount = $('.bossHud .seedButton .hudCount');
	$clock = $('.bossHud .clock');
	$score = $('.bossHud .score span');
}

//add content to the display window
function _addContent() {
	$game.$boss.isShowing = true;
	$bossAreaContent.empty();
	var html = '';
	if(_currentSlide === 0) {
		//show intro videp
		html = '<div class="videoFrame"><iframe src="//player.vimeo.com/video/74144898" width="600" height="337" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>';
		$bossAreaContent.append(html);
	} else if(_currentSlide === 1) {
		//show resumes and responses
		ss.rpc('game.player.getRandomResumes',{instanceName: $game.$player.instanceName}, function(result) {
			if(result.length > 0) {
				_resumes = _chooseResumes(result);
				html = '<p class="dialog"><span>Botanist:</span>  To find the charging modules, you will need to use my SPECIAL SEEDS. But... the seeds aren\'t finished yet. You\'ll need to add the last ingredient. Please read what your fellow players have said and provide feedback. This will help them improve their civic resumes. Review all four to receive your SPECIAL SEEDS!</p>';
				for(var i = 0; i < _resumes.length; i++) {
					var levelQuestion = $game.$botanist.getLevelQuestion(i);
					html += '<p class="resumeQuestion">Q: ' + levelQuestion + '</p>';
					html += '<p class="resumeAnswer"><span>A random peer said: </span> ' + _resumes[i].answer + '</p>';
					html += '<p>Do you have any feedback for his or her response? Enter it below.</p><textarea></textarea>';
				}
				$bossAreaContent.append(html);
			} else {
				//TODO: what do we do here?
				console.log('error');
			}
		});
	} else if(_currentSlide === 2) {
		//show instructions and begin
		var img1 = CivicSeed.CLOUD_PATH + '/img/game/boss/mini_lab.jpg',
			img2 = CivicSeed.CLOUD_PATH + '/img/game/boss/charger.png',
			img3  = CivicSeed.CLOUD_PATH + '/img/game/boss/thing1.png',
			img4  = CivicSeed.CLOUD_PATH + '/img/game/boss/thing2.png',
			img5  = CivicSeed.CLOUD_PATH + '/img/game/boss/thing3.png',
			img6  = CivicSeed.CLOUD_PATH + '/img/game/boss/thing4.png';

		html = '<p class="dialog"><span>Botanist:</span> Thanks! You got 20 special seeds.</p>';
		html += '<p class="detailedInstructions"><img class="minilab" src="' + img1 + '"> This is the basement of my lab. The CHARGING MODULES <img src="' + img2 + '"> are hidden somwhere here.  To find the charging modules, you\'ll need to use the SPECIAL SEEDS  you earned.  These special seeds can detect and reveal the charging modules. Whenver you plant one, the color bursts will be DARKER the CLOSER it is to a charging module. It will help guide the way!</p>';
		html += '<p class="detailedInstructions">Once you reveal a charging module, you have to WALK OVER TO IT, and disable it by hand. Find all four to shut down the robot!  You might also find some of my other inventions down here. These can give you more seeds <img src="' + img3 + '"> , or more time <img src="' + img4 + '"> . Watch out for the red potion <img src="' + img5 + '">  which can erase your progress, or the watch <img src="' + img6 + '">  that speeds up the timer. If you run out seeds, or run out of time, you\'ll have to try again.</p>';
		
		$('.bossArea .bossButton').text('Ready?');
		$bossAreaContent.append(html);
	}  else if(_currentSlide === 3) {
		//fail screen
		html = '<p class="dialog"><span>Botanist:</span> You failed to defeat the robot. Why don\'t you try again?</p>';
		$('.bossArea .bossButton').text('Play Again').css('margin-top', '50px');
		$bossAreaContent.append(html);
	}else if(_currentSlide === 4) {
		//win screen
		ss.rpc('game.player.unlockProfile', $game.$player.id, function(err) {
			if(err) {
				console.log('error');
			} else {
				html = '<p class="dialog"><span>Botanist:</span> Congratulations, you defeated the robot!</p>';
				html += '<p class="hoorayVideo"><iframe src="//player.vimeo.com/video/74131828" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></p>';
				$('.bossArea .bossButton').html('<a href="/profiles/' + sessionStorage.profileLink + '">Unlock Profile</a>');
				$bossAreaContent.append(html);
			}
		});
	}
 }

//pick random resume responses from peers
function _chooseResumes(people) {
	var numToGet = 4,
		cur = 0,
		numPeople = people.length,
		responses = [];

	var pickPerson = function(question) {
		var foundPerson = false,
			person;
		while(!foundPerson) {
			var ran1 = Math.floor(Math.random() * numPeople);
			person = people[ran1];
			if(person._id !== $game.$player.id) {
				foundPerson = true;
				if(!person.game.resume[question]) {
					foundPerson = false;
				}
			}
		}
		return person;
	};

	while(cur < numToGet) {
		var person = pickPerson(cur),
			info = {
				id: person._id,
				answer: person.game.resume[cur]
			};
		responses.push(info);
		cur++;
	}
	return responses;
}

//save feedback on resume responses to db for each user
function _saveFeedback() {
	var info = [];
	$('.bossArea textarea').each(function(i) {
		var val = this.value;
		info.push({
			comment: val,
			id: _resumes[i].id
		});
	});
	ss.rpc('game.player.resumeFeedback', info);
}

//randomly place the charger
function _placeCharger() {
	if(_canPlace) {
		_canPlace = false;
		_hackTimeout = setTimeout(function() {
			_canPlace = true;	
		},200);
		var x = Math.floor(Math.random() * $game.VIEWPORT_WIDTH),
			y = Math.floor(Math.random() * $game.VIEWPORT_HEIGHT);
		_charger.x = x;
		_charger.y = y;
		_charger.revealed = false;
		_currentCharger++;
		_calculateGrid();
		//set the grid item with the charger, take items off it if has em
		_grid[x][y].charger = 0;
		_grid[x][y].item = -1;
	}
}

//init the basic grid
function _createGrid() {
	_grid = [$game.VIEWPORT_WIDTH];
	var i = $game.VIEWPORT_WIDTH;
	while(--i >= 0) {
		_grid[i] = [$game.VIEWPORT_HEIGHT];
		var j = $game.VIEWPORT_HEIGHT;
		while(--j >= 0) {
			//place random object
			var item = _makeRandomItem();
			_grid[i][j] = {
				item: item,
				itemRevealed: false
			};
		}
	}
}

function _hideItems() {
	var i = $game.VIEWPORT_WIDTH;
	while(--i >= 0) {
		var j = $game.VIEWPORT_HEIGHT;
		while(--j >= 0) {
			_grid[i][j].itemRevealed = false;
		}
	}
}

//recalc grid values based on charger placement, place item randomly
function _calculateGrid() {
	var i = $game.VIEWPORT_WIDTH;
	while(--i >= 0) {
		var j = $game.VIEWPORT_HEIGHT;
		while(--j >= 0) {
			var dist = _distFromCharger({x:i,y:j});
			_grid[i][j].distance = dist;
			_grid[i][j].charger = -1;
		}
	}
}

//calculate how far from the charger the tile is
function _distFromCharger(pos) {
	var delta = Math.abs(pos.x - _charger.x)  + Math.abs(pos.y - _charger.y);
	return delta;
}

//start the game, clock, sound
function _beginGame() {
	//clear the canvas if a restart
	$game.$renderer.clearBossLevel();
	//set score from tiles colored
	_score = $game.$player.getTilesColored();
	_bossScore = 0;
	$score.text(_score);
	_start = new Date().getTime();
    _time = 0;
    _elapsed = '0.0';
    _pause = false;
    _totalTime = 0;
    _target = 90;
    _clockRate = 1;
    _numRegularSeeds = 20;
    _currentCharger = 0;
    _charger = {};
    _seedMode = 0;
    _canPlace = true;
    _placeCharger();
    $('.bossHud .regularSeedButton .hudCount').text(_numRegularSeeds);
    setTimeout(_updateTime, 100);
    //trigger boss music!
    $game.$audio.switchTrack(7);
}

//tick the clock
function _updateTime(){
    _time += 100;
    _totalTime += 100 * _clockRate;
    _elapsed = _target - Math.floor(_totalTime / 1000);

    var diff = (new Date().getTime() - _start) - _time;

    $clock.text(_elapsed);

    if(_elapsed <= 0) {
		_fail();
    } else if(!_pause) {
        setTimeout(_updateTime, (100 - diff));
    }
}

//check if they are out of seeds and the charger hasn't been revealed
function _checkFail() {
	if(!_charger.revealed || _currentCharger < _numChargers) {
		_fail();
	}
}

//see if the player has won, or set charger
function _checkWin() {
	//add X to score
	_score += 50;
	_bossScore += 50;
	$score.text(_score);

	_hideItems();
	var newCutScene = '<div class="cutSceneBg"></div>';
	$('.gameboard').append(newCutScene);
	var newVid = _cutSceneVids[_currentCharger - 1];
	$('.cutSceneBg').append(newVid);
	$('.cutSceneBg').fadeIn('fast');
	$('.cutScene')[0].play();
	_clockRate = 0;
	$('.cutScene')[0].addEventListener('ended', function() {
		$('.cutScene')[0].removeEventListener('ended');
		$('.cutSceneBg').fadeOut('fast', function() {
			var left = 'only '  + (_numChargers - _currentCharger + 1) + ' chargers left!';
			$game.statusUpdate({message:left,input:'status',screen: true,log:false});
			_clockRate = 1;
			$('.cutSceneBg').remove();
		});
		if(_currentCharger >= 4 && _bossScore === 200) {
			_pause = true;
			_currentSlide = 4;
			_addContent();
			$bossArea.show();
		} else {
			_placeCharger();
		}
	});
}

//show stuff if they don't beat the level
function _fail() {
	$('.bossHud .regularSeedButton').removeClass('currentButton');
	$game.$player.seedMode = false;
	$game.$player.resetRenderColor();
	_pause = true;
	_currentSlide = 3;
	_addContent();
	$bossArea.show();
}

//setup the new hud for the level
function _setupHud() {
	$BODY.on('click','.bossHud .regularSeedButton', function() {
		if(_seedMode === 0 && _numRegularSeeds > 0) {
			$(this).addClass('currentButton');
			_seedMode = 1;
			$game.$player.seedMode = true;
		} else if(_seedMode === 1) {
			$(this).removeClass('currentButton');
			_seedMode = 0;
			$game.$player.seedMode = false;
			$game.$player.resetRenderColor();
		} else if(_seedMode === 2) {
			if(_numRegularSeeds > 0) {
				$(this).addClass('currentButton');
				$('.bossHud .drawSeedButton').removeClass('currentButton');
				_seedMode = 1;
			} else {
				$game.statusUpdate({message:'you have no more seeds!',input:'status',screen: true,log:false});
			}
		} else {
			$game.statusUpdate({message:'you have no more seeds!',input:'status',screen: true,log:false});
		}
	});

	$BODY.on('click','.bossHud .drawSeedButton', function() {
		if(_seedMode === 0) {
			$(this).addClass('currentButton');
			_seedMode = 2;
			$game.$player.seedMode = true;
		} else if(_seedMode === 1) {
			$(this).addClass('currentButton');
			$('.bossHud .regularSeedButton').removeClass('currentButton');
			_seedMode = 2;
			$game.$player.seedMode = false;
			$game.$player.resetRenderColor();
		} else {
			$(this).removeClass('currentButton');
			_seedMode = 0;
		}
	});
}

//figure out which tiles to render based on seed drop
function _renderTiles(pos) {
	var topLeftX = pos.x - 1,
		topLeftY = pos.y - 1,
		squares = [],
		min = 100;
	for(var x = 0; x < 3; x++) {
		for(var y = 0; y < 3; y++) {
			var curX = topLeftX + x,
				curY = topLeftY + y;
			//only add it if in the bounds of the game area
			if(curX >= 0 && curX < $game.VIEWPORT_WIDTH && curY >= 0 && curY < $game.VIEWPORT_HEIGHT) {
				var val = _grid[curX][curY].distance,
					item = _grid[curX][curY].item,
					charger = _grid[curX][curY].charger;
				if(val < min) {
					min = val;
				}
				squares.push({
					val: val,
					x: curX,
					y: curY,
					item: item,
					charger: charger
				});
				//if they found the charger, set it to found, send alert
				if(charger === 0) {
					_foundCharger(curX, curY);
				}
				if(item > -1) {
					//make sure it is revealed
					_grid[curX][curY].itemRevealed = true;
					//if they revealed a bad item, activate it now
					if(item < 2) {
						_activateItem({x: curX, y:curY, item:item});
					}
				}
			}
		}
	}
	//figure out the color
	for(var s = 0; s < squares.length; s++) {
		var alpha = 0.8 - (squares[s].val - min) * 0.2 + 0.1;
		squares[s].color = _rgbString + alpha + ')';
		//console.log(squares[s]);
	}
	$game.$renderer.renderBossTiles(squares);
}

//create a random item
function _makeRandomItem() {
	var ran = Math.floor(Math.random() * 200);
	if(ran < 4) {
		return ran;
	} else {
		return -1;
	}
}

//the player reveals the charger
function _foundCharger(x,y) {
	_grid[x][y].charger = 1;
	$game.statusUpdate({message:'you found a charger! Go to it to disable it.',input:'status',screen: true,log:false});
	_charger.revealed = true;
}

//player activates an special item
function _activateItem(data) {
	if(_grid[data.x][data.y].itemRevealed) {
		//disable item in future
		_grid[data.x][data.y].item = -1;
		if(data.item === 0) {
			//speed up time (bad)
			$game.statusUpdate({message:'uh oh...time warp!',input:'status',screen: true,log:false});
			_clockRate = 4;
			_clockTimeout = setTimeout(function() {
				_clockRate = 1;
			},5000);
			setTimeout(function() {
				$game.$renderer.clearMapTile(data.x * $game.TILE_SIZE, data.y * $game.TILE_SIZE);
			},2000);
		} else if(data.item === 1) {
			//wipeout
			$game.statusUpdate({message:'wipeout!',input:'status',screen: true,log:false});
			setTimeout(function() {
				_hideItems();
				$game.$renderer.clearBossLevel();
			}, 1000);
			_grid[_charger.x][_charger.y].charger = 0;
		} else if(data.item === 2) {
			//time freeze
			$game.statusUpdate({message:'time freeze, nice!',input:'status',screen: true,log:false});
			_clockRate = 0;
			clearTimeout(_clockTimeout);
			_clockTimeout = setTimeout(function() {
				_clockRate = 1;
			},5000);
			$game.$renderer.clearMapTile(data.x * $game.TILE_SIZE, data.y * $game.TILE_SIZE);
		} else if(data.item === 3) {
			//extra seeds
			$game.statusUpdate({message:'bonus seeds!',input:'status',screen: true,log:false});
			_numRegularSeeds += 3;
			$('.bossHud .regularSeedButton .hudCount').text(_numRegularSeeds);
			$game.$renderer.clearMapTile(data.x * $game.TILE_SIZE, data.y * $game.TILE_SIZE);
		}
	}
}

//load all cut scene videos up at start
function _loadVideo(num) {
	vid = document.createElement('video');
	if(CivicSeed.ENVIRONMENT === 'development') {
		vid.src = Modernizr.video.h264 ? _videoPath + num + '.mp4' :
			_videoPath + i + '.webm?VERSION=' + Math.round(Math.random(1) * 1000000000);
	} else {
		vid.src = Modernizr.video.h264 ? _videoPath + num + '.mp4?VERSION=' + CivicSeed.VERSION:
			_videoPath + i + '.webm?VERSION=' + CivicSeed.VERSION;
	}

	vid.load();
	vid.className = 'cutScene';
	vid.addEventListener('canplaythrough', function (e) {
		this.removeEventListener('canplaythrough', arguments.callee, false);
		_cutSceneVids.push(vid);
		num += 1;
		if(num < _numVideos) {
			_loadVideo(num);
		}
	},false);
	vid.addEventListener('error', function (e) {
		console.log('vid error');
	}, false);
}