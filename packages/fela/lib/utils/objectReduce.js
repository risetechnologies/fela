"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = objectReduce;
function objectReduce(object, iterator, initialValue) {
  for (var key in object) {
    initialValue = iterator(initialValue, object[key], key);
  }

  return initialValue;
}
module.exports = exports["default"];