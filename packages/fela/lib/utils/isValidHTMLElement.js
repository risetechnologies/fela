"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isValidHTMLElement;
function isValidHTMLElement(mountNode) {
  return mountNode && mountNode.nodeType === 1;
}
module.exports = exports["default"];