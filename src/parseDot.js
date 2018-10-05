'use strict';

/**
 * Template parser module.
 * @module parseDot
 * @private
 */

/**
 * Converts a linear array of doT.js tokens into a tree of tokens.
 * The given token array is emptied of token objects. The opening tag token
 * objects are also modified to optionally include the following properties:
 * 
 * - `nodes` (`Object[]`): tokens nested within this opening tag token
 * - `end` (`number`): the input starting index of the closing tag token
 * 
 * Closing tag tokens are dropped.
 * Throws an `Error` if the opening and closing tags are not strictly matched.
 * 
 * @param {Object[]} tokens an array of tokens produced by the scanner
 * @param {Object[]} [stack] the stack of opening tags currently being processed
 * @returns {Object[]} an array of top-level tokens containing nested tokens
 * @alias parseDot
 */
function parseDot(tokens, stack = []) {
  const result = [];
  while (tokens.length > 0) {
    const token = tokens.shift();
    switch (token.tag) {
      case '~':
      case '?':
      case '??': {
        if ((!token.expr || token.tag === '??') && !('end' in token)) {
          // closing
          if (stack.length === 0) {
            throw new Error(`Closing ${token.tag} tag without opening tag at ${token.i}`);
          }
          const opener = stack.pop();
          if (token.tag[0] != opener.tag[0]) {
            throw new Error(`Closing ${token.tag} tag at ${token.i} does not match opening tag ${opener.tag} at ${opener.index}`);
          }
          opener.end = token.i;
          if (token.tag === '??') {
            token.end = undefined; // treat as opening, not closing
            tokens.unshift(token);
          }
          return result;
        }
        if (token.expr || token.tag === '??') {
          // opening
          stack.push(token);
          token.nodes = parseDot(tokens, stack);
        }
      }
    }
    result.push(token);
  }
  if (stack.length > 0) {
    const opener = stack.pop();
    throw new Error(`Missing closing tag for opening tag ${opener.tag} at ${opener.index}`);
  }
  return result;
}

module.exports = parseDot;
