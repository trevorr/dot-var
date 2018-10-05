'use strict';

const analyzer = require('estree-analyzer');
const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

const scanTemplate = require('../src/scanTemplate');

describe('scanTemplate', function () {
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
    const vars = scanTemplate(advancedSnippet, options, scope);
    const expected = require('./data/advancedsnippet-vars.json');
    try {
      expect(vars).to.eql(expected);
    } catch (e) {
      console.log(JSON.stringify(vars, null, 2));
      throw e;
    }
  });
});