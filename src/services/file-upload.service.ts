/* eslint-disable @typescript-eslint/no-explicit-any */
import {bind, BindingScope} from '@loopback/core';
import {RequestHandler} from 'express-serve-static-core';
import * as _ from 'lodash';
import multer from 'multer';

export class MemoryFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * A provider to return an `Express` request handler from `multer` middleware
 */
@bind({
  scope: BindingScope.TRANSIENT,
})
export class FileUploadService {
  public memoryStorage: multer.StorageEngine;
  public diskStorage: multer.StorageEngine;
  protected multer: multer.Multer;

  constructor() {
    this.memoryStorage = multer.memoryStorage();
    /*
    const destination = path.join(__dirname, '../.sandbox');
    this.diskStorage = multer.diskStorage({
      destination,
      // Use the original file name as is
      filename: (req, file, cb) => {
        file.filename =
          Math.ceil(Math.random() * 100000000000000000) +
          '.' +
          file.originalname;
        cb(null, file.filename);
      },
    });*/
    this.multer = multer({storage: this.memoryStorage});
  }

  private get filesHangler(): RequestHandler {
    return this.multer.any();
  }

  public getFilesAndFields(
    request: never,
    response: never,
  ): Promise<{
    files: MemoryFile[];
    fields: {};
  }> {
    return new Promise((resolve, reject) => {
      this.filesHangler(request, response, (err: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.extractFilesAndFields(request));
        }
      });
    });
  }

  private extractFilesAndFields(
    request: any,
  ): {
    files: MemoryFile[];
    fields: {};
  } {
    const uploadedFiles = request.files;
    const mapper = (f: globalThis.Express.Multer.File) => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      encoding: f.encoding,
      mimetype: f.mimetype,
      size: f.size,
      buffer: f.buffer,
    });
    let files: MemoryFile[] = [];
    if (Array.isArray(uploadedFiles)) {
      files = uploadedFiles.map(mapper);
    } else {
      for (const filename in uploadedFiles) {
        files.push(...uploadedFiles[filename].map(mapper));
      }
    }
    let fields = {};
    for (const key in request.body) {
      let value = undefined;
      try {
        value = JSON.parse((request.body as any)[key]);
      } catch (error) {
        value = undefined;
      }
      const subObkect = key
        .split('.')
        .reverse()
        .reduce((obj, subkey) => {
          return {[subkey]: obj};
        }, value);
      fields = _.merge(fields, subObkect);
    }
    return {files, fields: fields};
  }
}
