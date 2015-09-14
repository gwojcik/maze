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
varying highp float dist;

void main() {
   float x = length(uv);   
   float d = smoothstep(10.0, 15.0, dist);
   x = smoothstep(0.2 - 0.1*d, 0.4 - 0.2*d, x);
   gl_FragColor = vec4( 1.0 - d, 1.0 - d, d, x);
}
