import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {EntityInterceptProvider} from './../entity-intercept/entity-intercept.provider';
import {DATASTORE_INSIDE_REST, INSIDE_REST_PROVIDER} from './inside-rest.const';
import {InsideRestDataSource} from './inside-rest.datasource';
import {
  InsideRestRepositoryProvider,
  InsideRestService,
} from './inside-rest.service';

export class InsideRestProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(INSIDE_REST_PROVIDER, app);
    this.requiredProviders.push(EntityInterceptProvider);
    this.dataSources.push({
      dataSource: InsideRestDataSource,
      name: DATASTORE_INSIDE_REST,
    });
    this.services.push(
      {cls: InsideRestRepositoryProvider},
      {cls: InsideRestService},
    );
  }
}
