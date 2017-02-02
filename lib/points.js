'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.addPoints = addPoints;

var _utils = require('./utils');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function pointsFrom(reduced, dataPoints) {
  if (!dataPoints) return reduced;
  return dataPoints.reduce(function (acc, v) {
    return (
      // eslint-disable-next-line no-use-before-define
      _extends({}, acc, _defineProperty({}, v.title, pointFromGroup(reduced, v)))
    );
  }, {});
}

function pointFromGroup(reduced, dataPoint) {
  var value = dataPoint.value,
      subDataPoints = dataPoint.subDataPoints;

  try {
    var data = value(reduced);
    if (subDataPoints) return pointsFrom(data, subDataPoints);
    return data;
  } catch (e) {
    console.warn(e);
    return null;
  }
}

function withPoints(group, dataPoints) {
  if (!group) return group;
  var data = pointsFrom(group.reduced, dataPoints);
  var subGroups = group.subGroups && (0, _utils.mapObj)(group.subGroups, function (g) {
    return withPoints(g, dataPoints);
  });
  return _extends({}, group, { subGroups: subGroups, data: data });
}

function addPoints(_ref, dataPoints) {
  var total = _ref.total,
      groups = _ref.groups;

  return {
    total: withPoints({ reduced: total }, dataPoints).data,
    groups: (0, _utils.mapObj)(groups, function (g) {
      return withPoints(g, dataPoints);
    })
  };
}