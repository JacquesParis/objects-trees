import {BootOptions} from '@loopback/boot';
import {RestApplication} from '@loopback/rest';

export abstract class ObjectTreesApplication extends RestApplication {
  public abstract async boot(): Promise<void>;
  public bootOptions: BootOptions;
  public abstract dataSource(dataSource: any, nameOrOptions?: any): any;
  public abstract model(modelClass: any): any;
  public abstract repository(repoClass: any, nameOrOptions?: any): any;
  public abstract service(cls: any, nameOrOptions?: any): any;
}
