'use strict';

var playerSprites = require('./playerSprites.json');

var Player = function(playablePlayerName, ctx) {
  this.ctx = ctx;
  this.spriteFile = new Image();
  this.spriteFile.src = 'components/character/player/characters-2.png';
  this.tileScale = 3;

  this.name = playablePlayerName;
  this.type = 'playable';   // Airship, Boat, etc

  this.models = this.getModelsForPlayer(playablePlayerName);

  this.state = {
    lastTick : 0,
    currentModel : null,
    modelState : 0,
    direction : 'north',
    position : {
      x: 2624,  //2624
      y: 752    // 752
    }
  }

  window.coords = this.state.position;
};

Player.prototype.tick = function() {
  var currentTime = (new Date()).getTime();

  if (currentTime - this.state.lastTick > 250) {
    this.state.currentModel = this.models[this.state.direction + '-' + this.state.modelState];

    this.state.lastTick = currentTime;

    if (this.state.modelState === 0) {
      this.state.modelState = 1;
    } else {
      this.state.modelState = 0;
    }
  }
};

Player.prototype.render = function(scale) {
  if (this.state.currentModel !== null) {
    this.ctx.drawImage(
      this.spriteFile, 
      this.state.currentModel.x, 
      this.state.currentModel.y, 
      this.state.currentModel.width, 
      this.state.currentModel.height,
      7*16*scale, // Scale x4
      7*16*scale, // Scale x4
      this.state.currentModel.width*scale, // Scale x4
      this.state.currentModel.height*scale // Scale x4
    );
  }
};

Player.prototype.move = function(direction, blocked) {
  console.log('MOVE: ', direction);
  if (this.state.direction === direction && !!blocked) {
    switch(direction) {
      case 'north':
        this.state.position.y -= this.state.currentModel.height;
        break;
      case 'south':
        this.state.position.y += this.state.currentModel.height;
        break;
      case 'east':
        this.state.position.x += this.state.currentModel.width;
        break;
      case 'west':
        this.state.position.x -= this.state.currentModel.width;
        break;
    }
  } else {
    this.state.direction = direction;
  }

  console.log(this.state.position.x, this.state.position.y);
};

Player.prototype.getModelsForPlayer = function(playablePlayer) {
  return playerSprites[playablePlayer];
};

module.exports = Player;