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
uniform sampler2D maze;

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

float mazeDistance(vec2 pos) {
   vec2 tile = ceil(pos);
   /*  a
      ┏━┓
     d┃ ┃b
      ┗━┛
       c
   */
   bool a,b,c,d;

   bvec4 abcd = bvec4(texture2D(maze,tile/32.0));
   a = abcd.x;
   b = abcd.y;
   c = abcd.z;
   d = abcd.w;

   float dist;
   vec2 p = fract(pos);

   dist = dot(p,p);
   vec2 x = p - vec2(1.0, 1.0);
   dist = min(dist,dot(x,x));
   x = p - vec2(0.0, 1.0);
   dist = min(dist,dot(x,x));
   x = p - vec2(1.0, 0.0);
   dist = min(dist,dot(x,x));
   dist = sqrt(dist);

   if (a) {
      dist = min(dist, 1.0 - p.y);
   }
   if (c) {
      dist = min(dist, p.y);
   }
   if (b) {
      dist = min(dist, 1.0 - p.x);
   }
   if (d) {
      dist = min(dist, p.x);
   }


   return dist;
}

void main() {
   float aspect = (3.0/4.0);
   gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0);

   vec2 pos = ((uv+vec2(1.0, 1.0))*vec2(1.0, aspect))*16.0;

   #ifdef GET_DISTANCE
      pos = playerPos;
      float d = mazeDistance(pos);
      float dx = mazeDistance(pos + vec2(0.01, 0.00)) - d;
      float dy = mazeDistance(pos + vec2(0.00, 0.01)) - d;
      vec2 gradient = normalize(vec2(dx,dy));
      gl_FragColor.xyz = vec3(d-0.1, gradient*0.5 + vec2(0.5));
   #else
      if ( distance(pos, playerPos) < 0.2) {
         gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0);
         return;
      }
      if ( distance(pos, exitPos) < 0.4) {
         gl_FragColor = vec4( 0.0, 0.0, 1.0, 1.0);
         return;
      }
      gl_FragColor.xyz = vec3(smoothstep(0.1, 0.15, mazeDistance(pos)));
   #endif
}
