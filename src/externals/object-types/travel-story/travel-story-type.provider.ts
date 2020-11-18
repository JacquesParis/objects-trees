import {ObjectTreesApplicationInterface} from '../../../application';
import {ObjectTypeProvider} from './../../../integration/object-types/object-type.provider';
import {
  TENANT_TRAVEL_STORY_SUBTYPE,
  TRAVEL_STORY_DATE_TYPE,
  TRAVEL_STORY_GALLERY_TYPE,
  TRAVEL_STORY_MENU_TYPE,
  TRAVEL_STORY_NAME,
  TRAVEL_STORY_POST_TRAVEL_STORY_DATE_SUBTYPE,
  TRAVEL_STORY_POST_TRAVEL_STORY_MENU_SUBTYPE,
  TRAVEL_STORY_POST_TRAVEL_STORY_TEXT_SUBTYPE,
  TRAVEL_STORY_POST_TYPE,
  TRAVEL_STORY_TEXT_TYPE,
  TRAVEL_STORY_TRAVEL_STORY_POST_SUBTYPE,
  TRAVEL_STORY_TYPE,
} from './travel-story-type.const';

export class TravelStoryTypeProvider extends ObjectTypeProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(TRAVEL_STORY_NAME, app);
    this.objectTypes.types.travelStoryType = TRAVEL_STORY_TYPE;
    this.objectTypes.types.travelStoryPostType = TRAVEL_STORY_POST_TYPE;
    this.objectTypes.types.travelStoryTextType = TRAVEL_STORY_TEXT_TYPE;
    this.objectTypes.types.travelStoryGalleryType = TRAVEL_STORY_GALLERY_TYPE;
    this.objectTypes.types.travelStoryMenuType = TRAVEL_STORY_MENU_TYPE;
    this.objectTypes.types.travelStoryDateType = TRAVEL_STORY_DATE_TYPE;
    this.objectTypes.subTypes = [
      TENANT_TRAVEL_STORY_SUBTYPE,
      TRAVEL_STORY_TRAVEL_STORY_POST_SUBTYPE,
      TRAVEL_STORY_POST_TRAVEL_STORY_TEXT_SUBTYPE,
      TRAVEL_STORY_POST_TRAVEL_STORY_DATE_SUBTYPE,
      TRAVEL_STORY_POST_TRAVEL_STORY_MENU_SUBTYPE,
      TRAVEL_STORY_POST_TRAVEL_STORY_MENU_SUBTYPE,
    ];
  }
}
