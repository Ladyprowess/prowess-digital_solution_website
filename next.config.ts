import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // pdfjs-dist ships an .mjs build that crashes webpack's ESM interop with
  // "Object.defineProperty called on non-object" inside __webpack_require__.r
  // -- a known, currently-open bug specific to pdfjs-dist 5.4.x + Next.js
  // webpack (mozilla/pdf.js#20478), confirmed by reproducing it locally.
  // transpilePackages alone (the usual fix for this class of problem)
  // didn't resolve it; esmExternals: "loose" is the fix documented against
  // this exact issue.
  transpilePackages: ["pdfjs-dist", "react-pdf"],
  experimental: {
    esmExternals: "loose",
  },

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
