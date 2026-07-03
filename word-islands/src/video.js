// Converts a YouTube URL (watch/shorts/youtu.be/embed) or a bare video id
// into a privacy-friendly youtube-nocookie embed URL. Returns null for
// anything unrecognized so the UI simply shows no video button.

export function videoEmbedUrl(video) {
  if (!video) return null;
  const text = String(video);
  const match = text.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  const id = match ? match[1] : /^[\w-]{11}$/.test(text) ? text : null;
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}
