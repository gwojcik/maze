function Game() {
}

Game.prototype.init = function() {
   this.graphic = new Graphic();
   this.graphic.init({canvas: 'gl'});

   var time = new Date();
   this.timeStart = time.getTime();

   
   this.GLSL_cube = this.graphic.loadProgramFile("./simple.vert","./noise.frag");
   this.graphic.gl.useProgram(this.GLSL_cube);

   this.draw();
}

Game.prototype.draw = function() {
   var that = this;
   var callback = function() {
      that.draw();
   };
   this.graphic.draw();
   window.requestAnimationFrame(callback,this.canvas);
}
