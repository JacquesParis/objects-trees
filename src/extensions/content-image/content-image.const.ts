import {
  ObjectSubTypeDefintion,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
export const CONTENT_IMAGE_PROVIDER = 'ContentImageProvider';
export const CONTENT_IMAGE_SERVICE = 'ContentImageService';

export const IMAGE_GALLERIES_TYPE: ObjectTypeDefinition = {
  name: 'ImageGalleries',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const IMAGE_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'ImageGallery',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const DISPLAYED_IMAGE_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'DisplayedImageGallery',
  inheritedTypesIds: [IMAGE_GALLERY_TYPE.name],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const IMAGE_GALLERY_REFERRER_TYPE: ObjectTypeDefinition = {
  name: 'ImageGalleryReferrer',
  definition: {
    properties: {
      imageGalleryObjectTreeId: {
        title: 'Image gallery',
        type: 'string',
        oneOfTree: [
          {
            treeType: IMAGE_GALLERY_TYPE.name,
          },
        ],
      },
    },
  },
  contentType: '',
};

export const IMAGE_GALLERY_SELECTOR_TYPE: ObjectTypeDefinition = {
  name: 'ImageGallerySelector',
  inheritedTypesIds: [IMAGE_GALLERY_REFERRER_TYPE.name],
  definition: {
    properties: {
      selectedImages: {
        title: 'Selected images',
        type: 'array',
        items: {
          type: 'string',
        },
        'x-schema-form': {
          condition: 'undefined !== embededCondition',
        },
      },
    },
  },
  contentType: '',
};

export const IMAGE_TYPE: ObjectTypeDefinition = {
  name: 'Image',
  definition: {
    properties: {},
  },
  contentType: 'ContentImage',
  iconView: 'far fa-image',
  templateView:
    '<span class="child-tree-preview"><span class="child-image-name">{{dataNode.name}}</span><img src="{{dataNode.contentImageUri}}"/></span>',
};

export const IMAGE_GALLERIES_IMAGE_GALLERY_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: IMAGE_GALLERIES_TYPE.name,
  subTypeName: IMAGE_GALLERY_TYPE.name,
  name: IMAGE_GALLERY_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: true,
};

export const IMAGE_GALLERY_IMAGE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: IMAGE_GALLERY_TYPE.name,
  subTypeName: IMAGE_TYPE.name,
  name: IMAGE_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: false,
};
