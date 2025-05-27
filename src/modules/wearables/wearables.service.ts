import { Injectable } from '@nestjs/common';
import metadata from './metadata.json';

@Injectable()
export class WearablesService {
  async getMetadataById(id: string): Promise<any> {
    return metadata[id] || null;
  }
}
