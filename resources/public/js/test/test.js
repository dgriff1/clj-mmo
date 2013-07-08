
ourGame = window.Game;
ourGame.testMode = true;

test( "Test to see if width gets set", function() {
  ok( ourGame.width != undefined, "Passed!" );
});

test( "Test to see if height gets set", function() {
  ok( ourGame.height != undefined, "Passed!" );
});

test( "buffer check", function() {
  struct = {  '_id' : 1,
              'location' : {'x' : 1, 'y' : 1}
  }
  ourGame.playerID = 1;
  ourGame.writeToBuffer(JSON.stringify(struct));
  ok( ourGame.buffer._id == 1, "Passed!" );
});

