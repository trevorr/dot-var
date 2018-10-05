'use strict';

/**
 * Runtime template scanner module.
 * @module scanDot
 * @private
 */

const defaultOptions = {
  ignoreText: false
};

// evaluation regex is a separate case due to including extra trailing slashes
const scanRegex = /\{\{([^=!#?~][\s\S]*?\}*)\}\}|\{\{(=|!|\?\??|~)\s*([\s\S]*?)\}\}/g;

// iteration variable extraction regex
const iterateRegex = /^([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*$/;

/**
 * Converts a doT.js runtime template string into an array of token objects.
 * The template should have already have any compile-time definition and
 * evaluation tags (`{{##...#}}` and `{{#...}}`) recursively expanded.
 * Token objects have the following properties:
 * 
 * - `tag` (`string`): a string indicating the type of token
 *     - `''`: evaluation (of arbitrary JavaScript in the template code)
 *     - `'='`: interpolation (subsitution of the result of an expression into the output)
 *     - `'!'`: HTML-escaped interpolation
 *     - `'?'`: conditional
 *     - `'??'`: conditional else
 *     - `'~'`: array iteration
 *     - `'_t'`: literal text
 * - `expr` (`string`): an expression to evaluate for the evaluation, interpolation, conditional, or iteration
 *     (a conditional, conditional else, or array iteration token without an expression is a closing tag)
 * - `value` (`string`): name of current value for array iteration (`~` tag only)
 * - `index` (`string`): optional name of current index for array iteration (`~` tag only)
 * - `text` (`string`): literal text (`_t` tag only)
 * - `i` (`number`): input index of the first character of the tag (except `_t` tags)
 * 
 * The following options control the scan:
 * 
 * - `ignoreText` (`boolean`): whether to omit literal text from the output array, defaults to false
 * 
 * @param {string} text a string containing a doT.js template
 * @param {Object} [options] an object containing options controlling the output
 * @returns {Object[]} an array of token objects
 * @alias scanDot
 * @see scanDefs
 */
function scanDot(text, options = defaultOptions) {
  const tokens = [];
  let prevIndex = 0;
  let tagMatch;
  while ((tagMatch = scanRegex.exec(text)) !== null) {
    let tag;
    let body;
    if (tagMatch[1]) {
      tag = '';
      body = tagMatch[1];
    } else {
      tag = tagMatch[2];
      body = tagMatch[3];
    }

    let token;
    switch (tag) {
      case '~': // iteration
        {
          let bodyMatch;
          if (!body) { // end of iteration
            token = {
              tag
            };
          } else if (bodyMatch = iterateRegex.exec(body)) {
            const [, expr, value, index] = bodyMatch;
            token = {
              tag,
              expr,
              value
            };
            if (index) {
              token.index = index;
            }
          }
          break;
        }
      case '': // evaluation
      case '=': // interpolation
      case '!': // interpolation with encoding
      case '?': // conditional
      case '??': // conditional else
      default:
        {
          token = {
            tag
          };
          if (body) {
            token.expr = body;
          }
        }
    }

    if (token) {
      // emit any literal prefix token
      if (!options.ignoreText && prevIndex < tagMatch.index) {
        tokens.push({
          tag: '_t',
          text: text.substring(prevIndex, tagMatch.index)
        });
      }
      prevIndex = scanRegex.lastIndex;

      // emit non-literal token
      token.i = tagMatch.index;
      tokens.push(token);
    } else {
      // not a valid token: leave it to become text in the next iteration
    }
  }

  // emit any literal suffix token
  if (!options.ignoreText && prevIndex < text.length) {
    tokens.push({
      tag: '_t',
      text: text.substring(prevIndex)
    });
  }
  return tokens;
}

module.exports = scanDot;