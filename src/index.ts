import { parse } from './parser';
import { generate } from './generator';
import { analize } from './lexer';

export const convertToHTMLString = (markdown: string) => {
  const mdArray = analize(markdown);
  const asts = mdArray.map((md) => parse(md));
  const htmlString = generate(asts);
  return htmlString;
};

// console.log(convertToHTMLString('1111111\n```\nabc\n<aaa></bbb>\n```\n\n* aaaa\n* bbb\n  * ccc\n* ddd'));
// console.log(convertToHTMLString('|left|center|right|\n|:-|:-:|-:|\n|left|center|right|'));
// console.log(convertToHTMLString('> quote\n>> quote'));
// console.log(convertToHTMLString('* **bbbbb**'));
// console.log(convertToHTMLString('# h1\n__aaaaa__'));
// console.log(convertToHTMLString('[aaa](https://a.com)'));
// console.log(convertToHTMLString('* a\n* b\n  * c\n* d'));
// console.log(convertToHTMLString('* **bold**\n  * __nested__'));
// console.log(convertToHTMLString('1. a'));
