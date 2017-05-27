'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = applyMediaRulesInOrder;

var _arrayReduce = require('./arrayReduce');

var _arrayReduce2 = _interopRequireDefault(_arrayReduce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function applyMediaRulesInOrder(order) {
  return (0, _arrayReduce2.default)(order, function (mediaRules, query) {
    mediaRules[query] = '';
    return mediaRules;
  }, {});
}
module.exports = exports['default'];