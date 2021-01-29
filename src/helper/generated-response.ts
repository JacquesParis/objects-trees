import {Response} from '@loopback/rest';

export abstract class GeneratedResponse {
  public abstract getResponse(response: Response): Response;
}

export class FileGeneratedResponse extends GeneratedResponse {
  constructor(public filePath: string, public fileName: string) {
    super();
  }
  getResponse(response: Response): Response {
    response.download(this.filePath, this.fileName);
    return response;
  }
}

export class Base64GeneratedResponse extends GeneratedResponse {
  constructor(
    public name: string,
    public base64: string,
    public type?: string,
  ) {
    super();
  }

  getResponse(response: Response): Response {
    response.header(
      'Content-Disposition',
      'attachment; filename="' + this.name + '"',
    );
    if (this.type) {
      response.type(this.type);
    }
    response.send(Buffer.from(this.base64, 'base64'));
    return response;
  }
}

export class JsonGeneratedResponse<T> extends GeneratedResponse {
  constructor(public json: T) {
    super();
  }
  getResponse(response: Response): Response {
    response.json(this.json);
    return response;
  }
}

export class BodyGeneratedResponse extends GeneratedResponse {
  constructor(public response: string, public contentType?: string) {
    super();
  }
  getResponse(response: Response): Response {
    if (this.contentType && '' !== this.contentType) {
      response.set('Content-Type', this.contentType);
    } else {
      response.set('Content-Type', 'text/html');
    }
    response.send(this.response);
    return response;
  }
}

export class TextGeneratedResponse extends BodyGeneratedResponse {
  constructor(public response: string) {
    super(response, 'text/plain');
  }
}

export class HtmlGeneratedResponse extends BodyGeneratedResponse {
  constructor(public response: string) {
    super(response, 'text/html');
  }
}
