uniform sampler2D uCubeMap;
varying vec2 csm_vUv;

void main()
{
    float alpha = smoothstep(0.0, 0.5, csm_vUv.x) * smoothstep(1.0, 0.5, csm_vUv.x) *
                    smoothstep(0.0, 0.5, csm_vUv.y) * smoothstep(1.0, 0.5, csm_vUv.y);
    csm_FragColor *= 1.5;
    csm_FragColor.a = alpha;
}