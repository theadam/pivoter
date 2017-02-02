'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compares = undefined;
exports.createSort = createSort;
exports.getSorter = getSorter;
exports.toDataSortWith = toDataSortWith;

var _utils = require('./utils');

function genericCompare(a, b) {
  if ((0, _utils.unornull)(a) && (0, _utils.unornull)(b)) return 0;
  if ((0, _utils.unornull)(b)) return -1;
  if ((0, _utils.unornull)(a)) return 1;

  var al = (0, _utils.toLower)(a);
  var bl = (0, _utils.toLower)(b);
  if (al < bl) return -1;else if (al > bl) return 1;
  return 0;
}

function createSort(compare) {
  return function createdSort(ary) {
    return ary.slice().sort(compare);
  };
}

var compares = exports.compares = {
  asc: genericCompare,
  desc: function desc(a, b) {
    return -genericCompare(a, b);
  }
};

function getSingleCompare(s) {
  if (typeof s === 'function') return s;
  var compare = compares[String(s).toLowerCase()];
  if (!compare) throw new Error('Could not get sort for arg ' + s + '.  Expecting \'asc\' or \'desc\'');
  return compare;
}

function levelCompareCreator(levels) {
  return function levelCompare(level) {
    return levels[level];
  };
}

function getGroupSorter(groupSorts, groups) {
  if (!Array.isArray(groupSorts)) throw new Error('groupSorts must be an array');

  var levels = groups.map(function (v, i) {
    return groupSorts[i] || compares.asc;
  }).map(getSingleCompare);

  var levelToCompare = levelCompareCreator(levels);

  return function (list, level) {
    var compare = levelToCompare(level);
    var groupName = groups[level].name;
    return createSort(function (a, b) {
      var aval = a.projection[groupName];
      var bval = b.projection[groupName];
      return compare(aval, bval);
    })(list);
  };
}

function getSorter(groups, groupSorts, dataSortWith) {
  if (!groupSorts && !dataSortWith) return getGroupSorter([], groups);
  if (groupSorts && dataSortWith) throw new Error('You can only specify one type of sort (group or data)');
  if (groupSorts) return getGroupSorter(groupSorts, groups);
  return createSort(dataSortWith);
}

function dataPathGetter(path) {
  return function pathGetter(obj) {
    try {
      return path.reduce(function (acc, v) {
        return acc[v];
      }, obj.data);
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
  var compareFn = compares[dir];
  if (!compareFn) throw new Error('Could not get sort for arg ' + dir + '.  Expecting \'asc\' or \'desc\'');
  var compareFns = [].concat(sortBy).map(toDataSelector).map(compareBy(compareFn));

  return function (a, b) {
    return compareFns.reduce(function (acc, c) {
      if (acc !== 0) return acc;
      return c(a, b);
    }, 0);
  };
}

function toDataSortWith(dataSortWith, dataSortBy) {
  var dataSortDir = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'asc';

  if (dataSortWith && dataSortBy) throw new Error('Cannot use dataSortWith with dataSortBy');
  if (!dataSortBy) return dataSortWith;
  return byToWith(dataSortBy, dataSortDir);
}