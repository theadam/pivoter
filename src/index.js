import { hasAny } from './utils';
import { addPoints } from './points';
import { reduceData } from './reduce';
import { getSorter, toDataSortWith } from './sort';
import { flattenGroups } from './flatten';

function handleSorts(baseConfig, newConfig) {
  if (!hasAny(newConfig, ['groupSorts', 'dataSortWith', 'dataSortBy'])) return baseConfig;
  return { ...baseConfig, dataSortWith: undefined, dataSortBy: undefined, groupSorts: undefined };
}

function addInitialValue(config) {
  if (config.initialValue !== undefined) return config;
  return { ...config, initialValue: {} };
}

function buildConfig(config, newConfig) {
  return addInitialValue(Object.keys(newConfig).reduce((acc, k) => (
    { ...acc, [k]: newConfig[k] }
  ), handleSorts(config, newConfig)));
}

function stage3(config, data) {
  console.log('Running stage 3');
  const sorter = getSorter(
    config.groups,
    config.groupSorts,
    toDataSortWith(config.dataSortWith, config.dataSortBy, config.dataSortDir),
  );
  const flattened = flattenGroups(data.withPoints.groups, sorter);
  return {
    data: {
      ...data,
      flattened,
    },
    config,
  };
}

function stage2(config, data) {
  console.log('Running Stage 2');
  const withPoints = addPoints(data.reduced, config.dataPoints);
  return stage3(config, {
    ...data,
    withPoints,
    ...withPoints, // { groups, total }
  });
}

function stage1(config) {
  console.log('Running Stage 1');
  return stage2(config, {
    reduced: reduceData(config.input, config.groups, config.reducer, config.initialValue),
  });
}

function getStage(newConfig) {
  if (hasAny(newConfig, ['input', 'groups', 'reducer', 'initialValue'])) {
    return stage1;
  } else if (hasAny(newConfig, ['dataPoints'])) {
    return stage2;
  } else if (hasAny(newConfig, ['groupSorts', 'dataSortWith', 'dataSortBy', 'dataSortDir'])) {
    return stage3;
  }

  return (config, data) => ({ data, config });
}

export function pivot(config, data, stage = stage1) {
  return stage(config, data);
}

export default function Pivoter(baseConfig) {
  let listeners = [];
  let data;
  let config = {};

  const pivoter = {
    update(newConfig = {}) {
      config = buildConfig(config, newConfig);

      const stage = getStage(newConfig);
      const result = pivot(config, data, stage);

      config = result.config;
      data = result.data;

      listeners.forEach(l => l(data, config));
      return pivoter;
    },
    subscribe(subscriber) {
      subscriber(data, config);
      listeners.push(subscriber);
      return pivoter;
    },
    unsubscribe(subscriber) {
      listeners = listeners.filter(v => v !== subscriber);
      return pivoter;
    },
  };

  pivoter.update(baseConfig);
  return pivoter;
}
