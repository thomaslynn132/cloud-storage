import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { createReadStream } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createHash } from 'crypto';

@Injectable()
export class HashService {
  private readonly logger = new Logger(HashService.name);

  calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  calculateHashFromStream(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  generateStorageKey(userId: string, fileName: string, hash: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${userId}/${timestamp}-${random}-${fileName}`;
  }
}
