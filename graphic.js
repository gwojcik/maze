(function() {
var gl;

function Graphic() {
}

Graphic.prototype.init = function(hP) {
   this.canvas = document.getElementById(hP.canvas);
   this.size = {x: this.canvas.height, y: this.canvas.width};
   this.initWebGL();

   gl.clearColor(1.0, 0.0, 0.0, 1.0);
   gl.clear(gl.COLOR_BUFFER_BIT);
   gl.disable(gl.CULL_FACE );
   gl.disable(gl.DEPTH_TEST );
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);

   this.fsTriangle = this.CreateFullScreenTriangle();
}

Graphic.prototype.initWebGL = function() {
   gl = null;

   try {
      gl = this.canvas.getContext('webgl');
      if (! gl) {
         console.log('experimental webgl');
         gl = this.canvas.getContext('experimental-webgl');
      }
   } catch (e) {
   }

   if (!gl) {
      gl = null;
   }
   this.gl = gl;
}

Graphic.prototype.CreateFullScreenTriangle = function (){
   var R = {};
   var vertex = new Float32Array(
   [ -1, -1, 1,		3, -1, 1,		-1, 3, 1]);
   var uv = new Float32Array(
   [ 0, 0,		2,0,	0,2]);

   R.vertex = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, R.vertex);
   gl.bufferData(gl.ARRAY_BUFFER, vertex, gl.STATIC_DRAW);

   R.uv = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, R.uv);
   gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);

   return R;
}

Graphic.prototype.drawFullScreenTriangle = function() {
   gl.enableVertexAttribArray(0);
   gl.enableVertexAttribArray(1);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.fsTriangle.vertex);
   gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.fsTriangle.uv);
   gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
   gl.drawArrays(gl.TRIANGLES, 0, 3);
}

Graphic.prototype.draw = function() {
   gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   gl.activeTexture(gl.TEXTURE0);
   this.drawFullScreenTriangle(this.fsTriangle);
}

Graphic.prototype.loadProgramFile = function(vertexFile, fragmentFile, attribs) {
   var fragment = this.loadShaderFile(fragmentFile);
   var vertex = this.loadShaderFile(vertexFile);
   return this.loadProgram(vertex, fragment, attribs);
}

Graphic.prototype.loadProgram = function(vertex, fragment, attribs){
   if (attribs == null) {
      attribs = ["inVertex",'inUV']
   }
   var program = gl.createProgram();
   gl.attachShader(program,vertex);
   gl.attachShader(program,fragment);
   for (var i =0; i<attribs.length; ++i){
      gl.bindAttribLocation(program,i,attribs[i]);
   }
   gl.linkProgram(program);
   console.log(gl.getProgramInfoLog(program));
   var status = gl.getProgramParameter(program,gl.LINK_STATUS);
   if (!status && gl.isContextLost()){
      console.log("Error: program linking");
      gl.deleteProgram(program);
      gl.deleteShader(fragment);
      gl.deleteShader(vertex);
      return null;
   }
   gl.validateProgram(program);
   console.log(gl.getProgramInfoLog(program));
   var status = gl.getProgramParameter(program,gl.VALIDATE_STATUS);
   if (!status && gl.isContextLost()){
      console.log("Error: program linking");
      gl.deleteProgram(program);
      gl.deleteShader(fragment);
      gl.deleteShader(vertex);
      return null;
   }
   return program;
}

Graphic.prototype.loadShaderFile = function(file){
   var request = new XMLHttpRequest();
   request.open('POST', file, false);
   request.overrideMimeType("x-shader/x-fragment");
   request.send();
   if (request.status != 200){
      console.log("shader file " + file + " download error("+request.status+"): " + request.statusText);
   }
   var type;
   if (file.search(/\.vert$/)>0) { 
      type = gl.VERTEX_SHADER
   } else if(file.search(/\.frag$/)>0) { 
      type = gl.FRAGMENT_SHADER
   } else {
      console.log("unknown shader type: " + file);
   }

   return this.loadShader(request.responseText, type);
}

Graphic.prototype.loadShader = function(src, type){
   if (!src || src==""){
      console.log("no shader source");
      return null;
   }
   var shader = gl.createShader(type);
   gl.shaderSource(shader, src);
   gl.compileShader(shader);
   console.log(gl.getShaderInfoLog(shader));
   var status = gl.getShaderParameter(shader,gl.COMPILE_STATUS)
   if (!status && gl.isContextLost()){
      console.log("Error: shader compilation");
      gl.deleteShader(shader);
      return null;
   }
   return shader;
}

top.Graphic = Graphic;
})();
