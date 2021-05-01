import {IMethodValuesResult} from '@jacquesparis/objects-model';
import {isString} from 'lodash';

export class ValueResult<T> implements IMethodValuesResult {
  public displayedResult: string;
  constructor(public jsonResult: T, displayedResult?: string) {
    if (undefined === displayedResult) {
      this.displayedResult = this.buildDisplayedValue(jsonResult);
    } else {
      this.displayedResult = displayedResult;
    }
  }

  protected buildDisplayedValue(jsonResult: T): string {
    return JSON.stringify(jsonResult);
  }

  protected getDisplayedLine(text: string): string {
    return `<div class="methodResultLine">${text}</div>
    `;
  }
  protected getDisplayedKeyValue(key: string, value: unknown): string {
    const displayedValue =
      undefined === value
        ? 'undefined'
        : isString(value)
        ? value
        : JSON.stringify(value);
    return `<span class="methodParamLabel">${key}</span> : <span class="methodParamLabel">${displayedValue}</span>`;
  }
}

export class MethodValueSimpleJsonResult {
  [key: string]: unknown;
}

export class SimpleMethodValueResult<T extends MethodValueSimpleJsonResult>
  extends ValueResult<T>
  implements IMethodValuesResult {
  constructor(public jsonResult: T) {
    super(jsonResult);
  }

  protected buildDisplayedValue(jsonResult: T): string {
    return Object.keys(jsonResult)
      .map((key) =>
        this.getDisplayedLine(this.getDisplayedKeyValue(key, jsonResult[key])),
      )
      .join('\n');
  }
}
