import { Attribute } from './attribute';

export type Token = {
  id: number;
  parent: Token;
  elmType: string;
  content: string;
  attributes?: Attribute[];
};
