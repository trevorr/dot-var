'use strict';

const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

const scanDefs = require('../src/scanDefs');

describe('scanDefs', function () {
  // https://raw.githubusercontent.com/olado/doT/master/examples/advancedsnippet.txt
  it('handles doT examples/advancedsnippet', function () {
    const advancedSnippet = fs.readFileSync(
      path.join(path.dirname(__filename), 'data', 'advancedsnippet.dot'), {
        encoding: 'utf8'
      });
    const tokens = scanDefs(advancedSnippet);
    const expected = require('./data/advancedsnippet.json');
    expect(tokens).to.eql(expected);
  });
});