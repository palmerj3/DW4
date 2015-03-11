'use strict';

var mountainTiles = require('./tiles.json');

var Overworld = function() {
  this.spriteFile = new Image();
  this.spriteFile.src = 'components/world/overworld/sprites.png';
  //this.spriteMap = [];

  this.drawableArea = {
    x: 0,
    y: 0
  };

  this.blockSize = 16;
  this.numBlocksPerAxis = 15;
};

Overworld.prototype.tick = function(playerPosition) {    
  this.drawableArea.x = playerPosition.x - 7*this.blockSize;
  this.drawableArea.y = playerPosition.y - 7*this.blockSize;
};

Overworld.prototype.render = function(ctx, scale) { 
  ctx.drawImage(
    this.spriteFile,
    this.drawableArea.x,
    this.drawableArea.y,
    this.numBlocksPerAxis*this.blockSize,
    this.numBlocksPerAxis*this.blockSize,
    0,
    0,
    this.numBlocksPerAxis*this.blockSize*scale,
    this.numBlocksPerAxis*this.blockSize*scale
  );  
};

Overworld.prototype.canMove = function(playerPosition, direction, characterType) {
  var positionKey = '';

  switch(direction) {
    case 'north':
      positionKey = (playerPosition.y-this.blockSize) + '-' + playerPosition.x;
      break;
    case 'south':
      positionKey = (playerPosition.y+this.blockSize) + '-' + playerPosition.x;
      break;
    case 'east':
      positionKey = playerPosition.y + '-' + (playerPosition.x+this.blockSize);
      break;
    case 'west':
      positionKey = playerPosition.y + '-' + (playerPosition.x-this.blockSize);
      break;
  }

  return mountainTiles.hasOwnProperty(positionKey) === false;
};

module.exports = Overworld;