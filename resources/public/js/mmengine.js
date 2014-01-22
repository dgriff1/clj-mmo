var	playerID = fetchGetParm("id");
var	wsUri = "ws://" + window.location.host + "/object/" + playerID; 

loadSettings();

function _game()
{
	window.Game = this;
	var self = this,
		w = getWidth(),
		h = getHeight(),
		scale = snapValue(Math.min(w/BASE_WIDTH,h/BASE_HEIGHT),.5),
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
        self.clientMouseX = 0;
        self.clientMouseY = 0;
        self.realPlayerCoords = {"_id" : playerID, "x" : 0, "y" : 0}
	self.playersToAdd       = {};
	self.currentPlayers     = {};
	self.lastSentMessage	= new Date() / 1000;
        self.playerID = playerID;
	self.testMode = false;
	self.frameTimer = undefined;
	self.framesPerSecondCounter = 0;
	self.framesPerSecond = 0;
	self.WORLD_DATA = [];//new Array();
 	self.keyPressed = [];

	self.preloadResources = function() {
		for(key in RESOURCES) {
			self.loadImage(RESOURCES[key]['image']);
		}
	}

	self.requestedAssets = 0;
	self.loadedAssets = 0;

	self.loadImage = function(e) {
		var img = new Image();
		img.onload = self.onLoadedAsset;
		img.src = e;

		assets[e] = img;

		++self.requestedAssets;
	}

	// Wait until first response fills our buffer
        self.checkAndInit = function() {
		if(self.buffer != undefined) {
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
		if(self.buffer != undefined) { return }
                msg = JSON.parse(msg);
                if(msg._id == self.playerID) { 
			self.buffer = msg;
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
		logger('RESPONSE: ' + evt.data); 
                self.handleResponse(evt.data);
		stage.update();
	}  

	self.onError = function(evt) { 
		logger('ERROR: ' + evt.data); 
	}  

	self.doSend = function(message) {
		logger("Sending " + message + " to " + websocket.url) ;
		websocket.send(message); 
	}  

	self.formatMessage = function(message) {
		return {}
        }

	self.hideLoader = function() {
		document.body.style.backgroundImage = "none";
		document.body.style.backgroundColor = "#111111";
		document.getElementById("loader").style.display = "None";
	}

	self.scaleResources = function() {
		for(key in RESOURCES) {
			assets[RESOURCES[key]['image']] = nearestNeighborScale(assets[RESOURCES[key]['image']], scale);
		}
	}

	self.initHero = function () { 
		hero = new Hero(spriteSheets[RESOURCES['HERO_IMAGE']['image']]);
		hero.shadow = new createjs.Shadow("#000000", 1, 5, 10);
		hero.currentFrame = 1;
		hero._id = playerID;
	}

	// Set up for game
	self.initializeGame = function() {
		self.hideLoader();

		if(self.testMode) {
			return;
		}

		self.scaleResources();

		self.initializeSpriteSheets();

		canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		document.body.appendChild(canvas);

		stage = new Stage(canvas);

		world = new Container();
		stage.addChild(world);
	
		self.initHero();

                // Need map
		self.doSend(JSON.stringify({"type"     : "proximity", 
                                            "location" : {"x" : self.buffer['location']['x'],
                                                          "y" : self.buffer['location']['y']}
                                           }));;
		self.reset();

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
			document.onmousedown = self.handleMouseDown;
			document.onmouseup = self.handleMouseUp;
			document.onmousemove = self.handleMouseMove;
		}
		
		Ticker.addListener(self.tick, self);
		Ticker.useRAF = true;
		Ticker.setFPS(FPS_RATE);
	}

	self.initializeSpriteSheets = function() {
		
		var heroData = {
			images: [assets[RESOURCES['HERO_IMAGE']['image']]],
			frames: {
				width: HERO_WIDTH * scale,
				height: HERO_HEIGHT * scale
			},
			animations: {
				down: [0,17,true,1],
				up: [18,34,true,1]
			}
		}

		spriteSheets[RESOURCES['HERO_IMAGE']['image']] = new SpriteSheet(heroData);
		//Direction flip
		//SpriteSheetUtils.addFlippedFrames(spriteSheets[HERO_IMAGE], true, false, false);
	}

	self.getWorldByType = function(type, foreground) {
		if(!foreground) {
			foreground = undefined;
		}
		data = [];
		for(each in self.WORLD_DATA) {
			if(self.WORLD_DATA[each]['type'] == type && 
                           (RESOURCES[self.WORLD_DATA[each]['image']]['foreground'] != foreground )) {
				data.push(self.WORLD_DATA[each]);
			}
		}
		return data;
	}

	self.sortWorldType = function(data, type) {
		if(type == TERRAIN) {
			data = data.sort(function(a, b) { if(a['location']['y'] > b['location']['y']) { return 1; }  });
			data = data.sort(function(a, b) { if(a['location']['x'] < b['location']['x']) { return 1; }  });
		}
		if(type == ENTITY) {
			data = data.sort(function(a, b) { if(a['location']['x'] < b['location']['x']) { return 0; } return -1 });
			data = data.sort(function(a, b) { if(a['location']['y'] > b['location']['y']) { return -1; }  return 1 });
		}
		return data
	}


	self.handleResponse = function(data) {
		data = JSON.parse(data);
                if(data.type == PLAYER) {
			if(data._id != playerID) {
				if(self.currentPlayers[data._id] === undefined) {
					self.playersToAdd[data._id] = data.location;	
				}
				else {
					self.movePlayers(data);
				}
			}
                        return;
		}
		else if(data.type == ENTITY || data.type == TERRAIN) {
			world.removeAllChildren();
			world.x = world.y = 0;

			if(data.type == TERRAIN) {
				self.WORLD_DATA.unshift(data);
			}
			else {
				self.WORLD_DATA.push(data);
			}
			//sort start
			sortableTerrain = self.getWorldByType(TERRAIN, true);
			sortableTerrain = self.sortWorldType(sortableTerrain, TERRAIN);

			foregroundEntity = self.getWorldByType(ENTITY, false);
			foregroundEntity = self.sortWorldType(foregroundEntity, ENTITY);

			sortableEntity = self.getWorldByType(ENTITY, true);
			sortableEntity = self.sortWorldType(sortableEntity, ENTITY);

			sortableEntity = sortableEntity.concat(foregroundEntity);
			self.WORLD_DATA = sortableTerrain.concat(sortableEntity);

			//sort end
			self.draw(data.type);
		}
	}

	self.calculatePosition = function(heroX, heroY, objX, objY) {
		self.wx = heroX + ((self.realPlayerCoords['x'] - objX )  * scale);
		self.wy = heroY + ((self.realPlayerCoords['y'] - objY )  * scale);
		return [self.wx, self.wy]
	}

	self.addWidgetToWorld = function(x, y, resource, resourceType, preHero) {
		if(preHero != undefined && preHero) {
			hx = w/2 - ((HERO_WIDTH*scale)/2);
			hy = h/2 - ((HERO_HEIGHT*scale)/2);
			pos = self.calculatePosition(hx, hy, x, y);
		}
		else {
			pos = self.calculatePosition(hero.x, hero.y, x, y);
		}
		self.addWidget(pos[0], pos[1], new Bitmap(assets[resource]), resourceType);
	}


	self.draw = function(TYPE) {
		addPlayers = true;

		for(each in self.WORLD_DATA) {
			if(self.WORLD_DATA[each]['type'] == ENTITY && addPlayers) {
 				for(player in self.currentPlayers) {
					world.addChild(self.currentPlayers[player]);
				}
				self.addOurHeroToWorld();
	 			self.checkToAddPlayers();
				addPlayers = false;
			}
			if(self.WORLD_DATA[each] === undefined) {
				continue;
			}
			x = self.WORLD_DATA[each]['location']['x'];
			y = self.WORLD_DATA[each]['location']['y'];
			self.addWidgetToWorld(x, y, RESOURCES[self.WORLD_DATA[each]['image']]['image'], TYPE, addPlayers);
		}
		//stage.update();

	}

	self.drawHud = function() {
		textInfo = new createjs.Text("Project: Mankind v0.0.1", "20px Arial", "#FFFFFF");
		textInfo.onMouseMove = function(e) { alert(1); };
 		textInfo.x = 50;
 		textInfo.y = 50;
		textInfo.textBaseline = "alphabetic";
		stage.addChild(textInfo);
		text = new createjs.Text("FPS: ", "20px Arial", "#FFFFFF");
 		text.x = 50;
 		text.y = 80;
		text.textBaseline = "alphabetic";
		stage.addChild(text);
	}

	// Sets up world and widgets, called first before tick
	self.reset = function() {
		world.removeAllChildren();
		world.x = world.y = 0;

		self.reconcilleMap(self.buffer['location']['x'], self.buffer['location']['y']);

		self.drawHud();

		self.initPlayerPosition(self.buffer['location']['x'], self.buffer['location']['y']);
	}

	self.addOurHeroToWorld = function() {
		hero.x = w/2 - ((HERO_WIDTH*scale)/2);
		hero.y = h/2 - ((HERO_HEIGHT*scale)/2);
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
		for(count in world.children)
		{
			obj = world.children[count];
			if(obj.name != 'Hero' || (obj._id != undefined && obj._id != playerID))
			{
				obj.x = obj.x + (x * scale)
				obj.y = obj.y + (y * scale);
			}
		}
                self.realPlayerCoords['x'] = x ;
                self.realPlayerCoords['y'] = y ;
	}

	self.reconcilleMap = function(x, y) {
		world.removeAllChildren();
		world.x = world.y = 0;

		// hero

		self.draw(TERRAIN);

	}

	// Moved world around player while moving players actual coords
	self.movePlayer = function(x, y) 
	{
		self.reconcilleMap(x, y);

		for(count in world.children)
		{
			obj = world.children[count];
			if(obj.name != 'Hero' || (obj._id != undefined && obj._id != playerID))
			{
				obj.x = obj.x + (x * scale)
				obj.y = obj.y + (y * scale);
			}
		}
                self.realPlayerCoords['x'] = self.realPlayerCoords['x'] + x;
                self.realPlayerCoords['y'] = self.realPlayerCoords['y'] + y;

		self.sendPlayerState();
	}

	// Adds new player to world
	self.addNewPlayer = function(id, heroLocation) {
		newHero = new Hero(spriteSheets[RESOURCES['HERO_IMAGE']['image']]);
		newHero._id  = id;
		newHero.type = 'Hero';
		newHero.currentFrame = 1;
		newHero.x = hero.x + ((self.realPlayerCoords['x'] - heroLocation.x )  * scale);
		newHero.y = hero.y + ((self.realPlayerCoords['y'] - heroLocation.y )  * scale);
             	newHero.shadow = new createjs.Shadow("#000000", 1, 5, 10);
		newHero.reset();
		self.currentPlayers[id] = newHero;
		world.addChild(newHero);
	}

	// Checks to see if others players need to be added to our world
	self.checkToAddPlayers = function() {
		for(each in self.playersToAdd) {
			if(self.currentPlayers[each] === undefined) {
				self.addNewPlayer(each, self.playersToAdd[each]);
			}
		}
		self.playersToAdd = {};
	}

	self.movePlayers = function(msg) {
		for(count in self.currentPlayers) {
			obj = self.currentPlayers[count];
			if(obj._id != undefined && obj._id == msg._id) {
			        self.doAnimation(obj, "down");
				loc = msg.location;
				loc = self.calculatePosition(hero.x, hero.y, loc.x, loc.y);
				obj.x = loc[0];
				obj.y = loc[1];
			}
		}	
	}

	self.calculateFramesPerSecond = function() {
		self.framesPerSecondCounter = self.framesPerSecondCounter + 1;
                if(self.frameTimer === undefined)
		{
                	self.frameTimer = new Date() / 1000;
		}
		nextTimer= new Date() / 1000;
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
		logger(world.children.length);
		self.calculateFramesPerSecond();

                if(mouseDown)
                { 
			direction = directionMouse(MOVEMENT_SPEED, hero);
			xDirection = direction[0];
			yDirection = direction[1];
			self.movePlayer(xDirection, yDirection);
			
		}
		if(self.keyPressed.length != []) {
			direction = directionKeys(MOVEMENT_SPEED, hero);
			xDirection = direction[0];
			yDirection = direction[1];
			if(xDirection != 0 || yDirection != 0) {
				self.movePlayer(xDirection, yDirection);
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
		now = new Date() / 1000;
		if(now - self.lastSentMessage > UPDATE_RATE) {
			self.doSend(JSON.stringify({    "name"      : "player", 
							"action"    : "move", 
							"target_x"  : self.realPlayerCoords['x'], 
							"target_y"  : self.realPlayerCoords['y'],
                                                        "direction" : 0}));
			self.lastSentMessage = new Date() / 1000;
		}
	}

	self.addWidget = function(x,y,img,type) {
		x = Math.round(x);
		y = Math.round(y);

		img.x = x;
		img.y = y;
		img.snapToPixel = false;
                img.type = type;

		world.addChild(img);
		if(type) {
             	   img.shadow = new createjs.Shadow("#000000", 1, 2, 10);
		}
	}

        self.handleMouseMove = function(e)
	{
                self.clientMouseX = e.clientX;
                self.clientMouseY = e.clientY;
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
