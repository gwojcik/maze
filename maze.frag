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

float wallDistance(vec2 tile, vec2 p, float x) {
   float d;
   if ( x > 0.0) {
      d = abs(
         abs(
            abs(
               dot(
                  normalize(vec2(1.0, 1.0)),
                  p
               )
            ) - sqrt(2.0)/2.0
         ) - sqrt(2.0)/4.0
      );
   } else {
      d = abs(
         abs(
            dot(
               normalize(vec2(-1.0,1.0)),
               p
            )
         )- sqrt(2.0)/4.0
      );
   }
   return d;
}

float distanceInSquare(vec2 P) {
   vec2 d = abs( vec2(0.5) - P);
   return 0.5 - max(d.x, d.y);
}

float mazeDistance(vec2 pos) {
   float d = 128.0;
   float d2 = 128.0;

   vec2 tile = ceil(pos);
   vec2 p = fract(pos);
   float tileType = BBS4(tile.x*128.0 + tile.y + seed) > 0.0 ? 1.0 : 0.0;
   {
      d = wallDistance(tile, p, tileType);
      float dd = 128.0;
      if (abs(p.x - 0.5) + abs(p.y - 0.5) > 0.5) {
         if (tileType == 1.0) {
            if (p.y > 0.5 && p.x < 0.5) {
               vec2 t = tile + vec2(0.0, 1.0);
               float tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 0.0) {
                  dd = distance(p, vec2(0.5, 1.0));
               } else {
                  dd = -(dot(p, normalize(vec2(1,1))) - sqrt(2.0)*(3.0/4.0));
               }
               t = tile + vec2(-1.0, 0.0);
               tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 0.0) {
                  dd = min(dd, distance(p, vec2(0.0, 0.5)));
               } else {
                  dd = min(dd, dot(p, normalize(vec2(1,1))) - sqrt(2.0)*(1.0/4.0));
               }
               t = tile + vec2(-1.0, 1.0);
               tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 0.0) {
                  dd = min(dd, -(dot(p, normalize(vec2(-1,1))) + sqrt(2.0)/2.0 - sqrt(2.0)*(5.0/4.0)));
               }
            } else if (p.y < 0.5 && p.x > 0.5){
               vec2 t = tile + vec2(0.0, -1.0);
               float tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 0.0) {
                  dd = distance(p, vec2(0.5, 0.0));
               } else {
                  dd = dot(p, normalize(vec2(1,1))) - sqrt(2.0)*(1.0/4.0);
               }
               t = tile + vec2(1.0, 0.0);
               tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 0.0) {
                  dd = min(dd, distance(p, vec2(1.0, 0.5)));
               } else {
                  dd = min(dd, -(dot(p, normalize(vec2(1,1))) - sqrt(2.0)*(3.0/4.0)));
               }
               t = tile + vec2(1.0, -1.0);
               tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 0.0) {
                  dd = min(dd, dot(p, normalize(vec2(-1,1))) + sqrt(2.0)/2.0 + sqrt(2.0)*(1.0/4.0));
               }
            } else {
               dd = d;
            }
         } else {
            if (p.y > 0.5 && p.x > 0.5) {
               vec2 t = tile + vec2(0.0, 1.0);
               float tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 1.0) {
                  dd = distance(p, vec2(0.5, 1.0));
               } else {
                  dd = -(dot(p, normalize(vec2(-1,1))) + sqrt(2.0)/2.0 - sqrt(2.0)*(3.0/4.0));
               }
               t = tile + vec2(1.0, 0.0);
               tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 1.0) {
                  dd = min(dd, distance(p, vec2(1.0, 0.5)));
               } else {
                  dd = min(dd, dot(p, normalize(vec2(-1,1))) + sqrt(2.0)/2.0 - sqrt(2.0)*(1.0/4.0));
               }
               t = tile + vec2(1.0, 1.0);
               tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 1.0) {
                  dd = min(dd, -(dot(p, normalize(vec2(1,1))) - sqrt(2.0)*(5.0/4.0)));
               }
            } else if (p.y < 0.5 && p.x < 0.5){
               vec2 t = tile + vec2(0.0, -1.0);
               float tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 1.0) {
                  dd = distance(p, vec2(0.5, 0.0));
               } else {
                  dd = dot(p, normalize(vec2(-1,1))) + sqrt(2.0)/2.0 - sqrt(2.0)*(1.0/4.0);
               }
               t = tile + vec2(-1.0, 0.0);
               tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 1.0) {
                  dd = min(dd, distance(p, vec2(0.0, 0.5)));
               } else {
                  dd = min(dd, -(dot(p, normalize(vec2(-1,1))) + sqrt(2.0)/2.0 - sqrt(2.0)*(3.0/4.0)));
               }
               t = tile + vec2(-1.0, -1.0);
               tt = BBS4(t.x*128.0 + t.y + seed) > 0.0 ? 1.0 : 0.0;
               if (tt == 1.0) {
                  dd = min(dd, dot(p, normalize(vec2(1,1))) + sqrt(2.0)*(1.0/4.0));
               }
            } else {
               dd = d;
            }
         }
         d = dd;
      }
   }
   return d;
}

void main() {
   float aspect = (3.0/4.0);
   gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0);

   #ifdef GET_DISTANCE
      vec2 pos = ComplexMul(playerPos, normalize(vec2(10000.0,10001.0)));
      float d = mazeDistance(pos);
      float dx = mazeDistance(pos + vec2(0.01, 0.01)) - d;
      float dy = mazeDistance(pos + vec2(-0.01, 0.01)) - d;
      vec2 gradient = normalize(vec2(dx,dy));
      gl_FragColor.xyz = vec3(d-0.1, gradient*0.5 + vec2(0.5));
   #else
      vec2 pos = ((uv+vec2(1.0, 1.0))*vec2(1.0, aspect))*10.0;
      if ( distance(pos, playerPos) < 0.1) {
         gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0);
         return;
      }
      if ( distance(pos, exitPos) < 0.2) {
         gl_FragColor = vec4( 0.0, 0.0, 1.0, 1.0);
         return;
      }
      pos = ComplexMul(pos, normalize(vec2(10000.0,10001.0)));
      float d = mazeDistance(pos);
      float pd = mazeDistance(ComplexMul(playerPos, normalize(vec2(10000.0,10001.0))));
      gl_FragColor.xyz = vec3(smoothstep(0.1, 0.15, d));
   #endif
}
