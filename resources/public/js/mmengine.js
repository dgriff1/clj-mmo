var	playerID = fetchGetParm("id");
var	wsUri = "ws://" + window.location.host + "/object/" + playerID; 

loadSettings();

function _game()
{
	window.Game = this;
	var self = this,
		w = BASE_WIDTH,
		h = BASE_HEIGHT,
		scale = 1,//snapValue(Math.min(w/BASE_WIDTH,h/BASE_HEIGHT),.5),
		ticks = 0,
		canvas,ctx,
		stage,
		world,
		hero,
		assets = [], spriteSheets = [],
		parallaxObjects = [],
		mouseDown = false;

	// canvas stuff
	self.width = w;
	self.height = h;
	self.scale = scale;

	// structure that keep track of player game world x and y
        self.playerGameCoords = {"_id" : playerID, "x" : 0, "y" : 0}

	// Players that need to be drawn
	self.playersToAdd       = new Array();

	// Players in our world
	self.currentPlayers     = new Array();

	// Data that needs to be drawn
	self.worldToAdd = [];

	self.assets = assets; // resource seets
        self.playerID = playerID;
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

	// Used to track game mouse
        self.clientMouseX = 0;
        self.clientMouseY = 0;
	self.mouseModX = 0;
	self.mouseModY = 0;

	// Used to track re-drawing
	self.lastSentMessage	= 0.00;
	self.lastHandleMesssage = 0.00;
	self.sorted = false;

	self.preloadResources = function() {
		for(key in RESOURCES) {
			if(!self.isPrefab(RESOURCES[key])) {
				self.loadImage(RESOURCES[key]['image']);
			}
			else {
				for(fab in RESOURCES[key]['image']) {
					asset = RESOURCES[key]['image'][fab][2];
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

	// Count all assets loaded.  Once all loaded start up websocket
	self.onLoadedAsset = function(e) {
		++self.loadedAssets;
		if ( self.loadedAssets == self.requestedAssets ) {
			logger("assets loaded");
 			self.websocket = new WebSocket(wsUri);
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
		logger("DISCONNECTED"); 
	}  

	self.onMessage = function(evt) { 
                self.handleResponse(evt.data);
	}  

	self.onError = function(evt) { 
		logger('ERROR: ' + evt.data); 
	}  

	self.doSend = function(message) {
		self.websocket.send(message); 
	}  

	self.formatMessage = function(message) {
		return {}
        }

	self.showError = function() {
		//document.body.style.backgroundImage = "none";
		document.body.style.backgroundColor = "#111111";
		$(canvas).css("visibility", "hidden");
		$(document.getElementById("error")).show();
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
		hero = new Hero(RESOURCES['HERO']['spriteSheet']);
		if(ENABLE_SHADOWS) {
			hero.shadow = new createjs.Shadow("#000000", 1, 5, 10);
		}
		hero.currentFrame = 1;
		hero._id = playerID;
		self.stopHeroAnimations(hero);
	}

	self.getMap = function() {
		logger("new map");
		self.doSend(JSON.stringify({"type"     : "proximity", 
                                            "location" : {"x" : self.playerGameCoords['x'],
                                                          "y" : self.playerGameCoords['y']}
                                           }));
		self.playerAtProximity['location']['x'] = self.playerGameCoords['x'];
		self.playerAtProximity['location']['y'] = self.playerGameCoords['y'];
	}


	self.initCanvas = function() {
		canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
		canvas.width = BASE_WIDTH;
		canvas.height = BASE_HEIGHT;
		document.body.appendChild(canvas);
		self.w  = getWidth(canvas);
		self.h  = getHeight(canvas);
		self.ratioW = self.w / BASE_WIDTH;
		self.ratioH = self.h / BASE_HEIGHT;	
	}
	
	self.initializeGame = function() {
		logger("Initialize Game");
		if(self.testMode) {
			return;
		}

		self.initCanvas();

		stage = new Stage(canvas);

		world = new Container();
		stage.addChild(world);
	
		initializeSpriteSheets();

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
		
		
		createjs.Ticker.setFPS(FPS_RATE);
		createjs.Ticker.addEventListener("tick", function() { self.tick();  });
		canvas.addEventListener("mousemove", function(e) { self.handleMouseMove(e);  });
		createjs.Ticker.useRAF = true;
	}

	self.getWorldByType = function(type) {
		data = [];
		for(each in self.worldToAdd) {
			if(self.worldToAdd[each]['type'] == type) {
				data.push(self.worldToAdd[each]);
			}
		}
		return data;
	}

	self.sortWorldType = function(data, type) {
		if(type == TERRAIN) {
			data = data.sort(function(a, b) { if(a['location']['x'] < b['location']['x']) { return 1; }  return -1; });
			data = data.sort(function(a, b) { if(a['location']['y'] > b['location']['y']) { return 1; }  return -1; });
			data = data.reverse();
		}
		if(type == ENTITY) {
			data = data.sort(function(a, b) { if(a['location']['x'] < b['location']['x']) { return 0; } return -1 });
			data = data.sort(function(a, b) { if(a['location']['y'] > b['location']['y']) { return -1; }  return 1 });
		}
		return data
	}

	self.sortWorldData = function() {

		sortableTerrain = self.getWorldByType(TERRAIN);
		sortableTerrain = self.sortWorldType(sortableTerrain, TERRAIN);

		sortableEntity = self.getWorldByType(ENTITY);
		sortableEntity = self.sortWorldType(sortableEntity, ENTITY);

		self.worldToAdd = sortableTerrain.concat(sortableEntity);
	}

	self.handleResponse = function(data) {
		data = JSON.parse(data);
		dataLength = data.length;
		if(dataLength === undefined) {
                	if(data.type == PLAYER) {
				if(data._id != playerID) {
					if(self.currentPlayers[data._id] === undefined) {
						self.playersToAdd[data._id] = data;	
					}
					else {
						self.movePlayer(data);
					}
				}
				if(stage != undefined) {
					stage.update();
				}
                	        return;
			}
		}
		else {
			self.worldToAdd = data;
			self.lastHandleMessage = now();
			self.sorted = false;
		}
	}

	self.gameToWorldPosition = function(objX, objY) {
		heroX = w/2 - ((RESOURCES['HERO']['width'])/2);
		heroY = h/2 - ((RESOURCES['HERO']['height'])/2);
		wx = heroX + ((self.playerGameCoords['x'] - objX ));
		wy = heroY + ((self.playerGameCoords['y'] - objY ));
		return [wx, wy]
	}

	self.worldToGamePosition = function(X, Y) {
		heroX = w/2 - ((RESOURCES['HERO']['width'])/2);
		heroY = h/2 - ((RESOURCES['HERO']['height'])/2);
		wx = X - heroX;
		wy = Y - heroY;
		rx = self.playerGameCoords['x'] - wx;
		ry = self.playerGameCoords['y'] - wy;
		return [rx, ry]
	}

	self.pixelToGame = function(X, Y) {
		self.ratioW = self.w / BASE_WIDTH;
		self.ratioH = self.h / BASE_HEIGHT;	
		dx = parseInt((parseInt(X) / self.ratioW));
		dy = parseInt((parseInt(Y) / self.ratioH));
		return [dx, dy]
	}

	self.addWidgetToWorld = function(x, y, image, resourceType, preHero) {
		if(preHero != undefined && preHero) {
			hx = w/2 - ((RESOURCES['HERO']['width'])/2);
			hy = h/2 - ((RESOURCES['HERO']['height'])/2);
			pos = self.gameToWorldPosition(x, y);
		}
		else {
			pos = self.gameToWorldPosition(x, y);
		}
		if(typeof(image) == "string") {
			self.addWidget(pos[0], pos[1], self.assets[image], resourceType);
		}
		else {
			for(each in image) {
				res = resource[each];
				self.addWidget(pos[0] + res[0], pos[1] + res[1], res[2], resourceType);
			}
		}
	}


	self.addPlayersToWorld = function() {
		logger(self.currentPlayers);
		logger(self.playersToAdd);
 		for(player in self.currentPlayers) {
			aPlayer = self.currentPlayers[player];
			loc = self.gameToWorldPosition(aPlayer.realX, aPlayer.realY);
			aPlayer.x = loc[0];
			aPlayer.y = loc[1];
			world.addChild(aPlayer);
		}
		self.addOurHeroToWorld();
	 	self.checkToAddPlayers();

	}

	self.resetWorld = function() {
		world.removeAllChildren();
		world.x = world.y = 0;
		self.mouseModX = 0;
		self.mouseModY = 0;
	}

	self.draw = function() {
		self.hideLoader();	
		self.resetWorld();

		self.entities = new Array();

		for(var each = 0; each < self.worldToAdd.length; each++) {
			if(self.worldToAdd[each] === undefined) {
				continue;
			}
			x = self.worldToAdd[each]['location']['x'];
			y = self.worldToAdd[each]['location']['y'];
			self.addWidgetToWorld(x, y, RESOURCES[self.worldToAdd[each]['resource']]['image'], self.worldToAdd[each]['type'], false);
		}
		self.addPlayersToWorld();
		stage.update();

	}

	self.drawHud = function() {
		//textInfo = new createjs.Text("Project: Mankraft v0.0.2", "20px Arial", "#FFFFFF");
		//textInfo.onMouseMove = function(e) { alert(1); };
 		//textInfo.x = 50;
 		//textInfo.y = 50;
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
		hero.x = BASE_WIDTH/2 - ((RESOURCES['HERO']['width'])/2);
		hero.y = BASE_HEIGHT/2 - ((RESOURCES['HERO']['height'])/2);
		//hero.reset();
		hero.wasMoving = false;
		world.addChild(hero);
	}

	self.doAnimation = function(hero, animation)
	{
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
		hero.gotoAndPlay('idle');
		stage.update();
	}

	self.sortPlayerInWorld = function(player) {
		if(self.entities != undefined) {
			for(e in self.entities) {
				eObj = self.entities[e];
				eObj.height = eObj.image.height;
				eObj.width = eObj.image.width;

				player.width = RESOURCES['HERO']['width'];
				player.height = RESOURCES['HERO']['height'];

				altPlayer = new Object()
				altPlayer.x = player.centerPlayerX;
				altPlayer.y = player.centerPlayerY;
				altPlayer.height = player.height;
				altPlayer.width = player.width;

				overlap = (calculateIntersection(eObj, altPlayer));

				objID = (world.getChildIndex(eObj));
				pID = (world.getChildIndex(player));

				if(overlap) {	
					if(eObj.y + eObj.height - (player.height/2) < player.centerPlayerY && pID < objID) {
						world.swapChildren(eObj, player);
					}
					else if(eObj.y + eObj.height - (player.height/2) > player.centerPlayerY && pID > objID) {
						world.swapChildren(eObj, player);
					}
				}
			}
		}
	}

	// sets up initial location based on first message
	self.initPlayerPosition = function(x, y) {
		world.x = world.x + x;
		world.y = world.y + y;

		hero.x = hero.x - x;
		hero.y = hero.y - y;
	
		hero.centerPlayerX = parseInt(hero.x) + parseInt(RESOURCES['HERO']['width'] / 2);
		hero.centerPlayerY = parseInt(hero.y) + parseInt(RESOURCES['HERO']['height'] / 2);

		self.sortPlayerInWorld(hero);

		self.mouseModX = self.mouseModX - x;
		self.mouseModY = self.mouseModY - y;

                self.playerGameCoords['x'] = self.playerGameCoords['x'] + x ;
                self.playerGameCoords['y'] = self.playerGameCoords['y'] + y ;

		self.sendPlayerState();

	}

	// Moved world around player while moving players actual coords
	self.moveHero = function(x, y) 
	{	
		self.initPlayerPosition(x, y);

		// need to make a circle calculation
		if(self.playerGameCoords['x'] > self.playerAtProximity['location']['x'] + NEW_AREA_WIDTH ||  
			self.playerGameCoords['x'] < self.playerAtProximity['location']['x'] - NEW_AREA_WIDTH  || 
			self.playerGameCoords['y'] > self.playerAtProximity['location']['y'] + NEW_AREA_HEIGHT  ||
			self.playerGameCoords['y'] < self.playerAtProximity['location']['y'] - NEW_AREA_HEIGHT ) {
			self.getMap();
		} 
	}

	// Adds new player to world
	self.addNewPlayerToWorld = function(id, heroLocation) {
		newHero = new Hero(RESOURCES['HERO']['spriteSheet']);
		newHero._id  = id;
		newHero.type = PLAYER;
		newHero.currentFrame = 1;
		loc = self.gameToWorldPosition(heroLocation.x, heroLocation.y);
		newHero.x = loc[0]
		newHero.y = loc[1]
		newHero.realX = heroLocation.x;
		newHero.realY = heroLocation.y;
		if(ENABLE_SHADOWS) {
             		newHero.shadow = new createjs.Shadow("#000000", 1, 5, 10);	
		}
		newHero.reset();
		self.currentPlayers[id] = newHero;
		world.addChild(newHero);
	}

	// Checks to see if others players need to be added to our world
	self.checkToAddPlayers = function() {
		for(each in self.playersToAdd) {
			if(self.currentPlayers[each] === undefined) {
				self.addNewPlayerToWorld(each, self.playersToAdd[each]['location']);
				self.playersToAdd.splice(each);
			}
		}
	}

	self.movePlayer = function(msg) {
		for(count in self.currentPlayers) {
			obj = self.currentPlayers[count];
			if(obj._id != undefined && obj._id == msg._id) {
			        self.doAnimation(obj, "down");
				loc = msg.location;
				loc = self.gameToWorldPosition(loc.x, loc.y);
				obj.x = loc[0];
				obj.y = loc[1];
				obj.realX = msg.location.x;
				obj.realY = msg.location.y;
				obj.centerPlayerX = loc[0] + (RESOURCES["HERO"]["width"]/2);
				obj.centerPlayerY = loc[1] + (RESOURCES["HERO"]["height"]/2);

				self.sortPlayerInWorld(self.currentPlayers[count]);
				break;
			}
		}	
	}

	self.calculateFramesPerSecond = function() {
		self.framesPerSecondCounter = self.framesPerSecondCounter + 1;
                if(self.frameTimer === undefined)
		{
                	self.frameTimer = now();
		}
		nextTimer = now();
		if(nextTimer - self.frameTimer > 1)
		{
                        self.framesPerSecond = self.framesPerSecondCounter - 1;
                        for(children in stage.children) {
				if(stage.children[children].text != undefined) {
					if(stage.children[children].text.indexOf("FPS") !== -1) {
						stage.children[children].text = "FPS: " + self.framesPerSecond;
						stage.update();
					}
				}
			}
			self.framesPerSecondCounter = 0;
			self.frameTimer = nextTimer;
		}
		return self.framesPerSecondCounter;
	}

	self.drawWorldData = function() {
		if(!self.sorted && now() - self.lastHandleMessage > MESSAGE_INTERVAL) {
			self.sortWorldData();	
			//MESSAGE_INTERVAL = MESSAGE_INTERVAL + 10000.00;
			self.draw();
			self.lastHandleMessage = 0.00;
			self.sorted = true;
			self.worldToAdd = [];
			self.sortPlayerInWorld(hero);
		}
	}

	self.tick = function(e)
	{
		//self.calculateFramesPerSecond();

		self.drawWorldData();

                if(mouseDown && self.clickedAt.length == 0)
                { 
			direction = directionMouse(MOVEMENT_SPEED, hero);
			xDirection = direction[0];
			yDirection = direction[1];
			hero.wasMoving = true;
			self.moveHero(xDirection, yDirection);
			
		}
		if(self.keyPressed.length != []) {
			self.clickedAt = [];
			self.autoMove = false;
			direction = directionKeys(MOVEMENT_SPEED, hero);
			xDirection = direction[0];
			yDirection = direction[1];
			if(xDirection != 0 || yDirection != 0) {
				self.moveHero(xDirection, yDirection);
			}
		}
		if(hero.wasMoving && !mouseDown && self.keyPressed.length < 1)
		{	
			if(self.clickedAt.length == 0) {
				self.logPlayerClick(direction);
			}
			autoMoveHero(hero);
		}

		ticks++;
		
	}


	self.logPlayerClick = function(direction) {
		self.clickedAt = [self.clientMouseX, self.clientMouseY, direction[0], direction[1]];
	}
	
	self.sendPlayerState = function() {
		if(now() - self.lastSentMessage > UPDATE_RATE) {
			self.doSend(JSON.stringify({    "name"      : "player", 
							"action"    : "move", 
							"target_x"  : self.playerGameCoords['x'], 
							"target_y"  : self.playerGameCoords['y'],
                                                        "direction" : 0}));
			self.lastSentMessage = now();
		}
	}

	self.addWidget = function(x,y,image,type) {
		img = new Bitmap(image);
		x = Math.round(x);
		y = Math.round(y);

		img.x = x;
		img.y = y;
		img.snapToPixel = true;
                img.type = type;

		img.addEventListener("mousedown", function(data) { } );
		world.addChild(img);
		//img.cache(x, y, 64, 64);
		if(type == ENTITY) {	
			self.entities.push(img);
			if(ENABLE_SHADOWS) {
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

        self.handleMouseDown = function(e)
	{
		
		if(self.autoMove) {
			self.autoMove = false;
			self.clickedAt = [];
		}
		if ( !mouseDown ) {
			mouseDown = true;
		}
	}

        self.handleMouseUp  = function(e)
	{
		mouseDown = false;
	}

	self.handleKeyDown = function(e)
	{
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
		self.w  = getWidth(canvas);
		self.h  = getHeight(canvas);
		self.ratioW = self.w / BASE_WIDTH;
		self.ratioH = self.h / BASE_HEIGHT;	
	}

	self.preloadResources();
};

new _game();
