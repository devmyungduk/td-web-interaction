// SceneCanvas.tsx
'use client';                                                             // Next.js 클라이언트 컴포넌트 선언

import * as THREE from 'three';                                           // three.js 핵심 라이브러리
import { Canvas } from '@react-three/fiber';                              // React용 three.js 캔버스
import { OrbitControls, Environment } from '@react-three/drei';           // 편의 유틸(오비트/환경맵)
import { Suspense } from 'react';                                         // 비동기 로딩 지원
import GlassObject from './GlassObject';                                  // 커스텀 3D 오브젝트

export default function SceneCanvas() {                                   // SceneCanvas 컴포넌트 시작
  return (
    <div                                                                   // 전체 캔버스 컨테이너 시작
      className="absolute inset-0"                                         //  → 부모 기준 전체 영역 차지
      style={{
        background:
          'linear-gradient(145deg, #0b0f17 0%, #1a1f29 40%, #2e3542 100%)',//  → 어두운 그라데이션 배경
      }}
    >
      <Canvas                                                              // three.js 렌더링 캔버스 시작
        camera={{ position: [0, 0, 6.5], fov: 45 }}                        //  → 카메라 위치 및 시야각
        gl={{
          antialias: true,                                                 //  → 계단 현상 완화
          toneMapping: THREE.ACESFilmicToneMapping,                        //  → 톤 매핑 방식
          toneMappingExposure: 1.35,                                       //  → 노출(밝기) 설정
        }}
        dpr={[1, 2]}                                                       //  → 디스플레이 픽셀 비율 대응
      >
        <Suspense fallback={null}> {/* 비동기 로딩 시 대체 UI 없음 */}    {/* Suspense 시작 */}
          <Environment
            files="/textures/studio_small_08_1k.hdr"                       //  → HDR 환경맵 파일 경로
            background={false}                                             //  → 씬 배경으로 사용하지 않음
            blur={0.4}                                                     //  → 환경맵 블러 처리량
            intensity={1.8}                                                //  → 환경광 세기
          />

          <directionalLight position={[6, 6, 6]} intensity={2.4} color="#d8e0ff" /> {/* 방향광 (메인 라이트) */}
          <pointLight       position={[-5, 2, 4]} intensity={1.9} color="#9ac5ff" />{/* 포인트 라이트 1       */}
          <pointLight       position={[4, -3, 3]} intensity={1.4} color="#a4b5ff" />{/* 포인트 라이트 2       */}
          <ambientLight     intensity={0.25} color="#8f98a9" />                         {/* 주변광 (전역 밝기)   */}

          <GlassObject />                                                               {/* 유리 오브젝트 렌더링 */}

          <OrbitControls
            enableZoom={false}                                                     //  → 줌 비활성화
            autoRotate                                                             //  → 자동 회전 활성화
            autoRotateSpeed={0.7}                                                  //  → 자동 회전 속도
            enablePan={false}                                                      //  → 패닝(이동) 비활성화
            enableDamping                                                          //  → 감속(관성) 활성화
            dampingFactor={0.05}                                                   //  → 감속 강도
          />
          {/* Suspense 끝 */}
        </Suspense>
        {/* Canvas 끝 */}
      </Canvas>
      {/* 컨테이너 끝 */}
    </div>
  );
}                                                                            // 컴포넌트 끝
