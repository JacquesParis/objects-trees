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
import {BindingScope, Context, ContextBindings} from '@loopback/core';
import {ObjectType, RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import {ApplicationComponent} from './application.component';
import {ObjectTreesBootComponent} from './boot.component';
import {AUTHORIZATION_SERVICE, DATASTORE_DB} from './constants';
import {ObjectNodeController} from './controllers/object-node.controller';
import {ObjectTreeController} from './controllers/object-tree.controller';
import {ObjectTypeController} from './controllers/object-type.controller';
import {PingController} from './controllers/ping.controller';
import {UserController} from './controllers/user.controller';
import {DbDataSource} from './datasources/db.datasource';
import {ObjectTreesApplicationConfig} from './integration/object-trees-application.config';
import {ObjectTypeProvider} from './integration/object-types/object-type.provider';
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
import {AccessRightNodeService} from './services/access-rights/access-rights-node.service';
import {AccessRightTreeService} from './services/access-rights/access-rights-tree.service';
import {AccessRightTypeService} from './services/access-rights/access-rights-type.service';
import {AccessRightUserService} from './services/access-rights/access-rights-user.service';
import {AccessRightsService} from './services/access-rights/access-rights.service';
import {AppAuthorizationProvider} from './services/app-authorization.service';
import {ApplicationService} from './services/application.service';
import {ContentEntityService} from './services/content-entity.service';
import {ContentFileService} from './services/content-file.service';
import {ContentTextService} from './services/content-text.service';
import {ContentUserService} from './services/content-user.service';
import {ObjectNodeContentService} from './services/object-node-content.service';
import {ObjectNodeService} from './services/object-node.service';
import {ObjectTreeService} from './services/object-tree/object-tree.service';
import {ObjectTypeService} from './services/object-type.service';
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
  public abstract bootObjectTrees(): Promise<void>;
  public abstract getService<T>(t: {name: string}): Promise<T>;
}

export class ObjectTreesApplication extends RestApplication {
  protected extensionProviders: {
    [providerName: string]: ObjectTypeProvider;
  } = {};
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

    if (config?.objectTypes?.length) {
      for (const objectTypeProvider of config.objectTypes) {
        const provider = new objectTypeProvider(app);
        this.extensionProviders[provider.name] = provider;
      }
    }
    console.log('Application initialized !');
  }

  public async bootObjectTrees(): Promise<void> {
    const app = (this as unknown) as ObjectTreesApplicationInterface;
    console.log('Boot application...');
    await app.boot();

    app.service(ApplicationService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ApplicationService>(ApplicationService);
    app.service(ContentEntityService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentEntityService>(ContentEntityService);
    app.service(ObjectTypeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ObjectTypeService>(ObjectTypeService);
    app.service(ObjectNodeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ObjectNodeService>(ObjectNodeService);
    app.service(ContentUserService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentUserService>(ContentUserService);
    app.service(ObjectNodeContentService, {
      defaultScope: BindingScope.SINGLETON,
    });
    await app.getService<ObjectNodeContentService>(ObjectNodeContentService);
    app.service(ObjectTreeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ObjectTreeService>(ObjectTreeService);
    app.service(AccessRightsService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightsService>(AccessRightsService);
    app.service(AccessRightTreeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightTreeService>(AccessRightTreeService);
    app.service(AccessRightNodeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightNodeService>(AccessRightNodeService);
    app.service(AccessRightTypeService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightTypeService>(AccessRightTypeService);
    app.service(AccessRightUserService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<AccessRightUserService>(AccessRightUserService);

    app.service(ContentFileService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentFileService>(ContentFileService);
    app.service(ContentTextService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentTextService>(ContentTextService);
    app.service(ContentFileService, {defaultScope: BindingScope.SINGLETON});
    await app.getService<ContentFileService>(ContentFileService);

    const appCtx = await app.getService<ApplicationService>(ApplicationService);
    const objectTypeService = await app.getService<ObjectTypeService>(
      ObjectTypeService,
    );
    const objectTreeService = await app.getService<ObjectTreeService>(
      ObjectTreeService,
    );
    await objectTreeService.ready;
    const accessRightsService = await app.getService<AccessRightsService>(
      AccessRightsService,
    );
    await accessRightsService.ready;

    for (const providerName in this.extensionProviders) {
      await this.extensionProviders[providerName].beforeBoot(
        app,
        appCtx,
        objectTypeService,
      );
    }

    for (const providerName in this.extensionProviders) {
      await this.extensionProviders[providerName].boot();
    }

    app.component(ObjectTreesBootComponent);
    console.log('Boot up !');
  }

  public async getService<T>(t: {name: string}): Promise<T> {
    return this.get('services.' + t.name);
  }
}
