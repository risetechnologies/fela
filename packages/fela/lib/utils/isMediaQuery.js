'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isMediaQuery;
function isMediaQuery(property) {
  return property.substr(0, 6) === '@media';
}
module.exports = exports['default'];