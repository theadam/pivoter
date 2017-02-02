'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.flattenGroup = flattenGroup;
exports.flattenGroups = flattenGroups;

var _utils = require('./utils');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function flattenGroup(group, subGroups) {
  return [group].concat(_toConsumableArray(subGroups));
}

function flattenGroups(data, sorter, flattener) {
  var level = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

  if (!data) return [];
  var levelData = Object.values(data);
  if (levelData.length === 0) return [];

  return (0, _utils.chain)(sorter(levelData, level), function (row) {
    return flattener(_extends({}, row, { level: level }), flattenGroups(row.subGroups, sorter, flattener, level + 1));
  });
}