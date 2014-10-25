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
