'use strict';

/**
 * Variable scanner module.
 * @module scanVariables
 * @private
 */

const acorn = require('acorn');
const analyzer = require('estree-analyzer');

const defaultOptions = {};

/**
 * Scans an array of doT.js runtime template tokens for variables used in tags
 * and returns a mapping of variable references to objects describing the
 * contexts in which they are used.
 * 
 * Each variable maps to an object that may contain the following properties:
 * 
 * - `name` (`string`): The name of the variable
 * - `type` (`Type`): The type of the variable (as returned by `estree-analyzer`)
 * - `value` (`*`): The value of the variable (always a string for doT defines)
 * - `param` (`string`): Name of the optional substitution parameter in a doT define
 * - `interpolated` (`boolean`): The variable was used for interpolation: `{{!v}}`, `{{=v}}`
 * - `escaped` (`boolean`): The variable was used in an escaped reference: `{{!v}}`
 * - `unescaped` (`boolean`): The variable was used in an unescaped reference: `{{=v}}`
 * - `section` (`boolean`): The variable was used in a conditional or iteration section: `{{?v}}`, `{{??v}}`, `{{~v}}`
 * - `conditional` (`boolean`): The variable was used in a conditional section: `{{?v}}`, `{{??v}}`
 * - `iteration` (`boolean`): The variable was used in an iteration section: `{{~v}}`
 * - `members` (`Object`): An object mapping member variable references to usage context (for object types)
 * - `elements` (`Object`): An object containing the usage context of the array elements (for array types)
 * 
 * @param {Object[]} tokens an array of parsed doT.js runtime template tokens
 * @param {Object} [options] an object containing options controlling the analysis
 * @param {Scope} [scope] the root scope to use for name resolution
 * @returns {Object} an object mapping root scope names to their analyses
 * @alias scanVariables
 */
function scanVariables(tokens, options = defaultOptions, scope = new analyzer.Scope()) {
  for (const token of tokens) {
    let expr = token.expr;
    const context = {};
    switch (token.tag) {
      case '!': // escaped substitution
        context.interpolated = true;
        context.escaped = true;
        break;
      case '=': // unescaped substitution
        context.interpolated = true;
        context.unescaped = true;
        break;
      case '?': // conditional
      case '??': // conditional else
        context.conditional = true;
        context.section = true;
        break;
      case '~': // iteration
        context.iteration = true;
        context.section = true;
        break;
      default: // evaluation
        continue;
    }

    if (!expr) {
      continue;
    }

    let ast;
    try {
      ast = acorn.parseExpressionAt(expr);
    } catch (e) {
      throw new Error(`Error parsing expression '${expr}' in ${token.tag} tag at ${token.index}: ${e.message}`);
    }

    let exprInfo;
    try {
      exprInfo = analyzer.analyze(ast, scope) || {};
    } catch (e) {
      throw new Error(`${e.message} for tag ${token.tag} at ${token.index}: ${expr}`);
    }

    // force iteration expressions to array type
    if (context.iteration && analyzer.types.getKind(exprInfo.type) !== 'array') {
      exprInfo.type = 'array';
    }

    // TODO: apply context to variable/member references within expression in some cases
    Object.assign(exprInfo, context);

    if (token.nodes) {
      let nestedScope = scope;
      let valueInfo;
      if (context.iteration) {
        valueInfo = {};
        if (exprInfo.type.elements) {
          valueInfo.type = exprInfo.type.elements;
        }
        nestedScope = scope.createNested();
        nestedScope.addOwnMember(token.value, valueInfo);
        if (token.index) {
          nestedScope.addOwnMember(token.index, {
            type: 'number'
          });
        }
      }

      scanVariables(token.nodes, options, nestedScope);

      if (valueInfo) {
        // copy type analysis of iteration value variable to array element type
        if (valueInfo.type && !exprInfo.type.elements) {
          exprInfo.type = analyzer.types.arrayOf(valueInfo.type);
        }
        // copy usage analysis results of iteration value variable to array info
        const elements = exprInfo.elements || (exprInfo.elements = {});
        for (const key in valueInfo) {
          // exclude type information since it's redundant
          if (key !== 'type') {
            elements[key] = valueInfo[key];
          }
        }
      }
    }
  }
  return scope.members;
}

module.exports = scanVariables;