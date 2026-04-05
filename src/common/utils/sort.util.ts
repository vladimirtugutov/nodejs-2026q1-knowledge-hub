export function sortItems<T extends Record<string, any>>(
  items: T[],
  sortBy?: string,
  order: 'asc' | 'desc' = 'asc',
): T[] {
  if (!sortBy) {
    return items;
  }

  return [...items].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === bValue) {
      return 0;
    }

    if (aValue === undefined || aValue === null) {
      return order === 'asc' ? 1 : -1;
    }

    if (bValue === undefined || bValue === null) {
      return order === 'asc' ? -1 : 1;
    }

    if (aValue > bValue) {
      return order === 'asc' ? 1 : -1;
    }

    if (aValue < bValue) {
      return order === 'asc' ? -1 : 1;
    }

    return 0;
  });
}
