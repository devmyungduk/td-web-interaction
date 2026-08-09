'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import GlassObject from './GlassObject';

// basePath 가 붙은 경로로 배포되므로 정적 파일 주소에 직접 붙인다.
const HDR_PATH = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/textures/studio_small_08_1k.hdr`;

// 유리 오브젝트를 비추는 배경 씬. HDR 환경맵으로 반사를 만들고
// 카메라를 천천히 자동 회전시킨다.
export default function SceneCanvas() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(145deg, #0b0f17 0%, #1a1f29 40%, #2e3542 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
        }}
        dpr={[1, 2]}
      >
        {/* 환경맵 로딩이 실패해도 조명과 오브젝트는 보이도록 분리한다. */}
        <Suspense fallback={null}>
          <Environment files={HDR_PATH} background={false} blur={0.4} environmentIntensity={1.8} />
        </Suspense>

        <directionalLight position={[6, 6, 6]} intensity={2.4} color="#d8e0ff" />
        <pointLight position={[-5, 2, 4]} intensity={1.9} color="#9ac5ff" />
        <pointLight position={[4, -3, 3]} intensity={1.4} color="#a4b5ff" />
        <ambientLight intensity={0.25} color="#8f98a9" />

        <GlassObject />

        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.7}
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
