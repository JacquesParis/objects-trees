import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {
  get,
  getModelSchemaRef,
  oas,
  param,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import {GeneratedResponse} from '../../helper/generated-response';
import {EntityName} from '../../models/entity-name';
import {ObjectNode} from '../../models/object-node.model';
import {
  AccessRightsEntity,
  AccessRightsScope,
} from '../access-rights/access-rights.const';
import {CurrentContext, CURRENT_CONTEXT} from '../application.service';
import {ObjectTree} from './../../models/object-tree.model';
import {ActionEntityService} from './action-entity.service';

export class ActionEntityController {
  constructor(
    @service(ActionEntityService)
    public actionEntityService: ActionEntityService,
  ) {}

  @authorize({
    resource: AccessRightsEntity.objectNodeContent,
    scopes: [AccessRightsScope.view],
  })
  @get('/object-nodes/{id}/view/{viewId}')
  async generateNodeView(
    @param.path.string('id') id: string,
    @param.path.string('viewId') viewId: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.actionEntityService.generateView(
      EntityName.objectNode,
      id,
      viewId,
      {},
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @get('/object-nodes/{id}/view/{viewId}/{arg1}')
  async generateNodeViewWith1Arg(
    @param.path.string('id') id: string,
    @param.path.string('viewId') viewId: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
    @param.path.string('arg1') arg1?: string,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.actionEntityService.generateView(
      EntityName.objectNode,
      id,
      viewId,
      [arg1],
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @get('/object-nodes/{id}/view/{viewId}/{arg1}/{arg2}')
  async generateNodeViewWith2Args(
    @param.path.string('id') id: string,
    @param.path.string('viewId') viewId: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
    @param.path.string('arg1') arg1?: string,
    @param.path.string('arg2') arg2?: string,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.actionEntityService.generateView(
      EntityName.objectNode,
      id,
      viewId,
      [arg1, arg2],
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @get('/object-nodes/{id}/view/{viewId}/{arg1}/{arg2}/{arg3}')
  async generateNodeViewWith3Args(
    @param.path.string('id') id: string,
    @param.path.string('viewId') viewId: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
    @param.path.string('arg1') arg1?: string,
    @param.path.string('arg2') arg2?: string,
    @param.path.string('arg3') arg3?: string,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.actionEntityService.generateView(
      EntityName.objectNode,
      id,
      viewId,
      [arg1, arg2, arg3],
      ctx,
    );
    return generatedView.getResponse(response);
  }

  @authorize({
    resource: AccessRightsEntity.objectNodeContent,
    scopes: [AccessRightsScope.view],
  })
  @get('/object-trees/{id}/view/{viewId}')
  @oas.response.file()
  async generateTreeView(
    @param.path.string('id') id: string,
    @param.path.string('viewId') viewId: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.actionEntityService.generateView(
      EntityName.objectTree,
      id,
      viewId,
      {},
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @get('/object-trees/{id}/view/{viewId}/{arg1}')
  async generateTreeViewWith1Arg(
    @param.path.string('id') id: string,
    @param.path.string('viewId') viewId: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
    @param.path.string('arg1') arg1?: string,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.actionEntityService.generateView(
      EntityName.objectTree,
      id,
      viewId,
      [arg1],
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @get('/object-trees/{id}/view/{viewId}/{arg1}/{arg2}')
  async generateTreeViewWith2Args(
    @param.path.string('id') id: string,
    @param.path.string('viewId') viewId: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
    @param.path.string('arg1') arg1?: string,
    @param.path.string('arg2') arg2?: string,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.actionEntityService.generateView(
      EntityName.objectTree,
      id,
      viewId,
      [arg1, arg2],
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @get('/object-trees/{id}/view/{viewId}/{arg1}/{arg2}/{arg3}')
  async generateTreeViewWith3Args(
    @param.path.string('id') id: string,
    @param.path.string('viewId') viewId: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
    @param.path.string('arg1') arg1?: string,
    @param.path.string('arg2') arg2?: string,
    @param.path.string('arg3') arg3?: string,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.actionEntityService.generateView(
      EntityName.objectTree,
      id,
      viewId,
      [arg1, arg2, arg3],
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @authorize({
    resource: AccessRightsEntity.objectNode,
    scopes: [AccessRightsScope.method],
  })
  @post('/object-nodes/{id}/method/{methodId}', {
    responses: {
      '200': {
        description: 'ObjectNode model instance',
        content: {'application/json': {schema: getModelSchemaRef(Object)}},
      },
    },
  })
  async runNodeAction(
    @param.path.string('id') id: string,
    @param.path.string('methodId') methodId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Object, {
            title: 'Argument',
          }),
        },
      },
    })
    args: Object,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectNode> {
    return this.actionEntityService.runMethod<ObjectNode>(
      EntityName.objectNode,
      id,
      methodId,
      args,
      ctx,
    );
  }

  @authorize({
    resource: AccessRightsEntity.objectTree,
    scopes: [AccessRightsScope.method],
  })
  @post('/object-trees/{id}/method/{methodId}', {
    responses: {
      '200': {
        description: 'ObjectTree model instance',
        content: {'application/json': {schema: getModelSchemaRef(Object)}},
      },
    },
  })
  async runTreeAction(
    @param.path.string('id') id: string,
    @param.path.string('methodId') methodId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Object, {
            title: 'Argument',
          }),
        },
      },
    })
    args: Object,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectTree> {
    return this.actionEntityService.runMethod<ObjectTree>(
      EntityName.objectTree,
      id,
      methodId,
      args,
      ctx,
    );
  }
}
