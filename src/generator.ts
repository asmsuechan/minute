import { Token } from './models/token'
import { MergedToken } from './models/merged_token'

const _generateHtmlString = (tokens: Array<Token | MergedToken>) => {
  return tokens
    .map((t) => t.content)
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

const _createMergedContent = (
  currentToken: Token | MergedToken,
  parentToken: Token | MergedToken
) => {
  let content = '';
  switch (parentToken.elmType) {
    case 'li':
      content = `<li>${currentToken.content}</li>`;
      break;
    case 'ul':
      content = `<ul>${currentToken.content}</ul>`;
      break;
    case 'strong':
      content = `<strong>${currentToken.content}</strong>`;
      break;
    case 'merged':
      const position = _getInsertPosition(parentToken.content);

      content = `${parentToken.content.slice(0, position)}${
        currentToken.content
      }${parentToken.content.slice(position)}`;
  }
  return content;
};

const generate = (asts: Token[][]) => {
  // まず木構造を作って左の葉から処理をしていく。うーん、処理順に並び替えるだけでもいいかな？
  const htmlStrings = asts.map((lineTokens) => {
    let rearrangedAst: Array<Token | MergedToken> = lineTokens.reverse();

    while (!isAllElmParentRoot(rearrangedAst)) {
      let index = 0;
      while (index < rearrangedAst.length) {
        if (rearrangedAst[index].parent?.elmType === 'root') {
          // Rootにあるトークンの場合何もしない。
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
          // parentとマージする。
          // つまり2つ変更する。子は削除。親は置き換え。
          // 1つ親と合成したら1つ要素を消す。のでindexは変わらず。なのでマージしない時のみindex++する。
        }
      }
    }
    return _generateHtmlString(rearrangedAst);
  });
  return htmlStrings.join('');
};

export { generate };