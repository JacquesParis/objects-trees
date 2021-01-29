import {EntityName} from '../../../models/entity-name';
import {ObjectNode} from '../../../models/object-node.model';
import {ObjectTree} from '../../../models/object-tree.model';
import {CurrentContext} from '../../../services/application.service';
import {InsideRestService} from '../../../services/inside-rest/inside-rest.service';
import {UriCompleteService} from '../../../services/uri-complete/uri-complete.service';
import {AjaxResult} from './ajax-result';

export class GenericObjectComponent {
  protected ajaxResult: AjaxResult = new AjaxResult();
  public siteTree: ObjectTree;
  public siteNode: ObjectNode;
  public templateTree: ObjectTree;
  public templateNode: ObjectNode;
  public dataTree: ObjectTree;
  public dataNode: ObjectNode;
  public pageTree: ObjectTree;
  public pageNode: ObjectNode;
  public siteTemplateTree: ObjectTree;
  public siteTemplateNode: ObjectNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public ctrl: any;
  constructor(
    protected insideRestService: InsideRestService,
    protected uriCompleteService: UriCompleteService,
    protected ctx: CurrentContext,
  ) {}

  public async loadAjax(
    dataTree: ObjectTree,
    templateTree: ObjectTree,
  ): Promise<string> {
    const viewId =
      this.siteTree.id +
      '/view/ajax/' +
      this.pageNode.id +
      '/' +
      dataTree.id +
      '/' +
      templateTree.id;

    const loadedAjax = ((await this.insideRestService.read(
      this.uriCompleteService.getUri(EntityName.objectTree, viewId, this.ctx),
      this.ctx,
    )) as unknown) as AjaxResult;
    for (const scriptId of Object.keys(loadedAjax.headerScripts)) {
      this.ajaxResult.headerScripts[scriptId] =
        loadedAjax.headerScripts[scriptId];
    }
    for (const scriptId of Object.keys(loadedAjax.footerScripts)) {
      this.ajaxResult.footerScripts[scriptId] =
        loadedAjax.footerScripts[scriptId];
    }
    for (const cssId of Object.keys(loadedAjax.css)) {
      this.ajaxResult.css[cssId] = loadedAjax.css[cssId];
    }
    return loadedAjax.body;
  }

  public getPageHref(page: ObjectTree): string {
    const viewId =
      this.siteTree.id + '/view/html' + (page ? '/' + page.treeNode.id : '');
    return this.uriCompleteService.getUri(
      EntityName.objectTree,
      viewId,
      this.ctx,
    );
  }

  public getAdminHref(page: ObjectTree): string {
    return (
      '/admin/#/admin/owner/' +
      page.ownerType +
      '/' +
      page.ownerName +
      '/namespace/' +
      page.namespaceType +
      '/' +
      page.namespaceName
    );
  }

  public async getObjectNode(nodeId: string): Promise<ObjectNode> {
    return (await this.insideRestService.read(
      this.uriCompleteService.getUri(EntityName.objectNode, nodeId, this.ctx),
      this.ctx,
    )) as ObjectNode;
  }

  public async getObjectTree(treeId: string): Promise<ObjectTree> {
    return (await this.insideRestService.read(
      this.uriCompleteService.getUri(EntityName.objectTree, treeId, this.ctx),
      this.ctx,
    )) as ObjectTree;
  }

  public getImgSrc(controlValue: {
    base64?: string;
    type?: string;
    uri?: string;
  }): string {
    return controlValue?.base64 && controlValue.type
      ? 'data:' + controlValue.type + ';base64,' + controlValue.base64
      : (controlValue?.uri as string);
  }

  public getImgBackground(controlValue: {
    base64?: string;
    type?: string;
    uri?: string;
  }): string {
    return controlValue?.base64 && controlValue?.type
      ? "url('" +
          'data:' +
          controlValue.type +
          ';base64,' +
          controlValue.base64 +
          "')"
      : "url('" + controlValue?.uri + "')";
  }

  public getColSizes(
    minWidth: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    maxWith: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    breakSize: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    keepProportion = false,
  ) {
    const sizes = {
      xs: 576,
      sm: 768,
      md: 992,
      lg: 1200,
      xl: 1400,
    };
    const breakingSize =
      'none' === breakSize
        ? sizes.xs
        : Math.min(
            ...Object.values(sizes).filter((size) => size > sizes[breakSize]),
          );
    const returnedSizes: {
      xs?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    } = {};
    for (const size in sizes) {
      if (sizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] < breakingSize) {
        returnedSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] = 12;
      } else {
        returnedSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] = Math.round(
          minWidth +
            ((maxWith - minWidth) *
              (sizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] -
                breakingSize)) /
              (sizes.xl - breakingSize),
        );
        if (keepProportion) {
          returnedSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] =
            Math.round(
              (returnedSizes[
                size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'
              ] as number) / maxWith,
            ) * maxWith;
        }
      }
    }
    return returnedSizes;
  }

  getColClass(
    minWidth: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    maxWith: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    breakSize: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    keepProportion = false,
  ) {
    const colSizes = this.getColSizes(
      minWidth,
      maxWith,
      breakSize,
      keepProportion,
    );
    const returnedClasses = [];
    for (const size in colSizes) {
      returnedClasses.push(
        'col-' +
          size +
          '-' +
          colSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'],
      );
    }
    return returnedClasses.join(' ').replace('col-xs', 'col');
  }

  public getColFloatClass(
    minWidth: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    maxWith: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    breakSize: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    side = 'left',
    keepProportion = false,
  ) {
    const colSizes = this.getColSizes(
      minWidth,
      maxWith,
      breakSize,
      keepProportion,
    );
    const returnedClasses = [];
    for (const size in colSizes) {
      const sizeClass = 'xs' === size ? '' : '-' + size;
      returnedClasses.push(
        'col' +
          sizeClass +
          '-' +
          colSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] +
          (colSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] !== 12
            ? ' float' + sizeClass + '-' + side
            : ''),
      );
    }
    return returnedClasses.join(' ');
  }
}
