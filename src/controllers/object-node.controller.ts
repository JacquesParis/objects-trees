import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {
  del,
  get,
  getModelSchemaRef,
  oas,
  param,
  patch,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import {ObjectNode} from '../models';
import {CurrentContext, CURRENT_CONTEXT} from '../services/application.service';
import {
  AccessRightsEntity,
  AccessRightsScope,
} from './../services/access-rights.service';
import {ObjectNodeContentService} from './../services/object-node-content.service';
import {ObjectNodeService} from './../services/object-node.service';

export class ObjectNodeController {
  constructor(
    @service(ObjectNodeService)
    public objectNodeService: ObjectNodeService,
    @service(ObjectNodeContentService)
    public objectNodeContentService: ObjectNodeContentService,
  ) {}

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.objectNode,
    scopes: [AccessRightsScope.create],
  })
  @post('/object-nodes', {
    responses: {
      '200': {
        description: 'ObjectNode model instance',
        content: {'application/json': {schema: getModelSchemaRef(ObjectNode)}},
      },
    },
  })
  create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectNode, {
            title: 'NewObjectNode',
            exclude: ['id'],
          }),
        },
      },
    })
    objectNode: Omit<ObjectNode, 'id'>,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectNode> {
    return this.objectNodeService.add(objectNode, ctx);
  }

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.objectNode,
    scopes: [AccessRightsScope.update],
  })
  @patch('/object-nodes/{id}', {
    responses: {
      '204': {
        description: 'ObjectNode PATCH success',
        content: {'application/json': {schema: getModelSchemaRef(ObjectNode)}},
      },
    },
  })
  updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectNode, {partial: true}),
        },
      },
    })
    objectNode: ObjectNode,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectNode> {
    return this.objectNodeService.modifyById(id, objectNode, ctx);
  }

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.objectNode,
    scopes: [AccessRightsScope.delete],
  })
  @del('/object-nodes/{id}', {
    responses: {
      '204': {
        description: 'ObjectNode DELETE success',
      },
    },
  })
  async deleteById(
    @param.path.string('id') id: string,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<void> {
    await this.objectNodeService.removeById(id, ctx);
  }

  @authorize({
    resource: AccessRightsEntity.objectNodeContent,
    scopes: [AccessRightsScope.read],
  })
  @get('/object-nodes/{id}/content-{contentType}/{contentId}')
  @oas.response.file()
  async downloadFile(
    @param.path.string('id') id: string,
    @param.path.string('contentType') contentType: string,
    @param.path.string('contentId') contentId: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    switch (contentType) {
      case 'file':
        // eslint-disable-next-line no-case-declarations
        const file: {
          filePath: string;
          fileName: string;
        } = (await this.objectNodeContentService.getContent(
          id,
          'contentFile',
          'ContentFile',
          {
            contentId: contentId,
          },
          ctx,
        )) as {
          filePath: string;
          fileName: string;
        };
        response.download(file.filePath, file.fileName);
        return response;
      default:
        // eslint-disable-next-line no-case-declarations
        const contentTypeExtension =
          contentType.charAt(0).toUpperCase() + contentType.substr(1);
        // eslint-disable-next-line no-case-declarations
        const text = (await this.objectNodeContentService.getContent(
          id,
          'content' + contentTypeExtension,
          'Content' + contentTypeExtension,
          {
            contentId: contentId,
          },
          ctx,
        )) as string;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.write(text);
        response.end();
        return response;
    }
  }

  /*


  @authorize({
    resource: AccessRightsEntity.objectNode,
    scopes: [AccessRightsScope.read],
  })
  @get('/object-nodes/{id}', {
    responses: {
      '200': {
        description: 'ObjectNode model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(ObjectNode, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(ObjectNode, {exclude: 'where'})
    filter?: FilterExcludingWhere<ObjectNode>,
  ): Promise<ObjectNode> {
    return this.objectNodeService.findById(id, filter);
  }

  @put('/object-nodes/{id}', {
    responses: {
      '204': {
        description: 'ObjectNode PUT success',
      },
    },
  })
  replaceById(
    @param.path.string('id') id: string,
    @requestBody() objectNode: ObjectNode,
  ): Promise<void> {
    return this.objectNodeService.replaceById(id, objectNode);
  }
*/
  /*
@get('/object-nodes/{id}/object-type', {
  responses: {
    '200': {
      description: 'ObjectType belonging to ObjectNode',
      content: {
        'application/json': {
          schema: {type: 'array', items: getModelSchemaRef(ObjectType)},
        },
      },
    },
  },
})
async getObjectType(
  @param.path.string('id') id: typeof ObjectNode.prototype.id,
): Promise<ObjectType> {
  return this.objectNodeRepository.objectType(id);
}
*/

  /*
  @patch('/object-nodes', {
    responses: {
      '200': {
        description: 'ObjectNode PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectNode, {partial: true}),
        },
      },
    })
    objectNode: ObjectNode,
    @param.where(ObjectNode) where?: Where<ObjectNode>,
  ): Promise<Count> {
    return this.objectNodeService.updateAll(objectNode, where);
  }

  @get('/object-nodes', {
    responses: {
      '200': {
        description: 'Array of ObjectNode model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(ObjectNode, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(ObjectNode) filter?: Filter<ObjectNode>,
  ): Promise<ObjectNode[]> {
    return this.objectNodeService.find(filter);
  }
*/
}
