import islands57 from './islands57.json';
import islands810 from './islands810.json';

export const MANIFEST = {
  '5-7': islands57,
  '8-10': islands810,
};

export const PATHS = ['5-7', '8-10'];

// Resolves a review key "<islandId>:<english>" to its word object for the given
// age path, or null if the island/word no longer exists in the content.
export function wordForKey(path, key) {
  const sep = key.indexOf(':');
  if (sep === -1) return null;
  const islandId = key.slice(0, sep);
  const english = key.slice(sep + 1);
  const island = (MANIFEST[path] || []).find((i) => i.id === islandId);
  return island ? island.words.find((w) => w.english === english) || null : null;
}
