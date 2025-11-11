// GlassObject.tsx
'use client';                                                           // Next.js 클라이언트 컴포넌트 선언

// ─────────────────────────────────────────────────────────────
// ✅ import 영역
// ─────────────────────────────────────────────────────────────
import { useRef, useMemo, useEffect } from 'react';                     // React 훅 불러오기
import { useFrame } from '@react-three/fiber';                          // 프레임마다 애니메이션 업데이트 훅
import * as THREE from 'three';                                         // three.js 핵심 라이브러리

// ─────────────────────────────────────────────────────────────
// ✅ GlassObject 컴포넌트 정의
// ─────────────────────────────────────────────────────────────
export default function GlassObject() {                                 // GlassObject 컴포넌트 시작
  const mesh = useRef<THREE.Mesh | null>(null);                         // 3D 메시 참조
  const t = useRef(0);                                                  // 시간 누적용 (애니메이션 계산)

  // ─────────────────────────────────────────────────────────────
  // ✅ 프레임 애니메이션 (회전 + 스케일 진동)
  // ─────────────────────────────────────────────────────────────
  useFrame((_, delta) => {                                              // 프레임마다 실행
    if (!mesh.current) return;                                          // mesh가 없으면 중단
    t.current += delta;                                                 // 시간 누적
    const s = Math.sin(t.current * 0.4);                                // 진동값 계산
    const scale = 2.8 + s * 0.15;                                       // 크기 변화 계산
    mesh.current.rotation.x += delta * 0.06;                            // X축 회전 속도
    mesh.current.rotation.y += delta * 0.09;                            // Y축 회전 속도
    mesh.current.scale.set(scale, scale * 0.6, scale * 0.7);            // 전체 스케일 적용
  });

  // ─────────────────────────────────────────────────────────────
  // ✅ 유리 재질(Material) 설정 (물리 기반 렌더링)
  // ─────────────────────────────────────────────────────────────
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        metalness: 1.0,              // 금속 반사 정도
        roughness: 0.05,             // 표면 거칠기
        reflectivity: 1,             // 반사율
        transmission: 0.25,          // 투명도
        ior: 1.8,                    // 굴절률
        clearcoat: 1,                // 표면 클리어코트
        clearcoatRoughness: 0.03,    // 코트 거칠기
        thickness: 1.2,              // 두께
        envMapIntensity: 6.0,        // 환경맵 밝기
        color: '#c8ccd8',            // 기본 색상
        specularIntensity: 2.0,      // 반사광 강도
        specularColor: '#e0e4f2',    // 반사광 색상
        sheen: 0.2,                  // 섬유광 효과
        sheenRoughness: 0.4,         // 섬유광 거칠기
        sheenColor: '#f2f5ff',       // 섬유광 색상
        side: THREE.DoubleSide,      // 양면 렌더링
        transparent: true,           // 투명도 활성화
        toneMapped: true,            // 톤매핑 활성화
      }),
    []
  );

  // ─────────────────────────────────────────────────────────────
  // ✅ 형상(Geometry) 설정
  // ─────────────────────────────────────────────────────────────
  const geometry = useMemo(
    () => new THREE.TorusKnotGeometry(1.2, 0.35, 360, 80),              // 토러스 매듭 형상
    []
  );

  // ─────────────────────────────────────────────────────────────
  // ✅ 리소스 정리 (언마운트 시 메모리 해제)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      material.dispose();                                                // 재질 메모리 해제
      geometry.dispose();                                                // 형상 메모리 해제
    };
  }, [material, geometry]);

  // ─────────────────────────────────────────────────────────────
  // ✅ 렌더링 반환
  // ─────────────────────────────────────────────────────────────
  return (
    <mesh
      ref={mesh}                                                         // 메시 참조 연결
      scale={[2.8, 1.4, 1.6]}                                            // 초기 스케일 설정
      rotation={[0.5, 0.4, 0]}                                           // 초기 회전값 설정
      material={material}                                                // 재질 적용
      geometry={geometry}                                                // 형상 적용
    />
  );
}                                                                        // 컴포넌트 끝
