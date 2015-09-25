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

precision highp float;
varying highp vec2 uv;
uniform float lightR;
uniform vec2 light[4];
uniform sampler2D maze;

#define WALL_R 0.1
#define WALL_RO 0.11
#define M_PI 3.14

float shadow(vec2 p, vec2 l) {
   vec2 tileP = ceil(p);
   vec2 tileL = ceil(l);
   vec2 tileV = normalize(tileP - tileL);

   vec2 newL = l;
   vec4 tileData = texture2D(maze,tileL/MAZE_SIZE) * 255.0;
   vec2 v = normalize(p - l);

   for(int i = 0; i < 3; i++) {
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

      float dd;
      vec2 lInTile = abs(vec2(1.0) - vec2(0.5) - (tileL - newL));
      if ( max(lInTile.x, lInTile.y) < 0.35) {
         dd = max(dd1,dd2);
      } else {
         if (lInTile.x > lInTile.y) {
            dd = dd1;
         } else {
            dd = dd2;
         }
      }

      newL += v * dd;
      tileL = ceil(newL);
      tileData = texture2D(maze,tileL/MAZE_SIZE) * 255.0;
   }

   return distance(l, newL);
}

void main() {
   float angle = uv.x;

   vec2 lightPos;

   int i = int(uv.y*4.0);
   if (i == 0) {
      lightPos = light[0];
   } else if (i == 1) {
      lightPos = light[1];
   } else if (i == 2) {
      lightPos = light[2];
   } else {
      lightPos = light[3];
   }

   vec2 target = lightPos + vec2( sin( angle ), cos( angle )) * 100.0;

   float dist = shadow(target, lightPos);
   vec4 codedDist;
   codedDist.r = fract(dist);
   dist -= codedDist.r;
   dist /= 255.0;
   codedDist.g = fract(dist);
   gl_FragColor.xyzw = vec4(codedDist);
}

