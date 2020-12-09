import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {InsideRestDataSource} from './../../datasources/inside-rest.datasource';
import {DATASTIRE_INSIDE_REST} from './inside-rest.constant';
import {InsideRestServiceProvider} from './inside-rest.service';

export class InsideRestProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('InsideRestService', app);
    this.dataSources.push({
      dataSource: InsideRestDataSource,
      name: DATASTIRE_INSIDE_REST,
    });
    this.services.push({cls: InsideRestServiceProvider});
  }
}
