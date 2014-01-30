
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
  ok( ourGame.buffer._id == 1, "Passed!" );
});

test( "calculate other players position", function() {
  pos =  ourGame.calculatePosition(5, 5, 30, 95);	
  ok( ourGame.calculatePosition(5, 5, 30, 95)[0] == 75, "Passed!" );
  ok( ourGame.calculatePosition(5, 5, 30, 95)[1] == -40, "Passed!" );
});


