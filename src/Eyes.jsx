import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Outlines } from './r3f-gist/effect/Outlines'
import { useMemo, useRef, useState } from 'react'
import ThreeCustomShaderMaterial from 'three-custom-shader-material'
import { patchShaders } from 'gl-noise'
import { InstancedRigidBodies, quat, vec3 } from '@react-three/rapier'
import AudioPool from './r3f-gist/interaction/AudioPool'
import { MathUtils } from 'three/src/math/MathUtils'

import shader from './shaders/eyes'

const count = 200
const rfs = THREE.MathUtils.randFloatSpread

const applyForce = (api, scaler) => {
    const pos = vec3(api.translation())

    const interpolatedT = (1 - THREE.MathUtils.smoothstep(pos.length(), 2, 12)) * 1 + 1;

    api.applyImpulse(pos.normalize().multiplyScalar(scaler * interpolatedT))
}

export default function Eyes({ cubeScene, mat = new THREE.Matrix4(), vec = new THREE.Vector3(), ...props }) {

    const camera = useThree((state) => state.camera)

    const blueTex = useTexture('eye_blue.png')
    const redTex = useTexture('eye_red.png')

    const rigidBodies = useRef();
    const mesh = useRef()

    const speedArray = useMemo(() => {
        return new Float32Array(count);
    }, [])


    const audioPool = useMemo(() => {
        const progression = [{ sources: ['c2.wav', 'e2.wav', 'g2.wav', 'b2.wav'], range: [0, 0.25] },
        { sources: ['c2.wav', 'e2.wav', 'g2.wav', 'a1.wav'], range: [0.25, 0.5] },
        { sources: ['d2.wav', 'f2.wav', 'a2.wav', 'c3.wav'], range: [0.5, 0.75] },
        { sources: ['f1.wav', 'a1.wav', 'c2.wav', 'e2.wav'], range: [0.75, 1] },]

        return new AudioPool(progression, 200, true)
    }, [])

    const instances = useMemo(() => {
        const instances = [];

        for (let i = 0; i < count; i++) {
            instances.push({
                key: "instance_" + i,
                position: [rfs(20), rfs(20), rfs(20)],
                rotation: [Math.random(), Math.random(), Math.random()],
            })
        }
        return instances
    }, [])

    useFrame((state, delta) => {
        const clock = state.clock
        if (!rigidBodies.current)
            return

        for (let i = 0; i < count; i++) {
            const api = rigidBodies.current[i]

            if (api == null) continue

            // force
            applyForce(api, -1)

            const vel = api.linvel()
            const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
            const ratio = THREE.MathUtils.clamp(Math.pow(speed / 6, 3), 0, 1)
            speedArray[i] = ratio

            // torque
            const cameraPosition = camera.position.clone();
            const bodyPosition = vec3(api.translation());
            var currentQuaternion = quat(api.rotation()); // Current orientation of the body
            const direction = cameraPosition.sub(bodyPosition).normalize(); // Direction from body to camera
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);

            currentQuaternion.slerp(targetQuaternion, delta * (1 - ratio) * 0.5)
            api.setRotation(currentQuaternion)
        }

        mesh.current.geometry.attributes.speedBuffer.needsUpdate = true
        mesh.current.material.uniforms.uTime.value = clock.elapsedTime

        if (cubeScene) {
            mesh.current.material.envMap = cubeScene.current.getCubeMap()
        }
    })


    return (
        <InstancedRigidBodies
            ref={rigidBodies}
            instances={instances}
            friction={1}
            restitution={0}
            colliders='ball'
            onClick={evt => {
                evt.intersections.forEach(i => {
                    applyForce(rigidBodies.current[i.instanceId], 20)
                })
            }}
            onContactForce={(payload) => {
                if (payload.totalForceMagnitude > 300) {
                    const volume = MathUtils.mapLinear(payload.totalForceMagnitude, 300, 1000, 0.02, 0.03)

                    audioPool.playAudio(volume)
                }
            }}
            linearDamping={0.8}
            angularDamping={1}
            mass={100}
        >

            <instancedMesh
                ref={mesh}
                castShadow
                receiveShadow
                args={[null, null, count]}
                frustumCulled={false}
            >
                <sphereGeometry args={[1, 32, 32]}>
                    <instancedBufferAttribute attach="attributes-speedBuffer" args={[speedArray, 1]} />
                </sphereGeometry>
                <ThreeCustomShaderMaterial
                    baseMaterial={THREE.MeshStandardMaterial}
                    roughness={0}
                    silent
                    // metalness={1}
                    envMapIntensity={1}
                    color='white'
                    map={blueTex}
                    fragmentShader={patchShaders(shader.fragment)}
                    vertexShader={patchShaders(shader.vertex)}
                    uniforms={{
                        uBlueTex: { value: blueTex },
                        uRedTex: { value: redTex },
                        uTime: { value: 0 }
                    }}
                >
                </ThreeCustomShaderMaterial>
                <Outlines transparent thickness={0.02} />
            </instancedMesh>
        </InstancedRigidBodies>
    )
}