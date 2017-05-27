'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = createRenderer;

var _cssifyDeclaration = require('css-in-js-utils/lib/cssifyDeclaration');

var _cssifyDeclaration2 = _interopRequireDefault(_cssifyDeclaration);

var _cssifyFontFace = require('./utils/cssifyFontFace');

var _cssifyFontFace2 = _interopRequireDefault(_cssifyFontFace);

var _cssifyKeyframe = require('./utils/cssifyKeyframe');

var _cssifyKeyframe2 = _interopRequireDefault(_cssifyKeyframe);

var _cssifyMediaQueryRules = require('./utils/cssifyMediaQueryRules');

var _cssifyMediaQueryRules2 = _interopRequireDefault(_cssifyMediaQueryRules);

var _generateAnimationName = require('./utils/generateAnimationName');

var _generateAnimationName2 = _interopRequireDefault(_generateAnimationName);

var _generateClassName = require('./utils/generateClassName');

var _generateClassName2 = _interopRequireDefault(_generateClassName);

var _generateCombinedMediaQuery = require('./utils/generateCombinedMediaQuery');

var _generateCombinedMediaQuery2 = _interopRequireDefault(_generateCombinedMediaQuery);

var _generateCSSRule = require('./utils/generateCSSRule');

var _generateCSSRule2 = _interopRequireDefault(_generateCSSRule);

var _generateCSSSelector = require('./utils/generateCSSSelector');

var _generateCSSSelector2 = _interopRequireDefault(_generateCSSSelector);

var _cssifyStaticStyle = require('./utils/cssifyStaticStyle');

var _cssifyStaticStyle2 = _interopRequireDefault(_cssifyStaticStyle);

var _generateStaticReference = require('./utils/generateStaticReference');

var _generateStaticReference2 = _interopRequireDefault(_generateStaticReference);

var _isMediaQuery = require('./utils/isMediaQuery');

var _isMediaQuery2 = _interopRequireDefault(_isMediaQuery);

var _isNestedSelector = require('./utils/isNestedSelector');

var _isNestedSelector2 = _interopRequireDefault(_isNestedSelector);

var _isUndefinedValue = require('./utils/isUndefinedValue');

var _isUndefinedValue2 = _interopRequireDefault(_isUndefinedValue);

var _isObject = require('./utils/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _normalizeNestedProperty = require('./utils/normalizeNestedProperty');

var _normalizeNestedProperty2 = _interopRequireDefault(_normalizeNestedProperty);

var _applyMediaRulesInOrder = require('./utils/applyMediaRulesInOrder');

var _applyMediaRulesInOrder2 = _interopRequireDefault(_applyMediaRulesInOrder);

var _processStyleWithPlugins = require('./utils/processStyleWithPlugins');

var _processStyleWithPlugins2 = _interopRequireDefault(_processStyleWithPlugins);

var _toCSSString = require('./utils/toCSSString');

var _toCSSString2 = _interopRequireDefault(_toCSSString);

var _checkFontFormat = require('./utils/checkFontFormat');

var _checkFontFormat2 = _interopRequireDefault(_checkFontFormat);

var _checkFontUrl = require('./utils/checkFontUrl');

var _checkFontUrl2 = _interopRequireDefault(_checkFontUrl);

var _objectReduce = require('./utils/objectReduce');

var _objectReduce2 = _interopRequireDefault(_objectReduce);

var _arrayEach = require('./utils/arrayEach');

var _arrayEach2 = _interopRequireDefault(_arrayEach);

var _styleTypes = require('./utils/styleTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createRenderer() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var renderer = {
    listeners: [],
    keyframePrefixes: config.keyframePrefixes || ['-webkit-', '-moz-'],
    plugins: config.plugins || [],
    mediaQueryOrder: config.mediaQueryOrder || [],
    selectorPrefix: config.selectorPrefix || '',
    fontFaces: '',
    keyframes: '',
    statics: '',
    rules: '',
    // apply media rules in an explicit order to ensure
    // correct media query execution order
    mediaRules: (0, _applyMediaRulesInOrder2.default)(config.mediaQueryOrder || []),
    uniqueRuleIdentifier: 0,
    uniqueKeyframeIdentifier: 0,
    // use a flat cache object with pure string references
    // to achieve maximal lookup performance and memoization speed
    cache: {},
    propCache: {},

    renderRule: function renderRule(rule) {
      var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var processedStyle = (0, _processStyleWithPlugins2.default)(renderer.plugins, rule(props), _styleTypes.RULE_TYPE);
      return renderer._renderStyleToClassNames(processedStyle).slice(1);
    },
    renderKeyframe: function renderKeyframe(keyframe) {
      var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var resolvedKeyframe = keyframe(props);
      var keyframeReference = JSON.stringify(resolvedKeyframe);

      if (!renderer.cache.hasOwnProperty(keyframeReference)) {
        // use another unique identifier to ensure minimal css markup
        var animationName = (0, _generateAnimationName2.default)(++renderer.uniqueKeyframeIdentifier);

        var processedKeyframe = (0, _processStyleWithPlugins2.default)(renderer.plugins, resolvedKeyframe, _styleTypes.KEYFRAME_TYPE);

        var cssKeyframe = (0, _cssifyKeyframe2.default)(processedKeyframe, animationName, renderer.keyframePrefixes);

        renderer.cache[keyframeReference] = animationName;
        renderer.keyframes += cssKeyframe;

        renderer._emitChange({
          name: animationName,
          keyframe: cssKeyframe,
          type: _styleTypes.KEYFRAME_TYPE
        });
      }

      return renderer.cache[keyframeReference];
    },
    renderFont: function renderFont(family, files) {
      var properties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var fontReference = family + JSON.stringify(properties);

      if (!renderer.cache.hasOwnProperty(fontReference)) {
        var fontFamily = (0, _toCSSString2.default)(family);

        // TODO: proper font family generation with error proofing
        var fontFace = _extends({}, properties, {
          src: files.map(function (src) {
            return 'url(' + (0, _checkFontUrl2.default)(src) + ') format(\'' + (0, _checkFontFormat2.default)(src) + '\')';
          }).join(','),
          fontFamily: fontFamily
        });

        var cssFontFace = (0, _cssifyFontFace2.default)(fontFace);
        renderer.cache[fontReference] = fontFamily;
        renderer.fontFaces += cssFontFace;

        renderer._emitChange({
          fontFamily: fontFamily,
          fontFace: cssFontFace,
          type: _styleTypes.FONT_TYPE
        });
      }

      return renderer.cache[fontReference];
    },
    renderStatic: function renderStatic(staticStyle, selector) {
      var staticReference = (0, _generateStaticReference2.default)(staticStyle, selector);

      if (!renderer.cache.hasOwnProperty(staticReference)) {
        var cssDeclarations = (0, _cssifyStaticStyle2.default)(staticStyle, renderer.plugins);
        renderer.cache[staticReference] = '';

        if (typeof staticStyle === 'string') {
          renderer.statics += cssDeclarations;
          renderer._emitChange({
            type: _styleTypes.STATIC_TYPE,
            css: cssDeclarations
          });
        } else if (selector) {
          renderer.statics += (0, _generateCSSRule2.default)(selector, cssDeclarations);
          renderer._emitChange({
            selector: selector,
            declaration: cssDeclarations,
            type: _styleTypes.RULE_TYPE,
            static: true,
            media: ''
          });
        }
      }
    },
    renderToString: function renderToString() {
      var basicCSS = renderer.fontFaces + renderer.statics + renderer.keyframes + renderer.rules;

      return (0, _objectReduce2.default)(renderer.mediaRules, function (css, rules, query) {
        return css + (0, _cssifyMediaQueryRules2.default)(query, rules);
      }, basicCSS);
    },
    subscribe: function subscribe(callback) {
      renderer.listeners.push(callback);

      return {
        unsubscribe: function unsubscribe() {
          return renderer.listeners.splice(renderer.listeners.indexOf(callback), 1);
        }
      };
    },
    clear: function clear() {
      renderer.fontFaces = '';
      renderer.keyframes = '';
      renderer.statics = '';
      renderer.rules = '';
      renderer.mediaRules = (0, _applyMediaRulesInOrder2.default)(renderer.mediaQueryOrder);
      renderer.uniqueRuleIdentifier = 0;
      renderer.uniqueKeyframeIdentifier = 0;
      renderer.cache = {};
      renderer.propCache = {};

      renderer._emitChange({ type: _styleTypes.CLEAR_TYPE });
    },
    _renderStyleToClassNames: function _renderStyleToClassNames(style) {
      var pseudo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var media = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      var classNames = '';

      for (var property in style) {
        var value = style[property];

        if ((0, _isObject2.default)(value)) {
          if ((0, _isNestedSelector2.default)(property)) {
            classNames += renderer._renderStyleToClassNames(value, pseudo + (0, _normalizeNestedProperty2.default)(property), media);
          } else if ((0, _isMediaQuery2.default)(property)) {
            var combinedMediaQuery = (0, _generateCombinedMediaQuery2.default)(media, property.slice(6).trim());

            classNames += renderer._renderStyleToClassNames(value, pseudo, combinedMediaQuery);
          } else {
            // TODO: warning
          }
        } else {
          var declarationReference = media + pseudo + property + value;

          if (!renderer.cache.hasOwnProperty(declarationReference)) {
            // we remove undefined values to enable
            // usage of optional props without side-effects
            if ((0, _isUndefinedValue2.default)(value)) {
              renderer.cache[declarationReference] = '';
              /* eslint-disable no-continue */
              continue;
              /* eslint-enable */
            }

            var className = renderer.selectorPrefix + (0, _generateClassName2.default)(++renderer.uniqueRuleIdentifier);

            renderer.cache[declarationReference] = className;
            if (!pseudo && !media) renderer.propCache[className] = property;

            var cssDeclaration = (0, _cssifyDeclaration2.default)(property, value);
            var selector = (0, _generateCSSSelector2.default)(className, pseudo);
            var cssRule = (0, _generateCSSRule2.default)(selector, cssDeclaration);

            if (media.length > 0) {
              if (!renderer.mediaRules.hasOwnProperty(media)) {
                renderer.mediaRules[media] = '';
              }

              renderer.mediaRules[media] += cssRule;
            } else {
              renderer.rules += cssRule;
            }

            renderer._emitChange({
              selector: selector,
              declaration: cssDeclaration,
              media: media,
              type: _styleTypes.RULE_TYPE
            });
          }

          classNames += ' ' + renderer.cache[declarationReference];
        }
      }

      return classNames;
    },
    _emitChange: function _emitChange(change) {
      (0, _arrayEach2.default)(renderer.listeners, function (listener) {
        return listener(change);
      });
    }
  };

  // initial setup
  renderer.keyframePrefixes.push('');
  renderer.clear();

  if (config.enhancers) {
    (0, _arrayEach2.default)(config.enhancers, function (enhancer) {
      renderer = enhancer(renderer);
    });
  }

  return renderer;
}
module.exports = exports['default'];