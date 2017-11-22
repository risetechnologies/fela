'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = createRenderer;

var _cssifyDeclaration = require('css-in-js-utils/lib/cssifyDeclaration');

var _cssifyDeclaration2 = _interopRequireDefault(_cssifyDeclaration);

var _assignStyle = require('css-in-js-utils/lib/assignStyle');

var _assignStyle2 = _interopRequireDefault(_assignStyle);

var _felaUtils = require('fela-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function createRenderer() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var renderer = {
    listeners: [],
    keyframePrefixes: config.keyframePrefixes || ['-webkit-', '-moz-'],
    plugins: config.plugins || [],
    mediaQueryOrder: config.mediaQueryOrder || [],
    selectorPrefix: config.selectorPrefix || '',

    filterClassName: config.filterClassName || _felaUtils.isSafeClassName,

    uniqueRuleIdentifier: 0,
    uniqueKeyframeIdentifier: 0,

    // internal feature flags
    isConnectedToDOM: false,
    enableRehydration: true,

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

      var processedStyle = (0, _felaUtils.processStyleWithPlugins)(renderer, rule(props, renderer), _felaUtils.RULE_TYPE, props);
      return renderer._renderStyleToClassNames(processedStyle).slice(1);
    },
    renderKeyframe: function renderKeyframe(keyframe) {
      var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var resolvedKeyframe = keyframe(props, renderer);
      var keyframeReference = JSON.stringify(resolvedKeyframe);

      if (!renderer.cache.hasOwnProperty(keyframeReference)) {
        // use another unique identifier to ensure minimal css markup
        var animationName = (0, _felaUtils.generateAnimationName)(++renderer.uniqueKeyframeIdentifier);

        var processedKeyframe = (0, _felaUtils.processStyleWithPlugins)(renderer, resolvedKeyframe, _felaUtils.KEYFRAME_TYPE, props);

        var cssKeyframe = (0, _felaUtils.cssifyKeyframe)(processedKeyframe, animationName, renderer.keyframePrefixes);

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

      var fontReference = family + JSON.stringify(properties);
      var fontLocals = typeof properties.localAlias === 'string' ? [properties.localAlias] : properties.localAlias && properties.localAlias.constructor === Array ? properties.localAlias.slice() : [];

      if (!renderer.cache.hasOwnProperty(fontReference)) {
        var fontFamily = (0, _felaUtils.toCSSString)(family);

        // remove the localAlias since we extraced the needed info
        properties.localAlias && delete properties.localAlias;

        // TODO: proper font family generation with error proofing
        var fontFace = _extends({}, properties, {
          src: '' + fontLocals.reduce(function (agg, local) {
            return agg += ' local(' + (0, _felaUtils.checkFontUrl)(local) + '), ';
          }, '') + files.map(function (src) {
            return 'url(' + (0, _felaUtils.checkFontUrl)(src) + ') format(\'' + (0, _felaUtils.checkFontFormat)(src) + '\')';
          }).join(','),
          fontFamily: fontFamily
        });

        var cssFontFace = (0, _felaUtils.cssifyFontFace)(fontFace);

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
      var staticReference = (0, _felaUtils.generateStaticReference)(staticStyle, selector);

      if (!renderer.cache.hasOwnProperty(staticReference)) {
        var cssDeclarations = (0, _felaUtils.cssifyStaticStyle)(staticStyle, renderer);

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


    _mergeStyle: _assignStyle2.default,

    _renderStyleToClassNames: function _renderStyleToClassNames(_ref) {
      var pseudo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var media = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var support = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

      var _className = _ref._className,
          style = _objectWithoutProperties(_ref, ['_className']);

      var classNames = _className ? ' ' + _className : '';

      for (var property in style) {
        var value = style[property];

        // TODO: this whole part could be trimmed
        if ((0, _felaUtils.isObject)(value)) {
          if ((0, _felaUtils.isNestedSelector)(property)) {
            classNames += renderer._renderStyleToClassNames(value, pseudo + (0, _felaUtils.normalizeNestedProperty)(property), media, support);
          } else if ((0, _felaUtils.isMediaQuery)(property)) {
            var combinedMediaQuery = (0, _felaUtils.generateCombinedMediaQuery)(media, property.slice(6).trim());
            classNames += renderer._renderStyleToClassNames(value, pseudo, combinedMediaQuery, support);
          } else if ((0, _felaUtils.isSupport)(property)) {
            var combinedSupport = (0, _felaUtils.generateCombinedMediaQuery)(support, property.slice(9).trim());
            classNames += renderer._renderStyleToClassNames(value, pseudo, media, combinedSupport);
          } else {
            // TODO: warning
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

            var className = renderer.selectorPrefix + (0, _felaUtils.generateClassName)(renderer.getNextRuleIdentifier, renderer.filterClassName);

            var declaration = (0, _cssifyDeclaration2.default)(property, value);
            var selector = (0, _felaUtils.generateCSSSelector)(className, pseudo);

            var change = {
              type: _felaUtils.RULE_TYPE,
              className: className,
              selector: selector,
              declaration: declaration,
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
      (0, _felaUtils.arrayEach)(renderer.listeners, function (listener) {
        return listener(change);
      });
    }
  };

  // initial setup
  renderer.keyframePrefixes.push('');

  if (config.enhancers) {
    (0, _felaUtils.arrayEach)(config.enhancers, function (enhancer) {
      renderer = enhancer(renderer);
    });
  }

  return renderer;
}