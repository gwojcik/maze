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
uniform float ambient;

#define WALL_R 0.1
#define WALL_RO 0.11

float mazeDistance(vec2 pos) {
   vec2 tile = ceil(pos);
   /*  a
      ┏━┓
     d┃ ┃b
      ┗━┛
       c
   */
   bool a,b,c,d;

   bvec4 tileData = bvec4(texture2D(maze,tile/32.0));
   a = tileData.x;
   b = tileData.y;
   c = tileData.z;
   d = tileData.w;

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

   if (!a) {
      dist = min(dist, 1.0 - p.y);
   }
   if (!c) {
      dist = min(dist, p.y);
   }
   if (!b) {
      dist = min(dist, 1.0 - p.x);
   }
   if (!d) {
      dist = min(dist, p.x);
   }

   return dist;
}

float shadow(vec2 p, vec2 l) {
   vec2 tileP = ceil(p);
   vec2 tileL = ceil(l);
   vec2 tileV = normalize(tileP - tileL);

   bool light = false;

   vec2 newL = l;
   vec4 tileData = texture2D(maze,tileL/32.0) * 255.0;
   for(int i = 0; i < 3; i++) {
      if (!light) {
         vec2 v = normalize(p - l);
         float dist = distance(p, newL);

         float dd1;
         if (v.x > 0.0 ) {
            dd1 = tileData.y + tileL.x - newL.x - WALL_RO;
         } else {
            dd1 = -(tileData.w + newL.x - tileL.x + 1.0) + WALL_RO;
         }
         dd1 /= v.x;
         float dd1m;
         if (v.y > 0.0 ) {
            dd1m = -(newL.y - tileL.y) - WALL_RO;
         } else {
            dd1m = - 1.0 - (newL.y - tileL.y) + WALL_RO;
         }
         dd1m /= v.y;
         dd1 = min(dd1, dd1m);

         float dd2;
         if (v.y > 0.0 ) {
            dd2 = tileData.x + tileL.y - newL.y - WALL_RO;
         } else {
            dd2 = -(tileData.z + newL.y - tileL.y + 1.0) + WALL_RO;
         }
         dd2 /= v.y;
         float dd2m;
         if (v.x > 0.0 ) {
            dd2m = -(newL.x - tileL.x) - WALL_RO;
         } else {
            dd2m = - 1.0 - (newL.x - tileL.x) + WALL_RO;
         }
         dd2m /= v.x;
         dd2 = min(dd2, dd2m);

         float dd = max(dd1,dd2);

         if ( dd >= dist) {
            light = true;
            break;
         }
         newL += v * dd;
         tileL = ceil(newL);
         tileData = texture2D(maze,tileL/32.0) * 255.0;
      }
   }

   if (light) {
      float d = distance(p, l);
      return 2.0/(d*d);
   }
   
   return 0.0;
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
      gl_FragColor.xyz = vec3(d - WALL_R, gradient*0.5 + vec2(0.5));
   #else
      if ( distance(pos, playerPos) < 0.2) {
         gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0);
         return;
      }
      if ( distance(pos, exitPos) < 0.4) {
         gl_FragColor = vec4( 0.0, 0.0, 1.0, 1.0);
         return;
      }
      float shadow = shadow(pos, playerPos) + ambient;
      gl_FragColor.xyz = vec3(smoothstep(WALL_R, WALL_R + 0.05, mazeDistance(pos))) * shadow;
   #endif
}
