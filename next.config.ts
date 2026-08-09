import type { NextConfig } from 'next';

// GitHub Pages 는 저장소 이름을 경로로 쓴다. 배포 워크플로우가
// NEXT_PUBLIC_BASE_PATH 를 넘기고, 로컬 개발에서는 비워 둔다.
// NEXT_PUBLIC_ 접두어를 쓰면 Next 가 브라우저 번들에도 값을 넣어
// 코드 안의 정적 파일 경로에서 같은 값을 쓸 수 있다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  // 저장소 밖의 lock 파일을 참조하지 않도록 프로젝트 루트를 고정한다.
  turbopack: { root: __dirname },

  // 정적 파일로 내보낸다. 서버가 없어도 어느 웹서버에서나 동작한다.
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,

  // 정적 export 에서는 이미지 최적화 서버를 쓸 수 없다.
  images: { unoptimized: true },

  // GitHub Pages 의 경로 처리와 맞추기 위해 디렉터리 형태 URL 을 쓴다.
  trailingSlash: true,
};

export default nextConfig;
