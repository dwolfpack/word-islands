import { describe, it, expect } from 'vitest';
import { t, STRINGS } from './i18n.js';

describe('i18n', () => {
  it('returns the English string', () => {
    expect(t('en', 'title')).toBe('Word Islands');
  });

  it('returns the Hebrew string', () => {
    expect(t('he', 'title')).toBe('איי המילים');
  });

  it('falls back to English for a missing Hebrew key, and to the key itself if unknown', () => {
    expect(t('he', 'noSuchKey')).toBe('noSuchKey');
  });

  it('has a Hebrew translation for every English key', () => {
    for (const key of Object.keys(STRINGS.en)) {
      expect(STRINGS.he[key], `missing Hebrew for "${key}"`).toBeTruthy();
    }
  });
});
