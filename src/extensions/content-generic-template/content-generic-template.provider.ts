import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {CONTENT_GENERIC_TEMPLATE} from './content-generic-template.const';
import {
  ContentGenericTemplate,
  GenericTemplate,
} from './content-generic-template.model';
import {ContentGenericTemplateRepository} from './content-generic-template.repository';
import {ContentGenericTemplateService} from './content-generic-template.service';

export class ContentGenericTemplateProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CONTENT_GENERIC_TEMPLATE, app);

    this.models.push(GenericTemplate);
    this.models.push(ContentGenericTemplate);
    this.repositories.push({repoClass: ContentGenericTemplateRepository});

    this.services.push({cls: ContentGenericTemplateService});
  }
}
