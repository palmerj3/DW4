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
  //ctx.scale(4,4);
  ctx.save();

  canvas.tabIndex = 1;

  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  var game = {
    initialize : function() {
      // re-bind
      this.run = this.run.bind(this);
      this.tick = this.tick.bind(this);
      this.render = this.render.bind(this);

      this.overworld = new Overworld(ctx);
      this.character = new Player('Ragnar', ctx);

      this.listenForUserInput();
    },

    listenForUserInput : function() {
      window.addEventListener('keydown', function(e) {

        switch(e.keyCode) {
          case 38: // up
            e.preventDefault();
            this.character.move('north');
            break;
          case 40: // down
            e.preventDefault();
            this.character.move('south');
            break;
          case 39: // right
            e.preventDefault();
            this.character.move('east');
            break;
          case 37: // left
            e.preventDefault();
            this.character.move('west');
            break;
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
      // Clear scene
      ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );

      this.overworld.render();
      this.character.render();
    }
  };

  game.initialize();
  game.run();


}());