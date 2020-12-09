import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {TransientWebSiteService} from './transient-web-site.service';
import {
  CALENDAR_ENTRY_TYPE,
  CATEGORY_MENU_TEMPLATE_SUBTYPE,
  CATEGORY_PAGE_TEMPLATE_SUBTYPE,
  MENU_ENTRY_TYPE,
  MENU_TEMPLATE_TYPE,
  PAGE_TEMPLATE_TYPE,
  PAGE_TYPE,
  TEMPLATE_VIEW_TYPE,
  WEB_SITE_NAME,
  WEB_SITE_TEMPLATE_TYPE,
  WEB_SITE_VIEW_TYPE,
  WEB_SITE_VIEW_WELCOME_PAGE_SUBTYPE,
  WEB_SITE_VIEW_WITH_MENU_TYPE,
  WEB_SITE_WITH_MENU_TEMPLATE_TYPE,
  WELCOME_PAGE_TYPE,
} from './web-site-type.const';

export class WebSiteTypeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(WEB_SITE_NAME, app);
    this.objectTypes.templateViewType = TEMPLATE_VIEW_TYPE;
    this.objectTypes.WebSiteTemplate = WEB_SITE_TEMPLATE_TYPE;
    this.objectTypes.WebSiteWitHMenuTemplate = WEB_SITE_WITH_MENU_TEMPLATE_TYPE;
    this.objectTypes.webSiteView = WEB_SITE_VIEW_TYPE;
    this.objectTypes.webSiteViewWithMenu = WEB_SITE_VIEW_WITH_MENU_TYPE;
    this.objectTypes.menuTemplate = MENU_TEMPLATE_TYPE;
    this.objectTypes.pageTemplate = PAGE_TEMPLATE_TYPE;
    this.objectTypes.page = PAGE_TYPE;
    this.objectTypes.welcomePage = WELCOME_PAGE_TYPE;
    this.objectTypes.calendarEntry = CALENDAR_ENTRY_TYPE;
    this.objectTypes.menuEntry = MENU_ENTRY_TYPE;
    this.objectSubTypes.push(CATEGORY_MENU_TEMPLATE_SUBTYPE);
    this.objectSubTypes.push(WEB_SITE_VIEW_WELCOME_PAGE_SUBTYPE);
    this.objectSubTypes.push(CATEGORY_PAGE_TEMPLATE_SUBTYPE);

    this.services.push({cls: TransientWebSiteService});

    this.objectTrees.navBar = {
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'navBar',
      treeNodeTypeId: MENU_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          template: `<nav class="navbar navbar-expand-lg navbar-light bg-light">
          <a class="navbar-brand" href="#">{{dataNode.menuTitle}}</a>
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav mr-auto">
              <li class="nav-item active">
                <a class="nav-link" href="#">Home <span class="sr-only">(current)</span></a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">Link</a>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Dropdown
                </a>
                <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <a class="dropdown-item" href="#">Action</a>
                  <a class="dropdown-item" href="#">Another action</a>
                  <div class="dropdown-divider"></div>
                  <a class="dropdown-item" href="#">Something else here</a>
                </div>
              </li>
              <li class="nav-item">
                <a class="nav-link disabled" href="#" tabindex="-1" aria-disabled="true">Disabled</a>
              </li>
            </ul>
            <form class="form-inline my-2 my-lg-0">
              <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
              <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
            </form>
          </div>
        </nav>`,
        },
        children: {},
      },
    };

    this.objectTrees.pageCard = {
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'card',
      treeNodeTypeId: PAGE_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          template: `
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">{{dataNode.pageTitle}}</h5>
              <p class="card-text">{{dataNode.contentText}}</p>
            </div>
          </div>`,
        },
        children: {},
      },
    };
  }
}
