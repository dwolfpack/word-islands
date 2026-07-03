import { describe, it, expect } from 'vitest';
import { videoEmbedUrl } from './video.js';

describe('videoEmbedUrl', () => {
  it('converts a youtube watch URL', () => {
    expect(videoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'
    );
  });

  it('converts a youtu.be short link', () => {
    expect(videoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'
    );
  });

  it('converts a shorts URL', () => {
    expect(videoEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'
    );
  });

  it('converts a watch URL with extra query params', () => {
    expect(videoEmbedUrl('https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ&t=10')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'
    );
  });

  it('accepts a bare 11-character video id', () => {
    expect(videoEmbedUrl('dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'
    );
  });

  it('passes through an existing embed URL', () => {
    expect(videoEmbedUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'
    );
  });

  it('returns null for empty, missing, or non-youtube values', () => {
    expect(videoEmbedUrl('')).toBeNull();
    expect(videoEmbedUrl(undefined)).toBeNull();
    expect(videoEmbedUrl(null)).toBeNull();
    expect(videoEmbedUrl('https://example.com/cat.mp4')).toBeNull();
    expect(videoEmbedUrl('not a url')).toBeNull();
  });
});
