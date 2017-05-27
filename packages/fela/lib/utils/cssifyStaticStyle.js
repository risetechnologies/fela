'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cssifyStaticStyle;

var _cssifyObject = require('css-in-js-utils/lib/cssifyObject');

var _cssifyObject2 = _interopRequireDefault(_cssifyObject);

var _minifyCSSString = require('./minifyCSSString');

var _minifyCSSString2 = _interopRequireDefault(_minifyCSSString);

var _processStyleWithPlugins = require('./processStyleWithPlugins');

var _processStyleWithPlugins2 = _interopRequireDefault(_processStyleWithPlugins);

var _styleTypes = require('./styleTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function cssifyStaticStyle(staticStyle, plugins) {
  if (typeof staticStyle === 'string') {
    return (0, _minifyCSSString2.default)(staticStyle);
  }

  var processedStaticStyle = (0, _processStyleWithPlugins2.default)(plugins, staticStyle, _styleTypes.STATIC_TYPE);
  return (0, _cssifyObject2.default)(processedStaticStyle);
}
module.exports = exports['default'];