import {IJsonSchema} from '@jacquesparis/objects-model';
/* eslint-disable no-empty */
import fs from 'fs';
import {camelCase, intersection, isObject, isString, kebabCase} from 'lodash';
import path from 'path';
import {ObjectTree} from '../models';
import {ObjectNode} from './../models/object-node.model';
export function toKebabCase(str: string) {
  return kebabCase(str);
}

export function toCamelCase(str: string) {
  return camelCase(str);
}

export function contentGenericTemplate(
  dirName: string,
  name: string,
): {template: string; scss: string; controller: string} {
  const genericTemplate = {
    template: '',
    scss: '',
    controller: `function newFunction() {
      return {
        async init(component) {},
      };
    }
    newFunction();
    `,
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

export function addConditionOldVersion(condition: string, schema: IJsonSchema) {
  if (!schema['x-schema-form']) {
    schema['x-schema-form'] = {};
  }
  schema['x-schema-form'].condition = condition;
  if (schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      addCondition(condition, schema.properties[key]);
    }
  }
}

export function addCondition(
  condition: string,
  schema: IJsonSchema,
  modelPath = 'model',
) {
  condition = condition.replace('[arrayIndex]', '[arrayIndices]');
  let expresion =
    'model = ' + modelPath.replace('[arrayIndex]', '[arrayIndices]') + ';\r\n';
  expresion += 'var result = ' + condition + ';\r\n';

  //  function anonymous(model,arrayIndices
  if (!schema['x-schema-form']) {
    schema['x-schema-form'] = {};
  }
  if (isString(schema['x-schema-form'].condition)) {
    schema['x-schema-form'].condition = {
      functionBody:
        'return ' +
        schema['x-schema-form'].condition.replace(
          '[arrayIndex]',
          '[arrayIndices]',
        ),
    };
  }
  if (!isObject(schema['x-schema-form'].condition)) {
    schema['x-schema-form'].condition = {};
  }
  if (isString(schema['x-schema-form'].condition.functionBody)) {
    expresion +=
      'var previousResultFct = (model,arrayIndices) =>{' +
      '\r\n' +
      schema['x-schema-form'].condition.functionBody +
      '\r\n' +
      '}' +
      ';\r\n' +
      'result = result && previousResultFct(model,arrayIndices);\r\n';
  }
  schema['x-schema-form'].condition.functionBody =
    expresion + '\r\n' + 'return result';

  if (schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      addCondition(condition, schema.properties[key], modelPath);
    }
  }
}
