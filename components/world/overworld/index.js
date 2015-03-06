'use strict';

var Overworld = function(ctx) {
  this.ctx = ctx;
  this.spriteFile = new Image();
  this.spriteFile.src = 'components/world/overworld/sprites.png';
  this.spriteMap = [];
};

Overworld.prototype.tick = function(playerPosition) {    
  this.spriteMap = [];

  for (var x = playerPosition.x-(7*16), x2=0; x < playerPosition.x+(7*16); x+=16,x2+=16) {
    for (var y = playerPosition.y-(7*16), y2=0; y < playerPosition.y+(7*16); y+=16,y2+=16) {

      // Move map around the player
      this.spriteMap.push({
        'x': x,
        'y': y,
        'width': 16,
        'height': 16,
        'relative-x': x2,
        'relative-y': y2
      });
    }
  }
};

Overworld.prototype.render = function() { 
  for (var i = 0; i < this.spriteMap.length; i++) {
    var m = this.spriteMap[i];

    this.ctx.drawImage(
      this.spriteFile, 
      m.x, 
      m.y, 
      m.width, 
      m.height,
      m['relative-x']*4,
      m['relative-y']*4,
      m.width*4,
      m.height*4
    );
  }
};

Overworld.prototype.canMove = function(playerPosition, direction, characterType) {
  return true;
};

module.exports = Overworld;