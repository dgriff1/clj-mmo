
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
  pos =  ourGame.gameToWorldPosition(5, 5, 30, 95);	
  ok( parseInt(pos[0]) == 463, "Passed!" );
  ok( parseInt(pos[1]) == 188, "Passed!" );
});


