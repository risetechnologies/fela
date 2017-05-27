'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getCSSSelector;
function getCSSSelector(className) {
  var pseudo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  return '.' + className + pseudo;
}
module.exports = exports['default'];