import { Token } from './models/token';
import { MergedToken } from './models/merged_token';

const _generateHtmlString = (tokens: Array<Token | MergedToken>) => {
  return tokens
    .map((t) => {
      if (t.elmType === 'break') {
        return '<br />';
      } else if (tokens.length === 1 && tokens[0].elmType === 'text') {
        // MUST FIX: Move this section to parser if possible
        return `<p>${t.content}</p>`;
      } else {
        return t.content;
      }
    })
    .reverse()
    .join('');
};

const isAllElmParentRoot = (tokens: Array<Token | MergedToken>) => {
  return tokens.map((t) => t.parent?.elmType).every((val) => val === 'root');
};

const _getInsertPosition = (content: string) => {
  let state = 0;
  const closeTagParentheses = ['<', '>'];
  let position = 0;
  content.split('').some((c, i) => {
    if (state === 1 && c === closeTagParentheses[state]) {
      position = i;
      return true;
    } else if (state === 0 && c === closeTagParentheses[state]) {
      state++;
    }
  });
  return position + 1;
};

const _createMergedContent = (currentToken: Token | MergedToken, parentToken: Token | MergedToken) => {
  let content = '';
  switch (parentToken.elmType) {
    case 'paragraph':
      content = `<p>${currentToken.content}</p>`;
      break;
    case 'li':
      content = `<li>${currentToken.content}</li>`;
      break;
    case 'ul':
      content = `<ul>${currentToken.content}</ul>`;
      break;
    case 'ol':
      content = `<ol>${currentToken.content}</ol>`;
      break;
    case 'strong':
      content = `<strong>${currentToken.content}</strong>`;
      break;
    case 'link':
      const href = parentToken.attributes ? parentToken.attributes[0].attrValue : '';
      content = `<a href="${href}">${currentToken.content}</a>`;
      break;
    case 'img':
      const src = parentToken.attributes ? parentToken.attributes[0].attrValue : '';
      content = `<img src="${src}" alt="${currentToken.content}" />`;
      break;
    case 'italic':
      content = `<i>${currentToken.content}</i>`;
      break;
    case 'si':
      content = `<strike>${currentToken.content}</strike>`;
      break;
    case 'h1':
      content = `<h1>${currentToken.content}</h1>`;
      break;
    case 'h2':
      content = `<h2>${currentToken.content}</h2>`;
      break;
    case 'h3':
      content = `<h3>${currentToken.content}</h3>`;
      break;
    case 'h4':
      content = `<h4>${currentToken.content}</h4>`;
      break;
    case 'code':
      content = `<code>${currentToken.content}</code>`;
      break;
    case 'pre':
      content = `<pre><code>${currentToken.content}</code></pre>`;
      break;
    case 'table':
      content = `<table>${currentToken.content}</table>`;
      break;
    case 'tbody':
      content = `<tbody>${currentToken.content}</tbody>`;
      break;
    case 'thead':
      content = `<thead>${currentToken.content}</thead>`;
      break;
    case 'tr':
      content = `<tr>${currentToken.content}</tr>`;
      break;
    case 'th':
      const thAttributes = parentToken.attributes
        ?.filter(Boolean)
        .map((attr) => ` ${attr.attrName}="${attr.attrValue}"`)
        .join('');
      content = `<th${thAttributes}>${currentToken.content}</th>`;
      break;
    case 'td':
      const tdAttributes = parentToken.attributes
        ?.filter(Boolean)
        .map((attr) => ` ${attr.attrName}="${attr.attrValue}"`)
        .join('');
      content = `<td${tdAttributes}>${currentToken.content}</td>`;
      break;
    case 'blockquote':
      content = `<blockquote>${currentToken.content}</blockquote>`;
      break;
    case 'merged':
      const position = _getInsertPosition(parentToken.content);

      content = `${parentToken.content.slice(0, position)}${currentToken.content}${parentToken.content.slice(
        position
      )}`;
  }
  return content;
};

const generate = (asts: Token[][]) => {
  const htmlStrings = asts.map((lineTokens) => {
    let rearrangedAst: Array<Token | MergedToken> = lineTokens.reverse();

    while (!isAllElmParentRoot(rearrangedAst)) {
      let index = 0;
      while (index < rearrangedAst.length) {
        if (rearrangedAst[index].parent?.elmType === 'root') {
          index++;
        } else {
          const currentToken = rearrangedAst[index];
          rearrangedAst = rearrangedAst.filter((_, t) => t !== index); // Remove current token
          const parentIndex = rearrangedAst.findIndex((t) => t.id === currentToken.parent.id);
          const parentToken = rearrangedAst[parentIndex];
          const mergedToken: MergedToken = {
            id: parentToken.id,
            elmType: 'merged',
            content: _createMergedContent(currentToken, parentToken),
            parent: parentToken.parent,
          };
          rearrangedAst.splice(parentIndex, 1, mergedToken);
        }
      }
    }
    return _generateHtmlString(rearrangedAst);
  });
  return htmlStrings.join('');
};

export { generate };
