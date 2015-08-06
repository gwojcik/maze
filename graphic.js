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

(function() {
"use strict";
var gl;

function Graphic() {
}

Graphic.prototype.init = function(hP) {
   this.canvas = document.getElementById(hP.canvas);
   this.size = {x: this.canvas.width, y: this.canvas.height};
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
      gl = this.canvas.getContext('webgl', {preserveDrawingBuffer: true});
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
   gl.viewport(0, 0, this.size.x, this.size.y);
   gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   this.drawFullScreenTriangle(this.fsTriangle);
}

Graphic.prototype.loadProgramFile = function(vertexFile, fragmentFile, params) {
   params = params || {};
   var fragment = this.loadShaderFile(fragmentFile, params.define);
   var vertex = this.loadShaderFile(vertexFile, params.define);
   return this.loadProgram(vertex, fragment, params.attribs);
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

Graphic.prototype.loadShaderFile = function(file, define){
   var request = new XMLHttpRequest();
   request.open('GET', file, false);
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

   var defineStr = this.createDefineString(define);

   var shaderStr = defineStr + request.responseText;

   return this.loadShader(shaderStr, type);
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

Graphic.prototype.createDefineString = function(define) {
   define = define || {};
   var str = '';
   Object.keys(define).forEach( function(key) {
      str += '#define '+key+' '+define[key]+'\n';
   });
   return str;
}

Graphic.prototype.createFBO = function(params) {
   var fbo = gl.createFramebuffer();
   gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
   var texture = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, texture);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, params.size.x, params.size.y, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
   return {
      fbo: fbo,
      texture: texture,
      size: params.size
   };
}

Graphic.prototype.drawToFBO = function(fbo) {
   gl.viewport(0, 0, fbo.size.x, fbo.size.y);
   gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
   this.drawFullScreenTriangle(this.fsTriangle);
}

Graphic.prototype.readFromFBO = function(fbo) {
   var pixels = new Uint8Array(fbo.size.x * fbo.size.y * 4);
   gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
   gl.readPixels(0, 0, fbo.size.x, fbo.size.y, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
   return pixels;
}

Graphic.prototype.createTexture = function(params) {
   var texture = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, texture);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, params.size, params.size, 0, gl.RGBA, gl.UNSIGNED_BYTE, params.data);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
   return texture;
}

Graphic.prototype.updateTexture = function(params) {
   gl.bindTexture(gl.TEXTURE_2D, params.texture);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, params.size, params.size, 0, gl.RGBA, gl.UNSIGNED_BYTE, params.data);
}

top.Graphic = Graphic;
})();
