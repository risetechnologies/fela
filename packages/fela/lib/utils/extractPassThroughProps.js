'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractPassThroughProps;

var _arrayReduce = require('./arrayReduce');

var _arrayReduce2 = _interopRequireDefault(_arrayReduce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function extractPassThroughProps(passThrough, ruleProps) {
  return (0, _arrayReduce2.default)(passThrough, function (output, property) {
    output[property] = ruleProps[property];
    return output;
  }, {});
}
module.exports = exports['default'];