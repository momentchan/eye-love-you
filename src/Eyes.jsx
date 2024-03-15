import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Outlines } from './r3f-gist/effect/Outlines'
import { useEffect, useMemo, useRef, useState } from 'react'
import ThreeCustomShaderMaterial from 'three-custom-shader-material'
import { patchShaders } from 'gl-noise'
import { InstancedRigidBodies, quat, vec3 } from '@react-three/rapier'
import AudioPool from './r3f-gist/interaction/AudioPool'
import { MathUtils } from 'three/src/math/MathUtils'

const count = 200
const rfs = THREE.MathUtils.randFloatSpread

const shader = {
    vertex: /* glsl */ `
      attribute float patternBuffer;
      attribute float speedBuffer;
      
      varying float vSpeedBuffer;
      varying float vPatternBuffer;
      varying vec2 csm_vUv;

      void main() {
        vSpeedBuffer = speedBuffer;
        vPatternBuffer = patternBuffer;

        csm_vUv = uv;
        csm_PositionRaw = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);
      }
      `,
    fragment: /* glsl */ `
      uniform sampler2D uBlueTex;
      uniform sampler2D uRedTex;
      uniform float uTime;
      varying vec2 csm_vUv;

      varying float vSpeedBuffer;
      varying float vPatternBuffer;

      vec3 hsv2rgb(vec3 hsv) {
        float h = hsv.x;
        float s = hsv.y;
        float v = hsv.z;
        
        float c = v * s;
        float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
        float m = v - c;
        
        vec3 rgb;
        if (h < 1.0/6.0) {
            rgb = vec3(c, x, 0.0);
        } else if (h < 2.0/6.0) {
            rgb = vec3(x, c, 0.0);
        } else if (h < 3.0/6.0) {
            rgb = vec3(0.0, c, x);
        } else if (h < 4.0/6.0) {
            rgb = vec3(0.0, x, c);
        } else if (h < 5.0/6.0) {
            rgb = vec3(x, 0.0, c);
        } else {
            rgb = vec3(c, 0.0, x);
        }
        
        return rgb + vec3(m);
      }
      
      void main() {

        vec4 color = mix(texture2D(uBlueTex, csm_vUv),texture2D(uRedTex, csm_vUv), smoothstep(0.2, 0.205, vSpeedBuffer));
        csm_DiffuseColor = color*color;
        csm_Emissive = hsv2rgb(vec3(fract(uTime * 0.05), 1, 1)) * vSpeedBuffer;
      }
      `,
}
const applyForce = (api, scaler) => {
    const pos = vec3(api.translation())

    const interpolatedT = (1 - THREE.MathUtils.smoothstep(pos.length(), 2, 12)) * 1 + 1;

    api.applyImpulse(pos.normalize().multiplyScalar(scaler * interpolatedT))
}

export default function Eyes({ mat = new THREE.Matrix4(), vec = new THREE.Vector3(), ...props }) {

    const camera = useThree((state) => state.camera)

    const blueTex = useTexture('walawala.png')
    const redTex = useTexture('walawala2.png')


    const rigidBodies = useRef();
    const mesh = useRef()

    const speedBuffer = useMemo(() => {
        return new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
    }, [])

    useEffect(() => {
        const pattern = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);

        for (let i = 0; i < count; i++) {

            pattern.setX(i, MathUtils.randInt(0, 1))
        }
        mesh.current.geometry.setAttribute('patternBuffer', pattern);
    }, [])



    const audioPool = useMemo(() => {
        const progression1 = [{ sources: ['48-c3.m4a', '52-e3.m4a', '55-g3.m4a', '59-b3.m4a', '59-b3.m4a'], range: [0, 0.33] }, // Gmaj7
        { sources: ['48-c3.m4a', '52-e3.m4a', '55-g3.m4a', '45-a2.m4a'], range: [0.33, 0.67] }, // Am7
        { sources: ['52-e3.m4a', '55-g3.m4a', '59-b3.m4a', '62-d4.m4a'], range: [0.67, 1] },] // Em7


        const progression2 = [{ sources: ['48-c3.m4a', '52-e3.m4a', '55-g3.m4a', '59-b3.m4a', '59-b3.m4a'], range: [0, 0.25] }, // Cmaj7
        { sources: ['48-c3.m4a', '52-e3.m4a', '55-g3.m4a', '45-a2.m4a', '45-a2.m4a'], range: [0.25, 0.5] }, //Am7
        { sources: ['50-d3.m4a', '53-f3.m4a', '58-a3.m4a', '60-c4.m4a'], range: [0.5, 0.75] }, //Dm7
        { sources: ['41-f2.m4a', '45-a2.m4a', '48-c3.m4a', '52-e3.m4a'], range: [0.75, 1] },] // Fmaj7

        return new AudioPool(progression2, 200, true)
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

    useFrame(({ state, delta, clock }) => {
        if (!rigidBodies.current)
            return

        for (let i = 0; i < count; i++) {
            const api = rigidBodies.current[i]

            if (api == null) continue

            // force
            applyForce(api, -1)

            const vel = api.linvel()
            const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
            const ratio = THREE.MathUtils.clamp(speed / 10, 0, 1)
            speedBuffer.setX(i, Math.pow(ratio, 2))

            // torque
            const cameraPosition = camera.position.clone();
            const bodyPosition = vec3(api.translation());
            var currentQuaternion = quat(api.rotation()); // Current orientation of the body
            const direction = cameraPosition.sub(bodyPosition).normalize(); // Direction from body to camera
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);

            currentQuaternion.slerp(targetQuaternion, delta * (1 - ratio) * 0.5)
            api.setRotation(currentQuaternion)
        }

        speedBuffer.needsUpdate = true
        mesh.current.geometry.setAttribute('speedBuffer', speedBuffer);
        mesh.current.material.uniforms.uTime.value = clock.elapsedTime
    })

    THREE.MeshStandardMaterial
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
                    const volume = MathUtils.mapLinear(payload.totalForceMagnitude, 300, 1000, 0.01, 0.02)

                    audioPool.playAudio(volume)
                }
            }}
            linearDamping={0.8}
            angularDamping={1}
            mass={100}
        >

            <instancedMesh
                ref={mesh}
                castShadow receiveShadow args={[null, null, count]}>
                <sphereGeometry args={[1, 32, 32]} />
                <ThreeCustomShaderMaterial
                    baseMaterial={THREE.MeshStandardMaterial}
                    roughness={0.8}
                    envMapIntensity={0.5}
                    color='white'
                    fragmentShader={patchShaders(shader.fragment)}
                    vertexShader={patchShaders(shader.vertex)}
                    uniforms={{
                        uBlueTex: { value: blueTex },
                        uRedTex: { value: redTex },
                        uTime: { value: 0 }
                    }}
                >
                </ThreeCustomShaderMaterial>
                <Outlines thickness={0.01} />
            </instancedMesh>
        </InstancedRigidBodies>
    )
}