'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = combineRules;

var _felaUtils = require('fela-utils');

function combineRules() {
  for (var _len = arguments.length, rules = Array(_len), _key = 0; _key < _len; _key++) {
    rules[_key] = arguments[_key];
  }

  return function (props, renderer) {
    return (0, _felaUtils.arrayReduce)(rules, function (style, rule) {
      return renderer._mergeStyle(style, rule(props, renderer));
    }, {});
  };
}