import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import { Physics } from "@react-three/rapier";
import Pointer from "./r3f-gist/interaction/Pointer";
import Eyes from "./Eyes";
import Effect from "./Effect";
import CubeMapScene from "./CubeMapScene";
import { useEffect, useRef, useState } from "react";
import * as THREE from 'three'
import { StrictMode } from 'react'

import { startVideo } from "./r3f-gist/utility/VideoLoader";
import HandTrack from "./r3f-gist/sensor/HandTrack";
import TrackUser from "./r3f-gist/sensor/TrackUser";
import { Perf } from "r3f-perf";

export default function App() {
    const cubeScene = useRef()
    const [useWebcam, setUseWebcam] = useState(false)
    const tracker = useRef()


    // useEffect(() => {
    //     const video = document.getElementById('video');
    //     startVideo(video).then(function (status) {
    //         console.log("video started", status);
    //         if (status) {
    //             console.log("Video started. Now tracking");

    //             setUseWebcam(true)

    //             const texture = new THREE.VideoTexture(video);
    //             texture.colorSpace = THREE.SRGBColorSpace;
    //             cubeScene.current.setVideoTexture(texture)
    //         } else {
    //             console.log("Please enable video");
    //         }
    //     });
    // }, [])

    return <>
        <HandTrack ref={tracker} />

        <StrictMode>
            <Canvas
                gl={{ antialias: false }}
                dpr={[1, 1.5]}
                shadows
                camera={{
                    fov: 35,
                    position: [0, 0, 15]
                }}>
                <Perf />

                <color attach='background' args={["#dfdfdf"]} />

                <CubeMapScene ref={cubeScene} />

                {!useWebcam ? <Environment files="adamsbridge.hdr" /> : null}

                <ambientLight intensity={1.5} />
                <spotLight intensity={1} penumbra={1} position={[30, 30, 30]} castShadow shadow-mapSize={[512, 512]} />

                <Physics gravity={[0, 0, 0]}>
                    <Pointer scale={3} />
                    <Eyes cubeScene={useWebcam ? cubeScene : null} tracker={tracker}/>
                </Physics>

                <Effect />

                <OrbitControls makeDefault />
            </Canvas>
        </StrictMode>
    </>
}