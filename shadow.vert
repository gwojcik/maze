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
uniform float aspect;

#define M_PI 3.14

varying vec2 uv;
void main(){
   gl_Position = vec4(inVertex.xy, 0, 1);

   uv = vec2( 
      (inUV.x * 2.0 - 1.0) * M_PI,
      inUV.y
   );
}
