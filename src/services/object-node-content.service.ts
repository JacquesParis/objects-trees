import {/* inject, */ BindingScope, injectable, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {ObjectNodeRepository} from './../repositories/object-node.repository';
import {ContentEntityService} from './content-entity.service';
import {ObjectNodeService} from './object-node.service';
import {ObjectTypeService} from './object-type.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ObjectNodeContentService {
  constructor(
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
    @service(ObjectTypeService)
    public objectTypeService: ObjectTypeService,
    @repository(ObjectNodeRepository)
    public objectNodeRepository: ObjectNodeRepository,
  ) {}

  /*
  public async add(
    objectNode: DataObject<ObjectNode>,
    content?: MemoryFile[],
  ): Promise<ObjectNode> {
    const nodeContexte:NodeContext = {}
    const result:ObjectNode = await this.objectNodeService.add(objectNode,false,nodeContexte);
    const changes = await this.contentEntityService.manageContent(
      nodeContexte?.objectType?.contentType,
      result,
      content,
    );
    if (changes) {
      await this.objectNodeRepository.updateById(result.id, result);
    }
    return result;
  }*/

  public async getContent(
    nodeId: string,
    fieldName: string,
    contentType: string,
    args: {contentId?: string},
  ): Promise<{filePath: string; fileName: string} | unknown> {
    const objectNode = await this.objectNodeService.searchById(nodeId);
    if (!objectNode) {
      return new HttpErrors.NotFound('no node ' + nodeId);
    }
    const ObjectType = await this.objectTypeService.searchById(
      objectNode.objectTypeId,
    );
    if (!ObjectType) {
      return new HttpErrors.NotFound('no node ' + nodeId);
    }
    if (ObjectType.contentType !== contentType) {
      return new HttpErrors.ExpectationFailed(
        'node ' + nodeId + ' is not of type ' + contentType,
      );
    }
    return this.contentEntityService.getContent(
      contentType,
      objectNode,
      fieldName,
      args,
    );
  }
}
