import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async rewrites() {
    // In production, if frontend and backend are on same domain
    // but different services, proxy to the backend service
    if (process.env.NEXT_PUBLIC_API_URL && 
        process.env.NEXT_PUBLIC_API_URL !== '/api') {
      const backendUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl.origin}/api/:path*`,
        },
      ];
    }
    
    // If using relative URL (/api), no rewrite needed
    return [];
  },
};

export default nextConfig;
