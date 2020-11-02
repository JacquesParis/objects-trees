import {inject, service} from '@loopback/core';
import {
  get,
  HttpErrors,
  oas,
  param,
  Response,
  RestBindings,
} from '@loopback/rest';
import {ObjectNodeContentService} from '../services/object-node-content.service';

/**
 * A controller to handle file uploads using multipart/form-data media type
 */
export class ObjectNodeContentController {
  constructor(
    @service(ObjectNodeContentService)
    public objectNodeContentService: ObjectNodeContentService,
    @inject(RestBindings.Http.REQUEST) private request: never,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
  ) {}

  @get('/object-nodes/{id}/content-{contentType}/{contentId}')
  @oas.response.file()
  async downloadFile(
    @param.path.string('id') id: string,
    @param.path.string('contentType') contentType: string,
    @param.path.string('contentId') contentId: string,
  ): Promise<Response> {
    switch (contentType) {
      case 'file':
        // eslint-disable-next-line no-case-declarations
        const file: {
          filePath: string;
          fileName: string;
        } = (await this.objectNodeContentService.getContent(
          id,
          'contentFile',
          'ContentFile',
          {
            contentId: contentId,
          },
        )) as {
          filePath: string;
          fileName: string;
        };
        this.response.download(file.filePath, file.fileName);
        return this.response;
      case 'text':
        // eslint-disable-next-line no-case-declarations
        const text = (await this.objectNodeContentService.getContent(
          id,
          'contentText',
          'ContentText',
          {
            contentId: contentId,
          },
        )) as string;
        this.response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        this.response.write(text);
        this.response.end();
        return this.response;
    }
    throw new HttpErrors.NotFound('unknown content type' + contentType);
  }
}
