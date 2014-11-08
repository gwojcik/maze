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
