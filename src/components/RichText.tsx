import sanitizeHtml from "sanitize-html";

// isomorphic-dompurify pulls in jsdom -> html-encoding-sniffer -> an
// ESM-only dependency that Vercel's serverless require() bundling can't
// load, crashing the whole route at module-load time in production (even
// on pages where the RichText body never actually runs, since the crash
// happens at import resolution, not render) - confirmed via the exact
// prod stack trace: "ERR_REQUIRE_ESM ... html-encoding-sniffer.js ...
// page: '/career-paths/web3'". sanitize-html is pure JS with no jsdom
// dependency, so it can't hit the same failure mode.
//
// Allowlist matches RichTextEditor.tsx's actual schema exactly
// (StarterKit with heading levels 2-3, plus Link) - nothing wider, since
// TipTap can't produce anything outside this set anyway.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "code", "pre", "hr"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
};

const HTML_TAG_PATTERN = /<[a-z][\s\S]*>/i;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Every description column on the platform holds years of plain text
// (imports, manual admin entries) written before RichTextEditor existed,
// alongside new HTML from it going forward - both have to render correctly
// through the same component. Plain text fed straight into
// dangerouslySetInnerHTML would collapse every line break into one run-on
// line (HTML ignores \n), so anything that isn't already real HTML gets
// converted to paragraphs first instead of silently losing its formatting.
function toHtml(value: string): string {
  if (HTML_TAG_PATTERN.test(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// The read-only counterpart to RichTextEditor.tsx - renders the content
// (bold/headings/lists/links/quotes) using the same .blog-content
// typography every rich-text field on the platform shares. DOMPurify is a
// second, independent safety layer on top of TipTap's own schema-constrained
// output (see RichTextEditor.tsx for why that already can't produce
// <script> tags on its own) - stripping anything unexpected that somehow
// made it into a description column (a direct DB edit, a future editor
// change, etc.) before it ever reaches the DOM.
export function RichText({ html, className = "" }: { html: string; className?: string }) {
  const clean = sanitizeHtml(toHtml(html), SANITIZE_OPTIONS);
  return <div className={`blog-content ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
