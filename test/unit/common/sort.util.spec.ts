import { describe, it, expect } from 'vitest';
import { sortItems } from '../../../src/common/utils/sort.util';

describe('sortItems', () => {
  it('should sort strings in ascending order', () => {
    const items = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];

    const result = sortItems(items, 'name', 'asc');

    expect(result).toEqual([
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
    ]);
  });

  it('should sort strings in descending order', () => {
    const items = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];

    const result = sortItems(items, 'name', 'desc');

    expect(result).toEqual([
      { name: 'Charlie' },
      { name: 'Bob' },
      { name: 'Alice' },
    ]);
  });

  it('should sort numbers in ascending order', () => {
    const items = [{ value: 30 }, { value: 10 }, { value: 20 }];

    const result = sortItems(items, 'value', 'asc');

    expect(result).toEqual([
      { value: 10 },
      { value: 20 },
      { value: 30 },
    ]);
  });

  it('should sort dates in ascending order', () => {
    const items = [
      { createdAt: new Date('2026-04-03') },
      { createdAt: new Date('2026-04-01') },
      { createdAt: new Date('2026-04-02') },
    ];

    const result = sortItems(items, 'createdAt', 'asc');

    expect(result).toEqual([
      { createdAt: new Date('2026-04-01') },
      { createdAt: new Date('2026-04-02') },
      { createdAt: new Date('2026-04-03') },
    ]);
  });

  it('should keep original order for equal primitive values', () => {
    const items = [
      { name: 'Same', id: 1 },
      { name: 'Same', id: 2 },
    ];

    const result = sortItems(items, 'name', 'asc');

    expect(result).toEqual(items);
  });

  it('should handle undefined values', () => {
    const items = [
      { name: 'Bob' },
      { name: undefined },
      { name: 'Alice' },
    ];

    const result = sortItems(items, 'name', 'asc');

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.name)).toContain('Alice');
    expect(result.map((item) => item.name)).toContain('Bob');
  });

  it('should return a new array instance', () => {
    const items = [{ name: 'B' }, { name: 'A' }];

    const result = sortItems(items, 'name', 'asc');

    expect(result).not.toBe(items);
    expect(items).toEqual([{ name: 'B' }, { name: 'A' }]);
  });

  it('should sort with null values last in ascending order', () => {
  const items = [
    { value: null },
    { value: 10 },
    { value: null },
  ];

  const result = sortItems(items, 'value', 'asc');

  expect(result.map((i) => i.value)).toEqual([10, null, null]);
});

});