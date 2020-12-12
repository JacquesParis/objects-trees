export function toKebabCase(str: string) {
  const matches = str?.match(
    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
  );
  return matches?.map((x) => x.toLowerCase()).join('-') as string;
}

export function toCamelCase(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr: string) => chr.toUpperCase());
}

import fs from 'fs';
import {intersection} from 'lodash';
import path from 'path';
import {ObjectTree} from '../models';

export function template(dirName: string, name: string): string {
  return fs.readFileSync(path.join(dirName, name + '.tpl.html'), 'utf8');
}

export function doesTreeImplementOneOfType(
  tree: ObjectTree,
  types: string[],
): boolean {
  return intersection(tree.entityCtx?.implementedTypes, types).length > 0;
}
