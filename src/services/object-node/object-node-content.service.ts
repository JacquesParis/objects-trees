import {/* inject, */ BindingScope, injectable, service} from '@loopback/core';
import {ContentEntityService} from '../content-entity/content-entity.service';
import {ApplicationError} from './../../helper/application-error';
import {CurrentContext} from './../application.service';
import {ObjectTypeService} from './../object-type.service';
import {ObjectNodeService} from './object-node.service';

@injectable({scope: BindingScope.SINGLETON})
export class ObjectNodeContentService {
  constructor(
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
    @service(ObjectTypeService)
    public objectTypeService: ObjectTypeService,
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
    ctx: CurrentContext,
  ): Promise<{filePath: string; fileName: string} | unknown> {
    const objectNode = await this.objectNodeService.searchById(nodeId);
    if (!objectNode) {
      return ApplicationError.notFound({object: nodeId});
    }
    const ObjectType = await this.objectTypeService.searchById(
      objectNode.objectTypeId,
    );
    if (!ObjectType) {
      return ApplicationError.notFound({
        object: nodeId,
        objectType: objectNode.objectTypeId,
      });
    }
    if (ObjectType.contentType !== contentType) {
      return ApplicationError.wrongValue({
        object: nodeId,
        contentType: contentType,
      });
    }
    return this.contentEntityService.getContent(
      contentType,
      objectNode,
      fieldName,
      args,
    );
  }
}
