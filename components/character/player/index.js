'use strict';

var Player = function(playablePlayerName, ctx) {
  this.ctx = ctx;
  this.spriteFile = new Image();
  this.spriteFile.src = 'components/character/player/sprites.png';

  this.stats = {
    maxHealth : 20,
    agility: 4,
    strength: 5
  };

  this.health = 20;
  this.name = playablePlayerName;

  this.models = this.getModelsForPlayer(playablePlayerName);

  this.state = {
    lastTick : 0,
    currentModel : null,
    modelState : 0,
    direction : 'north',
    position : {
      x: 7*16,
      y: 5*16
    },
    coords : {
      x: 7,
      y: 5
    }
  }
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

Player.prototype.render = function() {
  if (this.state.currentModel !== null) {
    this.ctx.drawImage(
      this.spriteFile, 
      this.state.currentModel.x, 
      this.state.currentModel.y, 
      this.state.currentModel.width, 
      this.state.currentModel.height,
      7*16*4,
      5*16*4,
      this.state.currentModel.width*4,
      this.state.currentModel.height*4
    );
  }
};

Player.prototype.move = function(direction) {
  console.log('MOVE: ', direction);
  if (this.state.direction === direction) {
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
};

Player.prototype.getModelsForPlayer = function(playablePlayer) {
  switch(playablePlayer) {
    case 'Ragnar':
      return {
        'north-0' : {
          'x': 1,
          'y': 74,
          'width': 16,
          'height': 16
        },
        'north-1' : {
          'x': 26,
          'y': 74,
          'width': 16,
          'height': 16
        },
        'south-0' : {
          'x': 1,
          'y': 50,
          'width': 16,
          'height': 16
        },
        'south-1' : {
          'x': 26,
          'y': 52,
          'width': 16,
          'height': 16
        },
        'east-0' : {
          'x': 48,
          'y': 52,
          'width': 16,
          'height': 16
        },
        'east-1' : {
          'x': 70,
          'y': 52,
          'width': 16,
          'height': 16
        },
        'west-0' : {
          'x': 48,
          'y': 74,
          'width': 16,
          'height': 16
        },
        'west-1' : {
          'x': 70,
          'y': 74,
          'width': 16,
          'height': 16
        }
      }
      break;
    default:
      throw 'Invalid character';
  }
};

module.exports = Player;