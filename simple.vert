attribute vec3 inVertex;
attribute vec2 inUV;

varying vec2 uv;
void main(){
    gl_Position = vec4(inVertex.xy, 0, 1);
    uv = inUV * 2.0 - 1.0;
}
