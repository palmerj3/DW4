'use strict';

var playersData = require('./players');

var Player = function(playablePlayerName) {
  this.spriteFile = new Image();
  this.spriteFile.src = 'components/character/player/sprites.png';
  this.tileScale = 3;

  this.name = playablePlayerName;
  this.type = 'playable';   // Airship, Boat, etc
  this.velocity = 1.25;

  this.playerData = playersData[this.name];

  this.models = this.playerData.sprite;

  this.state = {
    lastTick : 0,
    currentModel : null,
    modelState : 0,
    direction : 'north',
    position : {
      x: this.playerData.homeLocation.x,
      y: this.playerData.homeLocation.y
    },
    remainingPixelsForMovement : 0,
    movementInProgress : false
  }

  this.playPlayerSound();
};

Player.prototype.playPlayerSound = function() {
  var existingAudioTracks = document.getElementsByClassName('player-track');

  for (var i=0; i<existingAudioTracks.length; i++) {
    existingAudioTracks[i].parentNode.removeChild(existingAudioTracks[i]);
  }

  var audioTrack = document.createElement('audio');
  audioTrack.classList.add('player-track');
  audioTrack.setAttribute('autoplay', true);
  audioTrack.setAttribute('loop', true);
  audioTrack.src = 'components/character/player/sounds/' + this.name + '.mp3';

  document.body.appendChild(audioTrack);
};

Player.prototype.tick = function() {
  var currentTime = (new Date()).getTime();

  if (currentTime - this.state.lastTick > 250 || this.state.directionChanged === true) {
    this.state.currentModel = this.models[this.state.direction + '-' + this.state.modelState];

    this.state.lastTick = currentTime;

    if (this.state.modelState === 0) {
      this.state.modelState = 1;
    } else {
      this.state.modelState = 0;
    }

    this.state.directionChanged = false;
  }

  if (this.state.remainingPixelsForMovement > 0) {
    var movementAmount = this.velocity > this.state.remainingPixelsForMovement ? 
                                          this.state.remainingPixelsForMovement : 
                                          this.velocity;

    switch (this.state.direction) {
      case 'north':
        this.state.position.y -= movementAmount;
        break;
      case 'south':
        this.state.position.y += movementAmount;
        break;
      case 'west':
        this.state.position.x -= movementAmount;
        break;
      case 'east':
        this.state.position.x += movementAmount;
        break;
    }

    this.state.remainingPixelsForMovement -= movementAmount;
    this.state.movementInProgress = this.state.remainingPixelsForMovement !== 0;
  }
};

Player.prototype.render = function(ctx, scale) {
  if (this.state.currentModel !== null) {
    ctx.drawImage(
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

Player.prototype.move = function(direction, canmove) {
  console.log('MOVE: ', direction, canmove);

  if (this.state.direction !== direction) {
    this.state.direction = direction;
    this.state.directionChanged = true;
  }

  if (this.state.movementInProgress === false && canmove === true) {
    this.state.remainingPixelsForMovement = this.state.currentModel.width;
    this.state.movementInProgress = true;
  }

  console.log(this.state.position.x, this.state.position.y);
};

module.exports = Player;