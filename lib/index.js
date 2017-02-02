'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.pivot = pivot;
exports.default = Pivoter;

var _utils = require('./utils');

var _points = require('./points');

var _reduce = require('./reduce');

var _sort = require('./sort');

var _flatten = require('./flatten');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function handleSorts(baseConfig, newConfig) {
  if (!(0, _utils.needsChange)(baseConfig, newConfig, ['groupSorts', 'dataSortWith', 'dataSortBy'])) return baseConfig;
  return _extends({}, baseConfig, { dataSortWith: undefined, dataSortBy: undefined, groupSorts: undefined });
}

function addDefaults(_ref) {
  var _ref$initialValue = _ref.initialValue,
      initialValue = _ref$initialValue === undefined ? {} : _ref$initialValue,
      _ref$flattener = _ref.flattener,
      flattener = _ref$flattener === undefined ? _flatten.flattenGroup : _ref$flattener,
      rest = _objectWithoutProperties(_ref, ['initialValue', 'flattener']);

  return _extends({}, rest, {
    flattener: flattener,
    initialValue: initialValue
  });
}

function buildConfig(config, newConfig) {
  return addDefaults(Object.keys(newConfig).reduce(function (acc, k) {
    return _extends({}, acc, _defineProperty({}, k, newConfig[k]));
  }, handleSorts(config, newConfig)));
}

function stage3(config, data) {
  var sorter = (0, _sort.getSorter)(config.groups, config.groupSorts, (0, _sort.toDataSortWith)(config.dataSortWith, config.dataSortBy, config.dataSortDir));
  var flattened = (0, _flatten.flattenGroups)(data.withPoints.groups, sorter, config.flattener);
  return {
    data: _extends({}, data, {
      flattened: flattened
    }),
    config: config
  };
}

function stage2(config, data) {
  var withPoints = (0, _points.addPoints)(data.reduced, config.dataPoints);
  return stage3(config, _extends({}, data, {
    withPoints: withPoints,
    groups: withPoints.groups,
    total: {
      data: withPoints.total,
      reduced: data.reduced.total
    }
  }));
}

function stage1(config) {
  return stage2(config, {
    reduced: (0, _reduce.reduceData)(config.input, config.groups, config.reducer, config.initialValue)
  });
}

function getStage(config, newConfig) {
  if ((0, _utils.needsChange)(config, newConfig, ['input', 'groups', 'reducer', 'initialValue'])) {
    return stage1;
  } else if ((0, _utils.needsChange)(config, newConfig, ['dataPoints'])) {
    return stage2;
  } else if ((0, _utils.needsChange)(config, newConfig, ['groupSorts', 'dataSortWith', 'dataSortBy', 'dataSortDir'])) {
    return stage3;
  }

  return function (conf, data) {
    return { data: data, config: conf };
  };
}

function pivot(config, data) {
  var stage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : stage1;

  return stage(config, data);
}

function Pivoter(baseConfig) {
  var listeners = [];
  var data = void 0;
  var config = {};

  var pivoter = {
    update: function update() {
      var newConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var built = buildConfig(config, newConfig);

      var stage = getStage(config, built);
      var result = pivot(built, data, stage);

      config = result.config;
      data = result.data;

      listeners.forEach(function (l) {
        return l(data, config);
      });
      return pivoter;
    },
    subscribe: function subscribe(subscriber) {
      subscriber(data, config);
      listeners.push(subscriber);
      return pivoter;
    },
    unsubscribe: function unsubscribe(subscriber) {
      listeners = listeners.filter(function (v) {
        return v !== subscriber;
      });
      return pivoter;
    }
  };

  pivoter.update(baseConfig);
  return pivoter;
}