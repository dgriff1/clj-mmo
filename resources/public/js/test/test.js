
ourGame = window.Game;
ourGame.testMode = true;

playerStruct = {  '_id' : 1,
                  'location' : {'x' : 1, 'y' : 1}
}

ourGame.playerGameCoords['x'] = 100;
ourGame.playerGameCoords['y'] = 50;

function world() {
  self = this;

  self.container = [];

  self.addChild = function(e) {
    self.container.push(e);
  }

  self.removeAllChildren = function() {
    self.container = [];
  }

  self.removeChild = function(e) {
    self.container.pop(e);
  }

  self.update = function() {

  }
}

test( "Width settr check", function() {
  ok( ourGame.width != undefined, "Passed!" );
});

test( "Height settr", function() {
  ok( ourGame.height != undefined, "Passed!" );
});

test( "init buffer check", function() {
  ourGame.playerID = 1;
  ourGame.writeToBuffer(JSON.stringify(playerStruct));
  ok( ourGame.playerGameCoords['x'] == 100, "Passed!" );
  ok( ourGame.playerGameCoords['y'] == 50, "Passed!" );
});

test( "calculate other players position", function() {
  var pos =  ourGame.gameToWorldPosition(5, 5, 30, 95);	
  ok( parseInt(pos[0]) == 463, "Passed!" );
  ok( parseInt(pos[1]) == 188, "Passed!" );
});

test( "prefab test", function() {
  var o = new Object();
  o.image = 'string';
  var isPrefab =  ourGame.isPrefab(o);
  ok(!isPrefab, "Passed!");
  o = new Object();
  o.image = [];
  isPrefab =  ourGame.isPrefab(o);
  ok(isPrefab, "Passed!");
});

test( "getWorldType test", function() {
  var o = new Object();
  o.type = ourGame.utils.ENTITY;
  ourGame.worldToAdd.push(o);
  var t = ourGame.getWorldByType(ourGame.utils.ENTITY);
  ok(o.type == t[0].type, "Passed");
});

test( "sortWorldType TERRAIN test", function() {
  var grass1 = {'id' : 1, 'location' : {'x' : 10, 'y' : 30}, 'type' : ourGame.utils.TERRAIN};
  var grass2 = {'id' : 2, 'location' : {'x' : -10, 'y' : 300}, 'type' : ourGame.utils.TERRAIN};
  var grass3 = {'id' : 3, 'location' : {'x' : 10, 'y' : 40}, 'type' : ourGame.utils.TERRAIN};
  var grass4 = {'id' : 4, 'location' : {'x' : 400, 'y' : 30}, 'type' : ourGame.utils.TERRAIN};
  var data = [grass1, grass2, grass3, grass4];
  var sorted = ourGame.sortWorldType(data, ourGame.utils.TERRAIN);
  ok(sorted[0]['id'] == 2, "Passed!");
  ok(sorted[1]['id'] == 3, "Passed!");
  ok(sorted[2]['id'] == 1, "Passed!");
  ok(sorted[3]['id'] == 4, "Passed!");
});

test( "sortWorldType ENTITY test", function() {
  var grass1 = {'id' : 1, 'location' : {'x' : 10, 'y' : 30}, 'type' : ourGame.utils.ENTITY};
  var grass2 = {'id' : 2, 'location' : {'x' : -10, 'y' : 300}, 'type' : ourGame.utils.ENTITY};
  var grass3 = {'id' : 3, 'location' : {'x' : 10, 'y' : 40}, 'type' : ourGame.utils.ENTITY};
  var grass4 = {'id' : 4, 'location' : {'x' : 400, 'y' : 30}, 'type' : ourGame.utils.ENTITY};
  var data = [grass1, grass2, grass3, grass4];
  var sorted = ourGame.sortWorldType(data, ourGame.utils.ENTITY);
  ok(sorted[0]['id'] == 2, "Passed!");
  ok(sorted[1]['id'] == 3, "Passed!");
  ok(sorted[2]['id'] == 4, "Passed!");
  ok(sorted[3]['id'] == 1, "Passed!");
});


test( "sortWorldData test", function() {
  var TERRAIN = {'id' : 1, 'location' : {'x' : 10, 'y' : 30}, 'type' : ourGame.utils.TERRAIN};
  var ENTITY = {'id' : 2, 'location' : {'x' : 10, 'y' : 30}, 'type' : ourGame.utils.ENTITY};
  ourGame.worldToAdd = [ENTITY, TERRAIN];
  ourGame.sortWorldData();
  ok(ourGame.worldToAdd[1]['type'] == ourGame.utils.ENTITY, "Passed!");
  ok(ourGame.worldToAdd[0]['type'] == ourGame.utils.TERRAIN, "Passed!");
});

test( "handleResponse test ENTITIES and TERRAIN", function() {
  var data = '[{"id" : 1}, {"id" : 2}]';
  ourGame.handleResponse(data);
  ok(ourGame.worldToAdd.length == 2, "Passed!");
});

test( "handleResponse test players", function() {
  var data = '{"id" : 2, "type" : "player"}';
  ourGame.handleResponse(data);
  ok(ourGame.playersToAdd[0]['id'] == 2, "Passed!");
});

test( "gameToWorld test players", function() {
  var g2W = ourGame.gameToWorldPosition(200, 300);
  ok(g2W[0] == 268, "Passed!");
  ok(g2W[1] == -107, "Passed!");
});

test( "world to Game test players", function() {
  var w2G = ourGame.worldToGamePosition(200, 300);
  ok(w2G[0] == 268, "Passed!");
  ok(w2G[1] == -107, "Passed!");
});

test( "Pixel to Game test players", function() {
  ourGame.w = 800;
  ourGame.h = 300;
  var p2G = ourGame.pixelToGame(200, 300);
  ok(p2G[0] == 200, "Passed!");
  ok(p2G[1] == 350, "Passed!");
});

test( "addWidgetToWorld test", function() {
  ourGame.entities = [];
  ourGame.world = new world();
  ourGame.addWidgetToWorld(1, 1, '/assets/clock.png', ourGame.utils.ENTITY, -1, false);
  ok(ourGame.world.container[0]['_id'] == -1, "Passed!");
  ok(ourGame.world.container[0]['x'] == 467, "Passed!");
  ok(ourGame.world.container[0]['y'] == 192, "Passed!");
});


test( "addPlayersToWorld test", function() {
  var player1 = new Object();
  ourGame.world = new world();
  player1.x = 2;
  player1.y = 2;
  ourGame.currentPlayers = [player1];
  ourGame.hero = new Object();
  ourGame.hero.x = 1;
  ourGame.hero.y = 1;
  ourGame.playersToAdd = [];
  ourGame.addPlayersToWorld();
  ok(ourGame.world.container[1]['x'] == 368, "Passed!");
  ok(ourGame.world.container[1]['y'] == 143, "Passed!");
});

test( "reset World test", function() {
  ourGame.world = new world();
  ourGame.world.container = [1, 2, 3];
  ourGame.resetWorld();
  ok(ourGame.world.container.length == 0, "Passed!");
});


test( "draw test", function() {
  ourGame.hero = new Object();
  ourGame.hero.x = 1;
  ourGame.hero.y = 1;
  ourGame.worldToAdd = [];
  ourGame.entities = [];
  var entity = {"location" : {"x" : 1, "y" : 1}, "resource" : "TREE", "type" : ourGame.utils.ENTITY};
  ourGame.worldToAdd = [entity];
  ourGame.world = new world();
  ourGame.stage = new world();
  ourGame.draw();
  logger(ourGame.entities);
  ok(ourGame.entities[0]['x'] == 467, "Passed!");
  ok(ourGame.entities[0]['y'] == 192, "Passed!");
});


