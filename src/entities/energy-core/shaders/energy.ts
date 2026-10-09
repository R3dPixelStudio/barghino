export const energyVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const energyFragment = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uPointer;
  uniform vec3 uNeon;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float proximity = exp(-9.0 * distance(uv, uPointer));
    float bend = sin(uv.y * 20.0 + uTime * 0.45) * 0.012 * proximity;
    float row = fract((uv.y + bend) * 12.0);
    float lineDistance = min(row, 1.0 - row);
    float aa = max(fwidth(row), 0.001);
    float line = 1.0 - smoothstep(0.012, 0.012 + aa, lineDistance);
    float lane = floor(uv.y * 12.0);
    float travel = fract(uv.x - uTime * 0.14 + lane * 0.117 + uScroll * 0.3);
    float pulse = exp(-140.0 * pow(travel - 0.5, 2.0));
    float edge = smoothstep(0.0, 0.14, uv.x) * (1.0 - smoothstep(0.86, 1.0, uv.x));
    edge *= smoothstep(0.0, 0.15, uv.y) * (1.0 - smoothstep(0.85, 1.0, uv.y));
    float mask = 1.0 - smoothstep(0.3, 0.55, abs(uv.x - 0.5));
    float intensity = line * (0.1 + pulse * 0.95 + proximity * 0.4) * edge * mask;
    if (intensity < 0.008) discard;
    gl_FragColor = vec4(uNeon, clamp(intensity, 0.0, 0.9));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
