import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {
  CONTENT_GENERIC_TEMPLATE,
  TEMPLATE_REFERER,
  TEMPLATE_VIEW_TYPE,
} from './content-generic-template.const';
import {
  ContentGenericTemplate,
  ContentGenericTemplateRepository,
  ContentGenericTemplateService,
  GenericTemplate,
} from './content-generic-template.definition';

export class ContentGenericTemplateProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CONTENT_GENERIC_TEMPLATE, app);

    this.models.push(GenericTemplate);
    this.models.push(ContentGenericTemplate);
    this.repositories.push({repoClass: ContentGenericTemplateRepository});

    this.services.push({cls: ContentGenericTemplateService});

    this.objectTypes.templateView = TEMPLATE_VIEW_TYPE;
    this.objectTypes.refererWithConfiguration = TEMPLATE_REFERER;
  }
}
