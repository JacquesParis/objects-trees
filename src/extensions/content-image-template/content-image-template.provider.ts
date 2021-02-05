import {ObjectTreesApplicationInterface} from '../../application';
import {contentGenericTemplate} from '../../helper';
import {ExtensionProvider} from '../../integration/extension.provider';
import {WebSiteProvider} from '../web-site/web-site.provider';
import {ContentGenericTemplateProvider} from './../content-generic-template/content-generic-template.provider';
import {ContentImageProvider} from './../content-image/content-image.provider';
import {PARAGRAPH_TEMPLATE_TYPE} from './../web-site/web-site.const';
import {
  CATEGORY_IMAGE_GALLERY_TEMPLATE_SUBTYPE,
  CONTENT_IMAGE_TEMPLATE_PROVIDER,
  GALLERY_PARAGRAPH_TYPE,
  GALLERY_TEXT_PARAGRAPH_TYPE,
  IMAGE_GALLERY_TEMPLATE_TYPE,
  PAGE_WITH_GALLERY_PARAGRAPH_GALLERY_PARAGRAPH_SUBTYPE,
  PAGE_WITH_GALLERY_PARAGRAPH_TYPE,
  PAGE_WITH_GALLERY_TEXT_PARAGRAPH_GALLERY_TEXT_PARAGRAPH_SUBTYPE,
  PAGE_WITH_GALLERY_TEXT_PARAGRAPH_TYPE,
  PAGE_WITH_GALLERY_TYPE,
  PARAGRAPH_CONTAINER_GALLERY_TEXT_PARAGRAPH_SUBTYPE,
} from './content-image-template.const';

export class ContentImageTemplateProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CONTENT_IMAGE_TEMPLATE_PROVIDER, app);
    this.requiredProviders.push(
      ContentImageProvider,
      ContentGenericTemplateProvider,
      WebSiteProvider,
    );

    this.objectTypes.push(
      IMAGE_GALLERY_TEMPLATE_TYPE,
      GALLERY_PARAGRAPH_TYPE,
      GALLERY_TEXT_PARAGRAPH_TYPE,
      PAGE_WITH_GALLERY_TYPE,
      PAGE_WITH_GALLERY_PARAGRAPH_TYPE,
      PAGE_WITH_GALLERY_TEXT_PARAGRAPH_TYPE,
    );
    this.objectSubTypes.push(
      CATEGORY_IMAGE_GALLERY_TEMPLATE_SUBTYPE,
      PAGE_WITH_GALLERY_PARAGRAPH_GALLERY_PARAGRAPH_SUBTYPE,
      PAGE_WITH_GALLERY_TEXT_PARAGRAPH_GALLERY_TEXT_PARAGRAPH_SUBTYPE,
      PARAGRAPH_CONTAINER_GALLERY_TEXT_PARAGRAPH_SUBTYPE,
    );

    this.objectTrees.carousel = {
      reset: false,
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'carousel',
      treeNodeTypeId: IMAGE_GALLERY_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          contentGenericTemplate: contentGenericTemplate(__dirname, 'carousel'),
        },
        children: {},
      },
    };

    this.objectTrees.thumbs = {
      reset: false,
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'thumbs',
      treeNodeTypeId: IMAGE_GALLERY_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          contentGenericTemplate: contentGenericTemplate(__dirname, 'thumbs'),
        },
        children: {},
      },
    };

    this.objectTrees.pageCardTextAndImages = {
      reset: false,
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'cardTextAndImages',
      treeNodeTypeId: PARAGRAPH_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          contentGenericTemplate: contentGenericTemplate(
            __dirname,
            'cardTextAndImages',
            ['card', 'cardImg'],
          ),
        },
        children: {},
      },
    };
  }
}
