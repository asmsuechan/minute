import { Token } from './models/token';
import { BlockMdWithType } from './models/block_md_with_type';

const TEXT = 'text';
const STRONG = 'strong';

const LIST_REGEXP = /^( *)([-|\*|\+] (.+))$/m;
const OL_REGEXP = /^( *)((\d+)\. (.+))$/m;
export const PRE_REGEXP = /^```[^`]*$/;
export const TABLE_HEAD_BODY_REGEXP = /(?=\|(.+?)\|)/g;
export const TABLE_ALIGN_REGEXP = /(?=\|([-|:]+?)\|)/g;
export const BLOCKQUOTE_REGEXP = /^([>| ]+)(.+)/;

const genTextElement = (id: number, text: string, parent: Token): Token => {
  return {
    id,
    elmType: TEXT,
    content: text,
    parent,
  };
};

const genStrongElement = (id: number, text: string, parent: Token): Token => {
  return {
    id,
    elmType: STRONG,
    content: '',
    parent,
  };
};

const analize = (markdown: string) => {
  const NEUTRAL_STATE = 'neutral_state';
  const LIST_STATE = 'list_state';
  const PRE_STATE = 'pre_state';
  const TABLE_HEAD_STATE = 'table_head_state';
  const TABLE_ALIGN_STATE = 'table_align_state';
  const TABLE_BODY_STATE = 'table_body_state';
  const BLOCKQUOTE_STATE = 'blockquote_state';

  let state = NEUTRAL_STATE;

  let lists = '';
  let pre = '';
  let table = '';
  let blockquote = '';

  // const rawMdArray = markdown.replace(/[\r\n|\r|\n/]$/, '').split(/\r\n|\r|\n/);
  const rawMdArray = markdown.split(/\r\n|\r|\n/);
  let mdArray: Array<BlockMdWithType> = [];

  rawMdArray.forEach((md, index) => {
    const listMatch = md.match(LIST_REGEXP) || md.match(OL_REGEXP);
    if (state === NEUTRAL_STATE && listMatch) {
      state = LIST_STATE;
      lists += `${md}\n`;
    } else if (state === LIST_STATE && listMatch) {
      lists += `${md}\n`;
    } else if (state === LIST_STATE && !listMatch) {
      state = NEUTRAL_STATE;
      mdArray.push({ mdType: 'list', content: lists });
      lists = '';
    }
    if (lists.length > 0 && (state === NEUTRAL_STATE || index === rawMdArray.length - 1)) {
      mdArray.push({ mdType: 'list', content: lists });
    }

    const preMatch = md.match(PRE_REGEXP);
    if (state === NEUTRAL_STATE && preMatch) {
      state = PRE_STATE;
    } else if (state === PRE_STATE && preMatch) {
      state = NEUTRAL_STATE;
      mdArray.push({ mdType: 'pre', content: pre });
      pre = '';
      return;
    } else if (state === PRE_STATE && !preMatch) {
      pre += md.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      pre += '\n';
    }
    if (pre.length > 0 && (state === NEUTRAL_STATE || index === rawMdArray.length - 1)) {
      mdArray.push({ mdType: 'pre', content: pre });
    }

    const tableHeadBodyMatch = md.match(TABLE_HEAD_BODY_REGEXP);
    const tableAlignMatch = md.match(TABLE_ALIGN_REGEXP);
    if (state === NEUTRAL_STATE && tableHeadBodyMatch) {
      state = TABLE_HEAD_STATE;
      table += `${md}\n`;
    } else if (state === TABLE_HEAD_STATE && tableAlignMatch) {
      state = TABLE_ALIGN_STATE;
      table += `${md}\n`;
    } else if (state === TABLE_HEAD_STATE && !tableAlignMatch) {
      state = NEUTRAL_STATE;
    } else if (state === TABLE_ALIGN_STATE && tableHeadBodyMatch) {
      state = TABLE_BODY_STATE;
      table += `${md}\n`;
    } else if (state === TABLE_BODY_STATE && !tableHeadBodyMatch) {
      state = NEUTRAL_STATE;
    } else if (state === TABLE_ALIGN_STATE && !tableHeadBodyMatch) {
      state = NEUTRAL_STATE;
    }
    if (table.length > 0 && (state === NEUTRAL_STATE || index === rawMdArray.length - 1)) {
      mdArray.push({ mdType: 'table', content: table.replace(/\n$/, '') });
      table = '';
    }

    const blockquoteMatch = md.match(BLOCKQUOTE_REGEXP);
    if (state === NEUTRAL_STATE && blockquoteMatch) {
      state = BLOCKQUOTE_STATE;
      blockquote += `${md}\n`;
    } else if (state === BLOCKQUOTE_STATE && md.length > 0) {
      blockquote += `${md}\n`;
    } else if (state === BLOCKQUOTE_STATE && md === '') {
      state = NEUTRAL_STATE;
    }
    if (blockquote.length > 0 && (state === NEUTRAL_STATE || index === rawMdArray.length - 1)) {
      mdArray.push({
        mdType: 'blockquote',
        content: blockquote.replace(/\n$/, ''),
      });
      blockquote = '';
    }

    if (
      lists.length === 0 &&
      state !== LIST_STATE &&
      pre.length === 0 &&
      state !== PRE_STATE &&
      table.length === 0 &&
      state !== TABLE_ALIGN_STATE &&
      state !== TABLE_BODY_STATE &&
      state !== TABLE_HEAD_STATE &&
      blockquote.length === 0 &&
      state !== BLOCKQUOTE_STATE &&
      md.length !== 0
    )
      mdArray.push({ mdType: 'text', content: md });

    // if (md.length === 0 && state !== PRE_STATE) {
    //   mdArray.push({ mdType: 'break', content: '' });
    //   return;
    // }
  });

  return mdArray;
};

export { genTextElement, genStrongElement, analize };
