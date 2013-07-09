var	        playerID = fetchGetParm("id");
var		wsUri = "ws://" + window.location.host + "/object/" + playerID; 

		RESOURCES = {
	 		'HERO_IMAGE'      : '/assets/hero.png',
			'ROCKS_IMAGE'     : '/assets/rocks.png',
			'TREE_IMAGE'      : '/assets/tree.png',
			'TREE_BASE_IMAGE' : '/assets/tree_base.png',
			'GRASS_IMAGE'     : '/assets/smaller_grass.jpg',
			'BUSH_IMAGE'      : '/assets/bush.png'
		}
		BASE_WIDTH = 800,
		BASE_HEIGHT = 400,               
		HERO_HEIGHT = 42;
		HERO_WIDTH = 20;
// BASE TYPES
		TERRAIN = 0
		SCENERY = 1
		SCENERY_BASE = 2
//GRAPHICS
		FPS_RATE = 60;
// NETWORK
		// Increase for smoother updates but lowers performance
		CMD_RATE = 0.45;
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
		keyDown = false,
		mouseDown = false;
		wasMoving = false;

	self.width = w;
	self.height = h;
	self.scale = scale;
        self.clientMouseX = 0;
        self.clientMouseY = 0;
        self.realPlayerCoords = {"_id" : playerID, "x" : 0, "y" : 0}
	self.playersToAdd       = {};
	self.currentPlayers     = [];
	self.lastSentMessage	= new Date() / 1000;
        self.playerID = playerID;
	self.testMode = false;

	var collideables = [];
	self.getCollideables = function() { return collideables; };

	self.preloadResources = function() {
		for(key in RESOURCES) {
			self.loadImage(RESOURCES[key]);
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
		console.log("CONNECTED"); 
	} 

	self.onClose = function(evt) { 
		console.log("DISCONNECTED"); 
	}  

	self.onMessage = function(evt) { 
		console.log('RESPONSE: ' + evt.data); 
                self.handleResponse(evt.data);
	}  

	self.onError = function(evt) { 
		console.log('ERROR: ' + evt.data); 
	}  

	self.doSend = function(message) {
		console.log("Sending " + message + " to " + websocket.url) ;
		websocket.send(message); 
	}  

	self.formatMessage = function(message) {
		return {}
        }

	// Set up for game
	self.initializeGame = function() {
		if(self.testMode) {
			return;
		}
		for(key in RESOURCES) {
			assets[RESOURCES[key]] = nearestNeighborScale(assets[RESOURCES[key]], scale);
		}

		self.initializeSpriteSheets();

		canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		document.body.appendChild(canvas);

		stage = new Stage(canvas);

		world = new Container();
		stage.addChild(world);

		hero = new Hero(spriteSheets[RESOURCES['HERO_IMAGE']]);
		hero.shadow = new createjs.Shadow("#000000", 1, 5, 10);
		hero.currentFrame = 1;
		hero._id = playerID;

		self.reset();

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
			images: [assets[RESOURCES['HERO_IMAGE']]],
			frames: {
				width: HERO_WIDTH * scale,
				height: HERO_HEIGHT * scale
			},
			animations: {
				down: [0,17,true,1],
				up: [18,34,true,1]
			}
		}

		spriteSheets[RESOURCES['HERO_IMAGE']] = new SpriteSheet(heroData);
		//Direction flip
		//SpriteSheetUtils.addFlippedFrames(spriteSheets[HERO_IMAGE], true, false, false);
	}

	self.handleResponse = function(data) {
		data = JSON.parse(data);
		if(data._id != playerID) {
			self.playersToAdd[data._id] = data.location;	
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

	self.drawTerrain = function() {
		for(i = self.buffer['location']['y'] - (h/2); i < self.buffer['location']['y'] + (h/2); i = i + 64)
		{
			for(j = self.buffer['location']['x'] - (w/2); j < self.buffer['location']['x'] + (w/2); j = j + 126)
			{
				//self.addWidget(j, i, new Bitmap(assets[RESOURCES['GRASS_IMAGE']], TERRAIN));
		 	     	self.addWidgetToWorld(j+126, i, RESOURCES['GRASS_IMAGE'], TERRAIN, true);
			}
		}
	}

	// Sets up world and widgets, called first before tick
	self.reset = function() {
		collideables = [];
		world.removeAllChildren();
		world.x = world.y = 0;

		// terrain
		self.drawTerrain();
		self.addWidgetToWorld(100,-80, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(75, -80, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(50, -80, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(25, -80, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(0,  -80, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(-25,-80, RESOURCES['BUSH_IMAGE'], TERRAIN, true);

		self.addWidgetToWorld(100,-50, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(75, -50, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(50, -50, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(25, -50, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(0,  -50, RESOURCES['BUSH_IMAGE'], TERRAIN, true);
		self.addWidgetToWorld(-25,-50, RESOURCES['BUSH_IMAGE'], TERRAIN, true);


		//objects in background
		self.addWidgetToWorld(-150, -20 - 64, RESOURCES['TREE_BASE_IMAGE'], SCENERY, true);
		self.addWidgetToWorld(-220, -20 - 64, RESOURCES['TREE_BASE_IMAGE'], SCENERY, true);
		self.addWidgetToWorld(-270, -20 - 64, RESOURCES['TREE_BASE_IMAGE'], SCENERY, true);
		self.addWidgetToWorld(-170, -60 - 64, RESOURCES['TREE_BASE_IMAGE'], SCENERY, true);
		self.addWidgetToWorld(-270, -60 - 64, RESOURCES['TREE_BASE_IMAGE'], SCENERY, true);
		self.addWidgetToWorld(30, -60 - 64, RESOURCES['TREE_BASE_IMAGE'], SCENERY, true);
		self.addWidgetToWorld(-270, 120 - 64, RESOURCES['TREE_BASE_IMAGE'], SCENERY, true);
		self.addWidgetToWorld(-270, 80 - 64, RESOURCES['TREE_BASE_IMAGE'], SCENERY, true);
		self.addWidgetToWorld(-130, 180 - 64, RESOURCES['TREE_BASE_IMAGE'], SCENERY, true);

		// hero
		self.addOurHero();

		self.addWidgetToWorld(100, 100, RESOURCES['ROCKS_IMAGE'], SCENERY);
		self.addWidgetToWorld(-100, -170, RESOURCES['ROCKS_IMAGE'], SCENERY);

		self.addWidgetToWorld(-150, -20, RESOURCES['TREE_IMAGE'], SCENERY);
		self.addWidgetToWorld(-220, -20, RESOURCES['TREE_IMAGE'], SCENERY);
		self.addWidgetToWorld(-270, -20, RESOURCES['TREE_IMAGE'], SCENERY);
		self.addWidgetToWorld(-170, -60, RESOURCES['TREE_IMAGE'], SCENERY);
		self.addWidgetToWorld(-270, -60, RESOURCES['TREE_IMAGE'], SCENERY);
		self.addWidgetToWorld(30, -60, RESOURCES['TREE_IMAGE'], SCENERY);
		self.addWidgetToWorld(-270, 120, RESOURCES['TREE_IMAGE'], SCENERY);
		self.addWidgetToWorld(-270, 80, RESOURCES['TREE_IMAGE'], SCENERY);
		self.addWidgetToWorld(-130, 180, RESOURCES['TREE_IMAGE'], SCENERY);

		self.initPlayerPosition(self.buffer['location']['x'], self.buffer['location']['y']);
	}

	self.addOurHero = function() {
		hero.x = w/2 - ((HERO_WIDTH*scale)/2);
		hero.y = h/2 - ((HERO_HEIGHT*scale)/2);
		hero.reset();
		world.addChild(hero);
	}

	self.doAnimation = function(spriteSheet)
	{
		if(!self.wasMoving)
		{
			hero.gotoAndPlay(spriteSheet);
			self.wasMoving = true;
		}
	}

        self.direction = function() 
        {
                movementSpeed = 0.25 * scale ;
		
		if(self.clientMouseY > h/2 && self.clientMouseY < h/2 + HERO_HEIGHT
			&& self.clientMouseX < w/2)
                {
			self.doAnimation("down");
			return [movementSpeed, 0];
                }
		else if(self.clientMouseY > h/2 && self.clientMouseY < h/2 + HERO_HEIGHT
			&& self.clientMouseX > w/2)
                {
			self.doAnimation("down");
			return [-movementSpeed, 0];
                }
		else if(self.clientMouseX > w/2 - HERO_WIDTH * scale && self.clientMouseX < w/2
			&& self.clientMouseY > h/2)
                {
			self.doAnimation("down");
			return [0, -movementSpeed];
                }
		else if(self.clientMouseX > w/2 - HERO_WIDTH * scale && self.clientMouseX < w/2
			&& self.clientMouseY < h/2)
                {
			self.doAnimation("up");
			return [0, movementSpeed];
                }
		else if(self.clientMouseX < w/2 && self.clientMouseY < h/2)
                {
			self.doAnimation("up");
			return [movementSpeed, movementSpeed];
                }
		else if(self.clientMouseX < w/2 && self.clientMouseY > h/2)
                {
			self.doAnimation("down");
			return [movementSpeed, -movementSpeed];
                }
		else if(self.clientMouseX > w/2 && self.clientMouseY < h/2)
                {
			self.doAnimation("up");
			return [-movementSpeed, movementSpeed];
                }
		else if(self.clientMouseX > w/2 && self.clientMouseY > h/2)
                {
			self.doAnimation("down");
			return [-movementSpeed, -movementSpeed];
                }
		return [0, 0];
        }

       self.stopHeroAnimations = function() 
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

	// Moved world around player while moving players actually coords
	self.movePlayer = function(x, y) 
	{
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
	}

	// Adds new player to world
	self.addNewPlayer = function(id, heroLocation) {
		newHero = new Hero(spriteSheets[RESOURCES['HERO_IMAGE']]);
		newHero._id  = id;
		newHero.currentFrame = 1;
		newHero.x = hero.x + ((self.realPlayerCoords['x'] - heroLocation.x )  * scale);
		newHero.y = hero.y + ((self.realPlayerCoords['y'] - heroLocation.y )  * scale);
             	newHero.shadow = new createjs.Shadow("#000000", 1, 5, 10);
		newHero.reset();
		world.addChild(newHero);
	}

	// Checks to see if others players need to be added to our world
	self.checkToAddPlayers = function() {
		for(each in self.playersToAdd) {
			if(self.currentPlayers.indexOf(each)) {
				self.currentPlayers.push(each);
				self.addNewPlayer(each, self.playersToAdd[each]);
			}
		}
		self.playersToAdd = {};
	}

	self.tick = function(e)
	{
                if(mouseDown)
                { 
			xDirection = self.direction()[0];
                        yDirection = self.direction()[1];
			self.movePlayer(xDirection, yDirection);
			
		}
		if(!mouseDown)
		{
			self.stopHeroAnimations();
			self.wasMoving = false;

		}

	 	self.checkToAddPlayers();

		ticks++;
		
		self.sendPlayerState();

		stage.update();
	}
	
	self.sendPlayerState = function() {
		now = new Date() / 1000;
		if(now - self.lastSentMessage > CMD_RATE) {
			self.doSend(JSON.stringify({"name" : "player", 
							"action" : "move", 
							"target_x" : self.realPlayerCoords['x'], 
							"target_y" : self.realPlayerCoords['y']}));
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
		collideables.push(img);
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
		if ( !keyDown ) {
			keyDown = true;
		}
	}

	self.handleKeyUp = function(e)
	{
		keyDown = false;
	}

	self.preloadResources();
};

new _game();
