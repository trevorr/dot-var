'use strict';

/**
 * Template string variable scanner module.
 * @module scanTemplate
 * @private
 */

const analyzer = require('estree-analyzer');
const renderDefs = require('./renderDefs');
const scanDot = require('./scanDot');
const parseDot = require('./parseDot');
const scanVariables = require('./scanVariables');

const defaultOptions = {
  ignoreText: true
};

/**
 * Scans a doT.js template for variables used in tags.
 * 
 * This is a convenience function that performs the following steps:
 * 
 * 1. Scan and render compile-time definitions using {@link renderDefs}
 * 2. Scan runtime tags using {@link scanDot} (with `ignoreText` enabled)
 * 3. Build a parse tree of runtime tags using {@link parseDot}
 * 4. Scan variables in the parse tree using {@link scanVariables}
 * 
 * See {@link scanVariables} for details of the resulting analysis.
 * 
 * @param {string} template a doT.js template string
 * @param {Object} [options] an object containing options to pass to underlyiing scanners
 * @param {Scope} [scope] the root scope to use for name resolution
 * @returns {Object} an object mapping root scope names to their analyses
 * @alias scanTemplate
 * @see renderDefs
 * @see scanDot
 * @see parseDot
 * @see scanVariables
 */
function scanTemplate(template, options = defaultOptions, scope = new analyzer.Scope()) {
  const rtemplate = renderDefs(template, options, scope);
  const tokens = parseDot(scanDot(rtemplate, options));
  scanVariables(tokens, options, scope);
  return scope.members;
}

module.exports = scanTemplate;