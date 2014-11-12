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
}

Game.prototype.init = function() {
   this.graphic = new Graphic();
   this.graphic.init({canvas: 'gl'});

   var time = new Date();
   this.timeStart = time.getTime();

   
   this.mazeShader = this.graphic.loadProgramFile("./simple.vert","./maze.frag");
   this.mazeShaderSeed = this.graphic.gl.getUniformLocation(this.mazeShader, 'seed');
   this.graphic.gl.useProgram(this.mazeShader);

   this.draw();
}

Game.prototype.draw = function() {
   var that = this;
   var callback = function() {
      that.draw();
   };
   var time = (new Date()).getTime();
	this.graphic.gl.uniform1f(this.mazeShaderSeed, ((time/1000) & 0x3FF) );
   this.graphic.draw();
   window.requestAnimationFrame(callback,this.canvas);
}
