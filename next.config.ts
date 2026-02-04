import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  // Tạo build tối ưu để chạy trong container
  output: "standalone",
  
  // Cấu hình để cho phép kết nối đến backend trong Docker network
  serverExternalPackages: ["mongodb"],
  
  // Cho phép images từ các domain khác (nếu cần)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  
  // Experimental features (nếu cần)
  experimental: {
    // Tối ưu memory cho build
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
