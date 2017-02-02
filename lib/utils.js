'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.toLower = toLower;
exports.unornull = unornull;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var chain = exports.chain = function chain(data, f) {
  return data.reduce(function (acc, v) {
    return acc.concat(f(v));
  }, []);
};

var hasProp = function hasProp(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

var needsChange = exports.needsChange = function needsChange(old, obj, props) {
  return props.some(function (prop) {
    return hasProp(obj, prop) && obj[prop] !== old[prop];
  });
};

var mapObj = exports.mapObj = function mapObj(obj, fn) {
  return Object.keys(obj).reduce(function (acc, k) {
    return _extends({}, acc, _defineProperty({}, k, fn(obj[k])));
  }, {});
};

function toLower(s) {
  if (typeof s !== 'string') return s;
  return s.toLowerCase();
}

function unornull(a) {
  return a === undefined || a === null;
}