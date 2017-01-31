import { needsChange } from './utils';
import { addPoints } from './points';
import { reduceData } from './reduce';
import { getSorter, toDataSortWith } from './sort';
import { flattenGroups, flattenGroup } from './flatten';

function handleSorts(baseConfig, newConfig) {
  if (!needsChange(baseConfig, newConfig, ['groupSorts', 'dataSortWith', 'dataSortBy'])) return baseConfig;
  return { ...baseConfig, dataSortWith: undefined, dataSortBy: undefined, groupSorts: undefined };
}

function addDefaults({ initialValue = {}, flattener = flattenGroup, ...rest }) {
  return {
    ...rest,
    flattener,
    initialValue,
  };
}

function buildConfig(config, newConfig) {
  return addDefaults(Object.keys(newConfig).reduce((acc, k) => (
    { ...acc, [k]: newConfig[k] }
  ), handleSorts(config, newConfig)));
}

function stage3(config, data) {
  const sorter = getSorter(
    config.groups,
    config.groupSorts,
    toDataSortWith(config.dataSortWith, config.dataSortBy, config.dataSortDir),
  );
  const flattened = flattenGroups(data.withPoints.groups, sorter, config.flattener);
  return {
    data: {
      ...data,
      flattened,
    },
    config,
  };
}

function stage2(config, data) {
  const withPoints = addPoints(data.reduced, config.dataPoints);
  return stage3(config, {
    ...data,
    withPoints,
    ...withPoints, // { groups, total }
  });
}

function stage1(config) {
  return stage2(config, {
    reduced: reduceData(config.input, config.groups, config.reducer, config.initialValue),
  });
}

function getStage(config, newConfig) {
  if (needsChange(config, newConfig, ['input', 'groups', 'reducer', 'initialValue'])) {
    return stage1;
  } else if (needsChange(config, newConfig, ['dataPoints'])) {
    return stage2;
  } else if (needsChange(config, newConfig, ['groupSorts', 'dataSortWith', 'dataSortBy', 'dataSortDir'])) {
    return stage3;
  }

  return (conf, data) => ({ data, config: conf });
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
      const built = buildConfig(config, newConfig);

      const stage = getStage(config, built);
      const result = pivot(built, data, stage);

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
