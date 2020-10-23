import {inject, service} from '@loopback/core';
import {get, oas, param, post, Response, RestBindings} from '@loopback/rest';
import {ObjectNode} from './../models/object-node.model';
import {FileUploadService} from './../services/file-upload.service';
import {ObjectNodeService} from './../services/object-node.service';

/**
 * A controller to handle file uploads using multipart/form-data media type
 */
export class FileUploadController {
  constructor(
    @service(ObjectNodeService)
    public objectNodeService: ObjectNodeService,
    @service(FileUploadService) public fileUploadService: FileUploadService,
    @inject(RestBindings.Http.REQUEST) private request: never,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
  ) {}

  @post('/object-nodes/multipart', {
    responses: {
      200: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
        description: 'Files and fields',
      },
    },
  })
  async fileUpload(): Promise<ObjectNode> {
    const filesAndFields = await this.fileUploadService.getFilesAndFields(
      this.request,
      this.response as never,
    );

    const result = await this.objectNodeService.add(
      filesAndFields.fields,
      false,
      filesAndFields.files,
    );
    return result;
  }

  @get('/object-nodes/{id}/contentFile/{filename}')
  @oas.response.file()
  async downloadFile(
    @param.path.string('id') id: string,
    @param.path.string('filename') fileName: string,
  ): Promise<Response> {
    const file: {
      filePath: string;
      fileName: string;
    } = await this.objectNodeService.getContent(id, 'contentFile', {
      filename: fileName,
    });
    this.response.download(file.filePath, file.fileName);
    return this.response;
  }
}
