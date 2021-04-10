import {ObjectTypeDefinition} from '../../integration/extension.provider';
import {GALLERY_PARAGRAPH_TYPE} from '../content-image-template/content-image-template.const';

export const POST_PROVIDER = 'PostProvider';
export const POST_NAME = 'PostService';

export const POST_TYPE: ObjectTypeDefinition = {
  name: 'Post',
  title: 'Article',
  definition: {
    properties: {},
  },
  contentType: 'ContentText',
};

export const POST_WITH_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'PostWithGallery',
  inheritedTypesIds: [POST_TYPE.name, GALLERY_PARAGRAPH_TYPE.name],
};

export const POST_WITH_SUB_POST_TYPE: ObjectTypeDefinition = {
  name: 'PostWithSubPost',
  inheritedTypesIds: [POST_TYPE.name],
};
