import {
  ObjectSubTypeDefintion,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {IMAGE_TYPE} from './../content-image/content-image.const';
export const CONTENT_IMAGE_THUMB_PROVIDER = 'ContentImageThumbProvider';

export const IMAGE_WEB_TYPE: ObjectTypeDefinition = {
  name: 'ImageWeb',
  definition: {
    properties: {},
  },
  contentType: 'ContentImage',
};

export const IMAGE_ORIGINAL_TYPE: ObjectTypeDefinition = {
  name: 'ImageOriginal',
  definition: {
    properties: {},
  },
  contentType: 'ContentImage',
};

export const IMAGE_IMAGE_WEB_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: IMAGE_TYPE.name,
  subTypeName: IMAGE_WEB_TYPE.name,
  max: 1,
};

export const IMAGE_WEB_IMAGE_ORIGINAL_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: IMAGE_WEB_TYPE.name,
  subTypeName: IMAGE_ORIGINAL_TYPE.name,
  max: 1,
};
