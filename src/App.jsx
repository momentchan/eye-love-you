import { OrbitControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import { Physics } from "@react-three/rapier";
import Pointer from "./r3f-gist/interaction/Pointer";
import Eyes from "./Eyes";
import Effect from "./Effect";
import CubeMapScene from "./CubeMapScene";
import { useRef } from "react";

export default function App() {
    const cubeScene = useRef()

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

            <CubeMapScene ref={cubeScene} />

            <ambientLight intensity={1.5} />
            <spotLight intensity={1} penumbra={1} position={[30, 30, 30]} castShadow shadow-mapSize={[512, 512]} />

            <Physics gravity={[0, 0, 0]}>
                <Pointer scale={3} />
                <Eyes cubeScene={cubeScene} />
            </Physics>

            <Effect />

            <OrbitControls makeDefault />
        </Canvas>
    </>
}