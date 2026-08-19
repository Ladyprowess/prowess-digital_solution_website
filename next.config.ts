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

  async redirects() {
    return [
      // /careers is now reserved for the consumer career-path system - the
      // internal "join our team" page moved to /work-with-us. Permanent so
      // search engines transfer ranking instead of treating it as a 404.
      { source: "/careers", destination: "/work-with-us", permanent: true },
      // /tools-admin (separate PIN-based login) was migrated into the
      // unified /admin shell, reusing the same Supabase admin session as
      // every other admin page instead of a standalone shared password.
      { source: "/tools-admin", destination: "/admin/clients", permanent: true },
    ];
  },
};

export default nextConfig;
