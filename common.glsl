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

#define WALL_R 0.1
#define WALL_RO 0.11
#define M_PI 3.14

#ifdef MAZE_SIZE
float mazeDistance(vec2 pos, sampler2D maze) {
   vec2 tile = ceil(pos);
   /*  a
      ┏━┓
     d┃ ┃b
      ┗━┛
       c
   */
   bool a,b,c,d;

   bvec4 tileData = bvec4(texture2D(maze,tile/MAZE_SIZE));
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
#endif
