
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
	self.buffer = {};
        self.realPlayerCoords = {"_id" : 0, "x" : 0, "y" : 0}
	self.playersToAdd       = {};
	self.currentPlayers     = {};
	self.lastSentMessage	= new Date() / 1000;
        self.playerID = 0;
	self.testMode = false;
	self.frameTimer = undefined;
	self.framesPerSecondCounter = 0;
	self.framesPerSecond = 0;
	self.MAP_DATA = {};
	self.keyPressed = [];
	self.world = 0;
	self.allowMovement = true;
	self.editMode = false;

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
		self.buffer['location'] = {};
		self.buffer['location']['x'] = 0;
		self.buffer['location']['y'] = 0;
		self.initializeGame();
	}

	// Count all assets loaded.  Once all loaded start up websocket
	self.onLoadedAsset = function(e) {
		++self.loadedAssets;
		if ( self.loadedAssets == self.requestedAssets ) {
			self.checkAndInit();
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


	self.scaleResources = function() {
		for(key in RESOURCES) {
			assets[RESOURCES[key]['image']] = nearestNeighborScale(assets[RESOURCES[key]['image']], scale);
		}
	}

	// Set up for game
	self.initializeGame = function() {

		self.scaleResources();

		self.canvas = document.createElement('canvas');
		self.canvas.width = w;
		self.canvas.height = h;
		document.body.appendChild(self.canvas);

		stage = new Stage(self.canvas);

		self.world = new Container();
		stage.addChild(self.world);
	
		self.MAP_DATA = self.fetchMapData();

		self.reset();

		//Event override
		if ('ontouchstart' in document.documentElement) {
			self.canvas.addEventListener('touchstart', function(e) {
				self.handleKeyDown();
			}, false);

			self.canvas.addEventListener('touchend', function(e) {
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

	self.calculatePosition = function(heroX, heroY, objX, objY) {
		self.wx = heroX + ((self.realPlayerCoords['x'] - objX )  * scale);
		self.wy = heroY + ((self.realPlayerCoords['y'] - objY )  * scale);
		return [self.wx, self.wy]
	}

	self.moveWidgetWithMouse = function(widget) {
		widget.x = self.clientMouseX - self.world.x;
		widget.y = self.clientMouseY - self.world.y;
		self.allowMovement = false;
		if(self.editMode) {
			self.editMode = false;
			self.moveWidget = setInterval(function(){self.moveWidgetWithMouse(widget)},100);
		}
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
		self.addWidget(pos[0], pos[1], new Bitmap(assets[resource]), resourceType, resource);
	}

	self.fetchMapData = function() { 
		jQuery.ajax({
			url: "/js/TERRAIN.DAT",
			async: false,
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
			x = MAP_DATA[parseInt(each)]['location']['x'];
			y = MAP_DATA[parseInt(each)]['location']['y'];
			self.addWidgetToWorld(x, y, RESOURCES[MAP_DATA[parseInt(each)]['image']]['image'], TERRAIN, true);
		}
	}

	self.drawHud = function() {
		textInfo = new createjs.Text("Mankind Editor v0.0.1", "20px Arial", "#000000");
 		textInfo.x = 10;
 		textInfo.y = 30;
		textInfo.textBaseline = "alphabetic";
		stage.addChild(textInfo);
	}

	// Sets up world and widgets, called first before tick
	self.reset = function() {
		self.world.removeAllChildren();
		self.world.x = self.world.y = 0;

		self.drawTerrain();

		self.drawHud();

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

		if(self.allowMovement) {
			if(mouseDown) {
				xDirection = directionMouse(10, false)[0];
				yDirection = directionMouse(10, false)[1];
				self.world.x = self.world.x + xDirection;
				self.world.y = self.world.y + yDirection;
			}
		}
		if(mouseDown) {
			window.clearInterval(self.moveWidget);
			self.editMode = false;
		}
		if(self.keyPressed.length) {
			direction = directionKeys(MOVEMENT_SPEED, hero);
			xDirection = direction[0];
			yDirection = direction[1];
			if(xDirection != 0 || yDirection != 0) {
				self.world.x = self.world.x + xDirection;
				self.world.y = self.world.y + yDirection;
			}
		}

		ticks++;
		
		stage.update();
	}
	
	self.addWidget = function(x,y,img,type, resource) {
		x = Math.round(x);
		y = Math.round(y);

		img.x = x;
		img.y = y;
		img.snapToPixel = false;
                img.type = type;
		img.src = resource;

		self.world.addChild(img);
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
