import {
  ObjectSubTypeDefinition,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
export const CONTENT_IMAGE_PROVIDER = 'ContentImageProvider';
export const CONTENT_IMAGE_SERVICE = 'ContentImageService';

export const IMAGE_GALLERIES_TYPE: ObjectTypeDefinition = {
  name: 'ImageGalleries',
  title: 'Image galleries',
  definition: {
    properties: {},
  },
  contentType: '',
  iconView: 'fas fa-photo-video',
};

export const IMAGE_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'ImageGallery',
  title: 'Image gallery',
  definition: {
    properties: {},
  },
  contentType: '',
  iconView: 'far fa-images',
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
  title: 'Images referrer',
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
          condition: 'undefined !== embeddedCondition',
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
    '<span class="child-tree-preview"><span class="child-image-name">{{dataNode.name}}</span><img style="padding-left: 10px;height: 50px;" src="{{dataNode.contentImageUri}}"/></span>',
};

export const IMAGE_GALLERIES_IMAGE_GALLERY_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: IMAGE_GALLERIES_TYPE.name,
  subTypeName: IMAGE_GALLERY_TYPE.name,
  name: IMAGE_GALLERY_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: true,
};

export const IMAGE_GALLERY_IMAGE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: IMAGE_GALLERY_TYPE.name,
  subTypeName: IMAGE_TYPE.name,
  name: IMAGE_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: false,
};
