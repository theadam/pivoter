function makeGroupReducer(groups, reduce, initialValue, basePath = []) {
  const [hg, ...tg] = groups;
  const next = tg.length ?
    (path => makeGroupReducer(tg, reduce, initialValue, path)) :
    () => () => undefined;

  return function groupReducer(acc, { point, projection }) {
    const key = projection[hg.name];
    const path = basePath.concat(key);
    const prev = acc[key] || {};
    return {
      ...acc,
      [key]: {
        reduced: reduce(prev.reduced || initialValue, point),
        path,
        points: (prev.points || []).concat([point]),
        projection,
        subGroups: next(path)((prev.subGroups || {}), { point, projection }),
      },
    };
  };
}

function projectGroups(groups) {
  return function projector(point) {
    const projection = groups.reduce((acc, v) => ({ ...acc, [v.name]: v.selector(point) }), {});
    return {
      point,
      projection,
    };
  };
}

function combineReducers(obj) {
  const keys = Object.keys(obj);
  return function combinedReducer(acc, v) {
    return keys.reduce((state, key) => {
      const reducer = obj[key];
      return { ...state, [key]: reducer(state[key], v) };
    }, acc || {});
  };
}

export function reduceData(data, groups, reducer, initialValue) {
  const projector = projectGroups(groups);

  const groupReducer = makeGroupReducer(groups, reducer, initialValue);
  const projectedGroupReducer = function projectedReducer(acc, v) {
    if (groups.length === 0) return acc;
    const projected = projector(v);
    return groupReducer(acc, projected);
  };

  const combined = combineReducers({
    total: reducer,
    groups: projectedGroupReducer,
  });

  return data.reduce(combined, { total: initialValue, groups: {} });
}

