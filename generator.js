/*
@licstart  The following is the entire license notice for the
JavaScript code in this page.

Copyright (C) 2015  Grzegorz Wójcik

The JavaScript code in this page is free software: you can
redistribute it and/or modify it under the terms of the GNU
General Public License (GNU GPL) as published by the Free Software
Foundation, either version 3 of the License, or (at your option)
any later version.  The code is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

As additional permission under GNU GPL version 3 section 7, you
may distribute non-source (e.g., minimized or compacted) forms of
that code without the copy of the GNU GPL normally required by
section 4, provided you include this license notice and a URL
through which recipients can access the Corresponding Source.


@licend  The above is the entire license notice
for the JavaScript code in this page.
*/

function Gen() {
   "use strict";
}

Gen.prototype.BBS8 = function(x) {
   x = x * x % 16807;
   x = x * x % 16807;
   x = x * x % 16807;
   x = x * x % 16807;
   x = x * x % 16807;
   x = x * x % 16807;
   x = x * x % 16807;
   return x * x % 16807 * (2.0/16807) - 1.0;
}

Gen.prototype.maze = function(params) {
   console.log(params);
   var size = params.size * params.size * 4;
   var data = new Uint8Array(size);
   var i = 0;
   /*  0
      ┏━┓
     3┃ ┃1
      ┗━┛
       2
   */
   for (var y = 0; y < params.size; y++) {
      for (var x = 0; x < params.size; x++) {
         if ((x ^ y) & 1) {
            //tileType: | 1; – 0
            var tileType = this.BBS8(y*128 + x + params.seed) > 0.0 ? 1 : 0;
            data[i + 0] = 1 ^ tileType;
            data[i + 1] = 0 ^ tileType;
            data[i + 2] = 1 ^ tileType;
            data[i + 3] = 0 ^ tileType;
         } else {
            var tx = (x + 1) % params.size;
            var ty = (y + 1) % params.size;
            data[i + 0] = this.BBS8(ty*128 + x  + params.seed) > 0.0 ? 0 : 1;
            data[i + 1] = this.BBS8( y*128 + tx + params.seed) > 0.0 ? 1 : 0;
            tx = (params.size + x - 1) % params.size;
            ty = (params.size + y - 1) % params.size;
            data[i + 2] = this.BBS8(ty*128 + x  + params.seed) > 0.0 ? 0 : 1;
            data[i + 3] = this.BBS8( y*128 + tx + params.seed) > 0.0 ? 1 : 0;
         }
         i += 4;
      }
   }
   return data;
}
