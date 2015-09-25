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
   this.frameTime = time.getTime();
   this.frameDelta = 0.0;
   this.changeGameState('NEW');

   this.debug = {
   };
   this.config = {
      tileCount:    2 * 16,
      ambientLight: 0.0,
      logicFPS:     60,
      mazeSize:     64,
      maxLightCount: 4
   };

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
   };
   this.camera = {
      pos: {
         x: 0.0,
         y: 0.0
      }
   };
   this.maze = {
      lights: []
   };
   this.mazeSeedValue = 0;
   this.keyInput = {};
   
   this.mazeShader = this.graphic.loadProgramFile("./simple.vert","./maze.frag", {
      define: {
         MAZE_SIZE: this.config.mazeSize.toString() + '.0'
      }
   });
   this.mazeUni = this.graphic.getUniformsWrapper(this.mazeShader);

   this.mazeTexture = this.graphic.createTexture({
      size: this.config.mazeSize,
      data: null
   });
   this.graphic.gl.useProgram(this.mazeShader);
   this.mazeUni.maze = [0];
   this.mazeUni.shadowTex = [1];
   this.mazeUni.lightCount = [1];
   this.mazeUni.aspect = [3.0/4.0];

   this.distanceShader = this.graphic.loadProgramFile("./simple.vert","./maze.frag", {
      define: {
         GET_DISTANCE: 1,
         MAZE_SIZE: this.config.mazeSize.toString() + '.0'
      }
   });
   this.distanceFBO = this.graphic.createFBO({size: {x: 1, y: 1} });
   this.distanceUni = this.graphic.getUniformsWrapper(this.distanceShader);
   this.graphic.gl.useProgram(this.distanceShader);
   this.distanceUni.aspect = [3.0/4.0];

   this.exitShader = this.graphic.loadProgramFile("./exit.vert", "./exit.frag");
   this.exitUni = this.graphic.getUniformsWrapper(this.exitShader);
   this.graphic.gl.useProgram(this.exitShader);
   this.exitUni.aspect = [3.0/4.0];

   this.graphic.gl.useProgram(this.mazeShader);

   this.shadowFBO = this.graphic.createFBO({size: {x: 1024, y: 4}});
   this.shadowShader = this.graphic.loadProgramFile("./shadow.vert", "./shadow.frag", {
      define: {
         MAZE_SIZE: this.config.mazeSize.toString() + '.0'
      }
   });
   this.shadowUni = this.graphic.getUniformsWrapper(this.shadowShader);
   this.graphic.gl.useProgram(this.shadowShader);
   this.shadowUni.lightR = [100];
   this.shadowUni.maze = [0];

   this.genNewMaze = true;

   this.draw();
};

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
   } else if (key == 0x20) { //ArrowRight || A
      this.keyInput.newLight = false;
   }
};

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
   } else if (key == 0x20) { //Space
      this.keyInput.newLight = true;
   }
};

Game.prototype.draw = function() {
   "use strict";
   var that = this;
   var callback = function() {
      that.draw();
   };

   this.updateGUI();


   if (this.genNewMaze) {
      this.createNewMaze();
   } else {
      this.graphic.gl.useProgram(this.distanceShader);
      this.updatePlayer();
      if (this.keyInput.newLight) {
         this.keyInput.newLight = false;
         this.addLight(this.player.pos.x, this.player.pos.y);
      }

      this.graphic.gl.useProgram(this.shadowShader);
      var lights = this.getLights();
      this.shadowUni.light = lights;
      this.graphic.drawToFBO(this.shadowFBO, this.distanceShader);

      this.graphic.gl.useProgram(this.mazeShader);
      this.updateGraphic(1);

      this.graphic.gl.viewport(0, 0, this.graphic.size.x, this.graphic.size.y);
      this.graphic.gl.bindFramebuffer(this.graphic.gl.FRAMEBUFFER, null);
      this.graphic.drawFullScreenTriangle();

      this.graphic.gl.enable(this.graphic.gl.BLEND);
      this.graphic.gl.blendFuncSeparate(this.graphic.gl.ONE_MINUS_SRC_ALPHA, this.graphic.gl.SRC_ALPHA,
         this.graphic.gl.ONE, this.graphic.gl.ONE);
      this.graphic.gl.useProgram(this.exitShader);
      this.exitUni.exitPos = [this.exitPos.x, this.exitPos.y];
      this.exitUni.cameraOffset = [this.camera.pos.x, this.camera.pos.y];
      this.graphic.drawFullScreenTriangle();
      this.graphic.gl.disable(this.graphic.gl.BLEND);

      this.checkEndConditions();
   }

   window.requestAnimationFrame(callback,this.canvas);
};

Game.prototype.updateGUI = function() {
   var time = (new Date()).getTime();

   var gameTimeInput = document.getElementById('gameTime');
   if (this.gameState == 'NEW') {
      gameTimeInput.value = (time - this.startTime)/1000;
   }
   document.getElementById('Frame').value = this.frameDelta;
};

Game.prototype.updatePlayer = function() {
   "use strict";

   var time = (new Date()).getTime();

   var thisFrameTime = time;
   var lastFrameTime = this.frameTime;
   var delta = thisFrameTime - lastFrameTime;
   this.frameDelta = delta;
   var steps = this.config.logicFPS;
   var N = Math.floor((delta/1000)*steps);
   this.frameTime += N*(1000/steps);

   var stepRcp = 1/steps;
   var a = 2;
   var maxV = 5;

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

   var cameraOffset = {x: 0.0, y: 0.0};
   for(var i = 0; i < N; i++) {
      this.playerColision();

      cameraOffset.x = this.player.pos.x - this.camera.pos.x;
      cameraOffset.y = this.player.pos.y - this.camera.pos.y;

      this.camera.pos.x += cameraOffset.x * stepRcp * 0.5;
      this.camera.pos.y += cameraOffset.y * stepRcp * 0.5;

      if (len > 0) {
         this.player.v.x += a*(x/len)*stepRcp;
         this.player.v.y += a*(y/len)*stepRcp;
         var vLen = Math.sqrt(this.player.v.x * this.player.v.x + this.player.v.y * this.player.v.y);
         if ( vLen > maxV) {
            this.player.v.x /= vLen/maxV;
            this.player.v.y /= vLen/maxV;
         }
      } else {
         this.player.v.x -= this.player.v.x * 0.9 * stepRcp;
         this.player.v.y -= this.player.v.y * 0.9 * stepRcp;
      }

      this.player.pos.x += this.player.v.x*stepRcp;
      this.player.pos.y += this.player.v.y*stepRcp;
   }
};

Game.prototype.playerColision = function() {
   this.updateGraphic(2);
   this.graphic.drawToFBO(this.distanceFBO, this.distanceShader);
   var wallRaw = this.graphic.readFromFBO(this.distanceFBO);
   var wall = {};
   wall.distance = wallRaw[0]/255;
   wall.dx = (wallRaw[1]/255 - 0.5) * 2.0 ;
   wall.dy = (wallRaw[2]/255 - 0.5) * 2.0 ;
   if ( wall.distance < this.player.r ) {
      var offset = this.player.r - wall.distance + 0.01;
      this.player.pos.x += offset * wall.dx;
      this.player.pos.y += offset * wall.dy;
      var dot = this.player.v.x * wall.dx + this.player.v.y * wall.dy; if (dot < 0) {
         this.player.v.x -= wall.dx * dot * 1.9;
         this.player.v.y -= wall.dy * dot * 1.9;
      }
   }
};

Game.prototype.checkEndConditions = function() {
   var x = this.player.pos.x - this.exitPos.x;
   var y = this.player.pos.y - this.exitPos.y;
   if (x*x + y*y < 0.16) {
      this.changeGameState('WIN');
   }
};

Game.prototype.changeGameState = function(state) {
   this.gameState = state;
   var gameTimeInput = document.getElementById('gameTime');
   if (this.gameState == 'WIN') {
      gameTimeInput.style.color = 'green';
   } else {
      gameTimeInput.style.color = 'black';
   }
};

Game.prototype.getLights = function() {
   var lights = [this.player.pos.x, this.player.pos.y];
   lights.push.apply(lights, this.maze.lights);
   return lights;
};

Game.prototype.updateGraphic = function(id) {
   "use strict";
   if (id == 1) {
      var lights = this.getLights();

      this.mazeUni.playerPos = [this.player.pos.x, this.player.pos.y];
      this.mazeUni.exitPos = [this.exitPos.x, this.exitPos.y];
      this.mazeUni.ambient = [this.config.ambientLight];
      this.mazeUni.cameraOffset = [this.camera.pos.x - 16.0, this.camera.pos.y - 16 * (3.0/4.0)];

      this.mazeUni.lightCount = [lights.length/2];
      this.mazeUni.lightPos =  lights;

      this.graphic.gl.activeTexture(this.graphic.gl.TEXTURE0);
      this.graphic.gl.bindTexture(this.graphic.gl.TEXTURE_2D, this.mazeTexture);
      this.graphic.gl.activeTexture(this.graphic.gl.TEXTURE1);
      this.graphic.gl.bindTexture(this.graphic.gl.TEXTURE_2D, this.shadowFBO.texture);
   } else {
      this.distanceUni.playerPos = [this.player.pos.x, this.player.pos.y];

      this.graphic.gl.activeTexture(this.graphic.gl.TEXTURE0);
      this.graphic.gl.bindTexture(this.graphic.gl.TEXTURE_2D, this.mazeTexture);
   }
};

Game.prototype.addStartAndExit = function(hP) {
   var size = hP.size;
   var start = {};
   var end = {};
   var len = {};
   function isSameRegion(s, e) {
      return hP.data[s.x + s.y * hP.size] == hP.data[e.x + e.y * hP.size];
   }
   var i = 0;
   do {
      start.x = Math.floor(Math.random()*size);
      start.y = Math.floor(Math.random()*size);
      i++;
      if ( i > 100) {
         return false;
      }
      do {
         end.x = Math.floor(Math.random()*size);
         end.y = Math.floor(Math.random()*size);
         len.x = start.x - end.x;
         len.y = start.y - end.y;
      } while (Math.sqrt(len.x*len.x + len.y*len.y) < size/2)
   } while (!isSameRegion(start, end));

   function convertPos(p) {
      return {
         x: p.x - 0.5,
         y: p.y - 0.5
      };
   }

   this.player.pos = convertPos(start);
   this.exitPos = convertPos(end);
   return true;
};

Game.prototype.createNewMaze = function() {
   var time = (new Date()).getTime();
   this.mazeSeedValue = (time & 0x3FF);
   this.startTime = time;
   this.changeGameState('NEW');
   this.player.pos = {x: 0, y:0};
   this.exitPos = {x: 0, y:0};
   this.camera.pos = { x: 0, y: 0 };

   var mazeData = this.gen.maze({
      size: this.config.mazeSize,
      seed: this.mazeSeedValue
   });

   var regions = this.gen.connectedMazeRegions(mazeData, {size: this.config.mazeSize});

   this.graphic.updateTexture({
      texture: this.mazeTexture,
      size: this.config.mazeSize,
      data: mazeData
   });

   var success = this.addStartAndExit({
      data: regions,
      size: this.config.mazeSize
   });
   this.camera.pos = {
      x: this.player.pos.x,
      y: this.player.pos.y
   };
   this.genNewMaze = ! success;
};

Game.prototype.addLight = function(x, y) {
   if ( this.maze.lights.length >= (this.config.maxLightCount-1)*2 ) {
      this.maze.lights.shift();
      this.maze.lights.shift();
   }
   this.maze.lights.push(x, y);
};
