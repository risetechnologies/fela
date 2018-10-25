'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = createRenderer;

var _cssifyDeclaration = require('css-in-js-utils/lib/cssifyDeclaration');

var _cssifyDeclaration2 = _interopRequireDefault(_cssifyDeclaration);

var _arrayEach = require('fast-loops/lib/arrayEach');

var _arrayEach2 = _interopRequireDefault(_arrayEach);

var _isobject = require('isobject');

var _isobject2 = _interopRequireDefault(_isobject);

var _felaUtils = require('fela-utils');

var _cssifyFontFace = require('./cssifyFontFace');

var _cssifyFontFace2 = _interopRequireDefault(_cssifyFontFace);

var _cssifyKeyframe = require('./cssifyKeyframe');

var _cssifyKeyframe2 = _interopRequireDefault(_cssifyKeyframe);

var _cssifyStaticStyle = require('./cssifyStaticStyle');

var _cssifyStaticStyle2 = _interopRequireDefault(_cssifyStaticStyle);

var _generateAnimationName = require('./generateAnimationName');

var _generateAnimationName2 = _interopRequireDefault(_generateAnimationName);

var _generateClassName = require('./generateClassName');

var _generateClassName2 = _interopRequireDefault(_generateClassName);

var _generateFontSource = require('./generateFontSource');

var _generateFontSource2 = _interopRequireDefault(_generateFontSource);

var _generateStaticReference = require('./generateStaticReference');

var _generateStaticReference2 = _interopRequireDefault(_generateStaticReference);

var _getFontFormat = require('./getFontFormat');

var _getFontFormat2 = _interopRequireDefault(_getFontFormat);

var _getFontLocals = require('./getFontLocals');

var _getFontLocals2 = _interopRequireDefault(_getFontLocals);

var _getFontUrl = require('./getFontUrl');

var _getFontUrl2 = _interopRequireDefault(_getFontUrl);

var _isSafeClassName = require('./isSafeClassName');

var _isSafeClassName2 = _interopRequireDefault(_isSafeClassName);

var _toCSSString = require('./toCSSString');

var _toCSSString2 = _interopRequireDefault(_toCSSString);

var _validateSelectorPrefix = require('./validateSelectorPrefix');

var _validateSelectorPrefix2 = _interopRequireDefault(_validateSelectorPrefix);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function createRenderer() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var renderer = {
    listeners: [],
    keyframePrefixes: config.keyframePrefixes || ['-webkit-', '-moz-'],
    plugins: config.plugins || [],
    mediaQueryOrder: config.mediaQueryOrder || [],
    supportQueryOrder: config.supportQueryOrder || [],
    ruleOrder: [/^:link/, /^:visited/, /^:hover/, /^:focus-within/, /^:focus/, /^:active/],

    selectorPrefix: (0, _validateSelectorPrefix2.default)(config.selectorPrefix),
    filterClassName: config.filterClassName || _isSafeClassName2.default,
    devMode: config.devMode || false,

    uniqueRuleIdentifier: 0,
    uniqueKeyframeIdentifier: 0,

    nodes: {},
    // use a flat cache object with pure string references
    // to achieve maximal lookup performance and memoization speed
    cache: {},
    propCache: {},

    getNextRuleIdentifier: function getNextRuleIdentifier() {
      return ++renderer.uniqueRuleIdentifier;
    },
    renderRule: function renderRule(rule) {
      var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return renderer._renderStyle(rule(props, renderer), props);
    },
    renderKeyframe: function renderKeyframe(keyframe) {
      var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var resolvedKeyframe = keyframe(props, renderer);
      var keyframeReference = JSON.stringify(resolvedKeyframe);

      if (!renderer.cache.hasOwnProperty(keyframeReference)) {
        // use another unique identifier to ensure minimal css markup
        var animationName = (0, _generateAnimationName2.default)(++renderer.uniqueKeyframeIdentifier);

        var processedKeyframe = (0, _felaUtils.processStyleWithPlugins)(renderer, resolvedKeyframe, _felaUtils.KEYFRAME_TYPE, props);

        var cssKeyframe = (0, _cssifyKeyframe2.default)(processedKeyframe, animationName, renderer.keyframePrefixes);

        var change = {
          type: _felaUtils.KEYFRAME_TYPE,
          keyframe: cssKeyframe,
          name: animationName
        };

        renderer.cache[keyframeReference] = change;
        renderer._emitChange(change);
      }

      return renderer.cache[keyframeReference].name;
    },
    renderFont: function renderFont(family, files) {
      var properties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var localAlias = properties.localAlias,
          otherProperties = _objectWithoutProperties(properties, ['localAlias']);

      var fontReference = family + JSON.stringify(properties);
      var fontLocals = (0, _getFontLocals2.default)(localAlias);

      if (!renderer.cache.hasOwnProperty(fontReference)) {
        var fontFamily = (0, _toCSSString2.default)(family);

        var fontFace = _extends({}, otherProperties, {
          src: (0, _generateFontSource2.default)(files, fontLocals),
          fontFamily: fontFamily
        });

        var cssFontFace = (0, _cssifyFontFace2.default)(fontFace);

        var change = {
          type: _felaUtils.FONT_TYPE,
          fontFace: cssFontFace,
          fontFamily: fontFamily
        };

        renderer.cache[fontReference] = change;
        renderer._emitChange(change);
      }

      return renderer.cache[fontReference].fontFamily;
    },
    renderStatic: function renderStatic(staticStyle, selector) {
      var staticReference = (0, _generateStaticReference2.default)(staticStyle, selector);

      if (!renderer.cache.hasOwnProperty(staticReference)) {
        var cssDeclarations = (0, _cssifyStaticStyle2.default)(staticStyle, renderer);

        var change = {
          type: _felaUtils.STATIC_TYPE,
          css: cssDeclarations,
          selector: selector
        };

        renderer.cache[staticReference] = change;
        renderer._emitChange(change);
      }
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
      renderer.uniqueRuleIdentifier = 0;
      renderer.uniqueKeyframeIdentifier = 0;
      renderer.cache = {};
      renderer.propCache = {};

      renderer._emitChange({
        type: _felaUtils.CLEAR_TYPE
      });
    },
    _renderStyle: function _renderStyle() {
      var style = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var processedStyle = (0, _felaUtils.processStyleWithPlugins)(renderer, style, _felaUtils.RULE_TYPE, props);

      return renderer._renderStyleToClassNames(processedStyle).slice(1);
    },
    _renderStyleToClassNames: function _renderStyleToClassNames(_ref) {
      var pseudo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var media = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var support = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

      var _className = _ref._className,
          style = _objectWithoutProperties(_ref, ['_className']);

      var classNames = _className ? ' ' + _className : '';

      for (var property in style) {
        var value = style[property];

        if ((0, _isobject2.default)(value)) {
          if ((0, _felaUtils.isNestedSelector)(property)) {
            classNames += renderer._renderStyleToClassNames(value, pseudo + (0, _felaUtils.normalizeNestedProperty)(property), media, support);
          } else if ((0, _felaUtils.isMediaQuery)(property)) {
            var combinedMediaQuery = (0, _felaUtils.generateCombinedMediaQuery)(media, property.slice(6).trim());
            classNames += renderer._renderStyleToClassNames(value, pseudo, combinedMediaQuery, support);
          } else if ((0, _felaUtils.isSupport)(property)) {
            var combinedSupport = (0, _felaUtils.generateCombinedMediaQuery)(support, property.slice(9).trim());
            classNames += renderer._renderStyleToClassNames(value, pseudo, media, combinedSupport);
          } else {
            console.warn('The object key "' + property + '" is not a valid nested key in Fela. \nMaybe you forgot to add a plugin to resolve it? \nCheck http://fela.js.org/docs/basics/Rules.html#styleobject for more information.');
          }
        } else {
          var declarationReference = support + media + pseudo + property + value;

          if (!renderer.cache.hasOwnProperty(declarationReference)) {
            // we remove undefined values to enable
            // usage of optional props without side-effects
            if ((0, _felaUtils.isUndefinedValue)(value)) {
              renderer.cache[declarationReference] = {
                className: ''
                /* eslint-disable no-continue */
              };continue;
              /* eslint-enable */
            }

            var className = renderer.selectorPrefix + (0, _generateClassName2.default)(renderer.getNextRuleIdentifier, renderer.filterClassName);

            var declaration = (0, _cssifyDeclaration2.default)(property, value);
            var selector = (0, _felaUtils.generateCSSSelector)(className, pseudo);

            var change = {
              type: _felaUtils.RULE_TYPE,
              className: className,
              selector: selector,
              declaration: declaration,
              pseudo: pseudo,
              media: media,
              support: support
            };

            if (!pseudo && !media) renderer.propCache[className] = property;
            renderer.cache[declarationReference] = change;
            renderer._emitChange(change);
          }

          var cachedClassName = renderer.cache[declarationReference].className;

          // only append if we got a class cached
          if (cachedClassName) {
            classNames += ' ' + cachedClassName;
          }
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

  if (config.enhancers) {
    (0, _arrayEach2.default)(config.enhancers, function (enhancer) {
      renderer = enhancer(renderer);
    });
  }

  return renderer;
}