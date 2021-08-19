import { Token } from './models/token';
import { BlockMdWithType } from './models/block_md_with_type';
import { Attribute } from './models/attribute';
import { genTextElement } from './lexer';

export const parse = (markdownRow: BlockMdWithType) => {
  if (markdownRow.mdType === 'list') {
    return _tokenizeList(markdownRow.content);
  } else if (markdownRow.mdType === 'pre') {
    return _tokenizePre(markdownRow.content);
  } else if (markdownRow.mdType === 'table') {
    return _tokenizeTable(markdownRow.content);
  } else if (markdownRow.mdType === 'blockquote') {
    return _tokenizeBlockquote(markdownRow.content);
  }
  return _tokenizeText(markdownRow.content);
};

const rootToken: Token = {
  id: 0,
  elmType: 'root',
  content: '',
  parent: {} as Token,
};

const LIST_REGEXP = /^( *)([-\*\+] (.+))$/m;
const OL_REGEXP = /^( *)((\d+)\. (.+))$/m;
const UL = 'ul';
const LIST = 'li';
const OL = 'ol';

const BLOCKQUOTE_REGEXP = /^([>| ]+)(.+)/;

const textElmRegexps = [
  { elmType: 'h1', regexp: /^# (.+)$/ },
  { elmType: 'h2', regexp: /^## (.+)$/ },
  { elmType: 'h3', regexp: /^### (.+)$/ },
  { elmType: 'h4', regexp: /^#### (.+)$/ },
  { elmType: 'code', regexp: /`(.+?)`/ },
  { elmType: 'img', regexp: /\!\[(.*)\]\((.+)\)/ },
  {
    elmType: 'link',
    regexp: /\[(.*)\]\((.*)\)/,
  },
  { elmType: 'strong', regexp: /\*\*(.*)\*\*/ },
  { elmType: 'italic', regexp: /__(.*)__/ },
  { elmType: 'si', regexp: /~~(.*)~~/ },
  {
    elmType: 'list',
    regexp: LIST_REGEXP, // * list or - list
  },
  { elmType: 'ol', regexp: OL_REGEXP },
  { elmType: 'blockquote', regexp: BLOCKQUOTE_REGEXP },
];

const _tokenizeText = (textElement: string, initialId: number = 0, initialRoot: Token = rootToken) => {
  let elements: Token[] = [];
  let parent: Token = initialRoot;

  let id = initialId;

  const _tokenize = (originalText: string, p: Token) => {
    let processingText = originalText;
    parent = p;
    let pToken = p;
    while (processingText.length !== 0) {
      const matchArray = textElmRegexps
        .map((regexp) => {
          return {
            elmType: regexp.elmType,
            matchArray: processingText.match(regexp.regexp) as RegExpMatchArray,
          };
        })
        .filter((m) => m.matchArray);

      if (matchArray.length === 0) {
        id += 1;
        const onlyText = genTextElement(id, processingText, pToken);
        processingText = '';
        elements.push(onlyText);
      } else {
        const outerMostElement = matchArray.reduce((prev, curr) =>
          Number(prev.matchArray.index) < Number(curr.matchArray.index) ? prev : curr
        );
        if (
          outerMostElement.elmType !== 'h1' &&
          outerMostElement.elmType !== 'h2' &&
          outerMostElement.elmType !== 'h3' &&
          outerMostElement.elmType !== 'h4' &&
          parent.elmType !== 'h1' &&
          parent.elmType !== 'h2' &&
          parent.elmType !== 'h3' &&
          parent.elmType !== 'h4' &&
          parent.elmType !== 'ul' &&
          parent.elmType !== 'li' &&
          parent.elmType !== 'ol' &&
          parent.elmType !== 'link' &&
          parent.elmType !== 'code'
        ) {
          id += 1;
          pToken = {
            id,
            elmType: 'paragraph',
            content: '',
            parent,
          } as Token;
          parent = pToken;
          elements.push(parent);
        }
        if (Number(outerMostElement.matchArray.index) > 0) {
          // "aaa**bb**cc" -> TEXT Token + "**bb**cc" にする
          const text = processingText.substring(0, Number(outerMostElement.matchArray.index));
          id += 1;
          const textElm = genTextElement(id, text, parent);
          elements.push(textElm);
          processingText = processingText.replace(text, '');
        }

        if (parent.elmType === 'code') {
          id += 1;
          const codeContent = genTextElement(id, outerMostElement.matchArray[0], parent);
          elements.push(codeContent);
          processingText = processingText.replace(outerMostElement.matchArray[0], '');
        } else {
          id += 1;
          let attributes: Attribute[] = [];
          if (outerMostElement.elmType === 'img') {
            attributes.push({ attrName: 'src', attrValue: outerMostElement.matchArray[2] });
          } else if (outerMostElement.elmType === 'link') {
            attributes.push({ attrName: 'href', attrValue: outerMostElement.matchArray[2] });
          }
          const elmType = outerMostElement.elmType;
          const content = outerMostElement.matchArray[1];
          const elm: Token = {
            id,
            elmType,
            content,
            parent,
            attributes,
          };

          // Set the outer element to parent
          parent = elm;
          elements.push(elm);

          processingText = processingText.replace(outerMostElement.matchArray[0], '');

          _tokenize(outerMostElement.matchArray[1], parent);
        }
        parent = p;
      }
    }
  };

  _tokenize(textElement, parent);
  return elements;
};

const _tokenizeList = (listString: string) => {
  const listMatch = listString.match(LIST_REGEXP);
  const olMatch = listString.match(OL_REGEXP);
  // check if the root type of a list
  const rootType =
    (listMatch && UL) ||
    (olMatch && OL) ||
    (listMatch && olMatch && Number(listMatch.index) < Number(olMatch.index) ? OL : UL);

  let id = 1;
  const rootUlToken: Token = {
    id,
    elmType: rootType,
    content: '',
    parent: rootToken,
  };
  let parents = [rootUlToken];
  let parent = rootUlToken;
  let prevIndentLevel = 0;
  let tokens: Token[] = [rootUlToken];
  listString
    .split(/\r\n|\r|\n/)
    .filter(Boolean)
    .forEach((l) => {
      const listType = l.match(LIST_REGEXP) ? UL : OL;

      const match =
        listType === UL ? (l.match(LIST_REGEXP) as RegExpMatchArray) : (l.match(OL_REGEXP) as RegExpMatchArray);

      const currentIndentLevel = match[1].length;
      const currentIndent = match[1];
      if (currentIndentLevel < prevIndentLevel) {
        // Change the parent
        for (let i = 0; i < parents.length - 1; i++) {
          if (
            parents[i].content.length <= currentIndent.length &&
            currentIndent.length < parents[i + 1].content.length
          ) {
            parent = parents[i];
          }
        }
      } else if (currentIndentLevel > prevIndentLevel) {
        // Create a parent
        id += 1;
        const lastToken = tokens[tokens.length - 1];
        const parentToken =
          match && ['code', 'italic', 'si', 'strong'].includes(lastToken.parent.elmType) ? lastToken.parent : lastToken;
        const newParent: Token = {
          id,
          elmType: listType,
          content: currentIndent,
          parent: parentToken.parent,
        };
        parents.push(newParent);
        tokens.push(newParent);
        parent = newParent;
      }
      prevIndentLevel = currentIndentLevel;

      id += 1;
      const listToken: Token = {
        id,
        elmType: LIST,
        content: currentIndent, // Indent level
        parent,
      };
      parents.push(listToken);
      tokens.push(listToken);
      const listContent = listMatch ? match[3] : match[4];
      const listText = _tokenizeText(listContent, id, listToken);
      id += listText.length;
      tokens.push(...listText);
    });
  return tokens.sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
};

const _tokenizePre = (preString: string) => {
  const preToken: Token = {
    id: 0,
    elmType: 'pre',
    content: '',
    parent: rootToken,
  };
  const textToken: Token = {
    id: 1,
    elmType: 'text',
    content: preString,
    parent: preToken,
  };
  return [preToken, textToken];
};

export const _tokenizeTable = (tableString: string) => {
  let id = 0;
  const tableToken: Token = {
    id,
    elmType: 'table',
    content: '',
    parent: rootToken,
  };
  let tokens: Token[] = [tableToken];
  const tableLines = tableString.split('\n');
  tableLines.forEach((t, i) => {
    let attributes: Attribute[] = [];
    if (tableLines.length >= 2) {
      tableLines[1]
        .split('|')
        .filter(Boolean)
        .forEach((tableAlign) => {
          if (tableAlign.match(/^:([-]+)$/)) {
            attributes.push({ attrName: 'align', attrValue: 'left' });
          } else if (tableAlign.match(/^([-]+):$/)) {
            attributes.push({ attrName: 'align', attrValue: 'right' });
          } else if (tableAlign.match(/^:([-]+):$/)) {
            attributes.push({ attrName: 'align', attrValue: 'center' });
          }
        });
    }

    if (i === 0) {
      // Table Head
      id++;
      const theadToken: Token = {
        id,
        elmType: 'thead',
        content: '',
        parent: tableToken,
      };
      id++;
      const tableRow: Token = {
        id,
        elmType: 'tr',
        content: '',
        parent: theadToken,
      };
      tokens.push(theadToken, tableRow);
      t.split('|')
        .filter(Boolean)
        .map((headItem, i) => {
          const alignAttributes = attributes.length > 0 ? [attributes[i]] : [];
          id++;
          const tableHead: Token = {
            id,
            elmType: 'th',
            content: '',
            parent: tableRow,
            attributes: alignAttributes,
          };
          const textTokens = _tokenizeText(headItem, id, tableHead);
          id += textTokens.length;
          tokens.push(tableHead, ...textTokens);
        });
    } else if (i > 1) {
      // Skip Alignment
      // Table Body
      id++;
      const tbodyToken: Token = {
        id,
        elmType: 'tbody',
        content: '',
        parent: tableToken,
      };
      id++;
      const tableRow: Token = {
        id,
        elmType: 'tr',
        content: '',
        parent: tbodyToken,
      };
      tokens.push(tbodyToken, tableRow);
      t.split('|')
        .filter(Boolean)
        .map((bodyItem, i) => {
          id++;
          const tableData: Token = {
            id,
            elmType: 'td',
            content: bodyItem,
            parent: tbodyToken,
            attributes: [attributes[i]],
          };

          const textTokens = _tokenizeText(bodyItem, id, tableData);
          id += textTokens.length;
          tokens.push(tableData, ...textTokens);
        });
    }
  });
  return tokens;
};

// > abc¥n>> bbb multiline
const _tokenizeBlockquote = (blockquote: string) => {
  let id = 1;
  let parent: Token = {
    id,
    elmType: 'blockquote',
    content: '',
    parent: rootToken,
  };
  let tokens: Token[] = [parent];
  let parents = [{ level: 1, token: parent }];
  let prevNestLevel = 0;
  blockquote.split('\n').forEach((quote) => {
    const match = quote.match(BLOCKQUOTE_REGEXP);
    if (match) {
      const nestLevel = match[1].split('>').length - 2;
      if (prevNestLevel < nestLevel) {
        const times = [...Array(nestLevel - prevNestLevel)];
        times.forEach(() => {
          id++;
          const newBlockquote: Token = {
            id,
            elmType: 'blockquote',
            content: '',
            parent: parent,
          };
          parents.push({ level: nestLevel, token: newBlockquote });
          const textTokens = _tokenizeText(match[2], id, newBlockquote);
          id += textTokens.length;
          tokens.push(newBlockquote, ...textTokens);
          parent = newBlockquote;
        });
        prevNestLevel = nestLevel;
      } else {
        const textTokens = _tokenizeText(match[2], id, parent);
        id += textTokens.length;
        tokens.push(...textTokens);
      }
    } else {
      const textTokens = _tokenizeText(quote, id, parent);
      id += textTokens.length;
      tokens.push(...textTokens);
    }
  });
  return tokens;
};

const _createBreakToken = () => {
  return [
    {
      id: 1,
      elmType: 'break',
      content: '',
      parent: rootToken,
    },
  ] as Token[];
};
