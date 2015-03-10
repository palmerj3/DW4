(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

      window.addEventListener('touchstart', function(e) {
        var touches = e.changedTouches,
            direction = '';

        for (var i=0; i<touches.length; i++) {
          var t = touches[i];

          if (t.pageX < (canvas.width/2)) {
            direction = 'west';
            continue;
          }

          if (t.pageX > (canvas.width/2)) {
            direction = 'east';
            continue;
          }

          if (t.pageY < (canvas.height/2)) {
            direction = 'south';
            continue;
          }

          if (t.pageY > (canvas.height/2)) {
            direction = 'north';
            continue;
          }
        }

        if (direction !== '') {
          var canMove = this.overworld.canMove(
            this.character.state.position,
            direction,
            this.character.type
          );

          this.character.move(direction, canMove);
        }
      }.bind(this));
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
},{"./character/player":2,"./world/overworld":12,"underscore":14}],2:[function(require,module,exports){
'use strict';

var playersData = require('./players');

var Player = function(playablePlayerName) {
  this.spriteFile = new Image();
  this.spriteFile.src = 'components/character/player/sprites.png';
  this.tileScale = 3;

  this.name = playablePlayerName;
  this.type = 'playable';   // Airship, Boat, etc

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
    }
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

module.exports = Player;
},{"./players":7}],3:[function(require,module,exports){
module.exports=module.exports = {
  "sprite" : {
    "north-0" : {
      "x": 114,
      "y": 380,
      "width": 16,
      "height": 16
    },
    "north-1" : {
      "x": 138,
      "y": 380,
      "width": 16,
      "height": 16
    },
    "south-0" : {
      "x": 112,
      "y": 330,
      "width": 16,
      "height": 16
    },
    "south-1" : {
      "x": 134,
      "y": 330,
      "width": 16,
      "height": 16
    },
    "east-0" : {
      "x": 114,
      "y": 354,
      "width": 16,
      "height": 16
    },
    "east-1" : {
      "x": 136,
      "y": 354,
      "width": 16,
      "height": 16
    },
    "west-0" : {
      "x": 114,
      "y": 354,
      "width": 16,
      "height": 16
    },
    "west-1" : {
      "x": 136,
      "y": 354,
      "width": 16,
      "height": 16
    }
  },
  "homeLocation" : {
    "x" : 624,
    "y" : 1184
  }
}
},{}],4:[function(require,module,exports){
module.exports=module.exports = {
  "sprite" : {
    "north-0" : {
      "x": 160,
      "y": 380,
      "width": 16,
      "height": 16
    },
    "north-1" : {
      "x": 186,
      "y": 380,
      "width": 16,
      "height": 16
    },
    "south-0" : {
      "x": 160,
      "y": 356,
      "width": 16,
      "height": 16
    },
    "south-1" : {
      "x": 186,
      "y": 356,
      "width": 16,
      "height": 16
    },
    "east-0" : {
      "x": 160,
      "y": 406,
      "width": 16,
      "height": 16
    },
    "east-1" : {
      "x": 186,
      "y": 406,
      "width": 16,
      "height": 16
    },
    "west-0" : {
      "x": 160,
      "y": 330,
      "width": 16,
      "height": 16
    },
    "west-1" : {
      "x": 186,
      "y": 330,
      "width": 16,
      "height": 16
    }
  },
  "homeLocation" : {
    "x" : 624,
    "y" : 1184
  }
}
},{}],5:[function(require,module,exports){
module.exports=module.exports = {
  "sprite" : {
    "north-0" : {
      "x": 208,
      "y": 404,
      "width": 16,
      "height": 16
    },
    "north-1" : {
      "x": 230,
      "y": 404,
      "width": 16,
      "height": 16
    },
    "south-0" : {
      "x": 208,
      "y": 330,
      "width": 16,
      "height": 16
    },
    "south-1" : {
      "x": 230,
      "y": 329,
      "width": 16,
      "height": 16
    },
    "east-0" : {
      "x": 208,
      "y": 380,
      "width": 16,
      "height": 16
    },
    "east-1" : {
      "x": 230,
      "y": 380,
      "width": 16,
      "height": 16
    },
    "west-0" : {
      "x": 208,
      "y": 354,
      "width": 16,
      "height": 16
    },
    "west-1" : {
      "x": 230,
      "y": 354,
      "width": 16,
      "height": 16
    }
  },
  "homeLocation" : {
    "x" : 624,
    "y" : 1184
  }
}
},{}],6:[function(require,module,exports){
module.exports=module.exports = {
  "sprite" : {
    "north-0" : {
      "x": 448,
      "y": 476,
      "width": 16,
      "height": 16
    },
    "north-1" : {
      "x": 470,
      "y": 476,
      "width": 16,
      "height": 16
    },
    "south-0" : {
      "x": 448,
      "y": 410,
      "width": 16,
      "height": 16
    },
    "south-1" : {
      "x": 470,
      "y": 410,
      "width": 16,
      "height": 16
    },
    "east-0" : {
      "x": 448,
      "y": 452,
      "width": 16,
      "height": 16
    },
    "east-1" : {
      "x": 470,
      "y": 452,
      "width": 16,
      "height": 16
    },
    "west-0" : {
      "x": 448,
      "y": 428,
      "width": 16,
      "height": 16
    },
    "west-1" : {
      "x": 470,
      "y": 428,
      "width": 16,
      "height": 16
    }
  },
  "homeLocation" : {
    "x" : 2320,
    "y" : 800
  }
}
},{}],7:[function(require,module,exports){
module.exports = {
  "Ragnar" : require('./ragnar.json'),
  "Hero" : require('./hero.json'),
  "Alena" : require('./alena.json'),
  "Brey" : require('./brey.json'),
  "Cristo" : require('./cristo.json'),
  "Taloon" : require('./taloon.json'),
  "Nara" : require('./nara.json'),
  "Mara" : require('./mara.json')
}
},{"./alena.json":3,"./brey.json":4,"./cristo.json":5,"./hero.json":6,"./mara.json":8,"./nara.json":9,"./ragnar.json":10,"./taloon.json":11}],8:[function(require,module,exports){
module.exports=module.exports = {
  "sprite" : {
    "north-0" : {
      "x": 386,
      "y": 376,
      "width": 16,
      "height": 16
    },
    "north-1" : {
      "x": 406,
      "y": 376,
      "width": 16,
      "height": 16
    },
    "south-0" : {
      "x": 388,
      "y": 328,
      "width": 16,
      "height": 16
    },
    "south-1" : {
      "x": 410,
      "y": 328,
      "width": 16,
      "height": 16
    },
    "east-0" : {
      "x": 388,
      "y": 352,
      "width": 16,
      "height": 16
    },
    "east-1" : {
      "x": 408,
      "y": 352,
      "width": 16,
      "height": 16
    },
    "west-0" : {
      "x": 388,
      "y": 352,
      "width": 16,
      "height": 16
    },
    "west-1" : {
      "x": 408,
      "y": 352,
      "width": 16,
      "height": 16
    }
  },
  "homeLocation" : {
    "x" : 912,
    "y" : 3696
  }
}
},{}],9:[function(require,module,exports){
module.exports=module.exports = {
  "sprite" : {
    "north-0" : {
      "x": 348,
      "y": 400,
      "width": 16,
      "height": 16
    },
    "north-1" : {
      "x": 368,
      "y": 400,
      "width": 16,
      "height": 16
    },
    "south-0" : {
      "x": 350,
      "y": 328,
      "width": 16,
      "height": 16
    },
    "south-1" : {
      "x": 368,
      "y": 328,
      "width": 16,
      "height": 16
    },
    "east-0" : {
      "x": 350,
      "y": 354,
      "width": 16,
      "height": 16
    },
    "east-1" : {
      "x": 368,
      "y": 352,
      "width": 16,
      "height": 16
    },
    "west-0" : {
      "x": 350,
      "y": 378,
      "width": 16,
      "height": 16
    },
    "west-1" : {
      "x": 368,
      "y": 378,
      "width": 16,
      "height": 16
    }
  },
  "homeLocation" : {
    "x" : 912,
    "y" : 3696
  }
}
},{}],10:[function(require,module,exports){
module.exports=module.exports = {
  "sprite" : {
    "north-0" : {
      "x": 5,
      "y": 77,
      "width": 16,
      "height": 16
    },
    "north-1" : {
      "x": 29,
      "y": 77,
      "width": 16,
      "height": 16
    },
    "south-0" : {
      "x": 5,
      "y": 55,
      "width": 16,
      "height": 16
    },
    "south-1" : {
      "x": 29,
      "y": 55,
      "width": 16,
      "height": 16
    },
    "east-0" : {
      "x": 54,
      "y": 55,
      "width": 16,
      "height": 16
    },
    "east-1" : {
      "x": 74,
      "y": 55,
      "width": 16,
      "height": 16
    },
    "west-0" : {
      "x": 54,
      "y": 77,
      "width": 16,
      "height": 16
    },
    "west-1" : {
      "x": 74,
      "y": 77,
      "width": 16,
      "height": 16
    }
  },
  "homeLocation" : {
    "x": 2624,
    "y" : 752
  }
}
},{}],11:[function(require,module,exports){
module.exports=module.exports = {
  "sprite" : {
    "north-0" : {
      "x": 298,
      "y": 480,
      "width": 16,
      "height": 16
    },
    "north-1" : {
      "x": 324,
      "y": 480,
      "width": 16,
      "height": 16
    },
    "south-0" : {
      "x": 300,
      "y": 428,
      "width": 16,
      "height": 16
    },
    "south-1" : {
      "x": 322,
      "y": 428,
      "width": 16,
      "height": 16
    },
    "east-0" : {
      "x": 300,
      "y": 454,
      "width": 16,
      "height": 16
    },
    "east-1" : {
      "x": 322,
      "y": 454,
      "width": 16,
      "height": 16
    },
    "west-0" : {
      "x": 300,
      "y": 454,
      "width": 16,
      "height": 16
    },
    "west-1" : {
      "x": 322,
      "y": 454,
      "width": 16,
      "height": 16
    }
  },
  "homeLocation" : {
    "x" : 1664,
    "y" : 592
  }
}
},{}],12:[function(require,module,exports){
'use strict';

var mountainTiles = require('./tiles.json');

var Overworld = function() {
  this.spriteFile = new Image();
  this.spriteFile.src = 'components/world/overworld/sprites.png';
  this.spriteMap = [];
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

Overworld.prototype.render = function(ctx, scale) { 
  for (var i = 0; i < this.spriteMap.length; i++) {
    var m = this.spriteMap[i];

    ctx.drawImage(
      this.spriteFile, 
      m.x, 
      m.y, 
      m.width, 
      m.height,
      m['relative-x'] * scale,  // Scale x4
      m['relative-y'] * scale,  // Scale x4
      m.width * scale,          // Scale x4
      m.height * scale          // Scale x4
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
},{"./tiles.json":13}],13:[function(require,module,exports){
module.exports=module.exports = {
    "288-736": "mountain",
    "320-736": "mountain",
    "288-704": "mountain",
    "432-688": "mountain",
    "272-736": "mountain",
    "288-720": "mountain",
    "288-752": "mountain",
    "304-752": "mountain",
    "304-736": "mountain",
    "304-720": "mountain",
    "320-752": "mountain",
    "320-720": "mountain",
    "336-720": "mountain",
    "352-720": "mountain",
    "352-736": "mountain",
    "368-736": "mountain",
    "384-736": "mountain",
    "384-720": "mountain",
    "384-704": "mountain",
    "400-720": "mountain",
    "416-720": "mountain",
    "416-672": "mountain",
    "432-672": "mountain",
    "432-656": "mountain",
    "448-688": "mountain",
    "448-704": "mountain",
    "464-704": "mountain",
    "464-720": "mountain",
    "480-720": "mountain",
    "384-576": "mountain",
    "384-560": "mountain",
    "368-544": "mountain",
    "368-560": "mountain",
    "368-576": "mountain",
    "368-592": "mountain",
    "336-608": "mountain",
    "336-624": "mountain",
    "352-544": "mountain",
    "336-544": "mountain",
    "352-528": "mountain",
    "352-512": "mountain",
    "336-512": "mountain",
    "336-528": "mountain",
    "320-528": "mountain",
    "320-512": "mountain",
    "304-512": "mountain",
    "304-496": "mountain",
    "320-496": "mountain",
    "320-480": "mountain",
    "352-592": "mountain",
    "784-976": "mountain",
    "784-992": "mountain",
    "784-1008": "mountain",
    "800-976": "mountain",
    "800-992": "mountain",
    "800-1008": "mountain",
    "800-1024": "mountain",
    "816-960": "mountain",
    "816-976": "mountain",
    "816-992": "mountain",
    "816-1008": "mountain",
    "816-1024": "mountain",
    "816-1040": "mountain",
    "816-1056": "mountain",
    "816-1072": "mountain",
    "816-1088": "mountain",
    "816-1104": "mountain",
    "816-1120": "mountain",
    "800-1120": "mountain",
    "800-1104": "mountain",
    "800-1088": "mountain",
    "800-1072": "mountain",
    "784-1088": "mountain",
    "768-1104": "mountain",
    "768-1120": "mountain",
    "768-1136": "mountain",
    "768-1152": "mountain",
    "784-1136": "mountain",
    "784-1120": "mountain",
    "784-1104": "mountain",
    "832-1120": "mountain",
    "832-1104": "mountain",
    "832-1088": "mountain",
    "832-1072": "mountain",
    "832-1056": "mountain",
    "832-1040": "mountain",
    "832-1024": "mountain",
    "832-1008": "mountain",
    "832-992": "mountain",
    "832-976": "mountain",
    "848-1008": "mountain",
    "848-1024": "mountain",
    "848-1040": "mountain",
    "848-1056": "mountain",
    "848-1072": "mountain",
    "848-1088": "mountain",
    "848-1104": "mountain",
    "848-1120": "mountain",
    "864-1120": "mountain",
    "880-1120": "mountain",
    "896-1104": "mountain",
    "896-1120": "mountain",
    "880-1104": "mountain",
    "864-1104": "mountain",
    "864-1088": "mountain",
    "880-1088": "mountain",
    "896-1088": "mountain",
    "896-1072": "mountain",
    "880-1072": "mountain",
    "864-1072": "mountain",
    "864-1056": "mountain",
    "880-1056": "mountain",
    "896-1056": "mountain",
    "864-1040": "mountain",
    "864-1024": "mountain",
    "880-1040": "mountain",
    "880-1024": "mountain",
    "880-1008": "mountain",
    "896-1040": "mountain",
    "896-1024": "mountain",
    "896-1008": "mountain",
    "912-1040": "mountain",
    "912-1024": "mountain",
    "816-1184": "mountain",
    "816-1200": "mountain",
    "816-1216": "mountain",
    "816-1232": "mountain",
    "832-1264": "mountain",
    "832-1248": "mountain",
    "832-1232": "mountain",
    "832-1216": "mountain",
    "832-1200": "mountain",
    "832-1184": "mountain",
    "832-1168": "mountain",
    "832-1152": "mountain",
    "848-1152": "mountain",
    "848-1168": "mountain",
    "848-1184": "mountain",
    "848-1200": "mountain",
    "848-1216": "mountain",
    "848-1232": "mountain",
    "848-1248": "mountain",
    "864-1232": "mountain",
    "864-1216": "mountain",
    "864-1200": "mountain",
    "864-1184": "mountain",
    "864-1168": "mountain",
    "864-1152": "mountain",
    "880-1232": "mountain",
    "880-1216": "mountain",
    "880-1200": "mountain",
    "880-1184": "mountain",
    "880-1168": "mountain",
    "880-1152": "mountain",
    "896-1152": "mountain",
    "896-1200": "mountain",
    "896-1216": "mountain",
    "896-1232": "mountain",
    "896-1248": "mountain",
    "912-1216": "mountain",
    "912-1232": "mountain",
    "912-1248": "mountain",
    "912-1264": "mountain",
    "928-1216": "mountain",
    "928-1232": "mountain",
    "928-1248": "mountain",
    "928-1264": "mountain",
    "928-1280": "mountain",
    "944-1280": "mountain",
    "944-1264": "mountain",
    "944-1248": "mountain",
    "944-1232": "mountain",
    "944-1216": "mountain",
    "976-1280": "mountain",
    "960-1264": "mountain",
    "960-1280": "mountain",
    "960-1248": "mountain",
    "960-1232": "mountain",
    "960-1216": "mountain",
    "976-1264": "mountain",
    "976-1248": "mountain",
    "976-1232": "mountain",
    "976-1216": "mountain",
    "976-1200": "mountain",
    "992-1264": "mountain",
    "992-1248": "mountain",
    "992-1232": "mountain",
    "992-1216": "mountain",
    "992-1200": "mountain",
    "992-1184": "mountain",
    "1008-1248": "mountain",
    "1008-1232": "mountain",
    "1008-1216": "mountain",
    "1008-1200": "mountain",
    "1008-1184": "mountain",
    "1008-1168": "mountain",
    "1008-1152": "mountain",
    "992-1040": "mountain",
    "992-1024": "mountain",
    "992-1008": "mountain",
    "992-992": "mountain",
    "992-976": "mountain",
    "992-960": "mountain",
    "1008-800": "mountain",
    "1008-816": "mountain",
    "1008-832": "mountain",
    "1008-848": "mountain",
    "1008-864": "mountain",
    "1008-880": "mountain",
    "1008-896": "mountain",
    "1008-912": "mountain",
    "1008-928": "mountain",
    "1008-944": "mountain",
    "1008-960": "mountain",
    "1008-976": "mountain",
    "1008-992": "mountain",
    "1008-1008": "mountain",
    "1008-1024": "mountain",
    "1008-1040": "mountain",
    "1008-1056": "mountain",
    "1024-752": "mountain",
    "1024-768": "mountain",
    "1024-784": "mountain",
    "1024-800": "mountain",
    "1024-816": "mountain",
    "1024-832": "mountain",
    "1024-848": "mountain",
    "1024-864": "mountain",
    "1024-880": "mountain",
    "1024-896": "mountain",
    "1024-912": "mountain",
    "1024-928": "mountain",
    "1024-944": "mountain",
    "1024-960": "mountain",
    "1024-976": "mountain",
    "1024-992": "mountain",
    "1024-1008": "mountain",
    "1024-1024": "mountain",
    "1024-1056": "mountain",
    "1024-1040": "mountain",
    "1024-1072": "mountain",
    "1024-1088": "mountain",
    "1024-1104": "mountain",
    "1024-1120": "mountain",
    "1024-1136": "mountain",
    "1024-1152": "mountain",
    "1024-1168": "mountain",
    "1024-1184": "mountain",
    "1024-1200": "mountain",
    "1024-1216": "mountain",
    "1024-1232": "mountain",
    "1040-1200": "mountain",
    "1040-1184": "mountain",
    "1040-1168": "mountain",
    "1040-1152": "mountain",
    "1040-1136": "mountain",
    "1040-1120": "mountain",
    "1040-1104": "mountain",
    "1040-1088": "mountain",
    "1040-1072": "mountain",
    "1040-1056": "mountain",
    "1040-1040": "mountain",
    "1040-1024": "mountain",
    "1040-1008": "mountain",
    "1040-992": "mountain",
    "1040-976": "mountain",
    "1040-960": "mountain",
    "1040-944": "mountain",
    "1040-928": "mountain",
    "1040-912": "mountain",
    "1040-896": "mountain",
    "1040-880": "mountain",
    "1040-864": "mountain",
    "1040-848": "mountain",
    "1040-832": "mountain",
    "1040-816": "mountain",
    "1040-800": "mountain",
    "1040-784": "mountain",
    "1040-768": "mountain",
    "1040-752": "mountain",
    "1040-736": "mountain",
    "1056-720": "mountain",
    "1056-736": "mountain",
    "1056-752": "mountain",
    "1056-768": "mountain",
    "1056-784": "mountain",
    "1056-800": "mountain",
    "1056-816": "mountain",
    "1056-832": "mountain",
    "1056-848": "mountain",
    "1056-864": "mountain",
    "1056-880": "mountain",
    "1056-896": "mountain",
    "1056-912": "mountain",
    "1056-928": "mountain",
    "1056-944": "mountain",
    "1056-960": "mountain",
    "1056-976": "mountain",
    "1056-992": "mountain",
    "1056-1008": "mountain",
    "1056-1024": "mountain",
    "1056-1040": "mountain",
    "1056-1056": "mountain",
    "1056-1072": "mountain",
    "1056-1088": "mountain",
    "1056-1104": "mountain",
    "1056-1120": "mountain",
    "1056-1136": "mountain",
    "1056-1152": "mountain",
    "1056-1168": "mountain",
    "1072-1120": "mountain",
    "1072-1104": "mountain",
    "1072-1088": "mountain",
    "1072-1072": "mountain",
    "1072-1056": "mountain",
    "1072-1040": "mountain",
    "1072-1024": "mountain",
    "1072-1008": "mountain",
    "1072-992": "mountain",
    "1072-976": "mountain",
    "1072-960": "mountain",
    "1072-944": "mountain",
    "1072-928": "mountain",
    "1072-912": "mountain",
    "1072-816": "mountain",
    "1072-800": "mountain",
    "1072-784": "mountain",
    "1072-768": "mountain",
    "1072-752": "mountain",
    "1072-736": "mountain",
    "1072-720": "mountain",
    "1088-704": "mountain",
    "1088-720": "mountain",
    "1088-736": "mountain",
    "1104-752": "mountain",
    "1088-768": "mountain",
    "1088-752": "mountain",
    "1088-784": "mountain",
    "1088-944": "mountain",
    "1088-960": "mountain",
    "1088-992": "mountain",
    "1088-976": "mountain",
    "1088-1008": "mountain",
    "1088-1024": "mountain",
    "1088-1040": "mountain",
    "1088-1056": "mountain",
    "1088-1072": "mountain",
    "1088-1088": "mountain",
    "1088-1104": "mountain",
    "1104-1024": "mountain",
    "1104-1008": "mountain",
    "1104-992": "mountain",
    "1104-976": "mountain",
    "1120-1008": "mountain",
    "1120-992": "mountain",
    "1104-768": "mountain",
    "1104-736": "mountain",
    "1104-720": "mountain",
    "1104-704": "mountain",
    "1104-688": "mountain",
    "1120-688": "mountain",
    "1120-704": "mountain",
    "1120-720": "mountain",
    "1120-736": "mountain",
    "1120-752": "mountain",
    "1120-768": "mountain",
    "1136-704": "mountain",
    "1136-720": "mountain",
    "1136-736": "mountain",
    "1136-752": "mountain",
    "1136-768": "mountain",
    "1152-720": "mountain",
    "1152-736": "mountain",
    "1152-752": "mountain",
    "1152-768": "mountain",
    "1152-784": "mountain",
    "1168-720": "mountain",
    "1184-704": "mountain",
    "1184-720": "mountain",
    "1184-736": "mountain",
    "1168-736": "mountain",
    "1168-752": "mountain",
    "1168-768": "mountain",
    "1168-784": "mountain",
    "1168-800": "mountain",
    "1184-752": "mountain",
    "1184-768": "mountain",
    "1184-784": "mountain",
    "528-1664": "mountain",
    "528-1680": "mountain",
    "512-1680": "mountain",
    "512-1696": "mountain",
    "496-1712": "mountain",
    "496-1728": "mountain",
    "496-1744": "mountain",
    "496-1792": "mountain",
    "512-1792": "mountain",
    "528-1792": "mountain",
    "512-1776": "mountain",
    "512-1760": "mountain",
    "512-1744": "mountain",
    "512-1728": "mountain",
    "512-1712": "mountain",
    "528-1696": "mountain",
    "528-1712": "mountain",
    "528-1728": "mountain",
    "528-1744": "mountain",
    "528-1760": "mountain",
    "528-1776": "mountain",
    "544-1776": "mountain",
    "544-1760": "mountain",
    "544-1744": "mountain",
    "544-1728": "mountain",
    "544-1712": "mountain",
    "544-1696": "mountain",
    "560-1712": "mountain",
    "560-1728": "mountain",
    "560-1744": "mountain",
    "560-1760": "mountain",
    "608-1712": "mountain",
    "608-1728": "mountain",
    "624-1712": "mountain",
    "624-1728": "mountain",
    "624-1744": "mountain",
    "640-1680": "mountain",
    "656-1680": "mountain",
    "656-1696": "mountain",
    "640-1696": "mountain",
    "640-1712": "mountain",
    "656-1712": "mountain",
    "640-1728": "mountain",
    "656-1728": "mountain",
    "640-1744": "mountain",
    "656-1744": "mountain",
    "640-1760": "mountain",
    "656-1760": "mountain",
    "672-1760": "mountain",
    "656-1776": "mountain",
    "656-1792": "mountain",
    "656-1808": "mountain",
    "688-1808": "mountain",
    "688-1792": "mountain",
    "672-1776": "mountain",
    "688-1776": "mountain",
    "672-1792": "mountain",
    "672-1808": "mountain",
    "704-1792": "mountain",
    "704-1808": "mountain",
    "720-1808": "mountain",
    "688-1824": "mountain",
    "688-1840": "mountain",
    "704-1824": "mountain",
    "704-1840": "mountain",
    "704-1856": "mountain",
    "720-1856": "mountain",
    "720-1840": "mountain",
    "720-1824": "mountain",
    "736-1824": "mountain",
    "736-1840": "mountain",
    "336-1984": "mountain",
    "336-2000": "mountain",
    "352-1968": "mountain",
    "352-1984": "mountain",
    "352-2000": "mountain",
    "352-2016": "mountain",
    "368-1968": "mountain",
    "368-1984": "mountain",
    "368-2000": "mountain",
    "368-2016": "mountain",
    "368-2032": "mountain",
    "384-2000": "mountain",
    "384-2016": "mountain",
    "384-2032": "mountain",
    "400-2016": "mountain",
    "400-2032": "mountain",
    "400-2048": "mountain",
    "416-2064": "mountain",
    "416-2048": "mountain",
    "416-2032": "mountain",
    "416-2016": "mountain",
    "432-2080": "mountain",
    "432-2064": "mountain",
    "432-2048": "mountain",
    "432-2032": "mountain",
    "432-2016": "mountain",
    "432-2000": "mountain",
    "448-2064": "mountain",
    "464-2064": "mountain",
    "464-2048": "mountain",
    "448-2048": "mountain",
    "464-2032": "mountain",
    "448-2032": "mountain",
    "464-2016": "mountain",
    "448-2016": "mountain",
    "464-2000": "mountain",
    "448-2000": "mountain",
    "464-1984": "mountain",
    "448-1984": "mountain",
    "448-1968": "mountain",
    "464-1968": "mountain",
    "464-1952": "mountain",
    "464-1936": "mountain",
    "464-1920": "mountain",
    "480-1888": "mountain",
    "480-1904": "mountain",
    "480-1920": "mountain",
    "480-1936": "mountain",
    "480-1952": "mountain",
    "480-1968": "mountain",
    "480-1984": "mountain",
    "480-2000": "mountain",
    "480-2016": "mountain",
    "480-2032": "mountain",
    "496-2016": "mountain",
    "512-2016": "mountain",
    "512-2000": "mountain",
    "496-2000": "mountain",
    "512-1984": "mountain",
    "496-1984": "mountain",
    "512-1968": "mountain",
    "496-1968": "mountain",
    "512-1952": "mountain",
    "496-1952": "mountain",
    "512-1936": "mountain",
    "496-1936": "mountain",
    "512-1920": "mountain",
    "496-1920": "mountain",
    "496-1904": "mountain",
    "496-1888": "mountain",
    "496-1872": "mountain",
    "528-1968": "mountain",
    "544-1968": "mountain",
    "528-1984": "mountain",
    "544-1984": "mountain",
    "544-2000": "mountain",
    "528-2000": "mountain",
    "528-2016": "mountain",
    "528-2032": "mountain",
    "544-2016": "mountain",
    "544-2032": "mountain",
    "544-2048": "mountain",
    "544-2064": "mountain",
    "560-2000": "mountain",
    "560-2016": "mountain",
    "560-2032": "mountain",
    "560-2048": "mountain",
    "560-2064": "mountain",
    "560-2080": "mountain",
    "576-2016": "mountain",
    "592-2016": "mountain",
    "592-2032": "mountain",
    "576-2032": "mountain",
    "576-2048": "mountain",
    "576-2064": "mountain",
    "576-2080": "mountain",
    "592-2048": "mountain",
    "592-2064": "mountain",
    "592-2080": "mountain",
    "592-2096": "mountain",
    "608-2048": "mountain",
    "608-2064": "mountain",
    "608-2080": "mountain",
    "608-2096": "mountain",
    "624-2048": "mountain",
    "624-2064": "mountain",
    "624-2080": "mountain",
    "624-2096": "mountain",
    "624-2112": "mountain",
    "640-2064": "mountain",
    "640-2080": "mountain",
    "656-2080": "mountain",
    "672-2080": "mountain",
    "672-2096": "mountain",
    "656-2096": "mountain",
    "640-2096": "mountain",
    "640-2112": "mountain",
    "656-2112": "mountain",
    "672-2112": "mountain",
    "640-2128": "mountain",
    "656-2128": "mountain",
    "672-2128": "mountain",
    "640-2144": "mountain",
    "656-2144": "mountain",
    "672-2144": "mountain",
    "640-2176": "mountain",
    "672-2160": "mountain",
    "656-2160": "mountain",
    "640-2160": "mountain",
    "656-2176": "mountain",
    "672-2176": "mountain",
    "624-2192": "mountain",
    "640-2192": "mountain",
    "656-2192": "mountain",
    "672-2192": "mountain",
    "608-2208": "mountain",
    "624-2208": "mountain",
    "640-2208": "mountain",
    "656-2208": "mountain",
    "672-2208": "mountain",
    "672-2224": "mountain",
    "656-2224": "mountain",
    "640-2224": "mountain",
    "624-2224": "mountain",
    "608-2224": "mountain",
    "592-2224": "mountain",
    "592-2240": "mountain",
    "608-2240": "mountain",
    "624-2240": "mountain",
    "640-2240": "mountain",
    "656-2240": "mountain",
    "672-2240": "mountain",
    "672-2256": "mountain",
    "656-2256": "mountain",
    "640-2256": "mountain",
    "624-2256": "mountain",
    "608-2256": "mountain",
    "592-2256": "mountain",
    "576-2256": "mountain",
    "576-2272": "mountain",
    "592-2272": "mountain",
    "608-2272": "mountain",
    "624-2272": "mountain",
    "640-2272": "mountain",
    "656-2272": "mountain",
    "672-2272": "mountain",
    "672-2288": "mountain",
    "656-2288": "mountain",
    "640-2288": "mountain",
    "624-2288": "mountain",
    "608-2288": "mountain",
    "592-2288": "mountain",
    "576-2288": "mountain",
    "576-2304": "mountain",
    "576-2320": "mountain",
    "576-2336": "mountain",
    "576-2352": "mountain",
    "576-2368": "mountain",
    "576-2384": "mountain",
    "592-2304": "mountain",
    "592-2320": "mountain",
    "592-2336": "mountain",
    "592-2352": "mountain",
    "592-2368": "mountain",
    "592-2384": "mountain",
    "592-2400": "mountain",
    "592-2416": "mountain",
    "608-2304": "mountain",
    "608-2320": "mountain",
    "608-2336": "mountain",
    "608-2352": "mountain",
    "608-2368": "mountain",
    "608-2384": "mountain",
    "608-2400": "mountain",
    "608-2416": "mountain",
    "624-2304": "mountain",
    "624-2320": "mountain",
    "624-2336": "mountain",
    "624-2352": "mountain",
    "624-2368": "mountain",
    "624-2384": "mountain",
    "624-2400": "mountain",
    "624-2416": "mountain",
    "624-2432": "mountain",
    "640-2304": "mountain",
    "640-2320": "mountain",
    "640-2336": "mountain",
    "640-2352": "mountain",
    "640-2368": "mountain",
    "640-2384": "mountain",
    "640-2400": "mountain",
    "640-2416": "mountain",
    "640-2432": "mountain",
    "640-2448": "mountain",
    "640-2464": "mountain",
    "656-2304": "mountain",
    "656-2320": "mountain",
    "656-2336": "mountain",
    "656-2352": "mountain",
    "656-2368": "mountain",
    "656-2384": "mountain",
    "656-2400": "mountain",
    "656-2416": "mountain",
    "656-2432": "mountain",
    "656-2448": "mountain",
    "656-2464": "mountain",
    "656-2480": "mountain",
    "656-2496": "mountain",
    "672-2496": "mountain",
    "672-2480": "mountain",
    "672-2464": "mountain",
    "672-2448": "mountain",
    "672-2432": "mountain",
    "672-2416": "mountain",
    "672-2400": "mountain",
    "672-2384": "mountain",
    "672-2368": "mountain",
    "672-2352": "mountain",
    "672-2336": "mountain",
    "672-2320": "mountain",
    "672-2304": "mountain",
    "688-2096": "mountain",
    "704-2096": "mountain",
    "704-2112": "mountain",
    "688-2112": "mountain",
    "688-2128": "mountain",
    "704-2128": "mountain",
    "704-2144": "mountain",
    "688-2144": "mountain",
    "688-2160": "mountain",
    "704-2160": "mountain",
    "704-2176": "mountain",
    "688-2176": "mountain",
    "688-2192": "mountain",
    "704-2192": "mountain",
    "704-2208": "mountain",
    "688-2208": "mountain",
    "688-2224": "mountain",
    "704-2224": "mountain",
    "704-2240": "mountain",
    "688-2240": "mountain",
    "688-2256": "mountain",
    "688-2272": "mountain",
    "688-2288": "mountain",
    "688-2384": "mountain",
    "688-2400": "mountain",
    "688-2416": "mountain",
    "688-2432": "mountain",
    "688-2448": "mountain",
    "688-2464": "mountain",
    "688-2480": "mountain",
    "688-2496": "mountain",
    "688-2512": "mountain",
    "704-2512": "mountain",
    "704-2496": "mountain",
    "704-2480": "mountain",
    "704-2464": "mountain",
    "704-2448": "mountain",
    "704-2432": "mountain",
    "704-2416": "mountain",
    "704-2400": "mountain",
    "704-2384": "mountain",
    "720-2528": "mountain",
    "720-2512": "mountain",
    "720-2496": "mountain",
    "720-2480": "mountain",
    "720-2464": "mountain",
    "720-2448": "mountain",
    "720-2432": "mountain",
    "720-2416": "mountain",
    "720-2400": "mountain",
    "720-2384": "mountain",
    "720-2208": "mountain",
    "720-2192": "mountain",
    "720-2176": "mountain",
    "720-2160": "mountain",
    "720-2144": "mountain",
    "720-2128": "mountain",
    "720-2112": "mountain",
    "720-2096": "mountain",
    "720-2080": "mountain",
    "736-2064": "mountain",
    "736-2080": "mountain",
    "736-2096": "mountain",
    "736-2112": "mountain",
    "736-2128": "mountain",
    "736-2144": "mountain",
    "736-2160": "mountain",
    "736-2176": "mountain",
    "736-2192": "mountain",
    "752-2048": "mountain",
    "752-2064": "mountain",
    "752-2080": "mountain",
    "752-2096": "mountain",
    "752-2112": "mountain",
    "752-2128": "mountain",
    "752-2144": "mountain",
    "752-2160": "mountain",
    "752-2176": "mountain",
    "752-2192": "mountain",
    "768-2048": "mountain",
    "768-2064": "mountain",
    "768-2080": "mountain",
    "768-2096": "mountain",
    "768-2112": "mountain",
    "768-2128": "mountain",
    "768-2144": "mountain",
    "768-2160": "mountain",
    "768-2176": "mountain",
    "784-2032": "mountain",
    "800-2032": "mountain",
    "784-2048": "mountain",
    "784-2080": "mountain",
    "784-2064": "mountain",
    "784-2096": "mountain",
    "784-2112": "mountain",
    "784-2128": "mountain",
    "784-2144": "mountain",
    "784-2160": "mountain",
    "784-2176": "mountain",
    "784-2192": "mountain",
    "800-2064": "mountain",
    "816-2064": "mountain",
    "832-2080": "mountain",
    "816-2080": "mountain",
    "800-2080": "mountain",
    "800-2096": "mountain",
    "816-2096": "mountain",
    "832-2096": "mountain",
    "832-2112": "mountain",
    "848-2112": "mountain",
    "816-2112": "mountain",
    "800-2112": "mountain",
    "800-2128": "mountain",
    "816-2128": "mountain",
    "832-2128": "mountain",
    "848-2128": "mountain",
    "848-2144": "mountain",
    "832-2144": "mountain",
    "816-2144": "mountain",
    "800-2144": "mountain",
    "800-2160": "mountain",
    "800-2176": "mountain",
    "800-2192": "mountain",
    "816-2192": "mountain",
    "816-2176": "mountain",
    "816-2160": "mountain",
    "832-2160": "mountain",
    "832-2176": "mountain",
    "832-2192": "mountain",
    "832-2208": "mountain",
    "848-2224": "mountain",
    "848-2208": "mountain",
    "848-2192": "mountain",
    "848-2176": "mountain",
    "848-2160": "mountain",
    "864-2144": "mountain",
    "880-2144": "mountain",
    "896-2144": "mountain",
    "896-2160": "mountain",
    "880-2160": "mountain",
    "864-2160": "mountain",
    "864-2176": "mountain",
    "864-2192": "mountain",
    "864-2208": "mountain",
    "864-2224": "mountain",
    "864-2240": "mountain",
    "864-2256": "mountain",
    "880-2176": "mountain",
    "880-2192": "mountain",
    "880-2224": "mountain",
    "880-2208": "mountain",
    "880-2240": "mountain",
    "880-2256": "mountain",
    "896-2176": "mountain",
    "896-2192": "mountain",
    "896-2208": "mountain",
    "896-2224": "mountain",
    "896-2240": "mountain",
    "896-2256": "mountain",
    "896-2272": "mountain",
    "912-2272": "mountain",
    "912-2256": "mountain",
    "912-2240": "mountain",
    "912-2224": "mountain",
    "912-2208": "mountain",
    "912-2192": "mountain",
    "912-2176": "mountain",
    "912-2160": "mountain",
    "928-2160": "mountain",
    "928-2176": "mountain",
    "928-2192": "mountain",
    "928-2208": "mountain",
    "928-2224": "mountain",
    "928-2240": "mountain",
    "944-2160": "mountain",
    "944-2176": "mountain",
    "944-2192": "mountain",
    "944-2208": "mountain",
    "944-2224": "mountain",
    "960-2208": "mountain",
    "960-2192": "mountain",
    "960-2176": "mountain",
    "960-2160": "mountain",
    "976-2144": "mountain",
    "976-2160": "mountain",
    "976-2176": "mountain",
    "976-2192": "mountain",
    "976-2208": "mountain",
    "992-2224": "mountain",
    "992-2208": "mountain",
    "992-2192": "mountain",
    "992-2176": "mountain",
    "992-2160": "mountain",
    "992-2144": "mountain",
    "1008-2144": "mountain",
    "1008-2160": "mountain",
    "1008-2176": "mountain",
    "1008-2192": "mountain",
    "1008-2208": "mountain",
    "1008-2224": "mountain",
    "1024-2240": "mountain",
    "1024-2224": "mountain",
    "1024-2208": "mountain",
    "1024-2192": "mountain",
    "1024-2176": "mountain",
    "1024-2160": "mountain",
    "1024-2144": "mountain",
    "1040-2112": "mountain",
    "1040-2128": "mountain",
    "1040-2144": "mountain",
    "1040-2160": "mountain",
    "1040-2176": "mountain",
    "1040-2192": "mountain",
    "1040-2208": "mountain",
    "1040-2224": "mountain",
    "1040-2240": "mountain",
    "1040-2256": "mountain",
    "1056-2256": "mountain",
    "1056-2240": "mountain",
    "1056-2224": "mountain",
    "1056-2208": "mountain",
    "1056-2192": "mountain",
    "1056-2176": "mountain",
    "1056-2160": "mountain",
    "1056-2144": "mountain",
    "1056-2128": "mountain",
    "1056-2112": "mountain",
    "1072-2096": "mountain",
    "1072-2112": "mountain",
    "1072-2128": "mountain",
    "1072-2144": "mountain",
    "1072-2160": "mountain",
    "1072-2176": "mountain",
    "1072-2192": "mountain",
    "1072-2208": "mountain",
    "1072-2224": "mountain",
    "1072-2240": "mountain",
    "1088-2208": "mountain",
    "1104-2208": "mountain",
    "1088-2192": "mountain",
    "1104-2192": "mountain",
    "1120-2192": "mountain",
    "1136-2192": "mountain",
    "1088-2176": "mountain",
    "1088-2160": "mountain",
    "1088-2144": "mountain",
    "1088-2128": "mountain",
    "1088-2112": "mountain",
    "1088-2096": "mountain",
    "1088-2080": "mountain",
    "1104-2064": "mountain",
    "1104-2080": "mountain",
    "1104-2096": "mountain",
    "1104-2112": "mountain",
    "1104-2128": "mountain",
    "1104-2144": "mountain",
    "1104-2160": "mountain",
    "1104-2176": "mountain",
    "1120-2176": "mountain",
    "1120-2160": "mountain",
    "1120-2144": "mountain",
    "1120-2128": "mountain",
    "1120-2112": "mountain",
    "1120-2096": "mountain",
    "1120-2080": "mountain",
    "1120-2064": "mountain",
    "1136-2064": "mountain",
    "1136-2080": "mountain",
    "1136-2096": "mountain",
    "1136-2112": "mountain",
    "1136-2128": "mountain",
    "1136-2144": "mountain",
    "1136-2160": "mountain",
    "1136-2176": "mountain",
    "1152-2176": "mountain",
    "1168-2176": "mountain",
    "1184-2176": "mountain",
    "1152-2160": "mountain",
    "1184-2160": "mountain",
    "1168-2160": "mountain",
    "1200-2160": "mountain",
    "1152-2144": "mountain",
    "1168-2144": "mountain",
    "1184-2144": "mountain",
    "1200-2144": "mountain",
    "1152-2128": "mountain",
    "1168-2128": "mountain",
    "1184-2128": "mountain",
    "1200-2128": "mountain",
    "1216-2128": "mountain",
    "1152-2112": "mountain",
    "1152-2096": "mountain",
    "1152-2080": "mountain",
    "1152-2064": "mountain",
    "1168-2064": "mountain",
    "1168-2080": "mountain",
    "1168-2096": "mountain",
    "1168-2112": "mountain",
    "1184-2048": "mountain",
    "1184-2064": "mountain",
    "1184-2080": "mountain",
    "1184-2096": "mountain",
    "1184-2112": "mountain",
    "1200-2048": "mountain",
    "1200-2064": "mountain",
    "1200-2080": "mountain",
    "1200-2096": "mountain",
    "1200-2112": "mountain",
    "1216-2048": "mountain",
    "1216-2064": "mountain",
    "1216-2080": "mountain",
    "1216-2096": "mountain",
    "1216-2112": "mountain",
    "1232-2080": "mountain",
    "1232-2064": "mountain",
    "1232-2048": "mountain",
    "1232-2032": "mountain",
    "1248-2032": "mountain",
    "1248-2048": "mountain",
    "1248-2064": "mountain",
    "1248-2080": "mountain",
    "1264-2080": "mountain",
    "1280-2080": "mountain",
    "1264-2064": "mountain",
    "1280-2064": "mountain",
    "1296-2064": "mountain",
    "1312-2064": "mountain",
    "1312-2048": "mountain",
    "1296-2048": "mountain",
    "1280-2048": "mountain",
    "1264-2048": "mountain",
    "1264-2032": "mountain",
    "1264-2016": "mountain",
    "1264-2000": "mountain",
    "1264-1984": "mountain",
    "1296-1984": "mountain",
    "1280-2000": "mountain",
    "1280-1984": "mountain",
    "1280-2016": "mountain",
    "1280-2032": "mountain",
    "1296-2000": "mountain",
    "1296-2016": "mountain",
    "1296-2032": "mountain",
    "1312-2032": "mountain",
    "1312-2016": "mountain",
    "1312-2000": "mountain",
    "1312-1984": "mountain",
    "1328-1968": "mountain",
    "1328-1984": "mountain",
    "1328-2000": "mountain",
    "1328-2016": "mountain",
    "1328-2032": "mountain",
    "1344-2032": "mountain",
    "1360-2032": "mountain",
    "1344-2016": "mountain",
    "1360-2016": "mountain",
    "1344-2000": "mountain",
    "1360-2000": "mountain",
    "1376-2000": "mountain",
    "1344-1984": "mountain",
    "1360-1984": "mountain",
    "1376-1984": "mountain",
    "1344-1968": "mountain",
    "1360-1968": "mountain",
    "1376-1968": "mountain",
    "1344-1952": "mountain",
    "1360-1952": "mountain",
    "1376-1952": "mountain",
    "1344-1936": "mountain",
    "1360-1936": "mountain",
    "1376-1936": "mountain",
    "1360-1920": "mountain",
    "1376-1920": "mountain",
    "1088-1760": "mountain",
    "1072-1776": "mountain",
    "1088-1776": "mountain",
    "1104-1776": "mountain",
    "1056-1792": "mountain",
    "1072-1792": "mountain",
    "1088-1792": "mountain",
    "1104-1792": "mountain",
    "1120-1792": "mountain",
    "1120-1808": "mountain",
    "1104-1808": "mountain",
    "1088-1808": "mountain",
    "1072-1808": "mountain",
    "1056-1808": "mountain",
    "1040-1808": "mountain",
    "1040-1824": "mountain",
    "1056-1824": "mountain",
    "1072-1824": "mountain",
    "1040-1840": "mountain",
    "1056-1840": "mountain",
    "1072-1840": "mountain",
    "1040-1856": "mountain",
    "1056-1856": "mountain",
    "1072-1856": "mountain",
    "1040-1872": "mountain",
    "1056-1872": "mountain",
    "1072-1872": "mountain",
    "1040-1888": "mountain",
    "1056-1888": "mountain",
    "1072-1888": "mountain",
    "1040-1904": "mountain",
    "1056-1904": "mountain",
    "1072-1904": "mountain",
    "1056-1920": "mountain",
    "1056-1936": "mountain",
    "1072-1920": "mountain",
    "1072-1936": "mountain",
    "1072-1952": "mountain",
    "1088-1920": "mountain",
    "1088-1936": "mountain",
    "1088-1952": "mountain",
    "1088-1968": "mountain",
    "1088-1984": "mountain",
    "1088-2000": "mountain",
    "1104-1920": "mountain",
    "1104-1936": "mountain",
    "1104-1952": "mountain",
    "1104-1968": "mountain",
    "1104-1984": "mountain",
    "1104-2000": "mountain",
    "1104-2016": "mountain",
    "1120-1920": "mountain",
    "1120-1936": "mountain",
    "1120-1952": "mountain",
    "1120-1968": "mountain",
    "1120-1984": "mountain",
    "1120-2000": "mountain",
    "1120-2016": "mountain",
    "1120-2032": "mountain",
    "1136-1920": "mountain",
    "1136-1936": "mountain",
    "1136-1952": "mountain",
    "1136-1968": "mountain",
    "1136-1984": "mountain",
    "1136-2000": "mountain",
    "1136-2016": "mountain",
    "1136-2032": "mountain",
    "1152-2032": "mountain",
    "1152-2016": "mountain",
    "1152-2000": "mountain",
    "1152-1984": "mountain",
    "1152-1968": "mountain",
    "1152-1952": "mountain",
    "1152-1936": "mountain",
    "1152-1920": "mountain",
    "1152-1904": "mountain",
    "1168-1904": "mountain",
    "1168-1920": "mountain",
    "1168-1936": "mountain",
    "1168-1952": "mountain",
    "1168-1968": "mountain",
    "1168-1984": "mountain",
    "1168-2000": "mountain",
    "1168-2016": "mountain",
    "1184-2016": "mountain",
    "1200-2016": "mountain",
    "1184-2000": "mountain",
    "1200-2000": "mountain",
    "1216-2000": "mountain",
    "1184-1984": "mountain",
    "1200-1984": "mountain",
    "1216-1984": "mountain",
    "1184-1968": "mountain",
    "1216-1968": "mountain",
    "1200-1968": "mountain",
    "1232-1968": "mountain",
    "1184-1952": "mountain",
    "1184-1936": "mountain",
    "1184-1920": "mountain",
    "1184-1904": "mountain",
    "1200-1888": "mountain",
    "1200-1904": "mountain",
    "1200-1920": "mountain",
    "1200-1936": "mountain",
    "1200-1952": "mountain",
    "1216-1952": "mountain",
    "1216-1936": "mountain",
    "1216-1920": "mountain",
    "1216-1904": "mountain",
    "1216-1888": "mountain",
    "1216-1872": "mountain",
    "1232-1888": "mountain",
    "1248-1888": "mountain",
    "1264-1888": "mountain",
    "1280-1888": "mountain",
    "1280-1872": "mountain",
    "1296-1888": "mountain",
    "1296-1904": "mountain",
    "1296-1920": "mountain",
    "1280-1904": "mountain",
    "1280-1920": "mountain",
    "1280-1936": "mountain",
    "1264-1904": "mountain",
    "1264-1920": "mountain",
    "1264-1936": "mountain",
    "1264-1952": "mountain",
    "1248-1952": "mountain",
    "1232-1952": "mountain",
    "1232-1936": "mountain",
    "1232-1920": "mountain",
    "1232-1904": "mountain",
    "1248-1904": "mountain",
    "1248-1920": "mountain",
    "1248-1936": "mountain",
    "2736-464": "mountain",
    "2736-480": "mountain",
    "2752-464": "mountain",
    "2752-480": "mountain",
    "2752-496": "mountain",
    "2752-512": "mountain",
    "2768-448": "mountain",
    "2768-464": "mountain",
    "2768-480": "mountain",
    "2768-496": "mountain",
    "2768-512": "mountain",
    "2768-528": "mountain",
    "2784-448": "mountain",
    "2784-464": "mountain",
    "2784-480": "mountain",
    "2784-496": "mountain",
    "2784-512": "mountain",
    "2784-528": "mountain",
    "2784-544": "mountain",
    "2800-448": "mountain",
    "2816-448": "mountain",
    "2800-464": "mountain",
    "2816-464": "mountain",
    "2800-480": "mountain",
    "2816-480": "mountain",
    "2832-480": "mountain",
    "2832-496": "mountain",
    "2816-496": "mountain",
    "2800-496": "mountain",
    "2800-512": "mountain",
    "2800-528": "mountain",
    "2800-544": "mountain",
    "2816-512": "mountain",
    "2816-528": "mountain",
    "2816-544": "mountain",
    "2832-512": "mountain",
    "2832-544": "mountain",
    "2832-528": "mountain",
    "2848-544": "mountain",
    "2848-560": "mountain",
    "2832-560": "mountain",
    "2816-560": "mountain",
    "2800-560": "mountain",
    "2800-576": "mountain",
    "2800-592": "mountain",
    "2784-608": "mountain",
    "2784-624": "mountain",
    "2784-640": "mountain",
    "2784-656": "mountain",
    "2784-672": "mountain",
    "2784-688": "mountain",
    "2768-704": "mountain",
    "2768-720": "mountain",
    "2768-736": "mountain",
    "2784-704": "mountain",
    "2784-720": "mountain",
    "2784-736": "mountain",
    "2784-752": "mountain",
    "2784-768": "mountain",
    "2784-784": "mountain",
    "2784-800": "mountain",
    "2800-816": "mountain",
    "2800-800": "mountain",
    "2800-784": "mountain",
    "2800-768": "mountain",
    "2800-752": "mountain",
    "2800-736": "mountain",
    "2800-720": "mountain",
    "2800-704": "mountain",
    "2800-688": "mountain",
    "2800-672": "mountain",
    "2800-656": "mountain",
    "2800-640": "mountain",
    "2800-624": "mountain",
    "2800-608": "mountain",
    "2816-576": "mountain",
    "2816-592": "mountain",
    "2816-608": "mountain",
    "2816-624": "mountain",
    "2816-640": "mountain",
    "2816-656": "mountain",
    "2816-672": "mountain",
    "2816-688": "mountain",
    "2816-704": "mountain",
    "2816-720": "mountain",
    "2816-736": "mountain",
    "2816-752": "mountain",
    "2816-768": "mountain",
    "2816-784": "mountain",
    "2816-800": "mountain",
    "2816-816": "mountain",
    "2816-832": "mountain",
    "2816-848": "mountain",
    "2816-864": "mountain",
    "2816-880": "mountain",
    "2832-896": "mountain",
    "2848-912": "mountain",
    "2864-928": "mountain",
    "2880-928": "mountain",
    "2896-928": "mountain",
    "2912-896": "mountain",
    "2912-912": "mountain",
    "2896-912": "mountain",
    "2880-912": "mountain",
    "2864-912": "mountain",
    "2864-896": "mountain",
    "2848-896": "mountain",
    "2848-880": "mountain",
    "2832-880": "mountain",
    "2832-864": "mountain",
    "2848-864": "mountain",
    "2832-848": "mountain",
    "2848-848": "mountain",
    "2864-848": "mountain",
    "2848-832": "mountain",
    "2832-832": "mountain",
    "2832-816": "mountain",
    "2848-816": "mountain",
    "2848-800": "mountain",
    "2832-800": "mountain",
    "2832-784": "mountain",
    "2832-768": "mountain",
    "2832-704": "mountain",
    "2832-688": "mountain",
    "2832-672": "mountain",
    "2832-656": "mountain",
    "2832-640": "mountain",
    "2832-624": "mountain",
    "2832-608": "mountain",
    "2832-592": "mountain",
    "2832-576": "mountain",
    "2848-576": "mountain",
    "2848-592": "mountain",
    "2848-608": "mountain",
    "2848-624": "mountain",
    "2848-640": "mountain",
    "2864-576": "mountain",
    "2864-592": "mountain",
    "2864-608": "mountain",
    "3088-512": "mountain",
    "3104-512": "mountain",
    "3088-528": "mountain",
    "3104-528": "mountain",
    "3088-544": "mountain",
    "3104-544": "mountain",
    "3120-544": "mountain",
    "3136-544": "mountain",
    "3136-560": "mountain",
    "3120-560": "mountain",
    "3104-560": "mountain",
    "3088-560": "mountain",
    "3072-560": "mountain",
    "3072-576": "mountain",
    "3088-576": "mountain",
    "3104-576": "mountain",
    "3104-592": "mountain",
    "3088-592": "mountain",
    "3072-592": "mountain",
    "3056-592": "mountain",
    "3040-592": "mountain",
    "3008-608": "mountain",
    "3008-624": "mountain",
    "3024-608": "mountain",
    "3024-624": "mountain",
    "3040-608": "mountain",
    "3040-624": "mountain",
    "3056-608": "mountain",
    "3056-624": "mountain",
    "3072-608": "mountain",
    "3056-640": "mountain",
    "3040-640": "mountain",
    "3024-640": "mountain",
    "3008-640": "mountain",
    "2992-640": "mountain",
    "2992-656": "mountain",
    "3008-656": "mountain",
    "3024-656": "mountain",
    "3040-656": "mountain",
    "3056-656": "mountain",
    "3072-656": "mountain",
    "3008-672": "mountain",
    "3008-688": "mountain",
    "3008-704": "mountain",
    "3040-672": "mountain",
    "3024-672": "mountain",
    "3024-688": "mountain",
    "3024-704": "mountain",
    "3024-720": "mountain",
    "3040-688": "mountain",
    "3040-704": "mountain",
    "3040-720": "mountain",
    "3040-736": "mountain",
    "3056-672": "mountain",
    "3072-672": "mountain",
    "3088-672": "mountain",
    "3104-672": "mountain",
    "3056-688": "mountain",
    "3056-704": "mountain",
    "3056-720": "mountain",
    "3056-736": "mountain",
    "3072-736": "mountain",
    "3072-720": "mountain",
    "3072-704": "mountain",
    "3072-688": "mountain",
    "3088-688": "mountain",
    "3104-688": "mountain",
    "3120-688": "mountain",
    "3088-704": "mountain",
    "3088-720": "mountain",
    "3088-736": "mountain",
    "3104-736": "mountain",
    "3104-720": "mountain",
    "3104-704": "mountain",
    "3120-704": "mountain",
    "3120-720": "mountain",
    "3120-736": "mountain",
    "3136-720": "mountain",
    "3136-736": "mountain",
    "3136-752": "mountain",
    "3136-768": "mountain",
    "3152-736": "mountain",
    "3168-736": "mountain",
    "3152-752": "mountain",
    "3152-768": "mountain",
    "3168-752": "mountain",
    "3168-768": "mountain",
    "3168-784": "mountain",
    "3184-768": "mountain",
    "3184-784": "mountain",
    "3184-800": "mountain",
    "3200-784": "mountain",
    "3200-800": "mountain",
    "3200-816": "mountain",
    "3216-816": "mountain",
    "3232-816": "mountain",
    "3248-816": "mountain",
    "3216-928": "mountain",
    "3200-928": "mountain",
    "3200-944": "mountain",
    "3184-944": "mountain",
    "3184-928": "mountain",
    "3168-912": "mountain",
    "3168-928": "mountain",
    "3168-944": "mountain",
    "3168-960": "mountain",
    "3152-960": "mountain",
    "3152-944": "mountain",
    "3152-928": "mountain",
    "3152-912": "mountain",
    "3152-896": "mountain",
    "3136-896": "mountain",
    "3120-896": "mountain",
    "3104-912": "mountain",
    "3120-912": "mountain",
    "3136-912": "mountain",
    "3088-928": "mountain",
    "3104-928": "mountain",
    "3120-928": "mountain",
    "3136-928": "mountain",
    "3136-944": "mountain",
    "3136-960": "mountain",
    "3120-960": "mountain",
    "3120-944": "mountain",
    "3104-944": "mountain",
    "3088-944": "mountain",
    "3072-944": "mountain",
    "3040-960": "mountain",
    "3056-960": "mountain",
    "3072-960": "mountain",
    "3088-960": "mountain",
    "3104-960": "mountain",
    "3104-976": "mountain",
    "3088-976": "mountain",
    "3072-976": "mountain",
    "3056-976": "mountain",
    "3040-976": "mountain",
    "3024-976": "mountain",
    "3008-976": "mountain",
    "3008-992": "mountain",
    "2992-1008": "mountain",
    "3008-1008": "mountain",
    "3024-992": "mountain",
    "3024-1008": "mountain",
    "3040-992": "mountain",
    "3040-1008": "mountain",
    "3056-992": "mountain",
    "3056-1008": "mountain",
    "3072-992": "mountain",
    "3072-1008": "mountain",
    "3088-992": "mountain",
    "3088-1008": "mountain",
    "3088-1024": "mountain",
    "3088-1040": "mountain",
    "3088-1056": "mountain",
    "3088-1072": "mountain",
    "3088-1088": "mountain",
    "3088-1104": "mountain",
    "3104-1088": "mountain",
    "3104-1072": "mountain",
    "3104-1056": "mountain",
    "3104-1040": "mountain",
    "3120-1056": "mountain",
    "3120-1072": "mountain",
    "3072-1024": "mountain",
    "3072-1040": "mountain",
    "3072-1056": "mountain",
    "3072-1072": "mountain",
    "3072-1088": "mountain",
    "3072-1104": "mountain",
    "3072-1120": "mountain",
    "3056-1136": "mountain",
    "3056-1120": "mountain",
    "3056-1104": "mountain",
    "3056-1088": "mountain",
    "3056-1072": "mountain",
    "3056-1056": "mountain",
    "3056-1040": "mountain",
    "3056-1024": "mountain",
    "3040-1024": "mountain",
    "3024-1024": "mountain",
    "3008-1024": "mountain",
    "2992-1024": "mountain",
    "2976-1040": "mountain",
    "2976-1056": "mountain",
    "2992-1056": "mountain",
    "2992-1040": "mountain",
    "3008-1040": "mountain",
    "3008-1056": "mountain",
    "3024-1056": "mountain",
    "3024-1040": "mountain",
    "3040-1040": "mountain",
    "3040-1056": "mountain",
    "3040-1072": "mountain",
    "3040-1088": "mountain",
    "3040-1104": "mountain",
    "3040-1120": "mountain",
    "3040-1136": "mountain",
    "3040-1152": "mountain",
    "3024-1152": "mountain",
    "3024-1168": "mountain",
    "3008-1168": "mountain",
    "3008-1184": "mountain",
    "3008-1200": "mountain",
    "2992-1200": "mountain",
    "2992-1216": "mountain",
    "2992-1232": "mountain",
    "2976-1232": "mountain",
    "2960-1232": "mountain",
    "2960-1248": "mountain",
    "3024-1088": "mountain",
    "3024-1072": "mountain",
    "3008-1072": "mountain",
    "3008-1088": "mountain",
    "2992-1072": "mountain",
    "2976-1072": "mountain",
    "2976-1088": "mountain",
    "2992-1088": "mountain",
    "2992-1104": "mountain",
    "2976-1104": "mountain",
    "2976-1120": "mountain",
    "2960-1088": "mountain",
    "2960-1104": "mountain",
    "2960-1120": "mountain",
    "2960-1136": "mountain",
    "2944-1136": "mountain",
    "2944-1120": "mountain",
    "2944-1104": "mountain",
    "2944-1088": "mountain",
    "2928-1104": "mountain",
    "2912-1104": "mountain",
    "2896-1104": "mountain",
    "2880-1120": "mountain",
    "2896-1120": "mountain",
    "2912-1120": "mountain",
    "2928-1120": "mountain",
    "2928-1136": "mountain",
    "2928-1152": "mountain",
    "2912-1152": "mountain",
    "2912-1136": "mountain",
    "2896-1136": "mountain",
    "2896-1152": "mountain",
    "2880-1152": "mountain",
    "2880-1136": "mountain",
    "2864-1136": "mountain",
    "2864-1152": "mountain",
    "2848-1168": "mountain",
    "2848-1184": "mountain",
    "2848-1200": "mountain",
    "2864-1184": "mountain",
    "2864-1168": "mountain",
    "2880-1168": "mountain",
    "2896-1168": "mountain",
    "1200-1648": "mountain",
    "1200-1664": "mountain",
    "1216-1648": "mountain",
    "1216-1664": "mountain",
    "1232-1648": "mountain",
    "1232-1664": "mountain",
    "1232-1680": "mountain",
    "1248-1632": "mountain",
    "1264-1632": "mountain",
    "1280-1632": "mountain",
    "1280-1648": "mountain",
    "1264-1648": "mountain",
    "1248-1648": "mountain",
    "1248-1664": "mountain",
    "1248-1680": "mountain",
    "1248-1696": "mountain",
    "1264-1664": "mountain",
    "1264-1680": "mountain",
    "1264-1696": "mountain",
    "1264-1712": "mountain",
    "1264-1728": "mountain",
    "1280-1664": "mountain",
    "1296-1648": "mountain",
    "1312-1648": "mountain",
    "1312-1664": "mountain",
    "1296-1664": "mountain",
    "1280-1680": "mountain",
    "1280-1696": "mountain",
    "1280-1712": "mountain",
    "1280-1728": "mountain",
    "1280-1744": "mountain",
    "1280-1760": "mountain",
    "1296-1760": "mountain",
    "1296-1744": "mountain",
    "1296-1728": "mountain",
    "1296-1712": "mountain",
    "1296-1696": "mountain",
    "1296-1680": "mountain",
    "1312-1680": "mountain",
    "1312-1696": "mountain",
    "1312-1712": "mountain",
    "1312-1728": "mountain",
    "1312-1744": "mountain",
    "1312-1760": "mountain",
    "1312-1776": "mountain",
    "1328-1664": "mountain",
    "1328-1680": "mountain",
    "1328-1696": "mountain",
    "1328-1712": "mountain",
    "1328-1728": "mountain",
    "1328-1744": "mountain",
    "1328-1760": "mountain",
    "1328-1776": "mountain",
    "1344-1760": "mountain",
    "1360-1760": "mountain",
    "1376-1760": "mountain",
    "1376-1744": "mountain",
    "1360-1744": "mountain",
    "1344-1744": "mountain",
    "1344-1728": "mountain",
    "1360-1728": "mountain",
    "1376-1728": "mountain",
    "1376-1712": "mountain",
    "1360-1712": "mountain",
    "1344-1712": "mountain",
    "1344-1696": "mountain",
    "1360-1696": "mountain",
    "1376-1696": "mountain",
    "1344-1680": "mountain",
    "1360-1680": "mountain",
    "1376-1680": "mountain",
    "1392-1680": "mountain",
    "1392-1696": "mountain",
    "1392-1712": "mountain",
    "1392-1728": "mountain",
    "1392-1744": "mountain",
    "1392-1760": "mountain",
    "1392-1776": "mountain",
    "1408-1776": "mountain",
    "1424-1776": "mountain",
    "1408-1760": "mountain",
    "1424-1760": "mountain",
    "1440-1760": "mountain",
    "1440-1744": "mountain",
    "1424-1744": "mountain",
    "1408-1744": "mountain",
    "1408-1728": "mountain",
    "1408-1712": "mountain",
    "1408-1696": "mountain",
    "1440-1696": "mountain",
    "1424-1712": "mountain",
    "1424-1728": "mountain",
    "1424-1696": "mountain",
    "1440-1712": "mountain",
    "1440-1728": "mountain",
    "1456-1744": "mountain",
    "1472-1744": "mountain",
    "1488-1728": "mountain",
    "1504-1712": "mountain",
    "1520-1696": "mountain",
    "1536-1680": "mountain",
    "1536-1664": "mountain",
    "1552-1648": "mountain",
    "1552-1632": "mountain",
    "1552-1616": "mountain",
    "1568-1616": "mountain",
    "1568-1600": "mountain",
    "1552-1584": "mountain",
    "1552-1600": "mountain",
    "1536-1584": "mountain",
    "1520-1584": "mountain",
    "1520-1600": "mountain",
    "1536-1600": "mountain",
    "1536-1616": "mountain",
    "1520-1616": "mountain",
    "1504-1616": "mountain",
    "1504-1632": "mountain",
    "1520-1632": "mountain",
    "1536-1632": "mountain",
    "1536-1648": "mountain",
    "1520-1648": "mountain",
    "1504-1648": "mountain",
    "1488-1648": "mountain",
    "1472-1664": "mountain",
    "1456-1680": "mountain",
    "1456-1696": "mountain",
    "1456-1712": "mountain",
    "1456-1728": "mountain",
    "1472-1728": "mountain",
    "1472-1712": "mountain",
    "1472-1696": "mountain",
    "1472-1680": "mountain",
    "1488-1664": "mountain",
    "1504-1664": "mountain",
    "1520-1664": "mountain",
    "1520-1680": "mountain",
    "1504-1680": "mountain",
    "1488-1680": "mountain",
    "1488-1696": "mountain",
    "1488-1712": "mountain",
    "1504-1696": "mountain",
    "1600-1568": "mountain",
    "1616-1552": "mountain",
    "1616-1568": "mountain",
    "1616-1584": "mountain",
    "1632-1552": "mountain",
    "1632-1568": "mountain",
    "1632-1584": "mountain",
    "1632-1600": "mountain",
    "1648-1600": "mountain",
    "1664-1600": "mountain",
    "1648-1584": "mountain",
    "1648-1568": "mountain",
    "1648-1552": "mountain",
    "1664-1552": "mountain",
    "1664-1568": "mountain",
    "1664-1584": "mountain",
    "1680-1584": "mountain",
    "1696-1584": "mountain",
    "1680-1568": "mountain",
    "1680-1552": "mountain",
    "1696-1552": "mountain",
    "1696-1568": "mountain",
    "1712-1568": "mountain",
    "1712-1552": "mountain",
    "1712-1536": "mountain",
    "1728-1536": "mountain",
    "1728-1552": "mountain",
    "1728-1568": "mountain",
    "1744-1552": "mountain",
    "1744-1536": "mountain",
    "1744-1520": "mountain",
    "1744-1504": "mountain",
    "1760-1488": "mountain",
    "1760-1504": "mountain",
    "1760-1520": "mountain",
    "1760-1536": "mountain",
    "1776-1504": "mountain",
    "1776-1488": "mountain",
    "1776-1472": "mountain",
    "1776-1456": "mountain",
    "1792-1456": "mountain",
    "1792-1440": "mountain",
    "1760-1792": "mountain",
    "1776-1792": "mountain",
    "1760-1776": "mountain",
    "1776-1776": "mountain",
    "1776-1760": "mountain",
    "1792-1760": "mountain",
    "1808-1760": "mountain",
    "1824-1760": "mountain",
    "1792-1744": "mountain",
    "1792-1728": "mountain",
    "1808-1744": "mountain",
    "1808-1728": "mountain",
    "1824-1744": "mountain",
    "1824-1728": "mountain",
    "1824-1712": "mountain",
    "1840-1744": "mountain",
    "1840-1728": "mountain",
    "1840-1712": "mountain",
    "1840-1696": "mountain",
    "1840-1680": "mountain",
    "1840-1664": "mountain",
    "1840-1648": "mountain",
    "1840-1632": "mountain",
    "1856-1632": "mountain",
    "1856-1648": "mountain",
    "1856-1664": "mountain",
    "1856-1680": "mountain",
    "1856-1696": "mountain",
    "1856-1712": "mountain",
    "1856-1728": "mountain",
    "1856-1744": "mountain",
    "1872-1728": "mountain",
    "1872-1712": "mountain",
    "1888-1712": "mountain",
    "1872-1696": "mountain",
    "1888-1696": "mountain",
    "1872-1680": "mountain",
    "1888-1680": "mountain",
    "1872-1664": "mountain",
    "1888-1664": "mountain",
    "1904-1664": "mountain",
    "1872-1648": "mountain",
    "1872-1632": "mountain",
    "1872-1616": "mountain",
    "1872-1600": "mountain",
    "1888-1552": "mountain",
    "1888-1568": "mountain",
    "1888-1584": "mountain",
    "1888-1600": "mountain",
    "1888-1616": "mountain",
    "1888-1632": "mountain",
    "1888-1648": "mountain",
    "1904-1520": "mountain",
    "1904-1536": "mountain",
    "1904-1552": "mountain",
    "1904-1568": "mountain",
    "1904-1584": "mountain",
    "1904-1600": "mountain",
    "1904-1616": "mountain",
    "1904-1632": "mountain",
    "1904-1648": "mountain",
    "1920-1616": "mountain",
    "1920-1600": "mountain",
    "1920-1584": "mountain",
    "1920-1568": "mountain",
    "1920-1552": "mountain",
    "3024-2064": "mountain",
    "3024-2080": "mountain",
    "3024-2096": "mountain",
    "3040-2048": "mountain",
    "3040-2064": "mountain",
    "3040-2080": "mountain",
    "3040-2096": "mountain",
    "3040-2112": "mountain",
    "3056-2048": "mountain",
    "3056-2064": "mountain",
    "3056-2080": "mountain",
    "3056-2096": "mountain",
    "3056-2112": "mountain",
    "3056-2128": "mountain",
    "3072-2048": "mountain",
    "3072-2064": "mountain",
    "3072-2080": "mountain",
    "3072-2096": "mountain",
    "3072-2112": "mountain",
    "3072-2128": "mountain",
    "3072-2144": "mountain",
    "3072-2192": "mountain",
    "3072-2208": "mountain",
    "3056-2448": "mountain",
    "3056-2464": "mountain",
    "3056-2480": "mountain",
    "3056-2496": "mountain",
    "3072-2336": "mountain",
    "3072-2352": "mountain",
    "3072-2368": "mountain",
    "3072-2384": "mountain",
    "3072-2400": "mountain",
    "3072-2416": "mountain",
    "3072-2432": "mountain",
    "3072-2448": "mountain",
    "3072-2464": "mountain",
    "3072-2480": "mountain",
    "3072-2512": "mountain",
    "3072-2496": "mountain",
    "3072-2944": "mountain",
    "3072-2928": "mountain",
    "3072-2960": "mountain",
    "3072-2976": "mountain",
    "3072-2992": "mountain",
    "3088-3024": "mountain",
    "3088-3008": "mountain",
    "3088-2992": "mountain",
    "3088-2976": "mountain",
    "3088-2960": "mountain",
    "3088-2944": "mountain",
    "3088-2928": "mountain",
    "3088-2912": "mountain",
    "3088-2896": "mountain",
    "3088-2544": "mountain",
    "3088-2528": "mountain",
    "3088-2512": "mountain",
    "3088-2496": "mountain",
    "3088-2480": "mountain",
    "3088-2464": "mountain",
    "3088-2448": "mountain",
    "3088-2432": "mountain",
    "3088-2416": "mountain",
    "3088-2400": "mountain",
    "3088-2384": "mountain",
    "3088-2368": "mountain",
    "3088-2352": "mountain",
    "3088-2336": "mountain",
    "3088-2320": "mountain",
    "3088-2304": "mountain",
    "3088-2224": "mountain",
    "3088-2208": "mountain",
    "3088-2192": "mountain",
    "3088-2176": "mountain",
    "3088-2160": "mountain",
    "3088-2144": "mountain",
    "3088-2128": "mountain",
    "3088-2112": "mountain",
    "3088-2064": "mountain",
    "3088-2048": "mountain",
    "3088-2032": "mountain",
    "3104-2032": "mountain",
    "3104-2048": "mountain",
    "3104-2064": "mountain",
    "3104-2128": "mountain",
    "3104-2144": "mountain",
    "3104-2160": "mountain",
    "3104-2176": "mountain",
    "3104-2192": "mountain",
    "3104-2208": "mountain",
    "3104-2224": "mountain",
    "3104-2288": "mountain",
    "3104-2320": "mountain",
    "3104-2304": "mountain",
    "3104-2336": "mountain",
    "3104-2352": "mountain",
    "3104-2368": "mountain",
    "3104-2384": "mountain",
    "3104-2400": "mountain",
    "3104-2416": "mountain",
    "3104-2432": "mountain",
    "3104-2448": "mountain",
    "3104-2464": "mountain",
    "3104-2480": "mountain",
    "3104-2496": "mountain",
    "3104-2512": "mountain",
    "3104-2528": "mountain",
    "3104-2544": "mountain",
    "3104-2832": "mountain",
    "3104-2848": "mountain",
    "3104-2864": "mountain",
    "3104-2880": "mountain",
    "3104-2896": "mountain",
    "3104-2912": "mountain",
    "3104-2928": "mountain",
    "3104-2944": "mountain",
    "3104-2960": "mountain",
    "3104-2976": "mountain",
    "3104-2992": "mountain",
    "3104-3008": "mountain",
    "3104-3024": "mountain",
    "3120-3008": "mountain",
    "3120-2992": "mountain",
    "3120-2976": "mountain",
    "3120-2960": "mountain",
    "3120-2944": "mountain",
    "3120-2928": "mountain",
    "3120-2912": "mountain",
    "3120-2896": "mountain",
    "3120-2880": "mountain",
    "3120-2864": "mountain",
    "3120-2848": "mountain",
    "3120-2832": "mountain",
    "3120-2816": "mountain",
    "3120-2800": "mountain",
    "3120-2784": "mountain",
    "3120-2768": "mountain",
    "3120-2752": "mountain",
    "3120-2736": "mountain",
    "3120-2560": "mountain",
    "3120-2544": "mountain",
    "3120-2528": "mountain",
    "3120-2512": "mountain",
    "3120-2352": "mountain",
    "3120-2336": "mountain",
    "3120-2320": "mountain",
    "3120-2304": "mountain",
    "3120-2288": "mountain",
    "3120-2272": "mountain",
    "3120-2240": "mountain",
    "3120-2224": "mountain",
    "3120-2208": "mountain",
    "3120-2192": "mountain",
    "3120-2048": "mountain",
    "3120-2032": "mountain",
    "3120-2016": "mountain",
    "3120-2000": "mountain",
    "3136-2000": "mountain",
    "3136-2016": "mountain",
    "3136-2032": "mountain",
    "3136-2048": "mountain",
    "3136-2208": "mountain",
    "3136-2224": "mountain",
    "3136-2240": "mountain",
    "3136-2272": "mountain",
    "3136-2288": "mountain",
    "3136-2304": "mountain",
    "3136-2320": "mountain",
    "3136-2336": "mountain",
    "3136-2496": "mountain",
    "3136-2512": "mountain",
    "3136-2528": "mountain",
    "3136-2544": "mountain",
    "3136-2560": "mountain",
    "3136-2576": "mountain",
    "3136-2592": "mountain",
    "3136-2608": "mountain",
    "3136-2624": "mountain",
    "3136-2704": "mountain",
    "3136-2720": "mountain",
    "3136-2736": "mountain",
    "3136-2752": "mountain",
    "3136-2768": "mountain",
    "3136-2784": "mountain",
    "3136-2800": "mountain",
    "3136-2816": "mountain",
    "3136-2832": "mountain",
    "3136-2848": "mountain",
    "3136-2864": "mountain",
    "3136-2880": "mountain",
    "3136-2960": "mountain",
    "3136-2976": "mountain",
    "3136-2992": "mountain",
    "3136-3008": "mountain",
    "3152-2992": "mountain",
    "3152-2976": "mountain",
    "3152-2960": "mountain",
    "3152-2864": "mountain",
    "3152-2848": "mountain",
    "3152-2832": "mountain",
    "3152-2816": "mountain",
    "3152-2800": "mountain",
    "3152-2048": "mountain",
    "3152-2032": "mountain",
    "3152-2016": "mountain",
    "3168-2016": "mountain",
    "3168-2032": "mountain",
    "3168-2048": "mountain",
    "3184-2032": "mountain",
    "3200-2032": "mountain",
    "3216-2032": "mountain",
    "3216-2048": "mountain",
    "3200-2048": "mountain",
    "3184-2048": "mountain",
    "3184-2064": "mountain",
    "3200-2064": "mountain",
    "3216-2064": "mountain",
    "3216-2080": "mountain",
    "3232-2064": "mountain",
    "3232-2080": "mountain",
    "3248-2064": "mountain",
    "3248-2080": "mountain",
    "3264-2064": "mountain",
    "3264-2080": "mountain",
    "3280-2064": "mountain",
    "3280-2080": "mountain",
    "3280-2096": "mountain",
    "3296-2080": "mountain",
    "3296-2096": "mountain",
    "3296-2112": "mountain",
    "3312-2096": "mountain",
    "3312-2112": "mountain",
    "3328-2112": "mountain",
    "3344-2112": "mountain",
    "3360-2112": "mountain",
    "3360-2128": "mountain",
    "3344-2128": "mountain",
    "3328-2128": "mountain",
    "3344-2144": "mountain",
    "3360-2144": "mountain",
    "3152-2224": "mountain",
    "3152-2240": "mountain",
    "3168-2240": "mountain",
    "3184-2240": "mountain",
    "3184-2224": "mountain",
    "3216-2256": "mountain",
    "3232-2256": "mountain",
    "3232-2240": "mountain",
    "3248-2240": "mountain",
    "3248-2256": "mountain",
    "3264-2256": "mountain",
    "3264-2272": "mountain",
    "3280-2272": "mountain",
    "3280-2288": "mountain",
    "3280-2304": "mountain",
    "3296-2304": "mountain",
    "3296-2288": "mountain",
    "3312-2304": "mountain",
    "3152-2272": "mountain",
    "3168-2272": "mountain",
    "3184-2272": "mountain",
    "3152-2288": "mountain",
    "3152-2304": "mountain",
    "3168-2288": "mountain",
    "3168-2304": "mountain",
    "3184-2288": "mountain",
    "3184-2304": "mountain",
    "3184-2320": "mountain",
    "3184-2336": "mountain",
    "3200-2288": "mountain",
    "3216-2288": "mountain",
    "3232-2288": "mountain",
    "3232-2304": "mountain",
    "3216-2304": "mountain",
    "3200-2304": "mountain",
    "3200-2320": "mountain",
    "3200-2336": "mountain",
    "3216-2320": "mountain",
    "3248-2304": "mountain",
    "3248-2320": "mountain",
    "3248-2336": "mountain",
    "3264-2336": "mountain",
    "3280-2336": "mountain",
    "3296-2336": "mountain",
    "3312-2336": "mountain",
    "3328-2336": "mountain",
    "3344-2336": "mountain",
    "3152-2512": "mountain",
    "3152-2528": "mountain",
    "3152-2544": "mountain",
    "3168-2544": "mountain",
    "3152-2560": "mountain",
    "3168-2560": "mountain",
    "3152-2576": "mountain",
    "3168-2576": "mountain",
    "3184-2576": "mountain",
    "3184-2592": "mountain",
    "3184-2608": "mountain",
    "3184-2624": "mountain",
    "3184-2640": "mountain",
    "3184-2656": "mountain",
    "3184-2672": "mountain",
    "3184-2688": "mountain",
    "3184-2704": "mountain",
    "3168-2592": "mountain",
    "3152-2592": "mountain",
    "3152-2608": "mountain",
    "3168-2608": "mountain",
    "3168-2624": "mountain",
    "3152-2624": "mountain",
    "3152-2640": "mountain",
    "3168-2640": "mountain",
    "3168-2656": "mountain",
    "3152-2656": "mountain",
    "3152-2672": "mountain",
    "3168-2672": "mountain",
    "3168-2688": "mountain",
    "3152-2688": "mountain",
    "3152-2704": "mountain",
    "3152-2720": "mountain",
    "3152-2736": "mountain",
    "3152-2752": "mountain",
    "3152-2768": "mountain",
    "3152-2784": "mountain",
    "3168-2704": "mountain",
    "3168-2720": "mountain",
    "3168-2736": "mountain",
    "3168-2752": "mountain",
    "3168-2768": "mountain",
    "3168-2784": "mountain",
    "3168-2800": "mountain",
    "3216-2576": "mountain",
    "3216-2560": "mountain",
    "3216-2544": "mountain",
    "3216-2528": "mountain",
    "3232-2512": "mountain",
    "3232-2528": "mountain",
    "3232-2544": "mountain",
    "3232-2560": "mountain",
    "3248-2512": "mountain",
    "3248-2528": "mountain",
    "3248-2544": "mountain",
    "3264-2512": "mountain",
    "3280-2512": "mountain",
    "3280-2528": "mountain",
    "3264-2528": "mountain",
    "3264-2544": "mountain",
    "3264-2560": "mountain",
    "3280-2560": "mountain",
    "3280-2544": "mountain",
    "3296-2544": "mountain",
    "3296-2528": "mountain",
    "3312-2544": "mountain",
    "3376-2096": "mountain",
    "3392-2096": "mountain",
    "3408-2080": "mountain",
    "3424-2080": "mountain",
    "3440-2080": "mountain",
    "3456-2064": "mountain",
    "3472-2064": "mountain",
    "3488-2048": "mountain",
    "3488-2032": "mountain",
    "3504-2032": "mountain",
    "3520-2032": "mountain",
    "3536-2032": "mountain",
    "3568-2048": "mountain",
    "3552-2048": "mountain",
    "3536-2048": "mountain",
    "3520-2048": "mountain",
    "3504-2048": "mountain",
    "3488-2064": "mountain",
    "3504-2064": "mountain",
    "3520-2064": "mountain",
    "3536-2064": "mountain",
    "3552-2064": "mountain",
    "3568-2064": "mountain",
    "3504-2080": "mountain",
    "3488-2080": "mountain",
    "3472-2080": "mountain",
    "3456-2080": "mountain",
    "3472-2096": "mountain",
    "3456-2096": "mountain",
    "3456-2112": "mountain",
    "3440-2128": "mountain",
    "3440-2112": "mountain",
    "3424-2096": "mountain",
    "3408-2096": "mountain",
    "3440-2096": "mountain",
    "3424-2112": "mountain",
    "3408-2112": "mountain",
    "3392-2112": "mountain",
    "3376-2112": "mountain",
    "3424-2128": "mountain",
    "3424-2144": "mountain",
    "3408-2128": "mountain",
    "3392-2128": "mountain",
    "3376-2128": "mountain",
    "3376-2144": "mountain",
    "3376-2160": "mountain",
    "3392-2144": "mountain",
    "3392-2160": "mountain",
    "3408-2144": "mountain",
    "3408-2160": "mountain",
    "3424-2160": "mountain",
    "3408-2176": "mountain",
    "3392-2176": "mountain",
    "3376-2176": "mountain",
    "3376-2192": "mountain",
    "3376-2208": "mountain",
    "3376-2224": "mountain",
    "3376-2240": "mountain",
    "3376-2256": "mountain",
    "3392-2240": "mountain",
    "3392-2224": "mountain",
    "3392-2208": "mountain",
    "3392-2192": "mountain",
    "3408-2192": "mountain",
    "3408-2208": "mountain",
    "3408-2224": "mountain",
    "3408-2240": "mountain",
    "3424-2224": "mountain",
    "3424-2240": "mountain",
    "3424-2256": "mountain",
    "3440-2256": "mountain",
    "3440-2272": "mountain",
    "3360-2256": "mountain",
    "3360-2272": "mountain",
    "3360-2288": "mountain",
    "3360-2304": "mountain",
    "3360-2336": "mountain",
    "3360-2352": "mountain",
    "3376-2352": "mountain",
    "3376-2368": "mountain",
    "3376-2384": "mountain",
    "3392-2368": "mountain",
    "3392-2384": "mountain",
    "3392-2400": "mountain",
    "3408-2368": "mountain",
    "3408-2384": "mountain",
    "3408-2400": "mountain",
    "3424-2352": "mountain",
    "3424-2368": "mountain",
    "3424-2384": "mountain",
    "3440-2336": "mountain",
    "3440-2352": "mountain",
    "3440-2368": "mountain",
    "3568-2080": "mountain",
    "3568-2096": "mountain",
    "3568-2112": "mountain",
    "3552-2080": "mountain",
    "3552-2096": "mountain",
    "3552-2112": "mountain",
    "3552-2128": "mountain",
    "3552-2144": "mountain",
    "3536-2128": "mountain",
    "3536-2144": "mountain",
    "3520-2144": "mountain",
    "3520-2160": "mountain",
    "3520-2176": "mountain",
    "3520-2192": "mountain",
    "3520-2208": "mountain",
    "3520-2224": "mountain",
    "3520-2240": "mountain",
    "3520-2256": "mountain",
    "3536-2160": "mountain",
    "3536-2176": "mountain",
    "3536-2192": "mountain",
    "3536-2208": "mountain",
    "3536-2224": "mountain",
    "3536-2240": "mountain",
    "3536-2256": "mountain",
    "3536-2272": "mountain",
    "3536-2288": "mountain",
    "3536-2304": "mountain",
    "3552-2240": "mountain",
    "3552-2256": "mountain",
    "3552-2272": "mountain",
    "3552-2288": "mountain",
    "3552-2304": "mountain",
    "3552-2320": "mountain",
    "3552-2336": "mountain",
    "3552-2352": "mountain",
    "3552-2368": "mountain",
    "3552-2384": "mountain",
    "3552-2400": "mountain",
    "3568-2288": "mountain",
    "3568-2304": "mountain",
    "3568-2320": "mountain",
    "3568-2336": "mountain",
    "3568-2352": "mountain",
    "3568-2368": "mountain",
    "3568-2384": "mountain",
    "3568-2400": "mountain",
    "3584-2336": "mountain",
    "3584-2352": "mountain",
    "3584-2368": "mountain",
    "3584-2384": "mountain",
    "3584-2400": "mountain",
    "3536-2384": "mountain",
    "3536-2400": "mountain",
    "3536-2416": "mountain",
    "3536-2432": "mountain",
    "3520-2384": "mountain",
    "3520-2400": "mountain",
    "3520-2416": "mountain",
    "3520-2432": "mountain",
    "3520-2448": "mountain",
    "3520-2464": "mountain",
    "3520-2480": "mountain",
    "3520-2496": "mountain",
    "3520-2512": "mountain",
    "3520-2528": "mountain",
    "3504-2416": "mountain",
    "3504-2432": "mountain",
    "3504-2448": "mountain",
    "3504-2464": "mountain",
    "3504-2480": "mountain",
    "3504-2496": "mountain",
    "3504-2512": "mountain",
    "3504-2528": "mountain",
    "3504-2544": "mountain",
    "3504-2560": "mountain",
    "3488-2512": "mountain",
    "3488-2528": "mountain",
    "3488-2544": "mountain",
    "3488-2576": "mountain",
    "3488-2560": "mountain",
    "3488-2592": "mountain",
    "3488-2608": "mountain",
    "3472-2544": "mountain",
    "3472-2560": "mountain",
    "3472-2576": "mountain",
    "3472-2592": "mountain",
    "3472-2608": "mountain",
    "3472-2624": "mountain",
    "3472-2640": "mountain",
    "3472-2656": "mountain",
    "3456-2592": "mountain",
    "3456-2608": "mountain",
    "3456-2624": "mountain",
    "3456-2640": "mountain",
    "3456-2656": "mountain",
    "3456-2672": "mountain",
    "3456-2688": "mountain",
    "3456-2704": "mountain",
    "3440-2640": "mountain",
    "3440-2656": "mountain",
    "3440-2672": "mountain",
    "3440-2688": "mountain",
    "3440-2704": "mountain",
    "3440-2720": "mountain",
    "3424-2688": "mountain",
    "3424-2704": "mountain",
    "3424-2720": "mountain",
    "3424-2736": "mountain",
    "3424-2752": "mountain",
    "3424-2768": "mountain",
    "3424-2784": "mountain",
    "3424-2800": "mountain",
    "3408-2720": "mountain",
    "3408-2736": "mountain",
    "3408-2752": "mountain",
    "3408-2768": "mountain",
    "3408-2784": "mountain",
    "3408-2800": "mountain",
    "3408-2816": "mountain",
    "3392-2768": "mountain",
    "3392-2784": "mountain",
    "3392-2800": "mountain",
    "3392-2816": "mountain",
    "3392-2832": "mountain",
    "3376-2800": "mountain",
    "3376-2816": "mountain",
    "3376-2832": "mountain",
    "3376-2848": "mountain",
    "3360-2832": "mountain",
    "3360-2848": "mountain",
    "3360-2864": "mountain",
    "3360-2880": "mountain",
    "3344-2848": "mountain",
    "3328-2848": "mountain",
    "3328-2864": "mountain",
    "3344-2864": "mountain",
    "3344-2880": "mountain",
    "3328-2880": "mountain",
    "3344-2896": "mountain",
    "3328-2896": "mountain",
    "3312-2880": "mountain",
    "3312-2896": "mountain",
    "3312-2912": "mountain",
    "3296-2880": "mountain",
    "3296-2896": "mountain",
    "3296-2912": "mountain",
    "3280-2896": "mountain",
    "3280-2912": "mountain",
    "3280-2928": "mountain",
    "3264-2896": "mountain",
    "3264-2912": "mountain",
    "3264-2928": "mountain",
    "3248-2912": "mountain",
    "3248-2928": "mountain",
    "3248-2944": "mountain",
    "3232-2912": "mountain",
    "3232-2928": "mountain",
    "3232-2944": "mountain",
    "3216-2928": "mountain",
    "3216-2944": "mountain",
    "3216-2960": "mountain",
    "3200-2928": "mountain",
    "3200-2944": "mountain",
    "3200-2960": "mountain",
    "3184-2944": "mountain",
    "3184-2960": "mountain",
    "3184-2976": "mountain",
    "3168-2944": "mountain",
    "3168-2960": "mountain",
    "3168-2976": "mountain",
    "3040-3744": "mountain",
    "3040-3760": "mountain",
    "3024-3728": "mountain",
    "3024-3744": "mountain",
    "3024-3760": "mountain",
    "3008-3728": "mountain",
    "3008-3744": "mountain",
    "3008-3760": "mountain",
    "3008-3776": "mountain",
    "2992-3744": "mountain",
    "2992-3760": "mountain",
    "2992-3776": "mountain",
    "2976-3744": "mountain",
    "2976-3760": "mountain",
    "2976-3776": "mountain",
    "2976-3792": "mountain",
    "2960-3744": "mountain",
    "2960-3760": "mountain",
    "2960-3776": "mountain",
    "2960-3792": "mountain",
    "2944-3744": "mountain",
    "2944-3760": "mountain",
    "2944-3776": "mountain",
    "2944-3792": "mountain",
    "2928-3728": "mountain",
    "2928-3744": "mountain",
    "2928-3760": "mountain",
    "2928-3776": "mountain",
    "2928-3792": "mountain",
    "2912-3728": "mountain",
    "2912-3744": "mountain",
    "2912-3760": "mountain",
    "2912-3776": "mountain",
    "2896-3712": "mountain",
    "2896-3728": "mountain",
    "2896-3744": "mountain",
    "2896-3760": "mountain",
    "2896-3776": "mountain",
    "2880-3712": "mountain",
    "2880-3728": "mountain",
    "2880-3744": "mountain",
    "2880-3760": "mountain",
    "2880-3776": "mountain",
    "2864-3712": "mountain",
    "2864-3728": "mountain",
    "2864-3744": "mountain",
    "2864-3760": "mountain",
    "2864-3776": "mountain",
    "2848-3728": "mountain",
    "2848-3744": "mountain",
    "2848-3760": "mountain",
    "2848-3776": "mountain",
    "2848-3792": "mountain",
    "2832-3792": "mountain",
    "2832-3776": "mountain",
    "2832-3760": "mountain",
    "2832-3744": "mountain",
    "2832-3728": "mountain",
    "2816-3712": "mountain",
    "2816-3728": "mountain",
    "2816-3744": "mountain",
    "2816-3760": "mountain",
    "2816-3776": "mountain",
    "2800-3776": "mountain",
    "2784-3776": "mountain",
    "2768-3776": "mountain",
    "2752-3776": "mountain",
    "2736-3776": "mountain",
    "2720-3776": "mountain",
    "2720-3760": "mountain",
    "2720-3744": "mountain",
    "2720-3728": "mountain",
    "2720-3712": "mountain",
    "2720-3696": "mountain",
    "2736-3680": "mountain",
    "2736-3696": "mountain",
    "2736-3712": "mountain",
    "2736-3728": "mountain",
    "2736-3744": "mountain",
    "2736-3760": "mountain",
    "2752-3760": "mountain",
    "2768-3760": "mountain",
    "2784-3760": "mountain",
    "2800-3760": "mountain",
    "2800-3744": "mountain",
    "2800-3728": "mountain",
    "2800-3712": "mountain",
    "2784-3712": "mountain",
    "2784-3728": "mountain",
    "2784-3744": "mountain",
    "2768-3744": "mountain",
    "2752-3744": "mountain",
    "2752-3728": "mountain",
    "2768-3728": "mountain",
    "2768-3712": "mountain",
    "2752-3712": "mountain",
    "2752-3696": "mountain",
    "2768-3696": "mountain",
    "2704-3760": "mountain",
    "2704-3744": "mountain",
    "2704-3728": "mountain",
    "2704-3712": "mountain",
    "2704-3696": "mountain",
    "2704-3680": "mountain",
    "2688-3680": "mountain",
    "2688-3696": "mountain",
    "2688-3712": "mountain",
    "2688-3728": "mountain",
    "2688-3744": "mountain",
    "2688-3760": "mountain",
    "2672-3664": "mountain",
    "2672-3680": "mountain",
    "2672-3696": "mountain",
    "2672-3712": "mountain",
    "2672-3728": "mountain",
    "2672-3744": "mountain",
    "2656-3728": "mountain",
    "2656-3712": "mountain",
    "2656-3696": "mountain",
    "2656-3680": "mountain",
    "2656-3664": "mountain",
    "2640-3648": "mountain",
    "2640-3664": "mountain",
    "2640-3680": "mountain",
    "2640-3696": "mountain",
    "2640-3712": "mountain",
    "2640-3728": "mountain",
    "2624-3728": "mountain",
    "2608-3728": "mountain",
    "2608-3712": "mountain",
    "2624-3712": "mountain",
    "2624-3696": "mountain",
    "2608-3696": "mountain",
    "2608-3680": "mountain",
    "2624-3680": "mountain",
    "2624-3664": "mountain",
    "2608-3664": "mountain",
    "2608-3648": "mountain",
    "2608-3632": "mountain",
    "2624-3648": "mountain",
    "2592-3648": "mountain",
    "2592-3664": "mountain",
    "2592-3680": "mountain",
    "2592-3696": "mountain",
    "2592-3712": "mountain",
    "2576-3712": "mountain",
    "2576-3696": "mountain",
    "2576-3680": "mountain",
    "2576-3664": "mountain",
    "2576-3648": "mountain",
    "2576-3632": "mountain",
    "2560-3616": "mountain",
    "2560-3632": "mountain",
    "2560-3648": "mountain",
    "2560-3664": "mountain",
    "2560-3680": "mountain",
    "2560-3696": "mountain",
    "2544-3696": "mountain",
    "2544-3680": "mountain",
    "2544-3664": "mountain",
    "2544-3648": "mountain",
    "2544-3632": "mountain",
    "2528-3616": "mountain",
    "2528-3632": "mountain",
    "2528-3648": "mountain",
    "2528-3664": "mountain",
    "2528-3680": "mountain",
    "2528-3696": "mountain",
    "2528-3712": "mountain",
    "2512-3712": "mountain",
    "2512-3696": "mountain",
    "2512-3680": "mountain",
    "2512-3664": "mountain",
    "2512-3648": "mountain",
    "2512-3632": "mountain",
    "2512-3616": "mountain",
    "2496-3616": "mountain",
    "2480-3616": "mountain",
    "2464-3616": "mountain",
    "2448-3616": "mountain",
    "2448-3632": "mountain",
    "2464-3632": "mountain",
    "2480-3632": "mountain",
    "2496-3632": "mountain",
    "2496-3648": "mountain",
    "2480-3648": "mountain",
    "2464-3648": "mountain",
    "2448-3648": "mountain",
    "2432-3664": "mountain",
    "2448-3664": "mountain",
    "2464-3664": "mountain",
    "2480-3664": "mountain",
    "2496-3664": "mountain",
    "2496-3680": "mountain",
    "2496-3696": "mountain",
    "2496-3712": "mountain",
    "2480-3680": "mountain",
    "2480-3696": "mountain",
    "2480-3712": "mountain",
    "2480-3728": "mountain",
    "2464-3680": "mountain",
    "2464-3696": "mountain",
    "2464-3712": "mountain",
    "2464-3728": "mountain",
    "2464-3744": "mountain",
    "2464-3760": "mountain",
    "2448-3680": "mountain",
    "2432-3680": "mountain",
    "2432-3696": "mountain",
    "2448-3696": "mountain",
    "2448-3712": "mountain",
    "2432-3712": "mountain",
    "2416-3712": "mountain",
    "2416-3728": "mountain",
    "2400-3744": "mountain",
    "2416-3744": "mountain",
    "2432-3728": "mountain",
    "2432-3744": "mountain",
    "2448-3728": "mountain",
    "2448-3744": "mountain",
    "2448-3760": "mountain",
    "2432-3760": "mountain",
    "2416-3760": "mountain",
    "2400-3760": "mountain",
    "2384-3760": "mountain",
    "2368-3760": "mountain",
    "2368-3776": "mountain",
    "2352-3776": "mountain",
    "2384-3776": "mountain",
    "2416-3776": "mountain",
    "2400-3776": "mountain",
    "2416-3792": "mountain",
    "2416-3808": "mountain",
    "2400-3792": "mountain",
    "2400-3808": "mountain",
    "2384-3792": "mountain",
    "2384-3808": "mountain",
    "2368-3792": "mountain",
    "2368-3808": "mountain",
    "2368-3824": "mountain",
    "2352-3792": "mountain",
    "2352-3808": "mountain",
    "2352-3824": "mountain",
    "2336-3792": "mountain",
    "2336-3808": "mountain",
    "2336-3824": "mountain",
    "2336-3840": "mountain",
    "2320-3792": "mountain",
    "2320-3808": "mountain",
    "2320-3824": "mountain",
    "2320-3840": "mountain",
    "2304-3792": "mountain",
    "2304-3808": "mountain",
    "2304-3824": "mountain",
    "2304-3840": "mountain",
    "2288-3792": "mountain",
    "2288-3808": "mountain",
    "2288-3824": "mountain",
    "2288-3840": "mountain",
    "2288-3856": "mountain",
    "2272-3792": "mountain",
    "2272-3808": "mountain",
    "2272-3824": "mountain",
    "2272-3840": "mountain",
    "2272-3856": "mountain",
    "2256-3792": "mountain",
    "2256-3808": "mountain",
    "2256-3824": "mountain",
    "2256-3840": "mountain",
    "2256-3856": "mountain",
    "2240-3792": "mountain",
    "2240-3808": "mountain",
    "2240-3824": "mountain",
    "2240-3840": "mountain",
    "2240-3856": "mountain",
    "2224-3792": "mountain",
    "2224-3808": "mountain",
    "2224-3824": "mountain",
    "2224-3840": "mountain",
    "2224-3856": "mountain",
    "2208-3792": "mountain",
    "2208-3808": "mountain",
    "2208-3824": "mountain",
    "2208-3840": "mountain",
    "2192-3776": "mountain",
    "2192-3792": "mountain",
    "2192-3808": "mountain",
    "2192-3824": "mountain",
    "2192-3840": "mountain",
    "2176-3824": "mountain",
    "2176-3808": "mountain",
    "2176-3792": "mountain",
    "2176-3776": "mountain",
    "2176-3760": "mountain",
    "2160-3808": "mountain",
    "2160-3792": "mountain",
    "2160-3776": "mountain",
    "2160-3760": "mountain",
    "2160-3744": "mountain",
    "2160-3728": "mountain",
    "2144-3792": "mountain",
    "2144-3776": "mountain",
    "2144-3760": "mountain",
    "2144-3744": "mountain",
    "2144-3728": "mountain",
    "2144-3696": "mountain",
    "2144-3712": "mountain",
    "2128-3744": "mountain",
    "2128-3728": "mountain",
    "2128-3712": "mountain",
    "2128-3696": "mountain",
    "2112-3712": "mountain",
    "2112-3696": "mountain",
    "2096-3696": "mountain",
    "2096-3680": "mountain",
    "2096-3664": "mountain",
    "2096-3648": "mountain",
    "2096-3632": "mountain",
    "2112-3680": "mountain",
    "2112-3664": "mountain",
    "2112-3648": "mountain",
    "2112-3632": "mountain",
    "2112-3616": "mountain",
    "2112-3600": "mountain",
    "2112-3584": "mountain",
    "2112-3568": "mountain",
    "2128-3536": "mountain",
    "2128-3552": "mountain",
    "2128-3568": "mountain",
    "2128-3584": "mountain",
    "2128-3600": "mountain",
    "2128-3616": "mountain",
    "2128-3632": "mountain",
    "2128-3648": "mountain",
    "2128-3664": "mountain",
    "2128-3680": "mountain",
    "2144-3680": "mountain",
    "2144-3664": "mountain",
    "2144-3648": "mountain",
    "2144-3632": "mountain",
    "2144-3616": "mountain",
    "2144-3600": "mountain",
    "2144-3584": "mountain",
    "2144-3568": "mountain",
    "2144-3552": "mountain",
    "2144-3536": "mountain",
    "2144-3520": "mountain",
    "2160-3504": "mountain",
    "2160-3520": "mountain",
    "2160-3536": "mountain",
    "2160-3568": "mountain",
    "2160-3552": "mountain",
    "2160-3584": "mountain",
    "2176-3552": "mountain",
    "2176-3536": "mountain",
    "2176-3520": "mountain",
    "2176-3504": "mountain",
    "2176-3488": "mountain",
    "2192-3472": "mountain",
    "2192-3488": "mountain",
    "2192-3504": "mountain",
    "2192-3520": "mountain",
    "2208-3504": "mountain",
    "2208-3488": "mountain",
    "2208-3472": "mountain",
    "2224-3472": "mountain",
    "2224-3488": "mountain",
    "2224-3504": "mountain",
    "2240-3504": "mountain",
    "2256-3504": "mountain",
    "2272-3488": "mountain",
    "2256-3488": "mountain",
    "2240-3488": "mountain",
    "2240-3472": "mountain",
    "2240-3456": "mountain",
    "2256-3456": "mountain",
    "2256-3472": "mountain",
    "2272-3472": "mountain",
    "2272-3456": "mountain",
    "2272-3440": "mountain",
    "2288-3440": "mountain",
    "2304-3440": "mountain",
    "2304-3456": "mountain",
    "2288-3456": "mountain",
    "2288-3472": "mountain",
    "2304-3472": "mountain",
    "2320-3456": "mountain",
    "2320-3472": "mountain",
    "2336-3456": "mountain",
    "2336-3472": "mountain",
    "2352-3472": "mountain",
    "2368-3472": "mountain",
    "2384-3472": "mountain",
    "2400-3488": "mountain",
    "2384-3488": "mountain",
    "2368-3488": "mountain",
    "2352-3488": "mountain",
    "2368-3504": "mountain",
    "2384-3504": "mountain",
    "2400-3504": "mountain",
    "2384-3520": "mountain",
    "2400-3520": "mountain",
    "2416-3520": "mountain",
    "2400-3536": "mountain",
    "2416-3536": "mountain",
    "2416-3552": "mountain",
    "2432-3552": "mountain",
    "2416-3568": "mountain",
    "2432-3568": "mountain",
    "2432-3584": "mountain",
    "2448-3568": "mountain",
    "2464-3568": "mountain",
    "2464-3584": "mountain",
    "2480-3584": "mountain",
    "2448-3584": "mountain",
    "2448-3600": "mountain",
    "2464-3600": "mountain",
    "2192-2896": "mountain",
    "2192-2880": "mountain",
    "2192-2864": "mountain",
    "2192-2848": "mountain",
    "2176-2816": "mountain",
    "2176-2832": "mountain",
    "2176-2848": "mountain",
    "2176-2864": "mountain",
    "2176-2880": "mountain",
    "2176-2896": "mountain",
    "2176-2912": "mountain",
    "2176-2928": "mountain",
    "2176-2944": "mountain",
    "2160-2944": "mountain",
    "2160-2928": "mountain",
    "2160-2912": "mountain",
    "2160-2896": "mountain",
    "2160-2880": "mountain",
    "2160-2864": "mountain",
    "2160-2848": "mountain",
    "2160-2832": "mountain",
    "2160-2816": "mountain",
    "2144-2800": "mountain",
    "2144-2816": "mountain",
    "2144-2832": "mountain",
    "2144-2848": "mountain",
    "2144-2864": "mountain",
    "2144-2880": "mountain",
    "2144-2896": "mountain",
    "2144-2912": "mountain",
    "2144-2928": "mountain",
    "2128-2896": "mountain",
    "2128-2880": "mountain",
    "2128-2864": "mountain",
    "2128-2848": "mountain",
    "2128-2832": "mountain",
    "2128-2816": "mountain",
    "2128-2800": "mountain",
    "2112-2800": "mountain",
    "2112-2816": "mountain",
    "2112-2832": "mountain",
    "2112-2848": "mountain",
    "2112-2864": "mountain",
    "2096-2784": "mountain",
    "2096-2800": "mountain",
    "2096-2816": "mountain",
    "2096-2832": "mountain",
    "2096-2848": "mountain",
    "2096-2864": "mountain",
    "2080-2864": "mountain",
    "2080-2848": "mountain",
    "2080-2832": "mountain",
    "2080-2816": "mountain",
    "2080-2800": "mountain",
    "2080-2784": "mountain",
    "2064-2784": "mountain",
    "2048-2784": "mountain",
    "2048-2800": "mountain",
    "2064-2800": "mountain",
    "2064-2816": "mountain",
    "2048-2816": "mountain",
    "2048-2832": "mountain",
    "2064-2832": "mountain",
    "2064-2848": "mountain",
    "2032-2800": "mountain",
    "2032-2816": "mountain",
    "2032-2832": "mountain",
    "2032-2848": "mountain",
    "2016-2816": "mountain",
    "2000-2816": "mountain",
    "2000-2832": "mountain",
    "2000-2848": "mountain",
    "2016-2832": "mountain",
    "2016-2848": "mountain",
    "1984-2832": "mountain",
    "1984-2848": "mountain",
    "1984-2864": "mountain",
    "1968-2832": "mountain",
    "1968-2848": "mountain",
    "1968-2864": "mountain",
    "1968-2880": "mountain",
    "1952-2880": "mountain",
    "1952-2864": "mountain",
    "1952-2848": "mountain",
    "1952-2832": "mountain",
    "1936-2832": "mountain",
    "1936-2848": "mountain",
    "1936-2864": "mountain",
    "1936-2880": "mountain",
    "1920-2880": "mountain",
    "1904-2880": "mountain",
    "1904-2864": "mountain",
    "1920-2864": "mountain",
    "1920-2848": "mountain",
    "1920-2832": "mountain",
    "1920-2816": "mountain",
    "1904-2816": "mountain",
    "1904-2832": "mountain",
    "1904-2848": "mountain",
    "1888-2816": "mountain",
    "1872-2816": "mountain",
    "1888-2832": "mountain",
    "1872-2832": "mountain",
    "1856-2832": "mountain",
    "1840-2832": "mountain",
    "1840-2848": "mountain",
    "1856-2848": "mountain",
    "1872-2848": "mountain",
    "1888-2848": "mountain",
    "1888-2864": "mountain",
    "1872-2864": "mountain",
    "1872-2880": "mountain",
    "1856-2864": "mountain",
    "1840-2864": "mountain",
    "1824-2864": "mountain",
    "1824-2880": "mountain",
    "1824-2896": "mountain",
    "1840-2880": "mountain",
    "1840-2896": "mountain",
    "1856-2880": "mountain",
    "1856-2896": "mountain",
    "1808-2880": "mountain",
    "1792-2880": "mountain",
    "1808-2896": "mountain",
    "1808-2912": "mountain",
    "1792-2896": "mountain",
    "1792-2912": "mountain",
    "1792-2928": "mountain",
    "1792-2944": "mountain",
    "1776-2896": "mountain",
    "1760-2896": "mountain",
    "1760-2912": "mountain",
    "1776-2912": "mountain",
    "1776-2928": "mountain",
    "1776-2944": "mountain",
    "1776-2960": "mountain",
    "1776-2976": "mountain",
    "1760-2928": "mountain",
    "1760-2944": "mountain",
    "1760-2960": "mountain",
    "1760-2976": "mountain",
    "1760-2992": "mountain",
    "1760-3008": "mountain",
    "1760-3024": "mountain",
    "1760-3040": "mountain",
    "1760-3056": "mountain",
    "1760-3072": "mountain",
    "1760-3088": "mountain",
    "1760-3104": "mountain",
    "1760-3120": "mountain",
    "1760-3136": "mountain",
    "1760-3152": "mountain",
    "1760-3168": "mountain",
    "1776-3120": "mountain",
    "1776-3136": "mountain",
    "1776-3152": "mountain",
    "1776-3168": "mountain",
    "1776-3184": "mountain",
    "1792-3152": "mountain",
    "1792-3168": "mountain",
    "1792-3184": "mountain",
    "448-3648": "mountain",
    "448-3664": "mountain",
    "432-3664": "mountain",
    "432-3680": "mountain",
    "416-3680": "mountain",
    "400-3680": "mountain",
    "400-3696": "mountain",
    "400-3712": "mountain",
    "416-3712": "mountain",
    "432-3712": "mountain",
    "416-3728": "mountain",
    "416-3744": "mountain",
    "736-2400": "mountain",
    "736-2416": "mountain",
    "736-2432": "mountain",
    "736-2448": "mountain",
    "736-2464": "mountain",
    "736-2480": "mountain",
    "736-2496": "mountain",
    "736-2512": "mountain",
    "736-2528": "mountain",
    "736-2544": "mountain",
    "752-2544": "mountain",
    "768-2544": "mountain",
    "784-2544": "mountain",
    "800-2528": "mountain",
    "816-2544": "mountain",
    "832-2560": "mountain",
    "848-2576": "mountain",
    "848-2592": "mountain",
    "832-2608": "mountain",
    "832-2624": "mountain",
    "816-2640": "mountain",
    "816-2656": "mountain",
    "816-2672": "mountain",
    "816-2688": "mountain",
    "800-2704": "mountain",
    "784-2720": "mountain",
    "784-2736": "mountain",
    "768-2752": "mountain",
    "752-2768": "mountain",
    "752-2784": "mountain",
    "736-2784": "mountain",
    "720-2784": "mountain",
    "704-2784": "mountain",
    "688-2784": "mountain",
    "672-2784": "mountain",
    "656-2768": "mountain",
    "640-2768": "mountain",
    "624-2752": "mountain",
    "608-2736": "mountain",
    "592-2720": "mountain",
    "592-2704": "mountain",
    "576-2704": "mountain",
    "576-2688": "mountain",
    "576-2672": "mountain",
    "576-2656": "mountain",
    "576-2640": "mountain",
    "576-2624": "mountain",
    "592-2608": "mountain",
    "592-2592": "mountain",
    "592-2576": "mountain",
    "592-2560": "mountain",
    "592-2544": "mountain",
    "576-2544": "mountain",
    "560-2544": "mountain",
    "544-2560": "mountain",
    "528-2576": "mountain",
    "528-2592": "mountain",
    "512-2608": "mountain",
    "496-2624": "mountain",
    "496-2640": "mountain",
    "496-2656": "mountain",
    "480-2672": "mountain",
    "480-2688": "mountain",
    "560-2560": "mountain",
    "576-2560": "mountain",
    "576-2576": "mountain",
    "560-2576": "mountain",
    "544-2576": "mountain",
    "544-2592": "mountain",
    "560-2592": "mountain",
    "576-2592": "mountain",
    "576-2608": "mountain",
    "560-2608": "mountain",
    "544-2608": "mountain",
    "528-2608": "mountain",
    "512-2624": "mountain",
    "528-2624": "mountain",
    "544-2624": "mountain",
    "560-2624": "mountain",
    "560-2640": "mountain",
    "544-2640": "mountain",
    "528-2640": "mountain",
    "512-2640": "mountain",
    "512-2656": "mountain",
    "528-2656": "mountain",
    "544-2656": "mountain",
    "560-2656": "mountain",
    "560-2672": "mountain",
    "544-2672": "mountain",
    "528-2672": "mountain",
    "512-2672": "mountain",
    "496-2672": "mountain",
    "496-2688": "mountain",
    "512-2688": "mountain",
    "528-2688": "mountain",
    "544-2688": "mountain",
    "560-2688": "mountain",
    "288-2608": "mountain",
    "288-2624": "mountain",
    "288-2640": "mountain",
    "304-2624": "mountain",
    "304-2640": "mountain",
    "320-2624": "mountain",
    "320-2640": "mountain",
    "336-2640": "mountain",
    "352-2656": "mountain",
    "336-2656": "mountain",
    "320-2656": "mountain",
    "304-2656": "mountain",
    "304-2672": "mountain",
    "320-2672": "mountain",
    "336-2672": "mountain",
    "352-2672": "mountain",
    "288-2688": "mountain",
    "304-2688": "mountain",
    "320-2688": "mountain",
    "336-2688": "mountain",
    "352-2688": "mountain",
    "368-2688": "mountain",
    "288-2704": "mountain",
    "304-2704": "mountain",
    "320-2704": "mountain",
    "336-2704": "mountain",
    "352-2704": "mountain",
    "368-2704": "mountain",
    "288-2720": "mountain",
    "288-2736": "mountain",
    "288-2752": "mountain",
    "288-2768": "mountain",
    "288-2784": "mountain",
    "288-2800": "mountain",
    "288-2816": "mountain",
    "272-2768": "mountain",
    "272-2784": "mountain",
    "272-2800": "mountain",
    "272-2816": "mountain",
    "272-2832": "mountain",
    "304-2720": "mountain",
    "304-2736": "mountain",
    "304-2752": "mountain",
    "304-2768": "mountain",
    "304-2784": "mountain",
    "304-2800": "mountain",
    "320-2784": "mountain",
    "320-2768": "mountain",
    "320-2752": "mountain",
    "320-2736": "mountain",
    "320-2720": "mountain",
    "336-2720": "mountain",
    "336-2736": "mountain",
    "336-2752": "mountain",
    "336-2768": "mountain",
    "352-2720": "mountain",
    "368-2720": "mountain",
    "384-2720": "mountain",
    "416-2720": "mountain",
    "432-2720": "mountain",
    "448-2720": "mountain",
    "432-2704": "mountain",
    "448-2704": "mountain",
    "448-2688": "mountain",
    "432-2736": "mountain",
    "416-2736": "mountain",
    "400-2736": "mountain",
    "384-2736": "mountain",
    "368-2736": "mountain",
    "352-2736": "mountain",
    "352-2752": "mountain",
    "352-2768": "mountain",
    "368-2752": "mountain",
    "368-2768": "mountain",
    "368-2784": "mountain",
    "384-2752": "mountain",
    "384-2768": "mountain",
    "384-2784": "mountain",
    "384-2800": "mountain",
    "400-2752": "mountain",
    "400-2768": "mountain",
    "400-2784": "mountain",
    "400-2800": "mountain",
    "400-2816": "mountain",
    "416-2752": "mountain",
    "416-2768": "mountain",
    "416-2784": "mountain",
    "416-2800": "mountain",
    "416-2816": "mountain",
    "416-2832": "mountain",
    "432-2752": "mountain",
    "432-2768": "mountain",
    "432-2784": "mountain",
    "432-2800": "mountain",
    "432-2816": "mountain",
    "432-2832": "mountain",
    "432-2848": "mountain",
    "464-2752": "mountain",
    "464-2768": "mountain",
    "464-2784": "mountain",
    "464-2800": "mountain",
    "464-2816": "mountain",
    "480-2704": "mountain",
    "480-2720": "mountain",
    "480-2736": "mountain",
    "480-2752": "mountain",
    "480-2768": "mountain",
    "480-2784": "mountain",
    "480-2800": "mountain",
    "480-2816": "mountain",
    "480-2832": "mountain",
    "496-2704": "mountain",
    "512-2704": "mountain",
    "528-2704": "mountain",
    "544-2704": "mountain",
    "560-2704": "mountain",
    "752-2432": "mountain",
    "768-2448": "mountain",
    "784-2448": "mountain",
    "800-2448": "mountain",
    "816-2448": "mountain",
    "832-2448": "mountain",
    "832-2432": "mountain",
    "848-2432": "mountain",
    "864-2432": "mountain",
    "864-2416": "mountain",
    "880-2416": "mountain",
    "880-2400": "mountain",
    "896-2400": "mountain",
    "896-2384": "mountain",
    "896-2368": "mountain",
    "896-2352": "mountain",
    "912-2368": "mountain",
    "928-2368": "mountain",
    "944-2384": "mountain",
    "944-2400": "mountain",
    "944-2416": "mountain",
    "944-2432": "mountain",
    "944-2448": "mountain",
    "944-2464": "mountain",
    "928-2480": "mountain",
    "928-2496": "mountain",
    "928-2512": "mountain",
    "928-2528": "mountain",
    "928-2544": "mountain",
    "912-2544": "mountain",
    "912-2560": "mountain",
    "912-2576": "mountain",
    "912-2592": "mountain",
    "912-2608": "mountain",
    "912-2624": "mountain",
    "912-2640": "mountain",
    "928-2640": "mountain",
    "944-2656": "mountain",
    "944-2672": "mountain",
    "928-2688": "mountain",
    "912-2688": "mountain",
    "896-2688": "mountain",
    "896-2704": "mountain",
    "896-2720": "mountain",
    "880-2720": "mountain",
    "880-2736": "mountain",
    "880-2752": "mountain",
    "880-2768": "mountain",
    "896-2768": "mountain",
    "896-2784": "mountain",
    "896-2800": "mountain",
    "912-2800": "mountain",
    "752-2448": "mountain",
    "752-2464": "mountain",
    "752-2480": "mountain",
    "752-2496": "mountain",
    "752-2512": "mountain",
    "752-2528": "mountain",
    "768-2464": "mountain",
    "768-2496": "mountain",
    "768-2480": "mountain",
    "768-2512": "mountain",
    "768-2528": "mountain",
    "784-2528": "mountain",
    "784-2512": "mountain",
    "784-2496": "mountain",
    "784-2480": "mountain",
    "784-2464": "mountain",
    "800-2464": "mountain",
    "800-2480": "mountain",
    "800-2496": "mountain",
    "800-2512": "mountain",
    "816-2464": "mountain",
    "816-2480": "mountain",
    "816-2496": "mountain",
    "816-2512": "mountain",
    "816-2528": "mountain",
    "832-2464": "mountain",
    "832-2480": "mountain",
    "832-2496": "mountain",
    "832-2512": "mountain",
    "832-2528": "mountain",
    "832-2544": "mountain",
    "848-2560": "mountain",
    "848-2544": "mountain",
    "848-2528": "mountain",
    "848-2512": "mountain",
    "848-2496": "mountain",
    "848-2480": "mountain",
    "848-2464": "mountain",
    "848-2448": "mountain",
    "912-2384": "mountain",
    "928-2384": "mountain",
    "928-2400": "mountain",
    "912-2400": "mountain",
    "912-2416": "mountain",
    "896-2416": "mountain",
    "928-2416": "mountain",
    "928-2432": "mountain",
    "928-2448": "mountain",
    "928-2464": "mountain",
    "912-2464": "mountain",
    "912-2448": "mountain",
    "912-2432": "mountain",
    "896-2432": "mountain",
    "880-2432": "mountain",
    "896-2448": "mountain",
    "880-2448": "mountain",
    "864-2448": "mountain",
    "864-2464": "mountain",
    "880-2464": "mountain",
    "896-2464": "mountain",
    "864-2480": "mountain",
    "880-2480": "mountain",
    "896-2480": "mountain",
    "912-2480": "mountain",
    "912-2496": "mountain",
    "896-2496": "mountain",
    "880-2496": "mountain",
    "864-2496": "mountain",
    "864-2512": "mountain",
    "880-2512": "mountain",
    "896-2512": "mountain",
    "912-2512": "mountain",
    "912-2528": "mountain",
    "896-2528": "mountain",
    "880-2528": "mountain",
    "864-2528": "mountain",
    "864-2544": "mountain",
    "864-2560": "mountain",
    "864-2576": "mountain",
    "864-2592": "mountain",
    "880-2592": "mountain",
    "880-2576": "mountain",
    "880-2560": "mountain",
    "880-2544": "mountain",
    "896-2544": "mountain",
    "896-2560": "mountain",
    "896-2576": "mountain",
    "896-2592": "mountain",
    "848-2608": "mountain",
    "848-2624": "mountain",
    "848-2640": "mountain",
    "832-2640": "mountain",
    "864-2640": "mountain",
    "864-2624": "mountain",
    "864-2608": "mountain",
    "880-2608": "mountain",
    "880-2624": "mountain",
    "880-2640": "mountain",
    "896-2640": "mountain",
    "896-2624": "mountain",
    "896-2608": "mountain",
    "928-2656": "mountain",
    "928-2672": "mountain",
    "912-2672": "mountain",
    "912-2656": "mountain",
    "896-2656": "mountain",
    "896-2672": "mountain",
    "864-2672": "mountain",
    "864-2656": "mountain",
    "880-2656": "mountain",
    "880-2672": "mountain",
    "848-2656": "mountain",
    "832-2656": "mountain",
    "832-2672": "mountain",
    "848-2672": "mountain",
    "832-2688": "mountain",
    "848-2688": "mountain",
    "864-2688": "mountain",
    "880-2688": "mountain",
    "880-2704": "mountain",
    "864-2704": "mountain",
    "848-2704": "mountain",
    "832-2704": "mountain",
    "816-2704": "mountain",
    "800-2720": "mountain",
    "816-2720": "mountain",
    "832-2720": "mountain",
    "848-2720": "mountain",
    "864-2720": "mountain",
    "864-2736": "mountain",
    "864-2752": "mountain",
    "848-2752": "mountain",
    "848-2736": "mountain",
    "832-2736": "mountain",
    "832-2752": "mountain",
    "816-2752": "mountain",
    "816-2736": "mountain",
    "800-2736": "mountain",
    "800-2752": "mountain",
    "784-2752": "mountain",
    "768-2768": "mountain",
    "768-2784": "mountain",
    "784-2768": "mountain",
    "784-2784": "mountain",
    "800-2768": "mountain",
    "800-2784": "mountain",
    "816-2768": "mountain",
    "816-2784": "mountain",
    "832-2768": "mountain",
    "832-2784": "mountain",
    "848-2768": "mountain",
    "848-2784": "mountain",
    "864-2768": "mountain",
    "864-2784": "mountain",
    "880-2784": "mountain",
    "496-2720": "mountain",
    "512-2720": "mountain",
    "528-2720": "mountain",
    "544-2720": "mountain",
    "560-2720": "mountain",
    "576-2720": "mountain",
    "512-2736": "mountain",
    "496-2736": "mountain",
    "496-2752": "mountain",
    "512-2752": "mountain",
    "528-2752": "mountain",
    "528-2736": "mountain",
    "544-2736": "mountain",
    "544-2752": "mountain",
    "560-2752": "mountain",
    "560-2736": "mountain",
    "576-2736": "mountain",
    "576-2752": "mountain",
    "592-2752": "mountain",
    "592-2736": "mountain",
    "608-2752": "mountain",
    "496-2768": "mountain",
    "512-2768": "mountain",
    "528-2768": "mountain",
    "544-2768": "mountain",
    "560-2768": "mountain",
    "576-2768": "mountain",
    "592-2768": "mountain",
    "608-2768": "mountain",
    "624-2768": "mountain",
    "496-2784": "mountain",
    "512-2784": "mountain",
    "528-2784": "mountain",
    "544-2784": "mountain",
    "560-2784": "mountain",
    "576-2784": "mountain",
    "592-2784": "mountain",
    "608-2784": "mountain",
    "624-2784": "mountain",
    "640-2784": "mountain",
    "656-2784": "mountain",
    "496-2800": "mountain",
    "512-2800": "mountain",
    "528-2800": "mountain",
    "544-2800": "mountain",
    "560-2800": "mountain",
    "576-2800": "mountain",
    "592-2800": "mountain",
    "608-2800": "mountain",
    "624-2800": "mountain",
    "640-2800": "mountain",
    "656-2800": "mountain",
    "672-2800": "mountain",
    "688-2800": "mountain",
    "704-2800": "mountain",
    "720-2800": "mountain",
    "736-2800": "mountain",
    "752-2800": "mountain",
    "768-2800": "mountain",
    "784-2800": "mountain",
    "800-2800": "mountain",
    "816-2800": "mountain",
    "832-2800": "mountain",
    "848-2800": "mountain",
    "864-2800": "mountain",
    "880-2800": "mountain",
    "496-2816": "mountain",
    "512-2816": "mountain",
    "544-2816": "mountain",
    "528-2816": "mountain",
    "560-2816": "mountain",
    "576-2816": "mountain",
    "592-2816": "mountain",
    "608-2816": "mountain",
    "624-2816": "mountain",
    "640-2816": "mountain",
    "656-2816": "mountain",
    "688-2816": "mountain",
    "672-2816": "mountain",
    "704-2816": "mountain",
    "720-2816": "mountain",
    "736-2816": "mountain",
    "752-2816": "mountain",
    "768-2816": "mountain",
    "784-2816": "mountain",
    "800-2816": "mountain",
    "816-2816": "mountain",
    "832-2816": "mountain",
    "848-2816": "mountain",
    "864-2816": "mountain",
    "880-2816": "mountain",
    "896-2816": "mountain",
    "912-2816": "mountain",
    "1264-2544": "mountain",
    "1264-2560": "mountain",
    "1248-2544": "mountain",
    "1248-2560": "mountain",
    "1232-2544": "mountain",
    "1232-2560": "mountain",
    "1232-2576": "mountain",
    "1232-2592": "mountain",
    "1216-2576": "mountain",
    "1216-2592": "mountain",
    "1200-2592": "mountain",
    "1200-2608": "mountain",
    "1184-2608": "mountain",
    "1168-2624": "mountain",
    "1168-2640": "mountain",
    "1168-2656": "mountain",
    "1168-2672": "mountain",
    "1168-2688": "mountain",
    "1152-2688": "mountain",
    "1136-2688": "mountain",
    "1136-2704": "mountain",
    "1152-2704": "mountain",
    "1152-2720": "mountain",
    "1136-2720": "mountain",
    "1120-2720": "mountain",
    "1120-2736": "mountain",
    "1136-2736": "mountain",
    "1136-2752": "mountain",
    "1120-2752": "mountain",
    "1120-2768": "mountain",
    "1136-2768": "mountain",
    "1152-2768": "mountain",
    "1136-2784": "mountain",
    "1152-2784": "mountain",
    "1168-2784": "mountain",
    "1184-2784": "mountain",
    "1136-2800": "mountain",
    "1152-2800": "mountain",
    "1152-2816": "mountain",
    "1168-2800": "mountain",
    "1168-2816": "mountain",
    "1184-2800": "mountain",
    "1184-2816": "mountain",
    "1200-2800": "mountain",
    "1200-2816": "mountain",
    "1216-2800": "mountain",
    "1216-2816": "mountain",
    "1232-2800": "mountain",
    "1232-2816": "mountain",
    "1248-2816": "mountain",
    "1248-2832": "mountain",
    "1536-2624": "mountain",
    "1552-2624": "mountain",
    "1568-2624": "mountain",
    "1536-2640": "mountain",
    "1536-2656": "mountain",
    "1552-2640": "mountain",
    "1552-2656": "mountain",
    "1552-2672": "mountain",
    "1584-2640": "mountain",
    "1568-2640": "mountain",
    "1568-2656": "mountain",
    "1568-2672": "mountain",
    "1568-2688": "mountain",
    "1584-2656": "mountain",
    "1584-2672": "mountain",
    "1600-2640": "mountain",
    "1616-2640": "mountain",
    "1632-2656": "mountain",
    "1632-2672": "mountain",
    "1616-2656": "mountain",
    "1600-2656": "mountain",
    "1600-2672": "mountain",
    "1616-2672": "mountain",
    "1616-2688": "mountain",
    "1600-2688": "mountain",
    "1584-2688": "mountain",
    "1584-2704": "mountain",
    "1600-2704": "mountain",
    "1600-2720": "mountain",
    "1584-2720": "mountain",
    "1584-2736": "mountain",
    "1600-2736": "mountain",
    "1600-2752": "mountain",
    "1584-2752": "mountain",
    "1584-2768": "mountain",
    "1600-2768": "mountain",
    "1584-2784": "mountain",
    "1584-2800": "mountain",
    "1568-2800": "mountain",
    "1568-2816": "mountain",
    "1584-2816": "mountain",
    "1568-2832": "mountain",
    "1568-2848": "mountain",
    "1568-2864": "mountain",
    "1552-2864": "mountain",
    "1552-2848": "mountain",
    "1552-2832": "mountain",
    "1536-2848": "mountain",
    "1536-2864": "mountain",
    "1536-2880": "mountain",
    "1520-2848": "mountain",
    "1504-2864": "mountain",
    "1520-2864": "mountain",
    "1504-2880": "mountain",
    "1520-2880": "mountain",
    "1504-2896": "mountain",
    "1520-2896": "mountain",
    "1488-2912": "mountain",
    "1504-2912": "mountain",
    "1488-2928": "mountain",
    "1504-2928": "mountain",
    "1472-2944": "mountain",
    "1488-2944": "mountain",
    "1504-2944": "mountain",
    "1472-2960": "mountain",
    "1488-2960": "mountain",
    "1504-2960": "mountain",
    "1472-2976": "mountain",
    "1488-2976": "mountain",
    "1472-2992": "mountain",
    "1488-2992": "mountain",
    "1472-3008": "mountain",
    "1488-3008": "mountain",
    "1472-3024": "mountain",
    "1488-3024": "mountain",
    "1488-3040": "mountain",
    "1488-3056": "mountain",
    "1456-3216": "mountain",
    "1456-3200": "mountain",
    "1456-3184": "mountain",
    "1456-3232": "mountain",
    "1472-3216": "mountain",
    "1488-3216": "mountain",
    "1488-3200": "mountain",
    "1472-3200": "mountain",
    "1472-3184": "mountain",
    "1488-3184": "mountain",
    "1504-3184": "mountain",
    "1488-3168": "mountain",
    "1504-3168": "mountain",
    "1520-3168": "mountain",
    "1536-3168": "mountain",
    "1536-3152": "mountain",
    "1520-3152": "mountain",
    "1504-3152": "mountain",
    "1520-3136": "mountain",
    "1520-3120": "mountain",
    "1520-3104": "mountain",
    "1520-3088": "mountain",
    "1520-3072": "mountain",
    "1536-3056": "mountain",
    "1536-3072": "mountain",
    "1536-3088": "mountain",
    "1536-3104": "mountain",
    "1536-3120": "mountain",
    "1536-3136": "mountain",
    "1552-3120": "mountain",
    "1552-3104": "mountain",
    "1552-3088": "mountain",
    "1552-3072": "mountain",
    "1552-3056": "mountain",
    "1552-3040": "mountain",
    "1568-3040": "mountain",
    "1568-3056": "mountain",
    "1568-3072": "mountain",
    "1568-3088": "mountain",
    "1568-3104": "mountain",
    "1584-3056": "mountain",
    "1584-3072": "mountain",
    "1584-3088": "mountain",
    "1584-3104": "mountain",
    "1600-3056": "mountain",
    "1600-3072": "mountain",
    "1600-3088": "mountain",
    "1600-3104": "mountain",
    "1616-3056": "mountain",
    "1616-3072": "mountain",
    "1616-3088": "mountain",
    "1616-3104": "mountain",
    "1616-3120": "mountain",
    "1632-3040": "mountain",
    "1632-3056": "mountain",
    "1632-3072": "mountain",
    "1632-3088": "mountain",
    "1632-3104": "mountain",
    "1632-3120": "mountain",
    "1648-3024": "mountain",
    "1648-3040": "mountain",
    "1648-3056": "mountain",
    "1648-3072": "mountain",
    "1648-3088": "mountain",
    "1664-2992": "mountain",
    "1664-3008": "mountain",
    "1664-3024": "mountain",
    "1664-3040": "mountain",
    "1680-2976": "mountain",
    "1696-2960": "mountain",
    "1712-2944": "mountain",
    "1728-2928": "mountain",
    "1744-2912": "mountain",
    "1680-2992": "mountain",
    "1680-3008": "mountain",
    "1680-3024": "mountain",
    "1680-3040": "mountain",
    "1664-3056": "mountain",
    "1664-3072": "mountain",
    "1664-3088": "mountain",
    "1664-3104": "mountain",
    "1664-3120": "mountain",
    "1680-3056": "mountain",
    "1680-3072": "mountain",
    "1680-3088": "mountain",
    "1680-3104": "mountain",
    "1680-3120": "mountain",
    "1696-3136": "mountain",
    "1712-3136": "mountain",
    "1728-3136": "mountain",
    "1728-3152": "mountain",
    "1744-3168": "mountain",
    "1744-3152": "mountain",
    "1744-3136": "mountain",
    "1744-3120": "mountain",
    "1744-3104": "mountain",
    "1744-3088": "mountain",
    "1744-3072": "mountain",
    "1744-3056": "mountain",
    "1744-3040": "mountain",
    "1744-3024": "mountain",
    "1744-3008": "mountain",
    "1744-2992": "mountain",
    "1744-2976": "mountain",
    "1744-2960": "mountain",
    "1744-2944": "mountain",
    "1744-2928": "mountain",
    "1728-2944": "mountain",
    "1728-2960": "mountain",
    "1712-2960": "mountain",
    "1696-2976": "mountain",
    "1712-2976": "mountain",
    "1728-2976": "mountain",
    "1728-2992": "mountain",
    "1712-2992": "mountain",
    "1696-2992": "mountain",
    "1696-3008": "mountain",
    "1712-3008": "mountain",
    "1728-3008": "mountain",
    "1728-3024": "mountain",
    "1712-3024": "mountain",
    "1696-3024": "mountain",
    "1696-3040": "mountain",
    "1712-3040": "mountain",
    "1728-3040": "mountain",
    "1728-3056": "mountain",
    "1712-3056": "mountain",
    "1696-3056": "mountain",
    "1696-3072": "mountain",
    "1696-3088": "mountain",
    "1696-3104": "mountain",
    "1696-3120": "mountain",
    "1712-3120": "mountain",
    "1712-3104": "mountain",
    "1712-3088": "mountain",
    "1712-3072": "mountain",
    "1728-3072": "mountain",
    "1728-3088": "mountain",
    "1728-3104": "mountain",
    "1728-3120": "mountain",
    "1776-3216": "mountain",
    "1792-3216": "mountain",
    "1776-3232": "mountain",
    "1792-3232": "mountain",
    "1776-3248": "mountain",
    "1792-3248": "mountain",
    "1776-3264": "mountain",
    "1792-3264": "mountain",
    "1808-3264": "mountain",
    "1824-3264": "mountain",
    "1824-3280": "mountain",
    "1808-3280": "mountain",
    "1792-3280": "mountain",
    "1776-3280": "mountain",
    "1776-3296": "mountain",
    "1792-3296": "mountain",
    "1808-3296": "mountain",
    "1824-3296": "mountain",
    "1824-3312": "mountain",
    "1808-3312": "mountain",
    "1792-3312": "mountain",
    "1776-3312": "mountain",
    "1808-3328": "mountain",
    "1808-3344": "mountain",
    "1792-3328": "mountain",
    "1792-3344": "mountain",
    "1776-3328": "mountain",
    "1776-3344": "mountain",
    "1792-3360": "mountain",
    "1792-3376": "mountain",
    "1776-3360": "mountain",
    "1776-3376": "mountain",
    "1776-3392": "mountain",
    "1760-3360": "mountain",
    "1760-3376": "mountain",
    "1760-3392": "mountain",
    "1760-3408": "mountain",
    "1744-3392": "mountain",
    "1744-3408": "mountain",
    "1744-3424": "mountain",
    "1744-3440": "mountain",
    "1744-3456": "mountain",
    "1744-3472": "mountain",
    "1728-3408": "mountain",
    "1728-3424": "mountain",
    "1728-3440": "mountain",
    "1728-3456": "mountain",
    "1728-3472": "mountain",
    "1728-3488": "mountain",
    "1728-3504": "mountain",
    "1728-3520": "mountain",
    "1712-3488": "mountain",
    "1712-3504": "mountain",
    "1712-3520": "mountain",
    "1696-3520": "mountain",
    "1696-3536": "mountain",
    "1696-3552": "mountain",
    "1680-3536": "mountain",
    "1680-3552": "mountain",
    "1680-3568": "mountain",
    "1664-3552": "mountain",
    "1664-3568": "mountain",
    "1648-3552": "mountain",
    "1648-3568": "mountain",
    "1632-3552": "mountain",
    "1632-3568": "mountain",
    "1616-3552": "mountain",
    "1616-3568": "mountain",
    "1600-3536": "mountain",
    "1600-3552": "mountain",
    "1600-3568": "mountain",
    "1584-3568": "mountain",
    "1584-3552": "mountain",
    "1584-3536": "mountain",
    "1584-3520": "mountain",
    "1568-3552": "mountain",
    "1568-3536": "mountain",
    "1568-3520": "mountain",
    "1568-3504": "mountain",
    "1568-3232": "mountain",
    "1568-3216": "mountain",
    "1552-3200": "mountain",
    "1536-3200": "mountain",
    "1536-3216": "mountain",
    "1536-3232": "mountain",
    "1552-3248": "mountain",
    "1552-3232": "mountain",
    "1552-3216": "mountain",
    "1552-3488": "mountain",
    "1552-3504": "mountain",
    "1552-3520": "mountain",
    "1552-3536": "mountain",
    "1536-3536": "mountain",
    "1536-3520": "mountain",
    "1536-3504": "mountain",
    "1536-3488": "mountain",
    "1520-3504": "mountain",
    "1520-3488": "mountain",
    "1520-3472": "mountain",
    "1504-3488": "mountain",
    "1488-3488": "mountain",
    "1488-3472": "mountain",
    "1504-3472": "mountain",
    "1504-3456": "mountain",
    "1504-3440": "mountain",
    "1488-3424": "mountain",
    "1472-3408": "mountain",
    "1456-3392": "mountain",
    "1456-3376": "mountain",
    "1440-3360": "mountain",
    "1440-3344": "mountain",
    "1424-3344": "mountain",
    "1424-3328": "mountain",
    "1408-3328": "mountain",
    "1392-3328": "mountain",
    "1376-3312": "mountain",
    "1360-3312": "mountain",
    "1344-3328": "mountain",
    "1344-3344": "mountain",
    "1328-3360": "mountain",
    "1312-3360": "mountain",
    "1296-3344": "mountain",
    "1280-3328": "mountain",
    "1280-3312": "mountain",
    "1280-3296": "mountain",
    "1264-3296": "mountain",
    "1248-3296": "mountain",
    "1248-3312": "mountain",
    "1232-3328": "mountain",
    "1232-3344": "mountain",
    "1232-3360": "mountain",
    "1248-3376": "mountain",
    "1248-3392": "mountain",
    "1248-3408": "mountain",
    "1264-3424": "mountain",
    "1280-3424": "mountain",
    "1312-3440": "mountain",
    "1264-3312": "mountain",
    "1264-3328": "mountain",
    "1248-3328": "mountain",
    "1248-3344": "mountain",
    "1248-3360": "mountain",
    "1264-3344": "mountain",
    "1264-3360": "mountain",
    "1264-3376": "mountain",
    "1264-3392": "mountain",
    "1264-3408": "mountain",
    "1280-3344": "mountain",
    "1280-3360": "mountain",
    "1280-3376": "mountain",
    "1280-3392": "mountain",
    "1280-3408": "mountain",
    "1296-3360": "mountain",
    "1296-3376": "mountain",
    "1296-3392": "mountain",
    "1296-3408": "mountain",
    "1296-3424": "mountain",
    "1296-3440": "mountain",
    "1312-3376": "mountain",
    "1312-3392": "mountain",
    "1312-3408": "mountain",
    "1312-3424": "mountain",
    "1328-3424": "mountain",
    "1328-3408": "mountain",
    "1328-3392": "mountain",
    "1328-3376": "mountain",
    "1344-3360": "mountain",
    "1344-3376": "mountain",
    "1344-3392": "mountain",
    "1344-3408": "mountain",
    "1344-3424": "mountain",
    "1360-3408": "mountain",
    "1376-3408": "mountain",
    "1392-3408": "mountain",
    "1392-3424": "mountain",
    "1408-3424": "mountain",
    "1408-3440": "mountain",
    "1424-3440": "mountain",
    "1440-3440": "mountain",
    "1456-3440": "mountain",
    "1472-3456": "mountain",
    "1488-3456": "mountain",
    "1488-3440": "mountain",
    "1472-3440": "mountain",
    "1472-3424": "mountain",
    "1456-3424": "mountain",
    "1456-3408": "mountain",
    "1440-3424": "mountain",
    "1424-3424": "mountain",
    "1424-3408": "mountain",
    "1440-3408": "mountain",
    "1440-3392": "mountain",
    "1424-3392": "mountain",
    "1424-3376": "mountain",
    "1440-3376": "mountain",
    "1424-3360": "mountain",
    "1408-3344": "mountain",
    "1392-3344": "mountain",
    "1376-3328": "mountain",
    "1360-3328": "mountain",
    "1360-3344": "mountain",
    "1376-3344": "mountain",
    "1360-3360": "mountain",
    "1360-3376": "mountain",
    "1360-3392": "mountain",
    "1376-3392": "mountain",
    "1408-3408": "mountain",
    "1392-3392": "mountain",
    "1408-3392": "mountain",
    "1408-3376": "mountain",
    "1408-3360": "mountain",
    "1392-3360": "mountain",
    "1392-3376": "mountain",
    "1376-3376": "mountain",
    "1376-3360": "mountain",
    "1328-3440": "mountain",
    "1328-3456": "mountain",
    "1328-3472": "mountain",
    "1328-3488": "mountain",
    "1328-3504": "mountain",
    "1328-3520": "mountain",
    "1328-3536": "mountain",
    "1328-3552": "mountain",
    "1344-3552": "mountain",
    "1312-3456": "mountain",
    "1312-3472": "mountain",
    "1312-3488": "mountain",
    "1312-3504": "mountain",
    "1312-3520": "mountain",
    "1312-3536": "mountain",
    "1296-3520": "mountain",
    "1296-3536": "mountain",
    "1296-3552": "mountain",
    "1280-3552": "mountain",
    "1264-3568": "mountain",
    "1248-3584": "mountain",
    "1232-3600": "mountain",
    "1248-3600": "mountain",
    "1264-3600": "mountain",
    "1264-3584": "mountain",
    "1280-3600": "mountain",
    "1296-3600": "mountain",
    "1312-3600": "mountain",
    "1312-3584": "mountain",
    "1312-3568": "mountain",
    "1312-3552": "mountain",
    "1296-3568": "mountain",
    "1280-3568": "mountain",
    "1280-3584": "mountain",
    "1296-3584": "mountain",
    "1280-3616": "mountain",
    "1296-3616": "mountain",
    "1312-3616": "mountain",
    "1296-3632": "mountain",
    "1312-3632": "mountain",
    "1328-3632": "mountain",
    "1344-3632": "mountain",
    "1344-3648": "mountain",
    "1344-3664": "mountain",
    "1328-3664": "mountain",
    "1328-3648": "mountain",
    "1312-3648": "mountain",
    "1248-2864": "mountain",
    "1248-2880": "mountain",
    "1248-2896": "mountain",
    "1232-2880": "mountain",
    "1232-2896": "mountain",
    "1200-2880": "mountain",
    "1216-2896": "mountain",
    "1216-2912": "mountain",
    "1216-2880": "mountain",
    "1200-2896": "mountain",
    "1200-2912": "mountain",
    "1184-2880": "mountain",
    "1184-2896": "mountain",
    "1184-2912": "mountain",
    "1168-2880": "mountain",
    "1168-2896": "mountain",
    "1168-2912": "mountain",
    "1152-2880": "mountain",
    "1136-2880": "mountain",
    "1152-2896": "mountain",
    "1136-2896": "mountain",
    "1120-2896": "mountain",
    "1152-2912": "mountain",
    "1136-2912": "mountain",
    "1152-2928": "mountain",
    "1136-2928": "mountain",
    "1120-2912": "mountain",
    "1104-2912": "mountain",
    "1104-2928": "mountain",
    "1120-2928": "mountain",
    "1136-2944": "mountain",
    "1120-2944": "mountain",
    "1104-2944": "mountain",
    "1088-2944": "mountain",
    "1072-2944": "mountain",
    "1072-2960": "mountain",
    "1072-2976": "mountain",
    "1088-2960": "mountain",
    "1104-2960": "mountain",
    "1120-2960": "mountain",
    "1136-2960": "mountain",
    "1088-2976": "mountain",
    "1088-2992": "mountain",
    "1088-3008": "mountain",
    "1104-2976": "mountain",
    "1104-2992": "mountain",
    "1120-2976": "mountain",
    "1120-2992": "mountain",
    "1136-2976": "mountain",
    "1136-2992": "mountain",
    "1136-3008": "mountain",
    "1152-2976": "mountain",
    "1152-2992": "mountain",
    "1152-3008": "mountain",
    "1152-3024": "mountain",
    "1168-2992": "mountain",
    "1168-3008": "mountain",
    "1168-3024": "mountain",
    "1168-3040": "mountain",
    "1184-3008": "mountain",
    "1184-3024": "mountain",
    "1184-3040": "mountain",
    "1184-3056": "mountain",
    "1200-3040": "mountain",
    "1216-3040": "mountain",
    "1216-3056": "mountain",
    "1200-3056": "mountain",
    "1200-3072": "mountain",
    "1216-3072": "mountain",
    "1232-3072": "mountain",
    "1248-3072": "mountain",
    "1248-3088": "mountain",
    "1232-3088": "mountain",
    "1216-3088": "mountain",
    "1216-3104": "mountain",
    "1232-3104": "mountain",
    "1248-3104": "mountain",
    "1216-3120": "mountain",
    "1232-3120": "mountain",
    "1248-3120": "mountain",
    "1264-3120": "mountain",
    "1216-3136": "mountain",
    "1232-3136": "mountain",
    "1248-3136": "mountain",
    "1264-3136": "mountain",
    "1216-3152": "mountain",
    "1232-3152": "mountain",
    "1248-3152": "mountain",
    "1264-3152": "mountain",
    "1280-3152": "mountain",
    "1296-3152": "mountain",
    "1232-3168": "mountain",
    "1248-3168": "mountain",
    "1264-3168": "mountain",
    "1280-3168": "mountain",
    "1296-3168": "mountain",
    "1312-3168": "mountain",
    "1248-3184": "mountain",
    "1264-3184": "mountain",
    "1280-3184": "mountain",
    "1296-3184": "mountain",
    "1312-3184": "mountain",
    "1328-3184": "mountain",
    "1248-3200": "mountain",
    "1264-3200": "mountain",
    "1280-3200": "mountain",
    "1296-3200": "mountain",
    "1312-3200": "mountain",
    "1328-3200": "mountain",
    "1328-3216": "mountain",
    "1312-3216": "mountain",
    "1296-3216": "mountain",
    "1264-3216": "mountain",
    "1280-3216": "mountain",
    "1264-3232": "mountain",
    "1264-3248": "mountain",
    "1280-3248": "mountain",
    "1280-3232": "mountain",
    "1296-3232": "mountain",
    "496-2832": "mountain",
    "496-2848": "mountain",
    "512-2832": "mountain",
    "512-2848": "mountain",
    "512-2864": "mountain",
    "512-2880": "mountain",
    "528-2832": "mountain",
    "528-2848": "mountain",
    "528-2864": "mountain",
    "528-2880": "mountain",
    "528-2896": "mountain",
    "528-2912": "mountain",
    "544-2912": "mountain",
    "544-2896": "mountain",
    "544-2880": "mountain",
    "544-2864": "mountain",
    "544-2848": "mountain",
    "544-2832": "mountain",
    "560-2832": "mountain",
    "560-2848": "mountain",
    "560-2864": "mountain",
    "560-2880": "mountain",
    "560-2896": "mountain",
    "576-2880": "mountain",
    "576-2848": "mountain",
    "576-2864": "mountain",
    "576-2832": "mountain",
    "592-2832": "mountain",
    "592-2848": "mountain",
    "608-2832": "mountain",
    "624-2832": "mountain",
    "640-2832": "mountain",
    "656-2832": "mountain",
    "672-2832": "mountain",
    "688-2832": "mountain",
    "704-2832": "mountain",
    "720-2832": "mountain",
    "736-2832": "mountain",
    "752-2832": "mountain",
    "768-2832": "mountain",
    "784-2832": "mountain",
    "800-2832": "mountain",
    "816-2832": "mountain",
    "832-2832": "mountain",
    "864-2832": "mountain",
    "848-2832": "mountain",
    "880-2832": "mountain",
    "896-2832": "mountain",
    "912-2832": "mountain",
    "752-2848": "mountain",
    "784-2848": "mountain",
    "768-2848": "mountain",
    "800-2848": "mountain",
    "816-2848": "mountain",
    "832-2848": "mountain",
    "848-2848": "mountain",
    "864-2848": "mountain",
    "880-2848": "mountain",
    "896-2848": "mountain",
    "912-2848": "mountain",
    "928-2848": "mountain",
    "768-2864": "mountain",
    "784-2864": "mountain",
    "800-2864": "mountain",
    "816-2864": "mountain",
    "832-2864": "mountain",
    "848-2864": "mountain",
    "864-2864": "mountain",
    "880-2864": "mountain",
    "896-2864": "mountain",
    "912-2864": "mountain",
    "928-2864": "mountain",
    "944-2864": "mountain",
    "784-2880": "mountain",
    "816-2880": "mountain",
    "800-2880": "mountain",
    "832-2880": "mountain",
    "848-2880": "mountain",
    "864-2880": "mountain",
    "880-2880": "mountain",
    "896-2880": "mountain",
    "912-2880": "mountain",
    "928-2880": "mountain",
    "944-2880": "mountain",
    "960-2880": "mountain",
    "784-2896": "mountain",
    "800-2896": "mountain",
    "816-2896": "mountain",
    "832-2896": "mountain",
    "848-2896": "mountain",
    "864-2896": "mountain",
    "880-2896": "mountain",
    "896-2896": "mountain",
    "912-2896": "mountain",
    "928-2896": "mountain",
    "944-2896": "mountain",
    "960-2896": "mountain",
    "976-2896": "mountain",
    "1024-2896": "mountain",
    "1024-2912": "mountain",
    "1008-2912": "mountain",
    "1024-2928": "mountain",
    "1024-2944": "mountain",
    "1024-2960": "mountain",
    "1024-2976": "mountain",
    "1024-2992": "mountain",
    "1024-3008": "mountain",
    "1024-3024": "mountain",
    "1040-3024": "mountain",
    "1040-3040": "mountain",
    "1040-3056": "mountain",
    "1040-3072": "mountain",
    "1040-3088": "mountain",
    "1024-3104": "mountain",
    "1024-3120": "mountain",
    "1024-3136": "mountain",
    "1024-3152": "mountain",
    "1024-3168": "mountain",
    "1024-3184": "mountain",
    "1024-3200": "mountain",
    "1024-3216": "mountain",
    "1024-3232": "mountain",
    "1024-3248": "mountain",
    "1024-3264": "mountain",
    "1040-3264": "mountain",
    "1040-3280": "mountain",
    "1040-3296": "mountain",
    "1040-3312": "mountain",
    "1056-3328": "mountain",
    "1072-3344": "mountain",
    "1088-3360": "mountain",
    "1104-3376": "mountain",
    "1120-3376": "mountain",
    "1120-3392": "mountain",
    "1104-3392": "mountain",
    "1104-3408": "mountain",
    "1104-3424": "mountain",
    "1104-3440": "mountain",
    "1120-3440": "mountain",
    "1120-3456": "mountain",
    "1120-3472": "mountain",
    "1104-3472": "mountain",
    "1088-3488": "mountain",
    "1072-3504": "mountain",
    "1056-3504": "mountain",
    "1040-3504": "mountain",
    "1040-3520": "mountain",
    "1040-3536": "mountain",
    "1200-3584": "mountain",
    "1184-3584": "mountain",
    "1168-3584": "mountain",
    "1152-3584": "mountain",
    "1136-3584": "mountain",
    "1120-3584": "mountain",
    "1104-3584": "mountain",
    "1232-3616": "mountain",
    "1216-3616": "mountain",
    "1200-3616": "mountain",
    "1184-3616": "mountain",
    "1168-3616": "mountain",
    "1152-3616": "mountain",
    "1136-3616": "mountain",
    "1120-3616": "mountain",
    "1104-3616": "mountain",
    "1088-3616": "mountain",
    "1072-3616": "mountain",
    "1072-3600": "mountain",
    "1056-3600": "mountain",
    "1056-3584": "mountain",
    "1056-3568": "mountain",
    "1040-3568": "mountain",
    "1040-3584": "mountain",
    "1024-3584": "mountain",
    "1008-3584": "mountain",
    "1024-3536": "mountain",
    "1008-3536": "mountain",
    "1008-3552": "mountain",
    "992-3552": "mountain",
    "992-3536": "mountain",
    "976-3552": "mountain",
    "960-3552": "mountain",
    "944-3552": "mountain",
    "944-3536": "mountain",
    "928-3536": "mountain",
    "928-3520": "mountain",
    "912-3520": "mountain",
    "912-3504": "mountain",
    "896-3504": "mountain",
    "896-3488": "mountain",
    "880-3488": "mountain",
    "880-3472": "mountain",
    "864-3472": "mountain",
    "848-3472": "mountain",
    "848-3456": "mountain",
    "832-3456": "mountain",
    "832-3440": "mountain",
    "816-3440": "mountain",
    "816-3424": "mountain",
    "816-3408": "mountain",
    "816-3392": "mountain",
    "816-3376": "mountain",
    "800-3408": "mountain",
    "800-3392": "mountain",
    "800-3376": "mountain",
    "800-3360": "mountain",
    "800-3344": "mountain",
    "1024-3520": "mountain",
    "1024-3504": "mountain",
    "1040-3488": "mountain",
    "1040-3472": "mountain",
    "1056-3488": "mountain",
    "1056-3472": "mountain",
    "1072-3488": "mountain",
    "1072-3472": "mountain",
    "1088-3472": "mountain",
    "1088-3456": "mountain",
    "1104-3456": "mountain",
    "1072-3456": "mountain",
    "1056-3456": "mountain",
    "1056-3440": "mountain",
    "1072-3440": "mountain",
    "1088-3440": "mountain",
    "1088-3424": "mountain",
    "1072-3424": "mountain",
    "1056-3424": "mountain",
    "1072-3408": "mountain",
    "1088-3392": "mountain",
    "1088-3376": "mountain",
    "1088-3408": "mountain",
    "1072-3392": "mountain",
    "1072-3376": "mountain",
    "1072-3360": "mountain",
    "1056-3344": "mountain",
    "1056-3360": "mountain",
    "1056-3376": "mountain",
    "1056-3392": "mountain",
    "1056-3408": "mountain",
    "1040-3408": "mountain",
    "1024-3408": "mountain",
    "1024-3392": "mountain",
    "1040-3392": "mountain",
    "1040-3376": "mountain",
    "1024-3376": "mountain",
    "1024-3360": "mountain",
    "1040-3360": "mountain",
    "1040-3344": "mountain",
    "1024-3344": "mountain",
    "1024-3328": "mountain",
    "1040-3328": "mountain",
    "1024-3312": "mountain",
    "1024-3296": "mountain",
    "1024-3280": "mountain",
    "1024-3088": "mountain",
    "1024-3072": "mountain",
    "1024-3056": "mountain",
    "1024-3040": "mountain",
    "1008-2928": "mountain",
    "1008-2944": "mountain",
    "1008-2960": "mountain",
    "1008-2976": "mountain",
    "1008-2992": "mountain",
    "1008-3008": "mountain",
    "1008-3024": "mountain",
    "1008-3040": "mountain",
    "1008-3056": "mountain",
    "1008-3072": "mountain",
    "1008-3088": "mountain",
    "1008-3104": "mountain",
    "1008-3120": "mountain",
    "1008-3136": "mountain",
    "1008-3152": "mountain",
    "1008-3168": "mountain",
    "1008-3184": "mountain",
    "1008-3200": "mountain",
    "1008-3216": "mountain",
    "1008-3232": "mountain",
    "1008-3248": "mountain",
    "1008-3264": "mountain",
    "1008-3280": "mountain",
    "1008-3296": "mountain",
    "1008-3312": "mountain",
    "1008-3328": "mountain",
    "1008-3344": "mountain",
    "1008-3360": "mountain",
    "1008-3376": "mountain",
    "992-3360": "mountain",
    "992-3344": "mountain",
    "992-3328": "mountain",
    "992-3312": "mountain",
    "992-3296": "mountain",
    "992-3280": "mountain",
    "992-3264": "mountain",
    "992-3248": "mountain",
    "992-3232": "mountain",
    "992-3216": "mountain",
    "992-3200": "mountain",
    "992-3184": "mountain",
    "992-3168": "mountain",
    "992-3152": "mountain",
    "992-3136": "mountain",
    "992-3120": "mountain",
    "992-3104": "mountain",
    "992-3088": "mountain",
    "992-3072": "mountain",
    "992-3056": "mountain",
    "992-3040": "mountain",
    "992-3024": "mountain",
    "992-3008": "mountain",
    "992-2992": "mountain",
    "992-2976": "mountain",
    "992-2944": "mountain",
    "992-2960": "mountain",
    "992-2928": "mountain",
    "992-2912": "mountain",
    "976-2912": "mountain",
    "976-2928": "mountain",
    "960-2912": "mountain",
    "944-2912": "mountain",
    "928-2912": "mountain",
    "912-2912": "mountain",
    "896-2912": "mountain",
    "880-2912": "mountain",
    "864-2912": "mountain",
    "848-2912": "mountain",
    "832-2912": "mountain",
    "816-2912": "mountain",
    "800-2912": "mountain",
    "832-2928": "mountain",
    "848-2944": "mountain",
    "864-2960": "mountain",
    "880-2976": "mountain",
    "896-2992": "mountain",
    "896-3008": "mountain",
    "896-3024": "mountain",
    "912-3024": "mountain",
    "928-3024": "mountain",
    "944-3024": "mountain",
    "960-3024": "mountain",
    "976-3024": "mountain",
    "976-3008": "mountain",
    "976-2992": "mountain",
    "976-2976": "mountain",
    "976-2960": "mountain",
    "976-2944": "mountain",
    "960-2928": "mountain",
    "960-2944": "mountain",
    "960-2960": "mountain",
    "960-2976": "mountain",
    "960-2992": "mountain",
    "960-3008": "mountain",
    "944-3008": "mountain",
    "928-3008": "mountain",
    "912-3008": "mountain",
    "912-2992": "mountain",
    "928-2992": "mountain",
    "944-2992": "mountain",
    "944-2976": "mountain",
    "928-2976": "mountain",
    "912-2976": "mountain",
    "896-2976": "mountain",
    "928-2960": "mountain",
    "944-2960": "mountain",
    "944-2944": "mountain",
    "944-2928": "mountain",
    "928-2928": "mountain",
    "928-2944": "mountain",
    "912-2928": "mountain",
    "912-2944": "mountain",
    "912-2960": "mountain",
    "896-2960": "mountain",
    "896-2944": "mountain",
    "896-2928": "mountain",
    "880-2928": "mountain",
    "880-2944": "mountain",
    "880-2960": "mountain",
    "864-2944": "mountain",
    "864-2928": "mountain",
    "848-2928": "mountain",
    "912-3040": "mountain",
    "912-3056": "mountain",
    "912-3072": "mountain",
    "912-3088": "mountain",
    "912-3104": "mountain",
    "896-3104": "mountain",
    "896-3120": "mountain",
    "896-3136": "mountain",
    "896-3152": "mountain",
    "896-3168": "mountain",
    "896-3184": "mountain",
    "896-3200": "mountain",
    "912-3152": "mountain",
    "912-3136": "mountain",
    "912-3120": "mountain",
    "928-3040": "mountain",
    "944-3040": "mountain",
    "960-3040": "mountain",
    "976-3040": "mountain",
    "976-3056": "mountain",
    "960-3056": "mountain",
    "944-3056": "mountain",
    "928-3056": "mountain",
    "928-3072": "mountain",
    "944-3072": "mountain",
    "960-3072": "mountain",
    "976-3072": "mountain",
    "976-3088": "mountain",
    "960-3088": "mountain",
    "944-3088": "mountain",
    "928-3088": "mountain",
    "928-3104": "mountain",
    "928-3120": "mountain",
    "928-3136": "mountain",
    "928-3152": "mountain",
    "928-3168": "mountain",
    "928-3184": "mountain",
    "928-3200": "mountain",
    "928-3216": "mountain",
    "944-3104": "mountain",
    "960-3104": "mountain",
    "976-3104": "mountain",
    "976-3120": "mountain",
    "960-3120": "mountain",
    "944-3120": "mountain",
    "944-3136": "mountain",
    "960-3136": "mountain",
    "976-3136": "mountain",
    "976-3152": "mountain",
    "960-3152": "mountain",
    "944-3152": "mountain",
    "944-3168": "mountain",
    "960-3168": "mountain",
    "976-3168": "mountain",
    "976-3184": "mountain",
    "960-3184": "mountain",
    "944-3184": "mountain",
    "944-3200": "mountain",
    "960-3200": "mountain",
    "976-3200": "mountain",
    "976-3216": "mountain",
    "960-3216": "mountain",
    "944-3216": "mountain",
    "944-3232": "mountain",
    "944-3248": "mountain",
    "960-3232": "mountain",
    "976-3232": "mountain",
    "976-3248": "mountain",
    "960-3248": "mountain",
    "960-3264": "mountain",
    "976-3264": "mountain",
    "976-3280": "mountain",
    "960-3280": "mountain",
    "960-3296": "mountain",
    "976-3296": "mountain",
    "976-3312": "mountain",
    "976-3328": "mountain",
    "880-3136": "mountain",
    "880-3152": "mountain",
    "880-3168": "mountain",
    "880-3184": "mountain",
    "880-3200": "mountain",
    "880-3216": "mountain",
    "880-3232": "mountain",
    "880-3248": "mountain",
    "864-3264": "mountain",
    "864-3248": "mountain",
    "864-3232": "mountain",
    "864-3216": "mountain",
    "864-3200": "mountain",
    "864-3184": "mountain",
    "864-3168": "mountain",
    "864-3152": "mountain",
    "864-3136": "mountain",
    "848-3136": "mountain",
    "848-3152": "mountain",
    "848-3168": "mountain",
    "848-3184": "mountain",
    "848-3200": "mountain",
    "848-3216": "mountain",
    "848-3232": "mountain",
    "848-3248": "mountain",
    "832-3248": "mountain",
    "832-3232": "mountain",
    "816-3232": "mountain",
    "832-3216": "mountain",
    "816-3216": "mountain",
    "832-3200": "mountain",
    "816-3200": "mountain",
    "832-3184": "mountain",
    "816-3184": "mountain",
    "832-3168": "mountain",
    "816-3168": "mountain",
    "816-3152": "mountain",
    "816-3136": "mountain",
    "816-3120": "mountain",
    "832-3120": "mountain",
    "832-3136": "mountain",
    "832-3152": "mountain",
    "800-3200": "mountain",
    "800-3184": "mountain",
    "800-3168": "mountain",
    "800-3152": "mountain",
    "800-3136": "mountain",
    "800-3120": "mountain",
    "784-3120": "mountain",
    "784-3136": "mountain",
    "784-3152": "mountain",
    "784-3168": "mountain",
    "768-3168": "mountain",
    "752-3168": "mountain",
    "752-3152": "mountain",
    "752-3136": "mountain",
    "752-3120": "mountain",
    "768-3120": "mountain",
    "768-3136": "mountain",
    "768-3152": "mountain",
    "736-3152": "mountain",
    "736-3136": "mountain",
    "736-3120": "mountain",
    "736-3104": "mountain",
    "736-3088": "mountain",
    "736-3072": "mountain",
    "752-3088": "mountain",
    "768-3088": "mountain",
    "784-3088": "mountain",
    "816-3088": "mountain",
    "832-3088": "mountain",
    "832-3072": "mountain",
    "832-3056": "mountain",
    "816-3072": "mountain",
    "816-3056": "mountain",
    "816-3040": "mountain",
    "816-3024": "mountain",
    "816-3008": "mountain",
    "800-2992": "mountain",
    "800-3008": "mountain",
    "800-3024": "mountain",
    "800-3040": "mountain",
    "800-3056": "mountain",
    "800-3072": "mountain",
    "800-3088": "mountain",
    "784-3072": "mountain",
    "768-3072": "mountain",
    "752-3072": "mountain",
    "784-3056": "mountain",
    "784-3040": "mountain",
    "784-3024": "mountain",
    "784-3008": "mountain",
    "784-2992": "mountain",
    "752-2976": "mountain",
    "768-2976": "mountain",
    "768-2992": "mountain",
    "768-3008": "mountain",
    "768-3024": "mountain",
    "768-3040": "mountain",
    "768-3056": "mountain",
    "752-3056": "mountain",
    "736-3040": "mountain",
    "736-3056": "mountain",
    "752-3040": "mountain",
    "752-3024": "mountain",
    "752-3008": "mountain",
    "752-2992": "mountain",
    "736-2976": "mountain",
    "736-2992": "mountain",
    "736-3008": "mountain",
    "736-3024": "mountain",
    "720-3040": "mountain",
    "720-3024": "mountain",
    "720-3008": "mountain",
    "720-2992": "mountain",
    "720-2976": "mountain",
    "720-2960": "mountain",
    "704-2960": "mountain",
    "704-2976": "mountain",
    "704-2992": "mountain",
    "704-3008": "mountain",
    "704-3024": "mountain",
    "688-3024": "mountain",
    "688-3008": "mountain",
    "688-2992": "mountain",
    "688-2976": "mountain",
    "688-2960": "mountain",
    "672-2960": "mountain",
    "656-2960": "mountain",
    "640-2960": "mountain",
    "624-2992": "mountain",
    "608-2992": "mountain",
    "624-2976": "mountain",
    "640-2976": "mountain",
    "640-2992": "mountain",
    "656-2992": "mountain",
    "656-2976": "mountain",
    "672-2976": "mountain",
    "672-2992": "mountain",
    "672-3008": "mountain",
    "672-3024": "mountain",
    "656-3024": "mountain",
    "656-3008": "mountain",
    "640-3008": "mountain",
    "624-3008": "mountain",
    "608-3008": "mountain",
    "592-3008": "mountain",
    "576-2992": "mountain",
    "560-2992": "mountain",
    "544-2992": "mountain",
    "544-3008": "mountain",
    "560-3008": "mountain",
    "576-3008": "mountain",
    "528-3024": "mountain",
    "544-3024": "mountain",
    "560-3024": "mountain",
    "576-3024": "mountain",
    "592-3024": "mountain",
    "608-3024": "mountain",
    "624-3024": "mountain",
    "640-3024": "mountain",
    "528-3040": "mountain",
    "544-3040": "mountain",
    "560-3040": "mountain",
    "576-3040": "mountain",
    "592-3040": "mountain",
    "608-3040": "mountain",
    "624-3040": "mountain",
    "640-3040": "mountain",
    "656-3040": "mountain",
    "640-3056": "mountain",
    "624-3056": "mountain",
    "608-3056": "mountain",
    "592-3056": "mountain",
    "576-3056": "mountain",
    "560-3056": "mountain",
    "544-3056": "mountain",
    "528-3056": "mountain",
    "512-3056": "mountain",
    "512-3072": "mountain",
    "528-3072": "mountain",
    "544-3072": "mountain",
    "560-3072": "mountain",
    "576-3072": "mountain",
    "592-3072": "mountain",
    "608-3072": "mountain",
    "624-3072": "mountain",
    "608-3088": "mountain",
    "608-3104": "mountain",
    "592-3088": "mountain",
    "592-3104": "mountain",
    "576-3088": "mountain",
    "576-3104": "mountain",
    "560-3088": "mountain",
    "560-3104": "mountain",
    "544-3088": "mountain",
    "544-3104": "mountain",
    "528-3088": "mountain",
    "528-3104": "mountain",
    "512-3088": "mountain",
    "512-3104": "mountain",
    "496-3088": "mountain",
    "496-3104": "mountain",
    "496-3120": "mountain",
    "496-3136": "mountain",
    "512-3136": "mountain",
    "512-3120": "mountain",
    "528-3120": "mountain",
    "528-3136": "mountain",
    "560-3136": "mountain",
    "544-3120": "mountain",
    "560-3120": "mountain",
    "576-3120": "mountain",
    "576-3136": "mountain",
    "592-3120": "mountain",
    "592-3136": "mountain",
    "592-3152": "mountain",
    "576-3152": "mountain",
    "560-3152": "mountain",
    "544-3152": "mountain",
    "544-3136": "mountain",
    "528-3152": "mountain",
    "512-3152": "mountain",
    "496-3152": "mountain",
    "496-3168": "mountain",
    "496-3184": "mountain",
    "496-3200": "mountain",
    "496-3216": "mountain",
    "496-3232": "mountain",
    "512-3168": "mountain",
    "512-3184": "mountain",
    "512-3200": "mountain",
    "512-3216": "mountain",
    "512-3232": "mountain",
    "512-3248": "mountain",
    "512-3264": "mountain",
    "528-3168": "mountain",
    "528-3184": "mountain",
    "528-3200": "mountain",
    "528-3216": "mountain",
    "528-3232": "mountain",
    "528-3248": "mountain",
    "528-3264": "mountain",
    "528-3280": "mountain",
    "544-3168": "mountain",
    "560-3168": "mountain",
    "576-3168": "mountain",
    "592-3168": "mountain",
    "592-3184": "mountain",
    "608-3200": "mountain",
    "592-3200": "mountain",
    "576-3200": "mountain",
    "576-3184": "mountain",
    "560-3200": "mountain",
    "560-3184": "mountain",
    "544-3200": "mountain",
    "544-3184": "mountain",
    "544-3216": "mountain",
    "544-3232": "mountain",
    "560-3232": "mountain",
    "560-3216": "mountain",
    "576-3216": "mountain",
    "576-3232": "mountain",
    "592-3232": "mountain",
    "608-3216": "mountain",
    "592-3216": "mountain",
    "608-3232": "mountain",
    "624-3232": "mountain",
    "640-3248": "mountain",
    "624-3248": "mountain",
    "608-3248": "mountain",
    "592-3248": "mountain",
    "576-3248": "mountain",
    "560-3248": "mountain",
    "544-3248": "mountain",
    "544-3264": "mountain",
    "560-3264": "mountain",
    "576-3264": "mountain",
    "592-3264": "mountain",
    "608-3264": "mountain",
    "624-3264": "mountain",
    "640-3264": "mountain",
    "656-3264": "mountain",
    "672-3264": "mountain",
    "720-3280": "mountain",
    "704-3280": "mountain",
    "688-3280": "mountain",
    "656-3280": "mountain",
    "672-3280": "mountain",
    "640-3280": "mountain",
    "624-3280": "mountain",
    "608-3280": "mountain",
    "592-3280": "mountain",
    "576-3280": "mountain",
    "560-3280": "mountain",
    "544-3280": "mountain",
    "544-3296": "mountain",
    "560-3296": "mountain",
    "576-3296": "mountain",
    "592-3296": "mountain",
    "608-3296": "mountain",
    "624-3296": "mountain",
    "640-3296": "mountain",
    "656-3296": "mountain",
    "672-3296": "mountain",
    "688-3296": "mountain",
    "704-3296": "mountain",
    "720-3296": "mountain",
    "736-3312": "mountain",
    "720-3312": "mountain",
    "704-3312": "mountain",
    "688-3312": "mountain",
    "672-3312": "mountain",
    "656-3312": "mountain",
    "640-3312": "mountain",
    "624-3312": "mountain",
    "608-3312": "mountain",
    "592-3312": "mountain",
    "576-3312": "mountain",
    "560-3312": "mountain",
    "592-3328": "mountain",
    "608-3328": "mountain",
    "624-3328": "mountain",
    "640-3328": "mountain",
    "656-3328": "mountain",
    "672-3328": "mountain",
    "688-3328": "mountain",
    "704-3328": "mountain",
    "720-3328": "mountain",
    "736-3328": "mountain",
    "752-3328": "mountain",
    "768-3328": "mountain",
    "784-3344": "mountain",
    "768-3344": "mountain",
    "752-3344": "mountain",
    "736-3344": "mountain",
    "720-3344": "mountain",
    "704-3344": "mountain",
    "688-3344": "mountain",
    "672-3344": "mountain",
    "656-3344": "mountain",
    "640-3344": "mountain",
    "624-3344": "mountain",
    "608-3344": "mountain",
    "592-3344": "mountain",
    "608-3360": "mountain",
    "624-3360": "mountain",
    "640-3360": "mountain",
    "656-3360": "mountain",
    "672-3360": "mountain",
    "688-3360": "mountain",
    "656-3376": "mountain",
    "640-3376": "mountain",
    "624-3376": "mountain",
    "608-3376": "mountain",
    "768-3360": "mountain",
    "784-3360": "mountain"
}

},{}],14:[function(require,module,exports){
//     Underscore.js 1.8.2
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.2';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var isArrayLike = function(collection) {
    var length = collection && collection.length;
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, target, fromIndex) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    return _.indexOf(obj, target, typeof fromIndex == 'number' && fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = input && input.length; i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, 'length').length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = list && list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    var i = 0, length = array && array.length;
    if (typeof isSorted == 'number') {
      i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
    } else if (isSorted && length) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (item !== item) {
      return _.findIndex(slice.call(array, i), _.isNaN);
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    var idx = array ? array.length : 0;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    if (item !== item) {
      return _.findLastIndex(slice.call(array, 0, idx), _.isNaN);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = array != null && array.length;
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createIndexFinder(1);

  _.findLastIndex = createIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    
    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of 
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;
  
  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}]},{},[1]);

//# sourceMappingURL=app.js.map