// Description columns can now hold rich HTML (RichTextEditor) or legacy
// plain text - either way, a <meta name="description"> tag needs plain
// text, not raw markup showing up in search results. Used by every content
// type's generateMetadata (jobs, opportunities, resources, courses, career
// paths).
export function stripHtmlForMeta(value: string, maxLength = 155): string {
  const text = value
    // <script>/<style> content has to go with the tags, not just the tags
    // themselves - a generic tag-strip alone leaves their inner text
    // behind as visible plain text in the meta description.
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
  return text.slice(0, maxLength);
}
