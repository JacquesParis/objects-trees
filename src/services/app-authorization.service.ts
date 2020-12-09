import {TokenService} from '@loopback/authentication';
import {
  JWTAuthenticationStrategy,
  TokenServiceBindings,
} from '@loopback/authentication-jwt';
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer,
} from '@loopback/authorization';
import {inject, Provider, service} from '@loopback/core';
import {Request, RestBindings} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {AccessRightsService} from './access-rights/access-rights.service';
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
    @service(AccessRightsService)
    private accessRightsService: AccessRightsService,
    @inject(SecurityBindings.USER, {optional: true})
    private user: UserProfile,
    @inject(RestBindings.Http.REQUEST) private request: Request,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
  ) {}

  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    context: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {
    this.ctx.accessRightsContexte.authorization.value = this.request.headers
      .authorization as string;
    if (!this.user) {
      try {
        this.user = (await new JWTAuthenticationStrategy(
          this.jwtService,
        ).authenticate(this.request)) as UserProfile;
        context.principals[0] = {
          ...this.user,
          name: this.user.name ?? this.user[securityId],
          type: 'USER',
        };
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }
    return this.accessRightsService.authorize(this.ctx, context, metadata);
  }
}
