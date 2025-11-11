import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Turbopack 활성 프로젝트에서는 이 한 줄이 필수
  turbopack: {},

  // ✅ HDR, EXR 등 리소스 로드 허용 (Turbopack 호환 방식)
  experimental: {
    turbo: {
      rules: {
        // asset/resource 대체
        test: /\.(hdr|exr)$/i,
        load: "@vercel/webpack-asset-loader",
      },
    },
  },
};

export default nextConfig;
