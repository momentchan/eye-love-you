import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { useEffect } from "react";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { forwardRef } from 'react';
import { useImperativeHandle } from 'react';

export default forwardRef(function CubeMapScene(props, ref) {
    const mesh = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(10, 10, 1, 1);
        const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide});
        return new THREE.Mesh(geometry, material);
    }, []);



    useEffect(() => {
        const video = document.getElementById('video');
        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

            const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };

            navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                // apply the stream to the video element used in the texture
                video.srcObject = stream;
                video.play();

            }).catch(function (error) {

                console.error('Unable to access the camera/webcam.', error);
            });

        } else {

            console.error('MediaDevices interface not available.');
        }

        mesh.material.map = texture
    }, [])

    const vScene = useMemo(() => {
        const scene = new THREE.Scene();
        scene.add(mesh);
        return scene;
    }, [mesh]);

    const cubeRenderTarget = useMemo(() => {
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512);
        cubeRenderTarget.texture.type = THREE.FloatType;
        cubeRenderTarget.depthBuffer = false // add this to prevent weird effect
        return cubeRenderTarget;
    }, []);

    const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget)

    useImperativeHandle(ref, () => ({
        getCubeMap() {
            return cubeRenderTarget.texture
        }
    }))

    useEffect(() => {
        const loader = new RGBELoader();
        loader.load('adamsbridge.hdr', (hdri) => {
            hdri.mapping = THREE.EquirectangularReflectionMapping;
            vScene.background = hdri;
        });
    }, [vScene]);

    useFrame((state) => {
        const { camera } = state;
        const pos = camera.position.clone().normalize().multiplyScalar(2)
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.lookAt(new THREE.Vector3(0, 0, 0))

        cubeCamera.update(state.gl, vScene);
    });

    return <></>
})