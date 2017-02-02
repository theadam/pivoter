"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.reduceData = reduceData;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function makeGroupReducer(groups, reduce) {
  var basePath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  var _groups = _toArray(groups),
      hg = _groups[0],
      tg = _groups.slice(1);

  var next = tg.length ? function (path) {
    return makeGroupReducer(tg, reduce, path);
  } : function () {
    return function () {
      return undefined;
    };
  };

  return function groupReducer(acc, _ref) {
    var point = _ref.point,
        projection = _ref.projection;

    var key = projection[hg.name];
    var path = basePath.concat(key);
    var prev = acc[key] || {};
    return _extends({}, acc, _defineProperty({}, key, {
      reduced: reduce(prev.reduced || {}, point),
      path: path,
      points: (prev.points || []).concat([point]),
      projection: projection,
      subGroups: next(path)(prev.subGroups || {}, { point: point, projection: projection })
    }));
  };
}

function projectGroups(groups) {
  return function projector(point) {
    var projection = groups.reduce(function (acc, v) {
      return _extends({}, acc, _defineProperty({}, v.name, v.selector(point)));
    }, {});
    return {
      point: point,
      projection: projection
    };
  };
}

function combineReducers(obj) {
  var keys = Object.keys(obj);
  return function combinedReducer(acc, v) {
    return keys.reduce(function (state, key) {
      var reducer = obj[key];
      return _extends({}, state, _defineProperty({}, key, reducer(state[key], v)));
    }, acc || {});
  };
}

function reduceData(data, groups, reducer, initialValue) {
  var projector = projectGroups(groups);

  var groupReducer = makeGroupReducer(groups, reducer);
  var projectedGroupReducer = function projectedReducer(acc, v) {
    if (groups.length === 0) return acc;
    var projected = projector(v);
    return groupReducer(acc, projected);
  };

  var combined = combineReducers({
    total: reducer,
    groups: projectedGroupReducer
  });

  return data.reduce(combined, { total: initialValue, groups: initialValue });
}