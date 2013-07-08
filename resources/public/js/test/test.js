
ourGame = window.Game;
ourGame.testMode = true;

playerStruct = {  '_id' : 1,
            'location' : {'x' : 1, 'y' : 1}
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
  ok( ourGame.buffer._id == 1, "Passed!" );
});




