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

      this.scale = window.innerWidth / 15 / 16 / 2;
      ctx.canvas.width = 15*16*this.scale;
      ctx.canvas.height = 15*16*this.scale;

      this.overworld = new Overworld(ctx);
      this.character = new Player('Ragnar', ctx);

      this.listenForUserInput();
      this.listenForWindowResize();
    },

    listenForWindowResize : function() {
      // Limit amount of redraws during window resize
      var lazyLayout = _.debounce(this.calculateLayout, 300);
      window.addEventListener('resize', lazyLayout);
    },

    calculateLayout : function() {
      this.scale = window.innerWidth / 15 / 16 / 2;

      ctx.clearRect ( 0 , 0 , ctx.canvas.width, ctx.canvas.height );

      ctx.canvas.width = 15*16*this.scale;
      ctx.canvas.height = 15*16*this.scale;
    },

    listenForUserInput : function() {
      window.addEventListener('keydown', function(e) {
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

        if (direction !== '') {
          var canMove = this.overworld.canMove(
            this.character.state.position,
            direction,
            this.character.type
          );

          this.character.move(direction, canMove);
        }

      }.bind(this), false);
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
      this.overworld.render(this.scale);
      this.character.render(this.scale);
    }
  };

  game.initialize();
  game.run();

}());