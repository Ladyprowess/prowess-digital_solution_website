import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "candgoprqdjsnkgqzeum.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async rewrites() {
    return [
      { source: "/tools/business-helper", destination: "/tools/business-helper.html" },
      { source: "/tools/business-structure", destination: "/tools/business-structure.html" },
      { source: "/tools/customer-support", destination: "/tools/customer-support.html" },
    ];
  },
};

export default nextConfig;
