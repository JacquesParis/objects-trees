import {
  ObjectSubTypeDefinition,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {IMAGE_TYPE} from './../content-image/content-image.const';
export const CONTENT_IMAGE_THUMB_PROVIDER = 'ContentImageThumbProvider';

export const IMAGE_THUMB_TYPE: ObjectTypeDefinition = {
  name: 'ImageThumb',
  definition: {
    properties: {},
  },
  contentType: 'ContentImage',
  iconView: 'fas fa-compress',
};

export const IMAGE_ORIGINAL_TYPE: ObjectTypeDefinition = {
  name: 'ImageOriginal',
  definition: {
    properties: {},
  },
  contentType: 'ContentImage',
  iconView: 'fas fa-expand',
};

export const IMAGE_IMAGE_THUMB_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: IMAGE_TYPE.name,
  subTypeName: IMAGE_THUMB_TYPE.name,
  max: 1,
};

export const IMAGE_IMAGE_ORIGINAL_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: IMAGE_TYPE.name,
  subTypeName: IMAGE_ORIGINAL_TYPE.name,
  max: 1,
};
