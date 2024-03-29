const shader = {
    vertex: /* glsl */ `
      attribute float speedBuffer;
      varying float vSpeedBuffer;
      varying vec2 csm_vUv;
      void main() {
        vSpeedBuffer = speedBuffer;
        csm_vUv = uv;
        csm_PositionRaw = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);
      }
      `,
    fragment: /* glsl */ `
      uniform sampler2D uBlueTex;
      uniform sampler2D uRedTex;
      varying vec2 csm_vUv;

      varying float vSpeedBuffer;
      uniform float uTime;
      void main() {
        csm_DiffuseColor = mix(texture2D(uBlueTex, csm_vUv),texture2D(uRedTex, csm_vUv), vSpeedBuffer) ;
      }
      `,
};

export default shader;