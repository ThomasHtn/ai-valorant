import { readRotation, turnMap } from './minimap-rotation.utils';

/** In-memory Storage stand-in. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

describe('minimap rotation', () => {
  it('turns a quarter per click and remembers it per map', () => {
    const storage = memoryStorage();
    expect(readRotation('Split', storage)).toBe(0);
    expect(turnMap('Split', 0, storage)).toBe(90);
    expect(turnMap('Split', 270, storage)).toBe(0);
    expect(turnMap('Lotus', 90, storage)).toBe(180);
    expect(readRotation('split', storage)).toBe(0);
    expect(readRotation('Lotus', storage)).toBe(180);
  });

  it('falls back to no turn without storage or with a bad value', () => {
    expect(readRotation('Split', null)).toBe(0);
    const storage = memoryStorage();
    storage.setItem('valostats.minimap.rotation.split', '45');
    expect(readRotation('Split', storage)).toBe(0);
  });
});
