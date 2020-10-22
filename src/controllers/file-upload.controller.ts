/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject} from '@loopback/core';
import {post, requestBody, RestBindings} from '@loopback/rest';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {FileUploadHandler} from '../types';

/**
 * A controller to handle file uploads using multipart/form-data media type
 */
export class FileUploadController {
  /**
   * Constructor
   * @param handler - Inject an express request handler to deal with the request
   */
  constructor(
    @inject(FILE_UPLOAD_SERVICE) private handler: FileUploadHandler,
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
  async fileUpload(
    @requestBody.file()
    request: unknown,
    @inject(RestBindings.Http.RESPONSE) response: any,
  ): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      this.handler(request as never, response as never, (err: unknown) => {
        if (err) reject(err);
        else {
          resolve(FileUploadController.getFilesAndFields(request as never));
        }
      });
    });
  }

  /**
   * Get files and fields for the request
   * @param request - Http request
   */
  private static getFilesAndFields(request: Request) {
    const uploadedFiles = (request as any).files;
    const mapper = (f: globalThis.Express.Multer.File) => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      encoding: f.encoding,
      mimetype: f.mimetype,
      size: f.size,
    });
    let files: object[] = [];
    if (Array.isArray(uploadedFiles)) {
      files = uploadedFiles.map(mapper);
    } else {
      for (const filename in uploadedFiles) {
        files.push(...uploadedFiles[filename].map(mapper));
      }
    }
    return {files, fields: request.body};
  }
}
