var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

import cssifyDeclaration from 'css-in-js-utils/lib/cssifyDeclaration';
import arrayEach from 'fast-loops/lib/arrayEach';
import isPlainObject from 'isobject';

import { generateDeclarationReference, generateCombinedMediaQuery, generateCSSSelector, isMediaQuery, isNestedSelector, isUndefinedValue, isSupport, normalizeNestedProperty, processStyleWithPlugins, STATIC_TYPE, RULE_TYPE, KEYFRAME_TYPE, FONT_TYPE, CLEAR_TYPE } from 'fela-utils';

import cssifyFontFace from './cssifyFontFace';
import cssifyKeyframe from './cssifyKeyframe';
import cssifyStaticStyle from './cssifyStaticStyle';
import generateAnimationName from './generateAnimationName';
import generateClassName from './generateClassName';
import generateFontSource from './generateFontSource';
import generateStaticReference from './generateStaticReference';
import getFontLocals from './getFontLocals';
import isSafeClassName from './isSafeClassName';
import toCSSString from './toCSSString';
import validateSelectorPrefix from './validateSelectorPrefix';

export default function createRenderer() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var renderer = {
    listeners: [],
    keyframePrefixes: config.keyframePrefixes || ['-webkit-', '-moz-'],
    plugins: config.plugins || [],
    mediaQueryOrder: config.mediaQueryOrder || [],
    supportQueryOrder: config.supportQueryOrder || [],
    ruleOrder: [/^:link/, /^:visited/, /^:hover/, /^:focus-within/, /^:focus/, /^:active/],
    selectorPrefix: validateSelectorPrefix(config.selectorPrefix),
    filterClassName: config.filterClassName || isSafeClassName,
    devMode: config.devMode || false,

    uniqueRuleIdentifier: 0,
    uniqueKeyframeIdentifier: 0,

    nodes: {},
    scoreIndex: {},
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
      var processedKeyframe = processStyleWithPlugins(renderer, resolvedKeyframe, KEYFRAME_TYPE, props);

      var keyframeReference = JSON.stringify(processedKeyframe);

      if (!renderer.cache.hasOwnProperty(keyframeReference)) {
        // use another unique identifier to ensure minimal css markup
        var animationName = renderer.selectorPrefix + generateAnimationName(++renderer.uniqueKeyframeIdentifier);

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

      var localAlias = properties.localAlias,
          otherProperties = _objectWithoutProperties(properties, ['localAlias']);

      var fontReference = family + JSON.stringify(properties);
      var fontLocals = getFontLocals(localAlias);

      if (!renderer.cache.hasOwnProperty(fontReference)) {
        var fontFamily = toCSSString(family);

        var fontFace = _extends({}, otherProperties, {
          src: generateFontSource(files, fontLocals),
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
    _renderStyle: function _renderStyle() {
      var style = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var processedStyle = processStyleWithPlugins(renderer, style, RULE_TYPE, props);

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

        if (isPlainObject(value)) {
          if (isNestedSelector(property)) {
            classNames += renderer._renderStyleToClassNames(value, pseudo + normalizeNestedProperty(property), media, support);
          } else if (isMediaQuery(property)) {
            var combinedMediaQuery = generateCombinedMediaQuery(media, property.slice(6).trim());
            classNames += renderer._renderStyleToClassNames(value, pseudo, combinedMediaQuery, support);
          } else if (isSupport(property)) {
            var combinedSupport = generateCombinedMediaQuery(support, property.slice(9).trim());
            classNames += renderer._renderStyleToClassNames(value, pseudo, media, combinedSupport);
          } else {
            console.warn('The object key "' + property + '" is not a valid nested key in Fela.\nMaybe you forgot to add a plugin to resolve it?\nCheck http://fela.js.org/docs/basics/Rules.html#styleobject for more information.');
          }
        } else {
          var declarationReference = generateDeclarationReference(property, value, pseudo, media, support);

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