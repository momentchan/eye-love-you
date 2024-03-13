import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import Clump from "./Clump";
import { EffectComposer, N8AO, SMAA } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import Pointer from "./r3f-gist/interaction/Pointer";

export default function App() {
    return <>
        <Canvas
            gl={{ antialias: false }}
            dpr={[1, 1.5]}
            shadows
            camera={{
                fov: 35,
                position: [0, 0, 15]
            }}>

            <color attach='background' args={["#dfdfdf"]} />

            {/* add light variances  */}
            <Environment files="adamsbridge.hdr" />
            <ambientLight intensity={1.5} />
            <spotLight intensity={1} angle={0.2} penumbra={1} position={[30, 30, 30]} castShadow shadow-mapSize={[512, 512]} />

            <Physics gravity={[0, 0, 0]}>
                <Pointer scale={3} />
                <Clump />
            </Physics>

            <EffectComposer disableNormalPass multisampling={0}>
                <N8AO halfRes color='black' aoRadius={2} intensity={1} aoSamples={6} denoiseSamples={4} />
                <SMAA />
            </EffectComposer>
            <OrbitControls makeDefault />
        </Canvas>
    </>
}