import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {getModelSchemaRef, param, post, requestBody} from '@loopback/rest';
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
    return this.actionEntityService.runAction<ObjectNode>(
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
    return this.actionEntityService.runAction<ObjectTree>(
      EntityName.objectTree,
      id,
      methodId,
      args,
      ctx,
    );
  }
}
