"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = arrayEach;
function arrayEach(array, iterator) {
  for (var i = 0, len = array.length; i < len; ++i) {
    iterator(array[i], i);
  }
}
module.exports = exports["default"];