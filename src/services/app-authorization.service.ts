import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer,
} from '@loopback/authorization';
import {inject, Provider, service} from '@loopback/core';
import {Request, RestBindings} from '@loopback/rest';
import {AccessRightsService} from './access-rights.service';
import {CurrentContext, CURRENT_CONTEXT} from './application.service';

/*
 * Fix the service type. Possible options can be:
 * - import {AppAuthorization} from 'your-module';
 * - export type AppAuthorization = string;
 * - export interface AppAuthorization {}
 */

export class AppAuthorizationProvider implements Provider<Authorizer> {
  constructor(
    @inject(CURRENT_CONTEXT) public ctx: CurrentContext,
    @inject(RestBindings.Http.REQUEST) private request: Request,
    @service(AccessRightsService)
    private accessRightsService: AccessRightsService,
  ) {}

  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    context: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ) {
    await this.accessRightsService.ready;
    if (
      context.resource === 'OrderController.prototype.cancelOrder' &&
      context.principals[0].name === 'user-01'
    ) {
      return AuthorizationDecision.DENY;
    }

    return AuthorizationDecision.ALLOW;
  }
}
