export const fieldVertex = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.99, 1.0); }
`;

export const fieldFragment = `
uniform float uTime, uPower, uSide, uMode, uScroll, uTapAge;
uniform vec2 uPointer, uTap, uSize;
varying vec2 vUv;

// Distance and projected progress along a stationary conductor.
vec2 segment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float t = clamp(dot(p-a,ab) / max(dot(ab,ab),0.0001),0.0,1.0);
  return vec2(length(p-a-ab*t), t*length(ab));
}
vec2 route(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  vec2 s0 = segment(p,a,b), s1 = segment(p,b,c), s2 = segment(p,c,d);
  s1.y += length(b-a); s2.y += length(b-a)+length(c-b);
  vec2 nearest = s0.x < s1.x ? s0 : s1;
  return nearest.x < s2.x ? nearest : s2;
}
void main() {
  float aspect = uSize.x / max(uSize.y,1.0);
  vec2 uv = vUv;
  uv.x = uSide < 0.0 ? 1.0-uv.x : uv.x;
  vec2 tap = uTap, cursor = uPointer;
  if (uSide < 0.0) { tap.x = 1.0-tap.x; cursor.x = 1.0-cursor.x; }
  vec2 scale = vec2(aspect,1.0);
  vec2 p = (uv-0.5)*scale;
  vec2 hit = (tap-0.5)*scale;
  float pixel = 1.0/max(uSize.y,1.0);
  float ink = 0.0, energy = 0.0, halo = 0.0;
  for (int i=0; i<6; i++) {
    float k = float(i);
    float lane = -0.35+k*0.065;
    vec2 a = vec2(-aspect*0.56,lane);
    vec2 b = vec2(-aspect*0.20+k*0.017,lane);
    vec2 c = b+vec2(0.17,0.17);
    vec2 d = vec2(aspect*0.56,c.y);
    vec2 sampleAt = route(p,a,b,c,d);
    float lengthOfRoute = length(b-a)+length(c-b)+length(d-c);
    float progress = sampleAt.y/lengthOfRoute;
    float line = 1.0-smoothstep(pixel*0.45,pixel*1.25,sampleAt.x);
    float head = fract(uTime*(0.07+k*0.005)+k*0.173);
    float tail = mod(head-progress+1.0,1.0);
    float packet = exp(-tail*65.0)*smoothstep(0.0,0.003,tail);
    float emphasis = abs(mod(k,3.0)-uMode)<0.1 ? 1.0 : 0.45;
    vec2 tapped = route(hit,a,b,c,d);
    float arrival = abs(sampleAt.y-tapped.y)-uTapAge*0.46;
    float injected = exp(-arrival*arrival/0.0008)*exp(-tapped.x*22.0);
    injected *= (1.0-smoothstep(0.65,1.65,uTapAge))*step(0.0,uTapAge);
    float cursorNear = exp(-length((uv-cursor)*scale)*7.0);
    float moving = (packet*emphasis*0.32+injected*0.30)*uPower;
    ink += line*(0.016+cursorNear*0.012);
    energy += line*moving;
    halo += exp(-sampleAt.x/max(pixel*6.0,0.004))*moving*0.10;
    // Small registration terminals, rather than sparks or continuous waves.
    float terminal = max(1.0-smoothstep(pixel*1.0,pixel*2.8,length(p-b)),
                         1.0-smoothstep(pixel*1.0,pixel*2.8,length(p-c)));
    ink += terminal*0.023;
  }
  float edge = smoothstep(0.0,0.08,uv.x)*(1.0-smoothstep(0.92,1.0,uv.x));
  float vignette = 1.0-smoothstep(0.3,0.9,length((uv-0.5)*vec2(0.8,1.0)));
  float light = (energy+halo)*edge*vignette;
  vec3 color = (vec3(0.40,0.43,0.40)*ink+vec3(0.96863,0.85882,0.01961)*light)/max(ink+light,0.0001);
  gl_FragColor = vec4(color,clamp(ink+light,0.0,0.42));
}
`;

export const conductorVertex = `
varying vec2 vUv;
void main() { vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
`;
export const conductorFragment = `
uniform float uTime, uPower, uEmphasis, uSeed, uTap;
varying vec2 vUv;
void main() {
  float head = fract(uTime*0.13+uSeed);
  float tail = mod(head-vUv.x+1.0,1.0);
  float pulse = exp(-tail*46.0)*smoothstep(0.0,0.006,tail);
  float surface = 0.06+pow(max(0.0,sin(vUv.y*3.14159)),5.0)*0.20;
  float current = uPower*(0.08+uEmphasis*0.17+pulse*(0.4+uEmphasis*0.55)+uTap*0.15);
  vec3 base = vec3(surface*0.9,surface,surface*0.95);
  gl_FragColor = vec4(mix(base,vec3(0.96863,0.85882,0.01961),clamp(current,0.0,1.0)),1.0);
}
`;
