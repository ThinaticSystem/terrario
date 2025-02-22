# Index of contents
- [Basic APIs](#basic-apis)
  - T.createLanguage()
  - parser.parse()
  - T.str()
  - T.seq()
  - T.alt()
  - T.sep()
  - T.match()
  - T.notMatch()
  - parser.map()
  - parser.text()
  - parser.many()
  - parser.option()
  - T.newline
  - T.sof
  - T.eof
  - T.char
  - T.lineBegin
  - T.lineEnd
- [Parsing result](#parsing-result)
- [Control with states](#control-with-states)
  - T.cond()
- [Custom parsers](#custom-parsers)
  - new T.Parser()
  - T.success()
  - T.failure()
- [Minor APIs](#minor-apis)
  - T.lazy()
  - T.succeeded()
  - T.cr
  - T.lf
  - T.crlf

# Basic APIs

## T.createLanguage()
```
T.createLanguage(syntaxes: Record<string, (rules: Language) => Parser>): Language
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

We can define some syntax rules to build a language.  
Each rule is lazy evaluated.

```ts
const lang = T.createLanguage({
  root: rules => {
    return T.alt([
      rules.rule1,
      rules.rule2,
    ]);
  },

  rule1: rules => {
    return T.str('a');
  },

  rule2: rules => {
    return T.str('b');
  },
});

const result = lang.root.parse('a');
console.log(result);
// => { success: true, value: 'a', index: 1 }
```

## parser.parse()
```
parser.parse(input: string, state?: any): Result
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Parses with the parser.

```ts
const parser = T.str('a');

parser.parse('a');

// specify states
parser.parse('a', { flag: true, count: 0 });
```

## T.str()
```
T.str(value: string): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Generates a parser that consumes the specified string.

```ts
// [Equivalent PEG] "test"
const parser = T.str('test');

const result = parser.parse('test');
console.log(result);
// => { success: true, value: 'test', index: 4 }
```

### With regular expression
```
T.str(pattern: Regexp): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Generates a parser that consumes the specified regular expression.

```ts
// [Equivalent PEG] [a-z]
const parser = T.str(/[a-z]/);

const result = parser.parse('a');
console.log(result);
// => { success: true, value: 'a', index: 1 }
```

## T.seq()
```
T.seq(parsers: Parser[]): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Generates a parser that applies parsers in sequence.

```ts
// [Equivalent PEG] "a" "1"
const parser = T.seq([
  T.str('a'),
  T.str('1'),
]);

const result = parser.parse('a1');
console.log(result);
// => { success: true, value: [ 'a', '1' ], index: 2 }
```

### Select a return value
```
T.seq(parsers: Parser[], select: boolean): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

You can also select a result to be returned from all of them:
```ts
// [Equivalent PEG] value0:"a" value1:"1" { return value1; }
const parser = T.seq([
  T.str('a'),
  T.str('1'),
], 1);

const result = parser.parse('a1');
console.log(result);
// => { success: true, value: '1', index: 2 }
```

## T.alt()
```
T.alt(parsers: Parser[]): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Generates a parser that tries to match one of the parsers.  
The parsers are used in order of precedence.

```ts
// [Equivalent PEG] "a" / "1"
const parser = T.alt([
  T.str('a'),
  T.str('1'),
]);

let result;

result = parser.parse('a');
console.log(result);
// => { success: true, value: 'a', index: 1 }

result = parser.parse('1');
console.log(result);
// => { success: true, value: '1', index: 1 }
```

## T.sep()
```
T.sep(item: Parser, separator: Parser, min: number): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Generates a parser that splits a string and extracts multiple items.  
The `separator` parser is used to split the string, and the `item` parser is used to consume each item.

The `min` argument specifies the minimum number of times it will be applied.  
This argument must be greater than or equal to 1.

```ts
let parser, result;

// (1)
// [Equivalent PEG] head:"a" tail:("," @"a")* { return [head, ...tail]; }
parser = T.sep(T.str('a'), T.str(','), 1);

result = parser.parse('a');
console.log(result);
// => { success: true, value: [ 'a' ], index: 1 }

result = parser.parse('a,a');
console.log(result);
// => { success: true, value: [ 'a', 'a' ], index: 3 }

// (2)
// [Equivalent PEG]
// newline = "\r\n" / [\r\n]
// item = $(!newline .)+
// parser = head:item tail:(newline @item)* { return [head, ...tail]; }
parser = T.sep(T.seq([
  T.notMatch(T.newline),
  T.char
], 1).many(0).text(), T.newline, 1);

result = parser.parse('abc\r\nxyz');
console.log(result);
// => { success: true, value: [ 'abc', 'xyz' ], index: 8 }
```

## T.match()
```
T.match(parser: Parser): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Generates a new parser to continue if the match is successful. (Positive lookahead)  
The generated parser does not consume input.

```ts
// [Equivalent PEG] &"a" "abc"
const parser = T.seq([
  T.match(T.str('a')),
  T.str('abc'),
]);
const result = parser.parse('abc');
console.log(result);
// => { success: true, value: [ 'a', 'abc' ], index: 3 }
```

## T.notMatch()
```
T.notMatch(parser: Parser): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Generates a new parser to continue if the match fails. (Negative lookahead)  
The generated parser does not consume input.

```ts
// [Equivalent PEG] !"x" "abc"
const parser = T.seq([
  T.notMatch(T.str('x')),
  T.str('abc'),
]);
const result = parser.parse('abc');
console.log(result);
// => { success: true, value: [ null, 'abc' ], index: 3 }
```

## parser.map()
```
parser.map(fn: (value) => any): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Maps the parsed results using the specified function.

```ts
// [Equivalent PEG] value0:"a" value1:"b" value2:"c" { return [value0, value2]; }
const parser = T.seq([
  T.str('a'),
  T.str('b'),
  T.str('c'),
]).map(value => {
  return [value[0], value[2]];
});

const result = parser.parse('abc');
console.log(result);
// => { success: true, value: [ 'a', 'c' ], index: 3 }
```

## parser.text()
```
parser.text(): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

The parser maps the consumed portion as a string.

```ts
// [Equivalent PEG] "a" "b" "c" { return text(); }
const parser = T.seq([
  T.str('a'),
  T.str('b'),
  T.str('c'),
]).text();

const result = parser.parse('abc');
console.log(result);
// => { success: true, value: 'abc', index: 3 }
```

## parser.many()
```
parser.many(min: number): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Repeatedly applies the parser.  
The argument min specifies the minimum number of times it will be applied.

Matches 0 or more items:
```ts
// [Equivalent PEG] "abc"*
const parser = T.str('abc').many(0);

let result;

result = parser.parse('');
console.log(result);
// => { success: true, value: [], index: 0 }

result = parser.parse('abc');
console.log(result);
// => { success: true, value: [ 'abc' ], index: 3 }
```

Matches 1 or more items:
```ts
// [Equivalent PEG] "abc"+
const parser = T.str('abc').many(1);

let result;

result = parser.parse('abc');
console.log(result);
// => { success: true, value: [ 'abc' ], index: 3 }

result = parser.parse('abcabc');
console.log(result);
// => { success: true, value: [ 'abc', 'abc' ], index: 6 }
```

### With terminator
```
parser.many(min: number, terminator: Parser): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

The parser.many() can have a termination condition.

The following example uses many to match strings up to ")".
The terminating condition ")" is not consumed.
```ts
// [Equivalent PEG] "(" (!")" @.)+ ")"
const parser = T.seq([
	T.str('('),
	T.char.many(1, T.str(')')),
	T.str(')'),
]);

const result = parser.parse('(abc)');
console.log(result);
// => { success: true, value: [ '(', [ 'a', 'b', 'c' ], ')' ], index: 5 }
```

## parser.option()
```
parser.option(): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Generates a new parser that returns null even if the match fails.  
Make the parser consumption optional.

```ts
// [Equivalent PEG] "a" "b"?
const parser = T.seq([
  T.str('a'),
  T.str('b').option(),
]);

let result;

result = parser.parse('ab');
console.log(result);
// => { success: true, value: [ 'a', 'b' ], index: 2 }

result = parser.parse('a');
console.log(result);
// => { success: true, value: [ 'a', null ], index: 1 }
```

## T.newline
```
T.newline: Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Matches `\r\n` or `\r` or `\n`

## T.sof
```
T.sof: Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Matches start of input string.

## T.eof
```
T.eof: Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Matches end of input string.

```ts
// [Equivalent PEG] "a" !.
const parser = T.seq([
  T.str('a'),
  T.eof,
]);

const result = parser.parse('a');
console.log(result);
// => { success: true, value: [ 'a', null ], index: 1 }
```

## T.char
```
T.char: Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

A parser that consumes any single character.

```ts
// [Equivalent PEG] .
const parser = T.char;

const result = parser.parse('a');
console.log(result);
// => { success: true, value: 'a', index: 1 }
```

## T.lineBegin
```
T.lineBegin: Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

```ts
//TODO
```

## T.lineEnd
```
T.lineEnd: Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

```ts
//TODO
```

# Parsing result
```ts
type Success = {
	success: true;
	index: number;
	value: any;
};
type Failure = {
	success: false;
	index: number;
};
type Result = Success | Failure;
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Result structure is unstable yet.

# Control with states

## T.cond()
```
T.cond(predicate: (state: any) => boolean): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Conditional branching can be performed using the state.

```ts
const parser = T.seq([
  T.cond(state => state.enabled),
  T.char,
]);

const result = parser.parse('a', { enabled: true });
console.log(result);
// => { success: true, value: [ null, 'a' ], index: 1 }
```

# Custom parsers

## new T.Parser()
```
new T.Parser(handler: (input: string, index: number, state: any) => Result)
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Makes a new custom parser.

```ts
const parser = new T.Parser((input, index, state) => {
  if (index >= input.length) {
    return T.failure(index);
  }
  return T.success(index, 'result value');
});
```

### T.success()
```
T.success(index: number, value: any): Success
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Generates a result indicating the success of a parser.

### T.failure()
```
T.failure(index: number): Failure
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Generates a result indicating the failure of a parser.

# Minor APIs

## T.lazy()
```
T.lazy(fn: () => Parser): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Generates a new parser that is lazy-evaluated.  
Normally there is no need to use this API. Use T.createLanguage() instead.

## T.succeeded()
```
T.succeeded(value: any): Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Stable

Generates a parser that succeeds with the specified value.

```ts
const parser = T.succeeded('abc');
const result = parser.parse('');
console.log(result);
// => { success: true, value: "abc", index: 0 }
```

## T.cr
```
T.cr: Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Matches `\r` (CR)

## T.lf
```
T.lf: Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Matches `\n` (LF)

## T.crlf
```
T.crlf: Parser
```
![mark](https://placehold.co/15x15/1cc8d4/1cc8d4.png) Stability: Experimental

Matches `\r\n` (CR + LF)
