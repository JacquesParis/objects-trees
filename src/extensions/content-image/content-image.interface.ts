import {ObjectNode} from './../../models/object-node.model';
import {ObjectNodeTree} from './../../models/object-tree.model';

export interface Image extends ObjectNode {
  contentImage: {
    base64: string;
    size: string;
    name: string;
    type: string;
    id: string;
    uri: string;
  };
  imagePosition?: string;
  imageDate?: string;
}
export interface ImageTree extends ObjectNodeTree<Image> {
  treeNode: Image;
}

export interface ImageGallery extends ObjectNode {}
export interface ImageGalleryTree extends ObjectNodeTree<ImageGallery> {}
