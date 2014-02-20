
ourGame = window.Game;
ourGame.testMode = true;

playerStruct = {  '_id' : 1,
                  'location' : {'x' : 1, 'y' : 1}
}

ourGame.playerGameCoords['x'] = 100;
ourGame.playerGameCoords['y'] = 50;

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
  var p2G = ourGame.pixelToGame(200, 300);
  ourGame.w = 800;
  ourGame.h = 300;
  logger(p2G);
  ok(p2G[0] == 268, "Passed!");
  ok(p2G[1] == -107, "Passed!");
});


