import type { MeshStandardMaterial } from 'three';

export const brushedMetal: MeshStandardMaterial['onBeforeCompile'] = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vMachinedPosition;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMachinedPosition = position;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vMachinedPosition;')
    .replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      float grain = fract(sin(dot(floor(vMachinedPosition.xy * vec2(150.0, 1800.0)), vec2(12.9898,78.233))) * 43758.5453);
      float tooling = sin(vMachinedPosition.y * 1300.0) * 0.018;
      diffuseColor.rgb *= 0.94 + grain * 0.10 + tooling;
      float edge = max(abs(vMachinedPosition.x) / 2.45, abs(vMachinedPosition.y) / 1.68);
      float etch = (1.0 - smoothstep(0.001,0.007,abs(edge-0.92))) * step(0.97,fract(vMachinedPosition.x*8.0));
      diffuseColor.rgb += vec3(etch * 0.012);
    `,
    );
};

export const metalProgramKey = () => 'barghino-machined-surface-v1';
