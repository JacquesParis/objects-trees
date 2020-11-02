import {Component, service} from '@loopback/core';
import {ContentTextService} from './services';
import {ContentFileService} from './services/content-file.service';

export class BootComponent implements Component {
  constructor(
    @service(ContentFileService) contentFileService: ContentFileService,
    @service(ContentTextService) contentTextService: ContentTextService,
  ) {}
}
