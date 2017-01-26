import { mapObj } from './utils';

function pointsFrom(reduced, dataPoints) {
  if (!dataPoints) return reduced;
  return dataPoints.reduce((acc, v) => (
    // eslint-disable-next-line no-use-before-define
    { ...acc, [v.title]: pointFromGroup(reduced, v) }
  ), {});
}

function pointFromGroup(reduced, dataPoint) {
  const { value, subDataPoints } = dataPoint;
  try {
    const data = value(reduced);
    if (subDataPoints) return pointsFrom(data, subDataPoints);
    return data;
  } catch (e) {
    console.warn(e);
    return null;
  }
}

function withPoints(group, dataPoints) {
  if (!group) return group;
  const data = pointsFrom(group.reduced, dataPoints);
  const subGroups = group.subGroups &&
    mapObj(group.subGroups, g => withPoints(g, dataPoints));
  return { ...group, subGroups, data };
}

export function addPoints({ total, groups }, dataPoints) {
  return {
    total: withPoints({ reduced: total }, dataPoints).data,
    groups: mapObj(groups, g => withPoints(g, dataPoints)),
  };
}

