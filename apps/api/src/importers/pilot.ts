export function balancedPilot<T>(items: T[], categoryOf: (item: T) => string, limit?: number): T[] {
  if (!limit || items.length <= limit) return items;
  const groups = new Map<string, T[]>();
  for (const item of items) { const key = categoryOf(item) || "unknown"; groups.set(key, [...(groups.get(key) ?? []), item]); }
  const result: T[] = [];
  while (result.length < limit && groups.size) {
    for (const [key, values] of groups) {
      const item = values.shift(); if (item) result.push(item);
      if (!values.length) groups.delete(key);
      if (result.length === limit) break;
    }
  }
  return result;
}
