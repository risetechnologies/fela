'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = isObject;
function isObject(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && !Array.isArray(value);
}
module.exports = exports['default'];