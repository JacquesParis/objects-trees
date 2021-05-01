import {service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {genSalt, hash} from 'bcryptjs';
import moment from 'moment';
import {ServerConfigService} from './../server-config/server-config.service';
import {CachedResultRepository} from './cached-result.repository';
export class CachedResultService {
  constructor(
    @repository(CachedResultRepository)
    private cachedResultRepository: CachedResultRepository,
    @service(ServerConfigService)
    private serverConfigService: ServerConfigService,
  ) {
    this.serverConfigService.registerNewConfigurationKey('cachedResultSalt', {
      type: 'string',
      title: 'Cached result secret',
    });
  }

  private async getHash(type: string, args: object): Promise<string> {
    return hash(
      type + JSON.stringify(args),
      await this.serverConfigService.get('cachedResultSalt', genSalt),
    );
  }

  public async getResult<T>(
    type: string,
    args: object,
    defaultResult: () => Promise<T>,
    validity: moment.Duration = moment.duration(1, 'month'),
  ): Promise<T> {
    const hashedArgs: string = await this.getHash(type, args);
    const id: string = type + ':' + hashedArgs;
    let cachedResult: T = (undefined as unknown) as T;
    try {
      const cachedResultObj = await this.cachedResultRepository.findById(id);
      if (cachedResultObj) {
        cachedResult = cachedResultObj.value;
      }
      // eslint-disable-next-line no-empty
    } catch (error) {}
    if (!cachedResult) {
      cachedResult = await defaultResult();
      const validityDate: moment.Moment = moment();
      validityDate.add(validity);
      await this.cachedResultRepository.create({
        id,
        type,
        hash: hashedArgs,
        args,
        value: cachedResult,
        endValidity: validityDate.toISOString(),
      });
    }
    return cachedResult;
  }
}
