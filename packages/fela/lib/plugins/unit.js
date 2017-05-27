'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = unit;

var _isUnitlessProperty = require('css-in-js-utils/lib/isUnitlessProperty');

var _isUnitlessProperty2 = _interopRequireDefault(_isUnitlessProperty);

var _isObject = require('../utils/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _warning = require('../utils/warning');

var _warning2 = _interopRequireDefault(_warning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addUnitIfNeeded(property, value, propertyUnit) {
  var valueType = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  /* eslint-disable eqeqeq */
  if (valueType === 'number' || valueType === 'string' && value == parseFloat(value)) {
    value += propertyUnit;
  }
  /* eslint-enable */
  return value;
}

function addUnit(style, defaultUnit, propertyMap) {
  var _loop = function _loop(property) {
    if (!(0, _isUnitlessProperty2.default)(property)) {
      var cssValue = style[property];
      var propertyUnit = propertyMap[property] || defaultUnit;

      if ((0, _isObject2.default)(cssValue)) {
        style[property] = addUnit(cssValue, defaultUnit, propertyMap);
      } else if (Array.isArray(cssValue)) {
        style[property] = cssValue.map(function (val) {
          return addUnitIfNeeded(property, val, propertyUnit);
        });
      } else {
        style[property] = addUnitIfNeeded(property, cssValue, propertyUnit);
      }
    }
  };

  for (var property in style) {
    _loop(property);
  }

  return style;
}

function unit() {
  var defaultUnit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'px';
  var propertyMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  process.env.NODE_ENV !== "production" ? (0, _warning2.default)(defaultUnit.match(/ch|em|ex|rem|vh|vw|vmin|vmax|px|cm|mm|in|pc|pt|mozmm|%/) !== null, 'You are using an invalid unit "' + defaultUnit + '". Consider using one of the following ch, em, ex, rem, vh, vw, vmin, vmax, px, cm, mm, in, pc, pt, mozmm or %.') : void 0;

  return function (style) {
    return addUnit(style, defaultUnit, propertyMap);
  };
}
module.exports = exports['default'];