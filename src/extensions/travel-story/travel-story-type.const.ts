import {
  ObjectSubTypeDefintion,
  ObjectTypeDefinition,
} from '../../integration/extension.provider';
import {ObjectTypeName} from '../../services/application.service';
import {
  FOLDER_TYPE,
  REPOSITORY_CATEGORY_TYPE,
} from '../../services/object-tree/object-tree.const';
import {
  PAGE_WITH_GALLERY_PARAGRAPH_TYPE,
  PAGE_WITH_GALLERY_TEXT_PARAGRAPH_TYPE,
} from '../content-image-template/content-image-template.const';
import {POST_TYPE, POST_WITH_GALLERY_TYPE} from '../post/post.const';
import {
  CALENDAR_ENTRY_TYPE,
  MENU_ENTRY_TYPE,
  PAGE_TYPE,
  PAGE_WITH_TEXT_PARAGRAPH_TYPE,
  PARAGRAPH_WITH_PAGE_LINK,
  TEXT_PARAGRAPH_TYPE,
  WEB_SITE_VIEW_WITH_MENU_TYPE,
  WEB_SITE_WITH_MENU_TEMPLATE_TYPE,
  WEB_SITE_WITH_PARAGRAPHS_TEMPLATE_TYPE,
  WELCOME_PAGE_TYPE,
} from '../web-site/web-site.const';
import {
  PUBLIC_OBJECT_NAME,
  TEMPLATES_OBJECT_NAME,
} from './../../services/object-tree/object-tree.const';
import {
  GALLERY_TEXT_PARAGRAPH_TYPE,
  PAGE_WITH_GALLERY_TYPE,
} from './../content-image-template/content-image-template.const';
import {
  DISPLAYED_IMAGE_GALLERY_TYPE,
  IMAGE_GALLERIES_TYPE,
  IMAGE_GALLERY_REFERRER_TYPE,
  IMAGE_GALLERY_TYPE,
} from './../content-image/content-image.const';
import {
  PAGE_WITH_SUB_PAGE_TYPE,
  PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE,
} from './../web-site/web-site.const';
export const TRAVEL_STORY_PROVIDER = 'TravelStoryProvider';
export const TRAVEL_STORY_NAME = 'TravelStoryService';

export const TRAVEL_STORY_TEMPLATE_TYPE = {
  name: 'TravelStoryTemplate',
  inheritedTypesIds: [
    WEB_SITE_WITH_MENU_TEMPLATE_TYPE.name,
    WEB_SITE_WITH_PARAGRAPHS_TEMPLATE_TYPE.name,
  ],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_TYPE: ObjectTypeDefinition = {
  name: 'TravelStory',
  inheritedTypesIds: [WEB_SITE_VIEW_WITH_MENU_TYPE.name],
  definition: {
    properties: {
      webSiteObjectTreeId: {
        type: 'string',
        oneOfTree: [
          {
            treeType: TRAVEL_STORY_TEMPLATE_TYPE.name,
            namespaceName: TEMPLATES_OBJECT_NAME,
            namespaceType: ObjectTypeName.REPOSITORY_CATEGORY,
            ownerName: PUBLIC_OBJECT_NAME,
            ownerType: ObjectTypeName.REPOSITORY,
          },
          {
            treeType: 'TravelStoryTemplate',
          },
        ],
      },
    },
  },
  contentType: '',
};

export const TRAVEL_STORY_IMAGE_GALLERIES_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryImageGalleries',
  inheritedTypesIds: [
    IMAGE_GALLERIES_TYPE.name,
    MENU_ENTRY_TYPE.name,
    PAGE_TYPE.name,
    PAGE_WITH_SUB_PAGE_TYPE.name,
  ],
};

export const TRAVEL_STORY_IMAGE_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryImageGallery',
  inheritedTypesIds: [
    DISPLAYED_IMAGE_GALLERY_TYPE.name,
    MENU_ENTRY_TYPE.name,
    PAGE_TYPE.name,
  ],
};

export const TRAVEL_STORY_IMAGE_GALLERY_REFERRER_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryImageGalleryReferrer',
  inheritedTypesIds: [IMAGE_GALLERY_REFERRER_TYPE.name],
  definition: {
    properties: {
      imageGalleryObjectTreeId: {
        title: 'Image gallery',
        type: 'string',
        oneOfTree: [
          {
            treeType: TRAVEL_STORY_IMAGE_GALLERY_TYPE.name,
          },
        ],
      },
    },
  },
  contentType: '',
};

export const TRAVEL_STORY_WELCOME_PAGE_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryWelcomePage',
  inheritedTypesIds: [
    PAGE_WITH_GALLERY_TYPE.name,
    PAGE_WITH_GALLERY_TEXT_PARAGRAPH_TYPE.name,
    WELCOME_PAGE_TYPE.name,
    TRAVEL_STORY_IMAGE_GALLERY_REFERRER_TYPE.name,
  ],
};

/*
export const TRAVEL_STORY_WELCOME_MENU_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryWelcomeMenu',
  inheritedTypesIds: [
    SECTION_PARAGRAPH_TYPE.name,
    PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE.name,
  ],
};*/

export const TRAVEL_STORY_POST_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryPost',
  inheritedTypesIds: [
    POST_TYPE.name,
    MENU_ENTRY_TYPE.name,
    CALENDAR_ENTRY_TYPE.name,
    POST_WITH_GALLERY_TYPE.name,
    PAGE_WITH_SUB_PAGE_TYPE.name,
    PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE.name,
    PAGE_WITH_TEXT_PARAGRAPH_TYPE.name,
    PAGE_WITH_GALLERY_PARAGRAPH_TYPE.name,
    PAGE_WITH_GALLERY_TEXT_PARAGRAPH_TYPE.name,
    TRAVEL_STORY_IMAGE_GALLERY_REFERRER_TYPE.name,
  ],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_POST_ROOT_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryPostRoot',
  inheritedTypesIds: [TRAVEL_STORY_POST_TYPE.name],
};

export const TRAVEL_STORY_WELCOME_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryWelcomeMenuEntry',
  inheritedTypesIds: [
    GALLERY_TEXT_PARAGRAPH_TYPE.name,
    PARAGRAPH_WITH_PAGE_LINK.name,
    PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE.name,
    TRAVEL_STORY_IMAGE_GALLERY_REFERRER_TYPE.name,
  ],
};

export const FOLDER_TRAVEL_STORY_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: FOLDER_TYPE.name,
  subTypeName: TRAVEL_STORY_TYPE.name,
  name: TRAVEL_STORY_TYPE.name,
  acl: true,
  namespace: true,
  owner: false,
  tree: true,
};

export const TRAVEL_STORY_TRAVEL_STORY_IMAGE_GALLERIES_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: TRAVEL_STORY_TYPE.name,
  subTypeName: TRAVEL_STORY_IMAGE_GALLERIES_TYPE.name,
  max: 1,
  min: 1,
};

export const TRAVEL_STORY_TRAVEL_STORY_WELCOME_PAGE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: TRAVEL_STORY_TYPE.name,
  subTypeName: TRAVEL_STORY_WELCOME_PAGE_TYPE.name,
  name: WELCOME_PAGE_TYPE.name,
  min: 1,
  max: 1,
};

export const TRAVEL_STORY_TRAVEL_STORY_POST_ROOT_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: TRAVEL_STORY_TYPE.name,
  subTypeName: TRAVEL_STORY_POST_ROOT_TYPE.name,
  name: TRAVEL_STORY_POST_TYPE.name,
  min: 1,
  max: 1,
};

export const TRAVEL_STORY_POST_TRAVEL_STORY_POST_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: TRAVEL_STORY_POST_TYPE.name,
  subTypeName: TRAVEL_STORY_POST_TYPE.name,
};

export const CATEGORY_TRAVEL_STORY_TEMPLATE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: TRAVEL_STORY_TEMPLATE_TYPE.name,
  tree: true,
};

export const TRAVEL_STORY_WELCOME_PAGE_TRAVEL_STORY_WELCOME_MENU_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: TRAVEL_STORY_WELCOME_PAGE_TYPE.name,
  subTypeName: TRAVEL_STORY_WELCOME_PARAGRAPH_TYPE.name,
};

export const TRAVEL_STORY_WELCOME_MENU_TEXT_PARAGRAPH_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: TRAVEL_STORY_WELCOME_PAGE_TYPE.name,
  subTypeName: TEXT_PARAGRAPH_TYPE.name,
  max: 0,
};

export const TRAVEL_STORY_IMAGE_GALLERIES_TRAVEL_STORY_IMAGE_GALLERY_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: TRAVEL_STORY_IMAGE_GALLERIES_TYPE.name,
  subTypeName: TRAVEL_STORY_IMAGE_GALLERY_TYPE.name,
  name: IMAGE_GALLERY_TYPE.name,
  tree: true,
};
