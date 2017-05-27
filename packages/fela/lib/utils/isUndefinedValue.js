'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isUndefinedValue;
function isUndefinedValue(value) {
  return value === undefined || typeof value === 'string' && value.indexOf('undefined') !== -1;
}
module.exports = exports['default'];