// YouTube serves a thumbnail at a predictable URL for every video ID, so a
// video never needs its own uploaded thumbnail image - just pull the ID out
// of whatever URL format was pasted (watch?v=, youtu.be/, embed/, shorts/).
export function getYoutubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function getYoutubeThumbnail(url: string): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

// Shorts are embedded at their native ~9:16 portrait size (confirmed via
// YouTube's own oEmbed response), not 16:9 - a player forced into a
// landscape box crops/zooms the vertical video badly.
export function isYoutubeShorts(url: string): boolean {
  return /youtube\.com\/shorts\//.test(url);
}
