/* This file is part of Maze.
 * Copyright (C) 2014 Grzegorz Wójcik
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

precision highp float;
varying highp vec2 uv;
uniform float seed;
uniform vec2 playerPos;
uniform vec2 exitPos;

float BBS1(float x) {
   return mod((x * x), 16807.0) * (2.0/16807.0) - 1.0;
}

float BBS2(float x) {
   x = mod((x * x), 16807.0);
   return mod((x * x), 16807.0) * (2.0/16807.0) - 1.0;
}

float BBS4(float x) {
   x = mod((x * x), 16807.0);
   x = mod((x * x), 16807.0);
   x = mod((x * x), 16807.0);
   return mod((x * x), 16807.0) * (2.0/16807.0) - 1.0;
}

vec2 ComplexMul(in vec2 A, in vec2 B)
{
	return vec2(A.x*B.x - A.y*B.y,		A.y*B.x + A.x*B.y);
}

void main() {
   float aspect = (3.0/4.0);
   gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0);
   vec2 pos = ((uv+vec2(1.0, 1.0))*vec2(1.0, aspect))*20.0;
   if ( distance(pos, playerPos) < 0.2) {
      gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0);
      return;
   }
   if ( distance(pos, exitPos) < 0.5) {
      gl_FragColor = vec4( 0.0, 0.0, 1.0, 1.0);
      return;
   }
   pos = ComplexMul(normalize(vec2(1.0, 1.0)), pos);
   vec2 tile = ceil(pos);
   vec2 p = fract(pos);
   float x = BBS4(tile.x*128.0 + tile.y + BBS2(seed));
   float d;
   if ( x > 0.0) {
      d = abs(abs(dot(normalize(vec2(1,1)), p)) - sqrt(2.0)/2.0);
   } else {
      d = abs(dot(normalize(vec2(-1,1)), p));
   }
   if ( d > 0.2 && d < (sqrt(2.0)/2.0 - 0.2)) {
      gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0);
   }
}
