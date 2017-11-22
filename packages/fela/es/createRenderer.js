var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

import cssifyDeclaration from 'css-in-js-utils/lib/cssifyDeclaration';
import assignStyle from 'css-in-js-utils/lib/assignStyle';

import { cssifyFontFace, cssifyKeyframe, cssifyStaticStyle, generateAnimationName, generateClassName, generateCombinedMediaQuery, generateCSSRule, generateCSSSelector, generateStaticReference, isMediaQuery, isNestedSelector, isUndefinedValue, isObject, isSafeClassName, isSupport, normalizeNestedProperty, processStyleWithPlugins, toCSSString, checkFontFormat, checkFontUrl, arrayEach, STATIC_TYPE, RULE_TYPE, KEYFRAME_TYPE, FONT_TYPE, CLEAR_TYPE } from 'fela-utils';

export default function createRenderer() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var renderer = {
    listeners: [],
    keyframePrefixes: config.keyframePrefixes || ['-webkit-', '-moz-'],
    plugins: config.plugins || [],
    mediaQueryOrder: config.mediaQueryOrder || [],
    selectorPrefix: config.selectorPrefix || '',

    filterClassName: config.filterClassName || isSafeClassName,

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

      var processedStyle = processStyleWithPlugins(renderer, rule(props, renderer), RULE_TYPE, props);
      return renderer._renderStyleToClassNames(processedStyle).slice(1);
    },
    renderKeyframe: function renderKeyframe(keyframe) {
      var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var resolvedKeyframe = keyframe(props, renderer);
      var keyframeReference = JSON.stringify(resolvedKeyframe);

      if (!renderer.cache.hasOwnProperty(keyframeReference)) {
        // use another unique identifier to ensure minimal css markup
        var animationName = generateAnimationName(++renderer.uniqueKeyframeIdentifier);

        var processedKeyframe = processStyleWithPlugins(renderer, resolvedKeyframe, KEYFRAME_TYPE, props);

        var cssKeyframe = cssifyKeyframe(processedKeyframe, animationName, renderer.keyframePrefixes);

        var change = {
          type: KEYFRAME_TYPE,
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
        var fontFamily = toCSSString(family);

        // remove the localAlias since we extraced the needed info
        properties.localAlias && delete properties.localAlias;

        // TODO: proper font family generation with error proofing
        var fontFace = _extends({}, properties, {
          src: '' + fontLocals.reduce(function (agg, local) {
            return agg += ' local(' + checkFontUrl(local) + '), ';
          }, '') + files.map(function (src) {
            return 'url(' + checkFontUrl(src) + ') format(\'' + checkFontFormat(src) + '\')';
          }).join(','),
          fontFamily: fontFamily
        });

        var cssFontFace = cssifyFontFace(fontFace);

        var change = {
          type: FONT_TYPE,
          fontFace: cssFontFace,
          fontFamily: fontFamily
        };

        renderer.cache[fontReference] = change;
        renderer._emitChange(change);
      }

      return renderer.cache[fontReference].fontFamily;
    },
    renderStatic: function renderStatic(staticStyle, selector) {
      var staticReference = generateStaticReference(staticStyle, selector);

      if (!renderer.cache.hasOwnProperty(staticReference)) {
        var cssDeclarations = cssifyStaticStyle(staticStyle, renderer);

        var change = {
          type: STATIC_TYPE,
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
        type: CLEAR_TYPE
      });
    },


    _mergeStyle: assignStyle,

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
        if (isObject(value)) {
          if (isNestedSelector(property)) {
            classNames += renderer._renderStyleToClassNames(value, pseudo + normalizeNestedProperty(property), media, support);
          } else if (isMediaQuery(property)) {
            var combinedMediaQuery = generateCombinedMediaQuery(media, property.slice(6).trim());
            classNames += renderer._renderStyleToClassNames(value, pseudo, combinedMediaQuery, support);
          } else if (isSupport(property)) {
            var combinedSupport = generateCombinedMediaQuery(support, property.slice(9).trim());
            classNames += renderer._renderStyleToClassNames(value, pseudo, media, combinedSupport);
          } else {
            // TODO: warning
          }
        } else {
          var declarationReference = support + media + pseudo + property + value;

          if (!renderer.cache.hasOwnProperty(declarationReference)) {
            // we remove undefined values to enable
            // usage of optional props without side-effects
            if (isUndefinedValue(value)) {
              renderer.cache[declarationReference] = {
                className: ''
                /* eslint-disable no-continue */
              };continue;
              /* eslint-enable */
            }

            var className = renderer.selectorPrefix + generateClassName(renderer.getNextRuleIdentifier, renderer.filterClassName);

            var declaration = cssifyDeclaration(property, value);
            var selector = generateCSSSelector(className, pseudo);

            var change = {
              type: RULE_TYPE,
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
      arrayEach(renderer.listeners, function (listener) {
        return listener(change);
      });
    }
  };

  // initial setup
  renderer.keyframePrefixes.push('');

  if (config.enhancers) {
    arrayEach(config.enhancers, function (enhancer) {
      renderer = enhancer(renderer);
    });
  }

  return renderer;
}