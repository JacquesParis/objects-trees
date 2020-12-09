/* eslint-disable @typescript-eslint/no-unused-vars */
import {ContentEntityService} from '../content-entity/content-entity.service';
import {ObjectNodeService} from '../object-node/object-node.service';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectType} from './../../models/object-type.model';
import {ApplicationService, CurrentContext} from './../application.service';
import {ObjectTypeService} from './../object-type.service';
import {
  PUBLIC_OBJECT_NAME,
  REPOSITORY_CATEGORY_TYPE,
  REPOSITORY_TYPE,
  TEMPLATES_OBJECT_NAME,
  TENANT_TYPE,
} from './object-tree.const';
export class ObjectTreeInit {
  public ready: Promise<void>;
  constructor(
    private objectNodeService: ObjectNodeService,
    private objectTypeService: ObjectTypeService,
    private contentEntityService: ContentEntityService,
    private appCtx: ApplicationService,
  ) {
    this.ready = new Promise<void>((resolve, reject) => {
      this.init().then(
        () => {
          resolve();
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  async init() {
    const repositoryType: ObjectType = await this.appCtx.repositoryType.getOrSetValue(
      async (): Promise<ObjectType> => {
        return this.objectTypeService.registerApplicationType(REPOSITORY_TYPE);
      },
    );

    const tenantType: ObjectType = await this.appCtx.tenantType.getOrSetValue(
      async (): Promise<ObjectType> => {
        return this.objectTypeService.registerApplicationType(TENANT_TYPE);
      },
    );

    const categoryType: ObjectType = await this.appCtx.categoryType.getOrSetValue(
      async (): Promise<ObjectType> => {
        return this.objectTypeService.registerApplicationType(
          REPOSITORY_CATEGORY_TYPE,
        );
      },
    );

    await this.objectTypeService.getOrCreateObjectSubType(
      repositoryType.id as string,
      repositoryType.id as string,
      {
        acl: true,
        name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
        namespace: true,
        owner: true,
        tree: true,
      },
    );
    await this.objectTypeService.getOrCreateObjectSubType(
      repositoryType.id as string,
      categoryType.id as string,
      {
        acl: true,
        name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY_CATEGORY,
        namespace: true,
        owner: false,
        tree: true,
      },
    );

    await this.objectTypeService.getOrCreateObjectSubType(
      repositoryType.id as string,
      tenantType.id as string,
      {
        acl: true,
        name: ApplicationService.OBJECT_TYPE_NAMES.TENANT,
        namespace: true,
        owner: true,
        tree: true,
      },
    );

    await this.appCtx.rootNode.getOrSetValue(
      async (): Promise<ObjectNode> => {
        let newRoot = await this.objectNodeService.searchOwner(
          ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
          ApplicationService.OBJECT_NODE_NAMES[
            ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY
          ],
        );
        if (!newRoot) {
          newRoot = await this.objectNodeService.add(
            {
              name:
                ApplicationService.OBJECT_NODE_NAMES[
                  ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY
                ],
              objectTypeId: repositoryType.id,
              owner: true,
              tree: true,
              namesapce: true,
              acl: true,
            },
            new CurrentContext(),
            true,
          );
        }
        return newRoot;
      },
    );

    await this.appCtx.publicNode.getOrSetValue(
      async (): Promise<ObjectNode> => {
        let newPublic = await this.objectNodeService.searchOwner(
          ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
          'public',
        );
        if (!newPublic) {
          newPublic = await this.objectNodeService.add(
            {
              parentNodeId: this.appCtx.rootNode.value.id,
              name: 'public',
              objectTypeId: repositoryType.id,
            },
            CurrentContext.get({
              nodeContext: {
                parent: this.appCtx.rootNode,
              },
            }),
          );
        }
        return newPublic;
      },
    );

    await this.appCtx.publicTemplatesNode.getOrSetValue(
      async (): Promise<ObjectNode> => {
        let newTemplates = await this.objectNodeService.searchNamespace(
          ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
          PUBLIC_OBJECT_NAME,
          ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY_CATEGORY,
          TEMPLATES_OBJECT_NAME,
        );
        if (!newTemplates) {
          newTemplates = await this.objectNodeService.add(
            {
              parentNodeId: this.appCtx.publicNode.value.id,
              name: 'templates',
              objectTypeId: categoryType.id,
            },
            CurrentContext.get({
              nodeContext: {
                parent: this.appCtx.publicNode,
              },
            }),
          );
        }
        return newTemplates;
      },
    );
  }
}
