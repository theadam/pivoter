import { chain } from './utils';

export function flattenGroups(data, sorter, level = 0) {
  if (!data) return [];
  const levelData = Object.values(data);
  if (levelData.length === 0) return [];

  return chain(sorter(levelData, level), row => [
    { ...row, level },
    ...flattenGroups(row.subGroups, sorter, level + 1),
  ]);
}
