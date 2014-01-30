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

	self.width = w;
	self.height = h;
	self.scale = scale;
        self.playerGameCoords = {"_id" : playerID, "x" : 0, "y" : 0}
	self.playersToAdd       = new Array();
	self.currentPlayers     = new Array();
	self.WORLD_DATA = [];

	self.assets = assets;
        self.playerID = playerID;
	self.testMode = false;
	self.frameTimer = undefined;
	self.framesPerSecondCounter = 0;
	self.framesPerSecond = 0;
 	self.keyPressed = [];
        self.clientMouseX = 0;
        self.clientMouseY = 0;
	self.lastSentMessage	= 0.00;
	self.lastHandleMesssage = 0.00;
	self.sorted = false;

	self.preloadResources = function() {
		for(key in RESOURCES) {
			if(!self.isPrefab(RESOURCES[key])) {
				self.loadImage(RESOURCES[key]['resource']);
			}
			else {
				for(fab in RESOURCES[key]['resource']) {
					asset = RESOURCES[key]['resource'][fab][2];
					self.loadImage(asset);
				}
			}
		}
	}

	self.requestedAssets = 0;
	self.loadedAssets = 0;

	self.isPrefab = function(obj) {
		if(typeof(obj['resource']) != "string") {
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
 			websocket = new WebSocket(wsUri);
                	window.addEventListener("load", self.MMWebSocket, false);   
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

	// Our web socket callbacks
	self.MMWebSocket = function(e) { 
 
		websocket.onopen = function(evt) { 
			self.onOpen(evt) ;
		}; 

		websocket.onclose = function(evt) { 
			self.onClose(evt) ;
		}; 

		websocket.onmessage = function(evt) { 
                        self.writeToBuffer(evt.data);
			self.onMessage(evt) ;
		}; 

		websocket.onerror = function(evt) { 
			self.onError(evt);
		}; 
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
		websocket.send(message); 
	}  

	self.formatMessage = function(message) {
		return {}
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

	self.scaleResources = function() {
		width = self.w  = parseInt($(canvas).css('width').replace("px", ""));
		height = self.h = parseInt($(canvas).css('height').replace("px", ""));
		for(key in RESOURCES) {
			if(key == 'HERO') {
				RESOURCES[key]['width'] = RESOURCES[key]['width'] * (width / BASE_WIDTH);
				RESOURCES[key]['height'] = RESOURCES[key]['height'] * (height / BASE_HEIGHT);
			}
		}
	}

	self.initHero = function () { 
		hero = new Hero(spriteSheets[RESOURCES['HERO']['resource']]);
		hero.shadow = new createjs.Shadow("#000000", 1, 5, 10);
		hero.currentFrame = 1;
		hero._id = playerID;
	}

	self.getMap = function() {
		self.doSend(JSON.stringify({"type"     : "proximity", 
                                            "location" : {"x" : self.playerGameCoords['x'],
                                                          "y" : self.playerGameCoords['y']}
                                           }));
		self.playerAtProximity['location']['x'] = self.playerGameCoords['x'];
		self.playerAtProximity['location']['y'] = self.playerGameCoords['y'];
	}

	self.initializeGame = function() {

		if(self.testMode) {
			return;
		}
		self.initializeSpriteSheets();

		canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
		canvas.width = BASE_WIDTH;
		canvas.height = BASE_HEIGHT;
		document.body.appendChild(canvas);

		self.scaleResources();

		stage = new Stage(canvas);

		world = new Container();
		stage.addChild(world);
	
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

			document.onkeydown = self.handleKeyDown;
			document.onkeyup = self.handleKeyUp;
			canvas.onmousedown = self.handleMouseDown;
			canvas.onmouseup = self.handleMouseUp;
			canvas.onmousemove = self.handleMouseMove;
		}
		
		createjs.Ticker.setFPS(FPS_RATE);
		createjs.Ticker.addEventListener("tick", function() { self.tick();  });
		createjs.Ticker.useRAF = true;
	}

	self.initializeSpriteSheets = function() {
		var heroData = {
			images: [self.assets[RESOURCES['HERO']['resource']]],
			frames: {
				width: RESOURCES['HERO']['width'],
				height: RESOURCES['HERO']['height']
			},
			animations: {
				down: [0,17,true,1],
				up: [18,34,true,1]
			}
		}

		spriteSheets[RESOURCES['HERO']['resource']] = new SpriteSheet(heroData);
		//Direction flip
		//SpriteSheetUtils.addFlippedFrames(spriteSheets[HERO], true, false, false);
	}

	self.getWorldByType = function(type, foreground) {
		if(!foreground) {
			foreground = undefined;
		}
		data = [];
		for(each in self.WORLD_DATA) {
			if(self.WORLD_DATA[each]['type'] == type && 
	                   (RESOURCES[self.WORLD_DATA[each]['resource']]['foreground'] != foreground )) {
				data.push(self.WORLD_DATA[each]);
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

		sortableTerrain = self.getWorldByType(TERRAIN, true);
		sortableTerrain = self.sortWorldType(sortableTerrain, TERRAIN);

		foregroundEntity = self.getWorldByType(ENTITY, false);
		foregroundEntity = self.sortWorldType(foregroundEntity, ENTITY);

		sortableEntity = self.getWorldByType(ENTITY, true);
		sortableEntity = self.sortWorldType(sortableEntity, ENTITY);

		sortableEntity = sortableEntity.concat(foregroundEntity);
		self.WORLD_DATA = sortableTerrain.concat(sortableEntity);
	}

	self.handleResponse = function(data) {
		data = JSON.parse(data);
		if(data._id in self.WORLD_DATA && data.type != PLAYER) {
			return;
		}
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
		else if(data.type == ENTITY || data.type == TERRAIN) {

			if(data.type == TERRAIN) {
				self.WORLD_DATA.unshift(data);
			}
			else {
				self.WORLD_DATA.push(data);
			}
		}
		self.lastHandleMessage = now();
		self.sorted = false;
	}

	self.calculatePosition = function(heroX, heroY, objX, objY) {
		self.wx = heroX + ((self.playerGameCoords['x'] - objX ));
		self.wy = heroY + ((self.playerGameCoords['y'] - objY ));
		return [self.wx, self.wy]
	}

	self.addWidgetToWorld = function(x, y, resource, resourceType, preHero) {
		if(preHero != undefined && preHero) {
			hx = w/2 - ((RESOURCES['HERO']['width']*scale)/2);
			hy = h/2 - ((RESOURCES['HERO']['height']*scale)/2);
			pos = self.calculatePosition(hx, hy, x, y);
		}
		else {
			pos = self.calculatePosition(hero.x, hero.y, x, y);
		}
		if(typeof(resource) == "string") {
			self.addWidget(pos[0], pos[1], new Bitmap(self.assets[resource]), resourceType);
		}
		else {
			for(each in resource) {
				res = resource[each];
				self.addWidget(pos[0] + res[0], pos[1] + res[1], new Bitmap(res[2]), resourceType);
			}
		}
	}


	self.addPlayersToWorld = function() {
 		for(player in self.currentPlayers) {
			aPlayer = self.currentPlayers[player];
			loc = self.calculatePosition(hero.x, hero.y, aPlayer.realX, aPlayer.realY);
			aPlayer.x = loc[0];
			aPlayer.y = loc[1];
			world.addChild(aPlayer);
		}
		self.addOurHeroToWorld();
	 	self.checkToAddPlayers();

	}

	self.draw = function() {
		//self.showLoader();
		world.removeAllChildren();
		world.x = world.y = 0;

		addPlayers = true;

		for(each in self.WORLD_DATA) {
			if(self.WORLD_DATA[each]['type'] == ENTITY && addPlayers) {
				addPlayers = false;
				self.addPlayersToWorld();
			}
			if(self.WORLD_DATA[each] === undefined) {
				continue;
			}
			x = self.WORLD_DATA[each]['location']['x'];
			y = self.WORLD_DATA[each]['location']['y'];
			self.addWidgetToWorld(x, y, RESOURCES[self.WORLD_DATA[each]['resource']]['resource'], self.WORLD_DATA[each]['type'], addPlayers);
		}
		if(addPlayers) {
			self.addPlayers();
		}
		self.hideLoader();	
		stage.update();

	}

	self.drawHud = function() {
		//textInfo = new createjs.Text("Project: Mankraft v0.0.2", "20px Arial", "#FFFFFF");
		//textInfo.onMouseMove = function(e) { alert(1); };
 		//textInfo.x = 50;
 		//textInfo.y = 50;
		//textInfo.textBaseline = "alphabetic";
		//stage.addChild(textInfo);
		text = new createjs.Text("FPS: ", "20px Arial", "#FFFFFF");
 		text.x = 5;
 		text.y = 30;
		text.textBaseline = "alphabetic";
		stage.addChild(text);
	}

	// Sets up world and widgets, called first before tick
	self.reset = function() {
		world.removeAllChildren();
		world.x = world.y = 0;

		self.drawHud();

		self.initPlayerPosition(self.playerAtProximity['location']['x'], self.playerAtProximity['location']['y']);

	}

	self.addOurHeroToWorld = function() {
		hero.x = w/2 - ((RESOURCES['HERO']['width']*scale)/2);
		hero.y = h/2 - ((RESOURCES['HERO']['height']*scale)/2);
		hero.reset();
		hero.wasMoving = true;
		world.addChild(hero);
	}

	self.doAnimation = function(hero, spriteSheet)
	{
		if(!hero.wasMoving)
		{
			hero.gotoAndPlay(spriteSheet);
			hero.wasMoving = true;
		}
	}

       self.stopHeroAnimations = function(hero) 
	{
		hero.gotoAndStop('up');
		hero.gotoAndStop('down');
		hero.currentFrame = 1;
	}

	// sets up initial location based on first message
	self.initPlayerPosition = function(x, y) {
		world.x = world.x + x;
		world.y = world.y + y;

		hero.x = hero.x - x;
		hero.y = hero.y - y;

                self.playerGameCoords['x'] = self.playerGameCoords['x'] + x ;
                self.playerGameCoords['y'] = self.playerGameCoords['y'] + y ;

		self.sendPlayerState();

	}

	// Moved world around player while moving players actual coords
	self.moveHero = function(x, y) 
	{	
		console.log(world.children.length);
		self.initPlayerPosition(x, y);

		// need to make a circle calculation
		if(self.playerGameCoords['x'] > self.playerAtProximity['location']['x'] + NEW_AREA / scale ||  
			self.playerGameCoords['x'] < self.playerAtProximity['location']['x'] - NEW_AREA / scale || 
			self.playerGameCoords['y'] > self.playerAtProximity['location']['y'] + NEW_AREA / scale ||
			self.playerGameCoords['y'] < self.playerAtProximity['location']['y'] - NEW_AREA / scale) {
			self.getMap();
		} 
	}

	// Adds new player to world
	self.addNewPlayerToWorld = function(id, heroLocation) {
		newHero = new Hero(spriteSheets[RESOURCES['HERO']['resource']]);
		newHero._id  = id;
		newHero.type = PLAYER;
		newHero.currentFrame = 1;
		loc = self.calculatePosition(hero.x, hero.y, heroLocation.x, heroLocation.y);
		newHero.x = loc[0]
		newHero.y = loc[1]
		newHero.realX = heroLocation.x;
		newHero.realY = heroLocation.y;
             	newHero.shadow = new createjs.Shadow("#000000", 1, 5, 10);
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
				loc = self.calculatePosition(hero.x, hero.y, loc.x, loc.y);
				self.currentPlayers[count].x = loc[0];
				self.currentPlayers[count].y = loc[1];
				obj.y = loc[1];
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

	self.tick = function(e)
	{
		if(now() - self.lastHandleMessage > MESSAGE_INTERVAL && !self.sorted) {
			self.sortWorldData();	
			self.draw();
			self.lastHandleMessage = 0.00;
			self.sorted = true;
			self.WORLD_DATA = [];
			stage.update();
		}

		self.calculateFramesPerSecond();

                if(mouseDown)
                { 
			direction = directionMouse(MOVEMENT_SPEED, hero);
			xDirection = direction[0];
			yDirection = direction[1];
			self.moveHero(xDirection, yDirection);
			
		}
		if(self.keyPressed.length != []) {
			direction = directionKeys(MOVEMENT_SPEED, hero);
			xDirection = direction[0];
			yDirection = direction[1];
			if(xDirection != 0 || yDirection != 0) {
				self.moveHero(xDirection, yDirection);
			}
		}
		if(!mouseDown && self.keyPressed.length < 1)
		{
			self.stopHeroAnimations(hero);
			hero.wasMoving = false;

		}

		ticks++;
		
		//stage.update();
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

	self.addWidget = function(x,y,img,type) {
		//x = Math.round(x);
		//y = Math.round(y);

		img.x = x;
		img.y = y;
		img.snapToPixel = true;
                img.type = type;

		world.addChild(img);
		if(type) {
             	   img.shadow = new createjs.Shadow("#000000", 1, 2, 10);
		}
	}

        self.handleMouseMove = function(e)
	{
                self.clientMouseX = e.layerX;
                self.clientMouseY = e.layerY;
	}

        self.handleMouseDown = function(e)
	{
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
		if(self.keyPressed.indexOf(e.keyCode) == -1) {
			self.keyPressed.push(e.keyCode);
		}
	}

	self.handleKeyUp = function(e)
	{
		if(self.keyPressed.length > 1) {
			self.keyPressed = [];
		}
		else {
			self.keyPressed.pop(e.keyCode);
		}
	}

	self.preloadResources();
};

new _game();
