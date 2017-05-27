"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = generateCSSRule;
function generateCSSRule(selector, cssDeclaration) {
  return selector + "{" + cssDeclaration + "}";
}
module.exports = exports["default"];