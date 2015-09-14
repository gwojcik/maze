/* This file is part of Maze.
 * Copyright (C) 2015 Grzegorz Wójcik
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

attribute vec3 inVertex;
attribute vec2 inUV;

varying vec2 uv;
varying float dist;

uniform float aspect;
uniform vec2 exitPos;
uniform vec2 cameraOffset;
void main(){
   vec2 v = inVertex.xy;
   vec2 vOffset = exitPos - cameraOffset;
   dist = length(vOffset);
   if (dist > 10.0) {
      vOffset /= dist;
      vOffset *= 10.0;
   }
   v += vOffset;
   v *= (1.0/16.0);
   v.y /= aspect;
   gl_Position = vec4(v, 0, 1);

   uv = inUV * 2.0 - 1.0;
}
