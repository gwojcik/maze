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

Gen.prototype.getCalcPosFun = function(size, N) {
   return function(x,y) {
      return (
         ((size + y) % size) * size +
         (size + x) % size
      ) * N;
   };
}

Gen.prototype.maze = function(params) {
   var size = params.size * params.size * 4;
   var data = new Uint8Array(size);
   var i = 0;
   /*  2
      ┏━┓
     3┃ ┃1
      ┗━┛
       0
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

   var calcPos = this.getCalcPosFun(params.size, 4);
   for (i = 0; i < params.size; i++) {
      for (var j = 0; j < 4; j++) {
         pos = calcPos(i,0);
         data[pos + j] = 0;
         pos = calcPos(0,i);
         data[pos + j] = 0;
      }
   }

   var structureData = this.mazeStructure(data, params);
   return structureData;
}

Gen.prototype.connectedMazeRegions = function(data, params) {
   var dataSize = params.size * params.size;
   var newData = new Uint32Array(dataSize);
   var calcPos4 = this.getCalcPosFun(params.size, 4);
   var calcPos1 = this.getCalcPosFun(params.size, 1);

   var linked = [];
   var label = 0;
   linked[1] = new Set();
   linked[1].add(label);

   var pos;
   for (var y = 0; y < params.size; y++) {
      for (var x = 0; x < params.size; x++) {
         var neighbors = [];
         pos = calcPos4(x,y);
         if (data[pos + 2] > 0) {
            var tmp = newData[calcPos1(x, y - 1)];
            if (tmp > 0) {
               neighbors.push(tmp);
            }
         }
         if (data[pos + 3] > 0) {
            tmp = newData[calcPos1(x - 1, y)];
            if (tmp > 0) {
               neighbors.push(tmp);
            }
         }
         if (neighbors.length === 0) {
            pos = calcPos1(x,y);
            label ++;
            newData[pos] = label;
            linked[label] = new Set();
            linked[label].add(label);
         } else {
            var min = Infinity;
            if ( neighbors.length > 1 ) {
               var max = -Infinity;
               neighbors.forEach(function(i) {
                  min = (i < min) ? i : min;
                  max = (i > max) ? i : max;
               });
               linked[max].forEach(function(i) {
                  linked[min].add(i);
               });
               linked[min].forEach(function(i) {
                  linked[i] = linked[min];
               });
            } else {
               min = neighbors[0];
            }
            pos = calcPos1(x,y);
            newData[pos] = min;
         }
      }
   }

   var processedLinks = [];

   linked.forEach(function(i, keyI) {
      var min = Infinity;
      var count = 0;
      var allLabels = new Set();
      i.forEach(function(j) {
         allLabels.add(j);
      });
      while(count < allLabels.length) {
         count = allLabels.length;
         allLabels.forEach(function(j) {
            linked.forEach(function(k) {
               if (k.has(j)) {
                  k.forEach(function(l) {
                     allLabels.add(l);
                  });
               }
            });
         });
      }

      allLabels.forEach(function(j) {
         min = j < min ? j : min;
      });

      processedLinks[keyI] = min;
   });

   //var linkedObj = {};
   //linked.forEach(function(i, key) {
   //   var min = Infinity;
   //   linkedObj[key] = linkedObj[key] || new Set();
   //   i.forEach(function(i) {
   //      linkedObj[key].add(i);
   //      linkedObj[i] = linkedObj[i] || new Set();
   //      linkedObj[i].add(key);
   //   });
   //});

   //Object.keys(linkedObj).forEach(function(x) {
   //   var min = Infinity;
   //   linkedObj[x].forEach(function(i) {
   //      min = i < min ? i : min;
   //   });
   //   processedLinks[x] = min;
   //});


   for (var y = 0; y < params.size; y++) {
      for (var x = 0; x < params.size; x++) {
         pos = calcPos1(x,y);
         var tmp = newData[pos];
         newData[pos] = processedLinks[tmp];
      }
   }

   return newData;
}

Gen.prototype.mazeStructure = function(data, params) {
   var size = params.size * params.size * 4;
   var newData = new Uint8Array(size);
   var calcPos = this.getCalcPosFun(params.size, 4);

   // X
   for (var y = 0; y < params.size; y++) {
      var x = 0;
      var left = 0;
      var right = 0;
      while (x < params.size) {
         var pos = 0;
         if (right > 0) {
            left  += 1;
            right -= 1;
         } else {
            var done = false;
            left = 0;
            right = 0;
            //left
            var i = 0;
            while (!done) {
               pos = calcPos(x - i, y);
               if( data[pos + 3] && left < 255 ) {
                  left ++;
               } else {
                  done = true;
               }
               i++;
            }
            //right
            i = 0;
            done = false;
            while (!done) {
               pos = calcPos(x + i, y);
               if( data[pos + 1] && right < 255) {
                  right ++;
               } else {
                  done = true;
               }
               i++;
            }
         }
         pos = calcPos(x, y);
         newData[pos + 1] = right;
         newData[pos + 3] = left;
         x ++;
      }
   }

   // Y
   for (var x = 0; x < params.size; x++) {
      var y = 0;
      var down = 0;
      var up = 0;
      while (y < params.size) {
         var pos = 0;
         if (down > 0) {
            up  += 1;
            down -= 1;
         } else {
            var done = false;
            down = 0;
            up = 0;
            //up
            var i = 0;
            while (!done) {
               pos = calcPos(x, y - i);
               if( data[pos + 2] && up < 255) {
                  up ++;
               } else {
                  done = true;
               }
               i++;
            }
            //down
            i = 0;
            done = false;
            while (!done) {
               pos = calcPos(x, y + i);
               if( data[pos + 0] && down < 255 ) {
                  down ++;
               } else {
                  done = true;
               }
               i++;
            }
         }
         pos = calcPos(x, y);
         newData[pos + 0] = down;
         newData[pos + 2] = up;
         y ++;
      }
   }

   return newData;
};
