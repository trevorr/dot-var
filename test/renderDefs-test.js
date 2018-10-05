'use strict';

const analyzer = require('estree-analyzer');
const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

const renderDefs = require('../src/renderDefs');

describe('renderDefs', function () {
  // https://raw.githubusercontent.com/olado/doT/master/examples/advancedsnippet.txt
  it('handles doT examples/advancedsnippet', function () {
    const advancedSnippet = fs.readFileSync(
      path.join(path.dirname(__filename), 'data', 'advancedsnippet.dot'), {
        encoding: 'utf8'
      });
    const options = {
      onEvaluateError(code) {
        // return a fixed string to avoid VM-specific error messages
        return `<!-- evaluation error: ${code} -->`;
      }
    };
    const scope = new analyzer.Scope();
    const output = renderDefs(advancedSnippet, options, scope);
    const advancedSnippetCompiled = fs.readFileSync(
      path.join(path.dirname(__filename), 'data', 'advancedsnippet-compiled.dot'), {
        encoding: 'utf8'
      });
    expect(output).to.equal(advancedSnippetCompiled);
  });
});