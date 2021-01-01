/* eslint-disable @typescript-eslint/no-unused-vars */
import {ObjectTreesApplicationInterface} from '../../application';
import {contentGenericTemplate, image} from '../../helper';
import {ExtensionProvider} from '../../integration/extension.provider';
import {POST_TYPE} from '../post/post.const';
import {
  CALENDAR_ENTRY_TYPE,
  WEB_SITE_VIEW_WELCOME_PAGE_SUBTYPE,
  WELCOME_PAGE_TYPE,
} from '../web-site/web-site.const';
import {ContentImageTemplateProvider} from './../content-image-template/content-image-template.provider';
import {
  IMAGE_GALLERY_SELECTOR_TYPE,
  IMAGE_GALLERY_TYPE,
  IMAGE_TYPE,
} from './../content-image/content-image.const';
import {WebSiteProvider} from './../web-site/web-site.provider';
import {
  CATEGORY_TRAVEL_STORY_TEMPLATE_SUBTYPE,
  FOLDER_TRAVEL_STORY_SUBTYPE,
  TRAVEL_STORY_POST_ROOT_TYPE,
  TRAVEL_STORY_POST_TRAVEL_STORY_POST_SUBTYPE,
  TRAVEL_STORY_POST_TYPE,
  TRAVEL_STORY_PROVIDER,
  TRAVEL_STORY_TEMPLATE_TYPE,
  TRAVEL_STORY_TRAVEL_STORY_POST_ROOT_SUBTYPE,
  TRAVEL_STORY_TYPE,
} from './travel-story-type.const';
export class TravelStoryTypeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(TRAVEL_STORY_PROVIDER, app);
    this.requiredProviders.push(WebSiteProvider, ContentImageTemplateProvider);
    this.objectTypes.push(
      TRAVEL_STORY_TYPE,
      TRAVEL_STORY_POST_TYPE,
      TRAVEL_STORY_TEMPLATE_TYPE,
      TRAVEL_STORY_POST_ROOT_TYPE,
    );

    this.objectSubTypes.push(FOLDER_TRAVEL_STORY_SUBTYPE);
    this.objectSubTypes.push(TRAVEL_STORY_TRAVEL_STORY_POST_ROOT_SUBTYPE);
    this.objectSubTypes.push(TRAVEL_STORY_POST_TRAVEL_STORY_POST_SUBTYPE);
    this.objectSubTypes.push(CATEGORY_TRAVEL_STORY_TEMPLATE_SUBTYPE);

    this.objectTrees.travelStory = {
      reset: false,
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'travelStory',
      treeNodeTypeId: TRAVEL_STORY_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          contentGenericTemplate: contentGenericTemplate(
            __dirname,
            'travelStory',
          ),
          menuObjectTreeId:
            'tree/Repository/public/RepositoryCategory/templates/MenuTemplate/navBar',
          paragraphTemplateObjectTreeId:
            'tree/Repository/public/RepositoryCategory/templates/ParagraphTemplate/cardTextAndImages',
          pageTemplateObjectTreeId:
            'tree/Repository/public/RepositoryCategory/templates/PageTemplate/pageWithParagraph',
          menuEntries: [
            {
              entryKey: 'home',
              entryName: 'Home',
              menuEntryLabelKey: 'name',
              entryTypes: [WELCOME_PAGE_TYPE.name],
            },
            {
              entryKey: 'story',
              entryName: 'Story',
              menuEntryLabelKey: 'menuTitle',
              entryTypes: [POST_TYPE.name],
            },
            {
              entryKey: 'calendar',
              entryName: 'Calendar',
              menuEntryLabelKey: 'calendarDate',
              entryTypes: [CALENDAR_ENTRY_TYPE.name],
            },
          ],
          paragraphTemplateChoices: [
            {
              paragraphTypeKey: 'cardCaroussel',
              paragraphTypeName: 'Display images with Caroussel',
              paragraphTemplateObjectTreeId:
                'tree/Repository/public/RepositoryCategory/templates/ParagraphTemplate/cardTextAndImages',
              paragraphTypes: [IMAGE_GALLERY_SELECTOR_TYPE.name],
              templatesConfigurations: {
                cardTextAndImages: {
                  imageGalleryObjectTreeId:
                    'tree/Repository/public/RepositoryCategory/templates/ImageGalleryTemplate/caroussel',
                  imageGalleryPosition: 'right',
                },
              },
            },
            {
              paragraphTypeKey: 'card',
              paragraphTypeName: 'Display images in thumb',
              paragraphTemplateObjectTreeId:
                'tree/Repository/public/RepositoryCategory/templates/ParagraphTemplate/cardTextAndImages',
              paragraphTypes: [IMAGE_GALLERY_SELECTOR_TYPE.name],
              templatesConfigurations: {
                cardTextAndImages: {
                  imageGalleryObjectTreeId:
                    'tree/Repository/public/RepositoryCategory/templates/ImageGalleryTemplate/caroussel',
                  imageGalleryPosition: 'after',
                },
              },
            },
          ],
          templatesConfigurations: {
            cardTextAndImages: {
              imageGalleryObjectTreeId:
                'tree/Repository/public/RepositoryCategory/templates/ImageGalleryTemplate/caroussel',
            },
          },
        },
        children: {},
      },
    };

    this.objectTrees.travelStoryExample = {
      reset: false,
      parentNode: () => this.appCtx.demonstrationExamplesNode.value,
      treeNodeName: 'Exemple de site de Voyage',
      treeNodeTypeId: TRAVEL_STORY_TYPE.name,
      tree: {
        treeNode: {
          webSiteObjectTreeId:
            'tree/Repository/public/RepositoryCategory/templates/TravelStoryTemplate/travelStory',
          menuTitle: 'Example',
          menuEntries: {
            home: 'Accueil',
            story: 'Récit',
            calendar: 'Calendrier',
          },
        },
        children: {
          [IMAGE_GALLERY_TYPE.name]: {
            ['Ipsum3']: [
              {
                treeNode: {},
                children: {
                  [IMAGE_TYPE.name]: {
                    ['Eliot peper']: [
                      {
                        treeNode: {
                          contentImage: {
                            base64: image(__dirname, 'eliot'),
                            name: 'eliot-peper-9KVEC-R8gFM-unsplash.jpg',
                            size: '1607898086455',
                            type: 'image/jpeg',
                          },
                        },
                        children: {},
                      },
                    ],
                    ['Laura Chouette']: [
                      {
                        treeNode: {
                          contentImage: {
                            base64: image(__dirname, 'laura'),
                            name: 'laura-chouette-iF3nn-mXkU8-unsplash.jpg',
                            size: '1607898094166',
                            type: 'image/jpeg',
                          },
                        },
                        children: {},
                      },
                    ],
                    ['Ksenia makagonov']: [
                      {
                        treeNode: {
                          contentImage: {
                            base64: image(__dirname, 'ksenia'),
                            name: 'ksenia-makagonova-oqL8TOLARs8-unsplash.jpg',
                            size: '1607898103955',
                            type: 'image/jpeg',
                          },
                        },
                        children: {},
                      },
                    ],
                    ['Brian quid']: [
                      {
                        treeNode: {
                          contentImage: {
                            base64: image(__dirname, 'brian'),
                            name: 'brian-quid-6O9dPC51s7M-unsplash.jpg',
                            size: '1607898091074',
                            type: 'image/jpeg',
                          },
                        },
                        children: {},
                      },
                    ],
                  },
                },
              },
            ],
          },
          [TRAVEL_STORY_POST_ROOT_TYPE.name]: {
            ['Stories']: [
              {
                treeNode: {
                  menuTitle: 'Stories',
                  pageTitle: 'Stories',
                },
                children: {
                  [TRAVEL_STORY_POST_TYPE.name]: {
                    ['Post 1']: [
                      {
                        treeNode: {
                          menuTitle: 'Lorem ipsum 1',
                          pageTitle: 'Lorem ipsum dolor 1',
                          paragraphTitle: 'Lorem ipsum dolor 1',
                          contentText:
                            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum semper ligula eu mattis sollicitudin. Donec a commodo sem. Nulla faucibus, dolor at ornare congue, quam nibh porta nisi, eu faucibus tellus nunc et tellus. Sed fermentum finibus orci, at sagittis nisl ultrices tincidunt. Nullam consectetur et eros vel ultrices. Mauris vel laoreet metus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Aliquam iaculis lectus in velit iaculis accumsan. Proin pharetra felis sed dolor efficitur, a placerat leo faucibus. Aenean commodo tellus elit, faucibus auctor nulla elementum ac. Vestibulum sagittis, urna a facilisis tristique, neque nisi elementum dolor, non lobortis neque enim et risus. Aliquam accumsan tincidunt nulla. Donec sit amet nisi a nibh hendrerit dapibus ac vitae dui. Donec diam orci, egestas ut sagittis vel, lobortis id metus. Vivamus pulvinar vestibulum lacinia.↵↵Vivamus quis ex eu est pretium interdum. Integer elementum pellentesque pulvinar. Etiam posuere orci ut placerat mollis. Cras ut molestie risus, non luctus diam. Phasellus lacinia sit amet ligula cursus condimentum. Ut ac nulla est. Integer mi magna, sodales ultricies semper ac, bibendum eget risus. Morbi hendrerit ultricies pretium. Donec viverra orci laoreet, molestie dui quis, luctus eros. Suspendisse potenti. Aliquam dignissim vestibulum magna, ac fringilla velit auctor ac. Duis sit amet leo id est vehicula convallis ut id magna. Nullam semper euismod maximus. Proin lobortis facilisis felis ac vestibulum. Sed imperdiet tellus mattis, eleifend tortor ac, lobortis elit. Maecenas vehicula luctus nibh.',
                        },
                        children: {},
                      },
                    ],
                    ['Post 2']: [
                      {
                        treeNode: {
                          menuTitle: 'Lorem ipsum 2',
                          pageTitle: 'Lorem ipsum dolor 2',
                          paragraphTitle: 'Lorem ipsum dolor 2',
                          contentText:
                            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum semper ligula eu mattis sollicitudin. Donec a commodo sem. Nulla faucibus, dolor at ornare congue, quam nibh porta nisi, eu faucibus tellus nunc et tellus. Sed fermentum finibus orci, at sagittis nisl ultrices tincidunt. Nullam consectetur et eros vel ultrices. Mauris vel laoreet metus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Aliquam iaculis lectus in velit iaculis accumsan. Proin pharetra felis sed dolor efficitur, a placerat leo faucibus. Aenean commodo tellus elit, faucibus auctor nulla elementum ac. Vestibulum sagittis, urna a facilisis tristique, neque nisi elementum dolor, non lobortis neque enim et risus. Aliquam accumsan tincidunt nulla. Donec sit amet nisi a nibh hendrerit dapibus ac vitae dui. Donec diam orci, egestas ut sagittis vel, lobortis id metus. Vivamus pulvinar vestibulum lacinia.↵↵Vivamus quis ex eu est pretium interdum. Integer elementum pellentesque pulvinar. Etiam posuere orci ut placerat mollis. Cras ut molestie risus, non luctus diam. Phasellus lacinia sit amet ligula cursus condimentum. Ut ac nulla est. Integer mi magna, sodales ultricies semper ac, bibendum eget risus. Morbi hendrerit ultricies pretium. Donec viverra orci laoreet, molestie dui quis, luctus eros. Suspendisse potenti. Aliquam dignissim vestibulum magna, ac fringilla velit auctor ac. Duis sit amet leo id est vehicula convallis ut id magna. Nullam semper euismod maximus. Proin lobortis facilisis felis ac vestibulum. Sed imperdiet tellus mattis, eleifend tortor ac, lobortis elit. Maecenas vehicula luctus nibh.',
                        },
                        children: {
                          [TRAVEL_STORY_POST_TYPE.name]: {
                            ['Post 2.1']: [
                              {
                                treeNode: {
                                  menuTitle: 'Lorem ipsum 2.1',
                                  pageTitle: 'Lorem ipsum dolor 2.1',
                                  paragraphTitle: 'Lorem ipsum dolor 2.1',
                                  contentText:
                                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum semper ligula eu mattis sollicitudin. Donec a commodo sem. Nulla faucibus, dolor at ornare congue, quam nibh porta nisi, eu faucibus tellus nunc et tellus. Sed fermentum finibus orci, at sagittis nisl ultrices tincidunt. Nullam consectetur et eros vel ultrices. Mauris vel laoreet metus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Aliquam iaculis lectus in velit iaculis accumsan. Proin pharetra felis sed dolor efficitur, a placerat leo faucibus. Aenean commodo tellus elit, faucibus auctor nulla elementum ac. Vestibulum sagittis, urna a facilisis tristique, neque nisi elementum dolor, non lobortis neque enim et risus. Aliquam accumsan tincidunt nulla. Donec sit amet nisi a nibh hendrerit dapibus ac vitae dui. Donec diam orci, egestas ut sagittis vel, lobortis id metus. Vivamus pulvinar vestibulum lacinia.↵↵Vivamus quis ex eu est pretium interdum. Integer elementum pellentesque pulvinar. Etiam posuere orci ut placerat mollis. Cras ut molestie risus, non luctus diam. Phasellus lacinia sit amet ligula cursus condimentum. Ut ac nulla est. Integer mi magna, sodales ultricies semper ac, bibendum eget risus. Morbi hendrerit ultricies pretium. Donec viverra orci laoreet, molestie dui quis, luctus eros. Suspendisse potenti. Aliquam dignissim vestibulum magna, ac fringilla velit auctor ac. Duis sit amet leo id est vehicula convallis ut id magna. Nullam semper euismod maximus. Proin lobortis facilisis felis ac vestibulum. Sed imperdiet tellus mattis, eleifend tortor ac, lobortis elit. Maecenas vehicula luctus nibh.',
                                },
                                children: {},
                              },
                            ],
                            ['Post 2.2']: [
                              {
                                treeNode: {
                                  pageTitle: 'Lorem ipsum dolor 2.2',
                                  paragraphTitle: 'Lorem ipsum dolor 2.2',
                                  contentText:
                                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum semper ligula eu mattis sollicitudin. Donec a commodo sem. Nulla faucibus, dolor at ornare congue, quam nibh porta nisi, eu faucibus tellus nunc et tellus. Sed fermentum finibus orci, at sagittis nisl ultrices tincidunt. Nullam consectetur et eros vel ultrices. Mauris vel laoreet metus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Aliquam iaculis lectus in velit iaculis accumsan. Proin pharetra felis sed dolor efficitur, a placerat leo faucibus. Aenean commodo tellus elit, faucibus auctor nulla elementum ac. Vestibulum sagittis, urna a facilisis tristique, neque nisi elementum dolor, non lobortis neque enim et risus. Aliquam accumsan tincidunt nulla. Donec sit amet nisi a nibh hendrerit dapibus ac vitae dui. Donec diam orci, egestas ut sagittis vel, lobortis id metus. Vivamus pulvinar vestibulum lacinia.↵↵Vivamus quis ex eu est pretium interdum. Integer elementum pellentesque pulvinar. Etiam posuere orci ut placerat mollis. Cras ut molestie risus, non luctus diam. Phasellus lacinia sit amet ligula cursus condimentum. Ut ac nulla est. Integer mi magna, sodales ultricies semper ac, bibendum eget risus. Morbi hendrerit ultricies pretium. Donec viverra orci laoreet, molestie dui quis, luctus eros. Suspendisse potenti. Aliquam dignissim vestibulum magna, ac fringilla velit auctor ac. Duis sit amet leo id est vehicula convallis ut id magna. Nullam semper euismod maximus. Proin lobortis facilisis felis ac vestibulum. Sed imperdiet tellus mattis, eleifend tortor ac, lobortis elit. Maecenas vehicula luctus nibh.',
                                },
                                children: {},
                              },
                            ],
                            ['Post 2.3']: [
                              {
                                treeNode: {
                                  menuTitle: 'Lorem ipsum 2.3',
                                  pageTitle: 'Lorem ipsum dolor 2.3',
                                  paragraphTitle: 'Lorem ipsum dolor 2.3',
                                  contentText:
                                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum semper ligula eu mattis sollicitudin. Donec a commodo sem. Nulla faucibus, dolor at ornare congue, quam nibh porta nisi, eu faucibus tellus nunc et tellus. Sed fermentum finibus orci, at sagittis nisl ultrices tincidunt. Nullam consectetur et eros vel ultrices. Mauris vel laoreet metus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Aliquam iaculis lectus in velit iaculis accumsan. Proin pharetra felis sed dolor efficitur, a placerat leo faucibus. Aenean commodo tellus elit, faucibus auctor nulla elementum ac. Vestibulum sagittis, urna a facilisis tristique, neque nisi elementum dolor, non lobortis neque enim et risus. Aliquam accumsan tincidunt nulla. Donec sit amet nisi a nibh hendrerit dapibus ac vitae dui. Donec diam orci, egestas ut sagittis vel, lobortis id metus. Vivamus pulvinar vestibulum lacinia.↵↵Vivamus quis ex eu est pretium interdum. Integer elementum pellentesque pulvinar. Etiam posuere orci ut placerat mollis. Cras ut molestie risus, non luctus diam. Phasellus lacinia sit amet ligula cursus condimentum. Ut ac nulla est. Integer mi magna, sodales ultricies semper ac, bibendum eget risus. Morbi hendrerit ultricies pretium. Donec viverra orci laoreet, molestie dui quis, luctus eros. Suspendisse potenti. Aliquam dignissim vestibulum magna, ac fringilla velit auctor ac. Duis sit amet leo id est vehicula convallis ut id magna. Nullam semper euismod maximus. Proin lobortis facilisis felis ac vestibulum. Sed imperdiet tellus mattis, eleifend tortor ac, lobortis elit. Maecenas vehicula luctus nibh.',
                                },
                                children: {},
                              },
                            ],
                          },
                        },
                      },
                    ],
                    ['Post 3']: [
                      {
                        treeNode: {
                          paragraphTemplateChoice: 'cardCaroussel',
                          imageGalleryObjectTreeId:
                            'tree/Tenant/Demonstration/TravelStory/Exemple de site de Voyage/ImageGallery/Ipsum3',
                          menuTitle: 'Lorem ipsum 3',
                          pageTitle: 'Lorem ipsum dolor 3',
                          paragraphTitle: 'Lorem ipsum dolor 3',
                          selectedImages: ['Brian quid', 'Laura Chouette'],
                          contentText:
                            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum semper ligula eu mattis sollicitudin. Donec a commodo sem. Nulla faucibus, dolor at ornare congue, quam nibh porta nisi, eu faucibus tellus nunc et tellus. Sed fermentum finibus orci, at sagittis nisl ultrices tincidunt. Nullam consectetur et eros vel ultrices. Mauris vel laoreet metus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Aliquam iaculis lectus in velit iaculis accumsan. Proin pharetra felis sed dolor efficitur, a placerat leo faucibus. Aenean commodo tellus elit, faucibus auctor nulla elementum ac. Vestibulum sagittis, urna a facilisis tristique, neque nisi elementum dolor, non lobortis neque enim et risus. Aliquam accumsan tincidunt nulla. Donec sit amet nisi a nibh hendrerit dapibus ac vitae dui. Donec diam orci, egestas ut sagittis vel, lobortis id metus. Vivamus pulvinar vestibulum lacinia.↵↵Vivamus quis ex eu est pretium interdum. Integer elementum pellentesque pulvinar. Etiam posuere orci ut placerat mollis. Cras ut molestie risus, non luctus diam. Phasellus lacinia sit amet ligula cursus condimentum. Ut ac nulla est. Integer mi magna, sodales ultricies semper ac, bibendum eget risus. Morbi hendrerit ultricies pretium. Donec viverra orci laoreet, molestie dui quis, luctus eros. Suspendisse potenti. Aliquam dignissim vestibulum magna, ac fringilla velit auctor ac. Duis sit amet leo id est vehicula convallis ut id magna. Nullam semper euismod maximus. Proin lobortis facilisis felis ac vestibulum. Sed imperdiet tellus mattis, eleifend tortor ac, lobortis elit. Maecenas vehicula luctus nibh.',
                        },
                        children: {},
                      },
                    ],
                  },
                },
              },
            ],
          },
          [WELCOME_PAGE_TYPE.name]: {
            [WEB_SITE_VIEW_WELCOME_PAGE_SUBTYPE.name as string]: [
              {
                treeNode: {
                  pageTitle: "Ma page d'accueil",
                  contentText:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vel tristique velit. Curabitur porttitor nisl nec leo hendrerit blandit. Integer pharetra convallis efficitur. Aliquam non consectetur dolor, vitae eleifend risus. Quisque elementum nisl a urna dignissim, ut euismod enim convallis. Nam facilisis, neque nec ultricies sollicitudin, metus lorem convallis ex, a bibendum sem ex vitae velit. Aenean mattis orci neque, quis laoreet leo suscipit quis. Etiam vitae turpis ac augue consectetur bibendum. Cras varius odio semper ultrices bibendum. Suspendisse dignissim sem at lobortis imperdiet. Donec nec imperdiet turpis. Aenean mattis dui nec turpis euismod dapibus.↵↵Proin tempus, orci sit amet fermentum fringilla, risus metus aliquet enim, sed malesuada ipsum turpis vitae mi. Phasellus molestie justo sed malesuada congue. Nam malesuada massa sit amet diam accumsan consequat. Donec non tempor tellus, vitae posuere enim. Vivamus posuere scelerisque varius. Nunc a mollis risus, quis porta mi. Curabitur venenatis porta ullamcorper. Donec libero turpis, mattis eget elit sit amet, lobortis bibendum ligula. Praesent imperdiet dui odio, sed ultricies turpis congue vel. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam magna quam, varius at libero at, feugiat varius lacus. Vestibulum rutrum auctor libero a bibendum. In sit amet odio nibh. Duis lobortis, quam et scelerisque pellentesque, mauris metus mattis justo, eu convallis nunc sem in ante. Aliquam sit amet consequat ex.',
                },
                children: {},
              },
            ],
          },
        },
      },
    };
  }
}
