import {BootMixin} from '@loopback/boot';
import {
  BindingFromClassOptions,
  Constructor,
  Interceptor,
  InterceptorBindingOptions,
  Provider,
} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import {
  InterceptorDescription,
  RunnerTreatmentDescription,
} from './integration/extension-description';

export abstract class ObjectTreesApplicationInterface extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  public abstract addInterceptor(
    providerId: string,
    interceptorProvider: {
      id: string;
      interceptor: Interceptor | Constructor<Provider<Interceptor>>;
      nameOrOptions?: string | InterceptorBindingOptions;
      description: InterceptorDescription;
    },
  ): void;
  public abstract addController(
    name: string,
    controller: {
      controllerCtor: Constructor<unknown>;
      nameOrOptions?: string | BindingFromClassOptions | undefined;
      description: RunnerTreatmentDescription;
    },
  ): void;
  public abstract bootObjectTrees(): Promise<void>;
  public abstract getService<T>(t: {name: string}): Promise<T>;
  public abstract addStaticDir(basePath: string, dirName: string): void;
  public abstract getStaticDirs(): {[basePath: string]: string};
}
