export class AjaxResult {
  public headerScripts: {[scriptId: string]: string} = {};
  public footerScripts: {[scriptId: string]: string} = {};
  public css: {[cssId: string]: string} = {};
  public body = '';
  public headerScriptsArray() {
    return Object.values(this.headerScripts);
  }
  public footerScriptsArray() {
    return Object.values(this.footerScripts);
  }
  public cssArray() {
    return Object.values(this.css);
  }
  public hasHeaderScripts(): boolean {
    return 0 < Object.keys(this.headerScripts).length;
  }
  public hasFooterScripts(): boolean {
    return 0 < Object.keys(this.footerScripts).length;
  }
  public hasCss(): boolean {
    return 0 < Object.keys(this.css).length;
  }
}
