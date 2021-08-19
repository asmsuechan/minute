import { convertToHTMLString } from '../src/index';

test('Heading', () => {
  const testCases = [
    ['# h1 test', '<h1>h1 test</h1>'],
    ['## h2 test', '<h2>h2 test</h2>'],
    ['### h3 test', '<h3>h3 test</h3>'],
    ['#### h4 test', '<h4>h4 test</h4>'],
    ['# h1 with **bold**', '<h1>h1 with <strong>bold</strong></h1>'],
    ['## h2 with **bold**', '<h2>h2 with <strong>bold</strong></h2>'],
    ['### h3 with **bold**', '<h3>h3 with <strong>bold</strong></h3>'],
    ['#### h4 with **bold**', '<h4>h4 with <strong>bold</strong></h4>'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Link', () => {
  const testCases = [
    ['[example](https://example.com)', '<p><a href="https://example.com">example</a></p>'],
    ['[](https://example.com)', '<p></p>'],
    ['[no-link]()', '<p><a href="">no-link</a></p>'],
    [
      '[link with **bold**](https://example.com)',
      '<p><a href="https://example.com">link with <strong>bold</strong></a></p>',
    ],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Img', () => {
  const testCases = [
    ['![example](https://example.com/img.jpg)', '<p><img src="https://example.com/img.jpg" alt="example" /></p>'],
    // MUST FIX: ['![](https://example.com/img.jpg)', '<img src="https://example.com/img.jpg" alt="" />'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Bold', () => {
  const testCases = [
    ['**bold**', '<p><strong>bold</strong></p>'],
    ['normal**bold**normal', '<p>normal<strong>bold</strong>normal</p>'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Italic', () => {
  const testCases = [
    ['__italic__', '<p><i>italic</i></p>'],
    ['normal__italic__normal', '<p>normal<i>italic</i>normal</p>'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Si', () => {
  const testCases = [
    ['~~si~~', '<p><strike>si</strike></p>'],
    ['normal~~si~~normal', '<p>normal<strike>si</strike>normal</p>'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Code', () => {
  const testCases = [
    ['`code`', '<p><code>code</code></p>'],
    ['`code**test**`', '<p><code>code**test**</code></p>'],
    ['`code**test**`test', '<p><code>code**test**</code>test</p>'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('List', () => {
  const testCases = [
    ['* a', '<ul><li>a</li></ul>'],
    ['* a\n* b', '<ul><li>a</li><li>b</li></ul>'],
    ['* a\n  * nested', '<ul><li>a<ul><li>nested</li></ul></li></ul>'],

    ['- a', '<ul><li>a</li></ul>'],
    ['- a\n- b', '<ul><li>a</li><li>b</li></ul>'],
    ['- a\n  - nested', '<ul><li>a<ul><li>nested</li></ul></li></ul>'],

    ['+ a', '<ul><li>a</li></ul>'],
    ['+ a\n+ b', '<ul><li>a</li><li>b</li></ul>'],
    ['+ a\n  + nested', '<ul><li>a<ul><li>nested</li></ul></li></ul>'],

    ['* **bold**\n  * __nested__', '<ul><li><strong>bold</strong><ul><li><i>nested</i></li></ul></li></ul>'],
    [
      '* **bold**\n  * __nested__\n  * ~~nested~~\n* indent',
      '<ul><li><strong>bold</strong><ul><li><i>nested</i></li><li><strike>nested</strike></li></ul><li>indent</li></li></ul>',
    ],
    ['* a\n* b\n  * c\n* d', '<ul><li>a</li><li>b<ul><li>c</li></ul><li>d</li></li></ul>'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Ol', () => {
  const testCases = [
    ['1. a', '<ol><li>a</li></ol>'],
    ['11. a', '<ol><li>a</li></ol>'],
    ['1. a\n2. b', '<ol><li>a</li><li>b</li></ol>'],
    ['1. a\n  1. b', '<ol><li>a<ol><li>b</li></ol></li></ol>'],
    ['1. a\n  1. b**bold**', '<ol><li>a<ol><li>b<strong>bold</strong></li></ol></li></ol>'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Table', () => {
  const testCases = [
    [
      '|left|center|right|\n|:-|:-:|-:|\n|left|center|right|',
      '<table><thead><tr><th align="left">left</th><th align="center">center</th><th align="right">right</th></tr></thead><tbody><td align="left">left</td><td align="center">center</td><td align="right">right</td></tbody></table>',
    ],
    [
      '|left|center|right|\n|:-|:-:|-:|\n|left|center|right|\n',
      '<table><thead><tr><th align="left">left</th><th align="center">center</th><th align="right">right</th></tr></thead><tbody><td align="left">left</td><td align="center">center</td><td align="right">right</td></tbody></table>',
    ],
    [
      '|left|center|right|\n|:-|:-:|-:|\n|left|center|right|\n\n',
      '<table><thead><tr><th align="left">left</th><th align="center">center</th><th align="right">right</th></tr></thead><tbody><td align="left">left</td><td align="center">center</td><td align="right">right</td></tbody></table>',
    ],
    [
      '|left|center|right|\n|:-|:-:|-:|\n|**left**|[center](https://example.com)|right|',
      '<table><thead><tr><th align="left">left</th><th align="center">center</th><th align="right">right</th></tr></thead><tbody><td align="left"><p><strong>left</strong></p></td><td align="center"><p><a href="https://example.com">center</a></p></td><td align="right">right</td></tbody></table>',
    ],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Pre', () => {
  const testCases = [
    ['```\ncodeblock\n```', '<pre><code>codeblock\n</code></pre>'],
    ['```\ncodeblock**bold**\n```', '<pre><code>codeblock**bold**\n</code></pre>'],
    ['```\ncodeblock**bold**\n\na\n```', '<pre><code>codeblock**bold**\n\na\n</code></pre>'],
    ['```\ncodeblock**bold**\n```\n\n', '<pre><code>codeblock**bold**\n</code></pre>'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Blockquote', () => {
  const testCases = [
    ['> quote', '<blockquote>quote</blockquote>'],
    ['> quote\n', '<blockquote>quote</blockquote>'],
    ['> quote\n\n', '<blockquote>quote</blockquote>'],
    ['> quote\n>> quote', '<blockquote>quote<blockquote>quote</blockquote></blockquote>'],
  ];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('Text', () => {
  const testCases = [['text', '<p>text</p>']];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('with HTML elements', () => {
  const testCases = [['<strong>bold</strong>**bold**', '<p><strong>bold</strong><strong>bold</strong></p>']];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

test('with an irregular elements', () => {
  const testCases = [['__a**b__c**d__e**', '<p><i><p>a<strong>b__c</strong>d</p></i>e**</p>']];

  testCases.forEach((testCase) => {
    expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
  });
});

// test('Break', () => {
//   const testCases = [
//     ['\n', ''],
//     ['a\nb\n', 'ab'],
//     ['\n\n', '<br /><br />'],
//     ['\n\na', '<br /><br />a'],
//     ['a\n\nb', 'a<br />b'],
//   ];
//
//   testCases.forEach((testCase) => {
//     expect(convertToHTMLString(testCase[0])).toBe(testCase[1]);
//   });
// });
