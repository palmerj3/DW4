var _ = require('underscore');

var Player = require('./character/player');
var Overworld = require('./world/overworld');

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

(function() {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  canvas.tabIndex = 1;

  var game = {
    initialize : function() {
      this.run = this.run.bind(this);
      this.tick = this.tick.bind(this);
      this.render = this.render.bind(this);
      this.calculateLayout = this.calculateLayout.bind(this);

      this.calculateLayout();

      this.overworld = new Overworld();
      this.character = new Player('Ragnar');

      this.listenForUserInput();
      this.listenForWindowResize();

      // TODO: Remove (testing)
      this.listenForPlayerChange();
      this.listenForMuteSound();

      this.listenForMouseMovement();
    },

    listenForWindowResize : function() {
      // Limit amount of redraws during window resize
      var lazyLayout = _.debounce(this.calculateLayout, 300);
      window.addEventListener('resize', lazyLayout);
    },

    toggleSettings : function() {
      var settingsContainer = document.getElementById('settings');

      if (settingsContainer.style.display === 'none') {
        settingsContainer.style.display = 'block';
      } else {
        settingsContainer.style.display = 'none';
      }
    },

    showSettings : function() {
      document.getElementById('settings').style.display = 'block';
    },

    hideSettings : function() {
      document.getElementById('settings').style.display = 'none';
    },

    calculateLayout : function() {
      this.scale = window.innerWidth / 15 / 16 / 2;

      ctx.clearRect ( 0 , 0 , ctx.canvas.width, ctx.canvas.height );

      ctx.canvas.width = 15*16*this.scale;
      ctx.canvas.height = 15*16*this.scale;

      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
    },

    listenForMouseMovement : function() {
      var self = this,
          timeout = null;

      window.addEventListener('mousemove', function(e) {
        clearTimeout(timeout);

        self.showSettings();
        timeout = setTimeout(self.hideSettings, 3000);
      });
    },

    listenForMuteSound : function() {
      var muteSoundNode = document.getElementById('mute_sound');
      var self = this;

      muteSoundNode.addEventListener('click', function(e) {
        var mute = e.target.checked;
        var audioTags = document.querySelectorAll('audio');
        
        for (var i = 0; i < audioTags.length; i++) {
          audioTags[i].muted = mute;
        }
      });
    },

    listenForPlayerChange : function() {
      var playerSelect = document.getElementById('playerSelection');
      var self = this;

      playerSelect.addEventListener('change', function(e) {
        self.character = new Player(e.target.value);

        canvas.tabIndex = 1;
      });

    },

    listenForUserInput : function() {
      var self = this;

      // var lazyKeydown = _.throttle(function(e) {
      //   var direction = '';

      //   switch(e.keyCode) {
      //     case 38: // up
      //       e.preventDefault();
      //       direction = 'north';
      //       break;
      //     case 40: // down
      //       e.preventDefault();
      //       direction = 'south';
      //       break;
      //     case 39: // right
      //       e.preventDefault();
      //       direction = 'east';
      //       break;
      //     case 37: // left
      //       e.preventDefault();
      //       direction = 'west';
      //       break;
      //   }

      //   if (direction !== '') {          
      //     var canMove = self.overworld.canMove(
      //       self.character.state.position,
      //       direction,
      //       self.character.type
      //     );

      //     self.character.move(direction, canMove);
      //   }
      // }, 350);

      // window.addEventListener('keydown', lazyKeydown, false);
      
      window.addEventListener('keydown', function (e) {
        var direction = '';

        switch(e.keyCode) {
          case 38: // up
            e.preventDefault();
            direction = 'north';
            break;
          case 40: // down
            e.preventDefault();
            direction = 'south';
            break;
          case 39: // right
            e.preventDefault();
            direction = 'east';
            break;
          case 37: // left
            e.preventDefault();
            direction = 'west';
            break;
        }

        if (direction !== '' && self.character.state.movementInProgress === false) {          
          var canMove = self.overworld.canMove(
            self.character.state.position,
            direction,
            self.character.type
          );

          self.character.move(direction, canMove);
        }
      }, false);
    },

    run : function() {
      requestAnimFrame(this.run);

      this.tick();
      this.render();
    },

    tick : function() {
      this.overworld.tick(this.character.state.position);
      this.character.tick();
    },

    render : function() {
      this.overworld.render(ctx, this.scale);
      this.character.render(ctx, this.scale);
    }
  };

  game.initialize();
  game.run();

}());