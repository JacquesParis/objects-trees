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
import {BindingScope, ContextBindings} from '@loopback/core';
import {ObjectType} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import express from 'express';
import {Server} from 'http';
import pEvent from 'p-event';
import {ObjectTreesApplicationInterface} from './application';
import {ApplicationComponent} from './application.component';
import {ObjectTreesBootComponent} from './boot.component';
import {AUTHORIZATION_SERVICE, DATASTORE_DB} from './constants';
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

export class ExpressServer {
  private app: express.Application;
  private lbApp: ObjectTreesApplicationInterface;
  private server: Server;

  constructor(restApp: RestApplication) {
    this.app = express();
    this.lbApp = (restApp as unknown) as ObjectTreesApplicationInterface;
    this.app.use('/api', this.lbApp.requestHandler);

    this.initApplication(this.lbApp);

    // Serve static files in the public folder
    this.app.use(express.static('public'));
  }
  async boot() {
    await this.lbApp.boot();
    await this.lbApp.bootObjectTrees();
    await this.bootApplication(this.lbApp);
  }

  public async start() {
    await this.lbApp.start();
    const port = this.lbApp.restServer.config.port || 3000;
    const host = this.lbApp.restServer.config.host
      ? this.lbApp.restServer.config.host
      : '127.0.0.1';
    this.server = this.app.listen(port, host);
    console.log('listening', host, port);
    await pEvent(this.server, 'listening');
  }

  // For testing purposes
  public async stop() {
    if (!this.server) return;
    await this.lbApp.stop();
    this.server.close();
    await pEvent(this.server, 'close');
    this.server = (null as unknown) as Server;
  }

  protected initApplication(app: ObjectTreesApplicationInterface) {
    return;
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

    if (this.lbApp.options.objectTypes?.length) {
      for (const objectTypeProvider of this.lbApp.options.objectTypes) {
        new objectTypeProvider(this.lbApp);
      }
    }
    console.log('Application initialized !');
  }

  protected async bootApplication(app: ObjectTreesApplicationInterface) {
    return;
    console.log('Boot application...');
    await app.boot();

    app.service(ApplicationService, {defaultScope: BindingScope.SINGLETON});
    app.service(ObjectNodeService, {defaultScope: BindingScope.SINGLETON});
    app.service(ObjectTypeService, {defaultScope: BindingScope.SINGLETON});
    app.service(ContentEntityService, {defaultScope: BindingScope.SINGLETON});
    app.service(ContentFileService, {defaultScope: BindingScope.SINGLETON});
    app.service(ContentTextService, {defaultScope: BindingScope.SINGLETON});
    app.service(ContentFileService, {defaultScope: BindingScope.SINGLETON});
    app.service(ContentUserService, {defaultScope: BindingScope.SINGLETON});
    app.service(ObjectNodeContentService, {
      defaultScope: BindingScope.SINGLETON,
    });
    app.service(ObjectTreeService, {defaultScope: BindingScope.SINGLETON});
    app.service(AccessRightsService, {defaultScope: BindingScope.SINGLETON});
    app.service(AccessRightTreeService, {defaultScope: BindingScope.SINGLETON});
    app.service(AccessRightNodeService, {defaultScope: BindingScope.SINGLETON});
    app.service(AccessRightTypeService, {defaultScope: BindingScope.SINGLETON});
    app.service(AccessRightUserService, {defaultScope: BindingScope.SINGLETON});

    app.component(ObjectTreesBootComponent);
    console.log('Boot up !');
  }
}
