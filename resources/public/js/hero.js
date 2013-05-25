(function (window) {
    function Hero(image) {
        this.initialize(image);
    }
    Hero.prototype = new BitmapAnimation();

    Hero.prototype.Bitmap_initialize = Hero.prototype.initialize;
   
    Hero.prototype.initialize = function (image) {
       	this.reset();

        this.Bitmap_initialize(image);
        this.name = 'Hero';
        this.snapToPixel = true;
    };
    Hero.prototype.reset = function() {
    };


    window.Hero = Hero;
} (window));
