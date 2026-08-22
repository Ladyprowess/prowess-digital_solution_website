import type { Metadata } from "next";

// /resources/page.tsx becomes a client component in this rebuild (needs
// router/searchParams-driven filter state, same reason /videos and /learn
// are) -- a client page can't export `metadata` itself, so this layout
// carries it instead, same pattern as src/app/videos/layout.tsx.
export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides, templates, checklists and ebooks to help you learn a skill, plan your business, or grow your career -- built for African entrepreneurs and job seekers.",
  alternates: { canonical: "https://prowessdigitalsolutions.com/resources" },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
