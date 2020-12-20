import {IJsonSchema} from '@jacquesparis/objects-model';
/* eslint-disable no-empty */
import fs from 'fs';
import {intersection} from 'lodash';
import path from 'path';
import {ObjectTree} from '../models';
import {ObjectNode} from './../models/object-node.model';
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

export function contentGenericTemplate(
  dirName: string,
  name: string,
): {template: string; scss: string; controller: string} {
  const genericTemplate = {
    template: '',
    scss: '',
    controller: `newFunction();

    function newFunction() {
      return {
        init: (ctrl) => {
          ctrl.ready = true;
        },
      };
    }`,
    /*
    config: `{
      "type": "object",
      "properties": {}
    }`,*/
    refererConfig: {
      properties: {},
    },
  };
  try {
    genericTemplate.template = template(path.join(dirName, name), 'template');
  } catch (error) {}
  try {
    genericTemplate.scss = scss(path.join(dirName, name), 'style');
  } catch (error) {}
  try {
    genericTemplate.controller = controller(
      path.join(dirName, name),
      'controller',
    );
  } catch (error) {}
  /*
  try {
    genericTemplate.config = jsonschema(path.join(dirName, name), 'config');
  } catch (error) {}
  */
  try {
    genericTemplate.refererConfig = jsonschema(
      path.join(dirName, name),
      'refererConfig',
    );
  } catch (error) {}
  return genericTemplate;
}

export function image(dirName: string, filename: string) {
  return base64(dirName, 'images', filename);
}

export function base64(
  dirName: string,
  name: string,
  filename: string,
): string {
  return fs.readFileSync(
    path.join(dirName, name + '/' + filename + '.base64'),
    'utf8',
  );
}

export function template(dirName: string, name: string): string {
  return fs.readFileSync(path.join(dirName, name + '.html'), 'utf8');
}
export function controller(dirName: string, name: string): string {
  return fs.readFileSync(path.join(dirName, name + '.js'), 'utf8');
}

export function scss(dirName: string, name: string): string {
  return fs.readFileSync(path.join(dirName, name + '.scss'), 'utf8');
}

export function jsonschema(dirName: string, name: string): IJsonSchema {
  return json(dirName, name + '.schema');
}

export function json(dirName: string, name: string): IJsonSchema {
  return JSON.parse(
    fs.readFileSync(path.join(dirName, name + '.json'), 'utf8'),
  );
}

export function doesTreeImplementOneOfType(
  tree: ObjectTree | ObjectNode,
  types: string[],
): boolean {
  return intersection(tree.entityCtx?.implementedTypes, types).length > 0;
}
