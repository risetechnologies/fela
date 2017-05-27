'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mapValueToMediaQuery;

var _objectReduce = require('../utils/objectReduce');

var _objectReduce2 = _interopRequireDefault(_objectReduce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function mapValueToMediaQuery() {
  var queryValueMap = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var mapper = arguments[1];

  return (0, _objectReduce2.default)(queryValueMap, function (style, value, query) {
    if (typeof mapper === 'string') {
      style[query] = _defineProperty({}, mapper, value);
    } else {
      style[query] = mapper(value);
    }

    return style;
  }, {});
}
module.exports = exports['default'];