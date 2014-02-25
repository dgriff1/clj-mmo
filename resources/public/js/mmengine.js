

function _game()
{
	window.Game = this;
	var self = this,
		w = window.Settings.BASE_WIDTH,
		h = window.Settings.BASE_HEIGHT,
		scale = 1,//snapValue(Math.min(w/BASE_WIDTH,h/BASE_HEIGHT),.5),
		ticks = 0,
		canvas,ctx,
		stage,
		world,
		hero,
		assets = [], spriteSheets = [];

	// utils
	self.utils = window.Utils;
        self.settings = window.Settings;
	self.RESOURCES = self.utils.RESOURCES;

	// canvas stuff
	self.width = w;
	self.height = h;
	self.scale = scale;

	// structure that keep track of player game world x and y
        self.playerGameCoords = {"_id" : self.playerID, "x" : 0, "y" : 0}

	// Players that need to be drawn
	self.playersToAdd       = [];

	// Players in our world
	self.currentPlayers     = new Array();

	// Data that needs to be drawn
	self.worldToAdd = [];

	self.heartBeatCounter = self.utils.now();
	self.assets = assets; // resource seets
	self.playerID = self.utils.fetchGetParm("id");
	self.wsUri = "ws://" + window.location.host + "/object/" + self.playerID; 
	self.testMode = false; 

	// Used for counting frames
	self.frameTimer = undefined;
	self.framesPerSecondCounter = 0;
	self.framesPerSecond = 0;

	// Used for tracking keys
	self.keyDown = 0; 
	self.keyPressed = [];

	// Used for automove
	self.clickedAt = [];
	self.autoMove = false;
	self.autoMoveX = 0;
	self.autoMoveY = 0;
	self.mouseDown = false;

	// Used to track game mouse
        self.clientMouseX = 0;
        self.clientMouseY = 0;

	// Used to track re-drawing
	self.worldOffsetX = 0;
	self.worldOffsetY = 0;
	self.lastSentMessage	= 0.00;
	self.lastPlayerMessage = self.utils.now();
	self.lastHandleMesssage = 0.00;
        self.lastFrame = self.utils.now();
	self.sorted = false;

	// targeting
	self.target = undefined;
	self.targetHudBox = undefined;
	self.targetArrow = undefined;
	self.targetArrowBounceCounter = 0;

	// action text
	self.actionTextTimer = self.utils.now();

	self.findDirection = function(filename, direction) {
		var sfilename = filename.split(".");
		var newfilename = '';
		for(var i in sfilename) {
			if(i == sfilename.length - 1) {
				return newfilename + direction.toLowerCase() + "." + sfilename[i];
			}
			if(i == sfilename.length - 2) {
				newfilename = newfilename + sfilename[i] + "_";
			}
			else {
				newfilename = newfilename + sfilename[i] + ".";
			}
		}
	}

	self.preloadResources = function() {
		for(key in self.RESOURCES) {
			if(!self.isPrefab(self.RESOURCES[key])) {
				// directional
				if('directional' in self.RESOURCES[key] && self.RESOURCES[key]['directional']) {
					self.loadImage(self.findDirection(self.RESOURCES[key]['image'], "right"));
					self.loadImage(self.findDirection(self.RESOURCES[key]['image'], "left"));
					self.loadImage(self.findDirection(self.RESOURCES[key]['image'], "up"));
					self.loadImage(self.findDirection(self.RESOURCES[key]['image'], "down"));
				}
				else {
					//standard
					self.loadImage(self.RESOURCES[key]['image']);
				}
			}
			else {
				for(fab in self.RESOURCES[key]['image']) {
					asset = self.RESOURCES[key]['image'][fab][2];
					self.loadImage(asset);
				}
			}
		}
	}

	self.requestedAssets = 0;
	self.loadedAssets = 0;

	self.isPrefab = function(obj) {
		if(typeof(obj['image']) != "string") {
			return true;
		}
		return false;
	}

	self.loadImage = function(e) {
		var img = new Image();
		img.onload = self.onLoadedAsset;
		img.src = e;

		self.assets[e] = img;

		++self.requestedAssets;
	}

	// Wait until first response fills our buffer
        self.checkAndInit = function() {
		if(self.playerAtProximity != undefined) {
			self.initializeGame();
			window.clearInterval(self.checkForInit)
		}
	}

	self.loadWebSocket = function() {
 		self.websocket = new WebSocket(self.wsUri);
		self.websocket.onopen = function(evt) { 
			self.onOpen(evt) ;
		}; 

		self.websocket.onclose = function(evt) { 
			self.onClose(evt) ;
		}; 

		self.websocket.onmessage = function(evt) { 
                        self.writeToBuffer(evt.data);
			self.onMessage(evt) ;
		}; 

		self.websocket.onerror = function(evt) { 
			self.showError();
			self.onError(evt);
		}; 

	}

	// Count all assets loaded.  Once all loaded start up websocket
	self.onLoadedAsset = function(e) {
		++self.loadedAssets;
		if ( self.loadedAssets == self.requestedAssets ) {
			logger("assets loaded");
			self.loadWebSocket();
			self.checkForInit = setInterval(function(){self.checkAndInit()},100);
		}
	}

	// Write first response to buffer to invoke init callback
        self.writeToBuffer = function(msg) {
		if(self.playerAtProximity != undefined) { return }
                msg = JSON.parse(msg);
                if(msg._id == self.playerID) { 		
			self.playerAtProximity = msg;
		}
	}

	self.onOpen = function(evt) { 
		logger("CONNECTED"); 
	} 

	self.onClose = function(evt) { 
		//if(self.playerGameCoords['_id'] === undefined) {
			self.hideLoader();
			self.showError("Disconnected");
		//}
		//else {
		//	self.loadWebSocket();	
		//}
		logger("DISCONNECTED"); 
	}  

	self.onMessage = function(evt) { 
                self.handleResponse(evt.data);
	}  

	self.onError = function(evt) { 
		self.showError();
		logger('ERROR: ' + evt.data); 
	}  

	self.doSend = function(message) {
		self.websocket.send(message); 
	}  

	self.formatMessage = function(message) {
		return {}
        }

	self.showError = function(msg) {
		//document.body.style.backgroundImage = "none";
		document.body.style.backgroundColor = "#111111";
		$(canvas).css("visibility", "hidden");
		$(document.getElementById("error")).removeAttr("style");
		$(document.getElementById("error")).html("<h1>" + msg + "</h1>");
	}

	self.showLoader = function() {
		//document.body.style.backgroundImage = "none";
		document.body.style.backgroundColor = "#111111";
		$(document.getElementById("loader")).show();
	}

	self.hideLoader = function() {
		//document.body.style.backgroundImage = "none";
		document.body.style.backgroundColor = "#111111";
		$(document.getElementById("loader")).hide();
		$(canvas).css("visibility", "visible");
	}

	self.initHero = function () { 
		self.hero = new Hero(self.RESOURCES['HERO']['spriteSheet']);
		if(self.settings.ENABLE_SHADOWS) {
			self.hero.shadow = new createjs.Shadow("#000000", 1, 5, 10);
		}
		self.hero.currentFrame = 1;
		self.hero._id = self.playerID;
		self.stopHeroAnimations(self.hero);
	}

	self.getMap = function() {
		self.drawMapLoader();
		logger("new map");
		self.doSend(JSON.stringify({"type"     : "proximity", 
                                            "location" : {"x" : self.playerGameCoords['x'],
                                                          "y" : self.playerGameCoords['y']}
                                           }));

		self.getMapOffsetX = self.playerGameCoords['x'] - self.playerAtProximity['location']['x'];
		self.getMapOffsetY = self.playerGameCoords['y'] - self.playerAtProximity['location']['y'];

		self.playerAtProximity['location']['x'] = self.playerGameCoords['x'];
		self.playerAtProximity['location']['y'] = self.playerGameCoords['y'];
	}


	self.initCanvas = function() {
		canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
		canvas.width =  self.settings.BASE_WIDTH;
		canvas.height = self.settings.BASE_HEIGHT;
		document.body.appendChild(canvas);
		textBox = document.createElement('textarea');
		textBox.value = "Player2: F U FGT ;) A/S/L\rPlayer1: LAAMLOLOL";
		document.body.appendChild(textBox);
		textBox = document.createElement('input');
		textBox.value = "Enter Text Here";
		document.body.appendChild(textBox);
		self.w  = self.utils.getWidth(canvas);
		self.h  = self.utils.getHeight(canvas);
		self.ratioW = self.w / self.settings.BASE_WIDTH;
		self.ratioH = self.h / self.settings.BASE_HEIGHT;	
	}
	
	self.initializeGame = function() {
		logger("Initialize Game");
		if(self.testMode) {
			return;
		}

		self.initCanvas();

		self.stage = new Stage(canvas);
		self.stage.enableMouseOver(20); 

		self.world = new Container();
		self.stage.addChild(self.world);

		self.utils.initializeSpriteSheets();

		self.initHero();

		self.reset();

		self.getMap();

		//Event override
		if ('ontouchstart' in document.documentElement) {
			canvas.addEventListener('touchstart', function(e) {
				self.handleKeyDown();
			}, false);

			canvas.addEventListener('touchend', function(e) {
				self.handleKeyUp();
			}, false);
		} else {
			window.onresize = self.handleResize;
			document.onkeydown = self.handleKeyDown;
			document.onkeyup = self.handleKeyUp;
			canvas.onmousedown = self.handleMouseDown;
			canvas.onmouseup = self.handleMouseUp;
			//canvas.onmousemove = self.handleMouseMove;
		}
		
		
		createjs.Ticker.setFPS(self.settings.FPS_RATE);
		createjs.Ticker.addEventListener("tick", function() { self.tick();  });
		canvas.addEventListener("mousemove", function(e) { self.handleMouseMove(e);  });
		createjs.Ticker.useRAF = true;
	}

	self.getWorldByType = function(type) {
		var data = [];
		for(var each in self.worldToAdd) {
			if(self.worldToAdd[each]['type'] == type) {
				data.push(self.worldToAdd[each]);
			}
		}
		return data;
	}

	self.sortWorldType = function(data, type) {
		if(type == self.utils.TERRAIN) {
			data = data.sort(function(a, b) { if(a['location']['x'] < b['location']['x']) { return 1; }  return -1; });
			data = data.sort(function(a, b) { if(a['location']['y'] > b['location']['y']) { return 1; }  return -1; });
			data = data.reverse();
		}
		if(type == self.utils.ENTITY) {
			data = data.sort(function(a, b) { if(a['location']['x'] < b['location']['x']) { return 0; } return -1 });
			data = data.sort(function(a, b) { if(a['location']['y'] > b['location']['y']) { return -1; }  return 1 });
		}
		return data
	}

	self.sortWorldData = function() {

		var sortableTerrain = self.getWorldByType(self.utils.TERRAIN);
		sortableTerrain = self.sortWorldType(sortableTerrain, self.utils.TERRAIN);

		var sortableEntity = self.getWorldByType(self.utils.ENTITY);
		sortableEntity = self.sortWorldType(sortableEntity, self.utils.ENTITY);

		self.worldToAdd = sortableTerrain.concat(sortableEntity);
	}

	self.handleResponse = function(data) {
		data = JSON.parse(data);
		var dataLength = data.length;
		if(dataLength === undefined) {
                	if(data.type == self.utils.PLAYER) {
				if(data._id != self.playerID) {
					if(self.currentPlayers[data['_id']] === undefined) {
						self.playersToAdd.push(data);
					}
					else {
						self.movePlayer(data);
					}
				}
				if(self.stage != undefined) {
					self.stage.update();
				}
                	        return;
			}
		}
		else {
			self.worldToAdd = data;
			self.lastHandleMessage = self.utils.now();
			self.sorted = false;
		}
	}

	self.gameToWorldPosition = function(objX, objY) {
		var heroX = w/2 - ((self.RESOURCES['HERO']['width'])/2);
		var heroY = h/2 - ((self.RESOURCES['HERO']['height'])/2);
		var wx = heroX + ((self.playerGameCoords['x'] - objX ));
		var wy = heroY + ((self.playerGameCoords['y'] - objY ));
		return [wx, wy]
	}

	self.worldToGamePosition = function(X, Y) {
		var heroX = w/2 - ((self.RESOURCES['HERO']['width'])/2);
		var heroY = h/2 - ((self.RESOURCES['HERO']['height'])/2);
		var wx = X - heroX;
		var wy = Y - heroY;
		var rx = self.playerGameCoords['x'] - wx;
		var ry = self.playerGameCoords['y'] - wy;
		return [rx, ry]
	}

	self.pixelToGame = function(X, Y) {
		self.ratioW = self.w / self.settings.BASE_WIDTH;
		self.ratioH = self.h / self.settings.BASE_HEIGHT;	
		var dx = parseInt((parseInt(X) / self.ratioW));
		var dy = parseInt((parseInt(Y) / self.ratioH));
		return [dx, dy]
	}

	self.addWidgetToWorld = function(x, y, image, resourceType, _id, preHero) {
		if(preHero != undefined && preHero) {
			hx = w/2 - ((self.RESOURCES['HERO']['width'])/2);
			hy = h/2 - ((self.RESOURCES['HERO']['height'])/2);
			var pos = self.gameToWorldPosition(x, y);
		}
		else {
			var pos = self.gameToWorldPosition(x, y);
		}
		if(typeof(image) == "string") {
			self.addWidget(pos[0], pos[1], self.assets[image], resourceType, _id);
		}
		else {
			for(each in image) {
				res = resource[each];
				self.addWidget(pos[0] + res[0], pos[1] + res[1], res[2], resourceType, _id);
			}
		}
	}


	self.addPlayersToWorld = function() {
 		for(var player in self.currentPlayers) {
			var aPlayer = self.currentPlayers[player];
			var loc = self.gameToWorldPosition(aPlayer.realX, aPlayer.realY);
			aPlayer.x = loc[0];
			aPlayer.y = loc[1];
			self.world.addChild(aPlayer);
		}
		self.addOurHeroToWorld();
	 	self.checkToAddPlayers();
	}

	self.resetWorld = function() {
		self.world.removeAllChildren();
		self.world.x = self.world.y = 0;
		self.worldOffsetX = 0;
		self.worldOffsetY = 0;
	}

	self.draw = function() {
		self.hideLoader();	
		self.resetWorld();

		self.entities = new Array();

		for(var each = 0; each < self.worldToAdd.length; each++) {
			if(self.worldToAdd[each] === undefined) {
				continue;
			}
			var _id = self.worldToAdd[each]['_id'];
			var x = self.worldToAdd[each]['location']['x'];
			var y = self.worldToAdd[each]['location']['y'];
			if('direction' in self.worldToAdd[each]) {
				var imageToLoad = self.findDirection(self.RESOURCES[self.worldToAdd[each]['resource']]['image'], self.worldToAdd[each]['direction']);
				self.addWidgetToWorld(x, y, imageToLoad, self.worldToAdd[each]['type'], _id, false);
			}
			else {
				self.addWidgetToWorld(x, y, self.RESOURCES[self.worldToAdd[each]['resource']]['image'], self.worldToAdd[each]['type'], _id, false);
			}
		}
		self.addPlayersToWorld();
		self.removeMapLoader();
		self.stage.update();

	}

	self.drawMapLoader = function() {
		var img = new Bitmap('/assets/clock.png');
		img.x = self.settings.BASE_WIDTH/2 - 15;	
		img.y = 40;
		self.stage.addChild(img);
		self.loadingClock = img;
	}

	self.removeMapLoader = function() {
		self.stage.removeChild(self.loadingClock);
	}

	self.drawHud = function() {

 		// SELF BOX
    		selfBox = new createjs.Shape();
		selfBox.graphics.beginStroke("#000000");
		selfBox.graphics.setStrokeStyle(1);
		selfBox.snapToPixel = true;
    		selfBox.graphics.beginFill("white").drawRect(0, 0, 50, 80);
    		selfBox.x = 10;
		selfBox.y = self.settings.BASE_HEIGHT/2 + 50;
    		self.stage.addChild(selfBox);
	
		// hero left
		var img = new Sprite(self.RESOURCES['HERO']['spriteSheet']);
		img.gotoAndStop("down");
		img.x = 3;
		img.y = self.settings.BASE_HEIGHT/2 + 50;
		img.width = 64;
		img.height = 64;
		self.stage.addChild(img);

 		// TARGET BOX
    		selfBox = new createjs.Shape();
		selfBox.graphics.beginStroke("#000000");
		selfBox.graphics.setStrokeStyle(1);
		selfBox.snapToPixel = true;
    		selfBox.graphics.beginFill("white").drawRect(0, 0, 50, 80);
    		selfBox.x = self.settings.BASE_WIDTH - 60;
		selfBox.y = self.settings.BASE_HEIGHT/2 + 50;
    		self.stage.addChild(selfBox);

		// hero right
		img = new Sprite(self.RESOURCES['HERO']['spriteSheet']);
		img.gotoAndStop("down");
		img.x = self.settings.BASE_WIDTH - 68;
		img.y = self.settings.BASE_HEIGHT/2 + 50;
		img.width = 64;
		img.height = 64;
		self.targetHudBox = img;
		self.stage.addChild(img);

		//conditions
		for(c = 0; c < 5; c = c + 1) {
    			need = new createjs.Shape();
			need.graphics.beginStroke("#000000");
			need.graphics.setStrokeStyle(1);
			need.snapToPixel = true;
    			need.graphics.beginFill("white").drawCircle(0, 0, 10);
    			need.x = self.settings.BASE_WIDTH - (17 + (c*25));
			need.y = 14;
    			self.stage.addChild(need);
		}
		// needs
		for(n = 0; n < 5; n = n + 1) {
    			need = new createjs.Shape();
			need.graphics.beginStroke("#000000");
			need.graphics.setStrokeStyle(1);
			need.snapToPixel = true;
    			need.graphics.beginFill("white").drawRect(0, 0, 20, 20);
    			need.x = self.settings.BASE_WIDTH - (27 + (n*25));
			need.y = 32;
    			self.stage.addChild(need);
		}
	
		// hot keys
		for(hot = 0; hot < 5; hot = hot + 1) {
			if(hot == 0) {
				selfBox = new Bitmap('/assets/axe.gif');
				selfBox.y = self.settings.BASE_HEIGHT - 20;
    				selfBox.x = 320 + (40 + (hot*25));
			}
			else {
    				selfBox = new createjs.Shape();
				selfBox.graphics.beginStroke("#000000");
				selfBox.graphics.setStrokeStyle(1);
    				selfBox.graphics.beginFill("white").drawCircle(0, 0, 10);
				selfBox.y = self.settings.BASE_HEIGHT - 10;
    				selfBox.x = 330 + (40 + (hot*25));
			}
			selfBox.snapToPixel = true;
   	 		self.stage.addChild(selfBox);
		}
    		self.stage.update();
		// chat box
    		//selfBox = new createjs.Shape();
		//selfBox.graphics.beginStroke("#000000");
		//selfBox.graphics.setStrokeStyle(1);
		//selfBox.snapToPixel = true;
    		//selfBox.graphics.beginFill("black").drawRect(0, 0, 180, 60);
    		//selfBox.x = 90;
		//selfBox.y = BASE_HEIGHT/2 + 80;
    		//stage.addChild(selfBox);

		//textInfo = new createjs.Text("Player2:", "12px sans-serif", "#FF0000");
 		//textInfo.x = 100;
 		//textInfo.y = BASE_HEIGHT/2 + 100;
		//textInfo.textBaseline = "alphabetic";
		//stage.addChild(textInfo);

		//textInfo = new createjs.Text("A/S/L ;) LOL", "12px sans-serif", "#0000FF");
 		//textInfo.x = 160;
 		//textInfo.y = BASE_HEIGHT/2 + 100;
		//textInfo.textBaseline = "alphabetic";
		//stage.addChild(textInfo);


		//text = new createjs.Text("FPS: ", "20px Arial", "#FFFFFF");
 		//text.x = 5;
 		//text.y = 30;
		//text.textBaseline = "alphabetic";
		//stage.addChild(text);
	}

	// Sets up world and widgets, called first before tick
	self.reset = function() {
		self.resetWorld();

		self.drawHud();

		self.initPlayerPosition(self.playerAtProximity['location']['x'], self.playerAtProximity['location']['y']);

	}

	self.addOurHeroToWorld = function() {
		self.hero.x = self.settings.BASE_WIDTH/2 - ((self.RESOURCES['HERO']['width'])/2);
		self.hero.y = self.settings.BASE_HEIGHT/2 - ((self.RESOURCES['HERO']['height'])/2);
		//self.hero.wasMoving = false;
		self.hero.centerPlayerX = parseInt(self.hero.x) + parseInt(self.RESOURCES['HERO']['width'] / 2);
		self.hero.centerPlayerY = parseInt(self.hero.y) + parseInt(self.RESOURCES['HERO']['height'] / 2);
		self.world.addChild(self.hero);
	}

	self.doAnimation = function(hero, animation)
	{
		hero.animation = animation;
		if(!hero.wasMoving)
		{
			hero.gotoAndPlay(animation);
			hero.wasMoving = true;
		}
	}

       self.stopHeroAnimations = function(hero) 
	{
		hero.currentFrame = 48;
		hero.gotoAndStop('down');
		//hero.gotoAndPlay('idle');
		self.stage.update();
	}

	self.sortPlayerInWorld = function(player) {
		if(self.entities != undefined) {
			for(e in self.entities) {
				eObj = self.entities[e];
				eObj.height = eObj.image.height;
				eObj.width = eObj.image.width;

				player.width = self.RESOURCES['HERO']['width'];
				player.height = self.RESOURCES['HERO']['height'];

				altPlayer = new Object()
				altPlayer.x = player.centerPlayerX;
				altPlayer.y = player.centerPlayerY;
				self.hero.centerPlayerX = parseInt(self.hero.x) + parseInt(self.RESOURCES['HERO']['width'] / 2);
				self.hero.centerPlayerY = parseInt(self.hero.y) + parseInt(self.RESOURCES['HERO']['height'] / 2);
				altPlayer.height = player.height;
				altPlayer.width = player.width;

				overlap = (self.utils.calculateIntersection(eObj, altPlayer));

				objID = (self.world.getChildIndex(eObj));
				pID = (self.world.getChildIndex(player));

				if(overlap) {	
					if(eObj.y + eObj.height - (player.height/2) < player.centerPlayerY && pID < objID) {
						self.world.swapChildren(eObj, player);
					}
					else if(eObj.y + eObj.height - (player.height/2) > player.centerPlayerY && pID > objID) {
						self.world.swapChildren(eObj, player);
					}
				}
			}
		}
	}

	// sets up initial location based on first message
	self.initPlayerPosition = function(x, y) {
		self.world.x = self.world.x + x;
		self.world.y = self.world.y + y;

		self.hero.x = self.hero.x - x;
		self.hero.y = self.hero.y - y;
	
		if(self.targetArrow != undefined) {
			self.targetArrow.x = self.targetArrow.x + x;
			self.targetArrow.y = self.targetArrow.y + y;
		}

		self.hero.centerPlayerX = parseInt(self.hero.x) + parseInt(self.RESOURCES['HERO']['width'] / 2);
		self.hero.centerPlayerY = parseInt(self.hero.y) + parseInt(self.RESOURCES['HERO']['height'] / 2);

		self.sortPlayerInWorld(self.hero);

		self.worldOffsetX = self.worldOffsetX - x;
		self.worldOffsetY = self.worldOffsetY - y;

                self.playerGameCoords['x'] = self.playerGameCoords['x'] + x ;
                self.playerGameCoords['y'] = self.playerGameCoords['y'] + y ;

		self.sendPlayerState();
		self.stage.update();

	}

	// Moved world around player while moving players actual coords
	self.moveHero = function(x, y) 
	{	
    		//need = new createjs.Shape();
		//need.graphics.beginStroke("#000000");
		//need.graphics.setStrokeStyle(1);
		//need.snapToPixel = true;
    		//need.graphics.beginFill("white").drawCircle(0, 0, 2);
    		//need.x = hero.x - self.worldOffsetX;
    		//need.y = hero.y - self.worldOffsetY;
    		//stage.addChild(need);

    		//need = new createjs.Shape();
		//need.graphics.beginStroke("#000000");
		//need.graphics.setStrokeStyle(1);
		//need.snapToPixel = true;
    		//need.graphics.beginFill("red").drawCircle(0, 0, 2);
    		//need.x = hero.centerPlayerX - self.worldOffsetX;
		//need.y = hero.centerPlayerY - self.worldOffsetY;
    		//stage.addChild(need);

		self.initPlayerPosition(x, y);

		// need to make a circle calculation
		if(self.playerGameCoords['x'] > self.playerAtProximity['location']['x'] + self.settings.NEW_AREA_WIDTH ||  
			self.playerGameCoords['x'] < self.playerAtProximity['location']['x'] - self.settings.NEW_AREA_WIDTH  || 
			self.playerGameCoords['y'] > self.playerAtProximity['location']['y'] + self.settings.NEW_AREA_HEIGHT  ||
			self.playerGameCoords['y'] < self.playerAtProximity['location']['y'] - self.settings.NEW_AREA_HEIGHT ) {
			self.getMap();
		} 
	}

	// Adds new player to world
	self.addNewPlayerToWorld = function(id, heroLocation) {
		newHero = new Hero(self.RESOURCES['HERO']['spriteSheet']);
		newHero._id  = id;
		newHero.type = self.utils.PLAYER;
		newHero.currentFrame = 1;
		loc = self.gameToWorldPosition(heroLocation.x, heroLocation.y);
		newHero.x = loc[0];
		newHero.y = loc[1];
		newHero.realX = heroLocation.x;
		newHero.realY = heroLocation.y;
		newHero.wasMoving = false;	
		newHero.direction = undefined;
		if(self.settings.ENABLE_SHADOWS) {
             		newHero.shadow = new createjs.Shadow("#000000", 1, 5, 10);	
		}
		newHero.reset();
		self.currentPlayers[id] = newHero;
		self.sortPlayerInWorld(newHero);
		newHero.gotoAndStop("down");
		self.world.addChild(newHero);
	}

	// Checks to see if others players need to be added to our world
	self.checkToAddPlayers = function() {
		for(each in self.playersToAdd) {
			if(self.currentPlayers[self.playersToAdd[each]['_id']] === undefined) {
				self.addNewPlayerToWorld(self.playersToAdd[each]['_id'], self.playersToAdd[each]['location']);
				self.playersToAdd.splice(each);
			}
		}
	}

	self.movePlayer = function(msg) {
		for(count in self.currentPlayers) {
			obj = self.currentPlayers[count];
			if(obj._id != undefined && obj._id == msg._id) {
				if(!obj.wasMoving) {
					obj.gotoAndPlay(msg.location.direction);
					obj.wasMoving = true;
				}
				else if(obj.direction != undefined && obj.direction != msg.location.direction) {
					obj.gotoAndPlay(msg.location.direction);
					
				}
				obj.direction = msg.location.direction;
				self.lastPlayerMessage = self.utils.now();
				obj.lastMovement = self.utils.now();
				loc = msg.location;
				loc = self.gameToWorldPosition(loc.x, loc.y);
				obj.x = loc[0] + self.worldOffsetX;
				obj.y = loc[1] + self.worldOffsetY;
				obj.realX = msg.location.x;
				obj.realY = msg.location.y;
				obj.centerPlayerX = loc[0] + (self.RESOURCES["HERO"]["width"]/2);
				obj.centerPlayerY = loc[1] + (self.RESOURCES["HERO"]["height"]/2);

				self.sortPlayerInWorld(self.currentPlayers[count]);
				break;
			}
		}	
	}

	self.calculateFramesPerSecond = function() {
		self.framesPerSecondCounter = self.framesPerSecondCounter + 1;
                if(self.frameTimer === undefined)
		{
                	self.frameTimer = self.utils.now();
		}
		nextTimer = self.utils.now();
		if(nextTimer - self.frameTimer > 1)
		{
                        self.framesPerSecond = self.framesPerSecondCounter - 1;
                        for(children in self.stage.children) {
				if(self.stage.children[children].text != undefined) {
					if(self.stage.children[children].text.indexOf("FPS") !== -1) {
						self.stage.children[children].text = "FPS: " + self.framesPerSecond;
						self.stage.update();
					}
				}
			}
			self.framesPerSecondCounter = 0;
			self.frameTimer = nextTimer;
		}
		return self.framesPerSecondCounter;
	}

	self.resetPlayerAnimations = function() {
		if(self.utils.now() - self.lastPlayerMessage > 0.2
		&& self.utils.now() - self.heartBeatCounter > 0.2) {
			for(each in self.currentPlayers) {
				if(self.currentPlayers[each].wasMoving 
					&& self.utils.now() - self.currentPlayers[each].lastMovement > 0.2) {
					self.currentPlayers[each].wasMoving = false;
					self.currentPlayers[each].gotoAndStop("down");
				}
			}
		}
	}

	self.drawWorldData = function() {
		if(!self.sorted && self.utils.now() - self.lastHandleMessage > self.settings.MESSAGE_INTERVAL) {
			self.sortWorldData();	
			//self.settings.MESSAGE_INTERVAL = self.settings.MESSAGE_INTERVAL + 10000.00;
			self.draw();
			self.lastHandleMessage = 0.00;
			self.sorted = true;
			self.worldToAdd = [];
			self.sortPlayerInWorld(self.hero);
			if(self.clickedAt.length > 0) {
				self.clickedAt[0] = self.clickedAt[0] - self.getMapOffsetX;
				self.clickedAt[1] = self.clickedAt[1] - self.getMapOffsetY;
			}
		}
	}

	self.webSocketHeartBeat = function() {
		if(self.utils.now() - self.heartBeatCounter > self.settings.HEARTBEART) {
			self.heartBeatCounter = self.utils.now();
			self.sendPlayerState();
		}
	}

	self.updateActionText = function() {
		if(self.utils.now() - self.actionTextTimer > 0.025) {

			self.actionTextTimer = self.utils.now();
			for(each in self.stage.children) {
				if("actionText" in self.stage.children[each]) {	
					self.stage.children[each].y = self.stage.children[each].y + 3;	
					if(self.stage.children[each].y > 200) {
						self.stage.removeChild(self.stage.children[each]);
					}
					self.stage.update();
				}
			}
		}
	}

	self.tick = function(e)
	{
		//self.calculateFramesPerSecond();

		self.resetPlayerAnimations();
		self.drawWorldData();
		self.webSocketHeartBeat();
		self.updateActionText();

                if(self.mouseDown && self.clickedAt.length == 0)
                { 
			direction = self.utils.directionMouse(self.settings.MOVEMENT_SPEED, self.hero);
			xDirection = direction[0];
			yDirection = direction[1];
			self.moveHero(xDirection * (self.utils.now() - self.lastFrame), yDirection * (self.utils.now() - self.lastFrame));
			
		}
		if(self.keyPressed.length != []) {
			self.clickedAt = [];
			self.autoMove = false;
			direction = self.utils.directionKeys(self.settings.MOVEMENT_SPEED, self.hero);
			xDirection = direction[0];
			yDirection = direction[1];
			if(xDirection != 0 || yDirection != 0) {
				self.moveHero(xDirection * (self.utils.now() - self.lastFrame), yDirection * (self.utils.now() - self.lastFrame));
			}
		}
		if(self.hero.wasMoving && !self.mouseDown && self.keyPressed.length < 1)
		{	
			if(self.clickedAt.length == 0) {
				self.logPlayerClick(direction);
			}
			self.utils.autoMoveHero(self.hero);
		}

        	self.lastFrame = self.utils.now();
		ticks++;
		
	}


	self.logPlayerClick = function(direction) {
		self.clickedAt = [self.clientMouseX, self.clientMouseY, direction[0], direction[1]];
	}
	
	self.doPlayerAction = function(action, target_id) {
			self.doSend(JSON.stringify({    "action"  : action, 
							"target"  : target_id}));
	}

	self.sendPlayerState = function() {
		if(self.utils.now() - self.lastSentMessage > self.settings.UPDATE_RATE) {
			self.doSend(JSON.stringify({    "name"      : "player", 
							"action"    : "move", 
							"target_x"  : self.playerGameCoords['x'], 
							"target_y"  : self.playerGameCoords['y'],
                                                        "direction" : self.hero.animation}));
			self.lastSentMessage = self.utils.now();
		}
	}

	self.animateStateText = function(msg, tx, ty, color) {
		textInfo = new createjs.Text(msg, "1.2em sans-serif", color);
		textInfo.actionText = true;
		textInfo.x = tx - self.worldOffsetX;
		textInfo.y = ty - self.worldOffsetY;
		textInfo.textBaseline = "alphabetic";
		self.stage.addChild(textInfo);
		self.stage.update();
	}

	self.chop = function() {
		overlap = (self.utils.rectIntersection(self.hero, self.target));
		if(overlap) {
			if(self.target.type == self.utils.ENTITY) {
				self.doPlayerAction("chop", self.target._id);	
				textSize = 40;
				self.animateStateText("+10 wood", self.target.x + (self.target.image.width/2)-textSize, self.target.y, "#00FF00");
			}
		}
	}	

	self.highlightObject = function(img) {
		var matrix = new ColorMatrix(50);
		var filter = new createjs.ColorMatrixFilter(matrix);		
		img.filters = [filter];
		img.cache(0, 0, img.image.width, img.image.height);
		self.stage.update();
	}

	self.removeHighlightObject = function(img) {
		img.filters = [];
		img.cache(0, 0, img.image.width, img.image.height);
		self.stage.update();
	}

	self.targetObject = function(obj) {
		target_x = self.targetHudBox.x;
		target_y = self.targetHudBox.y;

		if(self.targetArrow != undefined) {
			self.stage.removeChild(self.targetArrow);
		}
		targetArrow = new Bitmap('/assets/target.png');
		targetArrow.x = obj.target.x - self.worldOffsetX + (obj.target.image.width/2) - (32/2);
		targetArrow.y = obj.target.y - self.worldOffsetY;
		self.stage.addChild(targetArrow);
		self.targetArrow = targetArrow;

		self.stage.removeChild(self.targetHudBox);
		targetImg = new Bitmap(obj.target.image.src);
		targetImg.x = target_x;
		targetImg.y = target_y;
		self.stage.addChild(targetImg);
		targetImg.scale = 0.3;
		self.targetHudBox = targetImg;
		self.target = obj.target;
		self.stage.update();
			
	}

	self.addWidget = function(x,y,image,type, _id) {
		var img = new Bitmap(image);
		x = Math.round(x);
		y = Math.round(y);

		img.x = x;
		img.y = y;
		if(!self.testMode) {
		//	img.width = img.image.width;
		//	img.height = img.image.height;
		}
		img.snapToPixel = true;
                img.type = type;
		img._id = _id;

		// mouseover effects
		if(type == self.utils.ENTITY) {	
			img.addEventListener("mouseover", function(data) { 
				img = (data.target);
				self.highlightObject(img);
			});
			img.addEventListener("mouseout", function(data) { 
				img = (data.target);
				self.removeHighlightObject(img);
			} );
			img.addEventListener("mousedown", function(data) { 
				self.targetObject(data);
			 } );
		}

		self.world.addChild(img);
		//img.cache(x, y, 64, 64);
		if(type == self.utils.ENTITY) {	
			self.entities.push(img);
			if(self.settings.ENABLE_SHADOWS) {
             	   		img.shadow = new createjs.Shadow("#000000", 1, 2, 10);	
			}
		}
	}

        self.handleMouseMove = function(e)
	{
                self.clientMouseX = e.offsetX || e.layerX; // layerX for FF
                self.clientMouseY = e.offsetY || e.layerY; // layerY for FF	
	}

	self.makeDOMUnselect = function() {
		document.getElementById('page').setAttribute('class', 'unselectable');
		document.getElementById('page').removeAttribute('class');
		
		// the opera way
		document.getElementById('canvas_id').setAttribute('unselectable', 'on');
		document.getElementById('canvas_id').removeAttribute('unselectable');
		
		// the onselectstart way for navigator.appName === "Microsoft Internet Explorer"
		document.onselectstart = function() { if (dragging) return false; };

	}

	self.actionBar1 = function() {
		self.chop();
	}

        self.handleMouseDown = function(e)
	{
		if(self.autoMove) {
			self.autoMove = false;
			self.clickedAt = [];
		}
		if ( !self.mouseDown ) {
			self.mouseDown = true;
		}
	}

        self.handleMouseUp  = function(e)
	{
		self.mouseDown = false;
	}

	self.handleKeyDown = function(e)
	{
		if(e.keyCode == self.utils.oneKey) {
			self.actionBar1();
		}
		self.keyDown = self.keyDown + 1;
		if(self.keyPressed.indexOf(e.keyCode) == -1) {
			self.keyPressed.push(e.keyCode);
		}
	}

	self.handleKeyUp = function(e)
	{
		self.keyDown = 0;
		if(self.keyPressed.length > 1) {
			self.keyPressed = [];
		}
		else {
			self.keyPressed.pop(e.keyCode);
		}
	}

	self.handleResize = function(e) {
		self.w  = self.utils.getWidth(canvas);
		self.h  = self.utils.getHeight(canvas);
		self.ratioW = self.w / self.settings.BASE_WIDTH;
		self.ratioH = self.h / self.settings.BASE_HEIGHT;	
	}

	self.preloadResources();
};

new _game();
