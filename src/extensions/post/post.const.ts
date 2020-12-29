import {ObjectTypeDefinition} from '../../integration/extension.provider';
import {IMAGE_GALLERY_SELECTOR_TYPE} from '../content-image/content-image.const';

export const POST_PROVIDER = 'PostProvider';
export const POST_NAME = 'PostService';

export const POST_TYPE: ObjectTypeDefinition = {
  name: 'Post',
  definition: {
    properties: {},
  },
  contentType: 'ContentText',
};

export const POST_WITH_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'PostWithGallery',
  inheritedTypesIds: [POST_TYPE.name, IMAGE_GALLERY_SELECTOR_TYPE.name],
};

export const POST_WITH_SUB_POST_TYPE: ObjectTypeDefinition = {
  name: 'PostWithSubPost',
  inheritedTypesIds: [POST_TYPE.name],
};
