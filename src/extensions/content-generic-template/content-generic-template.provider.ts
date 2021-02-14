import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {
  CONTENT_GENERIC_PROVIDER,
  TEMPLATE_REFERER_WITH_CONFIGURATION_TYPE,
  TEMPLATE_VIEW_TYPE,
} from './content-generic-template.const';
import {
  ContentGenericTemplate,
  ContentGenericTemplateRepository,
  ContentGenericTemplateService,
  GenericTemplate,
} from './content-generic-template.definition';
import {TransientContentGenericService} from './transient-content-generic.service';

export class ContentGenericTemplateProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CONTENT_GENERIC_PROVIDER, app);

    this.models.push(GenericTemplate);
    this.models.push(ContentGenericTemplate);
    this.repositories.push({repoClass: ContentGenericTemplateRepository});

    this.services.push(
      {cls: ContentGenericTemplateService},
      {cls: TransientContentGenericService},
    );

    this.objectTypes.push(
      TEMPLATE_VIEW_TYPE,
      TEMPLATE_REFERER_WITH_CONFIGURATION_TYPE,
    );
  }
}
