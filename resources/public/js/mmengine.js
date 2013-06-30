var	        playerID = fetchGetParm("id");
var		wsUri = "ws://" + window.location.host + "/object/" + playerID; 

		RESOURCES = {
	 		'HERO_IMAGE'      : '/assets/hero.png',
			'ROCKS_IMAGE'     : '/assets/rocks.png',
			'TREE_IMAGE'      : '/assets/tree.png',
			'TREE_BASE_IMAGE' : '/assets/tree_base.png',
			'GRASS_IMAGE'     : '/assets/smaller_grass.jpg',
		}
		BASE_WIDTH = 800,
		BASE_HEIGHT = 400,               
		HERO_HEIGHT = 64;
		HERO_WIDTH = 64;
// BASE TYPES
		TERRAIN = 0
		SCENERY = 1
		SCENERY_BASE = 2

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
        self.realPlayerCoords = {"_id" : 0, "x" : 0, "y" : 0}
	self.playersToAdd       = {};
	self.currentPlayers     = [];

	var collideables = [];
	self.getCollideables = function() { return collideables; };

	self.preloadResources = function() {
		for(key in RESOURCES) {
			self.loadImage(RESOURCES[key]);
		}
	}

	var requestedAssets = 0;
	var loadedAssets = 0;
	self.loadImage = function(e) {
		var img = new Image();
		img.onload = self.onLoadedAsset;
		img.src = e;

		assets[e] = img;

		++requestedAssets;
	}

        self.checkAndInit = function() {
		if(self.buffer != undefined) {
			self.initializeGame();
			window.clearInterval(self.checkForInit)
		}
	}

	self.onLoadedAsset = function(e) {
		++loadedAssets;
		if ( loadedAssets == requestedAssets ) {
 			websocket = new WebSocket(wsUri);
                	window.addEventListener("load", self.MMWebSocket, false);   
			self.checkForInit = setInterval(function(){self.checkAndInit()},100);
		}
	}

        self.writeToBuffer = function(msg) {
                msg = JSON.parse(msg);
                if(msg._id == playerID) { 
			self.buffer = msg;
		}
	}

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

	self.initializeGame = function() {
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
		//hero.shadow = new createjs.Shadow("#FFF", 0, 5, 4);
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
		Ticker.setFPS(60);
	}
	self.initializeSpriteSheets = function() {

		var heroData = {
			images: [assets[RESOURCES['HERO_IMAGE']]],
			frames: {
				width: 20 * scale,
				height: 42 * scale
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

	self.reset = function() {
		collideables = [];
		world.removeAllChildren();
		world.x = world.y = 0;

		for(i = (h/2)-64; i <(h/2)+64; i = i + 64)
		{
			for(j = (w/2)-126; j < (w/2)+126; j = j + 126)
			{
				self.addWidget(j, i, new Bitmap(assets[RESOURCES['GRASS_IMAGE']], TERRAIN));
			}
		}
		//objects in background
		self.addWidget((w/2) - 170, (h-205) + (60 * scale), new Bitmap(assets[RESOURCES['TREE_BASE_IMAGE']], SCENERY));
		self.addWidget((w/2) - 870, (h-505) + (60 * scale), new Bitmap(assets[RESOURCES['TREE_BASE_IMAGE']], SCENERY));

		// hero
		hero.x = w/2 - 60 ;
		hero.y = h/2 ;
		hero.reset();
		world.addChild(hero);

		//objects in foreground
		self.addWidget((w/2) - 200, (h/2) - 100, new Bitmap(assets[RESOURCES['ROCKS_IMAGE']], SCENERY));
		self.addWidget((w/2) - 900, (h/2) + 300, new Bitmap(assets[RESOURCES['ROCKS_IMAGE']], SCENERY));

		self.addWidget((w/2) - 170, h-205, new Bitmap(assets[RESOURCES['TREE_IMAGE']], SCENERY));
		self.addWidget((w/2) - 870, h-505, new Bitmap(assets[RESOURCES['TREE_IMAGE']], SCENERY));

		self.movePlayer(self.buffer['location']['x'], self.buffer['location']['y']);
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
		if(self.clientMouseY > h/2 && self.clientMouseY < h/2 + HERO_HEIGHT
			&& self.clientMouseX < w/2)
                {
			self.doAnimation("down");
			return [2, 0];
                }
		else if(self.clientMouseY > h/2 && self.clientMouseY < h/2 + HERO_HEIGHT
			&& self.clientMouseX > w/2)
                {
			self.doAnimation("down");
			return [-2, 0];
                }
		else if(self.clientMouseX > w/2 - HERO_WIDTH * scale && self.clientMouseX < w/2
			&& self.clientMouseY > h/2)
                {
			self.doAnimation("down");
			return [0, -2];
                }
		else if(self.clientMouseX > w/2 - HERO_WIDTH * scale && self.clientMouseX < w/2
			&& self.clientMouseY < h/2)
                {
			self.doAnimation("up");
			return [0, 2];
                }
		else if(self.clientMouseX < w/2 && self.clientMouseY < h/2)
                {
			self.doAnimation("up");
			return [2, 2];
                }
		else if(self.clientMouseX < w/2 && self.clientMouseY > h/2)
                {
			self.doAnimation("down");
			return [2, -2];
                }
		else if(self.clientMouseX > w/2 && self.clientMouseY < h/2)
                {
			self.doAnimation("up");
			return [-2, 2];
                }
		else if(self.clientMouseX > w/2 && self.clientMouseY > h/2)
                {
			self.doAnimation("down");
			return [-2, -2];
                }
		return [0, 0];
        }

       self.stopHeroAnimations = function() 
	{
			hero.gotoAndStop('up');
			hero.gotoAndStop('down');
			hero.currentFrame = 1;
	}

	self.movePlayer = function(x, y) 
	{
		for(count in world.children)
		{
			obj = world.children[count];
			if(obj.name != 'Hero' || (obj._id != undefined && obj._id != playerID))
			{
				obj.x = obj.x + x
				obj.y = obj.y + y;
			}
		}		
                self.realPlayerCoords['x'] = self.realPlayerCoords['x'] + x;
                self.realPlayerCoords['y'] = self.realPlayerCoords['y'] + y;
	}

	// Checks to see if others players need to be added to our world
	self.checkToAddPlayers = function() {
		for(each in self.playersToAdd) {
			if(self.currentPlayers.indexOf(each)) {
				self.currentPlayers.push(each);
				newHero = new Hero(spriteSheets[RESOURCES['HERO_IMAGE']]);
				heroLocation = self.playersToAdd[each];
				newHero._id  = each;
				newHero.currentFrame = 1;
				newHero.x = heroLocation.x;
				newHero.y = heroLocation.y;
				newHero.reset();
				world.addChild(newHero);
			}
		}
		self.playersToAdd = {};
	}

	self.tick = function(e)
	{
                movementSpeed = 3;
		
                if(mouseDown)
                { 
			xDirection = self.direction()[0];
                        yDirection = self.direction()[1];
			self.movePlayer(xDirection, yDirection);
			
		}
		if(!mouseDown)
		{
			self.stopHeroAnimations();
			if(self.wasMoving)
			{
                                  
				self.doSend(JSON.stringify({"name" : "player", 
								"action" : "move", 
								"target_x" : self.realPlayerCoords['x'], 
								"target_y" : self.realPlayerCoords['y'] }));
			}
			self.wasMoving = false;

		}

	 	self.checkToAddPlayers();

		ticks++;

		stage.update();
	}
	
	self.addWidget = function(x,y,img,type) {
		x = Math.round(x);
		y = Math.round(y);

		img.x = x;
		img.y = y;
		img.snapToPixel = true;
                img.type = type;

		world.addChild(img);
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
