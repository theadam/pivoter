import { unornull, toLower } from './utils';

function genericCompare(a, b) {
  if (unornull(a) && unornull(b)) return 0;
  if (unornull(b)) return -1;
  if (unornull(a)) return 1;

  const al = toLower(a);
  const bl = toLower(b);
  if (al < bl) return -1;
  else if (al > bl) return 1;
  return 0;
}

export function createSort(compare) {
  return function createdSort(ary) {
    return ary.slice().sort(compare);
  };
}

export const compares = {
  asc: genericCompare,
  desc: (a, b) => -genericCompare(a, b),
};

function getSingleCompare(s) {
  if (typeof s === 'function') return s;
  const compare = compares[String(s).toLowerCase()];
  if (!compare) throw new Error(`Could not get sort for arg ${s}.  Expecting 'asc' or 'desc'`);
  return compare;
}

function levelCompareCreator(levels) {
  return function levelCompare(level) {
    return levels[level];
  };
}

function getGroupSorter(groupSorts, groups) {
  if (!Array.isArray(groupSorts)) throw new Error('groupSorts must be an array');

  const levels = groups
    .map((v, i) => groupSorts[i] || compares.asc)
    .map(getSingleCompare);

  const levelToCompare = levelCompareCreator(levels);

  return (list, level) => {
    const compare = levelToCompare(level);
    const groupName = groups[level].name;
    return createSort((a, b) => {
      const aval = a.projection[groupName];
      const bval = b.projection[groupName];
      return compare(aval, bval);
    })(list);
  };
}


export function getSorter(groups, groupSorts, dataSortWith) {
  if (!groupSorts && !dataSortWith) return getGroupSorter([], groups);
  if (groupSorts && dataSortWith) throw new Error('You can only specify one type of sort (group or data)');
  if (groupSorts) return getGroupSorter(groupSorts, groups);
  return createSort(dataSortWith);
}

function dataPathGetter(path) {
  return function pathGetter(obj) {
    try {
      return path.reduce((acc, v) => acc[v], obj.data);
    } catch (e) {
      return undefined;
    }
  };
}

function toDataSelector(s) {
  if (typeof s === 'function') return s;
  if (Array.isArray(s)) return dataPathGetter(s);
  return dataPathGetter(String(s).split('.'));
}

function compareBy(compare) {
  return function makeCompare(by) {
    return function comparer(a, b) {
      return compare(by(a), by(b));
    };
  };
}

function byToWith(sortBy, dir) {
  const compareFn = compares[dir];
  if (!compareFn) throw new Error(`Could not get sort for arg ${dir}.  Expecting 'asc' or 'desc'`);
  const compareFns = [].concat(sortBy).map(toDataSelector).map(compareBy(compareFn));

  return (a, b) =>
     compareFns.reduce((acc, c) => {
       if (acc !== 0) return acc;
       return c(a, b);
     }, 0);
}

export function toDataSortWith(dataSortWith, dataSortBy, dataSortDir = 'asc') {
  if (dataSortWith && dataSortBy) throw new Error('Cannot use dataSortWith with dataSortBy');
  if (!dataSortBy) return dataSortWith;
  return byToWith(dataSortBy, dataSortDir);
}
