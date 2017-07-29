var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

import cssifyDeclaration from 'css-in-js-utils/lib/cssifyDeclaration';

import { cssifyFontFace, cssifyKeyframe, cssifyStaticStyle, generateAnimationName, generateClassName, generateCombinedMediaQuery, generateCSSRule, generateCSSSelector, generateStaticReference, isMediaQuery, isNestedSelector, isUndefinedValue, isObject, normalizeNestedProperty, applyMediaRulesInOrder, processStyleWithPlugins, toCSSString, checkFontFormat, checkFontUrl, arrayEach, STATIC_TYPE, RULE_TYPE, KEYFRAME_TYPE, FONT_TYPE, CLEAR_TYPE } from 'fela-utils';

import { renderToString as _renderToString } from 'fela-tools';

export default function createRenderer() {
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
    mediaRules: applyMediaRulesInOrder(config.mediaQueryOrder || []),
    uniqueRuleIdentifier: 0,
    uniqueKeyframeIdentifier: 0,
    // use a flat cache object with pure string references
    // to achieve maximal lookup performance and memoization speed
    cache: {},
    styleNodes: {},
    filterClassName: config.filterClassName,
    propCache: {},

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

        renderer.cache[keyframeReference] = animationName;
        renderer.keyframes += cssKeyframe;

        renderer._emitChange({
          name: animationName,
          keyframe: cssKeyframe,
          type: KEYFRAME_TYPE
        });
      }

      return renderer.cache[keyframeReference];
    },
    renderFont: function renderFont(family, files) {
      var properties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var fontReference = family + JSON.stringify(properties);

      if (!renderer.cache.hasOwnProperty(fontReference)) {
        var fontFamily = toCSSString(family);

        // TODO: proper font family generation with error proofing
        var fontFace = _extends({}, properties, {
          src: files.map(function (src) {
            return 'url(' + checkFontUrl(src) + ') format(\'' + checkFontFormat(src) + '\')';
          }).join(','),
          fontFamily: fontFamily
        });

        var cssFontFace = cssifyFontFace(fontFace);
        renderer.cache[fontReference] = fontFamily;
        renderer.fontFaces += cssFontFace;

        renderer._emitChange({
          fontFamily: fontFamily,
          fontFace: cssFontFace,
          type: FONT_TYPE
        });
      }

      return renderer.cache[fontReference];
    },
    renderStatic: function renderStatic(staticStyle, selector) {
      var staticReference = generateStaticReference(staticStyle, selector);

      if (!renderer.cache.hasOwnProperty(staticReference)) {
        var cssDeclarations = cssifyStaticStyle(staticStyle, renderer);
        renderer.cache[staticReference] = '';

        if (typeof staticStyle === 'string') {
          renderer.statics += cssDeclarations;

          renderer._emitChange({
            type: STATIC_TYPE,
            css: cssDeclarations
          });
        } else if (selector) {
          renderer.statics += generateCSSRule(selector, cssDeclarations);
        }

        renderer._emitChange({
          type: STATIC_TYPE,
          css: cssDeclarations
        });
      }
    },
    renderToString: function renderToString() {
      return _renderToString(renderer);
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
      renderer.mediaRules = applyMediaRulesInOrder(renderer.mediaQueryOrder);
      renderer.uniqueRuleIdentifier = 0;
      renderer.uniqueKeyframeIdentifier = 0;
      renderer.cache = {};
      renderer.propCache = {};

      renderer._emitChange({ type: CLEAR_TYPE });
    },
    _renderStyleToClassNames: function _renderStyleToClassNames(_ref) {
      var pseudo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var media = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      var _className = _ref._className,
          style = _objectWithoutProperties(_ref, ['_className']);

      var classNames = _className || '';

      for (var property in style) {
        var value = style[property];

        if (isObject(value)) {
          if (isNestedSelector(property)) {
            classNames += renderer._renderStyleToClassNames(value, pseudo + normalizeNestedProperty(property), media);
          } else if (isMediaQuery(property)) {
            var combinedMediaQuery = generateCombinedMediaQuery(media, property.slice(6).trim());

            classNames += renderer._renderStyleToClassNames(value, pseudo, combinedMediaQuery);
          } else {
            // TODO: warning
          }
        } else {
          var declarationReference = media + pseudo + property + value;

          if (!renderer.cache.hasOwnProperty(declarationReference)) {
            // we remove undefined values to enable
            // usage of optional props without side-effects
            if (isUndefinedValue(value)) {
              renderer.cache[declarationReference] = '';
              /* eslint-disable no-continue */
              continue;
              /* eslint-enable */
            }

            var className = renderer.selectorPrefix + generateClassName(++renderer.uniqueRuleIdentifier, void 0, renderer.filterClassName);

            renderer.cache[declarationReference] = className;
            if (!pseudo && !media) renderer.propCache[className] = property;

            var cssDeclaration = cssifyDeclaration(property, value);
            var selector = generateCSSSelector(className, pseudo);
            var cssRule = generateCSSRule(selector, cssDeclaration);

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
              type: RULE_TYPE
            });
          }

          // only append if we got a class cached
          if (renderer.cache[declarationReference]) {
            classNames += ' ' + renderer.cache[declarationReference];
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
  renderer.clear();

  if (config.enhancers) {
    arrayEach(config.enhancers, function (enhancer) {
      renderer = enhancer(renderer);
    });
  }

  return renderer;
}