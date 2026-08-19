import DOMPurify from "isomorphic-dompurify";

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
  const clean = DOMPurify.sanitize(toHtml(html));
  return <div className={`blog-content ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
