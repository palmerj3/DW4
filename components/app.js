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
  ctx.canvas.width  = 572;
  ctx.canvas.height = 572;

  var game = {
    initialize : function() {
      this.run = this.run.bind(this);
      this.tick = this.tick.bind(this);
      this.render = this.render.bind(this);

      this.scale = window.innerWidth / 15 / 16 / 2;

      this.overworld = new Overworld(ctx);
      this.character = new Player('Ragnar', ctx);

      this.listenForUserInput();
      this.listenForWindowResize();
    },

    listenForWindowResize : function() {
      window.addEventListener('resize', function() {
        this.scale = window.innerWidth / 15 / 16 / 2;

        ctx.clearRect ( 0 , 0 , ctx.canvas.width, ctx.canvas.height );

        ctx.canvas.width = 15*16*this.scale;
        ctx.canvas.height = 15*16*this.scale;
      }.bind(this));
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
      console.log(this.scale);

      this.overworld.render(this.scale);
      this.character.render(this.scale);
    }
  };

  game.initialize();
  game.run();

}());