import {ObjectNode} from './../../models/object-node.model';
import {ObjectType} from './../../models/object-type.model';
import {ApplicationService, CurrentContext} from './../application.service';
import {ContentEntityService} from './../content-entity.service';
import {ObjectNodeService} from './../object-node.service';
import {ObjectTypeService} from './../object-type.service';
import {ROOT_TYPE, TENANT_TYPE} from './object-tree.const';
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
    const rootType: ObjectType = await this.appCtx.rootType.getOrSetValue(
      async (): Promise<ObjectType> => {
        let newRootType = await this.objectTypeService.searchByName(
          ApplicationService.OBJECT_TYPE_NAMES.ROOT,
        );

        if (!newRootType) {
          newRootType = await this.objectTypeService.add(
            ROOT_TYPE,
            new CurrentContext(),
          );
        }
        return newRootType;
      },
    );

    const tenantType: ObjectType = await this.appCtx.tenantType.getOrSetValue(
      async (): Promise<ObjectType> => {
        let newType = await this.objectTypeService.searchByName(
          ApplicationService.OBJECT_TYPE_NAMES.TENANT,
        );

        if (!newType) {
          newType = await this.objectTypeService.add(
            TENANT_TYPE,
            new CurrentContext(),
          );
        }
        return newType;
      },
    );

    await this.objectTypeService.getOrCreateObjectSubType(
      rootType.id as string,
      tenantType.id as string,
      {
        acl: true,
        name: ApplicationService.OBJECT_TYPE_NAMES.TENANT,
        namespace: true,
        owner: true,
        tree: true,
      },
    );

    await this.appCtx.rooteNode.getOrSetValue(
      async (): Promise<ObjectNode> => {
        let newRoot = await this.objectNodeService.searchOwner(
          ApplicationService.OBJECT_TYPE_NAMES.ROOT,
          ApplicationService.OBJECT_NODE_NAMES[
            ApplicationService.OBJECT_TYPE_NAMES.ROOT
          ],
        );
        if (!newRoot) {
          newRoot = await this.objectNodeService.add(
            {
              name:
                ApplicationService.OBJECT_NODE_NAMES[
                  ApplicationService.OBJECT_TYPE_NAMES.ROOT
                ],
              objectTypeId: rootType.id,
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
  }
}
