'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cssifyMediaQueryRules;
function cssifyMediaQueryRules(mediaQuery, mediaQueryRules) {
  if (mediaQueryRules) {
    return '@media ' + mediaQuery + '{' + mediaQueryRules + '}';
  }

  return '';
}
module.exports = exports['default'];