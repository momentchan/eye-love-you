import { useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, GodRays, SMAA } from "@react-three/postprocessing";
import { N8AOPostPass } from "n8ao";
import { useEffect, useRef } from "react";

export default function Effect() {
    const scene = useThree((state) => state.scene)
    const camera = useThree((state) => state.camera)
    const size = useThree((state) => state.size)
    const composer = useRef()

    useEffect(() => {
        const n8aopass = new N8AOPostPass(
            scene,
            camera,
            size.width,
            size.height,
        );
        n8aopass.configuration.aoRadius = 2
        n8aopass.configuration.intensity = 1
        n8aopass.configuration.aoSamples = 6
        n8aopass.configuration.denoiseSamples = 4
        composer.current.addPass(n8aopass, 1)
    })

    return <>
        <EffectComposer ref={composer} disableNormalPass multisampling={0}>
            <SMAA />
            <Bloom
                intensity={1.0} // The bloom intensity.
                luminanceThreshold={0.95} // luminance threshold. Raise this value to mask out darker elements in the scene.
                luminanceSmoothing={0.5} // smoothness of the luminance threshold. Range is [0, 1]
            />
        </EffectComposer>
    </>
}