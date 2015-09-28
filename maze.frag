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

varying highp vec2 uv;

uniform vec2 playerPos;
uniform vec2 exitPos;
uniform vec2 cameraOffset;
uniform sampler2D maze;
uniform sampler2D shadowTex;
uniform sampler2D regions;
uniform float ambient;
uniform vec2 lightPos[4];
uniform int lightCount;

float shadow(vec2 p, vec2 l) {
   vec2 tileP = ceil(p);
   vec2 tileL = ceil(l);
   vec2 tileV = normalize(tileP - tileL);

   bool light = false;

   vec2 newL = l;
   vec4 tileData = texture2D(maze,tileL/MAZE_SIZE) * 255.0;
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

         if ( dd >= dist) {
            light = true;
            break;
         }
         newL += v * dd;
         tileL = ceil(newL);
         tileData = texture2D(maze,tileL/MAZE_SIZE) * 255.0;
      }
   }

   if (light) {
      float d = distance(p, l);
      return 2.0/(d*d);
   }
   
   return 0.0;
}

vec2 rot90(vec2 V) {
   return vec2(-V.y, V.x);
}

float shadowMapShadow(vec2 p, vec2 l, float lightId) {
   vec2 lightDir = p - l;
   float lightDistance = length(lightDir);
   float shadowTexCoord = atan(lightDir.x, lightDir.y)/M_PI/2.0 + 0.5;
   vec2 shadowRaw = texture2D(shadowTex, vec2(shadowTexCoord, lightId/4.0)).rg;
   float shadowDistance = shadowRaw.r + shadowRaw.g*255.0;
   return smoothstep( 0.0, 0.2, shadowDistance - lightDistance);
}

float indirect(vec2 p, vec2 l, float lightId) {
   vec2 lightDir = p - l;
   float lightDistance = length(lightDir);
   vec2 nLightDir = normalize(lightDir);
   vec2 v = rot90(nLightDir);

   float value = 0.0;

   for ( float i = -1.0; i < 1.0; i += 0.1) {
      vec2 dir = (p + v * i) - l;
      float shadowTexCoord = atan(dir.x, dir.y)/M_PI/2.0 + 0.5;
      vec2 shadowRaw = texture2D(shadowTex, vec2(shadowTexCoord, lightId/4.0)).rg;
      float shadowDistance = shadowRaw.r + shadowRaw.g*255.0;
      if ( abs( lightDistance - shadowDistance) < 1.0) {
         vec2 nDir = normalize(dir);
         vec2 samplePos = nDir*shadowDistance + l;
         float d = mazeDistance(samplePos, maze);
         float dx = mazeDistance(samplePos + vec2(0.01, 0.00), maze) - d;
         float dy = mazeDistance(samplePos + vec2(0.00, 0.01), maze) - d;
         vec2 gradient = vec2(dx,dy);
         float v = dot( normalize(samplePos - p), -normalize(gradient));
         if ( v > 0.0) {
            value += max (0.0, 1.0 - distance(p, samplePos)) * v;
         }
      }
   }
   
   return value * 0.2;
}

void main() {
   float aspect = (3.0/4.0);
   gl_FragColor.w = 1.0;

   vec2 pos = uv;

   #ifdef GET_DISTANCE
      pos = playerPos;
      float d = mazeDistance(pos, maze);
      float dx = mazeDistance(pos + vec2(0.01, 0.00), maze) - d;
      float dy = mazeDistance(pos + vec2(0.00, 0.01), maze) - d;
      vec2 gradient = normalize(vec2(dx,dy));
      gl_FragColor.xyz = vec3(d - WALL_R, gradient*0.5 + vec2(0.5));
   #else
      pos += cameraOffset;
      if ( distance(pos, playerPos) < 0.2) {
         gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0);
         return;
      }
      float shadowValue = ambient;
      float regionP = dot(texture2D(regions,ceil(pos)/MAZE_SIZE).rg, vec2(1.0, 256.0));
      for (int i = 0; i < 4; i++) {
         if (i < lightCount) {
            vec2 l = lightPos[i];
            float regionL = dot(texture2D(regions,ceil(l)/MAZE_SIZE).rg, vec2(1.0, 256.0));
            if (regionL == regionP) {
               shadowValue += (
                  shadowMapShadow(pos, lightPos[i], float(i)) + 
                  indirect(pos, lightPos[i], float(i))
               ) * (2.0/( dot(pos-l, pos-l)));
            }
         }
      }
      gl_FragColor.xyz = vec3(smoothstep(WALL_R, WALL_R + 0.05, mazeDistance(pos, maze)) * shadowValue);
      //gl_FragColor.xy = vec2(sin(regionP * 10.0), sin(regionP * 124.0 + 4.0));
      //gl_FragColor.xyz *= smoothstep(WALL_R, WALL_R + 0.05, mazeDistance(pos));

      //gl_FragColor.xyz = vec3(smoothstep(WALL_R, WALL_R + 0.05, mazeDistance(pos))) * shadowValue;
      //gl_FragColor.xyz = vec3(shadowValue);
      //gl_FragColor.x = texture2D(shadowTex, vec2(uv*(1.0/16.0))).r;
      //vec2 tile = ceil((pos+vec2(1.0, 1.0))/MAZE_SIZE);
      //gl_FragColor.r *= (mod(tile.x, 2.0) < 1.0 ^^ mod(tile.y, 2.0) < 1.0)  ? 1.0 : 0.0;
   #endif
}
