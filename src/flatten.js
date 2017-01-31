import { chain } from './utils';

export function flattenGroup(group, subGroups) {
  return [
    group,
    ...subGroups,
  ];
}

export function flattenGroups(data, sorter, flattener, level = 0) {
  if (!data) return [];
  const levelData = Object.values(data);
  if (levelData.length === 0) return [];

  return chain(sorter(levelData, level), row => flattener(
    { ...row, level },
    flattenGroups(row.subGroups, sorter, flattener, level + 1),
  ));
}
