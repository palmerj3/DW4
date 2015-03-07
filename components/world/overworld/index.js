'use strict';

var mountainTiles = require('./tiles.json');

var Overworld = function(ctx) {
  this.ctx = ctx;
  this.spriteFile = new Image();
  this.spriteFile.src = 'components/world/overworld/sprites.png';
  this.spriteMap = [];
  this.tileScale = 4;
};

Overworld.prototype.tick = function(playerPosition) {    
  var step = 16;
  this.spriteMap = [];

  for (var x = playerPosition.x-(7*step), x2=0; x <= playerPosition.x+(7*step); x+=step,x2+=step) {
    for (var y = playerPosition.y-(7*step), y2=0; y <= playerPosition.y+(7*step); y+=16,y2+=step) {

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
      m['relative-x'] * this.tileScale,  // Scale x4
      m['relative-y'] * this.tileScale,  // Scale x4
      m.width * this.tileScale,          // Scale x4
      m.height * this.tileScale          // Scale x4
    );
  }
};

Overworld.prototype.canMove = function(playerPosition, direction, characterType) {
  var positionKey = '';

  switch(direction) {
    case 'north':
      positionKey = (playerPosition.y-16) + '-' + playerPosition.x;
      break;
    case 'south':
      positionKey = (playerPosition.y+16) + '-' + playerPosition.x;
      break;
    case 'east':
      positionKey = playerPosition.y + '-' + (playerPosition.x+16);
      break;
    case 'west':
      positionKey = playerPosition.y + '-' + (playerPosition.x-16);
      break;
  }

  return mountainTiles.hasOwnProperty(positionKey) === false;
};

module.exports = Overworld;