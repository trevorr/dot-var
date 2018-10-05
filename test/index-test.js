'use strict';

const chai = require('chai');
const expect = chai.expect;

const scanTemplate = require('../index').default;

describe('scanVariables', function () {
  it('returns expected demo result', function () {
    const text = `{{##def.img:filename:<img src="filename">#}}
    Welcome to {{= it.placeHtml || 'here' }}!
    {{? it.names.length}}
    Greetings to:
    {{~ it.names :name}}
    - {{!name}} {{#def.img:user.jpg}}
    {{~}}
    {{??}}
    Who are you?
    {{?}}`;
    const vars = scanTemplate(text);
    try {
      expect(vars).to.eql({
        "def": {
          "name": "def",
          "type": "object",
          "members": {
            "img": {
              "name": "img",
              "type": "string",
              "value": "<img src=\"filename\">",
              "param": "filename"
            }
          }
        },
        "it": {
          "name": "it",
          "type": "object",
          "members": {
            "placeHtml": {
              "name": "placeHtml"
            },
            "names": {
              "name": "names",
              "type": "array",
              "members": {
                "length": {
                  "name": "length",
                  "conditional": true,
                  "section": true
                }
              },
              "iteration": true,
              "section": true,
              "elements": {
                "interpolated": true,
                "escaped": true
              }
            }
          }
        }
      });
    } catch (e) {
      console.log(JSON.stringify(vars, null, 2));
      throw e;
    }
  });
});