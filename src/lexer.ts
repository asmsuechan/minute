import { Token } from './models/token'

const TEXT = 'text';
const STRONG = 'strong';

const STRONG_ELM_REGXP = /\*\*(.*?)\*\*/
const LIST_REGEXP = /^( *)([-|\*|\+] (.+))$/m;

const genTextElement = (id: number, text: string, parent: Token): Token => {
  return {
    id,
    elmType: TEXT,
    content: text,
    parent,
  };
}

const genStrongElement = (id: number, text: string, parent: Token): Token => {
  return {
    id,
    elmType: STRONG,
    content: '',
    parent,
  };
}

const matchWithStrongRegxp = (text: string) => {
  return text.match(STRONG_ELM_REGXP);
}

const matchWithListRegxp = (text: string) => {
  return text.match(LIST_REGEXP);
}

const analize = (markdown: string) => {
  const NEUTRAL_STATE = 'neutral_state';
  const LIST_STATE = 'list_state';
  let state = NEUTRAL_STATE;

  let lists = '';

  const rawMdArray = markdown.split(/\r\n|\r|\n/);
  let mdArray: Array<string> = [];

  rawMdArray.forEach((md, index) => {
    const listMatch = md.match(LIST_REGEXP);
    if (state === NEUTRAL_STATE && listMatch) {
      state = LIST_STATE;
      lists += `${md}\n`;
    } else if (state === LIST_STATE && listMatch) {
      // 最後の行がリストだった場合
      if (index === rawMdArray.length - 1) {
        lists += `${md}`;
        mdArray.push(lists)
      } else {
        lists += `${md}\n`;
      }
    } else if (state === LIST_STATE && !listMatch) {
      state = NEUTRAL_STATE;
      mdArray.push(lists)
      lists = ''; // 複数のリストがあった場合のためリスト変数をリセットする
    }

    if (lists.length === 0)
      mdArray.push(md);
  });

  return mdArray;
};


export { genTextElement, genStrongElement, matchWithStrongRegxp, matchWithListRegxp, analize }