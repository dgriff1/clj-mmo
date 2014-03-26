	
function logger(msg) {
	console.log(msg);
}

function _utils()
{
	window.Utils = this;
	var self = this;
        
        self.settings = window.Settings;   

	self.leftKey = 37;
	self.rightKey = 39;
	self.upKey = 38;
	self.downKey = 40;
	
	self.oneKey = 49;

	self.TERRAIN = "terrain";
	self.ENTITY = "entity";
	self.PLAYER = "player";
	
	
	self.RESOURCES = {
		'HERO'      : { 'image' : '/assets/hero3.png' , 'type' : self.PLAYER, 'width' : 64, 'height' : 64},
		'ROCKS'     : { 'image' : '/assets/rocks.png' , 'type' : self.ENTITY},
		//'TREE'      : {image' : [[0, 70, '/assets/tree_base.png'], [0, 0, '/assets/tree.png']] , 'type' : self.ENTITY, 'foreground' : true},
		'TREE'      : { 'image' : '/assets/tree2.png', 'type' : self.ENTITY, 'bounds' : {'x' : 45, 'y' : 58, 'width' : 10, 'height' : 30}},
		'GRASS'     : { 'image' : '/assets/smaller_grass.png', 'type' : self.TERRAIN},
		'WATER'     : { 'image' : '/assets/smaller_water.png', 'type' : self.TERRAIN, 'clip' : true},
		'BEACH'     : { 'image' : '/assets/smaller_beach.png', 'type' : self.TERRAIN},
		'BEACH_GRASS'     : { 'image' : '/assets/smaller_beach_grass.png',  'directional' : true, 'type' : self.TERRAIN},
		'WATER_GRASS'     : { 'image' : '/assets/smaller_water_grass.png',  'directional' : true, 'type' : self.TERRAIN, 'clip' : true},
		'BUSH'      : { 'image' : '/assets/bush.png' , 'type' : self.ENTITY}
	}	
	
	
	self.initializeSpriteSheets = function() {
		animationSpeed = self.animationSpeed = 0.2;

		var heroSpriteData = {
			images: [window.Game.assets[self.RESOURCES['HERO']['image']]],
			frames: {
				width: self.RESOURCES['HERO']['width'],
				height: self.RESOURCES['HERO']['height']
			},
			animations: {
				left: [0,7,true,animationSpeed],
				right: [32, 39, true, animationSpeed],
				down: [48,55,true,animationSpeed],
				up: [16,23,true,animationSpeed],
				upleft: [8,15,true,animationSpeed],
				upright: [24,31,true,animationSpeed],
				downleft: [40,47,true,animationSpeed],
				downright: [56,63,true,animationSpeed],
				idle: [48,49,true,animationSpeed]
			}
		}
		self.RESOURCES['HERO']['spriteSheet'] = new SpriteSheet(heroSpriteData);
	}
	
	self.now = function() {
		d = new Date() / 1000;
		return d;
	}
	
	self.fetchGetParm = function(parm) {
	    parm = parm + "=";
	    return window.location.search.substr(window.location.search.indexOf(parm)+parm.length);
	}
	
	self.editorAdd = function(asset, type) {
		window.Game.addWidgetToWorld(-100, -100, '/assets/' + asset + '.png', type, true);
		obj = window.Game.world.children[window.Game.world.children.length-1];
		window.Game.editMode = true;
		window.Game.moveWidgetWithMouse(obj);
	}
	
	self.serialize = function(obj) {
	  var str = [];
	  for(var p in obj)
	     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	  return str.join("&");
	}
	
	
	self.findInResources = function(item) {
		for(each in self.RESOURCES) {
			resource  =self.RESOURCES[each]['image'];
			if(resource.indexOf(item) != -1 ) {
				return each;
			}
		}
	}
	
	self.exportMap = function() {
		//exportDict = {};
		exportStr = "";
		for(children in window.Game.world.children) {
			childNode = window.Game.world.children[children];
			image = childNode.src.split("/")[2];
			image = findInResources(image);
			x = -childNode.x + window.Game.width  / 2; 
			y = -childNode.y + window.Game.height / 2;
			//exportDict[children.toString()] =  {"id" : children.toString(), "location" : {"x" :  x / window.Game.scale, "y" : y / window.Game.scale}, "image" : image, "type" : self.RESOURCES[image]['type']};
			exportStr = exportStr + '{:location {:x ' + x / window.Game.scale  + ' :y ' + y/ window.Game.scale  +'} :image "' + image + '" :type "' + self.RESOURCES[image]['type'] +  '"  }';
		}
		//exportDict = JSON.stringify(exportDict);
		exportStr = "[" + exportStr + "]";
		exportDict = exportStr;
		console.log(exportDict);
		$("#outputarea").text(exportDict);
	}
	
	self.directionKeys = function(movementSpeed, hero) 
	{
		keyPressed = window.Game.keyPressed;
		f = self.directionAnimation;
	
		movementSpeedX = 0;
		movementSpeedY = 0;
	
		if(window.Game.keyDown > 15) {
			movementSpeed = movementSpeed + 1;
		}
		if(window.Game.keyDown > 40) {
			movementSpeed = movementSpeed + 0.5;
		}
		if(window.Game.keyDown > 65) {
			movementSpeed = movementSpeed + 0.5;
		}
		if(window.Game.keyDown > 85) {
			movementSpeed = movementSpeed + 1;
		}
	
		if(movementSpeed > self.settings.MAX_MOVEMENT_SPEED) {
			movementSpeed = self.settings.MAX_MOVEMENT_SPEED;
		}
		
	
		// Left
		if(window.Game.keyPressed.indexOf(self.leftKey) != -1) {
			if(window.Game.keyPressed.length == 1) {
				f(hero, "left");
			}
			movementSpeedX += movementSpeed;
		}	
		// Right
		if(window.Game.keyPressed.indexOf(self.rightKey) != -1) {
			if(window.Game.keyPressed.length == 1) {
				f(hero, "right");
			}
			movementSpeedX -= movementSpeed;
		}	
		// Top
		if(window.Game.keyPressed.indexOf(self.upKey) != -1) {
			if(window.Game.keyPressed.indexOf(self.leftKey) != -1) {
				f(hero, "upleft");
			}
			else if(window.Game.keyPressed.indexOf(self.rightKey) != -1) {
				f(hero, "upright");
			}
			else {
				f(hero, "up");
			}
			movementSpeedY += movementSpeed;
		}	
		// Down
		if(window.Game.keyPressed.indexOf(self.downKey) != -1) {
			if(window.Game.keyPressed.indexOf(self.leftKey) != -1) {
				f(hero, "downright");
			}
			else if(window.Game.keyPressed.indexOf(self.rightKey) != -1) {
				f(hero, "downleft");
			}
			else {
				f(hero, "down");
			}
			movementSpeedY -= movementSpeed;
		}
		return [movementSpeedX, movementSpeedY];
	}
	
	
	self.calculateAccel = function(clientMouseX, clientMouseY, movementSpeed) {
		cW = window.Game.w
		cH = window.Game.h;
		tempMovementSpeed = movementSpeed;
		accel = (clientMouseX - cW/2) / 100;
		if(accel > 0) {
			movementSpeed = movementSpeed + accel;
		}
		else {
			movementSpeed = movementSpeed - accel;
		}
		accel = (clientMouseY - cH/2) / 100;
		if(accel > 0) {
			movementSpeed = movementSpeed + accel;
		}
		else {
			movementSpeed = movementSpeed - accel;
		}
	
		if(movementSpeed > self.settings.MAX_MOVEMENT_SPEED) {
			movementSpeed = self.settings.MAX_MOVEMENT_SPEED;
		}
	
		return movementSpeed;
	}
	
	self.isMouseNearPlayer = function(hero) { 
		cW = window.Game.w
		cH = window.Game.h;
		if(clientMouseX - cW / 2 < self.RESOURCES['HERO']['width'] && clientMouseX - cW / 2 > -self.RESOURCES['HERO']['width'] && 
			clientMouseY - cH / 2 < self.RESOURCES['HERO']['height'] && clientMouseY - cH / 2 > -self.RESOURCES['HERO']['height']) {
	       		window.Game.stopHeroAnimations(hero);
			hero.wasMoving = false;
			return true;
		}
		return false;
	}
	
	self.directionAnimation = function(hero, direction) {
		if(window.Game.previousAnimation === undefined || window.Game.previousAnimation == direction) {
		}
		else {
			hero.gotoAndPlay(direction);
		}
		window.Game.previousAnimation = direction;
		window.Game.doAnimation(hero, direction);
	}
	
	self.calculateAngle = function(hero) {
		destination = window.Game.pixelToGame(window.Game.clientMouseX, window.Game.clientMouseY);
		p1 = new Object();	
		p2 = new Object();	
	

		p1.x = hero.centerPlayerX - window.Game.worldOffsetX;
		p1.y = hero.centerPlayerY - window.Game.worldOffsetY;
		p2.x = (destination[0] );//- (hero.centerPlayerX - window.Game.worldOffsetX));
		p2.y = hero.centerPlayerY - window.Game.worldOffsetY;
		adj = self.lineDistance(p1, p2);

		tempp2 = p2;

		//var line = new createjs.Shape();
		//line.graphics.setStrokeStyle(3);
		//line.graphics.beginStroke("red");
		//line.graphics.moveTo(p1.x, p1.y);
		//line.graphics.lineTo(p2.x, p2.y);
		//line.graphics.endStroke();
		//window.Game.stage.addChild(line);
		//window.Game.stage.update();

		p1 = new Object();	
		p2 = new Object();	
		p1.x = hero.centerPlayerX - window.Game.worldOffsetX;
		p1.y = hero.centerPlayerY - window.Game.worldOffsetY;
		p2.x = destination[0] ;//- hero.centerPlayerX - window.Game.worldOffsetX;
		p2.y = destination[1] ;//- hero.centerPlayerY - window.Game.worldOffsetY;
		hyp = self.lineDistance(p1, p2);
	
		ops = self.lineDistance(tempp2, p2);

		//var line = new createjs.Shape();
		//line.graphics.setStrokeStyle(3);
		//line.graphics.beginStroke("blue");
		//line.graphics.moveTo(p1.x, p1.y);
		//line.graphics.lineTo(p2.x, p2.y);
		//line.graphics.endStroke();
		//window.Game.stage.addChild(line);
		//window.Game.stage.update();

		angle = (Math.atan2(ops, adj));
		return angle;
	}

	self.directionMouse = function(movementSpeed, hero) {
		clientMouseX = window.Game.clientMouseX;
		clientMouseY = window.Game.clientMouseY;
		h = window.Game.h;
		w = window.Game.w;
		f = self.directionAnimation;
		angle = self.calculateAngle(hero);	
			

		//movementSpeed = self.calculateAccel(clientMouseX, clientMouseY, movementSpeed);
		
		//if(isMouseNearPlayer(hero)) {
		//	return [0, 0];
		//}
	
		// Left
		if(clientMouseY > h/2 - self.RESOURCES['HERO']['height'] && clientMouseY < h/2 + self.RESOURCES['HERO']['height']
			&& clientMouseX < w/2)
	        {
			f(hero, "left");
			return [movementSpeed, 0];
	        }
		// Right
		else if(clientMouseY > h/2 - self.RESOURCES['HERO']['height'] && clientMouseY < h/2 + self.RESOURCES['HERO']['height']
			&& clientMouseX > w/2)
	        {
			f(hero, "right");
			return [-movementSpeed, 0];
	        }
		// Up
		else if(clientMouseX > w/2 - self.RESOURCES['HERO']['width']  && clientMouseX < w/2 + self.RESOURCES['HERO']['width']
			&& clientMouseY > h/2)
	        {
			f(hero, "down");
			return [0, -movementSpeed];
	        }
		// Down
		else if(clientMouseX + self.RESOURCES['HERO']['width'] > w/2 - self.RESOURCES['HERO']['width']  && clientMouseX < w/2
			&& clientMouseY < h/2)
	        {	
			f(hero, "up");
			return [0, movementSpeed];
	        }
		else if(clientMouseX < w/2 && clientMouseY < h/2)
	        {
			f(hero, "upleft");
			return [movementSpeed * Math.cos(angle), movementSpeed * Math.sin(angle)];
	        }
		else if(clientMouseX < w/2 && clientMouseY > h/2)
	        {
			f(hero, "downright");	
			return [movementSpeed * Math.cos(angle), movementSpeed * -Math.sin(angle)];
	        }
		else if(clientMouseX > w/2 && clientMouseY < h/2)
	        {
			f(hero, "upright");
			return [movementSpeed * -Math.cos(angle), movementSpeed * Math.sin(angle)];
	        }
		else if(clientMouseX > w/2 && clientMouseY > h/2)
	        {
			f(hero, "downleft");
			return [-movementSpeed * Math.cos(angle), movementSpeed * -Math.sin(angle)];
	        }
		return [0, 0];
	}
	
	self.autoMoveHero = function(hero) {
	
		if(!window.Game.autoMove) {
			window.Game.autoMove = true;
			destination = window.Game.pixelToGame(window.Game.clickedAt[0], window.Game.clickedAt[1]);
			destinationX = destination[0] + window.Game.worldOffsetX;
			destinationY = destination[1] + window.Game.worldOffsetY;
			window.Game.autoMoveX = destinationX;
			window.Game.autoMoveY = destinationX;
		}
	
		directionX = window.Game.clickedAt[2];
		directionY = window.Game.clickedAt[3];
		moved = false;
	
		playerX = hero.centerPlayerX;
		playerY = hero.centerPlayerY;
	
		//circle = new createjs.Shape();
		//circle.graphics.beginFill("red").drawCircle(0, 0, 4);
		//circle.x = window.Game.autoMoveX;
		//circle.y = window.Game.autoMoveY;
		//world.addChild(circle);
		//stage.update();
	
		//circle = new createjs.Shape();
		//circle.graphics.beginFill("blue").drawCircle(0, 0, 1);
		//circle.x = playerX;
		//circle.y = playerY;
		//world.addChild(circle);
		//stage.update();
		
		if(parseInt(directionX) == 0 && directionY > 0.00 && playerY > destinationY){
			moved = true;
		}
		else if(parseInt(directionX) == 0 && directionY < 0.00 && playerY < destinationY){
			moved = true;
		}
		else if(parseInt(directionY) == 0 && directionX < 0.00 && playerX < destinationX){
			moved = true;
		}
		else if(parseInt(directionY) == 0 && directionX > 0.00 && playerX > destinationX){
			moved = true;
		}
		else if(parseInt(directionY) != 0 && parseInt(directionX) != 0) {
			if(directionY > 0.00 && directionX > 0.00 && (playerX > destinationX || playerY > destinationY)) {
				moved = true;
			}
			else if(directionY > 0.00 && directionX < 0.00 && (playerX < destinationX || playerY > destinationY)) {
				moved = true;
			}
			else if(directionY < 0.00 && directionX < 0.00 && (playerX < destinationX || playerY < destinationY)) {
				moved = true;
			}
			else if(directionY < 0.00 && directionX > 0.00 && (playerX > destinationX || playerY < destinationY)) {
				moved = true;
			}
		}
		if(!moved) {
			hero.wasMoving = false;
			window.Game.previousAnimation = undefined;
			window.Game.stopHeroAnimations(hero);
			window.Game.clickedAt = [];
			window.Game.autoMove = false;		
		}
		else {
			window.Game.moveHero(directionX * (self.now() - window.Game.lastFrame), directionY * (self.now() - window.Game.lastFrame));
			hero.wasMoving = true;
		}
	}
	
	self.rectIntersection = function(rect1, rect2) {
		if(rect1.x + rect1.width/2 > rect2.x 
		   && rect1.x + rect1.width/2  <  rect2.x + rect2.width
		   && rect1.y + rect1.height/2  > rect2.y
		   && rect1.y + rect1.height/2  < rect2.y + rect2.height) {
			return true;
		}
		return false;
	}

	self.calculateIntersection = function(rect1, rect2, x, y)
	{
	  // prevent x|y from being null||undefined
	  x = x || 0; y = y || 0;
	  
	  // first we have to calculate the
	  // center of each rectangle and half of
	  // width and height
	  var dx, dy, r1={}, r2={};
	  r1.cx = rect1.x+x+(r1.hw = (rect1.width /2));
	  r1.cy = rect1.y+y+(r1.hh = (rect1.height/2));
	  r2.cx = rect2.x + (r2.hw = (rect2.width /2));
	  r2.cy = rect2.y + (r2.hh = (rect2.height/2));
	
	  dx = Math.abs(r1.cx-r2.cx) - (r1.hw + r2.hw);
	  dy = Math.abs(r1.cy-r2.cy) - (r1.hh + r2.hh);
	
	  if (dx < 0 && dy < 0) {
	    return {width:-dx,height:-dy};
	  } else {
	    return null;
	  }
	}
	
	self.calculateCollision = function(obj, direction, collideables, moveBy)
	{
	      moveBy = moveBy || {x:0,y:0};
	      //moveBy.x = Math.ceil(moveBy.x);
	      //moveBy.y = Math.ceil(moveBy.y);
	      if ( direction != 'x' && direction != 'y' ) {
	        direction = 'x';
	      }
	      var measure = direction == 'x' ? 'width' : 'height',
	        oppositeDirection = direction == 'x' ? 'y' : 'x',
	        oppositeMeasure = direction == 'x' ? 'height' : 'width',
	
	        bounds = getBounds(obj,true),
	        cbounds,
	        collision = null,
	        cc = 0;
	
	    // for each collideable object we will calculate the
	    // bounding-rectangle and then check for an intersection
	    // of the hero's future position's bounding-rectangle
	    while ( !collision && cc < collideables.length ) {
	      cbounds = getBounds(collideables[cc], true);
	      if ( collideables[cc].isVisible ) {
	        collision = calculateIntersection(bounds, cbounds, moveBy.x, moveBy.y);
	      }
	
	      if ( !collision && collideables[cc].isVisible ) {
	        // if there was NO collision detected, but somehow
	        // the hero got onto the "other side" of an object (high velocity e.g.),
	        // then we will detect this here, and adjust the velocity according to
	        // it to prevent the Hero from "ghosting" through objects
	        // try messing with the 'this.velocity = {x:0,y:125};'
	        // -> it should still collide even with very high values
	        var wentThroughForwards  = ( bounds[direction] < cbounds[direction] && bounds[direction] + moveBy[direction] > cbounds[direction] ),
	          wentThroughBackwards = ( bounds[direction] > cbounds[direction] && bounds[direction] + moveBy[direction] < cbounds[direction] ),
	          withinOppositeBounds = !(bounds[oppositeDirection]+bounds[oppositeMeasure] < cbounds[oppositeDirection])
	                    && !(bounds[oppositeDirection] > cbounds[oppositeDirection]+cbounds[oppositeMeasure]);
	
	        if ( (wentThroughForwards || wentThroughBackwards) && withinOppositeBounds ) {
	          moveBy[direction] = cbounds[direction] - bounds[direction];
	        } else {
	          cc++;
	        }
	      }
	    }
	
	    if ( collision ) {
	      var sign = Math.abs(moveBy[direction]) / moveBy[direction];
	      moveBy[direction] -= collision[measure] * sign;
	    }
	
	    return collision;
	}
	
	/*
	 * Calculated the boundaries of an object.
	 *
	 * CAUTION: <rotation> OR <skew> attributes are NOT used for this calculation!
	 *
	 * @method getBounds
	 * @param {DisplayObject} the object to calculate the bounds from
	 * @return {Rectangle} The rectangle describing the bounds of the object
	 */
	self.getBounds = function(obj,rounded) {
	  var bounds={x:Infinity,y:Infinity,width:0,height:0};
	  
	  if ( obj instanceof Container ) {
	    var children = object.children, l=children.length, cbounds, c;
	    for ( c = 0; c < l; c++ ) {
	      cbounds = getBounds(children[c]);
	      if ( cbounds.x < bounds.x ) bounds.x = cbounds.x;
	      if ( cbounds.y < bounds.y ) bounds.y = cbounds.y;
	      if ( cbounds.width > bounds.width ) bounds.width = cbounds.width;
	      if ( cbounds.height > bounds.height ) bounds.height = cbounds.height;
	    }
	  } else {
	    var gp,imgr;
	    if ( obj instanceof Bitmap ) {
	      gp = obj.localToGlobal(0,0);
	      imgr = {width:obj.image.width,height:obj.image.height};
	    } else if ( obj instanceof BitmapAnimation ) {
	      gp = obj.localToGlobal(0,0);
	      imgr = obj.spriteSheet._frames[obj.currentFrame];
	    } else {
	      return bounds;
	    }
	
	    bounds.width = imgr.width * Math.abs(obj.scaleX);
	    if ( obj.scaleX >= 0 ) {
	      bounds.x = gp.x;
	    } else {
	      bounds.x = gp.x - bounds.width;
	    }
	
	    bounds.height = imgr.height * Math.abs(obj.scaleY);
	    if ( obj.scaleX >= 0 ) {
	      bounds.y = gp.y;
	    } else {
	      bounds.y = gp.y - bounds.height;
	    }
	  }
	  if ( rounded ) {
	    bounds.x = (bounds.x + (bounds.x > 0 ? .5 : -.5)) | 0;
	    bounds.y = (bounds.y + (bounds.y > 0 ? .5 : -.5)) | 0;
	    bounds.width = (bounds.width + (bounds.width > 0 ? .5 : -.5)) | 0;
	    bounds.height = (bounds.height + (bounds.height > 0 ? .5 : -.5)) | 0;
	  }
	  return bounds;
	}
	
	self.nearestNeighborScale = function(img, scale)
	{
	  // to have a good looking scaling
	  // we will snap all values to 0.5-steps
	  // so 1.4 e.g. becomes 1.5 - you can also
	  // set the snapping to 1.0 e.g.
	  // however I would recommend to use only 
	  // a multiple of 0.5 - but play around
	  // with it and see the results
	  scale = snapValue(scale,.5);
	  if ( scale <= 0 ) scale = 0.5;
	
	  // the size of the "pixels" in the new images
	  // will be rounden to integer values, as drawing
	  // a rect with 1.5x1.5 would result in half-transparent
	  // areas
	  var pixelSize = (scale+0.99) | 0;
	
	  // getting the data-array containing all the pixel-data
	  // from our source-image
	  var src_canvas = document.createElement('canvas');
	  src_canvas.width = img.width;
	  src_canvas.height = img.height;
	  var src_ctx = src_canvas.getContext('2d');
	  src_ctx.drawImage(img, 0, 0);
	  var src_data = src_ctx.getImageData(0, 0, img.width, img.height).data;
	  
	  // setting up the new, scaled image
	  var dst_canvas = document.createElement('canvas');
	  // just to be sure, that no pixel gets lost, when
	  // we scale the image down, we add 1 and floor the
	  // result
	  dst_canvas.width = (img.width * scale+1) | 0;
	  dst_canvas.height = (img.height * scale+1) | 0;
	  var dst_ctx = dst_canvas.getContext('2d');
	
	  // reading each pixel-data from the source
	  // and drawing a scaled version of that pixel
	  // to the new canvas
	  var offset = 0;
	  for (var y = 0; y < img.height; ++y) {
	      for (var x = 0; x < img.width; ++x) {
	          var r = src_data[offset++];
	          var g = src_data[offset++];
	          var b = src_data[offset++];
	          var a = src_data[offset++] / 255;
	          dst_ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
	          dst_ctx.fillRect(x * scale, y * scale, pixelSize, pixelSize);
	      }
	  }
	
	  return dst_canvas;
	}

	self.lineDistance = function( point1, point2 )
	{
	  var xs = 0;
	  var ys = 0;
	 
	  xs = point2.x - point1.x;
	  xs = xs * xs;
	 
	  ys = point2.y - point1.y;
	  ys = ys * ys;
	 
	  return Math.sqrt( xs + ys );
	}

	self.snapValue = function(value,snap)
	{
	  var roundedSnap = (value/snap + (value > 0 ? .5 : -.5)) | 0;
	  return roundedSnap * snap;
	}
	
	self.getWidth = function(canvas) {
	  return parseInt($(canvas).css('width').replace("px", ""));
	}
	
	self.getHeight = function(canvas) {
	  return parseInt($(canvas).css('height').replace("px", ""));
	}

}

new _utils();
