'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = normalizeNestedProperty;
function normalizeNestedProperty(nestedProperty) {
  if (nestedProperty.charAt(0) === '&') {
    return nestedProperty.slice(1);
  }

  return nestedProperty;
}
module.exports = exports['default'];