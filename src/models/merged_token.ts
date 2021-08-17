import { Token } from './token';
import { Attribute } from './attribute';

export type MergedToken = {
  id: number;
  elmType: 'merged';
  content: string;
  parent: Token | MergedToken;
  attributes?: Attribute[];
};
