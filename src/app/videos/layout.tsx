import type { Metadata } from "next";

// /videos/page.tsx is a client component (needs router/searchParams-driven
// filter state, same reason /learn and /jobs are) -- a client page can't
// export `metadata` itself, so this layout carries it instead. Restores
// exactly what the page had before it became a client component.
export const metadata: Metadata = {
  // Root layout's title template already appends " | Prowess Digital
  // Solutions" -- just "Videos" here, not the full string (several other
  // pages in this codebase double up the suffix this way; not fixing
  // those here, just not repeating it in this new file).
  title: "Videos",
  description: "Practical videos to help you learn, build useful skills, make clearer decisions and keep growing.",
  alternates: { canonical: "https://prowessdigitalsolutions.com/videos" },
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
