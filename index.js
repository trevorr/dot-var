'use strict';

const scanTemplate = require('./src/scanTemplate');
const scanVariables = require('./src/scanVariables');
const parseDot = require('./src/parseDot');
const scanDot = require('./src/scanDot');
const renderDefs = require('./src/renderDefs');
const scanDefs = require('./src/scanDefs');

module.exports = {
  default: scanTemplate,
  scanTemplate,
  scanVariables,
  parseDot,
  scanDot,
  renderDefs,
  scanDefs
};
