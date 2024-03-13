import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Outlines } from './r3f-gist/effect/Outlines'
import { useMemo, useRef, useState } from 'react'
import ThreeCustomShaderMaterial from 'three-custom-shader-material'
import { patchShaders } from 'gl-noise'
import { InstancedRigidBodies, quat, vec3 } from '@react-three/rapier'

const count = 200
const rfs = THREE.MathUtils.randFloatSpread

const shader = {
    vertex: /* glsl */ `
      attribute float speedBuffer;
      varying float vSpeedBuffer;
      varying vec2 csm_vUv;
      void main() {
        vSpeedBuffer = speedBuffer;
        csm_vUv = uv;
        csm_PositionRaw = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);
      }
      `,
    fragment: /* glsl */ `
      uniform sampler2D uBlueTex;
      uniform sampler2D uRedTex;
      varying vec2 csm_vUv;

      varying float vSpeedBuffer;
      void main() {
        csm_DiffuseColor = mix(texture2D(uBlueTex, csm_vUv),texture2D(uRedTex, csm_vUv), vSpeedBuffer) ;
      }
      `,
}
const applyForce = (api, scaler) => {
    const pos = vec3(api.translation())
    api.applyImpulse(pos.normalize().multiplyScalar(scaler))
}

export default function Eyes({ mat = new THREE.Matrix4(), vec = new THREE.Vector3(), ...props }) {
    const [hitSound] = useState(() => new Audio('./721342__jerimee__table-tennis-toggle.wav'))
    const camera = useThree((state) => state.camera)

    const blueTex = useTexture('eye_blue.png')
    const redTex = useTexture('eye_red.png')

    const rigidBodies = useRef();
    const mesh = useRef()
    const speedBuffer = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);

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
                    hitSound.currentTime = 0;
                    hitSound.volume = rfs(0.25) + 0.75;
                    hitSound.play();
                }
            }}
            linearDamping={0.65}
            angularDamping={1}
            mass={3}
        >

            <instancedMesh
                ref={mesh}
                castShadow receiveShadow args={[null, null, count]}>
                <sphereGeometry args={[1, 32, 32]} />
                {/* <boxGeometry args={[1, 1, 5]} /> */}
                <ThreeCustomShaderMaterial
                    baseMaterial={THREE.MeshStandardMaterial}
                    roughness={0}
                    envMapIntensity={1}
                    color='white'
                    map={blueTex}
                    fragmentShader={patchShaders(shader.fragment)}
                    vertexShader={patchShaders(shader.vertex)}
                    uniforms={{
                        uBlueTex: { value: blueTex },
                        uRedTex: { value: redTex }
                    }}
                >
                </ThreeCustomShaderMaterial>
                <Outlines thickness={0.01} />
            </instancedMesh>
        </InstancedRigidBodies>
    )
}