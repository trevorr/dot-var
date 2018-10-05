'use strict';

/**
 * Compile-time definition template scanner module.
 * @module scanDefs
 * @private
 */

const defaultOptions = {
  ignoreDefText: false
};

// define or use tag regex
const scanRegex = /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}|\{\{#([\s\S]+?)\}\}/g;

// internal parameter extraction regexes
const defineParamRegex = /^\s*([\w$]+):([\s\S]+)/;
const useParamRegex = /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g;

/**
 * Converts a doT.js template string into an array of compile-time definition token objects
 * (based on the `{{##...#}}` and `{{#...}}` tags). Token objects have the following properties:
 * 
 * - `tag` (`string`): a string indicating the type of token
 *     - `'##'`: compile-time define (possibly parameterized)
 *     - `'#'`: compile-time evaluation/includes and partials
 *     - `'#c'`: code snippet within a `#' tag
 *     - `'#p'`: parameterized define reference within a `#' tag
 *     - `'_t'`: literal text
 * - `name` (`string`): name of a compile-time define (without the leading `def.`) (`##` tag only)
 * - `assign` (`string`): assignment operator of a compile-time define (`##` tag only)
 *     - `':'`: the define expression is evaluated as a template string
 *     - `'='`: the define expression is evaluated as JavaScript code
 * - `param` (`string`): optional parameter for a template string compile-time define (`##` tag only)
 * - `value` (`string`): value for a template string compile-time define (`##` tag only)
 * - `code` (`string`): JavaScript code to evaluate for a define or evaluation (`##` or `#c` tag)
 * - `nodes` (`Object[]`): child nodes of a compile-time evaluation node (`#` tag only)
 * - `def` (`string`): name of a parameterized define (`#p` tag only)
 * - `arg` (`string`): parameter value for a parameterized define (`#p` tag only)
 * - `text` (`string`): literal text (`_t` tag only)
 * - `i` (`number`): input index of the first character of the tag (except `_t` tags)
 * 
 * The following options control the scan:
 * 
 * - `ignoreDefText` (`boolean`): whether to omit literal text from the output array, defaults to false
 * 
 * @param {string} text a string containing a doT.js template
 * @param {Object} [options] an object containing options controlling the output
 * @returns {Object[]} an array of token objects
 * @alias scanDefs
 */
function scanDefs(text, options = defaultOptions) {
  const tokens = [];
  let prevIndex = 0;
  let tagMatch;
  while ((tagMatch = scanRegex.exec(text)) !== null) {
    // emit any literal prefix token
    if (!options.ignoreDefText && prevIndex < tagMatch.index) {
      tokens.push({
        tag: '_t',
        text: text.substring(prevIndex, tagMatch.index)
      });
    }
    prevIndex = scanRegex.lastIndex;

    // emit define or eval token
    let token;
    if (tagMatch[1]) {
      const [, name, assign, expr] = tagMatch;
      token = {
        tag: '##',
        name: name.startsWith('def.') ? name.substring(4) : name,
        assign
      };
      if (assign === ':') {
        const paramMatch = defineParamRegex.exec(expr);
        if (paramMatch) {
          token.param = paramMatch[1];
          token.value = paramMatch[2];
        } else {
          token.value = expr;
        }
      } else {
        token.code = expr;
      }
    } else {
      const expr = tagMatch[4];
      const nodes = scanParams(expr, tagMatch.index + 3); // {{#<expr>}}
      token = {
        tag: '#',
        nodes
      };
    }
    token.i = tagMatch.index;
    tokens.push(token);
  }

  // emit any literal suffix token
  if (!options.ignoreDefText && prevIndex < text.length) {
    tokens.push({
      tag: '_t',
      text: text.substring(prevIndex)
    });
  }
  return tokens;
}

function scanParams(code, baseIndex = 0) {
  const tokens = [];
  let prevIndex = 0;
  let paramMatch;
  while ((paramMatch = useParamRegex.exec(code)) !== null) {
    const [, prefix, def, arg] = paramMatch;

    // emit any code prefix token
    const exprIndex = paramMatch.index + prefix.length;
    if (prevIndex < exprIndex) {
      tokens.push({
        tag: '#c',
        code: code.substring(prevIndex, exprIndex),
        i: baseIndex + prevIndex
      });
    }
    prevIndex = useParamRegex.lastIndex;

    // emit parameterized reference token
    const token = {
      tag: '#p',
      def,
      arg,
      i: baseIndex + exprIndex
    };
    tokens.push(token);
  }

  // emit any code suffix token
  if (prevIndex < code.length) {
    tokens.push({
      tag: '#c',
      code: code.substring(prevIndex),
      i: baseIndex + prevIndex
    });
  }
  return tokens;
}

module.exports = scanDefs;