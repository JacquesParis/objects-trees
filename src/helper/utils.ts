import {IJsonSchema} from '@jacquesparis/objects-model';
import {Response} from '@loopback/rest';
/* eslint-disable no-empty */
import fs from 'fs';
import {camelCase, isObject, isString, kebabCase} from 'lodash';
import path from 'path';
import {GeneratedViewInterface} from './../services/action-entity/action-entity.service';
export function toKebabCase(str: string) {
  return kebabCase(str);
}

export function toCamelCase(str: string) {
  return camelCase(str);
}

export function contentGenericTemplate(
  dirName: string,
  name: string,
): {
  templateMustache: string;
  templateAngular: string;
  scss: string;
  controller: string;
} {
  const genericTemplate = {
    templateMustache: '',
    templateAngular: '',
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
    genericTemplate.templateMustache = template(
      path.join(dirName, name),
      'mustache.template',
    );
  } catch (error) {}
  try {
    genericTemplate.templateAngular = template(
      path.join(dirName, name),
      'angular.template',
    );
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

/*
export function doesTreeImplementOneOfType(
  tree: ObjectTree | ObjectNode,
  types: string[],
): boolean {
  return intersection(tree.entityCtx?.implementedTypes, types).length > 0;
}*/

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
      'var embededCondition = true;\r\n' +
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

export function outputResponse(
  response: Response,
  generatedView: GeneratedViewInterface,
): Response {
  switch (generatedView.type) {
    case 'file': {
      const fileView: {
        filePath: string;
        fileName: string;
      } = generatedView.file as {
        filePath: string;
        fileName: string;
      };
      response.download(fileView.filePath, fileView.fileName);
      return response;
    }
    case 'base64': {
      const base64View: {
        name: string;
        base64: string;
        type?: string;
      } = generatedView.base64 as {
        name: string;
        base64: string;
        type?: string;
      };
      response.header(
        'Content-Disposition',
        'attachment; filename="' + base64View.name + '"',
      );
      if (base64View.type) {
        response.type(base64View.type);
      }
      response.send(Buffer.from(base64View.base64, 'base64'));
      return response;
    }
    case 'json': {
      response.json(generatedView.json);
      return response;
    }
    case 'text': {
      const textView: {
        response: string;
        contentType?: string;
      } = generatedView.text as {response: string; contentType?: string};
      response.set('Content-Type', 'text/html');
      response.send(textView.response);
      return response;
    }
    default: {
      response.json(generatedView);
      return response;
    }
  }
}
