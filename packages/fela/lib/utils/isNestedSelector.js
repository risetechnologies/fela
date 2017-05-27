"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isNestedSelector;
var regex = /^(:|\[|>|&)/;

function isNestedSelector(property) {
  return regex.test(property);
}
module.exports = exports["default"];