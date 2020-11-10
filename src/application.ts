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
import {BootComponent} from './boot.component';
import {STORAGE_DIRECTORY} from './constants';
import {DbDataSource} from './datasources/db.datasource';
import {INTERCEPTORS_ORDER} from './interceptors/constants';
import {MySequence} from './sequence';
import {AppAuthorizationProvider} from './services/app-authorization.service';
import {UserAuthenticationService} from './services/user-authentication.service';

export class ObjectstreesApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  public static serverBase = 'http://127.0.0.1:3000/api';

  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    //    this.configureFileUpload(options.fileStorageDirectory);

    const destination = path.join(__dirname, '../.storage');
    this.bind(STORAGE_DIRECTORY).to(destination);

    this.bind(RestBindings.REQUEST_BODY_PARSER_OPTIONS).to({limit: '50mb'});

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    this.bind(ContextBindings.GLOBAL_INTERCEPTOR_ORDERED_GROUPS).to(
      INTERCEPTORS_ORDER,
    );

    // ------ ADD SNIPPET AT THE BOTTOM ---------
    // Mount authentication system
    this.component(AuthenticationComponent);
    // Mount jwt component
    this.component(JWTAuthenticationComponent);
    // Bind user and credentials repository
    this.bind(UserServiceBindings.USER_SERVICE).toClass(
      UserAuthenticationService,
    );
    // Bind datasource
    this.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);
    // ------------- END OF SNIPPET -------------
    const authorizationOptions: AuthorizationOptions = {
      precedence: AuthorizationDecision.DENY,
      defaultDecision: AuthorizationDecision.DENY,
    };

    this.configure(AuthorizationBindings.COMPONENT).to(authorizationOptions);
    this.component(AuthorizationComponent);

    this.bind('authorizationProviders.appAuthorization')
      .toProvider(AppAuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER);

    this.bind(RestBindings.ERROR_WRITER_OPTIONS).to({
      safeFields: ['errorCode', 'errorArgs', 'name'],
    });

    this.component(ApplicationComponent);
  }
  async boot(): Promise<void> {
    await super.boot();
    this.component(BootComponent);
  }
}
