var		wsUri = "ws://192.168.1.101:5000/object/123456"; 
 		HERO_IMAGE = 'assets/hero.png',
		ROCKS_IMAGE = 'assets/rocks.png',
		TREE_IMAGE = 'assets/tree.png',
		TREE_BASE_IMAGE = 'assets/tree_base.png',
		GRASS_IMAGE = 'assets/smaller_grass.jpg',
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

	var collideables = [];
	self.getCollideables = function() { return collideables; };

	self.preloadResources = function() {
		self.loadImage(HERO_IMAGE);
		self.loadImage(ROCKS_IMAGE);
		self.loadImage(TREE_IMAGE);
		self.loadImage(TREE_BASE_IMAGE);
		self.loadImage(GRASS_IMAGE);
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
	self.onLoadedAsset = function(e) {
		++loadedAssets;
		if ( loadedAssets == requestedAssets ) {
			self.initializeGame();
		}
	}

	self.MMWebSocket = function() { 
 
		self.websocket.onopen = function(evt) { 
			self.onOpen(evt) ;
		}; 

		self.websocket.onclose = function(evt) { 
			self.onClose(evt) ;
		}; 

		self.websocket.onmessage = function(evt) { 
			self.onMessage(evt) ;
		}; 

		self.websocket.onerror = function(evt) { 
			self.onError(evt);
		}; 
	}

	self.onOpen = function(evt) { 
		console.log("CONNECTED"); 
		self.doSend("WebSocket rocks"); 
	} 

	self.onClose = function(evt) { 
		console.log("DISCONNECTED"); 
	}  

	self.onMessage = function(evt) { 
		console.log('RESPONSE: ' + evt.data); 
	}  

	self.onError = function(evt) { 
		console.log('ERROR: ' + evt.data); 
	}  

	self.doSend = function(message) {
		console.log("SENT: " + message);  
		self.websocket.send(message); 
	}  

	self.initializeGame = function() {
		self.websocket = new WebSocket(wsUri); 

		assets[HERO_IMAGE] = nearestNeighborScale(assets[HERO_IMAGE], scale);
		assets[ROCKS_IMAGE] = nearestNeighborScale(assets[ROCKS_IMAGE], scale);
		assets[TREE_BASE_IMAGE] = nearestNeighborScale(assets[TREE_BASE_IMAGE], scale);

		self.initializeSpriteSheets();

		canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		document.body.appendChild(canvas);

		stage = new Stage(canvas);

		world = new Container();
		stage.addChild(world);

		hero = new Hero(spriteSheets[HERO_IMAGE]);
		//hero.shadow = new createjs.Shadow("#FFF", 0, 5, 4);
		hero.currentFrame = 1;

		self.reset();

		if ('ontouchstart' in document.documentElement) {
			canvas.addEventListener('touchstart', function(e) {
				self.handleKeyDown();
			}, false);

			canvas.addEventListener('touchend', function(e) {
				self.handleKeyUp();
			}, false);
		} else {
                        window.addEventListener("loadSockets", self.MMWebSocket, false); 

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
			images: [assets[HERO_IMAGE]],
			frames: {
				width: 20 * scale,
				height: 42 * scale
			},
			animations: {
				down: [0,17,true,1],
				up: [18,34,true,1]
			}
		}

		spriteSheets[HERO_IMAGE] = new SpriteSheet(heroData);
		//Direction flip
		//SpriteSheetUtils.addFlippedFrames(spriteSheets[HERO_IMAGE], true, false, false);
	}

	self.reset = function() {
		collideables = [];
		world.removeAllChildren();
		world.x = world.y = 0;

		for(i = -1000; i < h*2; i = i + (64 * scale)/2)
		{
			for(j = -1000; j < w*2; j = j + (126 * scale)/2)
			{
				self.addWidget(j, i, new Bitmap(assets[GRASS_IMAGE], TERRAIN));
			}
		}
		self.addWidget(375 * scale, h-335, new Bitmap(assets[TREE_BASE_IMAGE], SCENERY));

		hero.x = w/2 - 60;
		hero.y = h/2 ;
		hero.reset();
		world.addChild(hero);

		self.addWidget(10 * scale, h/1.25, new Bitmap(assets[ROCKS_IMAGE], SCENERY));
		self.addWidget(300 * scale, h-550, new Bitmap(assets[ROCKS_IMAGE], SCENERY));
		self.addWidget(400 * scale, h-450, new Bitmap(assets[TREE_IMAGE], SCENERY));


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

	self.tick = function(e)
	{
                movementSpeed = 3;
		
                if(mouseDown)
                { 
			for(i = 0; i < world.children.length;i = i + 1)
			{
				obj = world.children[i];
				if(obj.name != 'Hero')
				{
					obj.x = obj.x + self.direction()[0];
					obj.y = obj.y + self.direction()[1];
				}
			}
		}
		if(!mouseDown)
		{
			self.stopHeroAnimations();
			if(self.wasMoving)
			{
				self.doSend('fewf');
			}
			self.wasMoving = false;

		}
		var c,p,l;

		ticks++;

		l = parallaxObjects.length;
		for ( c = 0; c < l; c++ ) {
			p = parallaxObjects[c];
			p.x = ((world.x * p.speedFactor - p.offsetX) % p.range) + p.range;
		}

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
