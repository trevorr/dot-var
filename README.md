# dot-var

Analyzes variable usages in [doT.js](http://olado.github.io) templates.
Useful for static analysis, documentation generation, and sample rendering of arbitrary templates.

## Installation

```sh
npm install dot-var
```

## Usage

```js
const scanTemplate = require('dot-var').default;

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
console.log(JSON.stringify(vars, null, 2));
```

The code above outputs the following:

```json
{
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
}
```

## API Reference

### Functions

<dl>
<dt><a href="#parseDot">parseDot(tokens, [stack])</a> ⇒ <code>Array.&lt;Object&gt;</code></dt>
<dd><p>Converts a linear array of doT.js tokens into a tree of tokens.
The given token array is emptied of token objects. The opening tag token
objects are also modified to optionally include the following properties:</p>
<ul>
<li><code>nodes</code> (<code>Object[]</code>): tokens nested within this opening tag token</li>
<li><code>end</code> (<code>number</code>): the input starting index of the closing tag token</li>
</ul>
<p>Closing tag tokens are dropped.
Throws an <code>Error</code> if the opening and closing tags are not strictly matched.</p>
</dd>
<dt><a href="#renderDefs">renderDefs(template, [options], [scope])</a> ⇒ <code>string</code></dt>
<dd><p>Processes the &quot;compile-time&quot; defines and evaluations (<code>{{##...#}}</code> and <code>{{#...}}</code> tags)
in a doT.js template and renders a new template that only contains only &quot;runtime&quot; tags.</p>
<p>The given scope is populated with a <code>def</code> object containing the compile-time defines as
members. Each define may contain the following properties:</p>
<ul>
<li><code>name</code> (<code>string</code>): the name of the define</li>
<li><code>type</code> (<code>string</code>): the type of the define value, which is always <code>string</code></li>
<li><code>value</code> (<code>string</code>): the value of the define</li>
<li><code>param</code> (<code>string</code>): the name of the define parameter, if it has one</li>
</ul>
<p>The following options control rendering:</p>
<ul>
<li><code>evaluate</code> (<code>function(code, def)</code>): a function that evaluates a JavaScript expression
  with the given value for the <code>def</code> variable and returns a string containing the result;
  the default function executes the code using <a href="https://github.com/patriksimek/vm2">VM2</a></li>
<li><code>onEvaluateError</code> (<code>function (code, def, e)</code>): a function called when <code>evaluate</code> throws
  an exception <code>e</code> and returns a string to be included in the result;
  the default function returns the exception <code>message</code></li>
</ul>
</dd>
<dt><a href="#scanDefs">scanDefs(text, [options])</a> ⇒ <code>Array.&lt;Object&gt;</code></dt>
<dd><p>Converts a doT.js template string into an array of compile-time definition token objects
(based on the <code>{{##...#}}</code> and <code>{{#...}}</code> tags). Token objects have the following properties:</p>
<ul>
<li><code>tag</code> (<code>string</code>): a string indicating the type of token<ul>
<li><code>&#39;##&#39;</code>: compile-time define (possibly parameterized)</li>
<li><code>&#39;#&#39;</code>: compile-time evaluation/includes and partials</li>
<li><code>&#39;#c&#39;</code>: code snippet within a `#&#39; tag</li>
<li><code>&#39;#p&#39;</code>: parameterized define reference within a `#&#39; tag</li>
<li><code>&#39;_t&#39;</code>: literal text</li>
</ul>
</li>
<li><code>name</code> (<code>string</code>): name of a compile-time define (without the leading <code>def.</code>) (<code>##</code> tag only)</li>
<li><code>assign</code> (<code>string</code>): assignment operator of a compile-time define (<code>##</code> tag only)<ul>
<li><code>&#39;:&#39;</code>: the define expression is evaluated as a template string</li>
<li><code>&#39;=&#39;</code>: the define expression is evaluated as JavaScript code</li>
</ul>
</li>
<li><code>param</code> (<code>string</code>): optional parameter for a template string compile-time define (<code>##</code> tag only)</li>
<li><code>value</code> (<code>string</code>): value for a template string compile-time define (<code>##</code> tag only)</li>
<li><code>code</code> (<code>string</code>): JavaScript code to evaluate for a define or evaluation (<code>##</code> or <code>#c</code> tag)</li>
<li><code>nodes</code> (<code>Object[]</code>): child nodes of a compile-time evaluation node (<code>#</code> tag only)</li>
<li><code>def</code> (<code>string</code>): name of a parameterized define (<code>#p</code> tag only)</li>
<li><code>arg</code> (<code>string</code>): parameter value for a parameterized define (<code>#p</code> tag only)</li>
<li><code>text</code> (<code>string</code>): literal text (<code>_t</code> tag only)</li>
<li><code>i</code> (<code>number</code>): input index of the first character of the tag (except <code>_t</code> tags)</li>
</ul>
<p>The following options control the scan:</p>
<ul>
<li><code>ignoreDefText</code> (<code>boolean</code>): whether to omit literal text from the output array, defaults to false</li>
</ul>
</dd>
<dt><a href="#scanDot">scanDot(text, [options])</a> ⇒ <code>Array.&lt;Object&gt;</code></dt>
<dd><p>Converts a doT.js runtime template string into an array of token objects.
The template should have already have any compile-time definition and
evaluation tags (<code>{{##...#}}</code> and <code>{{#...}}</code>) recursively expanded.
Token objects have the following properties:</p>
<ul>
<li><code>tag</code> (<code>string</code>): a string indicating the type of token<ul>
<li><code>&#39;&#39;</code>: evaluation (of arbitrary JavaScript in the template code)</li>
<li><code>&#39;=&#39;</code>: interpolation (subsitution of the result of an expression into the output)</li>
<li><code>&#39;!&#39;</code>: HTML-escaped interpolation</li>
<li><code>&#39;?&#39;</code>: conditional</li>
<li><code>&#39;??&#39;</code>: conditional else</li>
<li><code>&#39;~&#39;</code>: array iteration</li>
<li><code>&#39;_t&#39;</code>: literal text</li>
</ul>
</li>
<li><code>expr</code> (<code>string</code>): an expression to evaluate for the evaluation, interpolation, conditional, or iteration
  (a conditional, conditional else, or array iteration token without an expression is a closing tag)</li>
<li><code>value</code> (<code>string</code>): name of current value for array iteration (<code>~</code> tag only)</li>
<li><code>index</code> (<code>string</code>): optional name of current index for array iteration (<code>~</code> tag only)</li>
<li><code>text</code> (<code>string</code>): literal text (<code>_t</code> tag only)</li>
<li><code>i</code> (<code>number</code>): input index of the first character of the tag (except <code>_t</code> tags)</li>
</ul>
<p>The following options control the scan:</p>
<ul>
<li><code>ignoreText</code> (<code>boolean</code>): whether to omit literal text from the output array, defaults to false</li>
</ul>
</dd>
<dt><a href="#scanTemplate">scanTemplate(template, [options], [scope])</a> ⇒ <code>Object</code></dt>
<dd><p>Scans a doT.js template for variables used in tags.</p>
<p>This is a convenience function that performs the following steps:</p>
<ol>
<li>Scan and render compile-time definitions using <a href="#renderDefs">renderDefs</a></li>
<li>Scan runtime tags using <a href="#scanDot">scanDot</a> (with <code>ignoreText</code> enabled)</li>
<li>Build a parse tree of runtime tags using <a href="#parseDot">parseDot</a></li>
<li>Scan variables in the parse tree using <a href="#scanVariables">scanVariables</a></li>
</ol>
<p>See <a href="#scanVariables">scanVariables</a> for details of the resulting analysis.</p>
</dd>
<dt><a href="#scanVariables">scanVariables(tokens, [options], [scope])</a> ⇒ <code>Object</code></dt>
<dd><p>Scans an array of doT.js runtime template tokens for variables used in tags
and returns a mapping of variable references to objects describing the
contexts in which they are used.</p>
<p>Each variable maps to an object that may contain the following properties:</p>
<ul>
<li><code>name</code> (<code>string</code>): The name of the variable</li>
<li><code>type</code> (<code>Type</code>): The type of the variable (as returned by <code>estree-analyzer</code>)</li>
<li><code>value</code> (<code>*</code>): The value of the variable (always a string for doT defines)</li>
<li><code>param</code> (<code>string</code>): Name of the optional substitution parameter in a doT define</li>
<li><code>interpolated</code> (<code>boolean</code>): The variable was used for interpolation: <code>{{!v}}</code>, <code>{{=v}}</code></li>
<li><code>escaped</code> (<code>boolean</code>): The variable was used in an escaped reference: <code>{{!v}}</code></li>
<li><code>unescaped</code> (<code>boolean</code>): The variable was used in an unescaped reference: <code>{{=v}}</code></li>
<li><code>section</code> (<code>boolean</code>): The variable was used in a conditional or iteration section: <code>{{?v}}</code>, <code>{{??v}}</code>, <code>{{~v}}</code></li>
<li><code>conditional</code> (<code>boolean</code>): The variable was used in a conditional section: <code>{{?v}}</code>, <code>{{??v}}</code></li>
<li><code>iteration</code> (<code>boolean</code>): The variable was used in an iteration section: <code>{{~v}}</code></li>
<li><code>members</code> (<code>Object</code>): An object mapping member variable references to usage context (for object types)</li>
<li><code>elements</code> (<code>Object</code>): An object containing the usage context of the array elements (for array types)</li>
</ul>
</dd>
</dl>

<a name="parseDot"></a>

### parseDot(tokens, [stack]) ⇒ <code>Array.&lt;Object&gt;</code>
Converts a linear array of doT.js tokens into a tree of tokens.
The given token array is emptied of token objects. The opening tag token
objects are also modified to optionally include the following properties:

- `nodes` (`Object[]`): tokens nested within this opening tag token
- `end` (`number`): the input starting index of the closing tag token

Closing tag tokens are dropped.
Throws an `Error` if the opening and closing tags are not strictly matched.

**Kind**: global function  
**Returns**: <code>Array.&lt;Object&gt;</code> - an array of top-level tokens containing nested tokens  

| Param | Type | Description |
| --- | --- | --- |
| tokens | <code>Array.&lt;Object&gt;</code> | an array of tokens produced by the scanner |
| [stack] | <code>Array.&lt;Object&gt;</code> | the stack of opening tags currently being processed |

<a name="renderDefs"></a>

### renderDefs(template, [options], [scope]) ⇒ <code>string</code>
Processes the "compile-time" defines and evaluations (`{{##...#}}` and `{{#...}}` tags)
in a doT.js template and renders a new template that only contains only "runtime" tags.

The given scope is populated with a `def` object containing the compile-time defines as
members. Each define may contain the following properties:

- `name` (`string`): the name of the define
- `type` (`string`): the type of the define value, which is always `string`
- `value` (`string`): the value of the define
- `param` (`string`): the name of the define parameter, if it has one

The following options control rendering:

- `evaluate` (`function(code, def)`): a function that evaluates a JavaScript expression
    with the given value for the `def` variable and returns a string containing the result;
    the default function executes the code using [VM2](https://github.com/patriksimek/vm2)
- `onEvaluateError` (`function (code, def, e)`): a function called when `evaluate` throws
    an exception `e` and returns a string to be included in the result;
    the default function returns the exception `message`

**Kind**: global function  
**Returns**: <code>string</code> - a template string containing no compile-time tags  

| Param | Type | Description |
| --- | --- | --- |
| template | <code>string</code> | a doT.js template string possibly containing compile-time tags |
| [options] | <code>Object</code> | an object containing rendering options |
| [scope] | <code>Scope</code> | the root scope to use for name resolution |

<a name="scanDefs"></a>

### scanDefs(text, [options]) ⇒ <code>Array.&lt;Object&gt;</code>
Converts a doT.js template string into an array of compile-time definition token objects
(based on the `{{##...#}}` and `{{#...}}` tags). Token objects have the following properties:

- `tag` (`string`): a string indicating the type of token
    - `'##'`: compile-time define (possibly parameterized)
    - `'#'`: compile-time evaluation/includes and partials
    - `'#c'`: code snippet within a `#' tag
    - `'#p'`: parameterized define reference within a `#' tag
    - `'_t'`: literal text
- `name` (`string`): name of a compile-time define (without the leading `def.`) (`##` tag only)
- `assign` (`string`): assignment operator of a compile-time define (`##` tag only)
    - `':'`: the define expression is evaluated as a template string
    - `'='`: the define expression is evaluated as JavaScript code
- `param` (`string`): optional parameter for a template string compile-time define (`##` tag only)
- `value` (`string`): value for a template string compile-time define (`##` tag only)
- `code` (`string`): JavaScript code to evaluate for a define or evaluation (`##` or `#c` tag)
- `nodes` (`Object[]`): child nodes of a compile-time evaluation node (`#` tag only)
- `def` (`string`): name of a parameterized define (`#p` tag only)
- `arg` (`string`): parameter value for a parameterized define (`#p` tag only)
- `text` (`string`): literal text (`_t` tag only)
- `i` (`number`): input index of the first character of the tag (except `_t` tags)

The following options control the scan:

- `ignoreDefText` (`boolean`): whether to omit literal text from the output array, defaults to false

**Kind**: global function  
**Returns**: <code>Array.&lt;Object&gt;</code> - an array of token objects  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | a string containing a doT.js template |
| [options] | <code>Object</code> | an object containing options controlling the output |

<a name="scanDot"></a>

### scanDot(text, [options]) ⇒ <code>Array.&lt;Object&gt;</code>
Converts a doT.js runtime template string into an array of token objects.
The template should have already have any compile-time definition and
evaluation tags (`{{##...#}}` and `{{#...}}`) recursively expanded.
Token objects have the following properties:

- `tag` (`string`): a string indicating the type of token
    - `''`: evaluation (of arbitrary JavaScript in the template code)
    - `'='`: interpolation (subsitution of the result of an expression into the output)
    - `'!'`: HTML-escaped interpolation
    - `'?'`: conditional
    - `'??'`: conditional else
    - `'~'`: array iteration
    - `'_t'`: literal text
- `expr` (`string`): an expression to evaluate for the evaluation, interpolation, conditional, or iteration
    (a conditional, conditional else, or array iteration token without an expression is a closing tag)
- `value` (`string`): name of current value for array iteration (`~` tag only)
- `index` (`string`): optional name of current index for array iteration (`~` tag only)
- `text` (`string`): literal text (`_t` tag only)
- `i` (`number`): input index of the first character of the tag (except `_t` tags)

The following options control the scan:

- `ignoreText` (`boolean`): whether to omit literal text from the output array, defaults to false

**Kind**: global function  
**Returns**: <code>Array.&lt;Object&gt;</code> - an array of token objects  
**See**: scanDefs  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | a string containing a doT.js template |
| [options] | <code>Object</code> | an object containing options controlling the output |

<a name="scanTemplate"></a>

### scanTemplate(template, [options], [scope]) ⇒ <code>Object</code>
Scans a doT.js template for variables used in tags.

This is a convenience function that performs the following steps:

1. Scan and render compile-time definitions using [renderDefs](#renderDefs)
2. Scan runtime tags using [scanDot](#scanDot) (with `ignoreText` enabled)
3. Build a parse tree of runtime tags using [parseDot](#parseDot)
4. Scan variables in the parse tree using [scanVariables](#scanVariables)

See [scanVariables](#scanVariables) for details of the resulting analysis.

**Kind**: global function  
**Returns**: <code>Object</code> - an object mapping root scope names to their analyses  
**See**

- renderDefs
- scanDot
- parseDot
- scanVariables


| Param | Type | Description |
| --- | --- | --- |
| template | <code>string</code> | a doT.js template string |
| [options] | <code>Object</code> | an object containing options to pass to underlyiing scanners |
| [scope] | <code>Scope</code> | the root scope to use for name resolution |

<a name="scanVariables"></a>

### scanVariables(tokens, [options], [scope]) ⇒ <code>Object</code>
Scans an array of doT.js runtime template tokens for variables used in tags
and returns a mapping of variable references to objects describing the
contexts in which they are used.

Each variable maps to an object that may contain the following properties:

- `name` (`string`): The name of the variable
- `type` (`Type`): The type of the variable (as returned by `estree-analyzer`)
- `value` (`*`): The value of the variable (always a string for doT defines)
- `param` (`string`): Name of the optional substitution parameter in a doT define
- `interpolated` (`boolean`): The variable was used for interpolation: `{{!v}}`, `{{=v}}`
- `escaped` (`boolean`): The variable was used in an escaped reference: `{{!v}}`
- `unescaped` (`boolean`): The variable was used in an unescaped reference: `{{=v}}`
- `section` (`boolean`): The variable was used in a conditional or iteration section: `{{?v}}`, `{{??v}}`, `{{~v}}`
- `conditional` (`boolean`): The variable was used in a conditional section: `{{?v}}`, `{{??v}}`
- `iteration` (`boolean`): The variable was used in an iteration section: `{{~v}}`
- `members` (`Object`): An object mapping member variable references to usage context (for object types)
- `elements` (`Object`): An object containing the usage context of the array elements (for array types)

**Kind**: global function  
**Returns**: <code>Object</code> - an object mapping root scope names to their analyses  

| Param | Type | Description |
| --- | --- | --- |
| tokens | <code>Array.&lt;Object&gt;</code> | an array of parsed doT.js runtime template tokens |
| [options] | <code>Object</code> | an object containing options controlling the analysis |
| [scope] | <code>Scope</code> | the root scope to use for name resolution |


## License

`dot-var` is available under the [ISC license](LICENSE).
