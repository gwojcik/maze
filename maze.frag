precision highp float;
varying highp vec2 uv;
uniform float seed;

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

void main() {
   float aspect = (3.0/4.0);
   gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0);
   gl_FragColor.xy = uv;
   vec2 pos = (uv*vec2(1.0, aspect)+vec2(1.0,1.0))*20.0;
   pos = ComplexMul(normalize(vec2(1.0, 1.0)), pos);
   vec2 tile = ceil(pos);
   vec2 p = fract(pos);
   float x = BBS4(tile.x*128.0 + tile.y + BBS2(seed));
   float d;
   if ( x > 0.0) {
      d = abs(abs(dot(normalize(vec2(1,1)), p)) - sqrt(2.0)/2.0);
   } else {
      d = abs(dot(normalize(vec2(-1,1)), p));
   }
   if ( d > 0.2 && d < (sqrt(2.0)/2.0 - 0.2)) {
      gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0);
   }
}
