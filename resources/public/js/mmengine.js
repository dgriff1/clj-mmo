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
	self.MAP_DATA = {};
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

		self.MAP_DATA = self.fetchMapData();

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

	self.handleResponse = function(data) {
		data = JSON.parse(data);
		if(data._id != playerID) {
			if(self.currentPlayers[data._id] === undefined) {
				self.playersToAdd[data._id] = data.location;	
			}
			else {
				self.movePlayers(data);
			}
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

	self.sortMapData = function(MAP_DATA) {
		last_y = MAP_DATA['0'];
		for(ySort in MAP_DATA) {
			if(MAP_DATA[ySort]['y'] > last_y['y'] ) {
				tempData = last_y;
				last_y = MAP_DATA[ySort];
				MAP_DATA[ySort] = tempData;
			}
		}
		return MAP_DATA;
	}

	self.fetchMapData = function() { 
		jQuery.ajax({
			url: "/js/TERRAIN.DAT",
			async: false,
			cache: false,
			success: function(data) {
				self.MAP_DATA = jQuery.parseJSON(data);
			}
		});
		return self.MAP_DATA;
	}

	self.serialize = function(obj) {
	  var str = [];
	  for(var p in obj)
	     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	  return str.join("&");
	}

	self.drawTerrain = function() {
		MAP_DATA = self.MAP_DATA;
		for(each in MAP_DATA) {
			x = MAP_DATA[parseInt(each)]['x'];
			y = MAP_DATA[parseInt(each)]['y'];
			self.addWidgetToWorld(x, y, RESOURCES[MAP_DATA[parseInt(each)]['image']]['image'], TERRAIN, true);
		}
	}

	self.drawHud = function() {
		textInfo = new createjs.Text("Project: Manking v0.0.1", "20px Arial", "#FFFFFF");
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

		// terrain
		self.drawTerrain();
		self.addWidgetToWorld(100,-80, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(75, -80, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(50, -80, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(25, -80, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(0,  -80, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(-25,-80, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);

		self.addWidgetToWorld(100,-50, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(75, -50, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(50, -50, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(25, -50, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(0,  -50, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);
		self.addWidgetToWorld(-25,-50, RESOURCES['BUSH_IMAGE']['image'], TERRAIN, true);

		// hero
 		for(each in self.currentPlayers) {
			world.addChild(self.currentPlayers[each]);
		}
		self.addOurHeroToWorld();
	 	self.checkToAddPlayers();

		//objects in background
		self.addWidgetToWorld(-150, -20 - 64, RESOURCES['TREE_BASE_IMAGE']['image'], SCENERY, true);
		self.addWidgetToWorld(-220, -20 - 64, RESOURCES['TREE_BASE_IMAGE']['image'], SCENERY, true);
		self.addWidgetToWorld(-270, -20 - 64, RESOURCES['TREE_BASE_IMAGE']['image'], SCENERY, true);
		self.addWidgetToWorld(-170, -60 - 64, RESOURCES['TREE_BASE_IMAGE']['image'], SCENERY, true);
		self.addWidgetToWorld(-270, -60 - 64, RESOURCES['TREE_BASE_IMAGE']['image'], SCENERY, true);
		self.addWidgetToWorld(30, -60 - 64, RESOURCES['TREE_BASE_IMAGE']['image'], SCENERY, true);
		self.addWidgetToWorld(-270, 120 - 64, RESOURCES['TREE_BASE_IMAGE']['image'], SCENERY, true);
		self.addWidgetToWorld(-270, 80 - 64, RESOURCES['TREE_BASE_IMAGE']['image'], SCENERY, true);
		self.addWidgetToWorld(-130, 180 - 64, RESOURCES['TREE_BASE_IMAGE']['image'], SCENERY, true);

		self.addWidgetToWorld(100, 100, RESOURCES['ROCKS_IMAGE']['images'], SCENERY);
		self.addWidgetToWorld(-100, -170, RESOURCES['ROCKS_IMAGE']['images'], SCENERY);

		self.addWidgetToWorld(-150, -20, RESOURCES['TREE_IMAGE']['image'], SCENERY);
		self.addWidgetToWorld(-220, -20, RESOURCES['TREE_IMAGE']['image'], SCENERY);
		self.addWidgetToWorld(-270, -20, RESOURCES['TREE_IMAGE']['image'], SCENERY);
		self.addWidgetToWorld(-170, -60, RESOURCES['TREE_IMAGE']['image'], SCENERY);
		self.addWidgetToWorld(-270, -60, RESOURCES['TREE_IMAGE']['image'], SCENERY);
		self.addWidgetToWorld(30, -60, RESOURCES['TREE_IMAGE']['image'], SCENERY);
		self.addWidgetToWorld(-270, 120, RESOURCES['TREE_IMAGE']['image'], SCENERY);
		self.addWidgetToWorld(-270, 80, RESOURCES['TREE_IMAGE']['images'], SCENERY);
		self.addWidgetToWorld(-130, 180, RESOURCES['TREE_IMAGE']['image'], SCENERY);
	}

	// Moved world around player while moving players actually coords
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
		self.calculateFramesPerSecond();

                if(mouseDown)
                { 
			direction = directionMouse(MOVEMENT_SPEED, hero);
			xDirection = direction[0];
			yDirection = direction[1];
			self.movePlayer(xDirection, yDirection);
			
		}
		if(self.keyPressed.length) {
			direction = directionKeys(MOVEMENT_SPEED, hero);
			xDirection = direction[0];
			yDirection = direction[1];
			if(xDirection != 0 || yDirection != 0) {
				self.movePlayer(xDirection, yDirection);
			}
		}
		if(!mouseDown && !self.keyPressed.length)
		{
			self.stopHeroAnimations(hero);
			hero.wasMoving = false;

		}

		ticks++;
		
		stage.update();
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
		self.keyPressed.pop(e.keyCode);
	}

	self.preloadResources();
};

new _game();
