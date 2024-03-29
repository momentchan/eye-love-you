import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { useEffect } from "react";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { forwardRef } from 'react';
import { useImperativeHandle } from 'react';

export default forwardRef(function CubeMapScene(props, ref) {
    const mesh = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(20, 20, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 'red', side: THREE.DoubleSide });
        return new THREE.Mesh(geometry, material);
    }, []);

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
        mesh.position.copy(camera.position);
        mesh.lookAt(new THREE.Vector3(0, 0, 0))

        cubeCamera.update(state.gl, vScene);
    });

    return <></>
})