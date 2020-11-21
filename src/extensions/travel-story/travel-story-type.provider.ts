/* eslint-disable @typescript-eslint/no-unused-vars */
import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {
  CATEGORY_TRAVEL_STORY_TEMPLATE_SUBTYPE,
  TENANT_TRAVEL_STORY_SUBTYPE,
  TRAVEL_STORY_NAME,
  TRAVEL_STORY_POST_TYPE,
  TRAVEL_STORY_TEMPLATE_TYPE,
  TRAVEL_STORY_TRAVEL_STORY_POST_SUBTYPE,
  TRAVEL_STORY_TYPE,
} from './travel-story-type.const';

export class TravelStoryTypeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(TRAVEL_STORY_NAME, app);
    this.objectTypes.types.travelStoryType = TRAVEL_STORY_TYPE;
    this.objectTypes.types.travelStoryPostType = TRAVEL_STORY_POST_TYPE;
    this.objectTypes.subTypes = [
      TENANT_TRAVEL_STORY_SUBTYPE,
      TRAVEL_STORY_TRAVEL_STORY_POST_SUBTYPE,
      CATEGORY_TRAVEL_STORY_TEMPLATE_SUBTYPE,
    ];
    this.objectTypes.types.travelStoryTemplate = TRAVEL_STORY_TEMPLATE_TYPE;
    this.objectTrees.travelStory = {
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'travelStory',
      treeNodeTypeId: TRAVEL_STORY_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {},
        children: {},
      },
    };
  }
}
