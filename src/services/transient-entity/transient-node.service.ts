import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {EntityName} from '../../models';
import {ObjectNode} from '../../models/object-node.model';
import {CurrentContext} from '../application.service';
import {TreatmentDescription} from './../../integration/extension-description';
import {ContentEntityService} from './../content-entity/content-entity.service';
import {ObjectTypeService} from './../object-type.service';
import {TRANSIENT_ENTITY_PROVIDER} from './transient-entity.const';
import {
  TransientEntityInterface,
  TransientEntityService,
} from './transient-entity.service';
export class TransientNodeService implements TransientEntityInterface {
  public providerId: string = TRANSIENT_ENTITY_PROVIDER;
  serviceId: string = TransientNodeService.name;
  description = this.getPostTraitmentDescription.bind(this);
  constructor(
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(ContentEntityService)
    private contentEntityService: ContentEntityService,
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
  ) {
    this.transientEntityService.registerTransientEntityService(
      EntityName.objectNode,
      this,
    );
  }
  getPostTraitmentDescription(): TreatmentDescription {
    const treatment: TreatmentDescription = new TreatmentDescription(
      TRANSIENT_ENTITY_PROVIDER,
      TransientNodeService.name,
      'objectNode: Add Node Content Data',
    );
    treatment.subTreatments.push(
      ...this.contentEntityService.getPostTraitmentDescription(),
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
  }
}
