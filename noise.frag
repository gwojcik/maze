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
uniform float time;

void main() {
    gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0); // uv.y + 2.0);
    int endLoop = 0;
    for(float i = 0.0; i < 200.0; i++){
        //if(endLoop == 0 && sin(uv.x*123123.7 * sin(uv.y*234895.72323 * i+1.1)) > 0.98){
        if(i>10.0){
			break;
        }
        if(endLoop == 0 && cos((uv.x*231.0*(i+33.0) + uv.y*234895.72323) * (i+1.1)) > 0.98){
           gl_FragColor = vec4(0.0,0.0,0.0,1.0);
           gl_FragColor.b = float(i)/100.0;
           endLoop = 1;
           //break;
        }
    }
    gl_FragColor.x += 0.1;
}
