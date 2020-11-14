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
import {ApplicationConfig, ContextBindings} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {ApplicationComponent} from './application.component';
import {ObjectsTreesBootComponent} from './boot.component';
import {AUTHORIZATION_SERVICE, STORAGE_DIRECTORY} from './constants';
import {ObjectNodeController} from './controllers/object-node.controller';
import {ObjectTreeController} from './controllers/object-tree.controller';
import {ObjectTypeController} from './controllers/object-type.controller';
import {PingController} from './controllers/ping.controller';
import {UserController} from './controllers/user.controller';
import {DbDataSource} from './datasources/db.datasource';
import {INTERCEPTORS_ORDER} from './interceptors/constants';
import {ContentText} from './models/content-text.model';
import {ObjectNode} from './models/object-node.model';
import {ObjectSubType} from './models/object-sub-type.model';
import {ObjectType} from './models/object-type.model';
import {ContentFileRepository} from './repositories/content-file.repository';
import {ContentTextRepository} from './repositories/content-text.repository';
import {ObjectNodeRepository} from './repositories/object-node.repository';
import {ObjectSubTypeRepository} from './repositories/object-sub-type.repository';
import {ObjectTypeRepository} from './repositories/object-type.repository';
import {MySequence} from './sequence';
import {AppAuthorizationProvider} from './services/app-authorization.service';
import {UserAuthenticationService} from './services/user-authentication.service';

export class ObjectsTreesApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  public static serverBase = 'http://127.0.0.1:3000/api';

  public static initApplication(app: ObjectsTreesApplication) {
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
    app.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);
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
  }

  constructor(options: ApplicationConfig = {}) {
    super(options);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const app = this;
    ObjectsTreesApplication.initApplication(app);
    // Set up default home page
    app.static('/', path.join(__dirname, '../public'));
    const destination = path.join(__dirname, '../.storage');
    app.bind(STORAGE_DIRECTORY).to(destination);
    app.projectRoot = __dirname;
  }
  async boot(): Promise<void> {
    await super.boot();
    this.component(ObjectsTreesBootComponent);
  }
}
