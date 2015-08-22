/*
@licstart  The following is the entire license notice for the
JavaScript code in this page.

Copyright (C) 2014  Grzegorz Wójcik

The JavaScript code in this page is free software: you can
redistribute it and/or modify it under the terms of the GNU
General Public License (GNU GPL) as published by the Free Software
Foundation, either version 3 of the License, or (at your option)
any later version.  The code is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

As additional permission under GNU GPL version 3 section 7, you
may distribute non-source (e.g., minimized or compacted) forms of
that code without the copy of the GNU GPL normally required by
section 4, provided you include this license notice and a URL
through which recipients can access the Corresponding Source.


@licend  The above is the entire license notice
for the JavaScript code in this page.
*/

function Game() {
   "use strict";
}

Game.prototype.init = function() {
   "use strict";
   this.graphic = new Graphic();
   this.graphic.init({canvas: 'gl'});

   this.gen = new Gen();

   var time = new Date();
   this.startTime = time.getTime();
   this.lastFrameTime = time.getTime();
   this.changeGameState('NEW');

   this.debug = {
      showSolution: false,
      noMazeValidation: false
   };
   this.config = {
      tileCount: 2 * 16,
      ambientLight: 0.0,
   };

   if (!this.debug.showSolution) {
      var jsCanvas = document.getElementById('gl_js');
      jsCanvas.style.display = 'none';
   }

   this.player = {
      pos: {
         x: 0.0,
         y: 0.0
      },
      r: 0.2,
      v: {
         x: 0.0,
         y: 0.0
      },
      wall: {
         distance: 1,
         dx: 1,
         dy: 1
      }
   };
   this.exitPos = {
      x: 0.0,
      y: 0.0
   }
   this.mazeSeedValue = 0;
   this.keyInput = {};
   
   this.mazeShader = this.graphic.loadProgramFile("./simple.vert","./maze.frag");
   this.mazeSeed = this.graphic.gl.getUniformLocation(this.mazeShader, 'seed');
   this.mazePlayerPos = this.graphic.gl.getUniformLocation(this.mazeShader, 'playerPos');
   this.mazeExitPos = this.graphic.gl.getUniformLocation(this.mazeShader, 'exitPos');
   this.mazeTextureUniform = this.graphic.gl.getUniformLocation(this.mazeShader, 'maze');
   this.mazeAmbient = this.graphic.gl.getUniformLocation(this.mazeShader, 'ambient');

   this.mazeTexture = this.graphic.createTexture({
      size: 32,
      data: null
   });
   this.graphic.gl.uniform1i(this.mazeTextureUniform, 0 );

   this.distanceShader = this.graphic.loadProgramFile("./simple.vert","./maze.frag", {define: {GET_DISTANCE: 1}});
   this.distanceFBO = this.graphic.createFBO({size: {x: 1, y: 1} });
   this.distancePlayerPos = this.graphic.gl.getUniformLocation(this.distanceShader, 'playerPos');
   this.distanceSeed = this.graphic.gl.getUniformLocation(this.distanceShader, 'seed');

   this.graphic.gl.useProgram(this.mazeShader);

   this.genNewMaze = true;

   this.draw();
}

Game.prototype.keyDownEvent = function(event) {
   var key = event.keyCode;
   if (key == 0x26 || key == 0x57) { //ArrowUp || W
      this.keyInput.up = true;
   } else if (key == 0x28 || key == 0x53) { //ArrowDown || S
      this.keyInput.down = true;
   } else if (key == 0x27 || key == 0x44) { //ArrowRight || D
      this.keyInput.right = true;
   } else if (key == 0x25 || key == 0x41) { //ArrowRight || A
      this.keyInput.left = true;
   }
}

Game.prototype.keyUpEvent = function(event) {
   var key = event.keyCode;
   if (key == 0x26 || key == 0x57) { //ArrowUp || W
      this.keyInput.up = false;
   } else if (key == 0x28 || key == 0x53) { //ArrowDown || S
      this.keyInput.down = false;
   } else if (key == 0x27 || key == 0x44) { //ArrowRight || D
      this.keyInput.right = false;
   } else if (key == 0x25 || key == 0x41) { //ArrowRight || A
      this.keyInput.left = false;
   }
}

Game.prototype.draw = function() {
   "use strict";
   var that = this;
   var callback = function() {
      that.draw();
   };
   var time = (new Date()).getTime();

   this.updateGUI();


   if (this.genNewMaze) {
      this.startTime = time;
      this.changeGameState('NEW');
      this.mazeSeedValue = ((time/1000) & 0x3FF);
      this.player.pos = {x: 0, y:0};
      this.exitPos = {x: 0, y:0};
      this.updateGraphic(1);
      this.graphic.gl.uniform1f(this.mazeAmbient, 1.0 );
      this.graphic.updateTexture({
         texture: this.mazeTexture,
         size: 32,
         data: this.gen.maze({
            size: 32,
            seed: this.mazeSeedValue
         })
      });
      this.graphic.draw();
      var P = new Uint8Array(4 * this.graphic.size.x * this.graphic.size.y);
      this.graphic.gl.readPixels(0, 0, this.graphic.size.x, this.graphic.size.y, this.graphic.gl.RGBA, this.graphic.gl.UNSIGNED_BYTE, P);
      this.addStartAndExit(P);
      this.graphic.gl.uniform1f(this.mazeAmbient, this.config.ambientLight );
      this.genNewMaze = false;
   } else {
      this.graphic.gl.useProgram(this.distanceShader);
      this.updatePlayer();
      this.updateGraphic(2);
      this.graphic.drawToFBO(this.distanceFBO, this.distanceShader);
      var wall = this.graphic.readFromFBO(this.distanceFBO);
      this.player.wall.distance = wall[0]/255;
      this.player.wall.dx = (wall[1]/255 - 0.5) * 2.0 ;
      this.player.wall.dy = (wall[2]/255 - 0.5) * 2.0 ;
      this.playerColision();

      this.graphic.gl.useProgram(this.mazeShader);
      this.updateGraphic(1);
      this.graphic.draw(this.mazeShader);

      this.checkEndConditions();
   }

   window.requestAnimationFrame(callback,this.canvas);
}

Game.prototype.updateGUI = function() {
   var time = (new Date()).getTime();

   var gameTimeInput = document.getElementById('gameTime');
   if (this.gameState == 'NEW') {
      gameTimeInput.value = (time - this.startTime)/1000;
   }

   var thisFrameTime = time;
   var frameTime = document.getElementById('Frame');
   frameTime.value = thisFrameTime - this.lastFrameTime;
   this.lastFrameTime = thisFrameTime;

}

Game.prototype.updatePlayer = function() {
   "use strict";

   this.playerColision();

   var x = 0;
   var y = 0;
   if (this.keyInput.up) {
      y += 1;
   }
   if (this.keyInput.down) {
      y -= 1;
   }
   if (this.keyInput.right) {
      x += 1;
   }
   if (this.keyInput.left) {
      x -= 1;
   }

   var len = Math.sqrt(x*x + y*y);

   if (len > 0) {
      this.player.v.x += (x/len) * 0.01;
      this.player.v.y += (y/len) * 0.01;
      var vLen = Math.sqrt(this.player.v.x * this.player.v.x + this.player.v.y * this.player.v.y);
      if ( vLen > 1) {
         this.player.v.x /= vLen;
         this.player.v.x /= vLen;
      }
   } else {
      this.player.v.x *= 0.9;
      this.player.v.y *= 0.9;
   }
   //TODO uwzględnić czas
   this.player.pos.x += this.player.v.x * 0.1;
   this.player.pos.y += this.player.v.y * 0.1;
}

Game.prototype.playerColision = function() {
   var wall = this.player.wall;
   if ( wall.distance < this.player.r ) {
      var offset = this.player.r - wall.distance + 0.01;
      this.player.pos.x += offset * wall.dx;
      this.player.pos.y += offset * wall.dy;
      var dot = this.player.v.x * wall.dx + this.player.v.y * wall.dy;
      if (dot < 0) {
         this.player.v.x -= wall.dx * dot * 1.9;
         this.player.v.y -= wall.dy * dot * 1.9;
      }
   }
}

Game.prototype.checkEndConditions = function() {
   var x = this.player.pos.x - this.exitPos.x;
   var y = this.player.pos.y - this.exitPos.y;
   if (x*x + y*y < 0.16) {
      this.changeGameState('WIN');
   }
}

Game.prototype.changeGameState = function(state) {
   this.gameState = state;
   var gameTimeInput = document.getElementById('gameTime');
   if (this.gameState == 'WIN') {
      gameTimeInput.style.color = 'green';
   } else {
      gameTimeInput.style.color = 'black';
   }
}

Game.prototype.updateGraphic = function(id) {
   "use strict";
   if (id == 1) {
      this.graphic.gl.uniform1f(this.mazeSeed, this.mazeSeedValue );
      this.graphic.gl.uniform2f(this.mazePlayerPos, this.player.pos.x, this.player.pos.y );
      this.graphic.gl.uniform2f(this.mazeExitPos, this.exitPos.x, this.exitPos.y );
      this.graphic.gl.activeTexture(this.graphic.gl.TEXTURE0);
      this.graphic.gl.bindTexture(this.graphic.gl.TEXTURE_2D, this.mazeTexture);
   } else {
      this.graphic.gl.uniform1f(this.distanceSeed, this.mazeSeedValue );
	   this.graphic.gl.uniform2f(this.distancePlayerPos, this.player.pos.x, this.player.pos.y );
      this.graphic.gl.activeTexture(this.graphic.gl.TEXTURE0);
      this.graphic.gl.bindTexture(this.graphic.gl.TEXTURE_2D, this.mazeTexture);
   }
}

Game.prototype.dijkstra = function(maze, start, end) {
   "use strict";
   var size = this.graphic.size;
   var P = new Int16Array(size.x * size.y);

   if (this.debug.noMazeValidation) {
      return true;
   }

   for (var i = 0; i< size.x * size.y; i++) {
      if (maze[i*4] == 0) {
         P[i] = -1;
      } else {
         P[i] = 8*1024;
      }
   }

   P[size.x*start.y + start.x] = 1;

   var A = [];
   var done = false;
   A.push(start);
   while (A.length && !done) {
      var v = A.shift();
      var value = P[size.x*v.y + v.x];
      [[0,1],[1,0],[0,-1],[-1,0]].forEach( function(dv) {
         var vn = {
            x: v.x + dv[0],
            y: v.y + dv[1]
         };
         if(vn.x >= size.x || vn.x < 0 || vn.y >= size.y || vn.y < 0) {
            return;
         }
         if (P[size.x*vn.y + vn.x] > value + 1) {
            P[size.x*vn.y + vn.x] = value + 1;
            A.push(vn);
         }
         if (vn.x == end.x && vn.y == end.y) {
            done = true;
         }
      });
   }
   var endValue = P[size.x*end.y + end.x];


   if (endValue == -1 || endValue == 8*1024) {
      return false;
   } else {
      if (this.debug.showSolution) {
         var jsCanvas = document.getElementById('gl_js');
         var ctx = jsCanvas.getContext('2d');
         for(var i = 0; i< this.graphic.size.x * this.graphic.size.y; i++) {
            var x = i%this.graphic.size.x;
            var y = this.graphic.size.y - Math.floor(i/this.graphic.size.x);
            var color = P[i]%256;
            ctx.fillStyle="rgb(" + color + ',' + color + ',' + color + ')';
            ctx.fillRect(x, y, 1, 1);
         }
         var v = end;
         ctx.fillStyle="rgb(255,0,0)";
         while (v.x != start.x || v.y != start.y) {
            ctx.fillRect(v.x, this.graphic.size.y - v.y, 1, 1);
            var minValue = 8*1024;
            var minID = 0;
            var vn;
            var vecArray = [[0,1],[1,0],[0,-1],[-1,0]];
            vecArray.forEach( function(dv) {
               var tvn = {
                  x: v.x + dv[0],
                  y: v.y + dv[1]
               };
               if(tvn.x >= size.x || tvn.x < 0 || tvn.y >= size.y || tvn.y < 0) {
                  return;
               }
               var val = P[size.x*tvn.y + tvn.x];
               if (val < minValue && val >= 0) {
                  minValue = val;
                  minID = i; 
                  vn = tvn;
               }
            });
            v = vn;
         }
      }
      return true;
   }
}

Game.prototype.addStartAndExit = function(maze) {
   "use strict";
   var size = this.graphic.size;
   var start = {};
   var end = {};
   var len = {};
   do {
      start.x = Math.floor(Math.random()*size.x);
      start.y = Math.floor(Math.random()*size.y);
      var i = 0;
      do {
         i++;
         end.x = Math.floor(Math.random()*size.x);
         end.y = Math.floor(Math.random()*size.y);
         len.x = start.x - end.x;
         len.y = start.y - end.y;
      } while (Math.sqrt(len.x*len.x + len.y*len.y) < 200)
   } while (!this.dijkstra(maze, start, end))

   var that = this;

   function convertPos(pos, imageSize){
      var x = pos.x;
      var y = pos.y;
      x /= imageSize.x;
      y /= imageSize.y;
      y *= (imageSize.y/imageSize.x);
      x *= that.config.tileCount;
      y *= that.config.tileCount;
      return {x: x, y: y};
   }
   console.log(this);

   this.player.pos = convertPos(start, this.graphic.size);
   this.exitPos = convertPos(end, this.graphic.size);
}
