
leftKey = 37;
rightKey = 39;
upKey = 38;
downKey = 40;

NEW_AREA = 500;

TERRAIN = "terrain";
ENTITY = "entity";
PLAYER = "player";

RESOURCES = {
	'HERO'      : { 'resource' : '/assets/hero.png' , 'type' : PLAYER, 'width' : 20, 'height' : 42},
	'ROCKS'     : { 'resource' : '/assets/rocks.png' , 'type' : ENTITY},
	'TREE'      : { 'resource' : [[0, 70, '/assets/tree_base.png'], [0, 0, '/assets/tree.png']] , 'type' : ENTITY, 'foreground' : true},
	'GRASS'     : { 'resource' : '/assets/smaller_grass.png', 'width' : 64 , 'height' : 64 , 'type' : TERRAIN},
	'WATER'     : { 'resource' : '/assets/water_shallow.png', 'width' : 64 , 'height' : 64 , 'type' : TERRAIN},
	'BEACH'     : { 'resource' : '/assets/smaller_beach.png', 'width' : 64 , 'height' : 64 , 'type' : TERRAIN},
	'BUSH'      : { 'resource' : '/assets/bush.png' , 'type' : ENTITY}
}	

function logger(msg) {
	console.log(msg);
}

function loadSettings() {
	jQuery.ajax({
		url: "/js/settings.cfg",
		async: false,
		cache: false,
		success: function(data) {
			eval(data);
		}
	});
}

function fetchGetParm(parm) {
    parm = parm + "=";
    return window.location.search.substr(window.location.search.indexOf(parm)+parm.length);
}

function editorAdd(asset, type) {
	window.Game.addWidgetToWorld(-100, -100, '/assets/' + asset + '.png', type, true);
	obj = window.Game.world.children[window.Game.world.children.length-1];
	window.Game.editMode = true;
	window.Game.moveWidgetWithMouse(obj);
}

function serialize(obj) {
  var str = [];
  for(var p in obj)
     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
  return str.join("&");
}


function findInResources(item) {
	for(each in RESOURCES) {
		resource  =RESOURCES[each]['image'];
		if(resource.indexOf(item) != -1 ) {
			return each;
		}
	}
}

function exportMap() {
	//exportDict = {};
	exportStr = "";
	for(children in window.Game.world.children) {
		childNode = window.Game.world.children[children];
		image = childNode.src.split("/")[2];
		image = findInResources(image);
		x = -childNode.x + window.Game.width  / 2; 
		y = -childNode.y + window.Game.height / 2;
		//exportDict[children.toString()] =  {"id" : children.toString(), "location" : {"x" :  x / window.Game.scale, "y" : y / window.Game.scale}, "image" : image, "type" : RESOURCES[image]['type']};
		exportStr = exportStr + '{:location {:x ' + x / window.Game.scale  + ' :y ' + y/ window.Game.scale  +'} :image "' + image + '" :type "' + RESOURCES[image]['type'] +  '"  }';
	}
	//exportDict = JSON.stringify(exportDict);
	exportStr = "[" + exportStr + "]";
	exportDict = exportStr;
	console.log(exportDict);
	$("#outputarea").text(exportDict);
}

function directionKeys(movementSpeed, hero) 
{
	keyPressed = self.Game.keyPressed;
	f = window.Game.doAnimation;

	movementSpeedX = 0;
	movementSpeedY = 0;

	// Left
	if(self.keyPressed.indexOf(leftKey) != -1) {
		if(hero) {
			f(hero, "down");
		}
		movementSpeedX += movementSpeed;
	}	
	// Right
	if(self.keyPressed.indexOf(rightKey) != -1) {
		if(hero) {
			f(hero, "down");
		}
		movementSpeedX -= movementSpeed;
	}	
	// Top
	if(self.keyPressed.indexOf(upKey) != -1) {
		if(hero) {
			f(hero, "up");
		}
		movementSpeedY += movementSpeed;
	}	
	// Down
	if(self.keyPressed.indexOf(downKey) != -1) {
		if(hero) {
			f(hero, "down");
		}
		movementSpeedY -= movementSpeed;
	}	
	return [movementSpeedX, movementSpeedY];
}


function calculateAccel(clientMouseX, clientMouseY, movementSpeed) {
	cW = getWidth();
	cH = getHeight();
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

	if(movementSpeed > MAX_MOVEMENT_SPEED) {
		movementSpeed = MAX_MOVEMENT_SPEED;
	}

	return movementSpeed;
}

function isMouseNearPlayer(hero) { 
	cW = getWidth();
	cH = getHeight();
	if(clientMouseX - cW / 2 < RESOURCES['HERO']['width'] && clientMouseX - cW / 2 > -RESOURCES['HERO']['width'] && 
		clientMouseY - cH / 2 < RESOURCES['HERO']['height'] && clientMouseY - cH / 2 > -RESOURCES['HERO']['height']) {
       		window.Game.stopHeroAnimations(hero);
		hero.wasMoving = false;
		return true;
	}
	return false;
}

function directionMouse(movementSpeed, hero) {
	clientMouseX = self.Game.clientMouseX;
	clientMouseY = self.Game.clientMouseY;
	w = getWidth();//window.Game.width;
	h = getHeight();//window.Game.height;
	f = window.Game.doAnimation;

	//movementSpeed = calculateAccel(clientMouseX, clientMouseY, movementSpeed);
	
//	if(isMouseNearPlayer(hero)) {
//		return [0, 0];
//	}

	// Left
	if(clientMouseY > h/2 - RESOURCES['HERO']['height'] && clientMouseY < h/2 + RESOURCES['HERO']['height']
		&& clientMouseX < w/2)
        {
		if(hero) {
			f(hero, "down");
		}
		return [movementSpeed, 0];
        }
	// Right
	else if(clientMouseY > h/2 - RESOURCES['HERO']['height'] && clientMouseY < h/2 + RESOURCES['HERO']['height']
		&& clientMouseX > w/2)
        {
		if(hero) {
			f(hero, "down");
		}
		return [-movementSpeed, 0];
        }
	// Up
	else if(clientMouseX > w/2 - RESOURCES['HERO']['width']  && clientMouseX < w/2 + RESOURCES['HERO']['width']
		&& clientMouseY > h/2)
        {
		if(hero) {
			f(hero, "down");
		}
		return [0, -movementSpeed];
        }
	// Down
	else if(clientMouseX + RESOURCES['HERO']['width'] > w/2 - RESOURCES['HERO']['width']  && clientMouseX < w/2
		&& clientMouseY < h/2)
        {	
		if(hero) {
			f(hero, "up");
		}
		return [0, movementSpeed];
        }
	else if(clientMouseX < w/2 && clientMouseY < h/2)
        {
		if(hero) {
			f(hero, "up");
		}
		return [movementSpeed, movementSpeed];
        }
	else if(clientMouseX < w/2 && clientMouseY > h/2)
        {
		if(hero) {
			f(hero, "down");	
		}
		return [movementSpeed, -movementSpeed];
        }
	else if(clientMouseX > w/2 && clientMouseY < h/2)
        {
		if(hero) {
			f(hero, "up");
		}
		return [-movementSpeed, movementSpeed];
        }
	else if(clientMouseX > w/2 && clientMouseY > h/2)
        {
		if(hero) {
			f(hero, "down");
		}
		return [-movementSpeed, -movementSpeed];
        }
	return [0, 0];
}

function calculateIntersection(rect1, rect2, x, y)
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

function calculateCollision(obj, direction, collideables, moveBy)
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
function getBounds(obj,rounded) {
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

function nearestNeighborScale(img, scale)
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

function snapValue(value,snap)
{
  var roundedSnap = (value/snap + (value > 0 ? .5 : -.5)) | 0;
  return roundedSnap * snap;
}

function getWidth() {
  if( typeof( window.innerWidth ) == 'number' ) {
    return window.innerWidth;
  } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    return document.documentElement.clientWidth;
  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
    return document.body.clientWidth;
  }
}

function getHeight() {
  if( typeof( window.innerWidth ) == 'number' ) {
    return window.innerHeight;
  } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    return document.documentElement.clientHeight;
  } else if( document.body && ( document.body.clientHeight || document.body.clientHeight ) ) {
    return document.body.clientHeight;
  }
}
