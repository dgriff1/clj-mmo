
function _settings()
{
	window.Settings = this;
	var self = this;

	//self.BASE_WIDTH = 3200;
	//self.BASE_HEIGHT = 1350;
	self.BASE_WIDTH = 800;
	self.BASE_HEIGHT = 350;

//GRAPHIC
	self.FPS_RATE = 60;
//WORLD
	self.MOVEMENT_SPEED = 45;
	self.MAX_MOVEMENT_SPEED = self.MOVEMENT_SPEED + 0.04;
// NETWORK
	// Increase for smoother updates but lowers performance
	self.UPDATE_RATE = 0.020;

	// New Map Interval
	self.MESSAGE_INTERVAL = 0.50;

	self.NEW_AREA = 200;
	self.NEW_AREA_WIDTH  = (self.BASE_WIDTH / 2) + self.NEW_AREA - 250;
	self.NEW_AREA_HEIGHT = (self.BASE_HEIGHT / 2) + self.NEW_AREA;

	self.ENABLE_SHADOWS = false;

	self.HEARTBEAT = 10.00;

}
new _settings();
