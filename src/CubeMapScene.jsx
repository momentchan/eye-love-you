import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { useEffect } from "react";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { forwardRef } from 'react';
import { useImperativeHandle } from 'react';
import frgmentShader from './shaders/cubemap/fragment.glsl'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'

export default forwardRef(function CubeMapScene(props, ref) {
    const [enable, setEnable] = useState(false)

    const mesh = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(10, 10, 1, 1);
        const material = new CustomShaderMaterial({
            baseMaterial: THREE.MeshBasicMaterial,

            vertexShader: `
            varying vec2 csm_vUv;
            void main() {
              csm_vUv = uv;
            }
            `,
            fragmentShader: frgmentShader,
            transparent: true,
            silent: true
        })
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
        },

        setVideoTexture(texture) {
            mesh.material.map = texture
            mesh.material.needsUpdate = true
            setEnable(true)
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
        if (!enable) return

        const { camera } = state;
        const pos = camera.position.clone().normalize().multiplyScalar(2)

        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.lookAt(new THREE.Vector3(0, 0, 0))

        cubeCamera.update(state.gl, vScene);
    });

    return <></>
})