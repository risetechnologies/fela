"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = arrayReduce;
function arrayReduce(array, iterator, initialValue) {
  for (var i = 0, len = array.length; i < len; ++i) {
    initialValue = iterator(initialValue, array[i]);
  }

  return initialValue;
}
module.exports = exports["default"];