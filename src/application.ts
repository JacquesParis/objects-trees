import {AuthenticationComponent} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import {
  AuthorizationBindings,
  AuthorizationComponent,
  AuthorizationDecision,
  AuthorizationOptions,
  AuthorizationTags,
} from '@loopback/authorization';
import {BootMixin} from '@loopback/boot';
import {
  BindingScope,
  Constructor,
  Context,
  ContextBindings,
  Interceptor,
  InterceptorBindingOptions,
  Provider,
} from '@loopback/core';
import {ObjectType, RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import {merge} from 'lodash';
import {ApplicationComponent} from './application.component';
import {ObjectTreesBootComponent} from './boot.component';
import {AUTHORIZATION_SERVICE, DATASTORE_DB} from './constants';
import {ObjectNodeController} from './controllers/object-node.controller';
import {ObjectTreeController} from './controllers/object-tree.controller';
import {ObjectTypeController} from './controllers/object-type.controller';
import {PingController} from './controllers/ping.controller';
import {UserController} from './controllers/user.controller';
import {DbDataSource} from './datasources/db.datasource';
import {
  InterceptorDescription,
  ServiceDescripiton,
  TreatmentDescription,
} from './integration/extension-description';
import {
  ExtensionProvider,
  ExtensionProviderClass,
} from './integration/extension.provider';
import {ObjectTreesApplicationConfig} from './integration/object-trees-application.config';
import {INTERCEPTORS_ORDER} from './interceptors/constants';
import {ContentText} from './models/content-text.model';
import {ObjectNode} from './models/object-node.model';
import {ObjectSubType} from './models/object-sub-type.model';
import {ContentFileRepository} from './repositories/content-file.repository';
import {ContentTextRepository} from './repositories/content-text.repository';
import {ObjectNodeRepository} from './repositories/object-node.repository';
import {ObjectSubTypeRepository} from './repositories/object-sub-type.repository';
import {ObjectTypeRepository} from './repositories/object-type.repository';
import {MySequence} from './sequence';
import {AccessRightsProvider} from './services/access-rights/access-rights.provider';
import {ActionEntityService} from './services/action-entity/action-entity.service';
import {AppAuthorizationProvider} from './services/app-authorization.service';
import {ApplicationService} from './services/application.service';
import {ContentEntityCoreProvider} from './services/content-entity/content-entity.provider';
import {ContentEntityService} from './services/content-entity/content-entity.service';
import {EntityDefinitionProvider} from './services/entity-definition/entity-definition.provider';
import {ObjectNodeContentService} from './services/object-node/object-node-content.service';
import {ObjectNodeService} from './services/object-node/object-node.service';
import {ObjectTreeProvider} from './services/object-tree/object-tree.provider';
import {ObjectTreeService} from './services/object-tree/object-tree.service';
import {ObjectTypeService} from './services/object-type.service';
import {TransientEntityProvider} from './services/transient-entity/transient-entity.provider';
import {UriCompleteProvider} from './services/uri-complete/uri-complete.provider';
import {UserAuthenticationService} from './services/user-authentication.service';

/*export abstract class ObjectTreesApplicationInterface extends RestApplication {
  public abstract async boot(): Promise<void>;
  public bootOptions: BootOptions;
  public abstract dataSource(dataSource: any, nameOrOptions?: any): any;
  public abstract model(modelClass: any): any;
  public abstract repository(repoClass: any, nameOrOptions?: any): any;
  public abstract service(cls: any, nameOrOptions?: any): any;
}*/

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
  public abstract bootObjectTrees(): Promise<void>;
  public abstract getService<T>(t: {name: string}): Promise<T>;
}

export class ObjectTreesApplication extends RestApplication {
  public interceptorDescriptions: {
    [interceptorId: string]: InterceptorDescription & {providerId: string};
  } = {};
  public postTreatmentDescriptions: TreatmentDescription[] = [];
  public preTreatmentDescriptions: TreatmentDescription[] = [];
  protected extensionProviders: ExtensionProvider[] = [];
  constructor(config?: ObjectTreesApplicationConfig, parent?: Context) {
    super(config, parent);
    const app = (this as unknown) as ObjectTreesApplicationInterface;
    console.log('Init application...');
    // Set up the custom sequence
    app.sequence(MySequence);

    // Customize @loopback/rest-explorer configuration here
    app.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    app.component(RestExplorerComponent);

    //    app.configureFileUpload(options.fileStorageDirectory);

    app.bind(RestBindings.REQUEST_BODY_PARSER_OPTIONS).to({limit: '50mb'});

    // Customize @loopback/boot Booter Conventions here
    app.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: [],
        extensions: ['.controller.js'],
        nested: false,
      },
      repositories: {
        dirs: [],
        extensions: ['.repository.js'],
        nested: false,
      },
    };

    app
      .bind(ContextBindings.GLOBAL_INTERCEPTOR_ORDERED_GROUPS)
      .to(INTERCEPTORS_ORDER);

    app.controller(ObjectNodeController);
    app.controller(ObjectTreeController);
    app.controller(ObjectTypeController);
    app.controller(PingController);
    app.controller(UserController);

    // Bind datasource
    app.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);
    app
      .dataSource(DbDataSource, DATASTORE_DB.replace('datasources.', ''))
      .inScope(BindingScope.SINGLETON);

    app.model(ContentText);
    app.model(ObjectNode);
    app.model(ObjectSubType);
    app.model(ObjectType);

    app.repository(ContentFileRepository);
    app.repository(ContentTextRepository);
    app.repository(ObjectNodeRepository);
    app.repository(ObjectSubTypeRepository);
    app.repository(ObjectTypeRepository);

    // ------ ADD SNIPPET AT THE BOTTOM ---------
    // Mount authentication system
    app.component(AuthenticationComponent);
    // Mount jwt component
    app.component(JWTAuthenticationComponent);
    // Bind user and credentials repository
    app
      .bind(UserServiceBindings.USER_SERVICE)
      .toClass(UserAuthenticationService);
    // Bind datasource
    //  app.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);
    // ------------- END OF SNIPPET -------------
    const authorizationOptions: AuthorizationOptions = {
      precedence: AuthorizationDecision.DENY,
      defaultDecision: AuthorizationDecision.DENY,
    };

    app.configure(AuthorizationBindings.COMPONENT).to(authorizationOptions);
    app.component(AuthorizationComponent);

    app
      .bind(AUTHORIZATION_SERVICE)
      .toProvider(AppAuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER);

    app.bind(RestBindings.ERROR_WRITER_OPTIONS).to({
      safeFields: ['errorCode', 'errorArgs', 'name'],
    });

    app.component(ApplicationComponent);

    if (!config) {
      config = {};
    }
    if (!config.extensions) {
      config.extensions = [];
    }
    config.extensions.unshift(TransientEntityProvider);
    config.extensions.unshift(EntityDefinitionProvider);
    config.extensions.unshift(AccessRightsProvider);
    config.extensions.unshift(ContentEntityCoreProvider);
    config.extensions.unshift(ObjectTreeProvider);
    config.extensions.push(UriCompleteProvider);
    /*
    this.extensionProviders.push(new ContentEntityCoreProvider(app));
    this.extensionProviders.push(new AccessRightsProvider(app));
    this.extensionProviders.push(new EntityDefinitionProvider(app));
    this.extensionProviders.push(new TransientEntityProvider(app));
    */

    this.addProviders(app, config.extensions);

    /*
    if (config?.extensions?.length) {
      for (const objectTypeProvider of config.extensions) {
        const provider = new objectTypeProvider(app);
        if (!addedProviders.includes(provider.name)) {
        }
        this.extensionProviders.push(provider);
      }
    }*/
    console.log('Application initialized !');
  }

  private addProviders(
    app: ObjectTreesApplicationInterface,
    extensions: ExtensionProviderClass[],
    addedProviders: string[] = [],
  ) {
    for (const objectTypeProvider of extensions) {
      const provider = new objectTypeProvider(app);
      if (!addedProviders.includes(provider.name)) {
        addedProviders.push(provider.name);
        this.addProviders(app, provider.requiredProviders, addedProviders);
        this.extensionProviders.push(provider);
      }
    }
  }

  public addInterceptor(
    providerId: string,
    interceptorProvider: {
      id: string;
      interceptor: Interceptor | Constructor<Provider<Interceptor>>;
      nameOrOptions?: string | InterceptorBindingOptions;
      description: InterceptorDescription;
    },
  ) {
    this.interceptor(
      interceptorProvider.interceptor,
      merge(
        {},
        {
          name: interceptorProvider.id,
          global: true,
          group: interceptorProvider.id,
        },
        interceptorProvider.nameOrOptions
          ? interceptorProvider.nameOrOptions
          : {},
      ),
    );
    this.interceptorDescriptions[interceptorProvider.id] = merge(
      {providerId},
      interceptorProvider.description,
    );
  }

  public async bootObjectTrees(): Promise<void> {
    const app = (this as unknown) as ObjectTreesApplicationInterface;
    console.log('Boot application...');
    await app.boot();

    /*
    app.interceptor(AccessRightsInterceptor, {
      name: CONTEXT_INTERCEPTOR,
      global: true,
      group: CONTEXT_INTERCEPTOR,
    });*/

    app.service(ApplicationService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ApplicationService>(ApplicationService);
    app.service(ContentEntityService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentEntityService>(ContentEntityService);
    app.service(ActionEntityService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ActionEntityService>(ActionEntityService);
    app.service(ObjectTypeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ObjectTypeService>(ObjectTypeService);

    const appCtx = await app.getService<ApplicationService>(ApplicationService);
    const objectTypeService = await app.getService<ObjectTypeService>(
      ObjectTypeService,
    );
    await objectTypeService.cleanWhenReboot();

    app.service(ObjectNodeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ObjectNodeService>(ObjectNodeService);
    /*
    app.service(ContentUserService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentUserService>(ContentUserService);
    */
    app.service(ObjectNodeContentService, {
      defaultScope: BindingScope.SINGLETON,
    });
    await app.getService<ObjectNodeContentService>(ObjectNodeContentService);
    app.service(ObjectTreeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ObjectTreeService>(ObjectTreeService);

    /*
    app.service(AccessRightsService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightsService>(AccessRightsService);
    app.service(AccessRightsTreeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightsTreeService>(AccessRightsTreeService);
    app.service(AccessRightsNodeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightsNodeService>(AccessRightsNodeService);
    app.service(AccessRightsTypeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightsTypeService>(AccessRightsTypeService);
    app.service(AccessRightsUserService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightsUserService>(AccessRightsUserService);
    */
    /*
    app.service(ContentFileService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentFileService>(ContentFileService);
    app.service(ContentTextService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentTextService>(ContentTextService);
    app.service(ContentFileService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentFileService>(ContentFileService);
    */
    /*
    const objectTreeService = await app.getService<ObjectTreeService>(
      ObjectTreeService,
    );
    await objectTreeService.ready;*/

    for (const provider of this.extensionProviders) {
      await provider.setContext(appCtx);
    }

    for (const provider of this.extensionProviders) {
      await provider.beforeBoot();
    }

    for (const provider of this.extensionProviders) {
      await provider.boot();
    }

    app.component(ObjectTreesBootComponent);
    console.log('Boot up !');

    //    for (const interceptorId of Object.keys(this.interceptorDescriptions)
    const interceptors: string[] = app
      .getBinding(ContextBindings.GLOBAL_INTERCEPTOR_ORDERED_GROUPS)
      .getValue(app) as string[];

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let index = 0; index < interceptors.length; index++) {
      if (
        interceptors[index] in this.interceptorDescriptions &&
        this.interceptorDescriptions[interceptors[index]].preTreatment
      ) {
        const treatment: TreatmentDescription = new TreatmentDescription(
          this.interceptorDescriptions[interceptors[index]].providerId,
          interceptors[index],
          this.interceptorDescriptions[interceptors[index]].preTreatment
            ?.description as string,
        );
        for (const serviceName of this.interceptorDescriptions[
          interceptors[index]
        ].preTreatment?.services as string[]) {
          const service: ServiceDescripiton = await this.getService<
            ServiceDescripiton
          >({name: serviceName});
          if (service.getPreTraitmentDescription) {
            treatment.subTreatments.push(
              ...service.getPreTraitmentDescription(),
            );
          }
        }
        this.preTreatmentDescriptions.push(treatment);
      }
    }
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let index = interceptors.length - 1; index >= 0; index--) {
      if (
        interceptors[index] in this.interceptorDescriptions &&
        this.interceptorDescriptions[interceptors[index]].postTreatment
      ) {
        const treatment: TreatmentDescription = new TreatmentDescription(
          this.interceptorDescriptions[interceptors[index]].providerId,
          interceptors[index],
          this.interceptorDescriptions[interceptors[index]].postTreatment
            ?.description as string,
        );
        for (const serviceName of this.interceptorDescriptions[
          interceptors[index]
        ].postTreatment?.services as string[]) {
          const service: ServiceDescripiton = await this.getService<
            ServiceDescripiton
          >({name: serviceName});
          if (service.getPostTraitmentDescription) {
            treatment.subTreatments.push(
              ...service.getPostTraitmentDescription(),
            );
          }
        }
        this.postTreatmentDescriptions.push(treatment);
      }
    }
    console.log('Boot summary:');
    console.log('- Treatments on incoming request:');
    for (const treatment of this.preTreatmentDescriptions) {
      this.consoleTreatment(treatment);
    }
    console.log('- Request extended actions');
    for (const treatment of (
      await this.getService<ActionEntityService>(ActionEntityService)
    ).getPostTraitmentDescription()) {
      this.consoleTreatment(treatment);
    }

    console.log('- Treatments on returned Entity(ies):');
    for (const treatment of this.postTreatmentDescriptions) {
      this.consoleTreatment(treatment);
    }
  }

  private consoleTreatments(
    treatmentDescriptions: TreatmentDescription[],
    level = 0,
  ) {
    for (const treatmentDescription of treatmentDescriptions) {
      this.consoleTreatment(treatmentDescription, level + 1);
    }
  }
  private consoleTreatment(
    treatmentDescription: TreatmentDescription,
    level = 1,
  ) {
    let prepend = ' ';
    for (let i = 0; i < level; i++) {
      prepend += '   ';
    }
    prepend += '- ';
    console.log(
      prepend +
        treatmentDescription.description +
        ' (' +
        treatmentDescription.providerId +
        '.' +
        treatmentDescription.runnerId +
        ')',
    );
    this.consoleTreatments(treatmentDescription.subTreatments, level);
  }

  public async getService<T>(t: {name: string}): Promise<T> {
    let name = t.name;
    if (name.endsWith('Provider')) {
      name = name.substr(0, name.length - 'Provider'.length);
    }
    return this.get('services.' + name);
  }
}
