'use strict';

/**
 * Compile-time definition template renderer module.
 * @module renderDefs
 * @private
 */

const analyzer = require('estree-analyzer');
const {
  VM
} = require('vm2');

const scanDefs = require('./scanDefs');

const defaultOptions = {
  evaluate(code, def) {
    // safer version of `return new Function('def', 'return ' + code)(def)`
    const sandbox = {
      def
    };
    const vm = new VM({
      sandbox,
      timeout: 1000
    });
    return vm.run(code);
  },
  onEvaluateError(_code, _def, e) {
    return e.message;
  }
};

/**
 * Processes the "compile-time" defines and evaluations (`{{##...#}}` and `{{#...}}` tags)
 * in a doT.js template and renders a new template that only contains only "runtime" tags.
 *
 * The given scope is populated with a `def` object containing the compile-time defines as
 * members. Each define may contain the following properties:
 *
 * - `name` (`string`): the name of the define
 * - `type` (`string`): the type of the define value, which is always `string`
 * - `value` (`string`): the value of the define
 * - `param` (`string`): the name of the define parameter, if it has one
 *
 * The following options control rendering:
 *
 * - `evaluate` (`function(code, def)`): a function that evaluates a JavaScript expression
 *     with the given value for the `def` variable and returns a string containing the result;
 *     the default function executes the code using [VM2](https://github.com/patriksimek/vm2)
 * - `onEvaluateError` (`function (code, def, e)`): a function called when `evaluate` throws
 *     an exception `e` and returns a string to be included in the result;
 *     the default function returns the exception `message`
 *
 * @param {string} template a doT.js template string possibly containing compile-time tags
 * @param {Object} [options] an object containing rendering options
 * @param {Scope} [scope] the root scope to use for name resolution
 * @returns {string} a template string containing no compile-time tags
 * @alias renderDefs
 */
function renderDefs(template, options = defaultOptions, scope = new analyzer.Scope()) {
  return renderDefScope(template, options, getDefScope(scope));
}

function renderDefScope(template, options, defScope) {
  const tokens = scanDefs(template);

  scanDefVars(tokens, options, defScope);

  let output = '';
  for (const token of tokens) {
    switch (token.tag) {
      case '#':
        output += renderEval(token.nodes, options, defScope);
        break;
      case '_t':
        output += token.text;
    }
  }
  return output;
}

function getDefScope(scope) {
  const rootScope = scope.getRoot();
  const defName = 'def'; // hard-coded in doT.js
  let defContext = rootScope.getOwnMember(defName);
  if (!defContext) {
    defContext = rootScope.addOwnMember(defName, {
      name: defName
    });
  }
  if (!defContext.members) {
    defContext.type = 'object';
    defContext.members = {};
  }
  return scope.constructor.withMembers(defContext.members);
}

function scanDefVars(tokens, options, defScope) {
  for (const token of tokens) {
    if (token.tag != '##') {
      continue;
    }

    // doT ignores duplicate defines
    if (defScope.getOwnMember(token.name)) {
      continue;
    }

    const varInfo = {
      name: token.name
    }
    defScope.addOwnMember(token.name, varInfo);
    if (token.value) {
      // template string define
      varInfo.type = 'string';
      varInfo.value = token.value;
      if (token.param) {
        varInfo.param = token.param;
      }
    } else if (token.code) {
      // JavaScript code define
      varInfo.type = 'string';
      varInfo.value = evalCode(token.code, options, defScope);
    }
  }
  return defScope.members;
}

function renderEval(tokens, options, defScope) {
  // concatenate code and parameterized define values
  let code = '';
  for (const token of tokens) {
    switch (token.tag) {
      case '#c':
        code += token.code;
        break;
      case '#p':
        {
          const defInfo = defScope.findMember(token.def);
          if (defInfo && defInfo.value) {
            let value = defInfo.value;
            if ('param' in defInfo && 'arg' in token) {
              value = value.replace(new RegExp('(^|[^\\w$])' + defInfo.param + '([^\\w$])', 'g'), '$1' + token.arg + '$2');
            }
            // inject the quoted value into the code
            code += JSON.stringify(value);
          } else {
            // doT replaces undefined references with 'undefined'
            code += undefined;
          }
        }
    }
  }

  let output = evalCode(code, options, defScope);

  // recursively render any resulting compile-time tags
  if (output) {
    output = renderDefScope(output, options, defScope);
  }

  return output;
}

function evalCode(code, options, defScope) {
  const {
    evaluate = defaultOptions.evaluate,
      onEvaluateError = defaultOptions.onEvaluateError
  } = options;
  const def = getScopeValues(defScope);
  try {
    return String(evaluate(code, def));
  } catch (e) {
    return String(onEvaluateError(code, def, e));
  }
}

function getScopeValues(scope) {
  const result = {};
  for (const [name, info] of Object.entries(scope.members)) {
    if (info.value) {
      result[name] = info.value;
    } else if (info.members) {
      result[name] = getScopeValues(info);
    }
  }
  return result;
}

module.exports = renderDefs;