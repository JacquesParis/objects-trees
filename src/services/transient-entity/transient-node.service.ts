/* eslint-disable no-empty */
import {IMoveToAction, IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {filter} from 'lodash';
import {EntityName, ObjectTree} from '../../models';
import {ObjectNode} from '../../models/object-node.model';
import {CurrentContext} from '../application.service';
import {TreatmentDescription} from './../../integration/extension-description';
import {ApplicationService} from './../application.service';
import {ContentEntityService} from './../content-entity/content-entity.service';
import {InsideRestService} from './../inside-rest/inside-rest.service';
import {ObjectTypeService} from './../object-type.service';
import {UriCompleteService} from './../uri-complete/uri-complete.service';
import {TRANSIENT_ENTITY_PROVIDER} from './transient-entity.const';
import {
  TransientEntityInterface,
  TransientEntityService,
} from './transient-entity.service';
export class TransientNodeService implements TransientEntityInterface {
  public providerId: string = TRANSIENT_ENTITY_PROVIDER;
  serviceId: string = TransientNodeService.name;
  description = this.getPostTreatmentDescription.bind(this);
  constructor(
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(ContentEntityService)
    private contentEntityService: ContentEntityService,
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(ApplicationService) private applicationService: ApplicationService,
  ) {
    this.transientEntityService.registerTransientEntityService(
      EntityName.objectNode,
      this,
    );
  }
  getPostTreatmentDescription(): TreatmentDescription {
    const treatment: TreatmentDescription = new TreatmentDescription(
      TRANSIENT_ENTITY_PROVIDER,
      TransientNodeService.name,
      'objectNode: Add Node Content Data and moveTo method description',
    );
    treatment.subTreatments.push(
      ...this.contentEntityService.getPostTreatmentDescription(),
    );
    return treatment;
  }

  async completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const objectNode: ObjectNode = entity as ObjectNode;
    const objectType = await ctx.nodeContext.objectType.getOrSetValue(
      async () => this.objectTypeService.searchById(objectNode.objectTypeId),
    );

    await this.contentEntityService.addTransientContent(
      EntityName.objectNode,
      objectType.contentType,
      entity,
    );

    await this.addMoveToActions(objectNode, ctx);
  }

  async addMoveToActions(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ): Promise<void> {
    if (!ctx.uriContext.mainContext) {
      return;
    }
    const uriCompleteService: UriCompleteService = await this.applicationService.app.getService<UriCompleteService>(
      UriCompleteService,
    );
    const insideRestService: InsideRestService = await this.applicationService.app.getService<InsideRestService>(
      InsideRestService,
    );
    try {
      const rootTree: ObjectTree = (await insideRestService.read(
        uriCompleteService.getUri(
          EntityName.objectTree,
          objectNode.parentNamespaceId,
          ctx,
        ),
        ctx,
      )) as ObjectTree;

      const moveTo: {
        [objectSourceTypeId: string]: IMoveToAction[];
      } = await this.buildMoveToList(
        objectNode.id as string,
        rootTree,
        uriCompleteService,
        insideRestService,
        ctx,
      );
      this.addMoveTo(objectNode, moveTo);
    } catch (error) {}
  }

  private addMoveTo(
    objectNode: ObjectNode,
    moveTo: {
      [objectSourceTypeId: string]: IMoveToAction[];
    },
  ) {
    if (objectNode.objectTypeId in moveTo) {
      const targets: IMoveToAction[] = filter(
        moveTo[objectNode.objectTypeId],
        (target) => objectNode.parentNodeId !== target.id,
      );
      if (0 < targets.length) {
        if (!objectNode.entityCtx) {
          objectNode.entityCtx = {entityType: EntityName.objectNode};
        }
        if (!objectNode.entityCtx.actions) {
          objectNode.entityCtx.actions = {};
        }
        objectNode.entityCtx.actions.moveTo = targets;
      }
    }
  }

  private async buildMoveToList(
    sourceNodeId: string,
    objectTree: ObjectTree,
    uriCompleteService: UriCompleteService,
    insideRestService: InsideRestService,
    ctx: CurrentContext,
    moveTo: {
      [objectSourceTypeId: string]: IMoveToAction[];
    } = {},
  ): Promise<{
    [objectSourceTypeId: string]: IMoveToAction[];
  }> {
    if (sourceNodeId === objectTree.treeNode.id) {
      return moveTo;
    }
    if (false === objectTree?.entityCtx?.loaded) {
      try {
        objectTree = (await insideRestService.read(
          uriCompleteService.getUri(
            EntityName.objectTree,
            objectTree.treeNode.id as string,
            ctx,
          ),
          ctx,
        )) as ObjectTree;
      } catch (error) {}
    }
    if (objectTree.entityCtx?.actions?.creations) {
      for (const creationTypeId of Object.keys(
        objectTree.entityCtx.actions.creations,
      )) {
        if (!(creationTypeId in moveTo)) {
          moveTo[creationTypeId] = [];
        }
        moveTo[creationTypeId].push({
          id: objectTree.id,
          uri: uriCompleteService.getUri(
            EntityName.objectTree,
            objectTree.id,
            ctx,
          ),
          nodeName: objectTree.treeNode.name,
          nodeType: objectTree.treeNode.objectTypeId,
          preview: objectTree.entityCtx.preview,
        });
      }
    }
    if (objectTree.children) {
      for (const child of objectTree.children) {
        await this.buildMoveToList(
          sourceNodeId,
          child,
          uriCompleteService,
          insideRestService,
          ctx,
          moveTo,
        );
      }
    }
    return moveTo;
  }
}
